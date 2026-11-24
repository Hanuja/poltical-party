import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getEvents } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import EventCard from '../components/EventCard'
import { SkeletonCards, EmptyState } from '../components/LoadingSpinner'
import { CalendarDays } from 'lucide-react'

export default function Events() {
  const { t, language } = useLanguage()
  const locale = language === 'ta' ? 'ta-LK' : language === 'si' ? 'si-LK' : 'en-GB'
  const [tab, setTab] = useState('upcoming') // upcoming | past

  const upcoming = useFetch(() => getEvents({ lang: language, upcoming: true }), [language])
  const past = useFetch(() => getEvents({ lang: language, upcoming: false }), [language])
  const active = tab === 'upcoming' ? upcoming : past

  useEffect(() => {
    setPageSEO({ title: t('events.title'), description: t('home.eventsTitle') })
  }, [t, language])

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.events') }]} />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('events.eyebrow')}</span>
            <h2>{t('events.title')}</h2>
          </div>

          <div className="tabs-bar">
            <button className={`tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>
              {t('common.upcoming')} ({upcoming.data?.items?.length || 0})
            </button>
            <button className={`tab${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>
              {t('common.past')} ({past.data?.items?.length || 0})
            </button>
          </div>

          {active.loading ? <SkeletonCards count={3} /> : active.error || active.data?.source === 'unavailable' ? (
            <EmptyState title="Events are temporarily unavailable. Please try again shortly." icon={<CalendarDays size={56} />} />
          ) : active.data?.items?.length === 0 ? (
            <EmptyState title={tab === 'upcoming' ? t('events.noEvents') : t('events.noPastEvents')} icon={<CalendarDays size={56} />} />
          ) : (
            <div className="grid grid-3">
              {active.data.items.map(ev => <EventCard key={ev.id} event={ev} locale={locale} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
