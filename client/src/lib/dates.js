export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]
export const AR_DAYS_FULL = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
// Monday-first short labels, as on the reference calendar
export const AR_DAYS_SHORT_MON_FIRST = ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح']

export function parseLocalDate(dateStr, timeStr = '00:00') {
  // dateStr: YYYY-MM-DD, timeStr: HH:mm  -> Date in the viewer's local time
  const [y, m, d] = (dateStr || '').split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}

export function format12h(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`
}

export function countdownParts(target, now = new Date()) {
  let diff = Math.max(0, Math.floor((target - now) / 1000))
  const days = Math.floor(diff / 86400)
  diff -= days * 86400
  const hours = Math.floor(diff / 3600)
  diff -= hours * 3600
  const minutes = Math.floor(diff / 60)
  const seconds = diff - minutes * 60
  return { days, hours, minutes, seconds, done: target - now <= 0 }
}

export function countdownText({ days, hours, minutes, seconds }) {
  return `${days} يوم ${hours} ساعة ${minutes} دقيقة ${seconds} ثانية`
}

// Google Calendar link. Times are interpreted in the event timezone via the ctz parameter.
export function googleCalendarUrl({ title, details, location, date, startTime, endTime, timezone }) {
  const compact = (d, t) => `${d.replace(/-/g, '')}T${(t || '00:00').replace(':', '')}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || '',
    dates: `${compact(date, startTime)}/${compact(date, endTime || startTime)}`,
    details: details || '',
    location: location || '',
  })
  if (timezone) params.set('ctz', timezone)
  return `https://www.google.com/calendar/render?${params.toString()}`
}

// .ics file content for Apple / Outlook calendars
export function icsContent({ title, details, location, date, startTime, endTime }) {
  const stamp = (d, t) => `${d.replace(/-/g, '')}T${(t || '00:00').replace(':', '')}00`
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//wedding-invitation//AR',
    'BEGIN:VEVENT',
    `UID:${date}-${Math.random().toString(36).slice(2)}@wedding`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    `DTSTART:${stamp(date, startTime)}`,
    `DTEND:${stamp(date, endTime || startTime)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(details)}`,
    `LOCATION:${esc(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function directionsUrl(query) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query || '')}`
}

export function mapEmbedUrl(venue) {
  if (venue?.mapEmbedUrl) return venue.mapEmbedUrl
  const q = venue?.mapQuery || venue?.name || ''
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&hl=ar&output=embed`
}
