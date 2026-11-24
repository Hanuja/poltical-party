import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getNews } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import NewsCard from '../components/NewsCard'
import { SkeletonCards, EmptyState, Pagination } from '../components/LoadingSpinner'
import { Search, Newspaper } from 'lucide-react'

const DATE_FILTERS = ['', 'today', 'week', 'month']

function dateCutoff(key) {
  const d = new Date()
  if (key === 'today') d.setHours(0, 0, 0, 0)
  else if (key === 'week') d.setDate(d.getDate() - 7)
  else if (key === 'month') d.setMonth(d.getMonth() - 1)
  else return null
  return d.toISOString().slice(0, 10)
}

export default function News({ fixedType, titleKey }) {
  const { t, language } = useLanguage()
  const locale = language === 'ta' ? 'ta-LK' : language === 'si' ? 'si-LK' : 'en-GB'
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const category = params.get('category') || ''
  const type = fixedType || params.get('type') || ''
  const dateFilter = params.get('date') || ''
  const limit = 9

  const { data, loading } = useFetch(
    () => getNews({ lang: language, page, limit, category: category || undefined, type: type || undefined }),
    [language, page, category, type]
  )

  useEffect(() => {
    setPageSEO({ title: titleKey ? t(titleKey) : t('news.title'), description: t('news.latestTitle') })
  }, [t, language, titleKey])

  const categories = useMemo(() => {
    const set = new Set((data?.items || []).map(n => n.category).filter(Boolean))
    return [...set]
  }, [data])

  const filtered = useMemo(() => {
    let items = data?.items || []
    const cutoff = dateCutoff(dateFilter)
    if (cutoff) items = items.filter(n => n.date >= cutoff)
    if (q) {
      const needle = q.toLowerCase()
      items = items.filter(n =>
        (n.title || '').toLowerCase().includes(needle) ||
        (n.excerpt || '').toLowerCase().includes(needle)
      )
    }
    return items
  }, [data, q, dateFilter])

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 1

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next)
    setPage(1)
  }

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.news'), to: '/news' }, ...(titleKey ? [{ label: t(titleKey) }] : [])]} />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('news.eyebrow')}</span>
            <h2>{titleKey ? t(titleKey) : t('news.latestTitle')}</h2>
          </div>

          <div className="filters-bar">
            <div className="filter-search">
              <Search size={16} />
              <input type="search" className="form-control" placeholder={t('news.searchPlaceholder')}
                value={q} onChange={e => setQ(e.target.value)} aria-label={t('news.searchPlaceholder')} />
            </div>
            {!fixedType && (
              <select className="form-control filter-select" value={category} onChange={e => setParam('category', e.target.value)} aria-label={t('news.filterCategory')}>
                <option value="">{t('news.allCategories')}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <select className="form-control filter-select" value={dateFilter} onChange={e => setParam('date', e.target.value)} aria-label={t('news.filterDate')}>
              <option value="">{t('news.anyDate')}</option>
              <option value="today">{t('news.today')}</option>
              <option value="week">{t('news.thisWeek')}</option>
              <option value="month">{t('news.thisMonth')}</option>
            </select>
          </div>

          {loading ? <SkeletonCards /> : filtered.length === 0 ? (
            <EmptyState title={t('news.noNews')} icon={<Newspaper size={56} />} />
          ) : (
            <>
              <div className="grid grid-3">
                {filtered.map(n => <NewsCard key={n.id} item={n} locale={locale} t={t} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </section>
    </>
  )
}
