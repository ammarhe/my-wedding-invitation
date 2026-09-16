import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { PORT, UPLOAD_DIR, CLIENT_DIST, MAX_IMAGE_MB, MAX_AUDIO_MB } from './config.js'
import { getContent, saveContent, resetContent, wishes, stats } from './db.js'
import { login, logout, me, requireAdmin } from './auth.js'

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

// ---------------------------------------------------------------- uploads
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 8) || ''
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})
const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)),
})
const audioUpload = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(null, /^audio\/(mpeg|mp3|mp4|aac|ogg|wav|x-wav|webm|x-m4a|m4a)$/.test(file.mimetype)),
})

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, fallthrough: true }),
)

// ---------------------------------------------------------------- public API
app.get('/api/content', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(getContent())
})

app.get('/api/wishes', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(wishes.listPublic())
})

// Basic per-IP throttle for guestbook posts: 5 per 10 minutes.
const wishPosts = new Map()
app.post('/api/wishes', (req, res) => {
  const now = Date.now()
  const arr = (wishPosts.get(req.ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  if (arr.length >= 5) return res.status(429).json({ error: 'Too many messages, please wait a bit.' })

  const name = String(req.body?.name ?? '').trim().slice(0, 80)
  const message = String(req.body?.message ?? '').trim().slice(0, 600)
  if (!name || !message) return res.status(400).json({ error: 'Name and message are required.' })

  const content = getContent()
  if (!content.guestbook?.enabled) return res.status(403).json({ error: 'Guestbook is closed.' })
  const approved = !content.guestbook.requireApproval

  arr.push(now)
  wishPosts.set(req.ip, arr)
  const wish = wishes.add(name, message, approved, req.ip)
  res.status(201).json({ ...wish, pending: !approved })
})

app.post('/api/visit', (req, res) => {
  const guest = req.body?.guest ? String(req.body.guest).slice(0, 80) : null
  stats.recordVisit(guest, req.get('user-agent')?.slice(0, 200))
  res.json({ ok: true })
})

// ---------------------------------------------------------------- auth
app.post('/api/auth/login', login)
app.post('/api/auth/logout', logout)
app.get('/api/auth/me', me)

// ---------------------------------------------------------------- admin API
const admin = express.Router()
admin.use(requireAdmin)

admin.put('/content', (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid body' })
  res.json(saveContent(req.body))
})
admin.post('/content/reset', (_req, res) => res.json(resetContent()))

admin.get('/wishes', (_req, res) => res.json(wishes.listAll()))
admin.delete('/wishes/:id', (req, res) => {
  const ok = wishes.remove(Number(req.params.id))
  res.status(ok ? 200 : 404).json({ ok })
})
admin.patch('/wishes/:id', (req, res) => {
  const ok = wishes.setApproved(Number(req.params.id), !!req.body?.approved)
  res.status(ok ? 200 : 404).json({ ok })
})

admin.get('/stats', (_req, res) => res.json(stats.summary()))

admin.post('/upload/image', imageUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image received (jpeg/png/webp/gif/avif).' })
  res.json({ url: `/uploads/${req.file.filename}`, size: req.file.size })
})
admin.post('/upload/audio', audioUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio received (mp3/m4a/aac/ogg/wav).' })
  res.json({ url: `/uploads/${req.file.filename}`, size: req.file.size, name: req.file.originalname })
})
admin.get('/uploads', (_req, res) => {
  const files = fs
    .readdirSync(UPLOAD_DIR)
    .map((f) => {
      const st = fs.statSync(path.join(UPLOAD_DIR, f))
      return { url: `/uploads/${f}`, name: f, size: st.size, mtime: st.mtimeMs }
    })
    .sort((a, b) => b.mtime - a.mtime)
  res.json(files)
})
admin.delete('/uploads/:name', (req, res) => {
  const name = path.basename(req.params.name)
  const target = path.join(UPLOAD_DIR, name)
  if (!fs.existsSync(target)) return res.status(404).json({ ok: false })
  fs.unlinkSync(target)
  res.json({ ok: true })
})

app.use('/api/admin', admin)

// Multer / JSON errors -> readable messages
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

// ---------------------------------------------------------------- static client (production)
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }))
  // Re-read index.html whenever the build changes, so a rebuild doesn't need a server restart.
  const indexPath = path.join(CLIENT_DIST, 'index.html')
  let indexCache = { mtime: 0, html: '' }
  const getIndexHtml = () => {
    const mtime = fs.statSync(indexPath).mtimeMs
    if (mtime !== indexCache.mtime) indexCache = { mtime, html: fs.readFileSync(indexPath, 'utf8') }
    return indexCache.html
  }
  // Inject Open Graph tags from the live content so shared links show the couple's names.
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
    const c = getContent()
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
    const origin = `${req.protocol}://${req.get('host')}`
    const image = c.header?.photo?.startsWith('http') ? c.header.photo : origin + (c.header?.photo || '/theme/photo.webp')
    const html = getIndexHtml()
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(c.meta.title)}</title>`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(c.meta.title)}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(c.meta.description)}"`)
      .replace('</head>', `<meta property="og:image" content="${esc(image)}" /><meta property="og:url" content="${esc(origin + req.path)}" /></head>`)
    res.set('Cache-Control', 'no-store').type('html').send(html)
  })
} else {
  app.get('/', (_req, res) =>
    res.type('text').send('API is running. Build the client (npm run build) to serve the invitation from here.'),
  )
}

// Only listen when running as a standalone server (not as a Netlify Function).
if (!process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`Wedding invitation server listening on http://localhost:${PORT}`)
    console.log(`Uploads: ${UPLOAD_DIR}`)
    console.log(fs.existsSync(CLIENT_DIST) ? `Serving client from ${CLIENT_DIST}` : 'Client build not found (dev mode: run vite separately)')
  })
}
