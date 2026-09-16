// Netlify storage: Netlify Blobs (persistent key/value + file storage).
// Used automatically when the server runs inside a Netlify Function.
import { getStore } from '@netlify/blobs'
import { defaultContent } from '../defaultContent.js'
import { deepMerge, nowSql } from './shared.js'

const MAX_VISITS_KEPT = 500

export function createBlobsStore() {
  // Resolve the stores per call, not once: Netlify attaches short-lived blob credentials
  // per invocation (via connectLambda / NETLIFY_BLOBS_CONTEXT). Caching a getStore() handle
  // across warm invocations reuses an expired token and 502s. getStore() is cheap.
  const data = () => getStore({ name: 'wedding-data' })
  const files = () => getStore({ name: 'wedding-uploads' })

  const readJson = async (key, fallback) => (await data().get(key, { type: 'json' })) ?? fallback
  const writeJson = (key, value) => data().setJSON(key, value)

  async function getContent() {
    const stored = await readJson('content', null)
    if (!stored) {
      await writeJson('content', defaultContent)
      return structuredClone(defaultContent)
    }
    return deepMerge(structuredClone(defaultContent), stored)
  }

  // Wishes live in one JSON document: {seq, items:[...]}. Small scale, simple, fast.
  const readWishes = () => readJson('wishes', { seq: 0, items: [] })
  const readVisits = () => readJson('visits', { total: 0, recent: [] })

  return {
    kind: 'blobs',

    getContent,
    async saveContent(patch) {
      const merged = deepMerge(await getContent(), patch)
      await writeJson('content', merged)
      return merged
    },
    async resetContent() {
      await writeJson('content', defaultContent)
      return structuredClone(defaultContent)
    },

    wishes: {
      async add(name, message, approved, ip) {
        const w = await readWishes()
        const wish = { id: ++w.seq, name, message, approved: approved ? 1 : 0, ip: ip ?? null, created_at: nowSql() }
        w.items.unshift(wish)
        await writeJson('wishes', w)
        return wish
      },
      async listPublic() {
        const w = await readWishes()
        return w.items.filter((x) => x.approved).slice(0, 200).map(({ id, name, message, created_at }) => ({ id, name, message, created_at }))
      },
      async listAll() {
        return (await readWishes()).items
      },
      async remove(id) {
        const w = await readWishes()
        const before = w.items.length
        w.items = w.items.filter((x) => x.id !== id)
        if (w.items.length === before) return false
        await writeJson('wishes', w)
        return true
      },
      async setApproved(id, approved) {
        const w = await readWishes()
        const item = w.items.find((x) => x.id === id)
        if (!item) return false
        item.approved = approved ? 1 : 0
        await writeJson('wishes', w)
        return true
      },
    },

    stats: {
      async recordVisit(guest, ua) {
        const v = await readVisits()
        v.total += 1
        v.recent.unshift({ guest: guest ?? null, user_agent: ua ?? null, created_at: nowSql() })
        v.recent = v.recent.slice(0, MAX_VISITS_KEPT)
        await writeJson('visits', v)
      },
      async summary() {
        const [v, w] = await Promise.all([readVisits(), readWishes()])
        return {
          visits: v.total,
          wishes: w.items.length,
          pendingWishes: w.items.filter((x) => !x.approved).length,
          recentVisits: v.recent.slice(0, 20).map(({ guest, created_at }) => ({ guest, created_at })),
        }
      },
    },

    files: {
      staticDir: null,
      async save(name, buffer, mime) {
        await files().set(name, new Blob([buffer]), { metadata: { mime, size: buffer.length, mtime: Date.now() } })
        return { url: `/uploads/${name}`, size: buffer.length, mime }
      },
      async get(name) {
        const res = await files().getWithMetadata(name, { type: 'arrayBuffer' })
        if (!res) return null
        return { buffer: Buffer.from(res.data), mime: res.metadata?.mime || 'application/octet-stream' }
      },
      async list() {
        const store = files()
        const { blobs } = await store.list()
        const out = await Promise.all(
          blobs.map(async ({ key }) => {
            const meta = await store.getMetadata(key)
            return { url: `/uploads/${key}`, name: key, size: meta?.metadata?.size ?? 0, mtime: meta?.metadata?.mtime ?? 0 }
          }),
        )
        return out.sort((a, b) => b.mtime - a.mtime)
      },
      async remove(name) {
        const store = files()
        const exists = await store.getMetadata(name)
        if (!exists) return false
        await store.delete(name)
        return true
      },
    },
  }
}
