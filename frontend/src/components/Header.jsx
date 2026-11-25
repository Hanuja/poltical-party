import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getBranding } from '../config/branding'
import { Menu, X } from 'lucide-react'
import Navbar from './Navbar'
import VerifiedMembersButton from './VerifiedMembersButton'

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
          <div className="header-brand-group">
            <Link to="/" className="brand" aria-label="Thayaga Makkal Kazhagam (TMK)">
              <span className="party-logo-circle brand-logo-circle"><img src={brand.logo} alt="Thayaga Makkal Kazhagam (TMK) logo" className="brand-logo" /></span>
              <span className="brand-text">
                <span className="brand-name" lang="en">Thayaga Makkal Kazhagam (TMK)</span>
                <span className="brand-slogan" lang="en">One goal: liberation for our people.</span>
              </span>
            </Link>
            <VerifiedMembersButton compact />
          </div>

          <Navbar />

          <div className="header-actions">
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
              <span className="party-logo-circle mobile-brand-logo"><img src={brand.logo} alt="" /></span>
              <span className="brand-text">
                <span className="brand-name" lang="en">Thayaga Makkal Kazhagam (TMK)</span>
                <span className="brand-slogan" lang="en">One goal: liberation for our people.</span>
              </span>
              <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label={t('common.close')}>
                <X size={24} />
              </button>
            </div>
            <Navbar mobile closeMobile={() => setMobileOpen(false)} />
            <div className="mobile-menu-members-count"><VerifiedMembersButton /></div>
          </aside>
        </div>
      )}
    </header>
  )
}
