import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { AlertCircle, ArrowLeft, Check, Copy, Download, Eye, Loader2, Printer, QrCode, XCircle, BadgeCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { setPageSEO } from '../utils/seo'
import { fetchTicket } from '../services/registrationService'
import { downloadTicketPdf, downloadQrPng } from '../services/pdfTicketService'
import DigitalTicket from '../components/registration/DigitalTicket'
import { useRegText, fmtDateTime } from '../components/registration/regText'
import '../styles/registration.css'

// /events/ticket/:code — the attendee's permanent ticket page (loaded from MySQL, so it survives refreshes,
// works on any device and always shows the current status). Right after registering it doubles as the
// success screen.
export default function TicketPage() {
  const { code = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const T = useRegText()
  const reduce = useReducedMotion()

  const passed = location.state?.ticket?.ticketCode === code ? location.state.ticket : null
  const justRegistered = Boolean(location.state?.justRegistered && passed)
  const [ticket, setTicket] = useState(passed)
  const [load, setLoad] = useState(passed ? 'ready' : 'loading') // loading | ready | notfound | error
  const [pdfBusy, setPdfBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const printRef = useRef(null)
  const qrHiRes = useRef(null)
  const ticketRef = useRef(null)

  useEffect(() => {
    let off = false
    fetchTicket(code, language)
      .then((t) => { if (!off) { setTicket(t); setLoad('ready') } })
      .catch((e) => { if (!off && !passed) setLoad(e.status === 404 ? 'notfound' : 'error') })
    return () => { off = true }
  }, [code, language]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (ticket) setPageSEO({ title: `${T('tkOfficial')} ${ticket.ticketCode}` }) }, [ticket]) // eslint-disable-line react-hooks/exhaustive-deps

  if (load === 'loading') {
    return <div className="container tkp-state" role="status"><Loader2 className="reg-spin" size={30} aria-hidden="true" /><p>{T('loadingTicket')}</p></div>
  }
  if (load !== 'ready') {
    return (
      <section className="section"><div className="container reg-state">
        <AlertCircle size={40} aria-hidden="true" />
        <h1>{load === 'notfound' ? T('ticketNotFound') : T('networkError')}</h1>
        {load === 'notfound' && <p>{T('ticketNotFoundHint')}</p>}
        <div className="reg-closed-actions">
          <Link to="/events/my-ticket" className="btn btn-primary">{T('findTicketCta')}</Link>
          <Link to="/" className="btn btn-outline">{T('backToWebsite')}</Link>
        </div>
      </div></section>
    )
  }

  const valid = ticket.status !== 'cancelled'

  const onPdf = async () => {
    setNotice(''); setPdfBusy(true)
    try { await downloadTicketPdf(printRef.current, qrHiRes.current, ticket) }
    catch (e) { console.error(e); setNotice(T('pdfFailed')) }
    finally { setPdfBusy(false) }
  }
  const onQr = () => downloadQrPng(qrHiRes.current, ticket.ticketCode).catch(() => setNotice(T('pdfFailed')))
  const onView = () => {
    navigate(`/events/ticket/${ticket.ticketCode}`, { replace: true, state: null })
    requestAnimationFrame(() => ticketRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }))
  }
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(ticket.ticketUrl || window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    catch { /* clipboard blocked: the URL is visible in the address bar */ }
  }

  return (
    <section className="section tkp">
      <div className="container tkp-wrap">
        {justRegistered ? (
          <header className="tkp-success" role="status">
            <svg className="tkp-check" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="tkp-check-ring" cx="26" cy="26" r="24" fill="none" />
              <path className="tkp-check-mark" fill="none" d="M15 27 l7 7 l15 -16" />
            </svg>
            <p className="tkp-eyebrow">{T('successTitle')}</p>
            <h1 className="tkp-title">{T('successMsg')}</h1>
            <p className="tkp-hint">{T('successHint')}</p>
          </header>
        ) : (
          <header className="tkp-header">
            <p className="tkp-eyebrow">{T('tkOfficial')}</p>
            <h1 className="tkp-title tkp-title--plain">{ticket.event?.title}</h1>
          </header>
        )}

        {!valid && <div className="reg-alert reg-alert--error tkp-status" role="alert"><XCircle size={18} aria-hidden="true" /> {T('statusCancelled')}</div>}
        {ticket.status === 'checked_in' && (
          <div className="reg-alert reg-alert--ok tkp-status"><BadgeCheck size={18} aria-hidden="true" /> {T('statusCheckedIn', { date: fmtDateTime(ticket.checkedInAt, language) })}</div>
        )}

        <motion.div ref={ticketRef} className="tkp-ticket tk-print-root"
          initial={reduce ? false : { opacity: 0, y: 36, rotateX: justRegistered ? 12 : 0, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: justRegistered ? 0.45 : 0, ease: [0.22, 1, 0.36, 1] }}>
          <DigitalTicket ticket={ticket} />
        </motion.div>

        <div className="tkp-actions no-print">
          <button type="button" className="tkp-btn tkp-btn--primary" onClick={onPdf} disabled={!valid || pdfBusy}>
            {pdfBusy ? <Loader2 className="reg-spin" size={17} aria-hidden="true" /> : <Download size={17} aria-hidden="true" />} {pdfBusy ? T('preparingPdf') : T('downloadPdf')}
          </button>
          <button type="button" className="tkp-btn" onClick={onQr} disabled={!valid}><QrCode size={17} aria-hidden="true" /> {T('downloadQr')}</button>
          <button type="button" className="tkp-btn" onClick={() => window.print()} disabled={!valid}><Printer size={17} aria-hidden="true" /> {T('print')}</button>
          {justRegistered && <button type="button" className="tkp-btn" onClick={onView}><Eye size={17} aria-hidden="true" /> {T('viewTicket')}</button>}
          <Link to="/" className="tkp-btn tkp-btn--ghost"><ArrowLeft size={17} aria-hidden="true" /> {T('backToWebsite')}</Link>
        </div>
        {notice && <p className="reg-alert reg-alert--error no-print" role="alert"><AlertCircle size={18} aria-hidden="true" /> {notice}</p>}

        <p className="tkp-keep no-print">
          {T('keepLink')}{' '}
          <button type="button" className="tkp-copy" onClick={onCopy}>{copied ? <><Check size={14} aria-hidden="true" /> {T('copied')}</> : <><Copy size={14} aria-hidden="true" /> {T('copyLink')}</>}</button>
        </p>
      </div>

      {/* fixed-layout copy used for the PDF and for printing, plus the 1024 px QR for both downloads */}
      <div className="tk-offscreen" aria-hidden="true">
        <DigitalTicket ref={printRef} ticket={ticket} variant="print" qrSize={176} />
        <QRCodeCanvas ref={qrHiRes} value={ticket.ticketUrl || ticket.ticketCode} size={1024} level="Q" marginSize={0} />
      </div>
    </section>
  )
}
