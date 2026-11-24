import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, QrCode } from 'lucide-react'
import { downloadQrPng } from '../../services/pdfTicketService'
import { useRegText } from './regText'

// EVENT poster QR — opens the public registration form for this event (event_id in the URL).
// Not to be confused with the attendee QR on each ticket, which identifies one registered person.
export default function EventQRCode({ event, size = 168, showDownload = true, compact = false }) {
  const T = useRegText()
  const hiRes = useRef(null)
  const url = event.publicRegistrationUrl
    || `${window.location.origin}/events/${event.slug || event.id}`
  return (
    <div className={`evqr${compact ? ' evqr--compact' : ''}`}>
      <div className="evqr-head"><QrCode size={16} aria-hidden="true" /> <span>{T('scanToRegister')}</span></div>
      <div className="evqr-code">
        <QRCodeCanvas value={url} size={size} level="M" marginSize={0} fgColor="#1F1F1F" bgColor="#FFFFFF"
          role="img" aria-label={`${T('scanToRegister')}: ${event.title}`} />
      </div>
      <p className="evqr-hint">{T('scanHint')}</p>
      {showDownload && (
        <button type="button" className="evqr-dl" onClick={() => downloadQrPng(hiRes.current, `Event ${event.id}`, `Event-${event.id}-Registration-QR.png`)}>
          <Download size={14} aria-hidden="true" /> {T('downloadQr')}
        </button>
      )}
      <QRCodeCanvas ref={hiRes} value={url} size={1024} level="M" marginSize={0} style={{ display: 'none' }} aria-hidden="true" />
    </div>
  )
}
