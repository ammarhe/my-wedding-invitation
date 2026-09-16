import { SafeImg } from './pieces.jsx'

export default function Cover({ content, guestName, open, onOpen }) {
  const { cover, groom, bride, header, theme } = content
  return (
    <div className={`inv-cover ${open ? 'open' : ''}`} aria-hidden={open}>
      {theme.paperTexture && <div className="inv-cover-paper" />}
      {theme.flowers && (
        <>
          <SafeImg src="/theme/flower2-decoration.webp" className="inv-cover-flower inv-cover-flower--tl" />
          <SafeImg src="/theme/flower2-decoration.webp" className="inv-cover-flower inv-cover-flower--br" />
        </>
      )}
      <div className="inv-cover-inner">
        <p className="inv-cover-greet">{cover.greeting}</p>
        <p className="inv-cover-names">
          {groom.shortName}
          <br />
          &amp;
          <br />
          {bride.shortName}
        </p>
        <div className="inv-cover-orn" aria-hidden="true">❦</div>
        {header.dateShort && <p className="inv-cover-date">{header.dateShort}</p>}
        {cover.showGuestName && guestName && (
          <p className="inv-cover-guest">
            {cover.guestPrefix}
            <strong>{guestName}</strong>
          </p>
        )}
        <button type="button" className="inv-cover-btn" onClick={onOpen}>
          {cover.openLabel}
        </button>
      </div>
    </div>
  )
}
