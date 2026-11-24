import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useReveal } from '../hooks/useReveal'
import { setPageSEO } from '../utils/seo'
import { getBranding } from '../config/branding'
import HeroBanner from '../components/HeroBanner'
import LatestAnnouncements from '../components/announcements/LatestAnnouncements'
import Newsletter from '../components/Newsletter'
import HomeShowcase from '../components/HomeShowcase'

import {
  Scale, HeartHandshake, Users, Award, ArrowRight,
  Eye, Target,
} from 'lucide-react'

const VALUE_ICONS = [Scale, HeartHandshake, Users, Award, Target, Eye]

// Wrap the first case-insensitive occurrence of `accent` in a gold-highlight span.
function highlightText(text, accent) {
  if (!accent) return text
  const i = text.toLowerCase().indexOf(accent.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <span className="gold-mark">{text.slice(i, i + accent.length)}</span>
      {text.slice(i + accent.length)}
    </>
  )
}

export default function Home() {
  const { t, language } = useLanguage()
  const brand = getBranding(language)

  useReveal([language])

  useEffect(() => {
    setPageSEO({ title: brand.name, description: t('hero.subtitle') })
  }, [brand.name, t, language])

  return (
    <>
      {/* 1. Hero banner */}
      <HeroBanner />

      {/* 2. About our party — editorial split layout */}
      <section className="section about-editorial-section">
        <div className="container about-editorial">
          <div className="about-editorial-text reveal">
            <span className="eyebrow">{t('home.aboutEyebrow')}</span>
            <h2 className="story-heading">{highlightText(t('home.aboutTitle'), t('home.aboutTitleAccent'))}</h2>
            <div className="story-subtitle">{t('home.storyTitle')}</div>
            <p className="about-lead">{t('home.aboutText')}</p>
            <p className="text-muted">{t('home.aboutText2')}</p>
            <Link to="/about/history" className="btn btn-history">
              {t('home.historyLink')} <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
          <div className="about-editorial-cards">
            <figure className="about-card about-card-short reveal">
              <img src="/images/placeholder-gallery-1.png" alt={t('home.aboutTitle')} loading="lazy" />
            </figure>
            <figure className="about-card about-card-tall reveal">
              <img src="/images/placeholder-hero-banner.png" alt={t('home.aboutTitle')} loading="lazy" />
            </figure>
            <figure className="about-card about-card-mid reveal">
              <img src="/images/placeholder-event-1.png" alt={t('home.aboutTitle')} loading="lazy" />
            </figure>
          </div>
        </div>
      </section>

      {/* 4. Latest Announcements — renders nothing until something is published */}
      <LatestAnnouncements />

      {/* 4b. Events + Research showcase */}
      <HomeShowcase />

      {/* 5. Newsletter */}
      <Newsletter />
    </>
  )
}
