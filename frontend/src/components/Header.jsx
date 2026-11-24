import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getBranding } from '../config/branding'
import { Menu, X } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import Navbar from './Navbar'
import PeekLogo from './PeekLogo'

export default function Header() {
  const { t, language } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const brand = getBranding(language)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      {/* Main header — first element on the page */}
      <div className="main-header">
        <div className="container main-header-inner">
          <Link to="/" className="brand" aria-label={brand.name}>
            <PeekLogo src={brand.logo} alt={`${brand.name} logo`} imgClassName="brand-logo" />
            <span className="brand-text">
              <span className="brand-name">{brand.name}</span>
              <span className="brand-slogan">{brand.slogan}</span>
            </span>
          </Link>

          <Navbar />

          <div className="header-actions">
            <LanguageSwitcher />
            <button className="icon-btn hide-desktop" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-menu slide-down" onClick={e => e.stopPropagation()} aria-label="Mobile menu">
            <div className="mobile-menu-head">
              <PeekLogo src={brand.logo} alt="" imgClassName="" height={36} />
              <span className="brand-name">{brand.name}</span>
              <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label={t('common.close')}>
                <X size={24} />
              </button>
            </div>
            <Navbar mobile closeMobile={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </header>
  )
}
