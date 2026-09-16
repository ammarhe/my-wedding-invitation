import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import path from 'node:path'
import crypto from 'node:crypto'
import { MAX_IMAGE_MB, MAX_AUDIO_MB } from './config.js'
import { login, logout, me, requireAdmin } from './auth.js'

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/**
 * Builds the API app. `store` is a storage back-end from ./store (sqlite or blobs).
 * Static client serving is added separately by index.js (Netlify serves it as static files).
 */
export function createApp(store) {
  const app = express()
  app.set('trust proxy', true)
  app.disable('x-powered-by')
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  // -------------------------------------------------------------- uploads
  const memory = multer.memoryStorage()
  const fileName = (original) => {
    const ext = path.extname(original || '').toLowerCase().slice(0, 8) || ''
    return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  }
  const imageUpload = multer({
    storage: memory,
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)),
  })
  const audioUpload = multer({
    storage: memory,
    limits: { fileSize: MAX_AUDIO_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, /^audio\/(mpeg|mp3|mp4|aac|ogg|wav|x-wav|webm|x-m4a|m4a)$/.test(file.mimetype)),
  })
  const fontUpload = multer({
    storage: memory,
    limits: { fileSize: 4 * 1024 * 1024 },
    // Browsers pick the format from @font-face, not the mime type, so match on the file name.
    fileFilter: (_req, file, cb) => cb(null, /\.(woff2?|ttf|otf)$/i.test(file.originalname || '')),
  })

  if (store.files.staticDir) {
    app.use('/uploads', express.static(store.files.staticDir, { maxAge: '30d', immutable: true, fallthrough: true }))
  }
  app.get(
    '/uploads/:name',
    wrap(async (req, res) => {
      const file = await store.files.get(path.basename(req.params.name))
      if (!file) return res.status(404).end()
      res.set('Cache-Control', 'public, max-age=2592000, immutable').type(file.mime).send(file.buffer)
    }),
  )

  // -------------------------------------------------------------- public API
  app.get(
    '/api/content',
    wrap(async (_req, res) => {
      res.set('Cache-Control', 'no-store').json(await store.getContent())
    }),
  )

  app.get(
    '/api/wishes',
    wrap(async (_req, res) => {
      res.set('Cache-Control', 'no-store').json(await store.wishes.listPublic())
    }),
  )

  // Basic per-IP throttle for guestbook posts: 5 per 10 minutes (per server instance).
  const wishPosts = new Map()
  app.post(
    '/api/wishes',
    wrap(async (req, res) => {
      const now = Date.now()
      const arr = (wishPosts.get(req.ip) || []).filter((t) => now - t < 10 * 60 * 1000)
      if (arr.length >= 5) return res.status(429).json({ error: 'Too many messages, please wait a bit.' })

      const name = String(req.body?.name ?? '').trim().slice(0, 80)
      const message = String(req.body?.message ?? '').trim().slice(0, 600)
      if (!name || !message) return res.status(400).json({ error: 'Name and message are required.' })

      const content = await store.getContent()
      if (!content.guestbook?.enabled) return res.status(403).json({ error: 'Guestbook is closed.' })
      const approved = !content.guestbook.requireApproval

      arr.push(now)
      wishPosts.set(req.ip, arr)
      const wish = await store.wishes.add(name, message, approved, req.ip)
      res.status(201).json({ ...wish, pending: !approved })
    }),
  )

  app.post(
    '/api/visit',
    wrap(async (req, res) => {
      const guest = req.body?.guest ? String(req.body.guest).slice(0, 80) : null
      await store.stats.recordVisit(guest, req.get('user-agent')?.slice(0, 200))
      res.json({ ok: true })
    }),
  )

  app.get('/api/health', (_req, res) => res.json({ ok: true, storage: store.kind }))

  // -------------------------------------------------------------- auth
  app.post('/api/auth/login', login)
  app.post('/api/auth/logout', logout)
  app.get('/api/auth/me', me)

  // -------------------------------------------------------------- admin API
  const admin = express.Router()
  admin.use(requireAdmin)

  admin.put(
    '/content',
    wrap(async (req, res) => {
      if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid body' })
      res.json(await store.saveContent(req.body))
    }),
  )
  admin.post('/content/reset', wrap(async (_req, res) => res.json(await store.resetContent())))

  admin.get('/wishes', wrap(async (_req, res) => res.json(await store.wishes.listAll())))
  admin.delete(
    '/wishes/:id',
    wrap(async (req, res) => {
      const ok = await store.wishes.remove(Number(req.params.id))
      res.status(ok ? 200 : 404).json({ ok })
    }),
  )
  admin.patch(
    '/wishes/:id',
    wrap(async (req, res) => {
      const ok = await store.wishes.setApproved(Number(req.params.id), !!req.body?.approved)
      res.status(ok ? 200 : 404).json({ ok })
    }),
  )

  admin.get('/stats', wrap(async (_req, res) => res.json(await store.stats.summary())))

  admin.post(
    '/upload/image',
    imageUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No image received (jpeg/png/webp/gif/avif).' })
      const saved = await store.files.save(fileName(req.file.originalname), req.file.buffer, req.file.mimetype)
      res.json({ url: saved.url, size: saved.size })
    }),
  )
  admin.post(
    '/upload/audio',
    audioUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No audio received (mp3/m4a/aac/ogg/wav).' })
      const saved = await store.files.save(fileName(req.file.originalname), req.file.buffer, req.file.mimetype)
      res.json({ url: saved.url, size: saved.size, name: req.file.originalname })
    }),
  )
  admin.post(
    '/upload/font',
    fontUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No font received (woff2/woff/ttf/otf).' })
      const saved = await store.files.save(fileName(req.file.originalname), req.file.buffer, req.file.mimetype)
      res.json({ url: saved.url, size: saved.size, name: req.file.originalname })
    }),
  )
  admin.get('/uploads', wrap(async (_req, res) => res.json(await store.files.list())))
  admin.delete(
    '/uploads/:name',
    wrap(async (req, res) => {
      const ok = await store.files.remove(path.basename(req.params.name))
      res.status(ok ? 200 : 404).json({ ok })
    }),
  )

  app.use('/api/admin', admin)
  app.all('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }))

  // Multer / JSON errors -> readable messages
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message })
    }
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' })
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  })

  return app
}
