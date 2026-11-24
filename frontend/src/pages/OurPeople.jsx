import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MapPin, RefreshCw, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getLeadership } from '../services/content'
import PageBanner from '../components/PageBanner.jsx'
import LeadershipScrollHero from '../components/LeadershipScrollHero.jsx'
import '../styles/our-people.css'
import '../styles/leadership-categories.css'

const CATEGORIES = [
  { key: 'generalSecretary', api: 'general_secretary' },
  { key: 'deputies', api: 'deputy' },
  { key: 'executive', api: 'executive' },
]

const profileHref = (leader) => `/leadership/${leader.slug || leader.id}`
const paragraphs = (value = '') => String(value || '').split(/\n\s*\n|\r?\n/).map((item) => item.trim()).filter(Boolean)
const asList = (value) => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean)
  : String(value || '').split(/\r?\n/).map((item) => item.replace(/^[\s•*\-–]+/, '').trim()).filter(Boolean)
const placeOf = (leader) => [leader.district, leader.province].filter(Boolean).join(', ')
const initials = (name = '') => name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((word) => [...word][0] || '').join('').toUpperCase()
function HighlightedName({ name = '' }) {
  const words = String(name).trim().split(/\s+/)
  if (words.length < 2) return <>{name}</>
  return <>{words.slice(0, -1).join(' ')} <span className="lp-name-accent">{words.at(-1)}</span></>
}

function ProfilePortrait({ leader }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="lp-member-photo">
      {leader.image && !failed
        ? <img src={leader.image} alt={leader.name} loading="eager" onError={() => setFailed(true)} />
        : <span className="lp-photo-fallback" role="img" aria-label={leader.name}>{initials(leader.name)}</span>}
    </div>
  )
}

function MemberPresentation({ leader, index, t }) {
  const bio = paragraphs(leader.bio || leader.shortBio)
  const responsibilities = asList(leader.responsibilities)
  const achievements = asList(leader.achievements)
  const previous = asList(leader.previousPositions)
  const place = placeOf(leader)

  return (
    <motion.article
      className="lp-member-layout"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      aria-label={leader.name}
    >
      <div className="lp-member-copy">
        <p className="lp-member-kicker">LEADERSHIP / LEADER {String(index + 1).padStart(2, '0')}</p>
        <h2><HighlightedName name={leader.name} /></h2>
        {leader.position && <p className="lp-member-role">{leader.position}</p>}
        <span className="lp-gold-rule" aria-hidden="true" />

        {bio.length > 0 && (
          <div className="lp-member-bio">
            {bio.map((paragraph, index) => <p key={`${leader.id}-bio-${index}`}>{paragraph}</p>)}
          </div>
        )}
        {place && <p className="lp-member-location"><MapPin size={15} aria-hidden="true" /> {place}</p>}

        {leader.politicalExperience && (
          <section className="lp-detail-block">
            <h3>{t('ourPeople.politicalExperience')}</h3>
            <p>{leader.politicalExperience}</p>
          </section>
        )}
        {previous.length > 0 && (
          <section className="lp-detail-block">
            <h3>{t('ourPeople.previousPositions')}</h3>
            <ul>{previous.map((item, index) => <li key={`${leader.id}-previous-${index}`}>{item}</li>)}</ul>
          </section>
        )}
        {responsibilities.length > 0 && (
          <section className="lp-detail-block">
            <h3>{t('ourPeople.responsibilities')}</h3>
            <ul>{responsibilities.map((item, index) => <li key={`${leader.id}-responsibility-${index}`}>{item}</li>)}</ul>
          </section>
        )}
        {achievements.length > 0 && (
          <section className="lp-detail-block">
            <h3>{t('ourPeople.achievements', { defaultValue: 'Achievements' })}</h3>
            <ul>{achievements.map((item, index) => <li key={`${leader.id}-achievement-${index}`}>{item}</li>)}</ul>
          </section>
        )}

        <Link to={profileHref(leader)} viewTransition className="lp-profile-link">
          {t('ourPeople.viewProfile')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <motion.div
        className="lp-member-portrait"
        key={`portrait-${leader.id}`}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <ProfilePortrait leader={leader} />
      </motion.div>
    </motion.article>
  )
}

function MemberPagination({ items, index, onChange, t, reducedMotion }) {
  const activeRef = useRef(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
  }, [index, reducedMotion])

  if (items.length <= 1) return null
  return (
    <nav className="lp-pagination" aria-label={t('ourPeople.memberPagination', { defaultValue: 'Member pagination' })}>
      <button type="button" className="lp-page-arrow" onClick={() => onChange(Math.max(index - 1, 0))} disabled={index === 0}>
        <ArrowLeft size={15} aria-hidden="true" /><span>{t('common.previous')}</span>
      </button>
      <div className="lp-page-numbers">
        {items.map((item, page) => (
          <button
            key={item.id}
            ref={page === index ? activeRef : null}
            type="button"
            className={`lp-page-number${page === index ? ' is-active' : ''}`}
            aria-current={page === index ? 'page' : undefined}
            aria-label={`${t('common.page')} ${page + 1}: ${item.name}`}
            onClick={() => onChange(page)}
          >
            <span>{String(page + 1).padStart(2, '0')}</span>
            <span className="lp-page-name">{item.name}</span>
          </button>
        ))}
      </div>
      <button type="button" className="lp-page-arrow" onClick={() => onChange(Math.min(index + 1, items.length - 1))} disabled={index === items.length - 1}>
        <span>{t('common.next')}</span><ArrowRight size={15} aria-hidden="true" />
      </button>
    </nav>
  )
}

function ProfileSkeleton() {
  return <div className="lp-loading" aria-label="Loading leadership profiles"><span /><span /><span /></div>
}

export default function OurPeople({ crumbKey = 'nav.ourPeople' } = {}) {
  const { t, language } = useLanguage()
  const { data, loading, error, reload } = useFetch(() => getLeadership(language), [language])
  const reduceMotion = useReducedMotion()
  const [activeCategory, setActiveCategory] = useState('generalSecretary')
  const [memberIndexes, setMemberIndexes] = useState({ generalSecretary: 0, deputies: 0, executive: 0 })

  useEffect(() => {
    setPageSEO({ title: t('ourPeople.title'), description: t('nav.ppLeadershipDesc') })
  }, [t, language])

  useEffect(() => {
    const syncCategoryFromHash = () => {
      const key = ({ '#op-generalSecretary': 'generalSecretary', '#op-deputies': 'deputies', '#op-executive': 'executive' })[window.location.hash]
      if (key) {
        setActiveCategory(key)
        setMemberIndexes((current) => ({ ...current, [key]: 0 }))
      }
    }
    window.addEventListener('hashchange', syncCategoryFromHash)
    syncCategoryFromHash()
    return () => window.removeEventListener('hashchange', syncCategoryFromHash)
  }, [])

  const profiles = data || []
  const mainLeader = profiles.find((person) => person.section === 'leader') || profiles[0] || null
  const membersByCategory = useMemo(() => Object.fromEntries(CATEGORIES.map((category) => [
    category.key,
    profiles.filter((person) => person.section === category.api),
  ])), [profiles])
  const activeMembers = membersByCategory[activeCategory] || []
  const activeIndex = Math.min(memberIndexes[activeCategory] || 0, Math.max(activeMembers.length - 1, 0))
  const activeMember = activeMembers[activeIndex] || null

  const selectCategory = (key) => {
    setActiveCategory(key)
    setMemberIndexes((current) => ({ ...current, [key]: 0 }))
  }
  const selectMember = (index) => setMemberIndexes((current) => ({ ...current, [activeCategory]: index }))

  return (
    <>
      <PageBanner breadcrumbItems={[{ label: t(crumbKey) }]} />
      <main className="op-page" lang={language}>
        <motion.header
          className="lp-page-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>{t('ourPeople.eyebrow')}</span>
          <h1>{t('ourPeople.pageHeading', { defaultValue: 'Leadership & Officers' })}</h1>
          <i aria-hidden="true" />
        </motion.header>

        {loading && <ProfileSkeleton />}
        {!loading && error && (
          <div className="lp-page-state">
            <p>{t('ourPeople.error')}</p>
            <button type="button" onClick={reload}><RefreshCw size={15} aria-hidden="true" /> {t('ourPeople.retry')}</button>
          </div>
        )}
        {!loading && !error && !mainLeader && (
          <div className="lp-page-state"><Users size={22} aria-hidden="true" /><p>{t('ourPeople.empty')}</p></div>
        )}
        {!loading && !error && mainLeader && (
          <>
            <LeadershipScrollHero
              heading={t('ourPeople.pageHeading', { defaultValue: 'Leadership & Officers' })}
              image={mainLeader.image || ''}
              eyebrow="LEADERSHIP / LEADER 01"
              title={mainLeader.name}
              position={mainLeader.position || ''}
              bio={mainLeader.bio || mainLeader.shortBio || ''}
              location={placeOf(mainLeader)}
              responsibilities={asList(mainLeader.responsibilities)}
              politicalExperience={mainLeader.politicalExperience || ''}
              previousPositions={asList(mainLeader.previousPositions)}
              achievements={asList(mainLeader.achievements)}
              profileUrl={profileHref(mainLeader)}
              ctaLabel={t('ourPeople.viewProfile')}
              strings={{ responsibilities: t('ourPeople.responsibilities'), experience: t('ourPeople.politicalExperience'), previousPositions: t('ourPeople.previousPositions'), achievements: t('ourPeople.achievements', { defaultValue: 'Achievements' }) }}
            />

            <section className="lp-categories" aria-label={t('ourPeople.team')}>
              <div className="lp-content-wrap">
                <div className="lp-section-heading">
                  <span>{t('ourPeople.team')}</span>
                  <p>{t('ourPeople.categoryIntro', { defaultValue: 'Meet the people serving across our national leadership.' })}</p>
                </div>
                <div className="lp-category-tabs" role="tablist" aria-label={t('ourPeople.filterLabel')}>
                  {CATEGORIES.map((category) => {
                    const active = category.key === activeCategory
                    const count = membersByCategory[category.key]?.length || 0
                    return (
                      <button
                        key={category.key}
                        id={category.key === 'generalSecretary' ? 'op-generalSecretary' : category.key === 'deputies' ? 'op-deputies' : 'op-executive'}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`lp-panel-${category.key}`}
                        className={`lp-category-tab${active ? ' is-active' : ''}`}
                        onClick={() => selectCategory(category.key)}
                      >
                        <span>{t(`ourPeople.sections.${category.key}`)}</span>
                        <span className="lp-category-count">{count}</span>
                        {active && <motion.i layoutId="lp-tab-indicator" aria-hidden="true" transition={{ duration: reduceMotion ? 0 : 0.28 }} />}
                      </button>
                    )
                  })}
                </div>

                <div id={`lp-panel-${activeCategory}`} role="tabpanel" aria-labelledby={`lp-tab-${activeCategory}`} className="lp-category-panel">
                  <AnimatePresence mode="wait" initial={false}>
                    {activeMember ? (
                      <MemberPresentation key={`${activeCategory}-${activeMember.id}`} leader={activeMember} index={activeIndex} t={t} />
                    ) : (
                      <motion.div key={`empty-${activeCategory}`} className="lp-empty-member" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Users size={24} aria-hidden="true" />
                        <p>{t('ourPeople.empty')}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <MemberPagination
                    items={activeMembers}
                    index={activeIndex}
                    onChange={selectMember}
                    t={t}
                    reducedMotion={reduceMotion}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}
