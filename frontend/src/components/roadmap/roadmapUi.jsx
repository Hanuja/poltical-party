import {
  BookOpen, BriefcaseBusiness, Building2, Construction, Cpu, GraduationCap, HeartPulse,
  House, Landmark, Sparkles, Sun, TrainFront, Trees, Wheat,
} from 'lucide-react'
import { photo } from '../../data/roadmapContent'

// Icons are referenced by name in data/roadmapContent.js.
export const ICONS = { BookOpen, BriefcaseBusiness, Building2, Construction, Cpu, GraduationCap, HeartPulse, House, Landmark, Sun, TrainFront, Trees, Wheat }
export const Icon = ({ name, ...rest }) => {
  const C = ICONS[name] || Sparkles
  return <C aria-hidden="true" {...rest} />
}

const base = import.meta.env.BASE_URL || '/'
export const assetUrl = (p) => `${base.replace(/\/$/, '')}${p}`

// A photo from data/roadmapPhotos.js, or an illustrated plate when there is no photo.
export function Media({ photoKey, icon, className = '', eager = false, sizes, alt }) {
  const p = photoKey ? photo(photoKey) : null
  return (
    <span className={`fr-media ${className}`}>
      {p ? (
        <img
          src={assetUrl(p.src)}
          alt={alt ?? p.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          draggable="false"
        />
      ) : (
        <span className="fr-illus" role="img" aria-label={alt || ''}>
          <Icon name={icon} />
        </span>
      )}
    </span>
  )
}

export function SampleBadge({ t }) {
  return <span className="fr-badge"><Sparkles size={13} aria-hidden="true" />{t('roadmap.sample.badge')}</span>
}

export const scrollToId = (id) => {
  const el = document.getElementById(id)
  if (!el) return
  const offset = document.querySelector('.site-header')?.offsetHeight || 0
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? 'auto' : 'smooth' })
}
