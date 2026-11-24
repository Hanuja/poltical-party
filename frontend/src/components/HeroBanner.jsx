import { useEffect, useState, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { getHeroBanner } from '../services/content'
import { getBranding } from '../config/branding'
import { LoadingSpinner } from './LoadingSpinner'

const DEFAULT_DESKTOP = '/images/placeholder-hero-banner.png'
const DEFAULT_MOBILE = '/images/placeholder-hero-banner.png'

const VIDEOS = [
  { desktop: '/images/placeholder-hero-banner.png', mobile: '/images/placeholder-hero-banner.png' },
  { desktop: '/images/placeholder-hero-banner.png', mobile: '/images/placeholder-hero-banner.png' },
  { desktop: '/images/placeholder-hero-banner.png', mobile: '/images/placeholder-hero-banner.png' },
]

// Replace with actual video paths when available, e.g.:
// const VIDEOS = [
//   { desktop: '/videos/clip1.mp4', mobile: '/videos/clip1-mobile.mp4' },
//   { desktop: '/videos/clip2.mp4', mobile: '/videos/clip2-mobile.mp4' },
//   { desktop: '/videos/clip3.mp4', mobile: '/videos/clip3-mobile.mp4' },
// ]

function renderHeading(heading, highlight) {
  if (!highlight) return heading
  const i = heading.toLowerCase().indexOf(highlight.toLowerCase())
  if (i === -1) return heading
  return (
    <>
      {heading.slice(0, i)}
      <span className="hl">{heading.slice(i, i + highlight.length)}</span>
      {heading.slice(i + highlight.length)}
    </>
  )
}

export default function HeroBanner() {
  const { t, language } = useLanguage()
  const brand = getBranding(language)
  const { data: banner, loading } = useFetch(() => getHeroBanner(language), [language])
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [videoIndex, setVideoIndex] = useState(0)
  const videoRef = useRef(null)

  const badge = banner?.badge || t('heroBanner.badge')
  const heading = banner?.heading || t('heroBanner.heading')
  const highlight = banner?.headingHighlight || t('heroBanner.headingHighlight')
  const description = banner?.description || t('heroBanner.description')
  const logo = banner?.logo || brand.logo

  const desktopImg = banner?.imageDesktop || DEFAULT_DESKTOP
  const mobileImg = banner?.imageMobile || desktopImg
  const bg = isMobile ? mobileImg : desktopImg

  // Auto-cycle video clips every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setVideoIndex(i => (i + 1) % VIDEOS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      className={`hero-banner${loading ? ' is-loading' : ''}`}
      aria-label={t('heroBanner.ariaLabel')}
    >
      {/* Video/image background */}
      <div className="hero-banner-bg">
        {VIDEOS.map((v, i) => {
          const isVideo = v.desktop.endsWith('.mp4')
          return isVideo ? (
            <video
              key={i}
              className={`hero-banner-slide${i === videoIndex ? ' active' : ''}`}
              src={isMobile ? v.mobile : v.desktop}
              autoPlay muted loop playsInline
              aria-hidden={i !== videoIndex}
            />
          ) : (
            <div
              key={i}
              className={`hero-banner-slide${i === videoIndex ? ' active' : ''}`}
              style={{ backgroundImage: `url(${isMobile ? v.mobile : v.desktop})` }}
              aria-hidden={i !== videoIndex}
            />
          )
        })}
      </div>

      <div className="hero-banner-overlay" aria-hidden="true" />
      <div className="container hero-banner-inner">
        <div className="hero-banner-content">
          {logo && (
            <div className="hero-banner-brand anim-1">
              <img className="hero-banner-logo" src={logo} alt={brand.name} />
            </div>
          )}
          {badge && <span className="hero-banner-badge anim-2">{badge}</span>}
          <h1 className="hero-banner-heading anim-3">{renderHeading(heading, highlight)}</h1>
          {description && <p className="hero-banner-desc anim-4">{description}</p>}
        </div>
      </div>
      {loading && (
        <div className="hero-banner-loader" role="status" aria-live="polite">
          <LoadingSpinner />
        </div>
      )}
    </section>
  )
}
