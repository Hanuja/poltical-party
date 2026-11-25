import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react'
import { formatDate } from '../utils/format'
import { eventImage, onEventImageError } from '../utils/eventImage'
import RegisterModal from './registration/RegisterModal'
import { useRegText } from './registration/regText'
import { registrationLabel } from './registration/registrationStatus'

export default function EventCard({ event, locale = 'en-GB' }) {
  const T = useRegText()
  const [showReg, setShowReg] = useState(false)
  // the Events API decides: open · Upcoming Registration · Registration Closed (checked again by the backend on submit)
  const statusLabel = registrationLabel(event.registrationStatus, T, event.stage)
  return (
    <article className="card event-card">
      <Link to={`/events/${event.slug || event.id}`} className="card-img">
        <img key={eventImage(event)} src={eventImage(event)} alt={event.title} loading="lazy" onError={onEventImageError} />
        {event.isLiveBadge && <span className="badge badge-maroon" style={{position:'absolute',left:10,top:10}}>LIVE</span>}
        {event.eventStatus === 'live' && event.status !== 'live' && <span className="badge badge-maroon" style={{position:'absolute',left:10,top:10}}>{locale.startsWith('ta') ? 'விரைவில் நேரலை' : locale.startsWith('si') ? 'ළඟදීම සජීවීව' : 'Coming soon'}</span>}
        <span className="badge badge-maroon event-date-badge">
          {new Date(event.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
        </span>
      </Link>
      <div className="card-body">
        <div className="card-meta">
          <span><Calendar size={14} /> {formatDate(event.date, locale)}</span>
          {event.startTime && <span><Clock size={14} /> {event.startTime}</span>}
        </div>
        <h3><Link to={`/events/${event.slug || event.id}`}>{event.title}</Link></h3>
        {event.venue && <p className="card-excerpt"><MapPin size={14} style={{ verticalAlign: '-2px' }} /> {event.venue}</p>}
        {statusLabel ? (
          <button type="button" className="btn btn-outline btn-sm" disabled aria-disabled="true">{statusLabel}</button>
        ) : (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowReg(true)} aria-haspopup="dialog">
            {T('registerNow')} <ArrowRight size={14} />
          </button>
        )}
        {showReg && <RegisterModal event={event} onClose={() => setShowReg(false)} />}
      </div>
    </article>
  )
}
