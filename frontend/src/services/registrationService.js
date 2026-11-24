// Event registration & ticket API calls (backend/api/registrations/). No mock fallbacks:
// every registration is stored in MySQL, and failures are reported to the visitor as failures.
import { api } from './api'

export class RegistrationError extends Error {
  constructor(message, { status = 0, code = null, fieldErrors = null } = {}) {
    super(message)
    this.status = status      // HTTP status (0 = network)
    this.code = code          // DUPLICATE | CLOSED | FULL | …
    this.fieldErrors = fieldErrors
  }
}

function toError(e) {
  if (!e.response) return new RegistrationError('network', { status: 0 })
  const b = e.response.data || {}
  return new RegistrationError(b.error || 'Request failed', {
    status: e.response.status,
    code: b.data?.code || b.data?.result || null,
    fieldErrors: b.data?.errors || null,
  })
}

/** Register an attendee → the stored ticket { ticketCode, fullName, email, …, event: {…}, ticketUrl } */
export async function registerAttendee(eventId, form, lang = 'en', regMethod = 'form') {
  try {
    const res = await api.post('/registrations/', { eventId, ...form, regMethod }, { params: { lang } })
    return res.data.data
  } catch (e) { throw toError(e) }
}

/**
 * Check a scanned event QR against the backend → the event it belongs to, with its live registration status.
 * Rejects with code INVALID_QR | TICKET_QR | EVENT_NOT_FOUND (or a network error).
 */
export async function resolveEventQr(code, lang = 'en') {
  try {
    const res = await api.get('/registrations/', { params: { action: 'event', code, lang } })
    return res.data.data
  } catch (e) { throw toError(e) }
}

/** The attendee's ticket, from the database (works after refresh, on any device). */
export async function fetchTicket(code, lang = 'en') {
  try {
    const res = await api.get('/registrations/', { params: { ticket: code, lang } })
    return res.data.data
  } catch (e) { throw toError(e) }
}

/** Find a ticket again with the email + mobile number used to register. */
export async function findTickets({ email, phone, eventId }, lang = 'en') {
  try {
    const res = await api.post('/registrations/', { email, phone, eventId }, { params: { action: 'find', lang } })
    return res.data.data.tickets
  } catch (e) { throw toError(e) }
}

// Same rules as the server (helpers/registration.php) so most mistakes are caught before submitting.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Sri Lankan NIC: old 9 digits + V/X checksum, or new 12-digit number.
export const NIC_RE = /^(\d{9}[vVxX]|\d{12})$/
export const nicClean = (s) => (s || '').toUpperCase().replace(/[\s-]/g, '')
export function validRegistration(f) {
  const errs = {}
  const digits = (f.phone || '').replace(/\D/g, '')
  if ((f.fullName || '').trim().length < 2) errs.fullName = 'errName'
  if (!EMAIL_RE.test((f.email || '').trim())) errs.email = 'errEmail'
  if (!/^\+?[\d\s\-().]+$/.test((f.phone || '').trim()) || digits.length < 9 || digits.length > 15) errs.phone = 'errPhone'
  if (!NIC_RE.test(nicClean(f.nicNumber))) errs.nicNumber = 'errNic'
  if ((f.organization || '').trim().length < 2) errs.organization = 'errOrg'
  if ((f.specialRequirements || '').trim().length > 1000) errs.specialRequirements = 'errSpecial'
  if (f.acceptTerms !== true) errs.acceptTerms = 'errTerms'
  return errs
}
