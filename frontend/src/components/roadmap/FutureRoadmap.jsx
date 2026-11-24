import { useCallback, useEffect, useRef, useState } from 'react'
import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { setPageSEO } from '../../utils/seo'
import PageBanner from '../PageBanner'
import { PHOTOS } from '../../data/roadmapPhotos'
import DevelopmentTimeline from './DevelopmentTimeline'
import MilestoneDetailModal from './MilestoneDetailModal'
import FiftyYearVision from './FiftyYearVision'
import InteractiveDevelopmentMap from './InteractiveDevelopmentMap'
import DevelopmentCategories from './DevelopmentCategories'
import { scrollToId } from './roadmapUi'
import '../../styles/future-roadmap.css'

function Credits({ t }) {
  return (
    <section className="tw:bg-white tw:pb-16" aria-label={t('roadmap.credits.title')}>
      <div className="fr-wrap">
        <details className="fr-credits tw:border-t tw:border-black/10 tw:pt-6">
          <summary><Camera size={18} aria-hidden="true" /> {t('roadmap.credits.title')}</summary>
          <p className="tw:mt-3 tw:text-mute tw:text-[.95rem]">{t('roadmap.credits.note')}</p>
          <ul className="tw:mt-4 tw:grid tw:gap-2 tw:md:grid-cols-2 tw:text-[.9rem]">
            {PHOTOS.map((p) => (
              <li key={p.key}>
                <a href={p.source} target="_blank" rel="noopener noreferrer">{p.title.replace(/\.(jpe?g|png)$/i, '')}</a>
                {' — '}{p.author}, <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer">{p.license}</a>
              </li>
            ))}
          </ul>
          <p className="tw:mt-4 tw:text-mute tw:text-[.9rem]">{t('roadmap.credits.map')}</p>
        </details>
      </div>
    </section>
  )
}

// Future Roadmap — seven milestones (+ detail modal) → 50-year vision → Sri Lanka map → development areas.
export default function FutureRoadmap() {
  const { t, language } = useLanguage()
  const rootRef = useRef(null)
  const [openIndex, setOpenIndex] = useState(null)
  const [mapCategory, setMapCategory] = useState(null)
  const returnFocus = useRef(null)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })

  useEffect(() => {
    setPageSEO({ title: t('nav.moRoadmap'), description: t('roadmap.hero.subtitle') })
  }, [t, language])

  // Sticky sections sit below the site header.
  useEffect(() => {
    const set = () => rootRef.current?.style.setProperty('--fr-top', `${document.querySelector('.site-header')?.offsetHeight || 0}px`)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  const openMilestone = useCallback((i, from) => { returnFocus.current = from || null; setOpenIndex(i) }, [])
  const closeMilestone = useCallback(() => {
    setOpenIndex(null)
    const el = returnFocus.current
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }))
  }, [])
  const showOnMap = useCallback((key) => { setMapCategory(key); requestAnimationFrame(() => scrollToId('fr-map')) }, [])

  return (
    <MotionConfig reducedMotion="user">
      <>
        <PageBanner breadcrumbItems={[{ label: t('roadmap.hero.title') }]} />
        <div className="fr-root" ref={rootRef} lang={language}>
          <motion.div className="fr-progress" style={{ scaleX: progress }} aria-hidden="true" />
          <DevelopmentTimeline t={t} lang={language} onOpen={openMilestone} />
          <FiftyYearVision t={t} lang={language} onOpenVision={(from) => openMilestone(6, from)} />
          <InteractiveDevelopmentMap t={t} lang={language} categoryKey={mapCategory} onCategory={setMapCategory} />
          <DevelopmentCategories t={t} lang={language} onShowOnMap={showOnMap} />
          <Credits t={t} />
          <MilestoneDetailModal index={openIndex} onClose={closeMilestone} onStep={setOpenIndex} t={t} lang={language} />
        </div>
      </>
    </MotionConfig>
  )
}
