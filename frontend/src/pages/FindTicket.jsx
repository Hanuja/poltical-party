import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2, Search, Ticket } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import Breadcrumb from '../components/Breadcrumb'
import { findTickets, EMAIL_RE } from '../services/registrationService'
import { useRegText, fmtDate } from '../components/registration/regText'
import '../styles/registration.css'

// /events/my-ticket — get your ticket back with the email + mobile number you registered with.
export default function FindTicket() {
  const [params] = useSearchParams()
  const { t, language } = useLanguage()
  const T = useRegText()
  const [email, setEmail] = useState(params.get('email') || '')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setResults(null)
    if (!EMAIL_RE.test(email.trim())) return setError(T('errEmail'))
    if (phone.replace(/\D/g, '').length < 9) return setError(T('errPhone'))
    setBusy(true)
    try {
      setResults(await findTickets({ email: email.trim(), phone, eventId: params.get('event_id') || undefined }, language))
    } catch (err) {
      setError(err.status === 404 ? T('findNone') : err.status === 429 ? T('tooMany') : err.status === 0 ? T('networkError') : T('serverError'))
    } finally { setBusy(false) }
  }

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.events'), to: '/events' }, { label: T('findTitle') }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <form className="reg-card find-card" onSubmit={submit} noValidate>
            <p className="reg-lead">{T('findIntro')}</p>
            {error && <div className="reg-alert reg-alert--error" role="alert"><AlertCircle size={18} aria-hidden="true" /> {error}</div>}
            <div className="reg-field">
              <label htmlFor="ft-email">{T('email')}</label>
              <input id="ft-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="reg-field">
              <label htmlFor="ft-phone">{T('phone')}</label>
              <input id="ft-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={T('phPhone')} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <button type="submit" className="tkp-btn tkp-btn--primary" disabled={busy}>
              {busy ? <Loader2 className="reg-spin" size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />} {busy ? T('findSearching') : T('findSubmit')}
            </button>
          </form>

          {results && (
            <ul className="find-results">
              {results.map((r) => (
                <li key={r.ticketCode}>
                  <Ticket size={18} aria-hidden="true" />
                  <div><strong>{r.event?.title}</strong><span>{fmtDate(r.event?.date, language)} · <code>{r.ticketCode}</code></span></div>
                  <Link to={`/events/ticket/${r.ticketCode}`} className="tkp-btn tkp-btn--primary">{T('openTicket')}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
