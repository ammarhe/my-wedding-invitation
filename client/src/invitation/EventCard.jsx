import { useEffect, useMemo, useState } from 'react'
import {
  AR_DAYS_FULL,
  AR_DAYS_SHORT_MON_FIRST,
  AR_MONTHS,
  countdownParts,
  countdownText,
  format12h,
  googleCalendarUrl,
  icsContent,
  parseLocalDate,
} from '../lib/dates.js'
import { CalendarIcon, CardChrome, Flower, HeartDay } from './pieces.jsx'

function Countdown({ target, label }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!target) return null
  const parts = countdownParts(target, now)
  return (
    <div className="inv-countdown">
      <h2>{label}</h2>
      <p>{parts.done ? 'اليوم هو يوم الفرح!' : countdownText(parts)}</p>
    </div>
  )
}

function MonthCalendar({ date }) {
  const cells = useMemo(() => {
    if (!date) return []
    const y = date.getFullYear()
    const m = date.getMonth()
    const first = new Date(y, m, 1)
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    // Monday-first offset (JS: Sunday = 0)
    const offset = (first.getDay() + 6) % 7
    const out = []
    for (let i = 0; i < offset; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(d)
    return out
  }, [date])

  if (!date) return null
  return (
    <div className="inv-cal-wrap">
      <div className="inv-cal">
        <div className="inv-cal-title">
          <span className="ar">{AR_MONTHS[date.getMonth()]}</span> {date.getFullYear()}
        </div>
        <div className="inv-cal-head">
          {AR_DAYS_SHORT_MON_FIRST.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="inv-cal-grid">
          {cells.map((d, i) => (
            <div className="inv-cal-cell" key={i}>
              {d === null ? null : d === date.getDate() ? <HeartDay day={d} /> : <span>{d}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EventCard({ content }) {
  const { event, venue, theme } = content
  const start = parseLocalDate(event.date, event.startTime)

  const calUrl = googleCalendarUrl({
    title: event.calendarTitle,
    details: event.calendarDetails,
    location: venue.name,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    timezone: event.timezone,
  })

  const downloadIcs = () => {
    const blob = new Blob(
      [
        icsContent({
          title: event.calendarTitle,
          details: event.calendarDetails,
          location: venue.name,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
        }),
      ],
      { type: 'text/calendar;charset=utf-8' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'wedding.ics'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      URL.revokeObjectURL(a.href)
      a.remove()
    }, 500)
  }

  return (
    <section className="inv-section inv-section--event">
      {theme.flowers && <Flower className="inv-flower--event" />}
      <div className="inv-card inv-card--event">
        <CardChrome paper={theme.paperTexture} />
        <div className="inv-card-body">
          <h2 className="inv-card-title">{event.title}</h2>

          <div className="inv-event">

            {start && (
              <>
                
                <h3 className="inv-event-sub">{event.subtitle}</h3>

                <div className="inv-event-date">
                  <span className="inv-event-day">{start.getDate()}</span>
                  <div className="inv-event-vline" />
                  <div className="inv-event-my">
                    <span className="inv-event-month">{AR_MONTHS[start.getMonth()]}</span>
                    <span className="inv-event-year">{start.getFullYear()}</span>
                  </div>
                </div>
              <div className="inv-event-daytime">
                  <span>{AR_DAYS_FULL[start.getDay()]}</span>
                  <span className="ltr">{format12h(event.startTime)}</span>
                </div>
                <h3 className="inv-event-sub">{event.saysorry}</h3>
                

                {event.showCountdown && <Countdown target={start} label={event.countdownLabel} />}
                {event.showCalendar && <MonthCalendar date={start} />}

                <div className="inv-cal-links">
                  <a className="inv-cal-link" href={calUrl} target="_blank" rel="noreferrer">
                    <CalendarIcon /> {event.calendarLabel}
                  </a>
                  <button type="button" className="inv-cal-link" onClick={downloadIcs}>
                    ملف iCal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
