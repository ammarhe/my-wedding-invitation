// Node entry point (local / VPS / Docker): API + built client on one port.
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { PORT, CLIENT_DIST } from './config.js'
import { createStore } from './store/index.js'
import { createApp } from './app.js'

const store = await createStore()
const app = createApp(store)

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
  app.get('*', async (req, res, next) => {
    try {
      const c = await store.getContent()
      const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
      const origin = `${req.protocol}://${req.get('host')}`
      const image = c.header?.photo?.startsWith('http') ? c.header.photo : origin + (c.header?.photo || '/theme/photo.webp')
      const html = getIndexHtml()
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(c.meta.title)}</title>`)
        .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(c.meta.title)}"`)
        .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(c.meta.description)}"`)
        .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${esc(image)}"`)
        .replace('</head>', `<meta property="og:url" content="${esc(origin + req.path)}" /></head>`)
      res.set('Cache-Control', 'no-store').type('html').send(html)
    } catch (e) {
      next(e)
    }
  })
} else {
  app.get('/', (_req, res) =>
    res.type('text').send('API is running. Build the client (npm run build) to serve the invitation from here.'),
  )
}

app.listen(PORT, () => {
  console.log(`Wedding invitation server listening on http://localhost:${PORT}  (storage: ${store.kind})`)
  console.log(fs.existsSync(CLIENT_DIST) ? `Serving client from ${CLIENT_DIST}` : 'Client build not found (dev mode: run vite separately)')
})
