import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { motion } from 'framer-motion'
import { X, AlertCircle, Loader2, CheckCircle, Download, Eye, Clock } from 'lucide-react'
import { registerAttendee, validRegistration } from '../../services/registrationService'
import { downloadTicketPng } from '../../services/pdfTicketService'
import { useLanguage } from '../../context/LanguageContext'
import DigitalTicket from './DigitalTicket'
import { useRegText } from './regText'
import { isRegistrationOpen, registrationNotice } from './registrationStatus'

/**
 * The one registration popup, used by the Events cards and the Event Details page.
 *
 * Desktop: elegant split layout — registration form on the left, the event's public
 * registration QR on the right. Scanning that QR on a phone opens the same popup on
 * mobile, where CSS hides the QR panel so only the form is shown.
 *
 * State machine (step):
 *   form  ──submit (saved in MySQL)──▶ done   (individual ticket + its own QR is shown only
 *                                            after the database confirms)
 *   done  ──Download Ticket──────────▶ done   (PNG download, no navigation)
 *   done  ──View Ticket──────────────▶ /events/ticket/:code   (the only intentional navigation)
 * When registration is not open the status notice is shown instead of the form.
 */
const EMPTY = { fullName: '', email: '', phone: '', nicNumber: '', organization: '', specialRequirements: '', acceptTerms: false }
const colIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }
const splitIn = { hidden: {}, show: { transition: { delayChildren: 0.06, staggerChildren: 0.09 } } }
const TEXT_FIELDS = [
  { key: 'fullName', label: 'fullName', ph: 'phFullName', type: 'text', auto: 'name' },
  { key: 'email', label: 'email', ph: 'phEmail', type: 'email', auto: 'email', mode: 'email' },
  { key: 'phone', label: 'phone', ph: 'phPhone', type: 'tel', auto: 'tel', mode: 'tel' },
  { key: 'nicNumber', label: 'nic', ph: 'phNic', type: 'text', auto: 'off', mode: 'numeric' },
  { key: 'organization', label: 'organization', ph: 'phOrganization', type: 'text', auto: 'organization' },
]

export default function RegisterModal({ event, onClose }) {
  const T = useRegText()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [activeEvent, setActiveEvent] = useState(event)
  const [step, setStep] = useState('form') // form | done
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState('')
  const [sending, setSending] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [pngBusy, setPngBusy] = useState(false)
  const [pngError, setPngError] = useState('')

  const dialogRef = useRef(null)
  const submittingRef = useRef(false)
  const printRef = useRef(null)
  const qrHiRes = useRef(null)
  const latest = useRef({})
  latest.current = { activeEvent, language, T, onClose }

  const status = activeEvent.registrationStatus
  const notice = registrationNotice(status, T)
  const open = isRegistrationOpen(status)
  const qrUrl = activeEvent.publicRegistrationUrl
    || `${window.location.origin}/events/register?event_id=${activeEvent.id}`

  // ---- dialog chrome: lock page scroll, Esc to close, focus the dialog ----
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') latest.current.onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [])

  // ---- form ----
  const setField = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((x) => { const n = { ...x }; delete n[k]; return n })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return // blocks double clicks / double Enter: one submission, one ticket
    const errs = validRegistration(form)
    setErrors(errs)
    if (Object.keys(errs).length) { setBanner(T('fixErrors')); return }
    submittingRef.current = true
    setSending(true); setBanner('')
    try {
      const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]))
      const saved = await registerAttendee(activeEvent.id, clean, language, 'website')
      setTicket(saved) // only reached after MySQL confirmed the registration
      setStep('done')
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors)
      if (err.code === 'DUPLICATE' || err.code === 'DUPLICATE_NIC') {
        const key = err.fieldErrors?.nicNumber ? 'nicNumber' : 'email'
        setErrors((x) => ({ ...x, [key]: err.fieldErrors?.[key] || 'duplicate' }))
        setBanner(err.fieldErrors?.nicNumber ? T('errNicDuplicate') : T('duplicate'))
      } else if (['FULL', 'NOT_YET_OPEN', 'CLOSED', 'REGISTRATION_CLOSED', 'EVENT_COMPLETED', 'EVENT_CANCELLED'].includes(err.code)) {
        // the backend re-checked availability and said no → show the matching status instead of the form
        setActiveEvent((ev) => ({ ...ev, registrationStatus: err.code === 'CLOSED' || err.code === 'REGISTRATION_CLOSED' ? 'REGISTRATION_CLOSED' : err.code }))
        setStep('form')
      } else {
        setBanner(err.status === 0 ? T('networkError') : err.status === 429 ? T('tooMany') : (err.fieldErrors ? T('fixErrors') : (err.message || T('serverError'))))
      }
    } finally {
      submittingRef.current = false
      setSending(false)
    }
  }

  // ---- ticket actions ----
  const onDownload = async () => {
    if (pngBusy) return
    setPngError(''); setPngBusy(true)
    try { await downloadTicketPng(printRef.current, qrHiRes.current, ticket) }
    catch (err) { console.error(err); setPngError(T('pngFailed')) }
    finally { setPngBusy(false) }
  }
  const onView = () => {
    navigate(`/events/ticket/${ticket.ticketCode}`, { state: { ticket } }) // the one intentional navigation
    onClose()
  }

  // clicking the backdrop only closes when nothing would be lost
  const onBackdrop = () => { if (step === 'form' || step === 'done') onClose() }

  const modal = (
    <div className="rm-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onBackdrop() }}>
      <motion.div ref={dialogRef} tabIndex={-1} className="rm-dialog" role="dialog" aria-modal="true" aria-labelledby="rm-title"
        initial={{ opacity: 0, scale: 0.95, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
        <button type="button" className="rm-x" onClick={onClose} aria-label={T('close')}><X size={20} aria-hidden="true" /></button>

        <motion.div key={step} className="rm-step" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

          {/* registration not available (upcoming / closed / full / finished) */}
          {step === 'form' && !open && (
            <div className={`rm-notice rm-notice--${notice.tone}`} role="status">
              {notice.tone === 'soon' ? <Clock size={26} aria-hidden="true" /> : <AlertCircle size={26} aria-hidden="true" />}
              <strong>{notice.title}</strong>
              <p>{notice.text}</p>
              <button type="button" className="btn btn-outline" onClick={onClose}>{T('close')}</button>
            </div>
          )}

          {/* split layout: form (left) + event QR (right, desktop only) */}
          {step === 'form' && open && (
            <>
              <h2 id="rm-title" className="rm-title">{T('popupTitle')}</h2>
              <motion.div className="rm-split" variants={splitIn} initial="hidden" animate="show">
                <motion.div className="rm-col" variants={colIn}>
                  <h3 className="rm-form-title">{T('formTitle')}</h3>
                  <p className="rm-lead">{T('popupLead')}</p>
                  {banner && <p className="rm-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {banner}</p>}
                  <form onSubmit={submit} noValidate className="rm-form">
                    {TEXT_FIELDS.map((f) => (
                      <label key={f.key} className="rm-field">
                        <span>{T(f.label)} <b aria-hidden="true">*</b></span>
                        <input type={f.type} value={form[f.key]} onChange={setField(f.key)} placeholder={T(f.ph)}
                          autoComplete={f.auto} inputMode={f.mode} required aria-invalid={errors[f.key] ? 'true' : 'false'}
                          className={errors[f.key] ? 'err' : ''} disabled={sending} />
                        {errors[f.key] && <em role="alert">{T(errors[f.key])}</em>}
                      </label>
                    ))}
                    <label className="rm-field">
                      <span>{T('specialRequirements')}</span>
                      <textarea rows={3} value={form.specialRequirements} onChange={setField('specialRequirements')}
                        placeholder={T('phSpecial')} disabled={sending}
                        className={errors.specialRequirements ? 'err' : ''} />
                      {errors.specialRequirements && <em role="alert">{T(errors.specialRequirements)}</em>}
                    </label>
                    <label className="rm-terms">
                      <input type="checkbox" checked={form.acceptTerms} onChange={setField('acceptTerms')} disabled={sending}
                        aria-invalid={errors.acceptTerms ? 'true' : 'false'} />
                      <span>{T('terms')} <b aria-hidden="true">*</b></span>
                    </label>
                    {errors.acceptTerms && <em className="rm-terms-err" role="alert">{T(errors.acceptTerms)}</em>}
                    <button type="submit" className="btn btn-primary rm-finish" disabled={sending}>
                      {sending ? <><Loader2 className="reg-spin" size={16} aria-hidden="true" /> {T('submitting')}</> : T('submit')}
                    </button>
                  </form>
                </motion.div>

                <motion.aside className="rm-qr" variants={colIn}>
                  <h3 className="rm-qr-title">{T('qrPanelTitle')}</h3>
                  <div className="rm-qr-code">
                    <QRCodeCanvas value={qrUrl} size={188} level="M" marginSize={0} fgColor="#171717" bgColor="#FFFFFF"
                      role="img" aria-label={T('qrPanelTitle')} />
                  </div>
                  <p className="rm-qr-hint">{T('qrPanelHint')}</p>
                </motion.aside>
              </motion.div>
            </>
          )}

          {/* the digital ticket, inside the same popup */}
          {step === 'done' && ticket && (
            <div className="rm-done">
              <motion.div className="rm-done-badge" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <CheckCircle size={34} aria-hidden="true" />
              </motion.div>
              <h2 id="rm-title">{T('regConfirmed')}</h2>
              <p className="rm-lead">{T('ticketReady')}</p>
              <div className="rm-ticket"><DigitalTicket ticket={ticket} qrSize={150} /></div>
              {pngError && <p className="rm-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {pngError}</p>}
              <div className="rm-actions rm-actions--ticket">
                <button type="button" className="btn btn-outline" onClick={onDownload} disabled={pngBusy}>
                  {pngBusy ? <><Loader2 className="reg-spin" size={16} aria-hidden="true" /> {T('preparingImage')}</> : <><Download size={16} aria-hidden="true" /> {T('downloadTicket')}</>}
                </button>
                <button type="button" className="btn btn-primary" onClick={onView}><Eye size={16} aria-hidden="true" /> {T('viewTicketBtn')}</button>
              </div>
              <button type="button" className="rm-link" onClick={onClose}>{T('done')}</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )

  return (
    <>
      {createPortal(modal, document.body)}
      {/* fixed-layout copy + 1024 px QR used to render the downloadable PNG; lives outside the dialog so it never affects scrolling */}
      {step === 'done' && ticket && createPortal(
        <div className="tk-offscreen" aria-hidden="true">
          <DigitalTicket ref={printRef} ticket={ticket} variant="print" qrSize={176} />
          <QRCodeCanvas ref={qrHiRes} value={ticket.ticketUrl || ticket.ticketCode} size={1024} level="Q" marginSize={0} />
        </div>, document.body)}
    </>
  )
}

