import path from 'node:path'
import { fileURLToPath } from 'node:url'

// esbuild bundles this to CJS for Netlify, where import.meta.url can be undefined.
// These filesystem paths are only used by the local sqlite/disk mode, so fall back to cwd.
const __dirname = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url))
  } catch {
    return process.cwd()
  }
})()
export const ROOT = path.resolve(__dirname, '..')

export const PORT = Number(process.env.PORT || 4000)
export const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data')
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, 'uploads')
export const CLIENT_DIST = process.env.CLIENT_DIST || path.resolve(ROOT, '..', 'client', 'dist')

// Dashboard password. Change it in .env (see .env.example).
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me'
// Secret used to sign the session cookie. Generate a long random string for production.
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-please-change'
export const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24 * 7)
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'

export const MAX_IMAGE_MB = Number(process.env.MAX_IMAGE_MB || 15)
export const MAX_AUDIO_MB = Number(process.env.MAX_AUDIO_MB || 30)

if (process.env.NODE_ENV === 'production' && (ADMIN_PASSWORD === 'change-me' || SESSION_SECRET === 'dev-secret-please-change')) {
  console.warn('\n[warning] ADMIN_PASSWORD / SESSION_SECRET are still the defaults. Set them in .env before going live.\n')
}
