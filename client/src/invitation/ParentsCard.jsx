import { CardChrome, Flower } from './pieces.jsx'

function Parent({ person }) {
  return (
    <div className="inv-parent">
      <span className="inv-parent-title">{person.parentTitle}</span>
      <span className="inv-parent-name">{person.parentName}</span>
      <span className="inv-parent-name">{person.parentName2 || ''}</span>
    </div>
  )
}

export default function ParentsCard({ content }) {
  const { groom, bride, announcement, theme } = content
  const hasParents = groom.parentName || bride.parentName
  return (
    <section className="inv-section inv-section--parents">
      {theme.flowers && <Flower className="inv-flower--parents" />}
      <div className="inv-card">
        <CardChrome paper={theme.paperTexture} />
        <div className="inv-card-body">
          {hasParents && (
            <div className="inv-parents">
              <Parent person={groom} />
              <div className="inv-parents-divider" />
              <Parent person={bride} />
            </div>
          )}

          {announcement && <div className="inv-announce">{announcement}</div>}

          <div className="inv-couple">
            <h3 className="inv-couple-name">{groom.fullName}</h3>
            <div className="inv-couple-sub">{groom.subtitle}</div>
            <div className="inv-couple-amp">&amp;</div>
            <h3 className="inv-couple-name">{bride.fullName}</h3>
            <div className="inv-couple-sub">{bride.subtitle}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
