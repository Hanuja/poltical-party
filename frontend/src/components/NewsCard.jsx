import { Link } from 'react-router-dom'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { formatDate, timeAgo } from '../utils/format'

export default function NewsCard({ item, featured = false, locale = 'en-GB', t }) {
  return (
    <article className={`card news-card${featured ? ' news-card-featured' : ''}`}>
      <Link to={`/news/${item.slug || item.id}`} className="card-img">
        <img src={item.image || '/images/placeholder-news-1.svg'} alt={item.title} loading="lazy" />
        {item.isBreaking && <span className="badge badge-red breaking-badge">{t?.('home.breakingNews') || 'Breaking'}</span>}
        {item.isFeatured && !item.isBreaking && <span className="badge badge-accent">{t?.('home.featuredNews') || 'Featured'}</span>}
      </Link>
      <div className="card-body">
        <div className="card-meta">
          {item.category && <span className="badge badge-outline">{item.category}</span>}
          <span><Calendar size={13} /> {formatDate(item.date, locale)}</span>
          <span><ClockIcon /> {timeAgo(item.date)}</span>
        </div>
        <h3><Link to={`/news/${item.slug || item.id}`}>{item.title}</Link></h3>
        {item.excerpt && <p className="card-excerpt">{item.excerpt}</p>}
        <div className="card-foot">
          {item.author && <span className="text-muted" style={{ fontSize: '0.82rem' }}><User size={13} /> {t?.('news.author')}: {item.author}</span>}
          <Link to={`/news/${item.slug || item.id}`} className="read-more">
            {t?.('common.readMore') || 'Read More'} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}

function ClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
}
