async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

// Netlify sync Functions hard-cap the whole request at ~6 MB. Multipart + base64 transport
// adds ~37% overhead, so raw files must stay under ~4 MB. Reject early with a clear message
// instead of letting Netlify return an opaque 413.
const UPLOAD_MAX_MB = 4
function ensureSize(file, kind) {
  const maxBytes = UPLOAD_MAX_MB * 1024 * 1024
  if (file && file.size > maxBytes) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    const err = new Error(
      `This ${kind} is ${mb} MB. Max ${UPLOAD_MAX_MB} MB (Netlify upload limit). Compress it and try again.`,
    )
    err.status = 413
    throw err
  }
}

export const api = {
  // public
  getContent: () => request('/api/content'),
  getWishes: () => request('/api/wishes'),
  postWish: (name, message) => request('/api/wishes', { method: 'POST', body: JSON.stringify({ name, message }) }),
  recordVisit: (guest) => request('/api/visit', { method: 'POST', body: JSON.stringify({ guest }) }).catch(() => {}),

  // auth
  login: (password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  // admin
  saveContent: (patch) => request('/api/admin/content', { method: 'PUT', body: JSON.stringify(patch) }),
  resetContent: () => request('/api/admin/content/reset', { method: 'POST' }),
  adminWishes: () => request('/api/admin/wishes'),
  deleteWish: (id) => request(`/api/admin/wishes/${id}`, { method: 'DELETE' }),
  approveWish: (id, approved) =>
    request(`/api/admin/wishes/${id}`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
  stats: () => request('/api/admin/stats'),
  uploads: () => request('/api/admin/uploads'),
  deleteUpload: (name) => request(`/api/admin/uploads/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  uploadImage(file) {
    ensureSize(file, 'image')
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/admin/upload/image', { method: 'POST', body: fd })
  },
  uploadAudio(file) {
    ensureSize(file, 'audio file')
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/admin/upload/audio', { method: 'POST', body: fd })
  },
  uploadFont(file) {
    ensureSize(file, 'font')
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/admin/upload/font', { method: 'POST', body: fd })
  },
}
