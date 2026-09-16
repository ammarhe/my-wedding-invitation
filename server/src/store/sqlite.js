// Local / Docker storage: SQLite (built-in node:sqlite) + uploads on disk.
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { defaultContent } from '../defaultContent.js'
import { DATA_DIR, UPLOAD_DIR } from '../config.js'
import { deepMerge, MIME_BY_EXT } from './shared.js'

export function createSqliteStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const db = new DatabaseSync(path.join(DATA_DIR, 'wedding.sqlite'))
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

  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?')
  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)
  const insertWish = db.prepare('INSERT INTO wishes (name, message, approved, ip) VALUES (?, ?, ?, ?)')
  const getWish = db.prepare('SELECT * FROM wishes WHERE id = ?')
  const listPublic = db.prepare('SELECT id, name, message, created_at FROM wishes WHERE approved = 1 ORDER BY id DESC LIMIT 200')
  const listAll = db.prepare('SELECT * FROM wishes ORDER BY id DESC')
  const deleteWish = db.prepare('DELETE FROM wishes WHERE id = ?')
  const approveWish = db.prepare('UPDATE wishes SET approved = ? WHERE id = ?')
  const insertVisit = db.prepare('INSERT INTO visits (guest, user_agent) VALUES (?, ?)')
  const countVisits = db.prepare('SELECT COUNT(*) AS n FROM visits')
  const countWishes = db.prepare('SELECT COUNT(*) AS n, SUM(approved = 0) AS pending FROM wishes')
  const recentVisits = db.prepare('SELECT guest, created_at FROM visits ORDER BY id DESC LIMIT 20')

  function getContentSync() {
    const row = getSetting.get('content')
    if (!row) {
      upsertSetting.run('content', JSON.stringify(defaultContent))
      return structuredClone(defaultContent)
    }
    return deepMerge(structuredClone(defaultContent), JSON.parse(row.value))
  }

  return {
    kind: 'sqlite',

    async getContent() {
      return getContentSync()
    },
    async saveContent(patch) {
      const merged = deepMerge(getContentSync(), patch)
      upsertSetting.run('content', JSON.stringify(merged))
      return merged
    },
    async resetContent() {
      upsertSetting.run('content', JSON.stringify(defaultContent))
      return structuredClone(defaultContent)
    },

    wishes: {
      async add(name, message, approved, ip) {
        const info = insertWish.run(name, message, approved ? 1 : 0, ip ?? null)
        return getWish.get(info.lastInsertRowid)
      },
      async listPublic() {
        return listPublic.all()
      },
      async listAll() {
        return listAll.all()
      },
      async remove(id) {
        return deleteWish.run(id).changes > 0
      },
      async setApproved(id, approved) {
        return approveWish.run(approved ? 1 : 0, id).changes > 0
      },
    },

    stats: {
      async recordVisit(guest, ua) {
        insertVisit.run(guest ?? null, ua ?? null)
      },
      async summary() {
        const w = countWishes.get()
        return {
          visits: countVisits.get().n,
          wishes: w.n,
          pendingWishes: w.pending ?? 0,
          recentVisits: recentVisits.all(),
        }
      },
    },

    files: {
      // Express can serve the folder directly; the app uses this when present.
      staticDir: UPLOAD_DIR,
      async save(name, buffer, mime) {
        fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer)
        return { url: `/uploads/${name}`, size: buffer.length, mime }
      },
      async get(name) {
        const p = path.join(UPLOAD_DIR, path.basename(name))
        if (!fs.existsSync(p)) return null
        return { buffer: fs.readFileSync(p), mime: MIME_BY_EXT[path.extname(name).toLowerCase()] || 'application/octet-stream' }
      },
      async list() {
        return fs
          .readdirSync(UPLOAD_DIR)
          .map((f) => {
            const st = fs.statSync(path.join(UPLOAD_DIR, f))
            return { url: `/uploads/${f}`, name: f, size: st.size, mtime: st.mtimeMs }
          })
          .sort((a, b) => b.mtime - a.mtime)
      },
      async remove(name) {
        const p = path.join(UPLOAD_DIR, path.basename(name))
        if (!fs.existsSync(p)) return false
        fs.unlinkSync(p)
        return true
      },
    },
  }
}
