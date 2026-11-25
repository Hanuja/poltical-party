import { api } from '../../services/api'

// Join Us endpoints (backend/api/members/index.php). Errors are normalised to
// { status, message, code, fields, field } so the form can map them onto inputs.
const BASE = '/members/'

function normalise(e) {
  const res = e?.response
  const err = new Error(res?.data?.error || e?.message || 'error')
  err.status = res?.status || 0
  err.code = res?.data?.data?.code || (res ? 'http' : 'network')
  err.fields = res?.data?.data?.fields || null
  err.field = res?.data?.data?.field || null
  return err
}

async function call(method, action, { params, data, headers, onUploadProgress } = {}) {
  try {
    const res = await api.request({ method, url: BASE, params: { action, ...params }, data, headers, onUploadProgress })
    if (!res.data?.success) throw Object.assign(new Error(res.data?.error || 'error'), { response: res })
    return res.data.data
  } catch (e) {
    throw normalise(e)
  }
}

export const memApi = {
  page: (lang) => call('get', 'page', { params: { lang } }),
  approvedCount: () => call('get', 'count'),
  downloadFormUrl: () => `${api.defaults.baseURL || ''}${BASE}?action=download-form`,
  apply: (data, photo) => {
    const fd = new FormData()
    fd.append('data', JSON.stringify(data))
    if (photo) fd.append('photo', photo)
    return call('post', 'apply', { data: fd, headers: { 'Content-Type': 'multipart/form-data' } })
  },
  applyPdf: (data, pdf, photo, supporting = [], onUploadProgress) => {
    const fd = new FormData()
    fd.append('fullName', data.fullName)
    fd.append('nic', data.nic)
    fd.append('phone', data.phone)
    fd.append('email', data.email || '')
    fd.append('districtId', data.districtId)
    fd.append('language', data.language)
    fd.append('pdf', pdf)
    if (photo) fd.append('photo', photo)
    supporting.forEach((file) => fd.append('supporting[]', file))
    return call('post', 'apply-pdf', {
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  },
  track: (reference, email) => call('post', 'track', { data: { reference, email } }),
  saveDraft: (payload) => call('post', 'draft-save', { data: payload }),
  loadDraft: (code, email) => call('post', 'draft-load', { data: { code, email } }),
}
