import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * Floating music button + hidden <audio>.
 * Browsers only allow sound after a user gesture, so the cover's "Open" button
 * calls `ref.current.play()`; the floating button toggles afterwards.
 */
const MusicPlayer = forwardRef(function MusicPlayer({ music }, ref) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = Math.min(1, Math.max(0, Number(music.volume ?? 0.7)))
    a.loop = music.loop !== false
  }, [music.volume, music.loop])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const on = () => setPlaying(true)
    const off = () => setPlaying(false)
    a.addEventListener('play', on)
    a.addEventListener('pause', off)
    a.addEventListener('ended', off)
    return () => {
      a.removeEventListener('play', on)
      a.removeEventListener('pause', off)
      a.removeEventListener('ended', off)
    }
  }, [music.url])

  // Pause when the tab is hidden, resume when it comes back (only if it was playing)
  useEffect(() => {
    let wasPlaying = false
    const onVis = () => {
      const a = audioRef.current
      if (!a) return
      if (document.hidden) {
        wasPlaying = !a.paused
        a.pause()
      } else if (wasPlaying) {
        a.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useImperativeHandle(ref, () => ({
    play: () => audioRef.current?.play().catch(() => {}),
    pause: () => audioRef.current?.pause(),
  }))

  if (!music.enabled || !music.url) return null

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }

  return (
    <>
      <audio ref={audioRef} src={music.url} preload="auto" playsInline />
      <button
        type="button"
        className={`inv-music ${playing ? 'playing' : ''}`}
        onClick={toggle}
        aria-label={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        title={music.title || (playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى')}
      >
        <span className="inv-music-bars" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      </button>
    </>
  )
})

export default MusicPlayer
