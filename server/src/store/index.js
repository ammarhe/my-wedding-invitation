// Picks the storage back-end.
//   STORAGE=sqlite  -> local SQLite + disk uploads (default outside Netlify)
//   STORAGE=blobs   -> Netlify Blobs (default when NETLIFY=true)
export async function createStore() {
  const mode = process.env.STORAGE || (process.env.NETLIFY ? 'blobs' : 'sqlite')
  if (mode === 'blobs') {
    const { createBlobsStore } = await import('./blobs.js')
    return createBlobsStore()
  }
  const { createSqliteStore } = await import('./sqlite.js')
  return createSqliteStore()
}
