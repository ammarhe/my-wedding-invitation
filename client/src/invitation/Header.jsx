import { SafeImg } from './pieces.jsx'

export default function Header({ content, onPhotoClick }) {
  const { header, groom, bride, theme } = content
  return (
    <header className="inv-header">
      {theme.castleBackground && <SafeImg src="/theme/castle-background.webp" className="inv-castle" />}

      <p className="inv-save">
        {header.saveTheDate}
        {header.dateShort ? `\n${header.dateShort}` : ''}
      </p>

      <div className="inv-envelope">
        <div className="inv-envelope-inner">
          <SafeImg src="/theme/envelope-background.webp" className="inv-envelope-bg" />
          <div className="inv-envelope-photo-wrap">
            <div
              className={`inv-envelope-photo ${onPhotoClick ? 'inv-clickable' : ''}`}
              onClick={onPhotoClick}
              role={onPhotoClick ? 'button' : undefined}
              tabIndex={onPhotoClick ? 0 : undefined}
              onKeyDown={(e) => onPhotoClick && (e.key === 'Enter' || e.key === ' ') && onPhotoClick()}
            >
              <img src={header.photo || '/theme/photo.webp'} alt="صورة العروسين" />
            </div>
          </div>
          {theme.flowers && (
            <span className="inv-envelope-flower" aria-hidden="true">
              <span>
                <SafeImg src="/theme/flower2-decoration.webp" />
              </span>
            </span>
          )}
          <SafeImg src="/theme/envelope-cover.webp" className="inv-envelope-cover" />
        </div>
      </div>

      <div className="inv-names">
        <p className="inv-name">{groom.shortName}</p>
        <span className="inv-amp" aria-hidden="true">
          &amp;
        </span>
        <p className="inv-name">{bride.shortName}</p>
      </div>
    </header>
  )
}
