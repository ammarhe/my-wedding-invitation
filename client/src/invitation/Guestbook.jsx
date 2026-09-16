import { useState } from 'react'
import { SafeImg } from './pieces.jsx'
import { api } from '../lib/api.js'

function timeAgo(iso) {
  const t = new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'))
  const diff = Math.max(0, (Date.now() - t.getTime()) / 1000)
  if (diff < 60) return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`
  return t.toLocaleDateString('ar', { day: 'numeric', month: 'short' })
}

export default function Guestbook({ content, wishes, onWishAdded, guestName }) {
  const gb = content.guestbook
  const [name, setName] = useState(guestName || '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const suggest = () => {
    const list = gb.suggestions?.length ? gb.suggestions : ['ألف مبروك!']
    setMessage(list[Math.floor(Math.random() * list.length)])
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setBusy(true)
    setNote('')
    try {
      const w = await api.postWish(name.trim(), message.trim())
      setMessage('')
      setNote(w.pending ? 'شكراً لك! ستظهر تهنئتك بعد الموافقة عليها.' : gb.successText || 'شكراً لك!')
      if (!w.pending) onWishAdded?.(w)
    } catch (err) {
      setNote(err.message || 'حدث خطأ، حاول مرة أخرى.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inv-guest-wrap">
      <SafeImg src="/theme/papernote-background.webp" className="inv-papernote" />
      <section className="inv-guest">
        <div style={{ textAlign: 'center' }}>
          <h2 className="inv-guest-title">{gb.title}</h2>
        </div>

        <form className="inv-guest-form" onSubmit={submit}>
          <div className="field">
            <input
              className="inv-input"
              type="text"
              placeholder={gb.namePlaceholder}
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <textarea
            className="inv-input"
            placeholder={gb.messagePlaceholder}
            value={message}
            maxLength={600}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="inv-guest-actions">
            <button type="button" className="inv-magic" onClick={suggest} title="اقتراح تهنئة" aria-label="اقتراح تهنئة">
              🪄
            </button>
            <button type="submit" className="inv-submit" disabled={busy || !name.trim() || !message.trim()}>
              {busy ? '...' : gb.submitLabel}
            </button>
          </div>
          <p className="inv-guest-note" role="status">{note}</p>
        </form>

        <div className="inv-wishes">
          {wishes.length === 0 ? (
            <p className="inv-wishes-empty">{gb.emptyText}</p>
          ) : (
            wishes.map((w) => (
              <article className="inv-wish" key={w.id}>
                <div className="inv-wish-head">
                  <span>{w.name}</span>
                  <span className="inv-wish-time">{timeAgo(w.created_at)}</span>
                </div>
                <p className="inv-wish-msg">{w.message}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
