// Non-component helpers shared by the announcements views.

// Main filters (category slugs from announcement_categories). Sub-types exist only under Official
// Announcement and are offered only when the API says this viewer may use them (data.subTypes).
export const CATEGORY_FILTERS = ['all', 'official-announcements', 'public-notices', 'press-releases']
export const OFFICIAL = 'official-announcements'

const LOCALES = { en: 'en-GB', ta: 'ta-LK', si: 'si-LK' }

export function annDate(iso, language, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  try { return d.toLocaleDateString(LOCALES[language] || 'en-GB', opts) } catch { return d.toLocaleDateString() }
}

export function categoryLabel(t, category) {
  if (!category) return t('announcements.categories.general')
  return t(`announcements.categories.${category.slug}`, { defaultValue: category.name })
}

export function typeLabel(t, type) {
  return type ? t(`announcements.types.${type}`, { defaultValue: type }) : ''
}

export const annPath = (a) => `/announcements/${a.slug || a.id}`

// Motion presets — gentle rise/fade only. <MotionConfig reducedMotion="user"> wraps every page.
export const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } },
}
export const stagger = (gap = 0.09, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

// Keep only safe markup from admin-authored HTML; plain text becomes paragraphs.
const ALLOWED = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'A', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'BLOCKQUOTE',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'IMG', 'FIGURE', 'FIGCAPTION', 'SPAN', 'DIV', 'HR', 'SMALL', 'SUB', 'SUP'])
const ATTRS = { A: ['href', 'title'], IMG: ['src', 'alt', 'width', 'height'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan', 'scope'] }

export function sanitizeHtml(input) {
  const html = String(input || '').trim()
  if (!html) return ''
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.split(/\n{2,}/).map((p) => `<p>${p.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>')}</p>`).join('')
  }
  if (typeof DOMParser === 'undefined') return ''
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const walk = (node) => {
    [...node.children].forEach((el) => {
      if (!ALLOWED.has(el.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'TEMPLATE'].includes(el.tagName)) { el.remove(); return }
        walk(el)
        el.replaceWith(...el.childNodes)
        return
      }
      const keep = ATTRS[el.tagName] || []
      ;[...el.attributes].forEach((at) => { if (!keep.includes(at.name)) el.removeAttribute(at.name) })
      ;['href', 'src'].forEach((k) => {
        const v = el.getAttribute(k)
        if (v && !/^(https?:|mailto:|tel:|\/|#)/i.test(v.trim())) el.removeAttribute(k)
      })
      if (el.tagName === 'A' && /^https?:/i.test(el.getAttribute('href') || '')) {
        el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer')
      }
      if (el.tagName === 'IMG') el.setAttribute('loading', 'lazy')
      walk(el)
    })
  }
  const root = doc.body.firstElementChild
  walk(root)
  return root.innerHTML
}
