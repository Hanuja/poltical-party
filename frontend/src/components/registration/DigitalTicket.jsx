import { forwardRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { CalendarDays, Clock, MapPin, Landmark } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getBranding } from '../../config/branding'
import { regText, fmtDate, fmtTimeRange, fmtDateTime } from './regText'

// The attendee's digital ticket. variant="screen" is responsive (stacks on phones);
// variant="print" keeps the wide ticket layout at a fixed width for PDF capture and printing.
const DigitalTicket = forwardRef(function DigitalTicket({ ticket, variant = 'screen', qrSize = 168 }, ref) {
  const { language } = useLanguage()
  const T = (k, v) => regText(language, k, v)
  const brand = getBranding(language)
  const ev = ticket.event || {}
  const qrValue = ticket.ticketUrl || ticket.ticketCode
  const status = ticket.status || 'registered'

  return (
    <article ref={ref} className={`tk tk--${status}${variant === 'print' ? ' tk--fixed' : ''}`} aria-label={`${T('tkOfficial')} ${ticket.ticketCode}`}>
      <div className="tk-main">
        <header className="tk-head">
          <img className="tk-logo" src={brand.logo} alt="" crossOrigin="anonymous" />
          <div className="tk-brand">
            <span className="tk-party">{brand.name}</span>
            <span className="tk-kicker">{T('tkOfficial')}</span>
          </div>
          {status !== 'registered' && (
            <span className={`tk-stamp tk-stamp--${status}`}>{status === 'cancelled' ? T('tkCancelled') : T('tkCheckedIn')}</span>
          )}
        </header>

        {ev.image && (
          <img className="tk-poster" data-poster src={ev.image} alt="" loading="eager" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        )}
        <h2 className="tk-title">{ev.title}</h2>

        <div className="tk-attendee">
          <span className="tk-label">{T('tkAttendee')}</span>
          <strong className="tk-name">{ticket.fullName}</strong>
          <span className="tk-role">{[ticket.designation, ticket.organization].filter(Boolean).join(' · ')}</span>
        </div>

        <dl className="tk-grid">
          <div><dt><CalendarDays size={14} aria-hidden="true" /> {T('tkDate')}</dt><dd>{fmtDate(ev.date, language, { weekday: 'long' })}</dd></div>
          <div><dt><Clock size={14} aria-hidden="true" /> {T('tkTime')}</dt><dd>{fmtTimeRange(ev.startTime, ev.endTime, language) || '—'}</dd></div>
          <div><dt><Landmark size={14} aria-hidden="true" /> {T('tkVenue')}</dt><dd>{ev.venue || '—'}</dd></div>
          <div><dt><MapPin size={14} aria-hidden="true" /> {T('tkAddress')}</dt><dd>{[ev.address, ev.city && ev.city !== ev.address ? ev.city : null].filter(Boolean).join(', ') || '—'}</dd></div>
        </dl>

        <dl className="tk-meta">
          {ticket.registrationId && <div><dt>{T('tkRegId')}</dt><dd>{ticket.registrationId}</dd></div>}
          {status === 'registered' && <div><dt>{T('tkConfirmed')}</dt><dd className="tk-ok">✓ {T('regConfirmed')}</dd></div>}
          <div><dt>{T('tkEmail')}</dt><dd>{ticket.email}</dd></div>
          <div><dt>{T('tkOrganization')}</dt><dd>{ticket.organization}</dd></div>
          <div><dt>{T('tkDesignation')}</dt><dd>{ticket.designation}</dd></div>
          <div><dt>{T('tkRegistered')}</dt><dd>{fmtDateTime(ticket.registeredAt, language)}</dd></div>
        </dl>
      </div>

      <div className="tk-perf" aria-hidden="true" />

      <aside className="tk-stub">
        <div className="tk-qr-box">
          <div className="tk-qr" data-ticket-qr style={{ width: qrSize, height: qrSize }}>
            <QRCodeCanvas value={qrValue} size={qrSize} level="Q" marginSize={0} fgColor="#111111" bgColor="#FFFFFF"
              role="img" aria-label={`QR code for ticket ${ticket.ticketCode}`} />
          </div>
        </div>
        <span className="tk-label">{T('tkTicketCode')}</span>
        <code className="tk-code">{ticket.ticketCode}</code>
        <span className="tk-scan">{T('tkScan')}</span>
        <span className="tk-personal">{T('tkPersonal')}</span>
      </aside>
    </article>
  )
})

export default DigitalTicket
