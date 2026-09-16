import { useEffect, useState } from 'react'

export default function Lightbox({ images, index, onClose }) {
  const [i, setI] = useState(index)
  useEffect(() => setI(index), [index])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((v) => (v + 1) % images.length)
      if (e.key === 'ArrowLeft') setI((v) => (v - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [images.length, onClose])

  if (!images.length) return null
  const prev = () => setI((v) => (v - 1 + images.length) % images.length)
  const next = () => setI((v) => (v + 1) % images.length)

  return (
    <div className="inv-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className="inv-lightbox-close" onClick={onClose} aria-label="إغلاق">✕</button>
      <div className="inv-lightbox-count">{i + 1} / {images.length}</div>
      <div className="inv-lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button type="button" className="inv-lightbox-nav prev" onClick={prev} aria-label="السابق">‹</button>
        )}
        <img src={images[i]} alt={`صورة ${i + 1}`} />
        {images.length > 1 && (
          <button type="button" className="inv-lightbox-nav next" onClick={next} aria-label="التالي">›</button>
        )}
      </div>
      {images.length > 1 && (
        <div className="inv-lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((src, k) => (
            <button type="button" key={src + k} className={k === i ? 'active' : ''} onClick={() => setI(k)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
