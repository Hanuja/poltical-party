import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import PageBanner from '../components/PageBanner.jsx'
import { useLanguage } from '../context/LanguageContext'
import { PRINCIPLES, PRESIDENTS, IDEOLOGY } from '../data/ideologyContent'
import PresidentsCarousel from '../components/PresidentsCarousel.jsx'
import '../styles/ideology.css'

// Every President, oldest first: No. 01 William Gopallawa (1972) → today. The number on each card is its position here.
const PRESIDENTS_IN_ORDER = [...PRESIDENTS].reverse()

const pick = (o, l) => o?.[l] || o?.en || {}

// Read more → full-screen pop-up for one principle.
// Closes with X, a click outside, or Escape; background scroll is locked while
// open, and focus/scroll return to exactly where the visitor was.
function PrincipleModal({ index, language, c, onClose }) {
  const [leaving, setLeaving] = useState(false)
  const closeRef = useRef(null)
  const p = PRINCIPLES[index]
  const t = pick(p, language)
  const close = () => { if (!leaving) { setLeaving(true); setTimeout(onClose, 260) } }

  useEffect(() => {
    const opener = document.activeElement
    const { body, documentElement: html } = document
    const scrollbar = window.innerWidth - html.clientWidth
    const prev = { overflow: body.style.overflow, pad: body.style.paddingRight }
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px` // no layout jump
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      body.style.overflow = prev.overflow
      body.style.paddingRight = prev.pad
      opener?.focus?.({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={`pi3-modal${leaving ? ' is-leaving' : ''}`} onClick={close}>
      <div className="pi3-dialog" role="dialog" aria-modal="true" aria-labelledby="pi3-dialog-title" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="pi3-dialog-x" onClick={close} aria-label={c.closeLabel || 'Close'}>
          <X size={22} />
        </button>
        <aside className="pi3-dialog-side" aria-hidden="true">
          <span className="pi3-dialog-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="pi3-dialog-of">{String(index + 1).padStart(2, '0')} / {String(PRINCIPLES.length).padStart(2, '0')}</span>
        </aside>
        <div className="pi3-dialog-body">
          <span className="pi3-dialog-eyebrow">{c.s2Eyebrow}</span>
          <h2 id="pi3-dialog-title">{t.t}</h2>
          <span className="pi3-dialog-line" aria-hidden="true" />
          <p className="pi3-dialog-lead">{t.lead}</p>
          <p className="pi3-dialog-more">{t.more}</p>
          <button type="button" className="pi3-dialog-close" onClick={close}>{c.closeLabel || 'Close'} <X size={15} /></button>
        </div>
      </div>
    </div>
  )
}

export default function PrinciplesIdeology() {
  const { language } = useLanguage()
  const c = IDEOLOGY[language] || IDEOLOGY.en
  const root = useRef(null)
  const [openP, setOpenP] = useState(null)

  useEffect(() => {
    const el = root.current; if (!el) return
    const t = el.querySelectorAll('[data-reveal]:not(.is-in)')
    if (!('IntersectionObserver' in window)) { t.forEach(x=>x.classList.add('is-in')); return }
    const io = new IntersectionObserver(en=>en.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}}),{threshold:.1})
    t.forEach(x=>io.observe(x)); return ()=>io.disconnect()
  }, [language])



  return (
    <div className="pi2" ref={root}>
      <PageBanner breadcrumbItems={[{label:'TMK',to:'/'},{label:'Our Identity',to:'/our-identity'},{label:c.title}]} />

      {/* S1 Heading + team photo */}
      <section className="pi2-s1">
        <span className="pi2-roman">III</span>
        <div className="container">
          <div className="pi2-s1-head" data-reveal>
            <h2>{c.s1Title}</h2>
            <p>{c.s1Intro}</p>
            <span className="pi2-gold-line" />
          </div>
          {/* reveal trigger sits on a wrapper: a fully clipped element is never "visible" to the observer */}
          <div className="pi2-s1-photo-wrap" data-reveal>
            <figure className="pi2-s1-photo">
              <img src="/images/team_leader.jpg" alt={c.s1Title} />
            </figure>
          </div>
        </div>
      </section>

      {/* S2 Principles */}
      <section className="pi2-s2">
        <div className="container">
          <div className="pi2-head" data-reveal>
            <span className="pi2-eyebrow">{c.s2Eyebrow}</span>
            <h2>{c.s2Title}</h2>
            <p className="pi2-sub">{c.s2Sub}</p>
          </div>
          {/* 11 principles on a 12-column grid with no gaps:
              8+4 · 4+4+4 · 6+6 · 4+4+4 · 12 */}
          <ol className="pi3-grid">
            {PRINCIPLES.map((p, i) => {
              const t = pick(p, language)
              const span = [8, 4, 4, 4, 4, 6, 6, 4, 4, 4, 12][i] || 4
              return (
                <li key={p.id} className={`pi3-card pi3-v${i} pi3-span${span}${openP === i ? ' is-open' : ''}`} style={{ '--i': i % 4 }} data-reveal>
                  <span className="pi3-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div className="pi3-body">
                    <h3>{t.t}</h3>
                    <span className="pi3-line" aria-hidden="true" />
                    <p className="pi3-lead">{t.lead}</p>
                    <button type="button" className="pi3-toggle" aria-haspopup="dialog" onClick={() => setOpenP(i)}>
                      {c.readMore} <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* S3 Presidents */}
      <section className="pi2-s3">
        <div className="container">
          <div className="pi2-head" data-reveal>
            <span className="pi2-eyebrow">{c.s3Title}</span>
            <h2>{c.s3Sub || 'Presidents of Sri Lanka'}</h2>
          </div>
          <PresidentsCarousel presidents={PRESIDENTS_IN_ORDER} language={language} labels={{
            title: c.s3Sub || 'Presidents of Sri Lanka', designation: c.designation || 'President of Sri Lanka',
            background: c.background, positions: c.positions, moments: c.moments, current: c.current,
            now: c.now, number: c.number, prev: c.prev, next: c.next, pause: c.pause, play: c.play,
            close: c.close || c.closeLabel || 'Close',
          }} />
          <p className="pi2-note" data-reveal>{c.note}</p>
        </div>
      </section>

      {openP !== null && openP >= 0 && (
        <PrincipleModal index={openP} language={language} c={c} onClose={() => setOpenP(null)} />
      )}
    </div>
  )
}
