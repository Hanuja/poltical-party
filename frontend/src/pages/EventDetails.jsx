import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getEvent } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react'
import { formatDate } from '../utils/format'
import { eventImage, onEventImageError } from '../utils/eventImage'
import AnimatedRegisterButton from '../components/registration/AnimatedRegisterButton'
import RegisterModal from '../components/registration/RegisterModal'
import { useRegText, fmtTimeRange, fmtDateTime } from '../components/registration/regText'
import { isRegistrationOpen, registrationNotice } from '../components/registration/registrationStatus'
import '../styles/registration.css'

export default function EventDetails() {
  const { slug } = useParams()
  const { t, language } = useLanguage()
  const T = useRegText()
  const locale = language === 'ta' ? 'ta-LK' : language === 'si' ? 'si-LK' : 'en-GB'
  const { data: event, loading, error } = useFetch(() => getEvent(slug, language), [slug, language])
  const [showRegModal, setShowRegModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (event?.title) setPageSEO({ title: event.title, description: event.description?.replace(/<[^>]*>/g, '').slice(0, 160), image: event.image })
  }, [event, language])

  // Deep link from an event-poster QR scanned with a phone's own camera: /events/<slug>?register=1|true opens the popup once.
  // The popup itself shows the status notice when registration is not open, so open it unconditionally.
  useEffect(() => {
    const reg = searchParams.get('register')
    if (!event || (reg !== '1' && reg !== 'true')) return
    setShowRegModal(true)
    const next = new URLSearchParams(searchParams)
    next.delete('register')
    setSearchParams(next, { replace: true })
  }, [event]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="container" style={{ padding: '80px 0' }}><LoadingSpinner /></div>
  if (error || !event) {
    return (
      <>
        <Breadcrumb items={[{ label: t('nav.events'), to: '/events' }, { label: t('errors.404title') }]} />
        <section className="section"><div className="container text-center">
          <h2>{t('errors.404title')}</h2>
          <Link to="/events" className="btn btn-primary mt-3"><ArrowLeft size={16} /> {t('nav.events')}</Link>
        </div></section>
      </>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const isPast = event.date < today
  const spotsLeft = event.registrationLimit ? event.registrationLimit - (event.registrationCount || 0) : null
  const isFull = spotsLeft !== null && spotsLeft <= 0
  // the API decides (published, open, date, capacity, event status); older/mock data falls back to dates
  const regStatus = event.registrationStatus || (isPast ? 'EVENT_PAST' : isFull ? 'FULL' : 'open')
  const notice = registrationNotice(regStatus, T)

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.events'), to: '/events' }, { label: event.title }]} />
      <div className="container" style={{ paddingTop: 24 }}>
        <Link to="/events" className="ev-back-link"><ArrowLeft size={16} /> Back to Events</Link>
      </div>
      <section className="section">
        <div className="container event-detail">
          <div className="event-detail-main">
            <div className="reg-float">
              <img key={eventImage(event)} src={eventImage(event)} alt={event.title} className="event-detail-img" onError={onEventImageError} />
            </div>
            <div className="prose mt-3" dangerouslySetInnerHTML={{ __html: event.description || '' }} />
          </div>
          <aside className="event-detail-side card" style={{ padding: 28, alignSelf: 'start' }}>
            <h3>{t('events.detailsTitle')}</h3>
            <ul className="event-info-list">
              <li><Calendar size={17} /><div><strong>{t('common.date')}</strong><span>{formatDate(event.date, locale)}</span></div></li>
              {(event.startTime || event.endTime) && (
                <li><Clock size={17} /><div><strong>{t('events.time')}</strong><span>{fmtTimeRange(event.startTime, event.endTime, language)}</span></div></li>
              )}
              {(event.registrationWindow?.[0] || event.registrationWindow?.[1] || event.registrationOpensAt || event.registrationClosesAt) && (
                <li><Calendar size={17} /><div><strong>Registration</strong><span>
                  {(event.registrationWindow?.[0] || event.registrationOpensAt) && <>Opens: {fmtDateTime(event.registrationWindow?.[0] || event.registrationOpensAt, language)}<br/></>}
                  {(event.registrationWindow?.[1] || event.registrationClosesAt) && <>Closes: {fmtDateTime(event.registrationWindow?.[1] || event.registrationClosesAt, language)}</>}
                </span></div></li>
              )}
            </ul>

            {isRegistrationOpen(regStatus) ? (
              <button type="button" className="btn btn-primary reg-btn--block" onClick={() => setShowRegModal(true)} aria-haspopup="dialog">
                {t('events.registerButton')}
              </button>
            ) : regStatus === 'NOT_YET_OPEN' ? (
              <p className="reg-closed-note" role="status"><strong>{T('upcomingEvent')}</strong><br />{notice.text}</p>
            ) : (
              <>
                <button type="button" className="btn btn-outline reg-btn--block" disabled>{T('registrationClosed')}</button>
                <p className="reg-closed-note" role="status">{notice.text}</p>
              </>
            )}
            {event.mapUrl && (
              <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 10 }}>
                {t('contact.mapTitle')}
              </a>
            )}
            <Link to="/events" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 10 }}>
              <ArrowLeft size={15} /> {t('nav.events')}
            </Link>
          </aside>
        </div>
        {showRegModal && <RegisterModal event={event} onClose={() => setShowRegModal(false)} />}
      </section>
    </>
  )
}
