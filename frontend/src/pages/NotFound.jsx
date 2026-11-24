import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useEffect } from 'react'
import { setPageSEO } from '../utils/seo'
import { Home } from 'lucide-react'

export default function NotFound() {
  const { t } = useLanguage()
  useEffect(() => { setPageSEO({ title: t('errors.404title') }) }, [t])
  return (
    <section className="section">
      <div className="container text-center" style={{ padding: '80px 20px' }}>
        <h1 style={{ fontSize: '5rem', color: 'var(--color-primary)' }}>404</h1>
        <h2>{t('errors.404title')}</h2>
        <p className="text-muted mb-3">{t('errors.404text')}</p>
        <Link to="/" className="btn btn-primary"><Home size={16} /> {t('errors.404button')}</Link>
      </div>
    </section>
  )
}
