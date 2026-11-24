import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ChevronRight, Home, Search, X, Loader2, Quote } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { announcementsApi } from '../services/api'
import { setPageSEO } from '../utils/seo'
import {
  Eyebrow, GoldRule, FilterTabs, SubTypeFilters, FeatureCard, ImageCard, ListRow, StateBox, RetryButton, Skeleton,
} from '../components/announcements/annShared'
import { OFFICIAL, CATEGORY_FILTERS, rise, stagger } from '../components/announcements/annUtils'
import '../styles/announcements.css'

const PAGE_SIZE = 9
const SORTS = ['newest', 'oldest']
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '')

// /announcements — archive. Filters live in the URL so a filtered view can be shared or bookmarked.
// Counts, sub-filters and results all come from the API, which only returns what this viewer may open.
export default function Announcements() {
  const { t, language } = useLanguage()
  const [params, setParams] = useSearchParams()

  const category = CATEGORY_FILTERS.includes(params.get('category')) ? params.get('category') : 'all'
  const type = category === OFFICIAL ? (params.get('type') || '') : ''
  const q = params.get('q') || ''
  const from = isDate(params.get('from')) ? params.get('from') : ''
  const to = isDate(params.get('to')) ? params.get('to') : ''
  const sort = SORTS.includes(params.get('sort')) ? params.get('sort') : 'newest'

  const [qInput, setQInput] = useState(q)
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ items: [], total: 0, counts: null, subTypes: [], loading: true, more: false, error: null })
  const reqId = useRef(0)

  const update = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(patch).forEach(([k, v]) => { if (v) next.set(k, v); else next.delete(k) })
      if ('category' in patch && patch.category !== OFFICIAL) next.delete('type')
      if (next.get('category') === 'all') next.delete('category')
      if (next.get('sort') === 'newest') next.delete('sort')
      return next
    }, { replace: true })
  }, [setParams])

  // Debounced title search.
  useEffect(() => { setQInput(q) }, [q])
  useEffect(() => {
    if (qInput.trim() === q) return undefined
    const h = setTimeout(() => update({ q: qInput.trim() }), 400)
    return () => clearTimeout(h)
  }, [qInput, q, update])

  const load = useCallback((pageNo) => {
    const id = ++reqId.current
    setRes((r) => ({ ...r, loading: pageNo === 1, more: pageNo > 1, error: null }))
    announcementsApi.list({
      lang: language, page: pageNo, limit: PAGE_SIZE, sort,
      category: category === 'all' ? undefined : category,
      type: type || undefined, q: q || undefined, from: from || undefined, to: to || undefined,
    }).then((d) => {
      if (id !== reqId.current) return
      setPage(pageNo)
      setRes((r) => ({
        items: pageNo === 1 ? d.items : [...r.items, ...d.items.filter((x) => !r.items.some((y) => y.id === x.id))],
        total: d.total, counts: d.counts, subTypes: d.subTypes || [], loading: false, more: false, error: null,
      }))
    }).catch((e) => {
      if (id !== reqId.current) return
      setRes((r) => ({ ...r, loading: false, more: false, error: e }))
    })
  }, [language, category, type, q, from, to, sort])

  useEffect(() => { load(1) }, [load])

  useEffect(() => {
    setPageSEO({ title: t('announcements.archiveTitle'), description: t('announcements.archiveSubtitle') })
  }, [t, language])

  const { items, total, counts, subTypes } = res
  const filtersActive = category !== 'all' || type || q || from || to || sort !== 'newest'
  const clearAll = () => { setQInput(''); setParams({}, { replace: true }) }
  const [lead, ...after] = items
  const pair = after.slice(0, 2)
  const trio = after.slice(2, 5)
  const list = after.slice(5)
  const resultsKey = [category, type, q, from, to, sort, language].join('|')

  return (
    <MotionConfig reducedMotion="user">
      <div className="an-root tw:bg-white">
        {/* ---------- Hero ---------- */}
        <section className="an-hero" aria-labelledby="an-archive-title">
          <span className="an-hero-shape s1" aria-hidden="true" />
          <span className="an-hero-shape s2" aria-hidden="true" />
          <span className="an-hero-shape s3" aria-hidden="true" />
          <span className="an-hero-lines" aria-hidden="true" />
          <motion.div
            className="an-wrap tw:pt-10 tw:pb-28 tw:md:pt-14 tw:md:pb-36 tw:flex tw:flex-col tw:gap-5"
            variants={stagger(0.1)} initial="hidden" animate="show"
          >
            <motion.nav variants={rise} aria-label={t('announcements.breadcrumb')} className="an-crumbs">
              <Link to="/"><Home size={15} aria-hidden="true" /> {t('nav.home')}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <span aria-current="page">{t('announcements.title')}</span>
            </motion.nav>
            <motion.div variants={rise}><Eyebrow icon={Quote}>{t('announcements.concept')}</Eyebrow></motion.div>
            <motion.h1 variants={rise} id="an-archive-title">{t('announcements.archiveTitle')}</motion.h1>
            <GoldRule delay={0.5} />
            <motion.p variants={rise} className="an-hero-lead">{t('announcements.archiveSubtitle')}</motion.p>
            <motion.div variants={rise} className="tw:flex tw:flex-wrap tw:gap-3 tw:items-center">
              {counts ? (
                <span className="an-count"><strong>{counts.all}</strong> {t('announcements.recordsLabel', { count: counts.all })}</span>
              ) : (
                <span className="an-count" aria-hidden="true" style={{ minWidth: 150, minHeight: 44 }} />
              )}
            </motion.div>
          </motion.div>
        </section>

        {/* ---------- Toolbar ---------- */}
        <div className="an-wrap tw:-mt-16 tw:md:-mt-20 tw:relative tw:z-10">
          <motion.div className="an-toolbar tw:flex tw:flex-col tw:gap-4" variants={rise} initial="hidden" animate="show">
            <FilterTabs t={t} value={category} counts={counts} onChange={(c) => update({ category: c })} layoutId="an-archive-pill" />
            <AnimatePresence initial={false}>
              {category === OFFICIAL && subTypes.length > 0 && (
                <motion.div
                  key="sub" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}
                >
                  <SubTypeFilters t={t} subTypes={subTypes} value={type} counts={counts?.types} onChange={(v) => update({ type: v })} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="tw:grid tw:gap-3 tw:grid-cols-2 tw:lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] tw:items-end">
              <label className="an-field tw:col-span-2 tw:lg:col-span-1">
                <span>{t('announcements.searchLabel')}</span>
                <div className="an-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    type="search" className="an-input" value={qInput} onChange={(e) => setQInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') update({ q: qInput.trim() }) }}
                    placeholder={t('announcements.search')} autoComplete="off" enterKeyHint="search"
                  />
                </div>
              </label>
              <label className="an-field">
                <span>{t('announcements.fromDate')}</span>
                <input type="date" className="an-input" value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} />
              </label>
              <label className="an-field">
                <span>{t('announcements.toDate')}</span>
                <input type="date" className="an-input" value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} />
              </label>
              <label className="an-field tw:col-span-2 tw:lg:col-span-1">
                <span>{t('announcements.sortLabel')}</span>
                <select className="an-input" value={sort} onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.map((s) => <option key={s} value={s}>{t(`announcements.sort.${s}`)}</option>)}
                </select>
              </label>
            </div>
          </motion.div>
        </div>

        {/* ---------- Results ---------- */}
        <section className="an-wrap tw:py-12 tw:md:py-16" aria-labelledby="an-results-label">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:mb-8">
            <p id="an-results-label" className="tw:text-an-mute" aria-live="polite">
              {!res.loading && !res.error && t('announcements.showing', { shown: items.length, total })}
            </p>
            {filtersActive && (
              <button type="button" className="an-linkbtn" onClick={clearAll}><X size={17} aria-hidden="true" /> {t('announcements.clearFilters')}</button>
            )}
          </div>

          {res.loading ? (
            <div className="tw:grid tw:gap-6" aria-busy="true">
              <Skeleton style={{ minHeight: 380, borderRadius: 18 }} />
              <div className="tw:grid tw:gap-6 tw:md:grid-cols-2">
                <Skeleton style={{ minHeight: 320, borderRadius: 18 }} />
                <Skeleton style={{ minHeight: 320, borderRadius: 18 }} />
              </div>
            </div>
          ) : res.error && items.length === 0 ? (
            <StateBox kind="error" title={t('announcements.errorTitle')} text={t('announcements.errorText')}
              action={<RetryButton t={t} onClick={() => load(1)} />} />
          ) : items.length === 0 ? (
            filtersActive ? (
              <StateBox kind="search" title={t('announcements.noMatchTitle')} text={t('announcements.noMatchText')}
                action={<button type="button" className="an-btn an-btn-maroon" onClick={clearAll}>{t('announcements.clearFilters')}</button>} />
            ) : (
              <StateBox title={t('announcements.emptyTitle')} text={t('announcements.emptyText')} />
            )
          ) : (
            <motion.div key={resultsKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="tw:flex tw:flex-col tw:gap-12">
              <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                <FeatureCard a={lead} t={t} language={language} wide eager />
              </motion.div>

              {pair.length > 0 && (
                <motion.div className="tw:grid tw:gap-6 tw:md:grid-cols-2" variants={stagger(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
                  {pair.map((a) => <motion.div key={a.id} variants={rise}><ImageCard a={a} t={t} language={language} /></motion.div>)}
                </motion.div>
              )}

              {trio.length > 0 && (
                <motion.div className="tw:grid tw:gap-6 tw:sm:grid-cols-2 tw:lg:grid-cols-3" variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
                  {trio.map((a) => <motion.div key={a.id} variants={rise}><ImageCard a={a} t={t} language={language} /></motion.div>)}
                </motion.div>
              )}

              {list.length > 0 && (
                <div>
                  <h2 className="an-label tw:mb-2">{t('announcements.moreUpdates')}</h2>
                  <div className="an-list">
                    {list.map((a) => (
                      <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.45 }}>
                        <ListRow a={a} t={t} language={language} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {res.error && <StateBox kind="error" title={t('announcements.errorTitle')} text={t('announcements.errorText')} action={<RetryButton t={t} onClick={() => load(page + 1)} />} />}

              {items.length < total && !res.error && (
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-3">
                  <button type="button" className="an-btn an-btn-maroon" onClick={() => load(page + 1)} disabled={res.more} aria-busy={res.more}>
                    {res.more ? <Loader2 size={18} className="tw:animate-spin" aria-hidden="true" /> : null}
                    {res.more ? t('announcements.loading') : t('announcements.loadMore')}
                  </button>
                  <p className="tw:text-an-mute tw:text-sm">{t('announcements.showing', { shown: items.length, total })}</p>
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>
    </MotionConfig>
  )
}
