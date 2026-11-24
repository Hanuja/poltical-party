import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function LeaderCard({ leader, t }) {
  return (
    <article className="card leader-card">
      <Link to={`/leadership/${leader.slug || leader.id}`} className="leader-photo">
        <img src={leader.image || '/images/placeholder-leader.svg'} alt={leader.name} loading="lazy" />
      </Link>
      <div className="card-body leader-info">
        <h3><Link to={`/leadership/${leader.slug || leader.id}`}>{leader.name}</Link></h3>
        <p className="leader-position">{leader.position}</p>
        {leader.district && <p className="text-muted" style={{ fontSize: '0.85rem' }}><MapPin size={13} /> {leader.district}</p>}
        {leader.bio && <p className="card-excerpt">{leader.bio.slice(0, 110)}{leader.bio.length > 110 ? '…' : ''}</p>}
        <Link to={`/leadership/${leader.slug || leader.id}`} className="read-more">
          {t?.('common.viewProfile') || 'View Profile'} →
        </Link>
      </div>
    </article>
  )
}
