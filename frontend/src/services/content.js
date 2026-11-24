// Domain service layer: tries the PHP REST API first, falls back to the
// separated mock data layer when the API is unreachable (endpoints not yet
// deployed) so every page stays functional during development.
import {
  settingsApi, pagesApi, newsApi, categoriesApi, leadershipApi, policiesApi,
  manifestoApi, eventsApi, galleryApi, videosApi, searchApi, heroApi,
} from './api'
import {
  mockNews, mockLeadership, mockPolicies, mockPolicyCategories,
  mockManifesto, mockAlbums, mockGalleryImages, mockVideos, mockPages,
  mockSettings, mockHeroBanner, pickLang,
} from '../data/mock'

const apiDown = (e) => {
  // Treat network errors, 404 (endpoint missing) and 5xx as "use mock"
  if (!e.response) return true
  const s = e.response.status
  return s === 404 || s >= 500
}

const localized = (item, lang) => {
  // Flatten {en,si,ta} translation objects into plain strings for the active language.
  const out = { ...item }
  for (const [k, v] of Object.entries(item)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = pickLang(v, lang)
  }
  return out
}

const list = (arr) => (Array.isArray(arr) ? arr : arr?.items || [])

// ---------------- News ----------------
export async function getNews({ lang = 'en', page = 1, limit = 12, category, type, q, featured } = {}) {
  try {
    const params = { lang, page, limit }
    if (category) params.category = category
    if (type) params.type = type
    if (q) params.q = q
    if (featured !== undefined) params.featured = featured
    const data = await newsApi.list(params)
    return { items: list(data).map(i => localized(i, lang)), pagination: data?.pagination || null, source: 'api' }
  } catch (e) {
    if (!apiDown(e)) throw e
    let items = mockNews.map(i => localized(i, lang))
    if (type) items = items.filter(i => i.type === type)
    if (category) items = items.filter(i => i.categorySlug === category || i.category === category)
    if (featured !== undefined) items = items.filter(i => !!i.isFeatured === !!featured)
    if (q) items = items.filter(i => (i.title + i.excerpt).toLowerCase().includes(q.toLowerCase()))
    const start = (page - 1) * limit
    return { items: items.slice(start, start + limit), pagination: { page, limit, total: items.length }, source: 'mock' }
  }
}

export async function getNewsItem(idOrSlug, lang = 'en') {
  try {
    const item = await newsApi.get(idOrSlug, lang)
    return localized(item, lang)
  } catch (e) {
    if (!apiDown(e)) throw e
    const found = mockNews.find(i => String(i.id) === String(idOrSlug) || i.slug === idOrSlug)
    if (!found) throw new Error('not found')
    return localized(found, lang)
  }
}

// ---------------- Events ----------------
export async function getEvents({ lang = 'en', upcoming = true, homepage = false } = {}) {
  try {
    const data = await eventsApi.list({ lang, upcoming: upcoming ? 1 : 0, ...(homepage ? { homepage: 1 } : {}) })
    return { items: list(data).map(i => localized(i, lang)), source: 'api' }
  } catch (e) {
    if (!apiDown(e)) throw e
    return { items: [], source: 'unavailable' }
  }
}

export async function getEvent(idOrSlug, lang = 'en') {
  try {
    const item = await eventsApi.get(idOrSlug, lang)
    return localized(item, lang)
  } catch (e) {
    if (!apiDown(e)) throw e
    throw new Error('Event information is temporarily unavailable')
  }
}

// Registration always goes to the real API (no mock fallback: a registration that is not stored in MySQL
// must never look successful). Kept for older callers; new code uses services/registrationService.js.
export async function registerForEvent(eventId, payload) {
  const { registerAttendee } = await import('./registrationService')
  return registerAttendee(eventId, {
    fullName: payload.fullName ?? payload.name, email: payload.email, phone: payload.phone,
    organization: payload.organization, designation: payload.designation,
  })
}

// ---------------- Leadership ----------------
// No mock fallback here: the public site must only ever show profiles an admin
// has Published in Leadership Management.
export async function getLeadership(lang = 'en') {
  const data = await leadershipApi.list(lang)
  return list(data).map(i => localized(i, lang))
}

export async function getLeadershipMeta() {
  return leadershipApi.meta()
}

export async function getLeader(idOrSlug, lang = 'en') {
  const item = await leadershipApi.get(idOrSlug, lang)
  return localized(item, lang)
}

// ---------------- Policies & Manifesto ----------------
export async function getPolicyCategories(lang = 'en') {
  try {
    const data = await policiesApi.categories(lang)
    return list(data)
  } catch (e) {
    if (!apiDown(e)) throw e
    return mockPolicyCategories
  }
}

export async function getPolicies({ lang = 'en', category } = {}) {
  try {
    const data = await policiesApi.list({ lang, category })
    return { items: list(data).map(i => localized(i, lang)), source: 'api' }
  } catch (e) {
    if (!apiDown(e)) throw e
    let items = mockPolicies.map(i => localized(i, lang))
    if (category) items = items.filter(i => i.categorySlug === category)
    return { items, source: 'mock' }
  }
}

export async function getPolicy(idOrSlug, lang = 'en') {
  try {
    const item = await policiesApi.get(idOrSlug, lang)
    return localized(item, lang)
  } catch (e) {
    if (!apiDown(e)) throw e
    const found = mockPolicies.find(i => String(i.id) === String(idOrSlug) || i.slug === idOrSlug)
    if (!found) throw new Error('not found')
    return localized(found, lang)
  }
}

export async function getManifesto(lang = 'en') {
  try {
    const data = await manifestoApi.list(lang)
    return list(data).map(i => localized(i, lang))
  } catch (e) {
    if (!apiDown(e)) throw e
    return mockManifesto.map(i => localized(i, lang))
  }
}

// ---------------- Gallery & Videos ----------------
export async function getAlbums(lang = 'en') {
  try {
    const data = await galleryApi.albums(lang)
    return list(data).map(i => localized(i, lang))
  } catch (e) {
    if (!apiDown(e)) throw e
    return mockAlbums.map(i => localized(i, lang))
  }
}

export async function getAlbumImages(albumId, lang = 'en') {
  try {
    const data = await galleryApi.images(albumId, lang)
    return list(data).map(i => localized(i, lang))
  } catch (e) {
    if (!apiDown(e)) throw e
    return mockGalleryImages.filter(i => i.albumId === Number(albumId)).map(i => localized(i, lang))
  }
}

export async function getVideos(lang = 'en') {
  try {
    const data = await videosApi.list(lang)
    return list(data).map(i => localized(i, lang))
  } catch (e) {
    if (!apiDown(e)) throw e
    return mockVideos.map(i => localized(i, lang))
  }
}

// ---------------- Hero banner ----------------
export async function getHeroBanner(lang = 'en') {
  try {
    const data = await heroApi.active(lang)
    if (!data) return localized(mockHeroBanner, lang)
    return localized(data, lang)
  } catch (e) {
    if (!apiDown(e)) throw e
    return localized(mockHeroBanner, lang)
  }
}

// ---------------- Pages & Settings ----------------
export async function getPages(lang = 'en') {
  try {
    const data = await pagesApi.list(lang)
    return list(data).map(i => localized(i, lang))
  } catch (e) {
    if (!apiDown(e)) throw e
    return Object.values(mockPages).map(p => ({ slug: p.slug, title: pickLang(p.title, lang) }))
  }
}

export async function getPage(slug, lang = 'en') {
  try {
    const item = await pagesApi.get(slug, lang)
    return localized(item, lang)
  } catch (e) {
    if (!apiDown(e)) throw e
    const found = Object.values(mockPages).find(p => p.slug === slug)
    if (!found) throw new Error('not found')
    return { slug: found.slug, title: pickLang(found.title, lang), content: pickLang(found.content, lang) }
  }
}

export async function getSettings(lang = 'en') {
  try {
    const data = await settingsApi.get(lang)
    return localized(data || {}, lang)
  } catch (e) {
    if (!apiDown(e)) throw e
    const s = { ...mockSettings }
    s.contact = { ...mockSettings.contact, address: pickLang(mockSettings.contact.address, lang) }
    s.announcement = { ...mockSettings.announcement, text: pickLang(mockSettings.announcement.text, lang) }
    return s
  }
}

// ---------------- Forms (POST) ----------------
export async function submitMembership(payload, photo) {
  try {
    const { membersApi } = await import('./api')
    return await membersApi.register(payload, photo)
  } catch (e) {
    if (!apiDown(e)) {
      const msg = e.response?.data?.error || e.message
      const err = new Error(msg); err.status = e.response?.status; throw err
    }
    if (payload.email === 'duplicate@example.com') {
      const err = new Error('duplicate'); err.status = 409; throw err
    }
    return { success: true, mock: true }
  }
}

export async function sendContactMessage(payload) {
  try {
    const { messagesApi } = await import('./api')
    return await messagesApi.send(payload)
  } catch (e) {
    if (!apiDown(e)) throw e
    return { success: true, mock: true }
  }
}

export async function subscribeNewsletter(payload) {
  try {
    const { newsletterApi } = await import('./api')
    return await newsletterApi.subscribe(payload)
  } catch (e) {
    if (!apiDown(e)) throw e
    return { success: true, mock: true }
  }
}

// ---------------- Search ----------------
export async function globalSearch(q, lang = 'en', type = 'all') {
  try {
    const data = await searchApi.query(q, lang, type)
    return list(data)
  } catch (e) {
    if (!apiDown(e)) throw e
    const needle = q.toLowerCase()
    const match = (s) => String(s || '').toLowerCase().includes(needle)
    const results = []
    mockNews.filter(n => match(n.title.en) || match(n.excerpt.en))
      .forEach(n => results.push({ type: 'news', id: n.id, slug: n.slug, title: pickLang(n.title, lang), excerpt: pickLang(n.excerpt, lang), url: `/news/${n.slug}`, date: n.date, image: n.image }))
    mockLeadership.filter(l => match(l.name.en) || match(l.position.en)).forEach(l =>
      results.push({ type: 'leadership', id: l.id, slug: l.slug, title: pickLang(l.name, lang), excerpt: pickLang(l.position, lang), url: `/leadership/${l.slug}`, image: l.image }))
    mockPolicies.filter(p => match(p.title.en) || match(p.summary.en)).forEach(p =>
      results.push({ type: 'policies', id: p.id, slug: p.slug, title: pickLang(p.title, lang), excerpt: pickLang(p.summary, lang), url: `/policies/${p.slug}`, image: p.image }))
    Object.values(mockPages).filter(p => match(p.title.en)).forEach(p =>
      results.push({ type: 'pages', id: p.slug, slug: p.slug, title: pickLang(p.title, lang), excerpt: '', url: `/${p.slug === 'vision' ? 'about/vision-mission' : p.slug === 'history' ? 'about/history' : p.slug === 'constitution' ? 'about/constitution' : p.slug}`, image: null }))
    return type === 'all' ? results : results.filter(r => r.type === type)
  }
}
