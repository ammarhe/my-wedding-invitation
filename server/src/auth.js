import crypto from 'node:crypto'
import { ADMIN_PASSWORD, SESSION_SECRET, SESSION_TTL_HOURS, COOKIE_SECURE } from './config.js'

const COOKIE = 'wi_admin'

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verify(token) {
  if (!token || typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ab.length !== bb.length) {
    // still run a comparison to keep timing roughly constant
    crypto.timingSafeEqual(bb, bb)
    return false
  }
  return crypto.timingSafeEqual(ab, bb)
}

// Simple in-memory rate limit for login attempts: 10 tries / 15 min per IP.
const attempts = new Map()
function tooManyAttempts(ip) {
  const now = Date.now()
  const entry = attempts.get(ip) || { count: 0, first: now }
  if (now - entry.first > 15 * 60 * 1000) {
    attempts.set(ip, { count: 0, first: now })
    return false
  }
  return entry.count >= 10
}
function recordAttempt(ip) {
  const now = Date.now()
  const entry = attempts.get(ip) || { count: 0, first: now }
  entry.count += 1
  attempts.set(ip, entry)
}

export function login(req, res) {
  const ip = req.ip
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
  }
  const { password } = req.body || {}
  if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
    recordAttempt(ip)
    return res.status(401).json({ error: 'Wrong password' })
  }
  attempts.delete(ip)
  const exp = Date.now() + SESSION_TTL_HOURS * 3600 * 1000
  res.cookie(COOKIE, sign({ role: 'admin', exp }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    maxAge: SESSION_TTL_HOURS * 3600 * 1000,
    path: '/',
  })
  res.json({ ok: true })
}

export function logout(_req, res) {
  res.clearCookie(COOKIE, { path: '/' })
  res.json({ ok: true })
}

export function requireAdmin(req, res, next) {
  const payload = verify(req.cookies?.[COOKIE])
  if (!payload || payload.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' })
  req.admin = payload
  next()
}

export function me(req, res) {
  const payload = verify(req.cookies?.[COOKIE])
  res.json({ authenticated: !!payload && payload.role === 'admin' })
}
