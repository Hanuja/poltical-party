import { useLanguage } from '../context/LanguageContext'

export default function SectionTitle({ eyebrow, title, text, dark = false, center = true }) {
  const { t } = useLanguage()
  return (
    <div className={`section-head${center ? ' text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}
