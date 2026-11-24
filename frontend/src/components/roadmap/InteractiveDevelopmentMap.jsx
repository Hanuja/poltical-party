import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import L from 'leaflet'
import { AttributionControl, GeoJSON, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, ArrowRight, Info, Layers, RotateCcw } from 'lucide-react'
import { CATEGORIES, DISTRICT_NAMES, PROJECTS, PROVINCE_NAMES, category, pickText } from '../../data/roadmapContent'
import ProjectDetailPanel from './ProjectDetailPanel'
import { Icon, assetUrl } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]
const SL_BOUNDS = L.latLngBounds([5.85, 79.6], [9.9, 81.95])
// OpenStreetMap standard tiles (attribution required); muted to the palette in CSS.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Boundaries: <a href="https://www.geoboundaries.org/">geoBoundaries</a> (ODbL)'
const boundsOf = (feature) => L.geoJSON(feature).getBounds()

// Keeps the view in step with the selection.
function ViewController({ target }) {
  const map = useMap()
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (target?.bounds) map.flyToBounds(target.bounds, { padding: [20, 20], duration: reduce ? 0 : 0.9, maxZoom: target.maxZoom || 10 })
    else if (target?.point) map.flyTo(target.point, Math.max(map.getZoom(), 9), { duration: reduce ? 0 : 0.8 })
  }, [map, target])
  return null
}

function pinIcon(active, dim) {
  return L.divIcon({
    className: 'fr-pin-icon',
    html: `<span class="fr-pin${active ? ' is-active' : ''}${dim ? ' is-dim' : ''}"><span class="fr-pin-dot"></span></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -14],
  })
}

export default function InteractiveDevelopmentMap({ t, lang, categoryKey, onCategory }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [prov, setProv] = useState(null)
  const [dist, setDist] = useState(null)
  const [projectId, setProjectId] = useState(null)
  const [target, setTarget] = useState(null)
  const provRef = useRef(null)

  useEffect(() => {
    let alive = true
    fetch(assetUrl('/data/sri-lanka-boundaries.json'))
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then((j) => { if (alive) { setData(j); setStatus('ready') } })
      .catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [attempt])

  const retry = () => { setStatus('loading'); setAttempt((a) => a + 1) }

  const districts = useMemo(() => (data && prov ? { type: 'FeatureCollection', features: data.districts.features.filter((f) => f.properties.province === prov) } : null), [data, prov])

  const visible = useMemo(() => PROJECTS.filter((p) => !categoryKey || p.category === categoryKey), [categoryKey])
  const inArea = useMemo(() => visible.filter((p) => (!prov || p.province === prov) && (!dist || p.district === dist)), [visible, prov, dist])
  const project = PROJECTS.find((p) => p.id === projectId) || null

  // Selection actions (shared by the map and the accessible side panel).
  const selectProvince = useCallback((key) => {
    setProv(key); setDist(null); setProjectId(null)
    const f = data?.provinces.features.find((x) => x.properties.key === key)
    setTarget(f ? { bounds: boundsOf(f), maxZoom: 9 } : { bounds: SL_BOUNDS })
  }, [data])
  const selectDistrict = useCallback((key) => {
    setDist(key); setProjectId(null)
    const f = data?.districts.features.find((x) => x.properties.key === key)
    if (f) setTarget({ bounds: boundsOf(f), maxZoom: 11 })
  }, [data])
  const resetAll = () => { setProv(null); setDist(null); setProjectId(null); setTarget({ bounds: SL_BOUNDS }) }
  const selectProject = (p) => { setProjectId(p.id); setTarget({ point: p.position }) }

  // Province styling reads the latest selection through a ref, so Leaflet's resetStyle stays correct.
  const provinceStyle = (key, selected) => {
    const sel = key === selected
    return { color: '#800020', weight: sel ? 2.5 : 1.2, opacity: selected && !sel ? 0.35 : 0.85, fillColor: sel ? '#FFC928' : '#800020', fillOpacity: sel ? 0.12 : selected ? 0.02 : 0.07 }
  }
  const selRef = useRef(null)
  const provStyle = useCallback((f) => provinceStyle(f.properties.key, selRef.current), [])
  useEffect(() => { selRef.current = prov; provRef.current?.setStyle(provStyle) }, [prov, provStyle])

  const handlersRef = useRef({})
  useLayoutEffect(() => { handlersRef.current = { selectProvince, selectDistrict, lang } })
  const onEachProvince = useCallback((feature, layer) => {
    const k = feature.properties.key
    layer.bindTooltip(() => pickText(PROVINCE_NAMES[k], handlersRef.current.lang), { sticky: true, className: 'fr-tip', direction: 'top' })
    layer.on({
      click: () => handlersRef.current.selectProvince(k),
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.16, weight: 2.5 }),
      mouseout: (e) => provRef.current?.resetStyle(e.target),
    })
  }, [])
  const onEachDistrict = useCallback((feature, layer) => {
    const k = feature.properties.key
    layer.bindTooltip(() => pickText(DISTRICT_NAMES[k], handlersRef.current.lang), { sticky: true, className: 'fr-tip', direction: 'top' })
    layer.on({
      click: (e) => { L.DomEvent.stopPropagation(e); handlersRef.current.selectDistrict(k) },
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.2 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.06 }),
    })
  }, [])
  const districtStyle = useCallback((f) => {
    const sel = f.properties.key === dist
    return { color: '#590018', weight: sel ? 2.5 : 1, dashArray: sel ? null : '4 4', fillColor: sel ? '#800020' : '#FFC928', fillOpacity: sel ? 0.16 : 0.06 }
  }, [dist])

  const areaName = dist ? pickText(DISTRICT_NAMES[dist], lang) : prov ? pickText(PROVINCE_NAMES[prov], lang) : 'Sri Lanka'

  return (
    <section id="fr-map" className="tw:bg-soft tw:py-24 tw:lg:py-32" aria-labelledby="fr-map-title">
      <div className="fr-wrap">
        <motion.header className="tw:max-w-[820px] tw:mb-10"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, ease }}>
          <p className="fr-eyebrow">{t('roadmap.map.eyebrow')}</p>
          <h2 id="fr-map-title" className="tw:mt-4 tw:text-[clamp(2.2rem,4.6vw,3.6rem)] tw:font-semibold tw:leading-tight">{t('roadmap.map.title')}</h2>
          <p className="tw:mt-5 tw:text-[1.2rem] tw:text-mute">{t('roadmap.map.sub')}</p>
        </motion.header>

        <p className="tw:mb-6 tw:flex tw:gap-3 tw:items-start tw:rounded-2xl tw:bg-white tw:p-4 tw:border-l-4 tw:border-gold tw:text-[1rem]">
          <Info size={20} className="tw:shrink-0 tw:mt-0.5 tw:text-maroon" aria-hidden="true" /> {t('roadmap.map.sampleBanner')}
        </p>

        <div className="tw:mb-6" role="group" aria-label={t('roadmap.map.filter')}>
          <p className="tw:mb-3 tw:flex tw:items-center tw:gap-2 tw:font-semibold"><Layers size={18} className="tw:text-maroon" aria-hidden="true" /> {t('roadmap.map.filter')}</p>
          <div className="fr-chips-scroll">
            <button type="button" className="fr-chip" aria-pressed={!categoryKey} onClick={() => onCategory(null)}>{t('roadmap.map.all')}</button>
            {CATEGORIES.map((c) => (
              <button key={c.key} type="button" className="fr-chip" aria-pressed={categoryKey === c.key} onClick={() => onCategory(categoryKey === c.key ? null : c.key)}>
                <Icon name={c.icon} size={17} className="tw:text-maroon" /> {pickText(c.title, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="tw:grid tw:gap-6 tw:lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] tw:items-start">
          <div className="fr-map-shell" role="region" aria-label={t('roadmap.map.label')}>
            <MapContainer bounds={SL_BOUNDS} maxBounds={SL_BOUNDS.pad(0.6)} minZoom={6} maxZoom={13} scrollWheelZoom={false} zoomSnap={0.25} attributionControl={false}>
              <AttributionControl position="bottomright" prefix='<a href="https://leafletjs.com">Leaflet</a>' />
              <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
              {data && (
                <GeoJSON key={`prov-${lang}`} ref={provRef} data={data.provinces} style={provStyle} onEachFeature={onEachProvince} />
              )}
              {districts && (
                <GeoJSON key={`dist-${prov}-${dist}-${lang}`} data={districts} style={districtStyle} onEachFeature={onEachDistrict} />
              )}
              {visible.map((p) => (
                <Marker
                  key={`${p.id}-${projectId === p.id}-${!!prov && p.province !== prov}`}
                  position={p.position}
                  icon={pinIcon(projectId === p.id, !!prov && p.province !== prov)}
                  title={pickText(p.name, lang)}
                  alt={pickText(p.name, lang)}
                  keyboard
                  eventHandlers={{ click: () => selectProject(p) }}
                />
              ))}
              <ViewController target={target} />
            </MapContainer>
            {status !== 'ready' && (
              <div className="fr-map-state">
                {status === 'loading' ? <p className="tw:font-semibold">{t('roadmap.map.loading')}</p> : (
                  <div>
                    <p className="tw:font-semibold tw:max-w-[36ch]">{t('roadmap.map.error')}</p>
                    <button type="button" className="fr-btn tw:mt-4" onClick={retry}><RotateCcw size={18} aria-hidden="true" /> {t('roadmap.map.retry')}</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div aria-live="polite">
            <AnimatePresence mode="wait">
              {project ? (
                <ProjectDetailPanel key={project.id} project={project} t={t} lang={lang} onBack={() => setProjectId(null)} backLabel={t('roadmap.map.back', { name: areaName })} />
              ) : (
                <motion.div key={`area-${prov}-${dist}`} className="fr-panel tw:p-6"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease }}>
                  {(prov || dist) && (
                    <button type="button" className="tw:inline-flex tw:items-center tw:gap-2 tw:min-h-11 tw:text-maroon tw:font-semibold tw:bg-transparent tw:border-0 tw:p-0 tw:cursor-pointer"
                      onClick={() => (dist ? selectProvince(prov) : resetAll())}>
                      <ArrowLeft size={18} aria-hidden="true" /> {dist ? t('roadmap.map.back', { name: pickText(PROVINCE_NAMES[prov], lang) }) : t('roadmap.map.reset')}
                    </button>
                  )}
                  <p className="tw:mt-2 tw:text-[.85rem] tw:font-bold tw:text-mute">{dist ? t('roadmap.map.district') : prov ? t('roadmap.map.province') : t('roadmap.map.eyebrow')}</p>
                  <h3 className="tw:mt-1 tw:text-[1.8rem] tw:font-semibold tw:leading-tight">{areaName}</h3>
                  {categoryKey && (
                    <p className="tw:mt-2 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-soft tw:px-3 tw:py-1 tw:text-[.9rem] tw:font-semibold">
                      <Icon name={category(categoryKey)?.icon} size={15} className="tw:text-maroon" /> {pickText(category(categoryKey)?.title, lang)}
                    </p>
                  )}

                  <label className="tw:mt-5 tw:block">
                    <span className="tw:block tw:text-[.85rem] tw:font-bold tw:text-mute">{t('roadmap.map.province')}</span>
                    <select className="tw:mt-1 tw:w-full tw:min-h-12 tw:rounded-xl tw:border tw:border-black/15 tw:bg-white tw:px-3 tw:text-[1rem]"
                      value={prov || ''} onChange={(e) => (e.target.value ? selectProvince(e.target.value) : resetAll())}>
                      <option value="">Sri Lanka</option>
                      {Object.keys(PROVINCE_NAMES).map((k) => <option key={k} value={k}>{pickText(PROVINCE_NAMES[k], lang)}</option>)}
                    </select>
                  </label>

                  {prov && districts && (
                    <div className="tw:mt-5">
                      <p className="tw:text-[.85rem] tw:font-bold tw:text-mute">{t('roadmap.map.district')}</p>
                      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
                        {districts.features.map((f) => (
                          <button key={f.properties.key} type="button" className="fr-chip" aria-pressed={dist === f.properties.key} onClick={() => selectDistrict(f.properties.key)}>
                            {pickText(DISTRICT_NAMES[f.properties.key], lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="tw:mt-6 tw:border-t tw:border-black/10 tw:pt-5">
                    <p className="tw:flex tw:justify-between tw:items-baseline tw:gap-3">
                      <span className="tw:font-semibold">{t('roadmap.map.projectsHere')}</span>
                      <span className="tw:text-mute tw:text-[.95rem]">{t('roadmap.map.count', { count: inArea.length })}</span>
                    </p>
                    {inArea.length ? (
                      <ul className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
                        {inArea.map((p) => (
                          <li key={p.id}>
                            <button type="button" onClick={() => selectProject(p)}
                              className="tw:w-full tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-black/10 tw:bg-white tw:p-3 tw:text-left tw:cursor-pointer tw:transition-colors tw:hover:border-maroon tw:hover:bg-soft">
                              <span className="tw:grid tw:place-items-center tw:w-10 tw:h-10 tw:shrink-0 tw:rounded-full tw:bg-maroon tw:text-gold"><Icon name={category(p.category)?.icon} size={18} /></span>
                              <span className="tw:min-w-0 tw:flex-1">
                                <span className="tw:block tw:font-semibold tw:leading-snug">{pickText(p.name, lang)}</span>
                                <span className="tw:block tw:text-[.88rem] tw:text-mute">{pickText(DISTRICT_NAMES[p.district], lang)} · {t('roadmap.sample.badge')}</span>
                              </span>
                              <ArrowRight size={18} className="tw:text-maroon tw:shrink-0" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="tw:mt-3 tw:text-mute">{t('roadmap.map.noProjects')}</p>}
                  </div>
                  <p className="tw:mt-5 tw:text-[.9rem] tw:text-mute">{t('roadmap.map.hint')}</p>
                  {(prov || dist) && (
                    <button type="button" className="fr-btn is-ghost tw:mt-5 tw:w-full" onClick={resetAll}>
                      <RotateCcw size={18} aria-hidden="true" /> {t('roadmap.map.reset')}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
