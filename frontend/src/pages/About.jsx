import { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Breadcrumb from '../components/Breadcrumb'
import { JourneyHistorySection } from './History'
import IDENTITY from '../data/identityContent'
import { setPageSEO } from '../utils/seo'

export default function About() {
  const { t, language } = useLanguage()
  const pageRef = useRef(null)
  const copy = IDENTITY[language] || IDENTITY.en

  useEffect(() => {
    setPageSEO({ title: t('nav.ourIdentity'), description: copy.story.intro })
  }, [t, language, copy.story.intro])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return undefined
    const elements = [...page.querySelectorAll('[data-about-reveal]')]
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-in'))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const vision = copy.vision

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.ourIdentity') }]} />
      <main className="about-identity-page" ref={pageRef}>
        <section className="section about-introduction">
          <div className="container about-identity-container" data-about-reveal>
            <span className="about-identity-eyebrow">{t('nav.ourIdentity')}</span>
            <h1>Party Introduction</h1>
            <p>{copy.story.intro}</p>
          </div>
        </section>

        <section className="section about-vision-section">
          <div className="container about-identity-container" data-about-reveal>
            <span className="about-identity-eyebrow">{vision.label}</span>
            <p className="about-vision-intro">{vision.intro}</p>
            <div className="about-vision-grid">
              <article className="about-vision-card">
                <span>01</span>
                <h2>{vision.visionLabel}</h2>
                <p>{vision.visionText}</p>
              </article>
              <article className="about-vision-card">
                <span>02</span>
                <h2>{vision.missionLabel}</h2>
                <p>{vision.missionText}</p>
              </article>
            </div>
          </div>
        </section>

        <JourneyHistorySection showAboutButton={false} headingLevel="h2" />
      </main>
    </>
  )
}
