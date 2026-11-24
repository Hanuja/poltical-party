import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { MessageCircle } from 'lucide-react'
import '../styles/floating-voice.css'

export default function PublicVoicesFloatingButton() {
  const { t } = useLanguage()
  const label = t('pv.fabLabel', { defaultValue: 'Public Voices' })
  return (
    <Link
      to="/public-voice"
      className="pvf-btn"
      aria-label={label}
    >
      <span className="pvf-ring" aria-hidden="true" />
      <span className="pvf-icon"><MessageCircle size={22} /></span>
      <span className="pvf-label">{label}</span>
    </Link>
  )
}
