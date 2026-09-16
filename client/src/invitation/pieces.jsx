import { useEffect, useState } from 'react'

/** Image that removes itself if the file is missing (keeps layout clean when a theme asset isn't there). */
export function SafeImg({ src, className = '', ...rest }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) return null
  return <img src={src} className={className} onError={() => setFailed(true)} alt="" {...rest} />
}

export function Flower({ className = '', src = '/theme/flower2-decoration.webp' }) {
  return (
    <span className={`inv-flower ${className}`} aria-hidden="true">
      <span>
        <SafeImg src={src} />
      </span>
    </span>
  )
}

export function CardChrome({ paper = true }) {
  return (
    <>
      <div className="inv-card-bg" />
      {paper && <SafeImg src="/theme/paper.webp" className="inv-card-paper" />}
    </>
  )
}

export function HeartDay({ day }) {
  return (
    <div className="inv-cal-heart" aria-label={`اليوم ${day}`}>
      <svg viewBox="0 0 26 24" fill="var(--primary)" aria-hidden="true">
        <path d="M13 23 C6 17.5 1.5 13.5 1.5 8.4 C1.5 4.7 4.3 2 7.7 2 c2.2 0 4.1 1.2 5.3 3 1.2-1.8 3.1-3 5.3-3 3.4 0 6.2 2.7 6.2 6.4 C24.5 13.5 20 17.5 13 23z" />
      </svg>
      <span>{day}</span>
    </div>
  )
}

export function DirectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11 22 2 13 21l-2-8z" />
    </svg>
  )
}

export function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
