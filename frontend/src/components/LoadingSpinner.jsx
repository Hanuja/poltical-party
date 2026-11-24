import { useLanguage } from '../context/LanguageContext'

export function LoadingSpinner({ label }) {
  const { t } = useLanguage()
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label || t('common.loading')}</p>
    </div>
  )
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i}>
          <div className="skeleton skeleton-card" />
          <div className="card-body">
            <div className="skeleton skeleton-text" style={{ width: '30%' }} />
            <div className="skeleton skeleton-text" style={{ width: '90%' }} />
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, hint, icon }) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)
  return (
    <nav className="pagination" aria-label="Pagination">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous">‹</button>
      {pages.map(p => (
        <button key={p} className={p === page ? 'active' : ''} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}>{p}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next">›</button>
    </nav>
  )
}
