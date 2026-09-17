// Helpers shared by both storage back-ends.

export function deepMerge(base, patch) {
  if (Array.isArray(patch)) return patch
  if (patch && typeof patch === 'object') {
    const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) }
    for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(out[k], v)
    return out
  }
  return patch === undefined ? base : patch
}

export function nowSql() {
  // "YYYY-MM-DD HH:mm:ss" in UTC, same format SQLite's datetime('now') produces
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

// Normalize defaultContent.wishes.items (shape {from, message, status}) into the
// storage shape ({name, message, approved}) used to seed an empty wishes list.
export function seedWishes(defaultContent) {
  const items = defaultContent?.wishes?.items ?? []
  return items
    .filter((w) => w && w.from && w.message)
    .map((w) => ({ name: w.from, message: w.message, approved: w.status === 'visible' ? 1 : 0 }))
}

export const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
}
