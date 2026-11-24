import api, { getToken } from './api';

export const LANG_CODES = ['en', 'ta', 'si'];
// Per-language content fields (each language stored separately for the same profile).
export const EMPTY_TR = {
  name: '', position: '', shortBio: '', bio: '', responsibilities: '',
  politicalExperience: '', previousPositions: '', achievements: '', officeBranch: '',
};

// Public Our People sections. Older position keys (organizer, mp, …) belong to Executive.
export const SECTION_KEYS = ['leader', 'general_secretary', 'deputy', 'executive'];
export const sectionOf = (positionKey) => (!positionKey ? '' : SECTION_KEYS.includes(positionKey) ? positionKey : 'executive');

export const emptyLeader = () => ({
  positionKey: '', province: '', district: '', appointmentDate: '',
  image: '', imageUrl: '',
  email: '', phone: '', facebook: '', twitter: '', instagram: '', youtube: '',
  displayOrder: 0,
  translations: { en: { ...EMPTY_TR }, ta: { ...EMPTY_TR }, si: { ...EMPTY_TR } },
});

export function fromApi(l) {
  const base = emptyLeader();
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (k === 'translations') continue;
    out[k] = l[k] ?? base[k];
  }
  out.translations = {
    en: { ...EMPTY_TR, ...(l.translations?.en || {}) },
    ta: { ...EMPTY_TR, ...(l.translations?.ta || {}) },
    si: { ...EMPTY_TR, ...(l.translations?.si || {}) },
  };
  return out;
}

export function toPayload(form) {
  // eslint-disable-next-line no-unused-vars
  const { imageUrl, ...rest } = form;
  return { ...rest, displayOrder: Number(form.displayOrder) || 0 };
}

export const langComplete = (t) => Boolean(t?.name?.trim() && t?.position?.trim());

// First non-empty value across languages, preferring `lang`.
export function pickTr(translations, field, lang = 'en') {
  for (const l of [lang, ...LANG_CODES]) {
    const v = translations?.[l]?.[field];
    if (v && String(v).trim()) return v;
  }
  return '';
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,19}$/;

// Temporary safety net if the network fails: the latest unsaved form is mirrored on this
// device until the database save succeeds. The database stays the source of truth.
const BACKUP_PREFIX = 'leader_unsaved_';
export const backup = {
  write(key, form) {
    try { localStorage.setItem(BACKUP_PREFIX + key, JSON.stringify({ at: Date.now(), form })); } catch { /* ignore */ }
  },
  read(key) {
    try { return JSON.parse(localStorage.getItem(BACKUP_PREFIX + key) || 'null'); } catch { return null; }
  },
  clear(key) {
    try { localStorage.removeItem(BACKUP_PREFIX + key); } catch { /* ignore */ }
  },
};

export function newProfileKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Positions / provinces / districts with en/ta/si labels — fetched once from the API.
let metaPromise = null;
export function loadMeta() {
  if (!metaPromise) {
    metaPromise = api.get('/leadership/?meta=1').then((r) => r.data.data).catch((e) => {
      metaPromise = null; throw e;
    });
  }
  return metaPromise;
}

export const labelOf = (list, key, lang = 'en') =>
  list?.find((x) => x.key === key)?.labels?.[lang] || '';

// Fire-and-forget save that survives page unload (refresh / tab close).
export function flushKeepalive(id, payload) {
  try {
    const url = id ? `/api/leadership/?id=${id}` : '/api/leadership/';
    fetch(url, {
      method: id ? 'PUT' : 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch { /* ignore */ }
}

export const leadershipApi = {
  list: (params) => api.get('/leadership/', { params: { all: 1, ...params } }).then((r) => r.data.data),
  get: (id) => api.get(`/leadership/?id=${id}`).then((r) => r.data.data),
  getByKey: (key) => api.get(`/leadership/?key=${encodeURIComponent(key)}`).then((r) => r.data.data),
  save: (id, payload) => (id
    ? api.put(`/leadership/?id=${id}`, payload)
    : api.post('/leadership/', payload)).then((r) => r.data.data),
  setStatus: (id, status) => api.post(`/leadership/?action=status&id=${id}`, { status }).then((r) => r.data.data),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/leadership/?action=upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },
  remove: (id) => api.delete(`/leadership/?id=${id}`).then((r) => r.data.data),
};
