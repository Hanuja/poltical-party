import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { globalSearch } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import { SkeletonCards, EmptyState } from '../components/LoadingSpinner'
import { Search, Newspaper, CalendarDays, Users, FileText, File } from 'lucide-react'
import { formatDate } from '../utils/format'

const TYPE_META = {
  news: { icon: Newspaper, label: 'search.filterNews', base: '/news/' },
  events: { icon: CalendarDays, label: 'search.filterEvents', base: '/events/' },
  leadership: { icon: Users, label: 'search.filterLeadership', base: '/leadership/' },
  policies: { icon: FileText, label: 'search.filterPolicies', base: '/policies/' },
  pages: { icon: File, label: 'search.filterPages', base: '/' },
}

export default function SearchResults() {
  const { t, language } = useLanguage()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const type = params.get('type') || 'all'
  const [pageQ, setPageQ] = useState(q)

  const { data, loading } = useFetch(
    () => q ? globalSearch(q, language, type) : Promise.resolve([]),
    [q, language, type]
  )

  useEffect(() => {
    setPageSEO({ title: `${t('search.title')} — ${q}` })
  }, [t, language, q])

  const results = useMemo(() => data || [], [data])

  const doSearch = (e) => {
    e.preventDefault()
    if (pageQ.trim()) setParams({ q: pageQ.trim(), type })
  }

  const setType = (v) => {
    const next = new URLSearchParams(params)
    if (v === 'all') next.delete('type'); else next.set('type', v)
    setParams(next)
  }

  return (
    <>
      <Breadcrumb items={[{ label: t('common.search'), to: '/search' }, { label: q || t('search.title') }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <form onSubmit={doSearch} className="search-hero">
            <div className="filter-search" style={{ flex: 1 }}>
              <Search size={18} />
              <input
                type="search" className="form-control" autoFocus
                placeholder={t('common.searchPlaceholder')}
                value={pageQ} onChange={e => setPageQ(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">{t('common.search')}</button>
          </form>

          {q && (
            <p className="text-muted mt-2">
              {t('search.resultsFor')} "{q}" — {results.length} {t('search.resultsCount')}
            </p>
          )}

          <div className="category-chips mt-2" style={{ marginBottom: 24 }}>
            {[['all', t('search.inAll')], ['news', t('search.filterNews')], ['events', t('search.filterEvents')], ['leadership', t('search.filterLeadership')], ['policies', t('search.filterPolicies')], ['pages', t('search.filterPages')]].map(([v, label]) => (
              <button key={v} className={`chip${type === v ? ' active' : ''}`} onClick={() => setType(v)}>{label}</button>
            ))}
          </div>

          {!q ? (
            <EmptyState title={t('search.noQuery')} icon={<Search size={56} />} />
          ) : loading ? <SkeletonCards /> : results.length === 0 ? (
            <EmptyState title={t('common.noResults')} hint={t('common.noResultsHint')} icon={<Search size={56} />} />
          ) : (
            <div className="search-results">
              {results.map((r, i) => {
                const meta = TYPE_META[r.type] || TYPE_META.pages
                const Icon = meta.icon
                return (
                  <Link key={i} to={r.url} className="search-result-card">
                    {r.image ? <img src={r.image} alt="" loading="lazy" /> : <div className="search-result-icon"><Icon size={22} /></div>}
                    <div>
                      <span className="badge badge-outline">{t(meta.label)}</span>
                      <h3>{r.title}</h3>
                      {r.excerpt && <p className="text-muted">{r.excerpt}</p>}
                      {r.date && <span className="text-muted" style={{ fontSize: '0.82rem' }}>{formatDate(r.date, language === 'ta' ? 'ta-LK' : language === 'si' ? 'si-LK' : 'en-GB')}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
