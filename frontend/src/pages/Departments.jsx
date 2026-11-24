import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { DEPARTMENTS, getDepartment, getDepartmentText } from '../data/departmentsContent';
import {
  Crown, Users, Heart, Megaphone, BookOpen, HandHeart, GraduationCap, MapPin, Scale, MonitorSmartphone,
  ArrowRight, ArrowLeft, ArrowUpRight, User,
} from 'lucide-react';
import '../styles/departments.css';

const ICONS = { Crown, Users, Heart, Megaphone, BookOpen, HandHeart, GraduationCap, MapPin, Scale, MonitorSmartphone };
const CATS = [
  ['all', 'All Departments'], ['leadership', 'Leadership'], ['wings', 'Wings'],
  ['communications', 'Communications'], ['policy', 'Policy & Research'],
  ['community', 'Community'], ['admin', 'Administration'], ['regional', 'Regional Operations'],
];
const CAT_NAME = { all: 'அனைத்து துறைகள்', leadership: 'தலைமை', wings: 'பிரிவுகள்', communications: 'தகவல் தொடர்பு', policy: 'கொள்கை & ஆராய்ச்சி', community: 'சமூகம்', admin: 'நிர்வாகம்', regional: 'பிராந்தியம்' };
const CAT_NAME_SI = { all: 'සියල්ල', leadership: 'නායකත්වය', wings: 'ශාඛා', communications: 'සන්නිවේදන', policy: 'ප්‍රතිපත්ති', community: 'ප්‍රජාව', admin: 'පරිපාලනය', regional: 'කලාපීය' };
const catLabel = (k, lang) => lang === 'ta' ? CAT_NAME[k] : lang === 'si' ? CAT_NAME_SI[k] : CATS.find(c => c[0] === k)?.[1] || k;

function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`dp-reveal ${className}`}>{children}</div>;
}

// ONE unified department row — identical structure for all 10.
function DeptRow({ d, t, num }) {
  const Icon = ICONS[d.icon] || Users;
  return (
    <Reveal className="dp-row">
      <div className="dp-row-text">
        <span className="dp-row-num">DEPARTMENT {String(num).padStart(2, '0')}</span>
        <span className="dp-icon"><Icon size={22} /></span>
        <h3>{t.name}</h3>
        <p>{t.desc}</p>
        <div className="dp-meta">
          <span className="dp-desig"><User size={13} /> {t.designation}</span>
          <Link to={`/departments/${d.slug}`} className="dp-cta">View Team <ArrowUpRight size={15} /></Link>
        </div>
      </div>
      <Link to={`/departments/${d.slug}`} className="dp-row-img">
        <img src={d.img} alt={t.name} loading="lazy" />
      </Link>
    </Reveal>
  );
}

export default function Departments() {
  const { language } = useLanguage();
  const { slug } = useParams();
  const dept = slug ? getDepartment(slug) : null;
  const t = dept ? getDepartmentText(dept, language) : null;
  const [cat, setCat] = useState('all');

  // Detail view
  if (dept) {
    const Icon = ICONS[dept.icon] || Users;
    return (
      <div className="dp-page">
        <section className="dp-hero dp-hero--detail">
          <Link to="/departments" className="dp-back"><ArrowLeft size={15} /> All Departments</Link>
          <span className="dp-eyebrow">RISE | DEPARTMENTS &amp; TEAMS</span>
          <h1>{t.name}</h1><p>{t.desc}</p>
        </section>
        <section className="dp-detail">
          <div className="dp-detail-head">
            <div className="dp-avatar"><Icon size={30} /></div>
            <div><h2>{t.name}</h2><p className="dp-role">{t.designation}</p></div>
          </div>
          <p className="dp-lead">{t.desc}</p>
          <div className="dp-members"><h3>Team Members</h3><p className="dp-empty">Member profiles will be published here soon.</p></div>
        </section>
      </div>
    );
  }

  const visible = DEPARTMENTS.filter(d => cat === 'all' || d.cat === cat);

  return (
    <div className="dp-page dp-premium">
      {/* Cinematic hero */}
      <section className="dp-cine-hero">
        <div className="dp-cine-bg" />
        <div className="dp-cine-inner">
          <span className="dp-eyebrow">RISE | OUR ORGANISATION</span>
          <h1 className="dp-cine-title">Departments <em>&amp;</em> Teams</h1>
          <p className="dp-cine-sub">United in Purpose. Stronger Together.</p>
          <p className="dp-cine-desc">Meet the dedicated teams working together to strengthen our organization, serve communities and build a better future.</p>
          <a href="#dp-depts" className="dp-scroll"><span />Scroll</a>
        </div>
      </section>

      {/* Intro */}
      <section className="dp-intro">
        <Reveal className="dp-intro-grid">
          <div>
            <span className="dp-eyebrow">OUR STRUCTURE</span>
            <h2>One Organisation.<br />Many Dedicated Teams.</h2>
            <p>Every department plays an important role in advancing our mission. Together, our dedicated teams bring leadership, expertise and commitment to every part of our organisation.</p>
          </div>
          <div className="dp-intro-img"><img src="/images/team_leader.jpg" alt="RISE team" loading="lazy" /></div>
        </Reveal>
      </section>

      {/* Sticky category nav */}
      <nav className="dp-catnav">
        <div className="container dp-catnav-row">
          {CATS.map(([k]) => (
            <button key={k} className={`dp-cat${cat === k ? ' on' : ''}`} onClick={() => setCat(k)}>{catLabel(k, language)}</button>
          ))}
        </div>
      </nav>

      {/* Departments — identical unified rows */}
      <section className="dp-depts" id="dp-depts">
        <div className="container">
          {visible.map((d) => (
            <DeptRow key={d.slug} d={d} t={getDepartmentText(d, language)} num={DEPARTMENTS.indexOf(d) + 1} />
          ))}
          {visible.length === 0 && <p className="dp-empty">No departments in this category.</p>}
        </div>
      </section>

      {/* Closing */}
      <section className="dp-closing">
        <Reveal>
          <h2>Stronger Together. Moving Forward.</h2>
          <p>Our strength comes from dedicated people, shared responsibility and teams working together towards a common vision.</p>
          <div className="dp-closing-btns">
            <Link to="/about" className="dp-btn-ghost">Explore Our Organisation</Link>
            <Link to="/departments" className="dp-btn-gold">Meet Our Teams</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
