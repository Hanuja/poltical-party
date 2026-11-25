// SEO helpers: page titles, meta descriptions, Open Graph tags.
import i18n from '../i18n'
import { PARTY_NAMES } from '../config/branding'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function setPageSEO({ title, description, image, url } = {}) {
  const lang = (i18n.language || 'en').split('-')[0]
  const siteName = PARTY_NAMES[lang] || PARTY_NAMES.en
  const fullTitle = title && title !== siteName ? `${title} | ${siteName}` : siteName
  document.title = fullTitle
  if (description) {
    setMeta('name', 'description', description)
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:description', description)
  }
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:type', 'website')
  if (image) setMeta('property', 'og:image', image)
  if (url) {
    setMeta('property', 'og:url', url)
    setCanonical(url)
  }
}
