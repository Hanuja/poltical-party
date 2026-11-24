export function formatDate(dateStr, locale = 'en-GB', opts = {}) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', ...opts })
}

export function formatDateTime(dateStr, timeStr) {
  const d = formatDate(dateStr)
  return timeStr ? `${d} · ${timeStr}` : d
}

export function readingTime(htmlOrText = '', wordsPerMinute = 200) {
  const text = String(htmlOrText).replace(/<[^>]*>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / wordsPerMinute))
}

export function timeAgo(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const m = Math.floor(secs / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24); if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}
