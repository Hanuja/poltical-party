import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Search, X } from 'lucide-react'

export default function SearchBar({ onClose }) {
  const { t } = useLanguage()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const query = q.trim()
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`)
    onClose?.()
  }

  return (
    <form onSubmit={submit} role="search" style={{ display: 'flex', gap: 8, width: '100%' }}>
      <input
        type="search"
        className="form-control"
        placeholder={t('common.searchPlaceholder')}
        value={q}
        onChange={e => setQ(e.target.value)}
        autoFocus
        aria-label={t('common.search')}
      />
      <button type="submit" className="btn btn-primary" aria-label={t('common.search')}>
        <Search size={18} />
      </button>
      {onClose && (
        <button type="button" className="btn btn-outline" onClick={onClose} aria-label={t('common.close')}>
          <X size={18} />
        </button>
      )}
    </form>
  )
}
