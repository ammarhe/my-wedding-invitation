import { directionsUrl, mapEmbedUrl } from '../lib/dates.js'
import { DirectionsIcon, SafeImg } from './pieces.jsx'

export default function Venue({ content }) {
  const { venue, theme } = content
  return (
    <div className="inv-venue-wrap">
      {theme.castleBackground && <SafeImg src="/theme/castle-background.webp" className="inv-castle" />}
      <section className="inv-venue">
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h3 className="inv-venue-title">{venue.title}</h3>
          <div className="inv-venue-name">
            {venue.name}
            {venue.address ? `\n${venue.address}` : ''}
          </div>
        </div>
        <div className="inv-map-wrap">
          {venue.showMap && (
            <iframe
              className="inv-map"
              title="خريطة الموقع"
              src={mapEmbedUrl(venue)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          )}
          <a
            className="inv-directions"
            href={directionsUrl(venue.mapQuery || venue.name)}
            target="_blank"
            rel="noreferrer"
          >
            <DirectionsIcon />
            <span>{venue.directionsLabel}</span>
          </a>
        </div>
      </section>
    </div>
  )
}
