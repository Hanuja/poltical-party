// Our Identity — one continuous page, eight editorial chapters.
// Static copy: data/identityContent.js (en / ta / si).
// Live content (leaders, policies, documents, statements): services/content.js.
import { useEffect, useMemo, useRef, useState } from 'react'
import { PARTY_LOGO } from '../config/branding'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, FileText, Eye, Target, Sprout, Handshake, MapPin, X, UserRound, Mail, Phone } from 'lucide-react'
import PageBanner from '../components/PageBanner.jsx'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getLeadership, getPolicies, getManifesto, getNews } from '../services/content'
import { IDENTITY } from '../data/identityContent'
import FlagExplorer from '../components/FlagExplorer.jsx'
import ChapterModal from '../components/ChapterModal.jsx'
import '../styles/our-identity.css'
import '../styles/chapter-modal.css'

const LOCALES = { en: 'en-GB', ta: 'ta-LK', si: 'si-LK' }
const pad = (n) => String(n).padStart(2, '0')
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

function Mark({ text, mark }) {
  const i = mark ? text.indexOf(mark) : -1
  if (i === -1) return text
  return <>{text.slice(0, i)}<mark className="oi-mark">{mark}</mark>{text.slice(i + mark.length)}</>
}

function formatDate(value, lang) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  try { return d.toLocaleDateString(LOCALES[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d.toDateString() }
}

// One observer for the whole page: anything with [data-reveal] gets .is-in
// when it scrolls into view. Each section's CSS decides what "in" looks like.
function useSectionReveal(root, deps) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const targets = el.querySelectorAll('[data-reveal]:not(.is-in)')
    if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('is-in')); return }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' })
    targets.forEach(t => io.observe(t))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// Fuller body for each chapter popup — every sentence already exists elsewhere
// in identityContent.js; nothing new is written here.
function chapterBody(c, i) {
  const bodies = [
    [c.story.paras[0], c.history.items[0].p],
    [c.vision.intro, c.principles.items[1].p],
    [c.constitution.governanceText, c.history.items[2].p],
    [c.story.formationText],
    [c.vision.visionText, c.vision.missionText, c.principles.closing],
    [c.story.paras[1], c.history.items[1].p],
  ]
  return bodies[i] || []
}

/* ── 01 Story & Formation: maroon · yellow · white editorial ── */
function StorySection({ c }) {
  const s = c.story
  const [openChapter, setOpenChapter] = useState(null)
  // Optional archive photos: drop the files into /public/images and they appear.
  const [photoOk, setPhotoOk] = useState(true)
  const [formationPhotoOk, setFormationPhotoOk] = useState(true)
  return (
    <section id="oi-story" className="oi-section oi-story">
      <div className="container">
        <div className="oi-st-hero">
          <div className="oi-st-head" data-reveal>
            <h2 className="oi-st-title">{s.label}</h2>
            <span className="oi-st-bar" aria-hidden="true" />
            <p className="oi-st-kicker">
              {s.hero.split(' ').map((w, i) => (
                <span key={i} className="oi-word" style={{ '--i': i }}>{w}&nbsp;</span>
              ))}
            </p>
            <p className="oi-st-lead">{s.intro}</p>
          </div>

          <figure className="oi-st-plate" data-reveal>
            <div className="oi-st-plate-inner">
              {photoOk
                ? <img src="/images/our-story-formation.jpg" alt={s.archiveCaption} onError={() => setPhotoOk(false)} />
                : <span className="party-logo-circle oi-party-logo"><img className="oi-st-plate-emblem" src={PARTY_LOGO} alt={c.symbol.symbolTitle} /></span>}
            </div>
            <figcaption>{s.archiveCaption}</figcaption>
          </figure>
        </div>

        <div className="oi-st-story">
          {s.paras.map((p, i) => <p key={i} data-reveal style={{ '--d': `${i * 0.15}s` }}>{p}</p>)}
        </div>
        <blockquote className="oi-st-quote" data-reveal>
          <span className="oi-st-quote-mark" aria-hidden="true">“</span>
          {s.quote}
        </blockquote>
      </div>

      <div className="oi-st-formation" data-reveal>
        <div className={`container oi-st-formation-grid ${formationPhotoOk ? '' : 'no-photo'}`}>
          {formationPhotoOk && (
            <figure className="oi-st-formation-img">
              <img src="/images/formation.jpg" alt={s.formationTitle} onError={() => setFormationPhotoOk(false)} />
            </figure>
          )}
          <div className="oi-st-formation-text">
            <p className="oi-st-formation-tagline">{s.formationTagline}</p>
            <h3>{s.formationTitle}</h3>
            <p>{s.formationText}</p>
          </div>
        </div>
      </div>

      <div className="container oi-st-journey-container">
        <div className="oi-st-journey" data-reveal>
          <h3 className="oi-st-journey-title">{s.timelineTitle}</h3>
          {/* One row of six on desktop; swipeable row on smaller screens. */}
          <div className="oi-st-journey-scroll" tabIndex={0} role="region" aria-label={s.timelineTitle}>
          <ol>
            {s.items.map((it, i) => (
              <li key={i} style={{ '--i': i }}
                role="button" tabIndex={0}
                aria-label={`${c.chapter} ${pad(i + 1)} — ${it.t}`}
                onClick={() => setOpenChapter(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenChapter(i) } }}>
                <span className="oi-st-num">{pad(i + 1)}</span>
                <div className="oi-st-chapter-copy">
                  <span className="oi-st-chapter-label">{c.chapter} {pad(i + 1)}</span>
                  <span className="oi-st-chapter-rule" aria-hidden="true" />
                  <h4>{it.t}</h4>
                  <p>{it.p}</p>
                </div>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </div>

      {openChapter !== null && (
        <ChapterModal
          key={openChapter}
          chapter={{ ...s.items[openChapter], body: chapterBody(c, openChapter) }}
          index={openChapter}
          total={s.items.length}
          chapterLabel={c.chapter}
          labels={{ prev: c.prev, next: c.next, close: c.close }}
          onClose={() => setOpenChapter(null)}
          onNav={(d) => setOpenChapter((i) => Math.min(s.items.length - 1, Math.max(0, i + d)))}
        />
      )}
    </section>
  )
}

/* ── 02 Vision & Mission: icon-based design ───────────── */
function VisionSection({ c }) {
  const v = c.vision
  return (
    <section id="oi-vision" className="oi-section oi-vision">
      <div className="container">
        <div className="oi-vision-head" data-reveal>
          <h2>{v.label}</h2>
          <p>{v.intro}</p>
        </div>

        {/* Compact 2 × 2: Vision | Mission, then Founding Belief | Commitment directly below */}
        <div className="oi-vm-grid" data-reveal>
          <article className="oi-vm-card" style={{ '--i': 0 }}>
            <header><span className="oi-vm-icon"><Eye size={22} /></span><h3>{v.visionLabel}</h3></header>
            <p className="oi-vm-statement"><Mark text={v.visionText} mark={v.visionMark} /></p>
          </article>

          <article className="oi-vm-card" style={{ '--i': 1 }}>
            <header><span className="oi-vm-icon"><Target size={22} /></span><h3>{v.missionLabel}</h3></header>
            <p className="oi-vm-lead"><Mark text={v.missionText} mark={v.missionMark} /></p>
            {v.missionParas.map((p, i) => <p key={i} className="oi-vm-p">{p}</p>)}
          </article>

          <article className="oi-vm-card oi-vm-belief" style={{ '--i': 2 }}>
            <header><span className="oi-vm-icon"><Sprout size={22} /></span><h3>{v.beliefLabel}</h3></header>
            <p className="oi-vm-p">{v.beliefText}</p>
          </article>

          <article className="oi-vm-card" style={{ '--i': 3 }}>
            <header><span className="oi-vm-icon"><Handshake size={22} /></span><h3>{v.commitLabel}</h3></header>
            <p className="oi-vm-p">{v.commitText}</p>
          </article>
        </div>

        <p className="oi-vision-closing" data-reveal>{v.closing}</p>
      </div>
    </section>
  )
}

/* ── 04 Flag & Symbol: interactive artwork explorer (components/FlagExplorer.jsx) ── */
function SymbolSection({ c }) {
  const s = c.symbol
  return (
    <section id="oi-symbol" className="oi-section oi-symbol">
      <div className="container">
        <div className="oi-symbol-head" data-reveal>
          <h2>{s.label}</h2>
          <p>{s.intro}</p>
        </div>
        <FlagExplorer s={s} />
      </div>
    </section>
  )
}

/* ── 05 Leadership Overview: editorial hierarchy ────────────
   Party Leader (featured) + Deputy  →  General Secretary (horizontal)
   →  Regional (empty state until published)  →  maroon CTA.
   All people come from the existing leadership data; nothing is invented. */
const GROUPS = [
  { key: 'party', positions: ['leader', 'deputy'] },
  { key: 'org', positions: ['general_secretary', 'organizer'] },
  { key: 'regional', positions: ['mp', 'provincial', 'district'] },
]
const hasPhoto = (p) => p.image && !/placeholder/i.test(p.image)

// Real photo when one is published; otherwise a maroon portrait placeholder
// (the shared placeholder image is purple and clashes with the palette).
function Portrait({ p }) {
  return hasPhoto(p)
    ? <img src={p.image} alt={p.name} loading="lazy" />
    : <span className="oi-ld-ph" role="img" aria-label={p.name}><UserRound strokeWidth={1.1} /></span>
}

function GroupTitle({ n, children }) {
  return (
    <h3 className="oi-ld-group-title" data-reveal>
      <span className="oi-ld-group-no">{n}</span>{children}
    </h3>
  )
}

function LeaderOverlay({ person, l, onClose }) {
  const [leaving, setLeaving] = useState(false)
  const closeRef = useRef(null)
  const close = () => { setLeaving(true); setTimeout(onClose, 280) }
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className={`oi-ld-overlay${leaving ? ' is-leaving' : ''}`} onClick={close} role="dialog" aria-modal="true" aria-label={person.name}>
      <div className="oi-ld-sheet" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="oi-ld-close" onClick={close} aria-label={l.close}><X size={22} /></button>
        <div className="oi-ld-sheet-photo"><Portrait p={person} /></div>
        <div className="oi-ld-sheet-body">
          <span className="oi-ld-role">{person.position}</span>
          <span className="oi-ld-rule" aria-hidden="true" />
          <h3>{person.name}</h3>
          {person.bio && <p className="oi-ld-sheet-bio">{person.bio}</p>}
          <ul className="oi-ld-facts">
            {person.district && <li><MapPin size={16} /> {person.district}</li>}
            {person.email && <li><Mail size={16} /> <a href={`mailto:${person.email}`}>{person.email}</a></li>}
            {person.phone && <li><Phone size={16} /> <a href={`tel:${person.phone}`}>{person.phone}</a></li>}
          </ul>
          <Link to={`/leadership/${person.slug || person.id}`} className="oi-ld-btn">{l.fullProfile} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </div>
  )
}

function LeaderCard({ p, featured, l, onOpen }) {
  return (
    <button type="button" className={`oi-ld-card${featured ? ' is-featured' : ''}`} onClick={() => onOpen(p)} data-reveal>
      <span className="oi-ld-photo"><Portrait p={p} /></span>
      <span className="oi-ld-info">
        <span className="oi-ld-role">{p.position}</span>
        <span className="oi-ld-rule" aria-hidden="true" />
        <span className="oi-ld-name"><span>{p.name}</span></span>
        {p.bio && <span className="oi-ld-bio">{p.bio}</span>}
        <span className="oi-ld-meta">
          {p.district && <span className="oi-ld-loc"><MapPin size={15} /> {p.district}</span>}
          <span className="oi-ld-more">{l.viewProfile} <ArrowRight size={15} /></span>
        </span>
      </span>
    </button>
  )
}

function LeadershipSection({ c, leaders, loading }) {
  const l = c.leadership
  const [openPerson, setOpenPerson] = useState(null)
  const groups = useMemo(() => Object.fromEntries(GROUPS.map(g => [g.key,
    (leaders || [])
      .filter(p => g.positions.includes(p.positionKey))
      .sort((a, b) => (a.positionOrder ?? 99) - (b.positionOrder ?? 99)),
  ])), [leaders])
  const [lead, ...deputies] = groups.party || []

  return (
    <section id="oi-leadership" className="oi-section oi-leaders">
      <div className="container">
        <div className="oi-leaders-head" data-reveal>
          <h2>{l.label}</h2>
          <p>{l.intro}</p>
        </div>

        {/* I · Party Leadership: leader featured, deputy alongside */}
        <GroupTitle n="I">{l.groups.party}</GroupTitle>
        {lead ? (
          <div className={`oi-ld-party${deputies.length ? '' : ' is-solo'}`}>
            <LeaderCard p={lead} featured l={l} onOpen={setOpenPerson} />
            {deputies.length > 0 && (
              <div className="oi-ld-deputies">
                {deputies.map(p => <LeaderCard key={p.id} p={p} l={l} onOpen={setOpenPerson} />)}
              </div>
            )}
          </div>
        ) : <p className="oi-ld-wait" data-reveal>{loading ? '…' : l.empty}</p>}

        {/* II · Organisational Leadership: horizontal editorial profile */}
        <GroupTitle n="II">{l.groups.org}</GroupTitle>
        {groups.org.length ? (
          <div className="oi-ld-org">
            {groups.org.map(p => (
              <button key={p.id} type="button" className="oi-ld-wide" onClick={() => setOpenPerson(p)} data-reveal>
                <span className="oi-ld-photo"><Portrait p={p} /></span>
                <span className="oi-ld-wide-line" aria-hidden="true" />
                <span className="oi-ld-info">
                  <span className="oi-ld-role">{p.position}</span>
                  <span className="oi-ld-rule" aria-hidden="true" />
                  <span className="oi-ld-name"><span>{p.name}</span></span>
                  {p.bio && <span className="oi-ld-bio">{p.bio}</span>}
                  <span className="oi-ld-meta">
                    {p.district && <span className="oi-ld-loc"><MapPin size={15} /> {p.district}</span>}
                    <span className="oi-ld-more">{l.viewProfile} <ArrowRight size={15} /></span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : <p className="oi-ld-wait" data-reveal>{loading ? '…' : l.empty}</p>}

        {/* III · Regional Leadership: cards when published, otherwise an empty state */}
        <GroupTitle n="III">{l.groups.regional}</GroupTitle>
        {groups.regional.length ? (
          <div className="oi-ld-regional">
            {groups.regional.map(p => <LeaderCard key={p.id} p={p} l={l} onOpen={setOpenPerson} />)}
          </div>
        ) : (
          <div className="oi-ld-empty" data-reveal>
            <svg className="oi-ld-pattern" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              {Array.from({ length: 9 * 22 }, (_, k) => {
                const x = (k % 22) * 19 + 10, y = Math.floor(k / 22) * 19 + 4
                return <circle key={k} cx={x} cy={y} r="1.6" style={{ '--d': `${((k % 22) + Math.floor(k / 22)) * 0.09}s` }} />
              })}
            </svg>
            <span className="oi-ld-empty-ring" aria-hidden="true"><MapPin size={26} /></span>
            <p>{l.regionalEmpty}</p>
          </div>
        )}
      </div>

      {/* Full-leadership call to action */}
      <div className="oi-ld-cta" data-reveal>
        <span className="oi-ld-cta-line" aria-hidden="true" />
        <div className="container">
          <h3>{l.ctaTitle}</h3>
          <p>{l.ctaText}</p>
          <Link to="/leadership" className="oi-ld-cta-btn">{l.ctaButton} <ArrowRight size={18} /></Link>
        </div>
      </div>

      {openPerson && <LeaderOverlay person={openPerson} l={l} onClose={() => setOpenPerson(null)} />}
    </section>
  )
}

/* ── 06 History & Milestones: ascending staircase ─────────
   The eras climb left → right; a maroon line draws along each step. */
function HistorySection({ c }) {
  const h = c.history
  const items = h.items
  const last = items.length - 1
  return (
    <section id="oi-history" className="oi-section oi-history">
      <div className="container">
        <header className="oi-hs-head" data-reveal>
          <div>
            <h2>{h.label}</h2>
            <p className="oi-hs-sub">{h.subtitle}</p>
          </div>
          <p className="oi-hs-intro">{h.intro}</p>
        </header>

        <ol className="oi-hs-stairs" data-reveal style={{ '--n': items.length }}>
          {items.map((it, i) => (
            <li key={i} className={`oi-hs-step${i === last ? ' is-now' : ''}`} style={{ '--i': i, '--rise': last - i }}>
              <span className="oi-hs-num" aria-hidden="true">{pad(i + 1)}</span>
              <span className="oi-hs-era">{it.year}</span>
              <h3>{it.t}</h3>
              <p>{it.p}</p>
            </li>
          ))}
        </ol>

        <div className="oi-hs-closing" data-reveal>
          <span className="oi-hs-arrow" aria-hidden="true" />
          <h3>{h.closingTitle}</h3>
          <p>{h.closing}</p>
        </div>
      </div>
    </section>
  )
}

/* ── 07 Constitution & Policies: official document ─────── */
function ConstitutionSection({ c, policies, documents }) {
  const d = c.constitution
  const realDocs = (documents || []).filter(doc => doc.fileUrl && doc.fileUrl !== '#')
  const articles = [
    {
      title: d.constitutionTitle,
      body: <p>{d.constitutionText}</p>,
    },
    {
      title: d.structureTitle,
      body: (
        <dl className="oi-doc-levels">
          {d.levels.map((lv, i) => (
            <div key={i}><dt>{lv.t}</dt><dd>{lv.p}</dd></div>
          ))}
        </dl>
      ),
    },
    {
      title: d.policiesTitle,
      body: (
        <>
          <p>{d.policiesText}</p>
          {policies?.length > 0 && (
            <ul className="oi-doc-policies">
              {policies.slice(0, 8).map(p => (
                <li key={p.id}><Link to={`/policies/${p.slug || p.id}`}>{p.title}</Link></li>
              ))}
            </ul>
          )}
          <Link to="/policies" className="oi-link">{d.allPolicies} <ArrowRight size={16} /></Link>
        </>
      ),
    },
    {
      title: d.governanceTitle,
      body: <p className="oi-doc-callout">{d.governanceText}</p>,
    },
  ]

  return (
    <section id="oi-constitution" className="oi-section oi-docs">
      <div className="container">
        <div className="oi-docs-head" data-reveal>
          <h2>{d.label}</h2>
        </div>

        <div className="oi-doc-wrap" data-reveal>
          <article className="oi-doc-sheet">
            <p className="oi-doc-preamble">{d.intro}</p>
            {articles.map((a, i) => (
              <section key={i} className="oi-doc-article" data-reveal>
                <span className="oi-doc-rule" aria-hidden="true" />
                <span className="oi-doc-article-no">{d.article} {ROMAN[i]}</span>
                <h3>{a.title}</h3>
                <div className="oi-doc-article-body">{a.body}</div>
              </section>
            ))}

            <footer className="oi-doc-files" data-reveal>
              <span className="oi-doc-rule" aria-hidden="true" />
              <h4>{d.documentsTitle}</h4>
              {realDocs.length > 0 ? (
                <ul>
                  {realDocs.map(doc => (
                    <li key={doc.id}>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <FileText size={18} /> <span>{doc.title}</span> <em>{d.download}</em>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <Link to="/manifesto" className="oi-link">{d.viewDocuments} <ArrowRight size={16} /></Link>
              )}
            </footer>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ── 08 Official Statements: press archive ─────────────── */
function StatementsSection({ c, lang, statements, loading }) {
  const s = c.statements
  const sorted = useMemo(() => [...(statements || [])].sort((a, b) =>
    new Date(b.date || b.publishedAt || 0) - new Date(a.date || a.publishedAt || 0)), [statements])
  const [featured, ...rest] = sorted
  const href = (it) => `/news/${it.slug || it.id}`

  return (
    <section id="oi-statements" className="oi-section oi-press">
      <div className="container">
        <div className="oi-press-masthead" data-reveal>
          <h2><span>{s.label}</span></h2>
          <p>{s.intro}</p>
        </div>

        {!loading && sorted.length === 0 && <p className="oi-press-empty">{s.empty}</p>}

        {featured && (
          <div className="oi-press-layout">
            <article className="oi-press-featured" data-reveal>
              <span className="oi-press-kicker">{s.featured}</span>
              <div className="oi-press-meta">
                {featured.category && <span>{featured.category}</span>}
                <time dateTime={featured.date || featured.publishedAt}>{formatDate(featured.date || featured.publishedAt, lang)}</time>
              </div>
              <h3><Link to={href(featured)}>{featured.title}</Link></h3>
              {featured.excerpt && <p>{featured.excerpt}</p>}
              <Link to={href(featured)} className="oi-press-read">{s.read} <ArrowUpRight size={16} /></Link>
            </article>

            {rest.length > 0 && (
              <aside className="oi-press-archive" aria-label={s.archive}>
                <h4 data-reveal>{s.archive}</h4>
                <ol>
                  {rest.map((it, i) => (
                    <li key={it.id} data-reveal style={{ '--i': i }}>
                      <div className="oi-press-meta">
                        {it.category && <span>{it.category}</span>}
                        <time dateTime={it.date || it.publishedAt}>{formatDate(it.date || it.publishedAt, lang)}</time>
                      </div>
                      <h5><Link to={href(it)}>{it.title}</Link></h5>
                      {it.excerpt && <p>{it.excerpt}</p>}
                      <Link to={href(it)} className="oi-press-read">{s.read} <ArrowUpRight size={14} /></Link>
                    </li>
                  ))}
                </ol>
              </aside>
            )}
          </div>
        )}

        <div className="oi-press-more" data-reveal>
          <Link to="/press-releases" className="oi-link">{s.all} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  )
}

// The page shows ONE chapter at a time, chosen by ?section=<key>.
// Plain /our-identity (or an unknown key) shows Vision & Mission.
const SECTION_KEYS = ['story', 'vision', 'symbol', 'leadership', 'history', 'constitution', 'statements']
const DEFAULT_SECTION = 'vision'

export default function OurIdentity() {
  const { language } = useLanguage()
  const [params] = useSearchParams()
  const requested = params.get('section')
  const active = SECTION_KEYS.includes(requested) ? requested : DEFAULT_SECTION
  const c = IDENTITY[language] || IDENTITY.en
  const root = useRef(null)

  const leaders = useFetch(() => getLeadership(language), [language])
  const policies = useFetch(() => getPolicies({ lang: language }), [language])
  const documents = useFetch(() => getManifesto(language), [language])
  const statements = useFetch(() => getNews({ lang: language, type: 'press', limit: 7 }), [language])

  useEffect(() => {
    setPageSEO({ title: c.title, description: c.subtitle })
  }, [c])

  // Switching section via the dropdown keeps the same path, so the layout's
  // scroll-to-top (keyed on pathname) doesn't fire — reset it here.
  useEffect(() => { window.scrollTo(0, 0) }, [active])

  // `active` is a dependency so the newly shown section's [data-reveal] items are observed.
  useSectionReveal(root, [language, active, leaders.data, policies.data, documents.data, statements.data])

  let section
  switch (active) {
    case 'story': section = <StorySection c={c} />; break
    case 'symbol': section = <SymbolSection c={c} />; break
    case 'leadership': section = <LeadershipSection c={c} leaders={leaders.data} loading={leaders.loading} />; break
    case 'history': section = <HistorySection c={c} />; break
    case 'constitution': section = <ConstitutionSection c={c} policies={policies.data?.items} documents={documents.data} />; break
    case 'statements': section = <StatementsSection c={c} lang={language} statements={statements.data?.items} loading={statements.loading} />; break
    default: section = <VisionSection c={c} />
  }

  return (
    <div className="oi-page" ref={root} lang={language}>
      <PageBanner breadcrumbItems={[{ label: c.title }]} />
      {section}
    </div>
  )
}
