import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Building2, ChevronDown, ChevronRight, GitBranch, Landmark,
  Mail, MapPin, Network, Phone, Search, Snowflake, TreePalm, Users, X,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { getLeadership, getLeadershipMeta } from '../services/content'
import { setPageSEO } from '../utils/seo'
import PageBanner from '../components/PageBanner.jsx'
import { PROVINCE_REPS } from '../data/provinceReps'
import lkMapRaw from '../assets/lk-districts.svg?raw'
import '../styles/geo-structure.css'

// Geographic Organisation Structure — Hierarchy + Map views.
// All people shown are Published leadership profiles; DS/GN/village levels
// render as honest "pending publication" nodes until admin data exists.

const profileHref = (l) => `/leadership/${l.slug || l.id}`
const firstParagraph = (bio = '') => bio.split(/\n\s*\n|\n/).map((s) => s.trim()).find(Boolean) || ''
const shortBioOf = (l) => l.shortBio || firstParagraph(l.bio)
const toList = (text = '') => text.split('\n').map((s) => s.replace(/^[\s•*\-–]+/, '').trim()).filter(Boolean)
const initials = (name = '') => name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] || '').join('').toUpperCase()
const pad = (n) => String(n).padStart(2, '0')

const GEO_PROVINCES = ['northern', 'eastern']

const TARGET_MAPS = new Set(GEO_PROVINCES.flatMap((pv) => PROVINCE_REPS[pv].districts.map((d) => d.map)))

function buildMapSvg() {
  let svg = lkMapRaw
    .replace('viewBox="0 0 1000 1745"', 'viewBox="0 100 980 1250"')
    .replace('<svg ', '<svg class="gs-map-svg" preserveAspectRatio="xMidYMid meet" ')
    .replace(/<path /g, '<path class="gs-map-dist" ')
  ;['northern', 'eastern'].forEach((pv) => {
    PROVINCE_REPS[pv].districts.forEach((d, i) => {
      svg = svg.replace(`name="${d.map}"`, `name="${d.map}" data-dk="${d.key}" data-pv="${pv}" data-i="${i}" pathLength="1"`)
    })
  })
  // Hide every district outside Northern & Eastern — they must not render at all.
  svg = svg.replace(/<path class="gs-map-dist"([^>]*?)name="([^"]+)"([^>]*)>/g,
    (m, pre, name, post) => (TARGET_MAPS.has(name) ? m : `<path class="gs-map-dist"${pre}name="${name}"${post} data-off="1">`))
  return svg
}
const MAP_SVG = buildMapSvg()

function Portrait({ leader, cls = '' }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`gs-photo ${cls}`}>
      {leader.image && !failed
        ? <img src={leader.image} alt={leader.name} loading="lazy" onError={() => setFailed(true)} />
        : <span className="gs-plate" aria-hidden="true">{initials(leader.name)}</span>}
    </span>
  )
}

/* ── Org-chart person node (circular dual-tone portrait) ─────── */
function OrgNode({ leader, onOpen, size = 'md', delay = 0 }) {
  return (
    <button type="button" className={`gsch-node gsch-node--${size}`} style={{ '--d': `${delay}s` }} onClick={() => onOpen(leader)}>
      <span className="gsch-ring"><Portrait leader={leader} cls="gsch-photo" /></span>
      <span className="gsch-label">
        <strong>{leader.name}</strong>
        {leader.position && <span className={size === 'xl' ? 'gsch-badge' : ''}>{leader.position}</span>}
      </span>
    </button>
  )
}

/* Placeholder circle for a level that has no published profile yet. */
function OrgShell({ icon: Icon, label, delay = 0 }) {
  return (
    <div className="gsch-node gsch-node--md gsch-node--shell" style={{ '--d': `${delay}s` }}>
      <span className="gsch-ring gsch-ring--dash"><span className="gsch-shell-icon"><Icon size={22} /></span></span>
      <span className="gsch-label"><strong>{label}</strong></span>
    </div>
  )
}

/* ── Provincial organisation tree ────────────────────────────── */
const SUB_LEVELS = ['l5', 'l6', 'l7'] // DS → GN → Village

function PMember({ leader, onOpen }) {
  return (
    <li>
      <button type="button" className="ptree-member" onClick={() => onOpen(leader)}>
        <Portrait leader={leader} cls="ptree-photo" />
        <span className="ptree-member-text">
          <strong>{leader.name}</strong>
          <span>{leader.position}</span>
          <em>{[leader.district, leader.province].filter(Boolean).join(', ')}</em>
        </span>
        <ChevronRight size={15} className="ptree-member-go" aria-hidden="true" />
      </button>
    </li>
  )
}

/* DS / GN / Village level — expandable, honest pending state until published. */
function PendingLevel({ levelKey, label, sub, expandAll }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { if (expandAll !== null) setOpen(expandAll) }, [expandAll])
  return (
    <div className={`ptree-sub ${open ? 'is-open' : ''}`}>
      <button type="button" className="ptree-sub-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <GitBranch size={13} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={14} className="ptree-chev" aria-hidden="true" />
      </button>
      {open && <p className="ptree-empty">{sub}</p>}
    </div>
  )
}

function DistrictNode({ d, t, onOpen, expandAll, delay }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { if (expandAll !== null) setOpen(expandAll) }, [expandAll])
  return (
    <div className={`ptree-dist ${open ? 'is-open' : ''}`} style={{ '--d': `${delay}s` }}>
      <button type="button" className={`ptree-dist-head ${open ? 'is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <MapPin size={14} aria-hidden="true" />
        <strong>{d.label}</strong>
        <span className="ptree-count">{d.reps.length}</span>
        <ChevronDown size={15} className="ptree-chev" aria-hidden="true" />
      </button>
      <div className={`ptree-dist-body ${open ? 'is-open' : ''}`}>
        <div className="ptree-dist-inner">
          {d.reps.length > 0 ? (
            <ul className="ptree-members">{d.reps.map((l) => <PMember key={l.id} leader={l} onOpen={onOpen} />)}</ul>
          ) : (
            <p className="ptree-empty">{t('geoStructure.pendingStructure')}</p>
          )}
          {SUB_LEVELS.map((lv) => (
            <PendingLevel key={lv} levelKey={lv} label={t(`geoStructure.levels.${lv}`)} sub={t('geoStructure.pendingStructure')} expandAll={expandAll} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProvinceBranch({ pv, provReps, districts, t, provinceLabel, onOpen, expandAll }) {
  const [open, setOpen] = useState(true)
  useEffect(() => { if (expandAll !== null) setOpen(expandAll) }, [expandAll])
  const memberCount = districts.reduce((n, d) => n + d.reps.length, 0) + provReps.length
  const meta = {
    northern: { Icon: Snowflake, desc: t('geoStructure.provinceExplorer.northern') },
    eastern: { Icon: TreePalm, desc: t('geoStructure.provinceExplorer.eastern') },
  }[pv] || { Icon: Landmark, desc: '' }
  return (
    <section className={`ptree-prov ptree-prov--${pv} ${open ? 'is-open' : ''}`}>
      <button type="button" className="ptree-prov-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="ptree-prov-icon"><meta.Icon size={20} aria-hidden="true" /></span>
        <span className="ptree-prov-text">
          <strong>{provinceLabel(pv)}</strong>
          <span>{t('geoStructure.tree.districts', { count: districts.length })} · {t('geoStructure.tree.members', { count: memberCount })}</span>
        </span>
        <ChevronDown size={18} className="ptree-chev" aria-hidden="true" />
      </button>
      <div className={`ptree-prov-body ${open ? 'is-open' : ''}`}>
        <div className="ptree-prov-inner">
          {provReps.length > 0 && (
            <ul className="ptree-members ptree-members--prov">{provReps.map((l) => <PMember key={l.id} leader={l} onOpen={onOpen} />)}</ul>
          )}
          <div className="ptree-districts">
            {districts.map((d, i) => (
              <DistrictNode key={d.key} d={d} t={t} onOpen={onOpen} expandAll={expandAll} delay={i * 0.07} />
            ))}
            {districts.length === 0 && <p className="ptree-empty">{t('geoStructure.filters.noResults')}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProvTree({ geoData, nationalCount, t, provinceLabel, onOpen, expandAll }) {
  return (
    <div className="ptree">
      {/* National Organisation — top node */}
      <div className="ptree-national gs-reveal">
        <span className="ptree-national-icon"><Landmark size={22} aria-hidden="true" /></span>
        <span className="ptree-national-text">
          <strong>{t('geoStructure.tree.national')}</strong>
          <span>{t('geoStructure.tree.members', { count: nationalCount })}</span>
        </span>
      </div>
      {/* fork connector */}
      <div className="ptree-fork" aria-hidden="true"><span className="ptree-fork-trunk" /><span className="ptree-fork-bus" /></div>
      <div className="ptree-provs">
        {geoData.map((p, i) => (
          <ProvinceBranch
            key={p.pv} pv={p.pv} provReps={p.provReps} districts={p.districts}
            t={t} provinceLabel={provinceLabel} onOpen={onOpen} expandAll={expandAll}
          />
        ))}
        {geoData.length === 0 && <p className="ptree-empty ptree-empty--wide">{t('geoStructure.filters.noResults')}</p>}
      </div>
    </div>
  )
}

/* ── Profile drawer ────────────────────────────────────────── */
function ProfileDrawer({ leader, t, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  if (!leader) return null
  const resp = toList(leader.responsibilities)
  const bio = shortBioOf(leader)
  const place = [leader.district, leader.province].filter(Boolean).join(', ')
  return (
    <div className="gs-drawer-back" onClick={onClose}>
      <aside className="gs-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('geoStructure.drawer.title')}>
        <button type="button" className="gs-drawer-x" onClick={onClose} aria-label={t('geoStructure.drawer.close')}><X size={20} /></button>
        <Portrait leader={leader} cls="gs-drawer-photo" />
        <h3>{leader.name}</h3>
        {leader.position && <p className="gs-drawer-role">{leader.position}</p>}
        {place && <p className="gs-drawer-place"><MapPin size={13} /> {place}</p>}
        {bio && (
          <div className="gs-drawer-block">
            <h4>{t('geoStructure.drawer.biography')}</h4>
            <p>{bio}</p>
          </div>
        )}
        {resp.length > 0 && (
          <div className="gs-drawer-block">
            <h4>{t('geoStructure.drawer.responsibilities')}</h4>
            <ul>{resp.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
        {(leader.phone || leader.email || leader.officeBranch) && (
          <div className="gs-drawer-block">
            <h4>{t('geoStructure.drawer.contact')}</h4>
            <ul className="gs-drawer-contact">
              {leader.phone && <li><Phone size={14} /> {leader.phone}</li>}
              {leader.email && <li><Mail size={14} /> {leader.email}</li>}
              {leader.officeBranch && <li><Building2 size={14} /> {leader.officeBranch}</li>}
            </ul>
          </div>
        )}
        <Link to={profileHref(leader)} viewTransition className="gs-btn gs-btn-primary">
          {t('geoStructure.drawer.viewProfile')} <ArrowRight size={15} />
        </Link>
      </aside>
    </div>
  )
}

/* ── Stat counter ──────────────────────────────────────────── */
function Stat({ value, label }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setShown(value); return undefined }
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return
      io.disconnect()
      const t0 = performance.now(), dur = 900
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur)
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return (
    <div className="gs-stat" ref={ref}>
      <strong>{shown}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function GeoStructure() {
  const { t, language } = useLanguage()
  const { data, loading, error, reload } = useFetch(() => getLeadership(language), [language])
  const { data: meta } = useFetch(() => getLeadershipMeta().catch(() => null), [])
  const rootRef = useRef(null)
  const [tab, setTab] = useState('hierarchy')
  const [q, setQ] = useState('')
  const [fProv, setFProv] = useState('')
  const [fDist, setFDist] = useState('')
  const [drawer, setDrawer] = useState(null)
  const [mapSel, setMapSel] = useState('')
  const [mapProv, setMapProv] = useState('all')
  const [mapHover, setMapHover] = useState('')
  const [mapQ, setMapQ] = useState('')
  const [expandAll, setExpandAll] = useState(null)
  const [treeProv, setTreeProv] = useState('all')
  const [dq, setDq] = useState('')
  const [mapZoom, setMapZoom] = useState(1)
  const mapWrapRef = useRef(null)

  // Toggle .is-sel/.is-dim on district paths inside the injected SVG.
  useEffect(() => {
    const wrap = mapWrapRef.current
    if (!wrap) return
    wrap.querySelectorAll('path[data-dk]').forEach((p) => {
      const dk = p.getAttribute('data-dk')
      p.classList.toggle('is-sel', dk === mapSel)
      p.classList.toggle('is-dim', mapProv !== 'all' && p.getAttribute('data-pv') !== mapProv)
    })
  }, [mapSel, mapProv, tab])

  useEffect(() => {
    setPageSEO({ title: t('geoStructure.title'), description: t('geoStructure.subtitle') })
  }, [t, language])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const els = root.querySelectorAll('.gs-reveal:not(.is-in)')
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return undefined }
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }), { threshold: 0.08 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [tab, loading, data, q, mapSel, language])

  const leaders = useMemo(() => (data || []).filter((l) => GEO_PROVINCES.includes(l.provinceKey) || !l.provinceKey), [data])

  const districtLabel = useMemo(() => {
    const map = new Map((meta?.districts || []).map((d) => [d.key, d]))
    return (key) => {
      const d = map.get(key)
      return d ? (d.labels[language] || d.labels.en) : key
    }
  }, [meta, language])
  const provinceLabel = useMemo(() => {
    const map = new Map((meta?.provinces || []).map((p) => [p.key, p]))
    return (key) => {
      const p = map.get(key)
      return p ? (p.labels[language] || p.labels.en) : key
    }
  }, [meta, language])

  /* ── leadership levels + geographic members ── */
  const { leaderP, gsP, deputies, exec, geoLeaders } = useMemo(() => {
    const isGeo = (l) => l.provinceKey && GEO_PROVINCES.includes(l.provinceKey)
    const leaderP = leaders.find((l) => l.positionKey === 'leader') || null
    const gsP = leaders.find((l) => l.positionKey === 'general_secretary') || null
    const deputies = leaders.filter((l) => l.positionKey === 'deputy')
    const exec = leaders.filter((l) =>
      ['organizer', 'mp', 'executive'].includes(l.positionKey) || (l.positionKey === 'member' && !isGeo(l)))

    const nationalIds = new Set([leaderP, gsP, ...deputies, ...exec].filter(Boolean).map((l) => l.id))
    const geoLeaders = leaders.filter((l) => !nationalIds.has(l.id) && isGeo(l))

    return { leaderP, gsP, deputies, exec, geoLeaders }
  }, [leaders]) // eslint-disable-line react-hooks/exhaustive-deps
  const nationalCount = [leaderP, gsP, ...deputies, ...exec].filter(Boolean).length

  /* ── stats (real counts only) ── */
  const stats = useMemo(() => {
    const geo = leaders.filter((l) => l.provinceKey)
    const provs = new Set(geo.map((l) => l.provinceKey))
    const dists = new Set(geo.map((l) => l.districtKey).filter(Boolean))
    const nat = leaders.filter((l) => ['leader', 'general_secretary', 'deputy', 'organizer', 'mp', 'executive'].includes(l.positionKey))
    return { provinces: provs.size, districts: dists.size, representatives: geo.length, national: nat.length }
  }, [leaders])

  /* ── search + cascading filters ── */
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return leaders.filter((l) => {
      if (qq && ![l.name, l.position, l.district, l.province].filter(Boolean).join(' ').toLowerCase().includes(qq)) return false
      if (fProv && l.provinceKey !== fProv) return false
      if (fDist && l.districtKey !== fDist) return false
      return true
    })
  }, [leaders, q, fProv, fDist])
  const filtering = q || fProv || fDist
  const filterDistricts = (meta?.districts || []).filter((d) => !fProv || d.province === fProv)

  /* ── provincial tree data (province filter + district search) ── */
  const geoData = useMemo(() => {
    const needle = dq.trim().toLowerCase()
    return GEO_PROVINCES
      .filter((pv) => treeProv === 'all' || treeProv === pv)
      .map((pv) => {
        const cfg = PROVINCE_REPS[pv]
        const districts = cfg.districts
          .map((d) => ({
            key: d.key,
            label: districtLabel(d.key),
            reps: geoLeaders.filter((l) => l.provinceKey === pv && l.districtKey === d.key),
          }))
          .filter((d) => !needle || d.label.toLowerCase().includes(needle))
        const provReps = geoLeaders.filter((l) => l.provinceKey === pv && !l.districtKey)
        return { pv, provReps, districts }
      })
      .filter((p) => p.districts.length > 0 || p.provReps.length > 0 || !needle)
  }, [geoLeaders, districtLabel, treeProv, dq])

  /* ── map district panel data ── */
  const mapDetail = useMemo(() => {
    if (!mapSel) return null
    const all = (data || []).filter((l) => l.districtKey === mapSel)
    const coord = all.filter((l) => l.positionKey === 'district')
    const committee = all.filter((l) => l.positionKey !== 'district')
    const contacts = []
    const seen = new Set()
    all.forEach((l) => [[Phone, l.phone], [Mail, l.email], [Building2, l.officeBranch]].forEach(([I, v]) => {
      if (v && !seen.has(v)) { seen.add(v); contacts.push({ icon: I, val: v }) }
    }))
    return { all, coord, committee, contacts }
  }, [mapSel, data])

  const openDrawer = setDrawer

  /* all 8 explorer districts (Northern + Eastern only) for search/cards */
  const explorerDistricts = useMemo(() => GEO_PROVINCES.flatMap((pv) =>
    PROVINCE_REPS[pv].districts.map((d) => ({ key: d.key, pv, label: districtLabel(d.key) }))),
  [districtLabel])
  const mapSearchHits = useMemo(() => {
    const needle = mapQ.trim().toLowerCase()
    if (!needle) return []
    return explorerDistricts.filter((d) => d.label.toLowerCase().includes(needle)).slice(0, 6)
  }, [mapQ, explorerDistricts])
  const mapHoverLabel = mapHover ? (explorerDistricts.find((d) => d.key === mapHover)?.label || '') : ''

  return (
    <div className="gs-page" ref={rootRef} lang={language}>
      <PageBanner breadcrumbItems={[{ label: t('nav.ourPeople'), to: '/our-people' }, { label: t('geoStructure.title') }]} />

      {/* Stats — real counts only */}
      {!loading && !error && (
        <section className="gs-stats">
          <div className="container gs-stats-grid">
            <Stat value={stats.provinces} label={t('geoStructure.stats.provinces')} />
            <Stat value={stats.districts} label={t('geoStructure.stats.districts')} />
            <Stat value={stats.representatives} label={t('geoStructure.stats.representatives')} />
            <Stat value={stats.national} label={t('geoStructure.stats.national')} />
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="container gs-tabs-wrap">
        <div className="gs-tabs" role="tablist">
          {['hierarchy', 'map'].map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`gs-tab ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>
              {t(`geoStructure.tabs.${k}`)}
            </button>
          ))}
        </div>
      </div>

      <main className="container gs-main" id="gs-main">
        {loading && <p className="gs-state">{t('geoStructure.loading')}</p>}
        {error && (
          <div className="gs-state">
            <p>{t('geoStructure.error')}</p>
            <button type="button" className="gs-btn gs-btn-outline" onClick={reload}>{t('geoStructure.retry')}</button>
          </div>
        )}

        {!loading && !error && tab === 'hierarchy' && (
          <>
            {/* Province explorers */}
            <section className="gs-explorers gs-reveal">
              <h2 className="gs-sec-title">{t('geoStructure.provinceExplorer.title')}</h2>
              <div className="gs-explorer-grid">
                {['northern', 'eastern'].map((pv) => (
                  <article key={pv} className={`gs-explorer gs-explorer--${pv}`}>
                    <div className="gs-explorer-media" style={{ backgroundImage: `url(${PROVINCE_REPS[pv].hero})` }} aria-hidden="true" />
                    <div className="gs-explorer-veil" aria-hidden="true" />
                    <div className="gs-explorer-body">
                      <h3>{t(`geoStructure.provinceExplorer.${pv}`)}</h3>
                      <p>{t(`geoStructure.provinceExplorer.${pv}Desc`)}</p>
                      <span className="gs-explorer-count">{PROVINCE_REPS[pv].districts.length}</span>
                      <button type="button" className="gs-btn gs-btn-light" onClick={() => setTab('map')}>
                        {t('geoStructure.provinceExplorer.explore')} <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Search + cascading filters */}
            <section className="gs-searchbar gs-reveal">
              <label className="gs-search">
                <Search size={16} aria-hidden="true" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('geoStructure.searchPlaceholder')} aria-label={t('geoStructure.searchLabel')} />
                {q && <button type="button" onClick={() => setQ('')} aria-label={t('provinceReps.clearSearch')}><X size={14} /></button>}
              </label>
              <div className="gs-cascade">
                <select value={fProv} onChange={(e) => { setFProv(e.target.value); setFDist('') }} aria-label={t('geoStructure.filters.province')}>
                  <option value="">{t('geoStructure.filters.allProvinces')}</option>
                  {GEO_PROVINCES.map((pv) => <option key={pv} value={pv}>{provinceLabel(pv)}</option>)}
                </select>
                <select value={fDist} onChange={(e) => setFDist(e.target.value)} disabled={!fProv} aria-label={t('geoStructure.filters.district')}>
                  <option value="">{t('geoStructure.filters.allDistricts')}</option>
                  {filterDistricts.map((d) => <option key={d.key} value={d.key}>{d.labels[language] || d.labels.en}</option>)}
                </select>
                <select disabled aria-label={t('geoStructure.filters.ds')} title={t('geoStructure.filters.noSubUnits')}>
                  <option>{t('geoStructure.filters.ds')} —</option>
                </select>
                <select disabled aria-label={t('geoStructure.filters.gn')} title={t('geoStructure.filters.noSubUnits')}>
                  <option>{t('geoStructure.filters.gn')} —</option>
                </select>
                <select disabled aria-label={t('geoStructure.filters.village')} title={t('geoStructure.filters.noSubUnits')}>
                  <option>{t('geoStructure.filters.village')} —</option>
                </select>
                {filtering && <button type="button" className="gs-clear" onClick={() => { setQ(''); setFProv(''); setFDist('') }}>{t('geoStructure.filters.clear')}</button>}
              </div>
            </section>

            {filtering ? (
              <section className="gs-results gs-reveal">
                <p className="gs-results-count">{t('geoStructure.filters.results', { count: filtered.length })}</p>
                {filtered.length === 0 ? (
                  <p className="gs-empty">{t('geoStructure.filters.noResults')}</p>
                ) : (
                  <ul className="gs-result-list">
                    {filtered.map((l) => (
                      <li key={l.id}>
                        <button type="button" className="gs-result" onClick={() => setDrawer(l)}>
                          <Portrait leader={l} />
                          <span><strong>{l.name}</strong><span>{l.position}</span></span>
                          <span className="gs-result-area">{[l.district, l.province].filter(Boolean).join(', ')}</span>
                          <ChevronRight size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              /* Interactive hierarchy */
              <section className="gs-tree-wrap gs-reveal">
                <div className="gs-tree-toolbar">
                  <button type="button" className="gs-ctl" onClick={() => setExpandAll(true)}>{t('geoStructure.expandAll')}</button>
                  <button type="button" className="gs-ctl" onClick={() => setExpandAll(false)}>{t('geoStructure.collapseAll')}</button>
                  <button type="button" className="gs-ctl" onClick={() => document.getElementById('gs-main')?.scrollIntoView({ behavior: 'smooth' })}>{t('geoStructure.resetView')}</button>
                </div>
                <div className="gs-tree-scroll">
                  {/* ── Premium vertical org chart ── */}
                  <div className="gsch">
                    {/* L1 · Party Leader */}
                    {leaderP
                      ? <OrgNode leader={leaderP} onOpen={openDrawer} size="xl" delay={0.1} />
                      : <OrgShell icon={Landmark} label={t('geoStructure.levels.l1')} delay={0.1} />}
                    {(leaderP || gsP) && <span className="gsch-link" style={{ '--d': '0.4s' }} aria-hidden="true" />}

                    {/* L2 · General Secretary */}
                    {gsP
                      ? <OrgNode leader={gsP} onOpen={openDrawer} size="lg" delay={0.55} />
                      : <OrgShell icon={Users} label={t('geoStructure.nodes.generalSecretary')} delay={0.55} />}

                    {/* L3 · Deputy Leaders — horizontal branch */}
                    {deputies.length > 0 && (
                      <>
                        <span className="gsch-trunk" style={{ '--d': '0.85s' }} aria-hidden="true" />
                        <div className="gsch-branch" style={{ '--n': deputies.length }}>
                          {deputies.map((l, i) => (
                            <div className="gsch-cell" key={l.id} style={{ '--d': `${0.95 + i * 0.12}s` }}>
                              <OrgNode leader={l} onOpen={openDrawer} size="md" delay={0} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* L4 · Executive Committee */}
                    {exec.length > 0 && (
                      <>
                        <span className="gsch-link" style={{ '--d': '1.5s' }} aria-hidden="true" />
                        <div className="gsch-exec">
                          {exec.map((l, i) => (
                            <OrgNode key={l.id} leader={l} onOpen={openDrawer} size="sm" delay={1.6 + i * 0.06} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Geographic organisation hierarchy ── */}
                  <div className="gsch-geo">
                    <div className="gsch-geo-head">
                      <h3 className="gsch-geo-title"><GitBranch size={18} aria-hidden="true" /> {t('geoStructure.eyebrow')}</h3>
                      <div className="ptree-controls">
                        <div className="ptree-prov-tabs" role="tablist" aria-label={t('geoStructure.filters.province')}>
                          {[['all', t('geoStructure.filters.allProvinces')], ['northern', provinceLabel('northern')], ['eastern', provinceLabel('eastern')]].map(([k, lbl]) => (
                            <button key={k} type="button" role="tab" aria-selected={treeProv === k}
                              className={`ptree-prov-tab ${treeProv === k ? 'is-active' : ''}`} onClick={() => setTreeProv(k)}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                        <label className="ptree-search">
                          <Search size={15} aria-hidden="true" />
                          <input type="search" value={dq} onChange={(e) => setDq(e.target.value)} placeholder={t('geoStructure.tree.searchDistrict')} aria-label={t('geoStructure.tree.searchDistrict')} />
                          {dq && <button type="button" onClick={() => setDq('')} aria-label={t('provinceReps.clearSearch')}><X size={13} /></button>}
                        </label>
                      </div>
                    </div>
                    <ProvTree
                      geoData={geoData} nationalCount={nationalCount} t={t}
                      provinceLabel={provinceLabel} onOpen={openDrawer} expandAll={expandAll}
                    />
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Map view ── */}
        {!loading && !error && tab === 'map' && (
          <section className="gs-mapview gs-reveal">
            <header className="gs-map-head">
              <h2>{t('geoStructure.mapTitle')}</h2>
              <p>{t('geoStructure.mapSub')}</p>
            </header>

            {/* Province selection — Northern & Eastern only */}
            <div className="gs-prov-cards">
              {GEO_PROVINCES.map((pv) => {
                const Icon = pv === 'northern' ? Snowflake : TreePalm
                const active = mapProv === pv
                return (
                  <button
                    key={pv} type="button"
                    className={`gs-prov-card ${active ? 'is-active' : ''} ${mapProv !== 'all' && !active ? 'is-dim' : ''}`}
                    onClick={() => setMapProv((p) => (p === pv ? 'all' : pv))}
                    aria-pressed={active}
                  >
                    <span className="gs-prov-card-icon"><Icon size={20} aria-hidden="true" /></span>
                    <span className="gs-prov-card-text">
                      <strong>{provinceLabel(pv)}</strong>
                      <span>{t('geoStructure.tree.districts', { count: PROVINCE_REPS[pv].districts.length })}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* District search + hover name + clear selection */}
            <div className="gs-map-controls">
              <label className="ptree-search gs-map-search">
                <Search size={15} aria-hidden="true" />
                <input type="search" value={mapQ} onChange={(e) => setMapQ(e.target.value)} placeholder={t('geoStructure.districtSearch')} aria-label={t('geoStructure.districtSearch')} />
                {mapQ && <button type="button" onClick={() => setMapQ('')} aria-label={t('provinceReps.clearSearch')}><X size={13} /></button>}
              </label>
              {mapHoverLabel && <span className="gs-map-hovername" aria-live="polite">{mapHoverLabel}</span>}
              {mapSel && (
                <button type="button" className="gs-clear" onClick={() => { setMapSel(''); setMapProv('all') }}>
                  <X size={13} aria-hidden="true" /> {t('geoStructure.clearSelection')}
                </button>
              )}
            </div>
            {mapSearchHits.length > 0 && (
              <div className="gs-map-chips">
                {mapSearchHits.map((d) => (
                  <button key={d.key} type="button" className="gs-map-chip" onClick={() => { setMapSel(d.key); setMapProv(d.pv); setMapQ('') }}>
                    {d.label} <span>{provinceLabel(d.pv)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="gs-map-grid">
              <div className="gs-map-canvas">
              <div className="gs-map-tools">
                <button type="button" className="gs-ctl" onClick={() => setMapZoom((z) => Math.min(2.4, +(z + 0.25).toFixed(2)))} aria-label={t('geoStructure.mapZoom.zoomIn')}>+</button>
                <button type="button" className="gs-ctl" onClick={() => setMapZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label={t('geoStructure.mapZoom.zoomOut')}>−</button>
                <button type="button" className="gs-ctl" onClick={() => { setMapZoom(1); setMapSel(''); setMapProv('all') }}>{t('geoStructure.mapZoom.resetMap')}</button>
              </div>
              <div
                className="gs-map"
                ref={mapWrapRef}
                role="group"
                aria-label="Northern and Eastern Sri Lanka district map"
                onClick={(e) => {
                  const p = e.target.closest('path[data-dk]')
                  if (p) setMapSel(p.getAttribute('data-dk'))
                }}
                onMouseOver={(e) => {
                  const p = e.target.closest('path[data-dk]')
                  setMapHover(p ? p.getAttribute('data-dk') : '')
                }}
                onMouseOut={() => setMapHover('')}
                dangerouslySetInnerHTML={{ __html: MAP_SVG.replace('class="gs-map-svg"', `class="gs-map-svg" style="height:${Math.round(72 * mapZoom)}vh"`) }}
              />
              </div>
              <aside className="gs-map-panel" key={mapSel || 'none'}>
                {!mapSel && <p className="gs-map-empty">{t('provinceReps.mapHint')}</p>}
                {mapSel && mapDetail && (
                  <>
                    <header>
                      <span className="gs-map-eyebrow">{t('geoStructure.filters.district')}</span>
                      <h3>{districtLabel(mapSel)}</h3>
                      <p>{t('provinceReps.repsCount', { count: mapDetail.all.length })}</p>
                    </header>
                    {/* District → DS → GN → Village expandable hierarchy */}
                    <div className="gs-map-block">
                      <h4><Network size={14} /> {t('geoStructure.tree.hierarchy')}</h4>
                      <div className="ptree-sub is-open">
                        <div className="ptree-sub-head ptree-sub-head--static">
                          <Building2 size={13} aria-hidden="true" />
                          <span>{t('geoStructure.levels.l4')}</span>
                          <span className="ptree-count">{mapDetail.all.length}</span>
                        </div>
                        {mapDetail.all.length > 0 ? (
                          <ul className="ptree-members">
                            {mapDetail.all.map((l) => (
                              <li key={l.id}>
                                <button type="button" className="ptree-member" onClick={() => setDrawer(l)}>
                                  <Portrait leader={l} cls="ptree-photo" />
                                  <span className="ptree-member-text"><strong>{l.name}</strong><span>{l.position}</span></span>
                                  <ChevronRight size={14} className="ptree-member-go" aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="ptree-empty">{t('geoStructure.pendingStructure')}</p>
                        )}
                      </div>
                      {SUB_LEVELS.map((lv) => (
                        <PendingLevel key={lv} levelKey={lv} label={t(`geoStructure.levels.${lv}`)} sub={t('geoStructure.pendingStructure')} expandAll={null} />
                      ))}
                    </div>
                    {mapDetail.contacts.length > 0 && (
                      <div className="gs-map-block">
                        <h4><Building2 size={14} /> {t('provinceReps.contactTitle')}</h4>
                        <ul className="gs-map-contact">
                          {mapDetail.contacts.map((c, i) => <li key={i}><c.icon size={13} /> {c.val}</li>)}
                        </ul>
                      </div>
                    )}
                    {(() => {
                      const pv = Object.keys(PROVINCE_REPS).find((p) => PROVINCE_REPS[p].districts.some((d) => d.key === mapSel)) || 'northern'
                      return (
                        <Link to={`/our-people/${pv}`} className="gs-btn gs-btn-primary">
                          {t('geoStructure.viewDistrictOrg')} <ArrowRight size={15} />
                        </Link>
                      )
                    })()}
                  </>
                )}
              </aside>
            </div>
          </section>
        )}
      </main>

      {drawer && <ProfileDrawer leader={drawer} t={t} onClose={() => setDrawer(null)} />}
    </div>
  )
}
