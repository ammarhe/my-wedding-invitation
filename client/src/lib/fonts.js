// Font choices for the invitation. Body drives --font-arabic (most text on the page),
// heading drives --font-display (the large names). Both can be a curated Google Font or a
// custom font file the admin uploaded. Fonts load lazily via loadFonts().

// Google Fonts that render Arabic well — safe for the RTL body text.
export const BODY_FONTS = [
  'Amiri',
  'Cairo',
  'Tajawal',
  'Almarai',
  'El Messiri',
  'Reem Kufi',
  'Markazi Text',
  'Noto Naskh Arabic',
  'Noto Kufi Arabic',
  'IBM Plex Sans Arabic',
  'Changa',
  'Mada',
  'Lateef',
  'Scheherazade New',
]

// Display faces for the big names (mix of Arabic display + Latin).
export const HEADING_FONTS = [
  'Viaoda Libre',
  'Aref Ruqaa',
  'Rakkas',
  'Lalezar',
  'Amiri',
  'Reem Kufi',
  'El Messiri',
  'Gulzar',
  'Cormorant Garamond',
]

const GOOGLE = new Set([...BODY_FONTS, ...HEADING_FONTS])

export function googleCssUrl(family) {
  const name = family.trim().replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${name}:ital,wght@0,400;0,700;1,400&display=swap`
}

function ensureLink(id, href) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id)
  if (el) {
    if (el.getAttribute('href') !== href) el.setAttribute('href', href)
    return
  }
  el = document.createElement('link')
  el.id = id
  el.rel = 'stylesheet'
  el.href = href
  document.head.appendChild(el)
}

function faceFormat(url) {
  if (/\.woff2(\?|$)/i.test(url)) return 'woff2'
  if (/\.woff(\?|$)/i.test(url)) return 'woff'
  if (/\.otf(\?|$)/i.test(url)) return 'opentype'
  return 'truetype'
}

function ensureFace(family, url) {
  if (typeof document === 'undefined' || !family || !url) return
  const css = `@font-face{font-family:'${family}';src:url('${url}') format('${faceFormat(url)}');font-display:swap;}`
  let el = document.getElementById('font-custom')
  if (el) {
    if (el.textContent !== css) el.textContent = css
    return
  }
  el = document.createElement('style')
  el.id = 'font-custom'
  el.textContent = css
  document.head.appendChild(el)
}

// Inject <link>/@font-face for whatever the chosen fonts need. Safe to call repeatedly.
export function loadFonts(fonts = {}) {
  ;[fonts.body, fonts.heading].filter(Boolean).forEach((f) => {
    if (GOOGLE.has(f)) ensureLink(`gf-${f.replace(/\s+/g, '-')}`, googleCssUrl(f))
  })
  if (fonts.customName && fonts.customUrl) ensureFace(fonts.customName, fonts.customUrl)
}

// Build a CSS font-family stack for a chosen family, keeping sensible fallbacks.
export function fontStack(family, fallback) {
  return family ? `'${family}', ${fallback}` : fallback
}
