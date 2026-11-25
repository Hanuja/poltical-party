import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageBanner from '../components/PageBanner.jsx'
import { useLanguage } from '../context/LanguageContext'
import '../styles/constitution.css'

const ORG = [
  { n:'I', t:'National Organisation', p:'National leadership and policy-making body.' },
  { n:'II', t:'Provincial Organisation', p:'Provincial coordination across all nine provinces.' },
  { n:'III', t:'District Organisation', p:'District-level organisation and membership.' },
  { n:'IV', t:'Local Organisation', p:'Branch and community-level networks.' },
]
const POLICIES = [
  { n:'01', t:'Education for All', to:'/policies/education-reform' },
  { n:'02', t:'Economic Recovery Plan', to:'/policies/economic-recovery-plan' },
  { n:'03', t:'Universal Healthcare', to:'/policies/universal-healthcare' },
  { n:'04', t:'Agricultural Modernisation', to:'/policies/agricultural-modernisation' },
  { n:'05', t:'Youth Employment Guarantee', to:'/policies/youth-employment-guarantee' },
]

function Reveal({ children, className='', delay=0 }) {
  return <div className={`cp-reveal ${className}`} style={{'--d':`${delay}s`}} data-reveal>{children}</div>
}

export default function ConstitutionPolicies() {
  const { t } = useLanguage()
  const root = useRef(null)
  useEffect(() => {
    const el = root.current; if (!el) return
    const targets = el.querySelectorAll('[data-reveal]:not(.is-in)')
    if (!('IntersectionObserver' in window)) { targets.forEach(x=>x.classList.add('is-in')); return }
    const io = new IntersectionObserver(en=>en.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.12})
    targets.forEach(x=>io.observe(x)); return ()=>io.disconnect()
  }, [])

  return (
    <div className="cp-page" ref={root}>
      <PageBanner breadcrumbItems={[{ label:'TMK', to:'/' }, { label:'Our Identity', to:'/our-identity' }, { label:'Constitution & Public Policies' }]} />

      {/* Intro — Constitutional Archive */}
      <section className="cp-hero">
        <div className="container cp-hero-grid">
          <div>
            <Reveal className="cp-eyebrow">Governance & Accountability</Reveal>
            <Reveal as="h1" className="cp-hero-title" delay={0.1}>Constitution &amp;<br />Public Policies</Reveal>
            <Reveal className="cp-hero-sub" delay={0.3}>The documents and structures that govern how our party is organised, how decisions are made and what we stand for in public life.</Reveal>
            <Reveal className="cp-gold-line" delay={0.5} />
          </div>
          <Reveal className="cp-hero-doc" delay={0.4}>
            <div className="cp-doc-sheet"><span className="cp-doc-seal">§</span></div>
          </Reveal>
        </div>
      </section>

      {/* Article I — Party Constitution */}
      <section className="cp-article">
        <div className="container cp-article-grid">
          <div className="cp-article-num">I</div>
          <div>
            <Reveal className="cp-eyebrow">Article I</Reveal>
            <Reveal as="h2" className="cp-article-title" delay={0.1}>Party Constitution</Reveal>
            <Reveal className="cp-article-desc" delay={0.2}>The party constitution defines our structures, membership rules and democratic processes.</Reveal>
            <Reveal className="cp-doc-preview" delay={0.3}>
              <div className="cp-doc-inner">
                <span className="cp-doc-lines" />
                <span className="cp-doc-lines" />
                <span className="cp-doc-lines short" />
              </div>
              <span className="cp-doc-note">Official constitution document</span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Article II — Organisational Structure */}
      <section className="cp-article">
        <div className="container">
          <Reveal className="cp-eyebrow">Article II</Reveal>
          <Reveal as="h2" className="cp-article-title" delay={0.1}>Organisational Structure</Reveal>
          <div className="cp-org">
            {ORG.map((o, i) => (
              <Reveal key={o.n} className={`cp-org-level lvl-${i}`} delay={i * 0.12}>
                <span className="cp-org-roman">{o.n}</span>
                <div className="cp-org-body">
                  <h3>{o.t}</h3>
                  <p>{o.p}</p>
                </div>
                <span className="cp-org-node" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Article III — Public Policies */}
      <section className="cp-article">
        <div className="container">
          <Reveal className="cp-eyebrow">Article III</Reveal>
          <Reveal as="h2" className="cp-article-title" delay={0.1}>Public Policies</Reveal>
          <Reveal className="cp-article-desc" delay={0.15}>Our policies set out practical plans for Sri Lanka across every sector.</Reveal>
          <div className="cp-policies">
            {POLICIES.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.1}>
                <Link to={p.to} className="cp-policy-row">
                  <span className="cp-policy-num">{p.n}</span>
                  <span className="cp-policy-title">{p.t}</span>
                  <span className="cp-policy-rule" />
                  <ArrowRight size={18} className="cp-policy-arrow" />
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <Link to="/policies" className="cp-link">Explore All Policies <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* Article IV — Governance Principles */}
      <section className="cp-quote">
        <div className="container">
          <Reveal className="cp-quote-mark">“</Reveal>
          <Reveal as="blockquote" className="cp-quote-text" delay={0.2}>We hold ourselves to the standards we ask of others: honesty in public statements, accountability for our promises, and respect for every community we serve.</Reveal>
          <Reveal className="cp-quote-line" delay={0.5} />
        </div>
      </section>

      {/* Official Documents */}
      <section className="cp-docs">
        <div className="container">
          <Reveal className="cp-eyebrow">Document Archive</Reveal>
          <Reveal as="h2" className="cp-article-title" delay={0.1}>Official Documents</Reveal>
          <Reveal className="cp-doc-panel" delay={0.2}>
            <div className="cp-doc-paper">
              <span className="cp-doc-paper-title">Party Documents &amp; Archives</span>
              <span className="cp-doc-paper-sub">Constitution, manifestos and official publications</span>
            </div>
            <Link to="/policies" className="cp-link cp-link-dark">View Official Documents <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
