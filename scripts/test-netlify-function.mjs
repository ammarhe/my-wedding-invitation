// Exercises netlify/functions/api.mjs locally against a local Netlify Blobs server.
// Usage: node scripts/test-netlify-function.mjs
import { BlobsServer } from '@netlify/blobs/server'
import { setEnvironmentContext } from '@netlify/blobs'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blobs-'))
const server = new BlobsServer({ directory: dir, port: 8971, token: 'test-token' })
await server.start()
setEnvironmentContext({ edgeURL: 'http://localhost:8971', siteID: 'test-site', token: 'test-token' })
process.env.ADMIN_PASSWORD = 'pw'
process.env.SESSION_SECRET = 'secret'
// Shape Netlify attaches to Lambda-style events (see connectLambda in @netlify/blobs)
const BLOBS_EVENT_DATA = Buffer.from(JSON.stringify({ url: 'http://localhost:8971', token: 'test-token' })).toString('base64')

const { handler } = await import('../netlify/functions/api.mjs')

let cookie = ''
async function call(method, urlPath, body, extraHeaders = {}) {
  const isForm = body instanceof FormData
  let bodyStr = body
  const headers = { host: 'example.netlify.app', 'x-nf-site-id': 'test-site', ...extraHeaders }
  if (cookie) headers.cookie = cookie
  let isBase64Encoded = false
  if (isForm) {
    const res = new Response(body)
    headers['content-type'] = res.headers.get('content-type')
    bodyStr = Buffer.from(await res.arrayBuffer()).toString('base64')
    isBase64Encoded = true
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json'
    bodyStr = JSON.stringify(body)
  }
  const event = {
    httpMethod: method,
    // simulate Netlify's rewrite: function path + splat
    path: `/.netlify/functions/api${urlPath}`,
    rawUrl: `https://example.netlify.app${urlPath}`,
    headers,
    multiValueHeaders: {},
    queryStringParameters: {},
    body: bodyStr ?? null,
    isBase64Encoded,
    blobs: BLOBS_EVENT_DATA,
  }
  const res = await handler(event, {})
  const setCookie = res.multiValueHeaders?.['set-cookie']?.[0] || res.headers?.['set-cookie']
  if (setCookie) cookie = setCookie.split(';')[0]
  const text = res.isBase64Encoded ? `<binary ${Buffer.from(res.body, 'base64').length} bytes>` : res.body
  console.log(`${method} ${urlPath} -> ${res.statusCode} ${text.slice(0, 110)}`)
  return res
}

const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAILED:', msg)
    process.exit(1)
  }
}

let r
r = await call('GET', '/api/health')
assert(r.statusCode === 200 && r.body.includes('blobs'), 'health/blobs')
r = await call('GET', '/api/content')
assert(r.statusCode === 200 && JSON.parse(r.body).groom.shortName === 'عمار الحللي', 'content seeded')
r = await call('POST', '/api/wishes', { name: 'Test', message: 'مبروك' })
assert(r.statusCode === 201, 'wish created')
r = await call('GET', '/api/wishes')
assert(JSON.parse(r.body).length === 1, 'wish listed')
r = await call('GET', '/api/admin/stats')
assert(r.statusCode === 401, 'admin requires login')
r = await call('POST', '/api/auth/login', { password: 'pw' })
assert(r.statusCode === 200 && cookie, 'login sets cookie')
r = await call('GET', '/api/admin/stats')
assert(r.statusCode === 200 && JSON.parse(r.body).wishes === 1, 'stats')
r = await call('PUT', '/api/admin/content', { theme: { primary: '#123456' } })
assert(JSON.parse(r.body).theme.primary === '#123456', 'content saved')
r = await call('GET', '/api/content')
assert(JSON.parse(r.body).theme.primary === '#123456', 'content persisted')

const fd = new FormData()
fd.append('file', new Blob([fs.readFileSync(new URL('../client/public/theme/photo.webp', import.meta.url))], { type: 'image/webp' }), 'photo.webp')
r = await call('POST', '/api/admin/upload/image', fd)
assert(r.statusCode === 200, 'image upload')
const url = JSON.parse(r.body).url
r = await call('GET', url)
assert(r.statusCode === 200 && r.isBase64Encoded && r.headers['content-type']?.startsWith('image/webp'), 'uploaded file served')
r = await call('GET', '/api/admin/uploads')
assert(JSON.parse(r.body).length === 1, 'uploads listed')
r = await call('DELETE', `/api/admin/uploads/${url.split('/').pop()}`)
assert(r.statusCode === 200, 'upload deleted')
r = await call('DELETE', '/api/admin/wishes/1')
assert(r.statusCode === 200, 'wish deleted')
r = await call('POST', '/api/admin/content/reset')
assert(JSON.parse(r.body).theme.primary === '#511419', 'reset')

console.log('\nAll Netlify function checks passed.')
await server.stop()
fs.rmSync(dir, { recursive: true, force: true })
