import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Building2, ChevronRight, GitBranch, Landmark, Mail,
  MapPin, Network, Phone, Search, Snowflake, TreePalm, Users, X,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { getLeadership, getLeadershipMeta } from '../services/content'
import { setPageSEO } from '../utils/seo'
import PageBanner from '../components/PageBanner.jsx'
import { PROVINCE_REPS } from '../data/provinceReps'
import lkMapRaw from '../assets/lk-districts.svg?raw'
import '../styles/province-reps.css'

// Province Representatives — Northern & Eastern.
// Every profile shown comes from Leadership Management (Published only).
// Districts/GN/DS levels with no published records show an honest
// "pending publication" note — nothing is invented.

const profileHref = (l) => `/leadership/${l.slug || l.id}`
const firstParagraph = (bio = '') => bio.split(/\n\s*\n|\n/).map((s) => s.trim()).find(Boolean) || ''
const shortBioOf = (l) => l.shortBio || firstParagraph(l.bio)
const initials = (name = '') => name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] || '').join('').toUpperCase()
const pad = (n) => String(n).padStart(2, '0')

// Inject province-district hooks into the shared Sri Lanka districts SVG:
// every path gets .pr-map-dist, our districts get data-dk + stagger index.
function buildMapSvg(province) {
  const cfg = PROVINCE_REPS[province]
  if (!cfg) return ''
  let svg = lkMapRaw
    .replace('<svg ', '<svg class="pr-map-svg" preserveAspectRatio="xMidYMid meet" ')
    .replace(/<path /g, '<path class="pr-map-dist" ')
  cfg.districts.forEach((d, i) => {
    svg = svg.replace(`name="${d.map}"`, `name="${d.map}" data-dk="${d.key}" data-i="${i}" pathLength="1"`)
  })
  return svg
}

function Portrait({ leader }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="pr-photo">
      {leader.image && !failed
        ? <img src={leader.image} alt={leader.name} loading="lazy" onError={() => setFailed(true)} />
        : <span className="pr-plate" aria-hidden="true">{initials(leader.name)}</span>}
    </span>
  )
}

const toList = (text = '') => text.split('\n').map((s) => s.replace(/^[\s•*\-–]+/, '').trim()).filter(Boolean)

function RepCard({ leader, t, index = 0, areaLabel, onOpen }) {
  const inner = (
    <>
      <Portrait leader={leader} />
      <span className="pr-rep-body">
        <strong className="pr-rep-name">{leader.name}</strong>
        {leader.position && <span className="pr-rep-role">{leader.position}</span>}
        {areaLabel && <span className="pr-rep-area"><MapPin size={11} /> {areaLabel}</span>}
        {shortBioOf(leader) && <span className="pr-rep-bio">{shortBioOf(leader)}</span>}
        {(leader.phone || leader.email) && (
          <span className="pr-rep-contact">
            {leader.phone && <span><Phone size={12} /> {leader.phone}</span>}
            {leader.email && <span><Mail size={12} /> {leader.email}</span>}
          </span>
        )}
      </span>
      {onOpen
        ? <ChevronRight size={16} className="pr-rep-arrow" aria-hidden="true" />
        : <ArrowRight size={16} className="pr-rep-arrow" aria-hidden="true" />}
    </>
  )
  return (
    <li className="pr-rep pr-reveal" style={{ '--d': index % 6 }}>
      {onOpen ? (
        <button type="button" className="pr-rep-link pr-rep-link--btn" onClick={() => onOpen(leader)}>
          {inner}
        </button>
      ) : (
        <Link to={profileHref(leader)} viewTransition className="pr-rep-link">
          {inner}
        </Link>
      )}
    </li>
  )
}

/* Premium profile popup — full biography from the published record. */
function ProfileModal({ leader, t, districtLabel, provinceLabel, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  if (!leader) return null
  const resp = toList(leader.responsibilities)
  const place = [leader.district && districtLabel(leader.districtKey || leader.district), leader.province && provinceLabel(leader.provinceKey || leader.province)].filter(Boolean).join(', ')
  return (
    <div className="pr-modal-back" onClick={onClose}>
      <aside className="pr-modal" role="dialog" aria-modal="true" aria-label={leader.name} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pr-modal-x" onClick={onClose} aria-label={t('geoStructure.drawer.close')}><X size={20} /></button>
        <div className="pr-modal-head">
          <Portrait leader={leader} />
          <div>
            <h3>{leader.name}</h3>
            {leader.position && <p className="pr-modal-role">{leader.position}</p>}
            {place && <p className="pr-modal-place"><MapPin size={13} /> {place}</p>}
          </div>
        </div>
        {leader.bio && (
          <div className="pr-modal-block">
            <h4>{t('geoStructure.drawer.biography')}</h4>
            <p className="pr-modal-bio">{leader.bio}</p>
          </div>
        )}
        {resp.length > 0 && (
          <div className="pr-modal-block">
            <h4>{t('geoStructure.drawer.responsibilities')}</h4>
            <ul>{resp.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
        {(leader.phone || leader.email || leader.officeBranch) && (
          <div className="pr-modal-block">
            <h4>{t('geoStructure.drawer.contact')}</h4>
            <ul className="pr-modal-contact">
              {leader.phone && <li><Phone size={14} /> {leader.phone}</li>}
              {leader.email && <li><Mail size={14} /> {leader.email}</li>}
              {leader.officeBranch && <li><Building2 size={14} /> {leader.officeBranch}</li>}
            </ul>
          </div>
        )}
        <Link to={profileHref(leader)} viewTransition className="pr-btn pr-btn-primary">
          {t('geoStructure.drawer.viewProfile')} <ArrowRight size={15} />
        </Link>
      </aside>
    </div>
  )
}

/* Elegant empty state — shown only until real profiles are published. */
function TeamEmpty({ t, province }) {
  const Icon = province === 'eastern' ? TreePalm : Snowflake
  return (
    <div className="pr-team-empty pr-reveal" role="status" aria-label={t('provinceReps.noProvinceReps')}>
      <span className="pr-team-empty-icon"><Icon size={30} aria-hidden="true" /></span>
      <span className="pr-team-empty-rule" aria-hidden="true" />
      <p>{t('provinceReps.noProvinceReps')}</p>
    </div>
  )
}

// Interactive SVG map — click delegation on district paths.
function ProvinceMap({ province, selected, onSelect, mapSvg }) {
  const ref = useRef(null)
  useEffect(() => {
    const wrap = ref.current
    if (!wrap) return
    wrap.querySelectorAll('path[data-dk]').forEach((p) => {
      p.classList.toggle('is-sel', p.getAttribute('data-dk') === selected)
    })
  }, [selected])
  return (
    <div
      ref={ref}
      className="pr-map"
      role="group"
      aria-label="Sri Lanka district map"
      onClick={(e) => {
        const p = e.target.closest('path[data-dk]')
        if (p) onSelect(p.getAttribute('data-dk'))
      }}
      dangerouslySetInnerHTML={{ __html: mapSvg.replace('class="pr-map-svg"', `class="pr-map-svg${selected ? ' has-sel' : ''}"`) }}
    />
  )
}

export default function ProvinceReps({ province = 'northern' }) {
  const { t, language } = useLanguage()
  const cfg = PROVINCE_REPS[province]
  const { data, loading, error, reload } = useFetch(() => getLeadership(language), [language])
  const { data: meta } = useFetch(() => getLeadershipMeta().catch(() => null), [])
  const rootRef = useRef(null)
  const [sel, setSel] = useState('')
  const [q, setQ] = useState('')
  const [pos, setPos] = useState('')
  const [modal, setModal] = useState(null)

  const variant = province === 'eastern' ? 'pr-eastern' : 'pr-northern'
  const districtKeys = useMemo(() => cfg.districts.map((d) => d.key), [cfg])

  useEffect(() => {
    setPageSEO({
      title: t(`provinceReps.title.${province}`),
      description: t(`provinceReps.subtitle.${province}`),
    })
  }, [t, language, province])

  // Reveal-on-scroll for .pr-reveal elements.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const els = root.querySelectorAll('.pr-reveal:not(.is-in)')
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return undefined }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }), { threshold: 0.08 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sel, q, pos, loading, data, language])

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

  const leaders = useMemo(() => (data || []).filter((l) => l.provinceKey === province), [data, province])

  const byDistrict = useMemo(() => {
    const out = Object.fromEntries(districtKeys.map((k) => [k, []]))
    const prov = []
    for (const l of leaders) {
      if (l.districtKey && out[l.districtKey]) out[l.districtKey].push(l)
      else prov.push(l)
    }
    return { byDistrict: out, provinceLevel: prov }
  }, [leaders, districtKeys])

  const positions = meta?.positions || []

  const matchQ = (l) => !q || [l.name, l.position, l.district, l.province].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase())
  const matchPos = (l) => !pos || l.positionKey === pos

  const districtReps = sel ? (byDistrict.byDistrict[sel] || []).filter((l) => matchQ(l) && matchPos(l)) : []
  const provinceReps = byDistrict.provinceLevel.filter((l) => matchQ(l) && matchPos(l))

  const selDistrict = cfg.districts.find((d) => d.key === sel)
  const selLabel = sel ? districtLabel(sel) : ''
  const selAll = sel ? (byDistrict.byDistrict[sel] || []) : []
  const contactBits = useMemo(() => {
    if (!sel) return []
    const seen = new Set()
    const bits = []
    for (const l of selAll) {
      for (const [icon, val] of [[Phone, l.phone], [Mail, l.email], [Building2, l.officeBranch]]) {
        if (val && !seen.has(val)) { seen.add(val); bits.push({ icon, val }) }
      }
    }
    return bits
  }, [selAll, sel]) // eslint-disable-line react-hooks/exhaustive-deps

  const mapSvg = useMemo(() => buildMapSvg(province), [province])

  return (
    <div className={`pr-page ${variant}`} ref={rootRef} lang={language}>
      <PageBanner breadcrumbItems={[
        { label: t('nav.ourPeople'), to: '/our-people' },
        { label: t(`provinceReps.title.${province}`) },
      ]} />

      {/* Hero — authentic local photo, maroon wash, cinematic zoom */}
      <section className="pr-hero">
        <div className="pr-hero-media" style={{ backgroundImage: `url(${cfg.hero})` }} aria-hidden="true" />
        <div className="pr-hero-veil" aria-hidden="true" />
        <div className="container pr-hero-inner">
          <span className="pr-eyebrow pr-reveal">{t(`provinceReps.eyebrow.${province}`)}</span>
          <h1 className="pr-title pr-reveal">{t(`provinceReps.title.${province}`)}</h1>
          <span className="pr-rule pr-reveal" aria-hidden="true" />
          <p className="pr-subtitle pr-reveal">{t(`provinceReps.subtitle.${province}`)}</p>
        </div>
      </section>

      {/* District selection */}
      <section className="pr-districts">
        <div className="container">
          <div className="pr-district-bar pr-reveal">
            <button
              type="button"
              className={`pr-district-chip ${!sel ? 'is-active' : ''}`}
              onClick={() => setSel('')}
            >
              <MapPin size={15} /> {t('provinceReps.allDistricts')}
            </button>
            {cfg.districts.map((d, i) => (
              <button
                key={d.key}
                type="button"
                className={`pr-district-chip ${sel === d.key ? 'is-active' : ''}`}
                style={{ '--i': i }}
                onClick={() => setSel(d.key)}
              >
                <span className="pr-district-num">{pad(i + 1)}</span>
                {districtLabel(d.key)}
                <span className="pr-district-count">{(byDistrict.byDistrict[d.key] || []).length}</span>
              </button>
            ))}
          </div>

          {/* Search + position filter */}
          <div className="pr-filters pr-reveal">
            <label className="pr-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('provinceReps.searchPlaceholder')}
                aria-label={t('provinceReps.searchPlaceholder')}
              />
              {q && <button type="button" className="pr-search-clear" onClick={() => setQ('')} aria-label={t('provinceReps.clearSearch')}><X size={14} /></button>}
            </label>
            <label className="pr-pos">
              <select value={pos} onChange={(e) => setPos(e.target.value)} aria-label={t('provinceReps.allPositions')}>
                <option value="">{t('provinceReps.allPositions')}</option>
                {positions.map((p) => <option key={p.key} value={p.key}>{p.labels[language] || p.labels.en}</option>)}
              </select>
              <ChevronRight size={14} className="pr-pos-chev" aria-hidden="true" />
            </label>
          </div>
        </div>
      </section>

      {/* Map + explorer */}
      <section className="pr-explorer">
        <div className="container pr-explorer-grid">
          <div className="pr-map-wrap pr-reveal">
            <ProvinceMap province={province} selected={sel} onSelect={setSel} mapSvg={mapSvg} />
            <p className="pr-map-hint">{t('provinceReps.mapHint')}</p>
          </div>

          <div className="pr-panel pr-reveal" key={sel || 'all'}>
            {loading && <p className="pr-state">{t('provinceReps.loading')}</p>}
            {error && (
              <div className="pr-state">
                <p>{t('provinceReps.error')}</p>
                <button type="button" className="pr-retry" onClick={reload}>{t('provinceReps.retry')}</button>
              </div>
            )}

            {!loading && !error && !sel && (
              <div className="pr-overview">
                <h2>{t(`provinceReps.provinceTeam.${province}`)}</h2>
                <p className="pr-overview-sub">{t('provinceReps.provinceTeamSub')}</p>
                {provinceReps.length > 0 ? (
                  <ul className="pr-rep-list">
                    {provinceReps.map((l, i) => (
                      <RepCard
                        key={l.id} leader={l} t={t} index={i}
                        areaLabel={l.districtKey ? districtLabel(l.districtKey) : provinceLabel(l.provinceKey || province)}
                        onOpen={setModal}
                      />
                    ))}
                  </ul>
                ) : (
                  <TeamEmpty t={t} province={province} />
                )}
                <p className="pr-hint-line"><Users size={15} /> {t('provinceReps.selectHint')}</p>
              </div>
            )}

            {!loading && !error && sel && (
              <div className="pr-district-detail">
                <header className="pr-detail-head">
                  <span className="pr-detail-eyebrow">{t('provinceReps.districtExplorer')}</span>
                  <h2>{selLabel}</h2>
                  <p className="pr-detail-sub">
                    {t('provinceReps.repsCount', { count: selAll.length })}
                  </p>
                </header>

                {/* District coordinator — District Representative profiles */}
                {(() => {
                  const coordinators = selAll.filter((l) => l.positionKey === 'district')
                  const committee = selAll.filter((l) => l.positionKey !== 'district')
                  return (
                    <>
                      <div className="pr-block">
                        <h3 className="pr-block-title"><Landmark size={16} /> {t('provinceReps.districtCoordinator')}</h3>
                        {coordinators.length > 0 ? (
                          <ul className="pr-rep-list pr-rep-list--coord">
                            {coordinators.map((l, i) => <RepCard key={l.id} leader={l} t={t} index={i} />)}
                          </ul>
                        ) : (
                          <p className="pr-empty-sm">{t('provinceReps.noCoordinator')}</p>
                        )}
                      </div>

                      <div className="pr-block">
                        <h3 className="pr-block-title"><Users size={16} /> {t('provinceReps.districtCommittee')}</h3>
                        {committee.length > 0 ? (
                          <ul className="pr-rep-list">
                            {committee.map((l, i) => <RepCard key={l.id} leader={l} t={t} index={i} />)}
                          </ul>
                        ) : (
                          <p className="pr-empty-sm">{t('provinceReps.noCommittee')}</p>
                        )}
                      </div>
                    </>
                  )
                })()}

                {/* Organisational coverage — honest placeholders until published */}
                <div className="pr-block">
                  <h3 className="pr-block-title"><Network size={16} /> {t('provinceReps.coverageTitle')}</h3>
                  <div className="pr-coverage">
                    {['dsDivisions', 'gnDivisions', 'villageReps'].map((k) => (
                      <div key={k} className="pr-cov-card">
                        <GitBranch size={15} aria-hidden="true" />
                        <strong>{t(`provinceReps.coverage.${k}`)}</strong>
                        <span>{t('provinceReps.coverage.pending')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official contact — only real published details */}
                <div className="pr-block">
                  <h3 className="pr-block-title"><Building2 size={16} /> {t('provinceReps.contactTitle')}</h3>
                  {contactBits.length > 0 ? (
                    <ul className="pr-contact">
                      {contactBits.map((b, i) => (
                        <li key={i}><b.icon size={14} aria-hidden="true" /> {b.val}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pr-empty-sm">{t('provinceReps.noContact')}</p>
                  )}
                  {selAll.some((l) => l.officeBranch) && (
                    <p className="pr-office"><MapPin size={13} /> {t('provinceReps.officeLocation')}: {selAll.find((l) => l.officeBranch).officeBranch}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {modal && (
        <ProfileModal
          leader={modal} t={t}
          districtLabel={districtLabel} provinceLabel={provinceLabel}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
