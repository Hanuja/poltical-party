import { useEffect, useRef, useState } from 'react'
import PageBanner from '../components/PageBanner.jsx'
import { PROVINCES } from '../data/geoData'
import { ChevronRight, ChevronDown, Search, RotateCcw, MapPin, Users, Building2, Landmark } from 'lucide-react'
import '../styles/geo-org.css'

const LEVELS = [
  { icon: Landmark, t: 'National Leadership', d: 'The leaders who guide and coordinate the organisation across the entire country.' },
  { icon: Building2, t: 'Provincial Organisation', d: 'Teams working together to coordinate activities across each province.' },
  { icon: Users, t: 'District Organisation', d: 'District teams connecting provincial leadership with local communities.' },
  { icon: MapPin, t: 'Electoral Division Organisation', d: 'Local teams coordinating activities within each electoral division.' },
  { icon: Users, t: 'Local Branch Organisation', d: 'People working together directly within their towns, villages and communities.' },
]

function Node({ label, sub, children, depth = 0, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`go-node depth-${depth} ${open ? 'is-open' : ''}`}>
      <button className="go-node-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="go-node-label">{label}</span>
        {sub && <span className="go-node-sub">{sub}</span>}
        {children && <ChevronDown size={16} className="go-node-chev" />}
      </button>
      {open && children && <div className="go-children">{children}</div>}
    </div>
  )
}

export default function GeoOrg() {
  const root = useRef(null)
  const [prov, setProv] = useState('')
  const [dist, setDist] = useState('')
  const [sel, setSel] = useState(null)
  const [openAll, setOpenAll] = useState(false)

  useEffect(() => {
    const el = root.current; if (!el) return
    const t = el.querySelectorAll('[data-reveal]:not(.is-in)')
    if (!('IntersectionObserver' in window)) { t.forEach(x => x.classList.add('is-in')); return }
    const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: .1 })
    t.forEach(x => io.observe(x)); return () => io.disconnect()
  }, [])

  const provData = PROVINCES.find(p => p.id === prov)
  const districts = provData ? provData.districts : []

  const search = () => {
    if (!prov || !dist) return
    setSel({ prov: provData.name, dist })
  }

  return (
    <div className="go-page" ref={root}>
      <PageBanner breadcrumbItems={[{ label: 'Rise', to: '/' }, { label: 'Our People', to: '/our-people' }, { label: 'Geographic Organisation Chart' }]} />

      {/* Hero */}
      <section className="go-hero">
        <div className="container go-hero-grid">
          <div>
            <span className="go-eyebrow" data-reveal>One Organisation. Many Regions. One Shared Purpose.</span>
            <h1 data-reveal>Geographic Organisation Chart</h1>
            <p data-reveal>Discover how our organisation connects national leadership, provincial teams, district representatives and local communities through a clear and connected structure.</p>
            <div className="go-hero-btns" data-reveal>
              <a href="#go-structure" className="go-btn go-btn-primary">Explore Our Structure</a>
              <a href="#go-search" className="go-btn go-btn-outline">Find My Local Branch</a>
            </div>
          </div>
          <div className="go-map" data-reveal>
            <svg viewBox="0 0 300 380" aria-label="Sri Lanka map illustration">
              <path d="M150 20 L220 60 L240 140 L210 220 L160 300 L120 340 L90 300 L60 220 L70 120 L110 50 Z" fill="#800020" opacity=".12" stroke="#800020" strokeWidth="2" />
              {PROVINCES.slice(0, 9).map((p, i) => (
                <circle key={p.id} cx={90 + (i % 3) * 60} cy={80 + Math.floor(i / 3) * 90} r="10" fill="#800020" opacity=".7" />
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* Five levels */}
      <section className="go-levels">
        <div className="container">
          {LEVELS.map((l, i) => (
            <div key={i} className="go-level" data-reveal>
              <div className="go-level-icon"><l.icon size={26} /></div>
              <div className="go-level-body">
                <span className="go-level-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{l.t}</h3>
                <p>{l.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive hierarchy */}
      <section className="go-structure" id="go-structure">
        <div className="container">
          <div className="go-sec-head" data-reveal>
            <h2>Explore the Structure</h2>
            <p>Click each level to expand and see what is inside.</p>
            <div className="go-controls">
              <button className="go-ctl" onClick={() => setOpenAll(!openAll)}>{openAll ? 'Collapse All' : 'Expand All'}</button>
              <button className="go-ctl" onClick={() => { setProv(''); setDist(''); setSel(null) }}><RotateCcw size={14} /> Reset View</button>
            </div>
          </div>

          <div className="go-tree" data-reveal>
            <Node label="National Leadership" sub="Party Leader · General Secretary · National Executive" defaultOpen={openAll}>
              {PROVINCES.map(p => (
                <Node key={p.id} label={p.name} sub={`${p.districts.length} districts`} defaultOpen={openAll}>
                  {p.districts.map(d => (
                    <Node key={d} label={d} sub="District Organisation" defaultOpen={false}>
                      <div className="go-leaf">
                        <strong>Electoral Divisions</strong>
                        <span>Managed via admin — electoral division records appear here when published.</span>
                      </div>
                      <div className="go-leaf">
                        <strong>Local Branches</strong>
                        <span>Branch details appear here when published by administrators.</span>
                      </div>
                    </Node>
                  ))}
                </Node>
              ))}
            </Node>
          </div>
        </div>
      </section>

      {/* Find My Representative */}
      <section className="go-search" id="go-search">
        <div className="container go-search-grid">
          <div data-reveal>
            <h2>Find Your Local Representative</h2>
            <p>Choose your location to discover the representatives serving your area.</p>
          </div>
          <div className="go-search-form" data-reveal>
            <label>Province
              <select value={prov} onChange={e => { setProv(e.target.value); setDist(''); setSel(null) }}>
                <option value="">Select Province</option>
                {PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>District
              <select value={dist} onChange={e => { setDist(e.target.value); setSel(null) }} disabled={!prov}>
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <button className="go-btn go-btn-primary" onClick={search} disabled={!prov || !dist}><Search size={16} /> Search</button>
            <button className="go-btn go-btn-outline" onClick={() => { setProv(''); setDist(''); setSel(null) }}>Reset</button>
            {sel && (
              <div className="go-result">
                <strong>{sel.prov} — {sel.dist}</strong>
                <p>Representative information for this area will appear here once branch records are published by the administration.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
