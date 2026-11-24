import api from './api'

const unwrap = (request) => request.then((response) => response.data.data).catch((error) => {
  const next = new Error(error.response?.data?.error || error.message || 'Request failed')
  next.status = error.response?.status || 0
  throw next
})
const get = (action, params = {}) => unwrap(api.get('/public-voice/', { params: { action, ...params } }))
const post = (action, id, body) => unwrap(api.post('/public-voice/', body, { params: { action, id } }))

export const publicVoiceAdminApi = {
  list: (params = {}) => get('admin-list', params),
  detail: (id) => get('admin-detail', { id }),
  media: (id) => api.get('/public-voice/', { params: { action: 'media', id }, responseType: 'blob' }).then((response) => response.data),
  review: (id, status, note = '', publicResponse = '') => post('review', id, { status, note, publicResponse }),
  updatePublic: (id, values) => post('update-public', id, values),
  updateMedia: (id, media) => post('media-permissions', id, { media }),
}

export const PUBLIC_VOICE_STATUSES = {
  pending_review: { label: 'Pending review', tone: 'pending' },
  under_review: { label: 'Under review', tone: 'review' },
  more_info_requested: { label: 'More information requested', tone: 'info' },
  approved: { label: 'Approved', tone: 'approved' },
  published: { label: 'Published', tone: 'published' },
  rejected: { label: 'Rejected', tone: 'rejected' },
}

export const PUBLIC_VOICE_CATEGORIES = {
  roads: 'Road & Transportation Problems', water: 'Water Supply Problems', electricity: 'Electricity Problems',
  drainage: 'Drainage & Sanitation', waste: 'Waste Management', education: 'Education & School Facilities',
  healthcare: 'Healthcare & Hospital Facilities', agriculture: 'Agricultural Problems', employment: 'Employment & Livelihood',
  housing: 'Housing & Land Issues', infrastructure: 'Public Infrastructure', environment: 'Environmental Problems',
  'public-service': 'Public Service Issues', 'village-development': 'Village Development', safety: "Women's & Children's Safety", other: 'Other Community Problems',
}

export function publicVoiceDate(value) {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
