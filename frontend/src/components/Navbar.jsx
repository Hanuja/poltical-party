import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { ChevronDown, ArrowRight, Mic, AudioLines } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'

const NAV = [
  { to: '/', key: 'nav.rise', end: true },
  {
    to: '/about',
    end: true,
    key: 'nav.ourIdentity',
    mega: [
      { to: '/our-identity?section=story', img: '/images/our-story-formation.jpg', titleKey: 'nav.idStory', descKey: 'nav.idStoryDesc' },
      { to: '/our-identity?section=vision', img: '/images/vision-mission.jpg', titleKey: 'nav.idVision', descKey: 'nav.idVisionDesc' },
      { to: '/principles-ideology', img: '/images/principles-ideology.jpg', titleKey: 'nav.idIdeology', descKey: 'nav.idIdeologyDesc' },
      { to: '/our-identity?section=constitution', img: '/images/constitution-policies.jpg', titleKey: 'nav.idConstitution', descKey: 'nav.idConstitutionDesc' },
    ],
  },
  {
    key: 'nav.ourPeople',
    mega: [
      { to: '/our-people', img: '/images/placeholder-hero-banner.png', titleKey: 'nav.ppLeadership', descKey: 'nav.ppLeadershipDesc' },
      { to: '/our-people/org-chart', img: '/images/placeholder-hero-banner.png', titleKey: 'nav.ppOrgChart', descKey: 'nav.ppOrgChartDesc' },
      { to: '/our-people/northern', img: '/images/roadmap/library-jaffna.jpg', titleKey: 'nav.ppNorthern', descKey: 'nav.ppNorthernDesc' },
      { to: '/our-people/eastern', img: '/images/roadmap/harbour-trincomalee.jpg', titleKey: 'nav.ppEastern', descKey: 'nav.ppEasternDesc' },
      { to: '/policies', img: '/images/placeholder-hero-banner.png', titleKey: 'nav.ppDepartments', descKey: 'nav.ppDepartmentsDesc' },
      { to: '/departments', img: '/images/placeholder-hero-banner.png', titleKey: 'nav.ppTeams', descKey: 'nav.ppTeamsDesc' },
          ],
    moreKey: 'nav.moreOptionsLink',
  },
  {
    key: 'nav.moreOptions',
    mega: [
      { to: '/development', img: '/images/development.jpg', titleKey: 'nav.moDev', descKey: 'nav.moDevDesc' },
      { to: '/roadmap', img: '/images/roadmap.jpg', titleKey: 'nav.moRoadmap', descKey: 'nav.moRoadmapDesc' },
      { to: '/public-voice', img: '/images/public-voice.jpg', titleKey: 'nav.moVoice', descKey: 'nav.moVoiceDesc' },
      { to: '/accountability', img: '/images/accountability.jpg', titleKey: 'nav.moAccount', descKey: 'nav.moAccountDesc' },
    ],
  },
  { to: '/membership', key: 'nav.joinUsLink' },
  ]

const TOP_LEVEL_PATHS = new Set(NAV.filter(n => n.to).map(n => n.to))

function MegaMenu({ item, closeMobile }) {
  const { t } = useLanguage()
  return (
    <div className={['nav-mega', item.groups ? 'nav-mega-groups' : '', ['nav.moreOptions','nav.ourIdentity','nav.ourPeople'].includes(item.key) ? 'nav-mega-horizontal' : ''].filter(Boolean).join(' ')} role="menu">
      {item.mega && item.mega.map(card => (
        <Link key={card.to + card.titleKey} to={card.to} className="mega-card" role="menuitem" onClick={closeMobile}>
          <span className={`mega-card-img${card.to === '/public-voice' ? ' mega-card-img-voice' : ''}`}>
            <img src={card.img} alt={t(card.titleKey)} loading="lazy" />
            {card.to === '/public-voice' && <span className="mega-voice-icon" aria-hidden="true"><Mic size={17}/><AudioLines size={13}/></span>}
          </span>
          <span className="mega-card-body">
            <span className="mega-card-title">{t(card.titleKey)}</span>
            <span className="mega-card-desc">{t(card.descKey)}</span>
            <span className="mega-card-more">{t('nav.readMore')} <ArrowRight size={13} /></span>
          </span>
        </Link>
      ))}
      {item.groups && item.groups.map(g => (
        <div key={g.titleKey} className="mega-group">
          <div className="mega-group-title">{t(g.titleKey)}</div>
          {g.links.map((l, i) => (
            <Link key={i} to={l.to} className="mega-group-link" role="menuitem" onClick={closeMobile}>
              {t(l.labelKey)}
            </Link>
          ))}
        </div>
      ))}
      {item.moreTo && (
        <Link to={item.moreTo} className="mega-more-link" onClick={closeMobile}>
          {t(item.moreKey)} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

function NavItem({ item, mobile, closeMobile }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname } = useLocation()
  // A dropdown parent is "active" when the current page is one of its links
  // (links that are also top-level items, e.g. /contact, stay with that item).
  const childActive = (item.mega || []).some(c =>
    !TOP_LEVEL_PATHS.has(c.to) && (pathname === c.to || pathname.startsWith(c.to + '/')))

  useEffect(() => {
    if (!item.mega && !item.groups) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [item.mega, item.groups])

  if (item.mega || item.groups) {
    return (
      <div className={`nav-item has-mega${item.to ? ' has-primary-link' : ''}${open ? ' open' : ''}`} ref={ref}>
        {item.to ? (
          <>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMobile}>
              {t(item.key)}
            </NavLink>
            <button
              className="nav-link nav-dropdown-btn nav-mega-toggle"
              onClick={() => setOpen(o => !o)}
              aria-label={`${t(item.key)} menu`}
              aria-expanded={open}
              aria-haspopup="true"
            ><ChevronDown size={14} /></button>
          </>
        ) : (
          <button
            className={`nav-link nav-dropdown-btn${childActive ? ' active' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            {t(item.key)} <ChevronDown size={14} />
          </button>
        )}
        {open && <MegaMenu item={item} closeMobile={closeMobile} />}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      onClick={closeMobile}
    >
      {t(item.key)}
    </NavLink>
  )
}

export default function Navbar({ mobile = false, closeMobile }) {
  const { t } = useLanguage()
  return (
    <nav className={mobile ? 'mobile-nav' : 'main-nav'} aria-label="Main navigation">
      {NAV.map(item => (
        <NavItem key={item.key} item={item} mobile={mobile} closeMobile={closeMobile} />
      ))}
      <div className="nav-language-switcher"><LanguageSwitcher /></div>
    </nav>
  )
}
