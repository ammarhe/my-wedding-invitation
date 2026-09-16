import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Card, Check, Color, Field, Select, getPath } from './fields.jsx'
import UploadZone from './UploadZone.jsx'

const TIMEZONES = [
  'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Istanbul', 'Asia/Damascus', 'Asia/Beirut',
  'Asia/Amman', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Baghdad', 'Africa/Cairo', 'America/New_York',
  'America/Chicago', 'America/Los_Angeles', 'Asia/Kuala_Lumpur', 'UTC',
]

// ------------------------------------------------------------------ Overview
export function Overview({ draft }) {
  const [stats, setStats] = useState(null)
  const [guest, setGuest] = useState('')
  const [copied, setCopied] = useState('')
  useEffect(() => {
    api.stats().then(setStats).catch(() => {})
  }, [])

  const base = `${window.location.origin}/`
  const link = guest.trim() ? `${base}?to=${encodeURIComponent(guest.trim())}` : base
  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* ignore */
    }
  }
  const waText = encodeURIComponent(`${draft.cover?.greeting || ''}\n${draft.meta?.title || ''}\n${link}`)

  return (
    <>
      <div className="adm-stats">
        <div className="adm-stat"><div className="n">{stats?.visits ?? '–'}</div><div className="l">Page opens</div></div>
        <div className="adm-stat"><div className="n">{stats?.wishes ?? '–'}</div><div className="l">Wishes received</div></div>
        <div className="adm-stat"><div className="n">{stats?.pendingWishes ?? '–'}</div><div className="l">Pending approval</div></div>
        <div className="adm-stat"><div className="n">{draft.event?.date || '–'}</div><div className="l">Wedding date</div></div>
      </div>

      <Card title="Share with guests" hint="Send the public link. Add a guest name to personalise the cover (“إلى: …”).">
        <div className="adm-grid">
          <div className="adm-field">
            <label>Guest name (optional)</label>
            <input type="text" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="e.g. عائلة أبو أحمد" style={{ direction: 'rtl' }} />
          </div>
        </div>
        <div className="adm-share" style={{ marginTop: 12 }}>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="btn" onClick={() => copy(link, 'link')}>{copied === 'link' ? 'Copied ✓' : 'Copy link'}</button>
          <a className="btn" href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="btn" href={link} target="_blank" rel="noreferrer">Open</a>
        </div>
        <p className="adm-small" style={{ marginTop: 10 }}>
          Guests open <code className="adm-code">{base}</code>. This dashboard lives at <code className="adm-code">{base}admin</code> — never share that one.
        </p>
      </Card>

      {stats?.recentVisits?.length > 0 && (
        <Card title="Recent opens">
          <table className="adm-table">
            <thead><tr><th>Guest</th><th>When</th></tr></thead>
            <tbody>
              {stats.recentVisits.map((v, i) => (
                <tr key={i}><td>{v.guest || <span className="adm-small">anonymous</span>}</td><td>{v.created_at}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Couple
export function CoupleSection({ draft, onChange }) {
  const p = { draft, onChange }
  return (
    <>
      <Card title="Groom">
        <div className="adm-grid">
          <Field label="Short name (header)" path="groom.shortName" rtl {...p} />
          <Field label="Full name (card)" path="groom.fullName" rtl {...p} />
          <Field label="Subtitle (optional)" path="groom.subtitle" rtl {...p} hint="Small line under the name, e.g. a title or a city" />
          <Field label="Parent title" path="groom.parentTitle" rtl {...p} />
          <Field label="Parent name" path="groom.parentName" rtl {...p} />
          <Field label="Second parent (optional)" path="groom.parentName2" rtl {...p} />
        </div>
      </Card>
      <Card title="Bride">
        <div className="adm-grid">
          <Field label="Short name (header)" path="bride.shortName" rtl {...p} />
          <Field label="Full name (card)" path="bride.fullName" rtl {...p} />
          <Field label="Subtitle (optional)" path="bride.subtitle" rtl {...p} />
          <Field label="Parent title" path="bride.parentTitle" rtl {...p} />
          <Field label="Parent name" path="bride.parentName" rtl {...p} />
          <Field label="Second parent (optional)" path="bride.parentName2" rtl {...p} />
        </div>
      </Card>
      <Card title="Announcement">
        <div className="adm-grid">
          <Field label="Text (line breaks are kept)" path="announcement" rtl full textarea {...p} />
        </div>
      </Card>
      <Card title="Page title & sharing preview" hint="Used in the browser tab and when the link is shared on WhatsApp / Facebook.">
        <div className="adm-grid">
          <Field label="Title" path="meta.title" rtl {...p} />
          <Field label="Description" path="meta.description" rtl full textarea {...p} />
        </div>
      </Card>
    </>
  )
}

// ------------------------------------------------------------------ Event & venue
export function EventSection({ draft, onChange }) {
  const p = { draft, onChange }
  return (
    <>
      <Card title="Date & time">
        <div className="adm-grid">
          <Field label="Date" path="event.date" type="date" {...p} />
          <Field label="Start time" path="event.startTime" type="time" {...p} />
          <Field label="End time (calendar entry)" path="event.endTime" type="time" {...p} />
          <Select label="Time zone" path="event.timezone" options={TIMEZONES.map((t) => ({ value: t, label: t }))} {...p} />
          <Field label="Short date on the header" path="header.dateShort" {...p} hint="Free text, e.g. 26.09.26" />
          <Field label="“Save the date” label" path="header.saveTheDate" {...p} />
        </div>
      </Card>
      <Card title="Labels">
        <div className="adm-grid">
          <Field label="Card title" path="event.title" rtl {...p} />
          <Field label="Subtitle" path="event.subtitle" rtl {...p} />
          <Field label="Time label" path="event.timeLabel" rtl {...p} />
          <Field label="Countdown label" path="event.countdownLabel" rtl {...p} />
          <Field label="Calendar button" path="event.calendarLabel" rtl {...p} />
          <Field label="Calendar entry title" path="event.calendarTitle" rtl full {...p} />
          <Field label="Calendar entry details" path="event.calendarDetails" rtl full textarea {...p} />
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
          <Check label="Show countdown" path="event.showCountdown" {...p} />
          <Check label="Show month calendar" path="event.showCalendar" {...p} />
        </div>
      </Card>
      <Card title="Venue" hint="The map is a Google Maps embed. Leave the embed URL empty to search by the map query; or paste a full “Embed a map” URL from Google Maps for an exact pin.">
        <div className="adm-grid">
          <Field label="Section title" path="venue.title" rtl {...p} />
          <Field label="Venue name" path="venue.name" rtl {...p} />
          <Field label="Address line (optional)" path="venue.address" rtl full {...p} />
          <Field label="Map search query" path="venue.mapQuery" rtl full {...p} hint="What Google Maps searches for (name + city works best)" />
          <Field label="Custom embed URL (optional)" path="venue.mapEmbedUrl" type="url" full {...p} placeholder="https://www.google.com/maps/embed?pb=…" />
          <Field label="Directions button label" path="venue.directionsLabel" rtl {...p} />
        </div>
        <Check label="Show map" path="venue.showMap" {...p} />
      </Card>
    </>
  )
}

// ------------------------------------------------------------------ Texts (cover, guestbook, footer)
export function TextsSection({ draft, onChange }) {
  const p = { draft, onChange }
  const suggestions = (getPath(draft, 'guestbook.suggestions') || []).join('\n')
  return (
    <>
      <Card title="Opening cover" hint="The first screen guests see. Tapping the button opens the invitation and starts the music.">
        <Check label="Show cover" path="cover.enabled" {...p} />
        <div className="adm-grid">
          <Field label="Greeting" path="cover.greeting" rtl {...p} />
          <Field label="Open button" path="cover.openLabel" rtl {...p} />
          <Field label="Guest prefix" path="cover.guestPrefix" rtl {...p} hint="Shown before the guest name from ?to= links" />
        </div>
        <Check label="Show guest name when the link has ?to=" path="cover.showGuestName" {...p} />
        <Check label="Auto-scroll the invitation after the cover opens (stops as soon as the guest touches or scrolls)" path="cover.autoScroll" {...p} />
        {getPath(draft, 'cover.autoScroll') && (
          <div className="adm-grid" style={{ marginTop: 6 }}>
            <Field label="Scroll speed (pixels / second)" path="cover.autoScrollSpeed" type="number" min="10" max="300" step="5" {...p} hint="45 is a gentle reading pace; 80–100 is brisk" />
            <Field label="Delay before scrolling starts (seconds)" path="cover.autoScrollDelay" type="number" min="0" max="10" step="0.1" {...p} />
          </div>
        )}
      </Card>
      <Card title="Guestbook">
        <Check label="Enable guestbook" path="guestbook.enabled" {...p} />
        <Check label="Wishes need my approval before they appear" path="guestbook.requireApproval" {...p} />
        <div className="adm-grid" style={{ marginTop: 8 }}>
          <Field label="Title" path="guestbook.title" rtl {...p} />
          <Field label="Name placeholder" path="guestbook.namePlaceholder" rtl {...p} />
          <Field label="Message placeholder" path="guestbook.messagePlaceholder" rtl {...p} />
          <Field label="Submit button" path="guestbook.submitLabel" rtl {...p} />
          <Field label="Empty state text" path="guestbook.emptyText" rtl {...p} />
          <Field label="Thank-you text" path="guestbook.successText" rtl {...p} />
          <div className="adm-field rtl full">
            <label>🪄 Suggested wishes (one per line)</label>
            <textarea
              value={suggestions}
              onChange={(e) => onChange('guestbook.suggestions', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
            />
          </div>
        </div>
      </Card>
      <Card title="Footer">
        <div className="adm-grid">
          <Field label="Closing text" path="footer.text" rtl full textarea {...p} />
          <Field label="Small credit line (optional)" path="footer.credit" full {...p} />
        </div>
      </Card>
    </>
  )
}

// ------------------------------------------------------------------ Theme
export function ThemeSection({ draft, onChange }) {
  const p = { draft, onChange }
  const presets = [
    { name: 'Dark red (original)', primary: '#511419', accent: '#590310', background: '#fff7eb', light: '#ece4d8' },
    { name: 'Forest green', primary: '#1f3d2b', accent: '#183022', background: '#f6f4ec', light: '#e8e6d8' },
    { name: 'Navy & gold', primary: '#1b2a4a', accent: '#13203a', background: '#f7f3ea', light: '#eae2cc' },
    { name: 'Dusty rose', primary: '#8a4b5a', accent: '#6e3745', background: '#fff5f3', light: '#f4e4e1' },
    { name: 'Charcoal', primary: '#2b2b2e', accent: '#1a1a1c', background: '#f5f4f2', light: '#e6e4e1' },
  ]
  return (
    <>
      <Card title="Colors" hint="Everything is derived from these four colors. The preview on the right updates live.">
        <div className="adm-grid">
          <Color label="Primary (cards, text)" path="theme.primary" {...p} />
          <Color label="Accent (save the date)" path="theme.accent" {...p} />
          <Color label="Page background" path="theme.background" {...p} />
          <Color label="Text on cards" path="theme.light" {...p} />
        </div>
        <div className="adm-actions" style={{ marginTop: 14 }}>
          {presets.map((pr) => (
            <button
              key={pr.name}
              className="btn btn-sm"
              onClick={() => {
                onChange('theme.primary', pr.primary)
                onChange('theme.accent', pr.accent)
                onChange('theme.background', pr.background)
                onChange('theme.light', pr.light)
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: pr.primary, display: 'inline-block' }} /> {pr.name}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Decorations">
        <Check label="Paper texture" path="theme.paperTexture" {...p} />
        <Check label="Faded castle illustration in the background" path="theme.castleBackground" {...p} />
        <Check label="Floating flower decorations" path="theme.flowers" {...p} />
        <p className="adm-small" style={{ marginTop: 10 }}>
          Decoration images live in <code className="adm-code">client/public/theme/</code>. Replace the files there to change the artwork
          (keep the same file names).
        </p>
      </Card>
    </>
  )
}

// ------------------------------------------------------------------ Photos
export function PhotosSection({ draft, onChange, notify }) {
  const [busy, setBusy] = useState(false)
  const [library, setLibrary] = useState([])
  const refresh = () => api.uploads().then((l) => setLibrary(l.filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name)))).catch(() => {})
  useEffect(() => {
    refresh()
  }, [])

  const gallery = getPath(draft, 'gallery.images') || []
  const cover = getPath(draft, 'header.photo')

  const upload = async (files) => {
    setBusy(true)
    try {
      for (const f of files) {
        const r = await api.uploadImage(f)
        // functional update so several uploads in a row don't overwrite each other
        onChange('gallery.images', (prev) => [...(prev || []), r.url])
      }
      notify('Uploaded. Remember to save.', 'ok')
      refresh()
    } catch (e) {
      notify(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const removeFromGallery = (url) => onChange('gallery.images', gallery.filter((u) => u !== url))
  const move = (url, dir) => {
    const i = gallery.indexOf(url)
    const j = i + dir
    if (j < 0 || j >= gallery.length) return
    const next = [...gallery]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange('gallery.images', next)
  }

  return (
    <>
      <Card title="Photos" hint="The first photo in the gallery is not automatically the cover — pick the cover with “Use as cover”. Tapping the envelope photo on the invitation opens the gallery.">
        <Check label="Enable gallery (tap the envelope photo to open)" path="gallery.enabled" draft={draft} onChange={onChange} />
        <UploadZone accept="image/*" multiple busy={busy} label="Drop photos here or click to upload (JPG, PNG, WEBP · up to 15 MB each)" onFiles={upload} />
        {gallery.length === 0 && <div className="adm-empty">No photos in the gallery yet.</div>}
        <div className="adm-media-grid">
          {gallery.map((url, i) => (
            <div className={`adm-media ${url === cover ? 'selected' : ''}`} key={url}>
              <img src={url} alt="" />
              <div className="bar">
                <button className="btn btn-sm" title="Use as cover" onClick={() => onChange('header.photo', url)}>{url === cover ? '★ Cover' : 'Use as cover'}</button>
                <button className="btn btn-sm" onClick={() => move(url, -1)} disabled={i === 0} title="Move left">←</button>
                <button className="btn btn-sm" onClick={() => move(url, 1)} disabled={i === gallery.length - 1} title="Move right">→</button>
                <button className="btn btn-sm btn-danger" onClick={() => removeFromGallery(url)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {library.length > 0 && (
        <Card title="Uploaded files" hint="Everything that was uploaded to the server. Add to gallery or delete permanently.">
          <div className="adm-media-grid">
            {library.map((f) => (
              <div className="adm-media" key={f.url}>
                <img src={f.url} alt="" />
                <div className="bar">
                  {!gallery.includes(f.url) && (
                    <button className="btn btn-sm" onClick={() => onChange('gallery.images', [...gallery, f.url])}>Add</button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={async () => {
                      if (!confirm('Delete this file from the server?')) return
                      await api.deleteUpload(f.name)
                      removeFromGallery(f.url)
                      if (cover === f.url) onChange('header.photo', '/theme/photo.webp')
                      refresh()
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Music
export function MusicSection({ draft, onChange, notify }) {
  const [busy, setBusy] = useState(false)
  const [library, setLibrary] = useState([])
  const refresh = () => api.uploads().then((l) => setLibrary(l.filter((f) => /\.(mp3|m4a|aac|ogg|wav|webm)$/i.test(f.name)))).catch(() => {})
  useEffect(() => {
    refresh()
  }, [])

  const url = getPath(draft, 'music.url')

  const upload = async ([file]) => {
    setBusy(true)
    try {
      const r = await api.uploadAudio(file)
      onChange('music.url', r.url)
      if (!getPath(draft, 'music.title')) onChange('music.title', file.name.replace(/\.[^.]+$/, ''))
      notify('Music uploaded. Remember to save.', 'ok')
      refresh()
    } catch (e) {
      notify(e.message, 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card
        title="Background music"
        hint="Browsers block sound until the guest taps something, so the music starts when they press the cover button. A floating button lets them pause it."
      >
        <Check label="Enable music" path="music.enabled" draft={draft} onChange={onChange} />
        <Check label="Start automatically when the cover is opened" path="music.autoplay" draft={draft} onChange={onChange} />
        <Check label="Loop" path="music.loop" draft={draft} onChange={onChange} />
        <div className="adm-grid" style={{ marginTop: 10 }}>
          <Field label="Track title (tooltip)" path="music.title" draft={draft} onChange={onChange} />
          <Field label="Volume (0–1)" path="music.volume" type="number" step="0.05" min="0" max="1" draft={draft} onChange={onChange} />
          <Field label="Or paste a direct audio URL" path="music.url" type="url" full draft={draft} onChange={onChange} placeholder="/uploads/… or https://…/song.mp3" />
        </div>
        <div style={{ marginTop: 14 }}>
          <UploadZone accept="audio/*" busy={busy} label="Drop an MP3 / M4A here or click to upload (up to 30 MB)" onFiles={upload} />
        </div>
        {url ? (
          <div className="adm-audio">
            <audio controls src={url} preload="metadata" />
            <button className="btn btn-sm btn-danger" onClick={() => onChange('music.url', '')}>Remove from invitation</button>
          </div>
        ) : (
          <div className="adm-empty">No track selected.</div>
        )}
      </Card>

      {library.length > 0 && (
        <Card title="Uploaded tracks">
          <table className="adm-table">
            <tbody>
              {library.map((f) => (
                <tr key={f.url}>
                  <td>{f.name}</td>
                  <td className="adm-small">{(f.size / 1024 / 1024).toFixed(1)} MB</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {url !== f.url && <button className="btn btn-sm" onClick={() => onChange('music.url', f.url)}>Use</button>}{' '}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={async () => {
                        if (!confirm('Delete this track from the server?')) return
                        await api.deleteUpload(f.name)
                        if (url === f.url) onChange('music.url', '')
                        refresh()
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Wishes
export function WishesSection({ notify }) {
  const [list, setList] = useState(null)
  const load = () => api.adminWishes().then(setList).catch((e) => notify(e.message, 'err'))
  useEffect(() => {
    load()
  }, [])

  if (!list) return <div className="adm-empty">Loading…</div>

  const exportCsv = () => {
    const rows = [['id', 'name', 'message', 'approved', 'created_at'], ...list.map((w) => [w.id, w.name, w.message, w.approved, w.created_at])]
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'wishes.csv'
    a.click()
  }

  return (
    <Card title={`Wishes (${list.length})`} hint="Approve, hide or delete guest messages. Deleting is permanent.">
      <div className="adm-actions" style={{ marginBottom: 12 }}>
        <button className="btn btn-sm" onClick={load}>Refresh</button>
        <button className="btn btn-sm" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </div>
      {list.length === 0 ? (
        <div className="adm-empty">No wishes yet.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>From</th><th>Message</th><th>Status</th><th>When</th><th /></tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <tr key={w.id}>
                <td style={{ direction: 'rtl', textAlign: 'right' }}>{w.name}</td>
                <td className="msg">{w.message}</td>
                <td><span className={`adm-pill ${w.approved ? 'ok' : 'pending'}`}>{w.approved ? 'visible' : 'pending'}</span></td>
                <td className="adm-small">{w.created_at}</td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await api.approveWish(w.id, !w.approved)
                      load()
                    }}
                  >
                    {w.approved ? 'Hide' : 'Approve'}
                  </button>{' '}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={async () => {
                      if (!confirm(`Delete the wish from ${w.name}?`)) return
                      await api.deleteWish(w.id)
                      load()
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
