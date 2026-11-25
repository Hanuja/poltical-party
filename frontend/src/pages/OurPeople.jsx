import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, MapPin, RefreshCw, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getLeadership, getLeadershipMeta } from '../services/content'
import PageBanner from '../components/PageBanner.jsx'
import '../styles/leadership-scroll.css'

const profileHref = (leader) => `/leadership/${leader.slug || leader.id}`
const paragraphs = (value = '') => String(value || '').split(/\n\s*\n|\r?\n/).map((item) => item.trim()).filter(Boolean)
const asList = (value) => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean)
  : String(value || '').split(/\r?\n/).map((item) => item.replace(/^[\s•*\-–]+/, '').trim()).filter(Boolean)
const placeOf = (leader) => [leader.district, leader.province].filter(Boolean).join(', ')
const initials = (name = '') => name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((word) => [...word][0] || '').join('').toUpperCase()

const POSITION_TABS = []
const NAMED_POSITION_KEYS = new Set()

function HighlightedName({ name = '' }) {
  const words = String(name).trim().split(/\s+/)
  if (words.length < 2) return <>{name}</>
  return <>{words.slice(0, -1).join(' ')} <span className="ls-name-accent">{words.at(-1)}</span></>
}

function TextSection({ title, text, items }) {
  const copy = paragraphs(text)
  if (!copy.length && !items?.length) return null
  return (
    <section className="ls-detail">
      <h3>{title}</h3>
      {copy.map((paragraph, index) => <p key={`${title}-${index}`}>{paragraph}</p>)}
      {items?.length > 0 && <ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>}
    </section>
  )
}

function LeaderDetails({ leader, t, style, reduceMotion, showPosition = true }) {
  const intro = paragraphs(leader.shortBio)
  const biography = paragraphs(leader.bio)
  const responsibilities = asList(leader.responsibilities)
  const previous = asList(leader.previousPositions)
  const achievements = asList(leader.achievements)
  const place = placeOf(leader)

  return (
    <motion.div className="ls-details" style={style}>
      <motion.h2 initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, delay: reduceMotion ? 0 : 0.04 }}>
        <HighlightedName name={leader.name} />
      </motion.h2>
      {showPosition && leader.position && (
        <motion.p className="ls-position" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: reduceMotion ? 0 : 0.16 }}>
          {leader.position}
        </motion.p>
      )}
      <span className="ls-rule" aria-hidden="true" />
      {intro.length > 0 && (
        <motion.div className="ls-intro" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.26 }}>
          {intro.map((paragraph, index) => <p key={`intro-${index}`}>{paragraph}</p>)}
        </motion.div>
      )}
      {biography.length > 0 && (
        <section className="ls-detail">
          <h3>{t('ourPeople.biography')} &amp; Political History</h3>
          {biography.map((paragraph, index) => <p key={`bio-${index}`}>{paragraph}</p>)}
        </section>
      )}
      <TextSection title={t('ourPeople.responsibilities')} items={responsibilities} />
      <TextSection title={t('ourPeople.previousPositions')} items={previous} />
      <TextSection title={t('ourPeople.politicalExperience')} text={leader.politicalExperience} />
      <TextSection title={t('ourPeople.achievements', { defaultValue: 'Major Achievements' })} items={achievements} />
      {place && <p className="ls-location"><MapPin size={15} aria-hidden="true" /> {place}</p>}
      <Link to={profileHref(leader)} viewTransition className="ls-cta">
        {t('ourPeople.viewProfile')} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </motion.div>
  )
}

function LeadershipScrollProfile({ leader, t, reduceMotion }) {
  const sectionRef = useRef(null)
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }))

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', updateViewport, { passive: true })
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  const mobile = viewport.width <= 760
  const tablet = viewport.width <= 1100
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 28, mass: 0.5 })

  // Keep the portrait anchored in the left column while its crop resolves
  // from a tall 9:16 opening frame into a balanced 4:5 profile frame.
  const finalWidth = mobile
    ? Math.min(320, viewport.width - 40)
    : tablet ? Math.min(350, viewport.width * 0.39) : Math.min(400, viewport.width * 0.34)
  const initialHeight = finalWidth * 16 / 9
  const finalHeight = finalWidth * 5 / 4
  const imageHeight = useTransform(progress, [0, 0.38], [initialHeight, finalHeight])
  const imageRadius = useTransform(progress, [0, 0.38], [5, 12])

  const imageStyle = reduceMotion
    ? { width: finalWidth, height: finalHeight, borderRadius: 12 }
    : { width: finalWidth, height: imageHeight, borderRadius: imageRadius }

  return (
    <section ref={sectionRef} className={`ls-leader-section${reduceMotion ? ' is-static' : ''}`} aria-label={leader.name}>
      <div className="ls-container ls-content">
        <aside className="ls-media-column" aria-label={leader.name}>
          <motion.div
            className="ls-portrait"
            style={imageStyle}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {leader.image
              ? <img src={leader.image} alt={leader.name} fetchPriority="high" />
              : <span className="ls-portrait-fallback" role="img" aria-label={leader.name}>{initials(leader.name)}</span>}
          </motion.div>
        </aside>
        <LeaderDetails leader={leader} t={t} style={{ opacity: 1, y: 0 }} reduceMotion={reduceMotion} />
      </div>
    </section>
  )
}

function LeaderPagination({ index, total, onChange, t }) {
  return (
    <nav className="ls-pagination" aria-label={t('ourPeople.memberPagination', { defaultValue: 'Leader pagination' })}>
      <button type="button" className="ls-page-arrow" onClick={() => onChange(index - 1)} disabled={index <= 0}>
        <ArrowLeft size={16} aria-hidden="true" /> {t('common.previous')}
      </button>
      <span className="ls-page-count">Leader {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      <button type="button" className="ls-page-arrow" onClick={() => onChange(index + 1)} disabled={index >= total - 1}>
        {t('common.next')} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}

function PositionMemberProfile({ leader, t, reduceMotion }) {
  return (
    <motion.div
      className="ls-position-profile"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ls-position-container">
        <div className="ls-position-details">
          <LeaderDetails leader={leader} t={t} reduceMotion={reduceMotion} showPosition={false} />
        </div>
        <div className="ls-position-portrait">
          {leader.image
            ? <img src={leader.image} alt={leader.name} loading="lazy" />
            : <span className="ls-portrait-fallback">{initials(leader.name)}</span>}
        </div>
      </div>
    </motion.div>
  )
}

function ProfileSkeleton() {
  return <div className="ls-loading" aria-label="Loading leadership profile"><span /><span /><span /></div>
}

export default function OurPeople({ crumbKey = 'nav.ourPeople' } = {}) {
  const { t, language } = useLanguage()
  const { data: profiles, loading, error, reload } = useFetch(() => getLeadership(language), [language])
  const reduceMotion = useReducedMotion()
  const [memberIndex, setMemberIndex] = useState(0)

  useEffect(() => {
    setPageSEO({ title: t('ourPeople.title'), description: t('nav.ppLeadershipDesc') })
  }, [t, language])

  const allMembers = profiles || []
  const mainLeader = allMembers.find((person) => person.positionKey === 'leader' || person.section === 'leader') || allMembers[0] || null
  const memberList = allMembers.filter((person) => person.id !== mainLeader?.id)
  const selectedIndex = Math.min(memberIndex, Math.max(memberList.length - 1, 0))
  const currentMember = memberList[selectedIndex] || null

  const changeMember = (next) => {
    if (next < 0 || next >= memberList.length) return
    setMemberIndex(next)
  }

  return (
    <>
      <PageBanner breadcrumbItems={[{ label: t(crumbKey) }]} />
      <main className="ls-page" lang={language}>
        <div className="ls-language-toolbar"><LanguageSwitcher /></div>
        {/* SECTION 1: MAIN PARTY LEADER */}
        {!loading && !error && mainLeader && (
          <section className="ls-main-leader">
            <motion.header
              className="ls-page-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1>PARTY <span>LEADERSHIP</span></h1>
              <i aria-hidden="true" />
            </motion.header>
            <LeadershipScrollProfile leader={mainLeader} t={t} reduceMotion={reduceMotion} />
          </section>
        )}

        {/* SECTION 2: PARTY MEMBERS */}
        <section className="ls-positions-section">
          <motion.header
            className="ls-positions-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2>PARTY MEMBERS</h2>
            <i aria-hidden="true" />
          </motion.header>

          {loading && <ProfileSkeleton />}
          {!loading && error && (
            <div className="ls-page-state">
              <p>{t('ourPeople.error')}</p>
              <button type="button" onClick={reload}><RefreshCw size={15} aria-hidden="true" /> {t('ourPeople.retry')}</button>
            </div>
          )}
          {!loading && !error && (
            <section className="ls-panel">
              {memberList.length === 0 ? (
                <div className="ls-page-state"><Users size={22} aria-hidden="true" /><p>No members available.</p></div>
              ) : (
                <>
                  <AnimatePresence mode="wait" initial={false}>
                    {currentMember && (
                      <PositionMemberProfile
                        key={currentMember.id}
                        leader={currentMember}
                        t={t}
                        reduceMotion={reduceMotion}
                      />
                    )}
                  </AnimatePresence>
                  <LeaderPagination index={selectedIndex} total={memberList.length} onChange={changeMember} t={t} />
                </>
              )}
            </section>
          )}
        </section>
      </main>
    </>
  )
}
