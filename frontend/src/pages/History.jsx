import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { setPageSEO } from '../utils/seo'
import Breadcrumb from '../components/Breadcrumb'
import { Flag, Users, Landmark, Rocket, ArrowRight } from 'lucide-react'

const MILESTONES = [
  { year: '1990', icon: Flag, title: 'Party Founded', text: 'A group of idealists registers the party and opens its first branch.' },
  { year: '1995', icon: Users, title: 'National Expansion', text: 'Branches established across all nine provinces.' },
  { year: '2005', icon: Landmark, title: 'Parliamentary Presence', text: 'Party enters parliament with elected representatives.' },
  { year: '2020', icon: Rocket, title: 'Development Programme', text: 'Launch of the comprehensive national development programme.' },
  { year: '2026', icon: Flag, title: 'New Chapter', text: 'Renewed campaign for unity, justice and prosperity.' },
]

export function JourneyHistorySection({ showIntroduction = true, showAboutButton = true, headingLevel = 'h1', breadcrumbItems, breadcrumbHomeLabel }) {
  const { t } = useLanguage()
  const sectionRef = useRef(null)
  const Heading = headingLevel

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      section.classList.add('is-in')
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        section.classList.add('is-in')
        observer.disconnect()
      }
    }, { threshold: 0.12 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Breadcrumb
        homeLabel={breadcrumbHomeLabel}
        items={breadcrumbItems || [{ label: t('nav.ourIdentity'), to: '/about' }, { label: t('nav.partyHistory') }]}
      />
      <section className="section history-section" ref={sectionRef}>
        <div className="container history-container">
          <header className="history-heading">
            <span className="history-eyebrow"><i aria-hidden="true" />{t('about.historyEyebrow')}</span>
            <Heading>{t('about.historyTitle')}</Heading>
            {showIntroduction && <p className="history-intro">Founded in the early years of Sri Lanka&apos;s modern democracy, our party has grown from a small group of idealists into a nationwide movement.</p>}
          </header>

          <div className="history-milestones-heading">
            <h2>{t('about.timelineTitle')}</h2>
            <span aria-hidden="true" />
          </div>
          <ol className="history-timeline">
            {MILESTONES.map((m, i) => (
              <li className="history-milestone" key={m.year} style={{ '--milestone-delay': `${i * 110}ms` }}>
                <span className="history-marker" aria-hidden="true"><m.icon size={16} strokeWidth={1.8} /></span>
                <article className="history-card">
                  <span className="history-year">{m.year}</span>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                </article>
              </li>
            ))}
          </ol>

          {showAboutButton && <div className="history-about-link">
            <Link to="/about" className="btn history-about-button">{t('nav.ourIdentity')} <ArrowRight size={16} /></Link>
          </div>}
        </div>
      </section>
    </>
  )
}

export default function History() {
  const { t, language } = useLanguage()

  useEffect(() => {
    setPageSEO({ title: `${t('about.historyTitle')} | ${t('nav.ourIdentity')}`, description: t('about.historyText') })
  }, [t, language])

  return (
    <>
      <JourneyHistorySection
        breadcrumbHomeLabel="Home"
        breadcrumbItems={[{ label: 'Our Identity', to: '/about' }, { label: 'Party History' }]}
      />
    </>
  )
}
