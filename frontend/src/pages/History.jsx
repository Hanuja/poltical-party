import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { setPageSEO } from '../utils/seo'
import PageBanner from '../components/PageBanner.jsx'
import Breadcrumb from '../components/Breadcrumb'
import { pickLang, mockPages } from '../data/mock'
import { Flag, Users, Landmark, Rocket, ArrowRight } from 'lucide-react'

const MILESTONES = [
  { year: '1990', icon: Flag, title: 'Party Founded', text: 'A group of idealists registers the party and opens its first branch.' },
  { year: '1995', icon: Users, title: 'National Expansion', text: 'Branches established across all nine provinces.' },
  { year: '2005', icon: Landmark, title: 'Parliamentary Presence', text: 'Party enters parliament with elected representatives.' },
  { year: '2020', icon: Rocket, title: 'Development Programme', text: 'Launch of the comprehensive national development programme.' },
  { year: '2026', icon: Flag, title: 'New Chapter', text: 'Renewed campaign for unity, justice and prosperity.' },
]

export default function History() {
  const { t, language } = useLanguage()

  useEffect(() => {
    setPageSEO({ title: `${t('about.historyTitle')} | ${t('nav.about')}`, description: t('about.historyText') })
  }, [t, language])

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.about'), to: '/about' }, { label: t('nav.partyHistory') }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <span className="eyebrow">{t('about.historyEyebrow')}</span>
          <h2>{t('about.historyTitle')}</h2>
          <p style={{ fontSize: '1.08rem' }}>{pickLang(mockPages.history.content, language)}</p>

          <h3 className="mt-4">{t('about.timelineTitle')}</h3>
          <div className="timeline">
            {MILESTONES.map((m, i) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-dot"><m.icon size={16} /></div>
                <div className="timeline-content">
                  <span className="timeline-year">{m.year}</span>
                  <h4>{m.title}</h4>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link to="/about" className="btn btn-outline"><ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> {t('nav.about')}</Link>
          </div>
        </div>
      </section>
    </>
  )
}
