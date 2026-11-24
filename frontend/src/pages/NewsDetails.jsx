import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getNewsItem, getNews } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import NewsCard from '../components/NewsCard'
import { LoadingSpinner, EmptyState, SkeletonCards } from '../components/LoadingSpinner'
import { formatDate, readingTime, timeAgo } from '../utils/format'
import { Link2, Calendar, User, ArrowLeft, Check } from 'lucide-react'
import { FacebookIcon, TwitterIcon } from '../components/SocialIcons'
import { useState } from 'react'

export default function NewsDetails() {
  const { slug } = useParams()
  const { t, language } = useLanguage()
  const locale = language === 'ta' ? 'ta-LK' : language === 'si' ? 'si-LK' : 'en-GB'
  const { data: item, loading, error } = useFetch(() => getNewsItem(slug, language), [slug, language])
  const { data: related } = useFetch(
    () => item?.category ? getNews({ lang: language, category: item.category, limit: 4 }) : Promise.resolve({ items: [] }),
    [language, item?.category]
  )
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (item?.title) setPageSEO({ title: item.title, description: item.excerpt, image: item.image, url: window.location.href })
  }, [item, language])

  if (loading) return <div className="container" style={{ padding: '80px 0' }}><LoadingSpinner /></div>
  if (error || !item) {
    return (
      <>
        <Breadcrumb items={[{ label: t('nav.news'), to: '/news' }, { label: t('news.notFound') }]} />
        <section className="section"><div className="container text-center">
          <h2>{t('news.notFound')}</h2>
          <Link to="/news" className="btn btn-primary mt-3"><ArrowLeft size={16} /> {t('nav.news')}</Link>
        </div></section>
      </>
    )
  }

  const shareUrl = encodeURIComponent(window.location.href)
  const shareText = encodeURIComponent(item.title)
  const relatedItems = (related?.items || []).filter(n => n.id !== item.id).slice(0, 3)

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.news'), to: '/news' }, { label: item.category || t('news.categoryNews') }, { label: item.title }]} />
      <article className="section">
        <div className="container article-layout">
          <div className="article-main">
            {item.category && <span className="badge badge-maroon">{item.category}</span>}
            <h1 style={{ marginTop: 14 }}>{item.title}</h1>
            <div className="article-meta">
              <span><User size={15} /> {t('news.author')}: {item.author || '—'}</span>
              <span><Calendar size={15} /> {formatDate(item.date, locale)} · {timeAgo(item.date)}</span>
              <span>{readingTime(item.content)} {t('common.minutesRead')}</span>
            </div>

            <img src={item.image || '/images/placeholder-news-1.svg'} alt={item.title} className="article-image" />
            {item.imageCaption && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: -16, marginBottom: 20 }}>{item.imageCaption}</p>}

            <div className="prose" dangerouslySetInnerHTML={{ __html: item.content || `<p>${item.excerpt}</p>` }} />

            {/* Social sharing */}
            <div className="share-row">
              <span>{t('common.share')}:</span>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><FacebookIcon size={18} /></a>
              <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter"><TwitterIcon size={18} /></a>
              <button onClick={copyLink} aria-label="Copy link">{copied ? <Check size={18} /> : <Link2 size={18} />}</button>
            </div>

            <Link to="/news" className="btn btn-outline mt-3"><ArrowLeft size={16} /> {t('nav.news')}</Link>
          </div>

          {relatedItems.length > 0 && (
            <aside className="article-side">
              <h3>{t('news.relatedNews')}</h3>
              {relatedItems.map(n => (
                <Link key={n.id} to={`/news/${n.slug || n.id}`} className="side-news">
                  <img src={n.image || '/images/placeholder-news-1.svg'} alt="" loading="lazy" />
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDate(n.date, locale)}</span>
                    <h4>{n.title}</h4>
                  </div>
                </Link>
              ))}
            </aside>
          )}
        </div>
      </article>
    </>
  )
}
