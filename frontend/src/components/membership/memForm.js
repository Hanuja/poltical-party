// Form state + client-side validation for the 5-step application. The server re-validates
// everything (backend/api/members/index.php → mem_validate_application); these rules mirror it.

export const EMPTY_FORM = {
  fullName: '', dateOfBirth: '', gender: '',
  residentialAddress: '', mailingSame: true, mailingAddress: '',
  provinceId: '', districtId: '', divisionId: '', phone: '', email: '',
  nic: '', citizenship: '', eligible: false,
  occupation: '', interests: [], previousMember: null, previousOrganisation: '',
  declarations: { rules: false, constitution: false, conduct: false, privacy: false, declaration: false },
  signature: '',
}

// Which step each field lives on (used to jump to the first server-side error).
export const FIELD_STEP = {
  fullName: 1, dateOfBirth: 1, gender: 1, photo: 1,
  residentialAddress: 2, mailingAddress: 2, provinceId: 2, districtId: 2, divisionId: 2, phone: 2, email: 2,
  nic: 3, citizenship: 3, eligible: 3,
  occupation: 4, interests: 4, previousMember: 4, previousOrganisation: 4,
  signature: 5,
}
export const stepOfField = (f) => FIELD_STEP[f] || (f.startsWith('declarations.') ? 5 : 1)

export const DECLARATION_KEYS = ['rules', 'constitution', 'conduct', 'privacy', 'declaration']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[\p{L}\p{M}\s.'-]+$/u

export function ageFrom(dob) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || '')) return null
  const [y, m, d] = dob.split('-').map(Number)
  const birth = new Date(y, m - 1, d)
  if (Number.isNaN(birth.getTime()) || birth.getMonth() !== m - 1) return null
  const now = new Date()
  if (birth > now) return -1
  let age = now.getFullYear() - y
  if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d)) age -= 1
  return age
}

export const normNic = (v) => String(v || '').replace(/\s+/g, '').toUpperCase()
export const normPhone = (v) => String(v || '').replace(/[\s\-().]/g, '')
const normName = (v) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase()

function nicYear(nic) {
  let m = /^(\d{2})\d{7}[VX]$/.exec(nic)
  if (m) return 1900 + Number(m[1])
  m = /^(\d{4})\d{8}$/.exec(nic)
  return m ? Number(m[1]) : null
}

/** Returns { field: errorCode } for one step. */
export function validateStep(step, f, { minAge = 18, requirePhoto = false, photo = null } = {}) {
  const e = {}
  if (step === 1) {
    const name = f.fullName.trim()
    if (name.length < 3) e.fullName = 'required'
    else if (!NAME_RE.test(name)) e.fullName = 'nameInvalid'
    const age = ageFrom(f.dateOfBirth)
    if (!f.dateOfBirth) e.dateOfBirth = 'required'
    else if (age === null || age < 0 || age > 120) e.dateOfBirth = 'invalid'
    else if (age < minAge) e.dateOfBirth = 'too_young'
    if (requirePhoto && !photo) e.photo = 'required'
  }
  if (step === 2) {
    if (f.residentialAddress.trim().length < 5) e.residentialAddress = 'required'
    if (!f.mailingSame && f.mailingAddress.trim().length < 5) e.mailingAddress = 'required'
    if (!f.provinceId) e.provinceId = 'required'
    if (!f.districtId) e.districtId = 'required'
    if (!f.divisionId) e.divisionId = 'required'
    if (!/^\+?\d{9,15}$/.test(normPhone(f.phone))) e.phone = f.phone ? 'phone' : 'required'
    if (!EMAIL_RE.test(f.email.trim())) e.email = f.email ? 'email' : 'required'
  }
  if (step === 3) {
    const nic = normNic(f.nic)
    const y = nicYear(nic)
    if (!nic) e.nic = 'required'
    else if (!y) e.nic = 'nic'
    else if (/^\d{4}-/.test(f.dateOfBirth) && y !== Number(f.dateOfBirth.slice(0, 4))) e.nic = 'dob_mismatch'
    if (!f.citizenship) e.citizenship = 'required'
    if (!f.eligible) e.eligible = 'required'
  }
  if (step === 4) {
    if (f.occupation.trim().length < 2) e.occupation = 'required'
    if (f.previousMember === null) e.previousMember = 'required'
    if (f.previousMember && f.previousOrganisation.trim().length < 2) e.previousOrganisation = 'required'
  }
  if (step === 5) {
    DECLARATION_KEYS.forEach((k) => { if (!f.declarations[k]) e[`declarations.${k}`] = 'required' })
    if (!f.signature.trim()) e.signature = 'required'
    else if (normName(f.signature) !== normName(f.fullName)) e.signature = 'mismatch'
  }
  return e
}

/** Payload sent to ?action=apply. Mailing address dropped when "same" is ticked. */
export function toPayload(f, language, draftCode) {
  return {
    ...f,
    fullName: f.fullName.trim(),
    nic: normNic(f.nic),
    phone: f.phone.trim(),
    email: f.email.trim(),
    mailingAddress: f.mailingSame ? '' : f.mailingAddress,
    previousMember: !!f.previousMember,
    previousOrganisation: f.previousMember ? f.previousOrganisation : '',
    provinceId: Number(f.provinceId) || 0,
    districtId: Number(f.districtId) || 0,
    divisionId: Number(f.divisionId) || 0,
    language,
    draftCode: draftCode || undefined,
  }
}

/** Restores a saved draft onto the empty form, ignoring unknown keys. */
export function fromDraft(data) {
  const out = { ...EMPTY_FORM, declarations: { ...EMPTY_FORM.declarations } }
  Object.keys(EMPTY_FORM).forEach((k) => {
    if (!(k in (data || {}))) return
    if (k === 'declarations') DECLARATION_KEYS.forEach((d) => { out.declarations[d] = !!data.declarations?.[d] })
    else if (k === 'interests') out.interests = Array.isArray(data.interests) ? data.interests.filter((x) => typeof x === 'string') : []
    else out[k] = data[k]
  })
  return out
}
