import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function PolicyCard({ policy, t, categoryLabel }) {
  return (
    <article className="card policy-card">
      <Link to={`/policies/${policy.slug || policy.id}`} className="card-img">
        <img src={policy.image || '/images/placeholder-policy.svg'} alt={policy.title} loading="lazy" />
        {policy.category && <span className="badge badge-accent policy-badge">{categoryLabel || policy.category}</span>}
      </Link>
      <div className="card-body">
        <h3><Link to={`/policies/${policy.slug || policy.id}`}>{policy.title}</Link></h3>
        {policy.summary && <p className="card-excerpt">{policy.summary}</p>}
        <Link to={`/policies/${policy.slug || policy.id}`} className="read-more">
          {t?.('common.readMore') || 'Read More'} <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  )
}
