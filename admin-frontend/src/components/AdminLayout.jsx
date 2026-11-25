import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Megaphone, PlusCircle, LogOut, Menu, X, Home, Users, User,
  Globe, LayoutDashboard, UserPlus, ChevronsLeft, CalendarDays, ClipboardList, Clock, Mic,
} from 'lucide-react';
import { clearSession, getStoredUser } from '../lib/api';
import NotificationBell from './NotificationBell';
import InterfaceLanguageSelector from './InterfaceLanguageSelector';
import { getInitialLang, saveLang } from '../i18n/translations';
import { ADMIN_UI } from '../i18n/adminInterface';
import { LanguageProvider } from '../i18n/LanguageContext';
import '../App.css';
import { PARTY_LOGO } from '../config/branding';

const PUBLIC_URL = 'http://localhost:5178';

// Single shared nav config ? used by desktop sidebar, tablet sidebar and mobile drawer.
const MENU = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/announcements', labelKey: 'announcements', icon: Megaphone, end: true },
  { to: '/public-voice', labelKey: 'publicVoice', label: 'Public Voice', icon: Mic, end: false },
  { to: '/events', labelKey: 'events', label: 'Event Management', icon: CalendarDays, end: true },
  { to: '/registrations', labelKey: 'registrationHistory', label: 'Registration History', icon: ClipboardList, end: true },
  { to: '/history', labelKey: 'history', icon: Clock, end: true },
  { to: '/leadership', labelKey: 'leadership', icon: Users, end: false },
  { to: '/membership', labelKey: 'membership', icon: UserPlus, end: false },
];

function NavItems({ collapsed, onNavigate, t }) {
  const menuLabel = (key, fallback) => t[key] || fallback || key;
  return (
    <>
      {MENU.map(({ to, labelKey, label: customLabel, icon: Icon, end }) => { const label = menuLabel(labelKey, customLabel); return (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
          <Icon size={18} />
          <span className="side-label">{label}</span>
        </NavLink>
      );})}
      <a className="side-link" href={PUBLIC_URL} target="_blank" rel="noreferrer"
        onClick={onNavigate} title={collapsed ? 'View Website' : undefined}>
        <Globe size={18} />
        <span className="side-label">{t.viewWebsite}</span>
      </a>
    </>
  );
}

function Brand({ onClose }) {
  return (
    <div className="sidebar-brand">
      <span className="party-logo-circle"><img src={PARTY_LOGO} alt="" /></span>
      <div className="brand-text">
        <strong>RISE</strong>
        <span>Governance Hub</span>
      </div>
      {onClose && (
        <button className="drawer-close" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [lang, setLangState] = useState(getInitialLang());
  const t = ADMIN_UI[lang] || ADMIN_UI.en;
  const setLang = (code) => { setLangState(code); saveLang(code); };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Tablet (768?1023px): start collapsed; desktop: expanded. Close drawer on route change.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px) and (min-width: 768px)');
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-ta', lang === 'ta');
    document.body.classList.toggle('lang-si', lang === 'si');
  }, [lang]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const logout = () => { clearSession(); navigate('/login', { replace: true }); };
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <LanguageProvider value={{ lang, setLang, t }}>
    <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
      {/* Desktop / tablet sidebar */}
      <aside className="admin-sidebar">
        <Brand />
        <button className="collapse-btn" onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? t.expandMenu : t.collapseMenu} aria-label={t.collapseMenu}>
          <ChevronsLeft size={16} className={collapsed ? 'flip' : ''} />
        </button>
        <nav className="sidebar-nav">
          <NavItems collapsed={collapsed} t={t} />
        </nav>
        <div className="sidebar-foot">
          <button className="side-link side-logout" onClick={logout} title={collapsed ? (t.logout || 'Logout') : undefined}>
            <LogOut size={18} />
            <span className="side-label">{t.logout || 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && <div className="drawer-overlay" onClick={closeDrawer} />}
      <aside className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <Brand onClose={closeDrawer} />
        <nav className="sidebar-nav">
          <NavItems collapsed={false} onNavigate={closeDrawer} t={t} />
        </nav>
        <div className="sidebar-foot">
          <button className="side-link side-logout" onClick={logout}>
            <LogOut size={18} />
            <span className="side-label">{t.logout || 'Logout'}</span>
          </button>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <button className="hamburger" onClick={() => setDrawerOpen(true)} aria-label={t.menu}>
            <Menu size={22} />
          </button>
          <div className="topbar-title">
            {t.pageTitle[location.pathname.startsWith('/public-voice') ? 'publicVoice'
              : location.pathname.startsWith('/registrations') ? 'registrations'
              : location.pathname.startsWith('/history') ? 'history'
              : location.pathname.startsWith('/events') ? 'events'
              : location.pathname.startsWith('/leadership') ? 'leadership'
              : location.pathname.startsWith('/membership') ? 'membership'
              : location.pathname.startsWith('/dashboard') ? 'dashboard' : 'announcements']}
          </div>
          <div className="topbar-right">
            <InterfaceLanguageSelector lang={lang} onChange={setLang} label={t.interfaceLanguage} />
            <NotificationBell />
            <button className="topbar-icon topbar-avatar" aria-label="Profile"><User size={18} /></button>
            <span className="topbar-user">{user?.name || 'Admin'}</span>
            <button className="btn-logout topbar-logout" onClick={logout}><LogOut size={15} /> <span className="logout-label">{t.logout}</span></button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet context={{ lang, t }} />
        </main>

        {/* Mobile bottom navigation */}
        <nav className="bottom-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
            <Home size={20} /><span>{t.home}</span>
          </NavLink>
          <NavLink to="/announcements" end className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
            <Megaphone size={20} /><span>{t.announcements}</span>
          </NavLink>
          <NavLink to="/announcements/new" className={({ isActive }) => `bn-item bn-add ${isActive ? 'active' : ''}`}>
            <PlusCircle size={24} /><span>{t.add}</span>
          </NavLink>
          <NotificationBell variant="bottom" />
          <button className="bn-item" onClick={() => setDrawerOpen(true)}>
            <User size={20} /><span>{t.profile}</span>
          </button>
        </nav>
      </div>
    </div>
    </LanguageProvider>
  );
}
