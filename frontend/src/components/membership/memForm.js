// Form state + client-side validation for the 7-section trilingual application.
// The server re-validates everything (backend/api/members/index.php → mem_validate_application);
// these rules mirror it.
import { EMPTY_PLEDGES, MEMBERSHIP_PLEDGES } from './membershipPledges'

export const EMPTY_FORM = {
  // Section 1: Personal Details
  fullNameTa: '', fullNameEn: '', nic: '', dateOfBirth: '', gender: '', maritalStatus: '',
  // Section 2: Address & Area Details
  permanentAddress: '', currentAddress: '', gnDivision: '', gnNumber: '', dsDivision: '',
  localAuthority: '', electoralConstituency: '', districtId: '', provinceId: '', divisionId: '',
  phone: '', whatsapp: '', email: '',
  // Section 3: Declarations
  declarations: {
    citizen: false, noOtherParty: false, govEmployee: false, trueInfo: false,
  },
  pledges: { ...EMPTY_PLEDGES },
  // Section 4: Signature
  signature: '', signatureDate: '',
  // Section 5: Education & Occupation
  education: [], employmentStatus: [], employmentOther: '',
  // Section 6: Areas of Contribution
  interests: [],
  // Section 7: Terms & Conditions
  termsAccepted: false,
  // Photo
  photo: null,
  // Language
  language: 'ta',
}

// Which step each field lives on (used to jump to the first server-side error).
export const FIELD_STEP = {
  fullNameTa: 1, fullNameEn: 1, nic: 1, dateOfBirth: 1, gender: 1, maritalStatus: 1,
  permanentAddress: 2, currentAddress: 2, gnDivision: 2, gnNumber: 2, dsDivision: 2,
  localAuthority: 2, electoralConstituency: 2, districtId: 2, provinceId: 2, divisionId: 2,
  phone: 2, whatsapp: 2, email: 2,
  'declarations.citizen': 3, 'declarations.noOtherParty': 3, 'declarations.govEmployee': 3, 'declarations.trueInfo': 3,
  pledges: 3,
  signature: 4, signatureDate: 4,
  education: 5, employmentStatus: 5, employmentOther: 5,
  interests: 6,
  termsAccepted: 7,
}
export const stepOfField = (f) => FIELD_STEP[f] || 1

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
    const nameTa = f.fullNameTa.trim()
    const nameEn = f.fullNameEn.trim()
    if (nameTa.length < 3) e.fullNameTa = 'required'
    else if (!NAME_RE.test(nameTa)) e.fullNameTa = 'nameInvalid'
    if (nameEn.length < 3) e.fullNameEn = 'required'
    else if (!NAME_RE.test(nameEn)) e.fullNameEn = 'nameInvalid'
    else if (nameEn !== nameEn.toUpperCase()) e.fullNameEn = 'uppercase'
    const nic = normNic(f.nic)
    if (!nic) e.nic = 'required'
    else if (!/^\d{9}[VX]$/.test(nic) && !/^\d{12}$/.test(nic)) e.nic = 'invalid'
    const age = ageFrom(f.dateOfBirth)
    if (!f.dateOfBirth) e.dateOfBirth = 'required'
    else if (age === null || age < 0 || age > 120) e.dateOfBirth = 'invalid'
    else if (age < minAge) e.dateOfBirth = 'too_young'
    else if (nicYear(nic) !== null && nicYear(nic) !== Number(f.dateOfBirth.slice(0, 4))) e.nic = 'dob_mismatch'
    if (!['male', 'female', 'other'].includes(f.gender)) e.gender = 'required'
    if (!['single', 'married', 'divorced', 'widowed'].includes(f.maritalStatus)) e.maritalStatus = 'required'
    if (requirePhoto && !photo && !f.photo) e.photo = 'required'
  }
  if (step === 2) {
    if (f.permanentAddress.trim().length < 5) e.permanentAddress = 'required'
    if (f.gnDivision.trim().length < 2) e.gnDivision = 'required'
    if (f.dsDivision.trim().length < 2) e.dsDivision = 'required'
    if (!f.districtId) e.districtId = 'required'
    if (!f.provinceId) e.provinceId = 'required'
    if (!f.divisionId) e.divisionId = 'required'
    if (!/^\+?\d{9,15}$/.test(normPhone(f.phone))) e.phone = f.phone ? 'phone' : 'required'
    if (f.email && !EMAIL_RE.test(f.email.trim())) e.email = 'email'
  }
  if (step === 3) {
    const allPledgesAccepted = (values) => MEMBERSHIP_PLEDGES.every(({ key }) => values?.[key] === true)
    if (!allPledgesAccepted(f.pledges)) e.pledges = 'pledges_incomplete'
    if (!f.declarations.citizen) e['declarations.citizen'] = 'required'
    if (!f.declarations.noOtherParty) e['declarations.noOtherParty'] = 'required'
    if (!f.declarations.govEmployee) e['declarations.govEmployee'] = 'required'
    if (!f.declarations.trueInfo) e['declarations.trueInfo'] = 'required'
  }
  if (step === 4) {
    if (!f.signature || f.signature.length < 10) e.signature = 'required'
    if (!f.signatureDate) e.signatureDate = 'required'
  }
  if (step === 5) {
    if (!f.education || f.education.length === 0) e.education = 'required'
    if (!f.employmentStatus || f.employmentStatus.length === 0) e.employmentStatus = 'required'
    if (f.employmentStatus.includes('other') && !f.employmentOther.trim()) e.employmentOther = 'required'
  }
  if (step === 6) {
    if (!f.interests || f.interests.length === 0) e.interests = 'required'
  }
  if (step === 7) {
    if (!f.termsAccepted) e.termsAccepted = 'required'
  }
  return e
}

/** Payload sent to ?action=apply. */
export function toPayload(f, language, draftCode) {
  return {
    ...f,
    fullNameTa: f.fullNameTa.trim(),
    fullNameEn: f.fullNameEn.trim().toUpperCase(),
    nic: normNic(f.nic),
    phone: f.phone.trim(),
    whatsapp: f.whatsapp ? normPhone(f.whatsapp) : '',
    email: f.email.trim(),
    currentAddress: f.currentAddress || '',
    provinceId: Number(f.provinceId) || 0,
    districtId: Number(f.districtId) || 0,
    divisionId: Number(f.divisionId) || 0,
    language,
    draftCode: draftCode || undefined,
  }
}

/** Restores a saved draft onto the empty form, ignoring unknown keys. */
export function fromDraft(data) {
  const out = { ...EMPTY_FORM, declarations: { ...EMPTY_FORM.declarations }, pledges: { ...EMPTY_PLEDGES } }
  Object.keys(EMPTY_FORM).forEach((k) => {
    if (!(k in (data || {}))) return
    if (k === 'declarations') {
      Object.keys(EMPTY_FORM.declarations).forEach((d) => { out.declarations[d] = !!data.declarations?.[d] })
    } else if (k === 'pledges') {
      // Pledge acceptance must always be an explicit action in the current application.
    } else if (k === 'education' || k === 'employmentStatus' || k === 'interests') {
      out[k] = Array.isArray(data[k]) ? data[k].filter((x) => typeof x === 'string') : []
    } else if (k === 'photo') {
      // Photo is handled separately via file upload
    } else {
      out[k] = data[k]
    }
  })
  return out
}
