import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Breadcrumb({ items = [] }) {
  const { t } = useLanguage()
  return (
    <div className="breadcrumb">
      <div className="container">
        <nav aria-label="Breadcrumb">
          <Link to="/"><Home size={14} style={{ verticalAlign: '-2px' }} /> {t('nav.home')}</Link>
          {items.map((item, i) => (
            <span key={i}>
              <span className="sep">/</span>
              {item.to && i < items.length - 1
                ? <Link to={item.to}>{item.label}</Link>
                : <span aria-current="page">{item.label}</span>}
            </span>
          ))}
        </nav>
        <h1>{items.length ? items[items.length - 1].label : ''}</h1>
      </div>
    </div>
  )
}
