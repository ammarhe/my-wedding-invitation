// Netlify Function: runs the same Express API as server/src/app.js, backed by Netlify Blobs.
// All /api/* and /uploads/* requests are rewritten here by netlify.toml.
import serverless from 'serverless-http'
import { connectLambda } from '@netlify/blobs'
import { createApp } from '../../server/src/app.js'
import { createBlobsStore } from '../../server/src/store/blobs.js'

process.env.NETLIFY = process.env.NETLIFY || 'true'
if (!process.env.COOKIE_SECURE) process.env.COOKIE_SECURE = 'true'
// Netlify Functions accept ~6 MB per request, so cap uploads unless overridden in the site's env vars.
if (!process.env.MAX_IMAGE_MB) process.env.MAX_IMAGE_MB = '4'
if (!process.env.MAX_AUDIO_MB) process.env.MAX_AUDIO_MB = '4'

let handlerPromise
async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const store = createBlobsStore()
      const app = createApp(store)
      return serverless(app, { binary: ['image/*', 'audio/*', 'application/octet-stream'] })
    })()
  }
  return handlerPromise
}

const FN_PREFIX = /^\/\.netlify\/functions\/api/

export const handler = async (event, context) => {
  // Gives @netlify/blobs the site/token context for this invocation. Netlify attaches it to
  // the event (`event.blobs`); when it's absent the NETLIFY_BLOBS_CONTEXT env var is used instead.
  if (event.blobs) connectLambda(event)

  // Normalise the path so Express sees /api/... and /uploads/... regardless of how Netlify
  // rewrote the request (it may pass the original path or the function path + splat).
  const rawPath = event.path || '/'
  event.path = rawPath.replace(FN_PREFIX, '') || '/'
  if (event.rawUrl && !FN_PREFIX.test(new URL(event.rawUrl).pathname)) {
    event.path = new URL(event.rawUrl).pathname
  }

  try {
    const h = await getHandler()
    return h(event, context)
  } catch (err) {
    // Return a readable 500 instead of an opaque Netlify 502 so the cause is visible in logs.
    console.error('Function error:', err)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', detail: String(err?.message || err) }),
    }
  }
}
