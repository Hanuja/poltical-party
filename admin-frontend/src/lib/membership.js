import api from './api';

// Admin side of the Join Us workflow (backend/api/members/index.php, Super Admin / Admin only).
const unwrap = (p) => p.then((r) => r.data.data).catch((e) => {
  const err = new Error(e.response?.data?.error || e.message || 'Request failed');
  err.status = e.response?.status || 0;
  err.fields = e.response?.data?.data?.fields || null;
  err.code = e.response?.data?.data?.code || null;
  throw err;
});
const get = (action, params = {}) => unwrap(api.get('/members/', { params: { action, ...params } }));
const post = (action, data, config) => unwrap(api.post('/members/', data, { params: { action }, ...config }));

export const membershipApi = {
  list: (params) => get('list', params),
  detail: (id) => get('detail', { id }),
  photoBlob: (id) => api.get('/members/', { params: { action: 'photo', id }, responseType: 'blob' }).then((r) => r.data),
  decide: (id, decision, reason = '') => post('decide', { id, decision, reason }),
  resendEmail: (id, template) => post('resend-email', { id, template }),
  settings: () => get('settings'),
  saveSettings: (settings) => post('settings', { settings }),
  saveTemplates: (templates) => post('templates', { templates }),
  uploadImage: (slot, file) => {
    const fd = new FormData();
    fd.append('slot', slot);
    fd.append('file', file);
    return post('upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  previewEmail: (template, lang, draft) => post('email-preview', { template, lang, ...(draft || {}) }),
  viewEmail: (id) => get('email-view', { id }),
};

export const notificationsApi = {
  list: () => unwrap(api.get('/notifications/')),
  count: () => unwrap(api.get('/notifications/', { params: { count: 1 } })),
  read: (id) => unwrap(api.post('/notifications/', { id }, { params: { action: 'read' } })),
  readAll: () => unwrap(api.post('/notifications/', {}, { params: { action: 'read-all' } })),
};

export const STATUS = {
  pending: { label: 'Received', tone: 'received' },
  under_review: { label: 'Under review', tone: 'review' },
  verified: { label: 'Approved', tone: 'approved' },
  rejected: { label: 'Declined', tone: 'declined' },
  suspended: { label: 'Suspended', tone: 'declined' },
  expired: { label: 'Expired', tone: 'declined' },
};

export const INTERESTS = {
  youth_wing: 'Youth Wing', womens_wing: "Women's Wing", community_outreach: 'Community Outreach', social_welfare: 'Social Welfare',
  education: 'Education', policy_research: 'Policy & Research', digital_media: 'Digital Media', volunteer: 'Volunteer Activities',
};
export const GENDERS = { female: 'Female', male: 'Male', other: 'Other', prefer_not: 'Prefer not to say' };
export const CITIZENSHIP = { sri_lankan: 'Sri Lankan citizen', dual: 'Dual citizen' };
export const TEMPLATE_LABELS = { received: 'Application received', approved: 'Membership approved', declined: 'Application declined' };
export const EMAIL_STATUS = {
  sent: 'Sent', queued: 'Sending', failed: 'Failed', not_configured: 'Not sent — no mail server configured',
};

export function fmtDateTime(v) {
  if (!v) return '—';
  const d = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '—'
    : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
