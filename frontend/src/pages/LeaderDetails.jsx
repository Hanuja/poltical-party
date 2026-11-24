import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getLeader } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Mail, Phone, MapPin, ArrowLeft, Building2, CalendarDays } from 'lucide-react'
import { SOCIAL_ICONS as SOCIAL } from '../components/SocialIcons'
import '../styles/our-people.css'

export default function LeaderDetails() {
  const { slug } = useParams()
  const { t, language } = useLanguage()
  const { data: leader, loading, error } = useFetch(() => getLeader(slug, language), [slug, language])

  useEffect(() => {
    if (leader?.name) setPageSEO({ title: leader.name, description: leader.position })
  }, [leader, language])

  if (loading) return <div className="container" style={{ padding: '80px 0' }}><LoadingSpinner /></div>
  if (error || !leader) {
    return (
      <>
        <Breadcrumb items={[{ label: t('nav.ourPeople'), to: '/our-people' }, { label: 'Not Found' }]} />
        <section className="section"><div className="container text-center">
          <h2>{t('errors.404title')}</h2>
          <Link to="/our-people" className="btn btn-primary mt-3"><ArrowLeft size={16} /> {t('nav.ourPeople')}</Link>
        </div></section>
      </>
    )
  }

  const lines = (text) => (text || '').split('\n').map((r) => r.replace(/^[\s•*\-–]+/, '').trim()).filter(Boolean)
  const responsibilities = lines(leader.responsibilities)
  const previous = lines(leader.previousPositions)
  const achievements = lines(leader.achievements)
  const appointed = leader.appointmentDate
    ? new Date(`${leader.appointmentDate}T00:00:00`).toLocaleDateString(language === 'en' ? 'en-GB' : `${language}-LK`, { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const socials = Object.entries(SOCIAL).filter(([k]) => leader[k])
  const place = [leader.district, leader.province].filter(Boolean).join(', ')
  const initials = (leader.name || '').replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] || '').join('').toUpperCase()
  // Official details shown under the portrait — only the ones that exist.
  const facts = [
    leader.officeBranch && { key: 'office', icon: Building2, content: leader.officeBranch },
    appointed && { key: 'appointed', icon: CalendarDays, content: `${t('ourPeople.appointed')}: ${appointed}` },
    leader.email && { key: 'email', icon: Mail, content: <a href={`mailto:${leader.email}`}>{leader.email}</a> },
    leader.phone && { key: 'phone', icon: Phone, content: <a href={`tel:${leader.phone.replace(/\s+/g, '')}`}>{leader.phone}</a> },
  ].filter(Boolean)

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.ourPeople'), to: '/our-people' }, { label: leader.name }]} />
      <section className="ld" lang={language}>
        <div className="container ld-layout ld-enter">
          <aside className="ld-aside">
            <div className="ld-photo">
              {leader.image
                ? <img src={leader.image} alt={leader.name} />
                : <span className="op-plate" role="img" aria-label={leader.name}>{initials}</span>}
            </div>
            {facts.length > 0 && (
              <ul className="ld-facts">
                {facts.map(({ key, icon: Icon, content }) => <li key={key}><Icon size={16} aria-hidden="true" /> <span>{content}</span></li>)}
              </ul>
            )}
            {socials.length > 0 && (
              <div className="ld-social">
                {socials.map(([k, Icon]) => <a key={k} href={leader[k]} target="_blank" rel="noopener noreferrer" aria-label={k}><Icon size={17} /></a>)}
              </div>
            )}
          </aside>

          <div className="ld-main">
            {leader.position && <p className="ld-role">{leader.position}</p>}
            <h2 className="ld-name">{leader.name}</h2>
            {place && <p className="ld-place"><MapPin size={15} aria-hidden="true" /> {place}</p>}
            <span className="ld-rule" aria-hidden="true" />
            {leader.shortBio && <p className="ld-lead">{leader.shortBio}</p>}
            {leader.bio && (
              <section className="ld-block">
                <h3 className="ld-label">{t('ourPeople.biography')}</h3>
                <p className="ld-text">{leader.bio}</p>
              </section>
            )}
            {responsibilities.length > 0 && (
              <section className="ld-block">
                <h3 className="ld-label">{t('ourPeople.responsibilities')}</h3>
                <ul className="ld-list">{responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </section>
            )}
            {leader.politicalExperience && (
              <section className="ld-block">
                <h3 className="ld-label">{t('ourPeople.politicalExperience')}</h3>
                <p className="ld-text">{leader.politicalExperience}</p>
              </section>
            )}
            {previous.length > 0 && (
              <section className="ld-block">
                <h3 className="ld-label">{t('ourPeople.previousPositions')}</h3>
                <ul className="ld-list">{previous.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </section>
            )}
            {achievements.length > 0 && (
              <section className="ld-block">
                <h3 className="ld-label">{t('ourPeople.achievements', { defaultValue: 'Achievements' })}</h3>
                <ul className="ld-list">{achievements.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </section>
            )}
            <Link to="/our-people" viewTransition className="op-more ld-back"><ArrowLeft size={16} aria-hidden="true" /> {t('nav.ourPeople')}</Link>
          </div>
        </div>
      </section>
    </>
  )
}
