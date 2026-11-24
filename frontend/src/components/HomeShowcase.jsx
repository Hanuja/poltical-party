import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Calendar, Clock, Download, MapPin, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { getEvents, getPolicies } from '../services/content'
import { eventImage, onEventImageError } from '../utils/eventImage'
import '../styles/showcase.css'
import '../styles/home-events.css'

const pick = (v, l) => (v && typeof v === 'object' ? (v[l] ?? v.en ?? '') : v) || ''
const fmtDate = (d, l) => { try { return new Date(d).toLocaleDateString(l === 'ta' ? 'ta-LK' : l === 'si' ? 'si-LK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d || '' } }

/* ── Events: cinematic editorial ─────────────────────────── */
const evDate = (e) => e.date || e.startDate || e.eventDate
const isLive = (e) => e.status === 'live'
const isPastish = (e) => ['completed', 'cancelled'].includes(e.status)
const fmtTime = (t) => { if (!t) return ''; const [h, m] = String(t).slice(0, 5).split(':'); const hr = +h % 24; return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }

function LiveBadge({ small }) {
  return <span className={`hev-live${small ? ' hev-live-sm' : ''}`}><i />LIVE NOW</span>
}

function EventTile({ event, lang }) {
  const live = isLive(event)
  const title = pick(event.title, lang)
  const image = eventImage(event)
  return <Link to={`/events/${event.slug || event.id}`} className="hev-card" data-reveal>
    <div className="hev-card-media">
      <img key={image} src={image} alt={title} loading="lazy" onError={onEventImageError} />
      {live ? <LiveBadge small /> : <span className="hev-up-tag">UPCOMING</span>}
      <span className="hev-cat">{pick(event.category, lang) || 'Event'}</span>
    </div>
    <div className="hev-card-body">
      <h4>{title}</h4><p>{pick(event.excerpt || event.description, lang)}</p>
      <div className="hev-meta"><span><Calendar size={14} /> {fmtDate(evDate(event), lang)}</span>{event.startTime && <span><Clock size={14} /> {fmtTime(event.startTime)}</span>}<span><MapPin size={14} /> {pick(event.venue, lang) || 'TBA'}</span></div>
      <span className="hev-cta">View Event <ArrowRight size={15} /></span>
    </div>
  </Link>
}

function EventsBlock({ lang }) {
  const { data, loading, error, reload } = useFetch(() => getEvents({ lang, upcoming: true, homepage: true }), [lang])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') reload() }
    const timer = window.setInterval(refresh, 30_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh) }
  }, [reload])
  const events = Array.isArray(data) ? data : (data?.items || [])

  const sorted = useMemo(() => [...events].sort((a, b) => String(evDate(a)).localeCompare(String(evDate(b)))), [events])
  const liveEvents = useMemo(() => sorted.filter(isLive).sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || (a.displayOrder || 0) - (b.displayOrder || 0)), [sorted])
  const upcoming = sorted.filter((e) => !isLive(e) && !isPastish(e))

  const featured = liveEvents[0] || null
  const sideLive = liveEvents.find((e) => e.id !== featured?.id) || null
  const sideUpcoming = upcoming.slice(0, 3)
  const usedIds = new Set([featured?.id, sideLive?.id, ...sideUpcoming.map((e) => e.id)])
  const more = sorted.filter((e) => !usedIds.has(e.id) && !isPastish(e)).slice(0, 6)

  const evLink = (e) => `/events/${e.slug || e.id}`
  const evImg = (e) => eventImage(e)

  return (
    <section className="sc-section hev" data-reveal>
      <div className="container">
        <div className="hev-head">
          <div className="hev-head-text">
            <span className="sc-eyebrow">RISE | EVENTS &amp; ENGAGEMENT</span>
            <h2>Upcoming &amp; Live Events</h2>
            <p>Discover important gatherings, public programmes, conversations and initiatives shaping the future of our communities.</p>
            <span className="sc-rule" />
          </div>
          <Link to="/events" className="hev-viewall">View All Events <ArrowUpRight size={16} /></Link>
        </div>

        {loading && !data ? (
          <div className="hev-skel" />
        ) : error || data?.source === 'unavailable' ? (
          <p className="sc-empty">Events are temporarily unavailable. Please try again shortly.</p>
        ) : !featured && sideUpcoming.length === 0 ? (
          <p className="sc-empty">No upcoming events published yet.</p>
        ) : (
          <>
            {featured ? <div className="hev-layout">
              <Link to={evLink(featured)} className="hev-featured" data-reveal>
                <div className="hev-featured-media">
                  <img key={evImg(featured)} src={evImg(featured)} alt={pick(featured.title, lang)} loading="lazy" onError={onEventImageError} />
                  <div className="hev-featured-veil" />
                  {isLive(featured) && <LiveBadge />}
                  <span className="hev-cat">{pick(featured.category, lang) || 'Event'}</span>
                </div>
                <div className="hev-featured-body">
                  <h3>{pick(featured.title, lang)}</h3>
                  <p>{pick(featured.excerpt || featured.description, lang)}</p>
                  <div className="hev-meta">
                    <span><Calendar size={15} /> {fmtDate(evDate(featured), lang)}</span>
                    {featured.startTime && <span><Clock size={15} /> {fmtTime(featured.startTime)}</span>}
                    <span><MapPin size={15} /> {pick(featured.venue, lang) || 'TBA'}</span>
                  </div>
                  <span className="hev-cta">{isLive(featured) ? 'Explore Live Event' : 'Explore Event'} <ArrowRight size={16} /></span>
                </div>
              </Link>

              <div className="hev-side">
                {sideLive && (
                  <Link to={evLink(sideLive)} className="hev-side-card hev-side-live" data-reveal>
                    <div className="hev-side-img"><img key={evImg(sideLive)} src={evImg(sideLive)} alt="" loading="lazy" onError={onEventImageError} /><LiveBadge small /></div>
                    <div className="hev-side-info">
                      <span className="hev-cat-sm">{pick(sideLive.category, lang) || 'Event'}</span>
                      <h4>{pick(sideLive.title, lang)}</h4>
                      <span className="hev-side-meta"><Calendar size={13} /> {fmtDate(evDate(sideLive), lang)}{sideLive.startTime ? ` · ${fmtTime(sideLive.startTime)}` : ''}</span>
                      <span className="hev-side-meta"><MapPin size={13} /> {pick(sideLive.venue, lang) || 'TBA'}</span>
                    </div>
                  </Link>
                )}
                {sideUpcoming.map((ev, i) => (
                  <Link key={ev.id} to={evLink(ev)} className="hev-side-card" data-reveal style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="hev-side-img"><img key={evImg(ev)} src={evImg(ev)} alt="" loading="lazy" onError={onEventImageError} /><span className="hev-up-tag">UPCOMING</span></div>
                    <div className="hev-side-info">
                      <span className="hev-cat-sm">{pick(ev.category, lang) || 'Event'}</span>
                      <h4>{pick(ev.title, lang)}</h4>
                      <span className="hev-side-meta"><Calendar size={13} /> {fmtDate(evDate(ev), lang)}{ev.startTime ? ` · ${fmtTime(ev.startTime)}` : ''}</span>
                      <span className="hev-side-meta"><MapPin size={13} /> {pick(ev.venue, lang) || 'TBA'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div> : <div className="hev-grid hev-upcoming-only">{sideUpcoming.map((ev) => <EventTile key={ev.id} event={ev} lang={lang} />)}</div>}

            {more.length > 0 && (
              <div className="hev-grid">
                {more.map((ev) => <EventTile key={ev.id} event={ev} lang={lang} />)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}


/* ── Research: editorial journal ─────────────────────────── */
function ResearchBlock({ lang }) {
  const { t } = useLanguage()
  const { data, loading } = useFetch(() => getPolicies({ lang }), [lang])
  const pubs = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
  const [cat, setCat] = useState('all')
  const cats = useMemo(() => ['all', 'Development', 'Economy', 'Education', 'Healthcare', 'Environment', 'Governance'], [])
  const filtered = cat === 'all' ? pubs : pubs.filter(p => pick(p.category, lang) === cat || pick(p.categoryName, lang) === cat)
  const featured = filtered[0]
  const rest = filtered.slice(1, 7)

  const stats = [
    { n: pubs.length, l: 'Total Publications' },
    { n: new Set(pubs.map(p => pick(p.category, lang) || pick(p.categoryName, lang))).size, l: 'Research Areas' },
    { n: pubs.filter(p => p.type === 'report' || p.docType === 'report').length, l: 'Published Reports' },
    { n: pubs.filter(p => p.status === 'published').length, l: 'Active Projects' },
  ]

  return (
    <section className="sc-section sc-research" data-reveal>
      <div className="container">
        <div className="sc-head sc-head-r">
          <span className="sc-eyebrow">RISE | RESEARCH &amp; KNOWLEDGE</span>
          <h2>Latest Research Highlights</h2>
          <p>Explore research, evidence, publications and insights contributing to sustainable development, social progress and informed decision-making.</p>
          <span className="sc-rule sc-rule-r" />
        </div>

        <div className="sc-stats">
          {stats.map((s, i) => <div key={i} className="sc-stat"><b>{s.n}</b><span>{s.l}</span></div>)}
        </div>

        {!loading && featured && (
          <article className="sc-featured-r">
            <div className="sc-featured-r-cover">
              <img src={featured.image || '/images/research.jpg'} alt="" loading="lazy" />
              <span className="sc-pub-num">№ {String(pubs.indexOf(featured) + 1).padStart(2, '0')}</span>
              <span className="sc-cat-label">{pick(featured.categoryName || featured.category, lang) || 'Research'}</span>
            </div>
            <div className="sc-featured-r-body">
              <span className="sc-featured-tag">FEATURED RESEARCH</span>
              <h3>{pick(featured.title, lang)}</h3>
              <p>{pick(featured.excerpt || featured.description, lang)}</p>
              <div className="sc-meta">
                <span><Users size={15} /> {pick(featured.author, lang) || 'RISE Research'}</span>
                <span><Calendar size={15} /> {fmtDate(featured.publishedAt || featured.date, lang)}</span>
                <span><Clock size={15} /> {pick(featured.readTime, lang) || '5 min read'}</span>
              </div>
              <div className="sc-actions">
                <Link to={`/policies/${featured.slug || featured.id}`} className="sc-btn sc-btn-maroon">Read Research <ArrowRight size={16} /></Link>
                {featured.fileUrl && featured.fileUrl !== '#' && <a href={featured.fileUrl} className="sc-btn sc-btn-outline" download><Download size={15} /> PDF</a>}
              </div>
            </div>
          </article>
        )}

        <div className="sc-cat-nav">
          {cats.map(c => <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c === 'all' ? 'All Research' : c}</button>)}
          <Link to="/policies" className="sc-viewall">View All <ArrowUpRight size={15} /></Link>
        </div>

        {!loading && rest.length === 0 && <p className="sc-empty">No research publications in this category yet.</p>}

        <div className="sc-pubs">
          {rest.map((p, i) => (
            <article key={p.id} className={`sc-pub ${i % 2 ? 'flip' : ''}`} data-reveal>
              <div className="sc-pub-cover"><img src={p.image || '/images/research.jpg'} alt="" loading="lazy" /><span className="sc-pub-type">{pick(p.typeName || p.type, lang) || 'Paper'}</span></div>
              <div className="sc-pub-body">
                <span className="sc-pub-cat">{pick(p.categoryName || p.category, lang) || 'Research'}</span>
                <h4><Link to={`/policies/${p.slug || p.id}`}>{pick(p.title, lang)}</Link></h4>
                <p>{pick(p.excerpt || p.description, lang)}</p>
                <div className="sc-pub-meta">
                  <span>{pick(p.author, lang) || 'RISE Research'}</span>
                  <span>{fmtDate(p.publishedAt || p.date, lang)}</span>
                  {p.fileUrl && p.fileUrl !== '#' && <a href={p.fileUrl} download><Download size={13} /> PDF</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomeShowcase() {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: 0.1 })
    const observe = () => root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    observe()
    const mutations = new MutationObserver(observe)
    mutations.observe(root, { childList: true, subtree: true })
    return () => { mutations.disconnect(); io.disconnect() }
  }, [])
  return <div ref={ref}><EventsBlock /><ResearchBlock /></div>
}
