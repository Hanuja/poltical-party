import axios from 'axios'

// API base URL is configurable via .env (VITE_API_BASE_URL).
// Dev default '/api' is proxied by Vite to the WAMP PHP backend.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Unwrap the { success, data, error } envelope.
export async function get(path, params = {}) {
  const res = await api.get(path, { params })
  if (!res.data?.success) throw new Error(res.data?.error || 'Request failed')
  return res.data.data
}

export async function post(path, body = {}) {
  const res = await api.post(path, body)
  if (!res.data?.success) throw new Error(res.data?.error || 'Request failed')
  return res.data.data
}

// ---------- Public content endpoints ----------
export const settingsApi = {
  get: (lang) => get('/settings/public/', { lang }),
}

export const pagesApi = {
  list: (lang) => get('/pages/', { lang, status: 'published' }),
  get: (slug, lang) => get(`/pages/${encodeURIComponent(slug)}`, { lang }),
}

export const newsApi = {
  list: (params = {}) => get('/news/', params),
  get: (idOrSlug, lang) => get(`/news/${encodeURIComponent(idOrSlug)}`, { lang }),
}

export const categoriesApi = {
  list: (type, lang) => get('/categories/', { type, lang }),
}

export const leadershipApi = {
  // The API only ever returns Published profiles on these public calls.
  list: (lang) => get('/leadership/', { lang }),
  get: (idOrSlug, lang) => get('/leadership/', { slug: idOrSlug, lang }),
  // Provinces (all nine) and their districts with en/ta/si labels, for the public filters.
  meta: () => get('/leadership/', { meta: 1, scope: 'all' }),
}

export const policiesApi = {
  list: (params = {}) => get('/policies/', params),
  categories: (lang) => get('/policy-categories/', { lang }),
  get: (idOrSlug, lang) => get(`/policies/${encodeURIComponent(idOrSlug)}`, { lang }),
}

export const manifestoApi = {
  list: (lang) => get('/manifesto/', { lang }),
}

export const eventsApi = {
  list: (params = {}) => get('/events/', params),
  // Query-string form: /events/{slug} has no Apache rewrite and returned 404 (page fell back to mock data).
  get: (idOrSlug, lang) => get('/events/', { slug: idOrSlug, lang }),
  register: (eventId, payload) => post(`/events/${eventId}/register`, payload),
}

export const galleryApi = {
  albums: (lang) => get('/gallery/albums/', { lang }),
  images: (albumId, lang) => get(`/gallery/albums/${albumId}/images`, { lang }),
}

export const videosApi = {
  list: (lang) => get('/videos/', { lang }),
}

export const membersApi = {
  register: (payload, photo) => {
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''))
    if (photo) fd.append('photo', photo)
    return api.post('/members/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => r.data)
  },
}

export const messagesApi = {
  send: (payload) => post('/messages/', payload),
}

export const publicVoiceApi = {
  list: (params = {}) => get('/public-voice/', params),
  get: (id) => get('/public-voice/', { id }),
  submit: (formData, onUploadProgress) => api.post('/public-voice/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress,
  }).then((response) => {
    if (!response.data?.success) throw new Error(response.data?.error || 'Unable to submit concern')
    return response.data.data
  }),
}

export const newsletterApi = {
  subscribe: (payload) => post('/newsletter/?action=subscribe', payload),
  unsubscribe: (token) => post('/newsletter/?action=unsubscribe', { token }),
}

export const heroApi = {
  active: (lang) => get('/hero/', { lang }),
  // Admin management (requires auth token — set by admin app later)
  adminList: () => get('/hero/', { all: 1 }),
  create: (payload) => api.post('/hero/', payload).then(r => r.data),
  update: (id, payload) => api.put(`/hero/?id=${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/hero/?id=${id}`).then(r => r.data),
}

export const searchApi = {
  query: (q, lang, type) => get('/search/', { q, lang, type }),
}

// Announcements. The backend decides what each viewer may see (Party announcements are returned only to
// authorised members/staff), so the client never filters for permissions itself.
//   list params: { lang, category (slug), type, q, from, to, sort: newest|oldest|featured, homepage, page, limit }
//   → { items, total, page, limit, pages, counts: { all, categories: {slug: n}, types? }, subTypes: [] }
export const announcementsApi = {
  list: (params = {}) => get('/announcements/', params),
  homepage: (lang, params = {}) => get('/announcements/', { homepage: 1, sort: 'featured', limit: 4, lang, ...params }),
  breaking: (lang, limit = 5) => get('/announcements/', { breaking: 1, lang, limit }),
  get: (slug, lang) => get('/announcements/', { slug, lang }),
  related: (id, lang, limit = 3) => get('/announcements/', { related: id, lang, limit }),
  categories: () => get('/announcements/', { categories: 1 }),
  // Attachments are permission-checked downloads; fetch them through the client so auth travels with them.
  download: async (path, filename) => {
    const res = await api.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || ''
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  },
}

// Send the signed-in user's token (if the site has one) so the API can apply their access rights.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('pp_token') || sessionStorage.getItem('pp_token')
    if (token && !config.headers?.Authorization) config.headers.Authorization = `Bearer ${token}`
  } catch { /* storage unavailable */ }
  return config
})
