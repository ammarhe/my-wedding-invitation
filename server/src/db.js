import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { defaultContent } from './defaultContent.js'
import { DATA_DIR } from './config.js'

fs.mkdirSync(DATA_DIR, { recursive: true })
const dbPath = path.join(DATA_DIR, 'wedding.sqlite')

export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL;')

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS wishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 1,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// ---- content -------------------------------------------------------------

const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?')
const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`)

function deepMerge(base, patch) {
  if (Array.isArray(patch)) return patch
  if (patch && typeof patch === 'object') {
    const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) }
    for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(out[k], v)
    return out
  }
  return patch === undefined ? base : patch
}

export function getContent() {
  const row = getSetting.get('content')
  if (!row) {
    upsertSetting.run('content', JSON.stringify(defaultContent))
    return structuredClone(defaultContent)
  }
  // Merge on top of defaults so newly added fields always exist.
  return deepMerge(structuredClone(defaultContent), JSON.parse(row.value))
}

export function saveContent(patch) {
  const merged = deepMerge(getContent(), patch)
  upsertSetting.run('content', JSON.stringify(merged))
  return merged
}

export function resetContent() {
  upsertSetting.run('content', JSON.stringify(defaultContent))
  return structuredClone(defaultContent)
}

// ---- wishes --------------------------------------------------------------

const insertWish = db.prepare('INSERT INTO wishes (name, message, approved, ip) VALUES (?, ?, ?, ?)')
const listPublicWishes = db.prepare(
  'SELECT id, name, message, created_at FROM wishes WHERE approved = 1 ORDER BY id DESC LIMIT 200',
)
const listAllWishes = db.prepare('SELECT * FROM wishes ORDER BY id DESC')
const deleteWish = db.prepare('DELETE FROM wishes WHERE id = ?')
const approveWish = db.prepare('UPDATE wishes SET approved = ? WHERE id = ?')
const getWish = db.prepare('SELECT * FROM wishes WHERE id = ?')

export const wishes = {
  add(name, message, approved, ip) {
    const info = insertWish.run(name, message, approved ? 1 : 0, ip ?? null)
    return getWish.get(info.lastInsertRowid)
  },
  listPublic: () => listPublicWishes.all(),
  listAll: () => listAllWishes.all(),
  remove: (id) => deleteWish.run(id).changes > 0,
  setApproved: (id, approved) => approveWish.run(approved ? 1 : 0, id).changes > 0,
}

// ---- visits --------------------------------------------------------------

const insertVisit = db.prepare('INSERT INTO visits (guest, user_agent) VALUES (?, ?)')
const countVisits = db.prepare('SELECT COUNT(*) AS n FROM visits')
const countWishes = db.prepare('SELECT COUNT(*) AS n, SUM(approved = 0) AS pending FROM wishes')
const recentVisits = db.prepare('SELECT guest, created_at FROM visits ORDER BY id DESC LIMIT 20')

export const stats = {
  recordVisit: (guest, ua) => insertVisit.run(guest ?? null, ua ?? null),
  summary() {
    const w = countWishes.get()
    return {
      visits: countVisits.get().n,
      wishes: w.n,
      pendingWishes: w.pending ?? 0,
      recentVisits: recentVisits.all(),
    }
  },
}
