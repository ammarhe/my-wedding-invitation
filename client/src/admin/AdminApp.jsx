import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { getPath, setPath } from './fields.jsx'
import { Overview, CoupleSection, EventSection, TextsSection, ThemeSection, PhotosSection, MusicSection, WishesSection } from './sections.jsx'
import InvitationPage from '../invitation/InvitationPage.jsx'
import './admin.css'

const NAV = [
  { id: 'overview', label: 'Overview', icon: '◎' },
  { id: 'couple', label: 'Couple & names', icon: '♡' },
  { id: 'event', label: 'Event & venue', icon: '◷' },
  { id: 'texts', label: 'Cover, guestbook, footer', icon: '¶' },
  { id: 'theme', label: 'Colors & style', icon: '◐' },
  { id: 'photos', label: 'Photos', icon: '▣' },
  { id: 'music', label: 'Music', icon: '♪' },
  { id: 'wishes', label: 'Wishes', icon: '✉' },
]

function Login({ onDone }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.login(pw)
      onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="adm adm-login">
      <form onSubmit={submit}>
        <h1>Invitation dashboard</h1>
        <p>Enter the admin password to manage the invitation.</p>
        <div className="adm-field">
          <label>Password</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
        </div>
        {err && <p className="adm-status err" style={{ marginTop: 10 }}>{err}</p>}
        <button className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} disabled={busy || !pw}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(null)
  const [saved, setSaved] = useState(null) // last content persisted on the server
  const [draft, setDraft] = useState(null)
  const [tab, setTab] = useState('overview')
  const [status, setStatus] = useState({ text: '', kind: '' })
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState(0)
  const statusTimer = useRef(null)

  const notify = useCallback((text, kind = '') => {
    setStatus({ text, kind })
    clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => setStatus({ text: '', kind: '' }), 4000)
  }, [])

  useEffect(() => {
    api.me().then((r) => setAuthed(r.authenticated)).catch(() => setAuthed(false))
  }, [])

  const load = useCallback(() => {
    api.getContent().then((c) => {
      setSaved(c)
      setDraft(c)
    })
    api.stats().then((s) => setPending(s.pendingWishes || 0)).catch(() => {})
  }, [])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

  const dirty = useMemo(() => saved && draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft])

  useEffect(() => {
    const onBefore = (e) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBefore)
    return () => window.removeEventListener('beforeunload', onBefore)
  }, [dirty])

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty) save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onChange = useCallback((path, value) => {
    setDraft((d) => setPath(d, path, typeof value === 'function' ? value(getPath(d, path)) : value))
  }, [])

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const c = await api.saveContent(draft)
      setSaved(c)
      setDraft(c)
      notify('Saved — the invitation is updated for everyone.', 'ok')
    } catch (e) {
      if (e.status === 401) setAuthed(false)
      notify(e.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  const discard = () => setDraft(saved)

  const reset = async () => {
    if (!confirm('Reset ALL content to the original template? Uploaded files are kept, but every text, color and setting goes back to the defaults.')) return
    const c = await api.resetContent()
    setSaved(c)
    setDraft(c)
    notify('Content reset to defaults.', 'ok')
  }

  const logout = async () => {
    await api.logout()
    setAuthed(false)
  }

  if (authed === null) return <div className="adm adm-empty">Loading…</div>
  if (!authed) return <Login onDone={() => setAuthed(true)} />
  if (!draft) return <div className="adm adm-empty">Loading content…</div>

  const current = NAV.find((n) => n.id === tab)
  const p = { draft, onChange, notify }

  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            Wedding invitation
            <small>Admin dashboard</small>
          </div>
          <nav className="adm-nav">
            {NAV.map((n) => (
              <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}>
                <span aria-hidden="true">{n.icon}</span> {n.label}
                {n.id === 'wishes' && pending > 0 && <span className="badge">{pending}</span>}
              </button>
            ))}
          </nav>
          <div className="adm-side-foot">
            <a className="btn btn-ghost btn-sm" href="/" target="_blank" rel="noreferrer">Open invitation ↗</a>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
          </div>
        </aside>

        <div className="adm-main">
          <div className="adm-content">
            <div className="adm-topbar">
              <div>
                <h1>{current.label}</h1>
                <p>
                  {dirty ? (
                    <>
                      <span className="adm-dirty" />Unsaved changes — the preview shows them, guests don't yet.
                    </>
                  ) : (
                    'All changes saved.'
                  )}
                </p>
              </div>
              <div className="adm-actions">
                <span className={`adm-status ${status.kind}`}>{status.text}</span>
                {tab === 'theme' && <button className="btn btn-danger btn-sm" onClick={reset}>Reset to template</button>}
                <button className="btn" onClick={discard} disabled={!dirty || saving}>Discard</button>
                <button className="btn btn-primary" onClick={save} disabled={!dirty || saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>

            {tab === 'overview' && <Overview draft={draft} />}
            {tab === 'couple' && <CoupleSection {...p} />}
            {tab === 'event' && <EventSection {...p} />}
            {tab === 'texts' && <TextsSection {...p} />}
            {tab === 'theme' && <ThemeSection {...p} />}
            {tab === 'photos' && <PhotosSection {...p} />}
            {tab === 'music' && <MusicSection {...p} />}
            {tab === 'wishes' && <WishesSection notify={notify} />}
          </div>

          <aside className="adm-preview-col">
            <div className="adm-preview-head">
              <span>Live preview</span>
              <span>{dirty ? 'showing unsaved draft' : 'matches the live site'}</span>
            </div>
            <div className="adm-phone">
              <div className="adm-phone-inner">
                <InvitationPage preview previewContent={draft} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
