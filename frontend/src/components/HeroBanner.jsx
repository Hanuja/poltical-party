import { useLanguage } from '../context/LanguageContext'
import { useMediaQuery } from '../hooks/useMediaQuery'

const HERO_IMAGE = '/images/homepage-hero.jpg'

export default function HeroBanner() {
  const { t, language } = useLanguage()
  const isMobile = useMediaQuery('(max-width: 767px)')

  return (
    <section
      className="hero-banner"
      aria-label={t('heroBanner.ariaLabel')}
    >
      {/* Video/image background */}
      <div className="hero-banner-bg">
        <div
          className="hero-banner-slide active"
          style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundPosition: isMobile ? 'center center' : 'center 48%' }}
          aria-hidden="true"
        />
      </div>

      <div className="hero-banner-overlay" aria-hidden="true" />
      <div className="container hero-banner-inner">
        <div className="hero-banner-content">
          <h1 className="hero-banner-slogan anim-3">
            <span className="hero-banner-slogan-lead">{t('heroBanner.sloganLead')}</span>{' '}
            <span className="hero-banner-slogan-end">{t('heroBanner.sloganEnd')}</span>
          </h1>
        </div>
      </div>
    </section>
  )
}
