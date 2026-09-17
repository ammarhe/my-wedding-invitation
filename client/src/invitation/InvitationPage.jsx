import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api.js'
import { startAutoScroll } from '../lib/autoScroll.js'
import { fontStack, loadFonts } from '../lib/fonts.js'
import Cover from './Cover.jsx'
import EventCard from './EventCard.jsx'
import Guestbook from './Guestbook.jsx'
import Header from './Header.jsx'
import Lightbox from './Lightbox.jsx'
import MusicPlayer from './MusicPlayer.jsx'
import ParentsCard from './ParentsCard.jsx'
import Venue from './Venue.jsx'
import './invitation.css'

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : '81, 20, 25'
}

export default function InvitationPage({ preview = false, previewContent = null }) {
  const location = useLocation()
  const [content, setContent] = useState(previewContent)
  const [wishes, setWishes] = useState([])
  const [error, setError] = useState('')
  const [coverOpen, setCoverOpen] = useState(preview)
  const [lightbox, setLightbox] = useState(-1)
  const musicRef = useRef(null)

  const guestName = useMemo(() => {
    const p = new URLSearchParams(location.search)
    return (p.get('to') || p.get('guest') || '').trim().slice(0, 80)
  }, [location.search])

  useEffect(() => {
    if (previewContent) {
      setContent(previewContent)
      return
    }
    let alive = true
    api
      .getContent()
      .then((c) => alive && setContent(c))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [previewContent])

  useEffect(() => {
    api.getWishes().then(setWishes).catch(() => {})
    if (!preview) api.recordVisit(guestName || null)
  }, [preview, guestName])

  useEffect(() => {
    if (content?.meta?.title) document.title = content.meta.title
  }, [content?.meta?.title])

  const fonts = content?.theme?.fonts
  useEffect(() => {
    if (fonts) loadFonts(fonts)
  }, [fonts?.body, fonts?.heading, fonts?.customName, fonts?.customUrl])

  const stopAutoScroll = useRef(null)
  const openCover = useCallback(() => {
    setCoverOpen(true)
    if (content?.music?.autoplay) musicRef.current?.play()
    if (content?.cover?.autoScroll) {
      stopAutoScroll.current?.()
      stopAutoScroll.current = startAutoScroll({
        speed: Number(content.cover.autoScrollSpeed) || 45,
        delay: Number(content.cover.autoScrollDelay ?? 1.2),
      })
    }
  }, [content?.music?.autoplay, content?.cover])

  useEffect(() => () => stopAutoScroll.current?.(), [])

  // If the cover is disabled, the page starts opened; try to autoplay (may be blocked until a tap).
  useEffect(() => {
    if (content && !content.cover.enabled) {
      setCoverOpen(true)
      if (content.music?.autoplay) {
        musicRef.current?.play()
        const once = () => {
          musicRef.current?.play()
          window.removeEventListener('pointerdown', once)
        }
        window.addEventListener('pointerdown', once)
        return () => window.removeEventListener('pointerdown', once)
      }
    }
  }, [content])

  if (error) {
    return (
      <div className="inv-loading">
        <span>تعذّر تحميل الدعوة — {error}</span>
      </div>
    )
  }
  if (!content) {
    return (
      <div className="inv-loading">
        <span>جارٍ التحميل…</span>
      </div>
    )
  }

  const t = content.theme
  const styleVars = {
    '--primary': t.primary,
    '--accent': t.accent,
    '--bg': t.background,
    '--light': t.light,
    '--light-70': `rgba(${hexToRgb(t.light)}, 0.7)`,
    '--light-45': `rgba(${hexToRgb(t.light)}, 0.45)`,
    '--light-40': `rgba(${hexToRgb(t.light)}, 0.4)`,
    '--primary-80': `rgba(${hexToRgb(t.primary)}, 0.8)`,
    '--primary-15': `rgba(${hexToRgb(t.primary)}, 0.15)`,
    '--primary-10': `rgba(${hexToRgb(t.primary)}, 0.1)`,
  }
  if (t.fonts?.body) styleVars['--font-arabic'] = fontStack(t.fonts.body, `'Amiri', 'Times New Roman', serif`)
  if (t.fonts?.heading) styleVars['--font-display'] = fontStack(t.fonts.heading, `'Viaoda Libre', 'Aref Ruqaa', 'Amiri', serif`)

  const gallery = content.gallery?.enabled ? (content.gallery.images || []).filter(Boolean) : []
  const openGallery = gallery.length ? () => setLightbox(0) : undefined

  return (
    <div className="inv-outer" style={styleVars}>
      {!preview && content.cover.enabled && (
        <Cover content={content} guestName={guestName} open={coverOpen} onOpen={openCover} />
      )}

      <main className="inv-root" style={styleVars}>
        {t.paperTexture && <div className="inv-paper" />}

        <Header content={content} onPhotoClick={openGallery} />
        <ParentsCard content={content} />
        <EventCard content={content} />
        <Venue content={content} />
        {content.guestbook.enabled && (
          <Guestbook
            content={content}
            wishes={wishes}
            guestName={guestName}
            onWishAdded={(w) => setWishes((prev) => [w, ...prev])}
          />
        )}

        <footer className="inv-footer">
          <span className="inv-footer-text">{content.footer.text}</span>
        </footer>
        {content.footer.credit && <div className="inv-credit">{content.footer.credit}</div>}
      </main>

      <MusicPlayer ref={musicRef} music={content.music} />

      {lightbox >= 0 && <Lightbox images={gallery} index={lightbox} onClose={() => setLightbox(-1)} />}
    </div>
  )
}
