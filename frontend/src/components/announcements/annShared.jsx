import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CATEGORY_FILTERS, annDate, categoryLabel, typeLabel, annPath, rise, stagger } from './annUtils'
import { ArrowRight, CalendarDays, Megaphone, ScrollText, Newspaper, Landmark, AlertCircle, RotateCcw, SearchX } from 'lucide-react'


const CATEGORY_ICONS = {
  'official-announcements': Landmark,
  'public-notices': ScrollText,
  'press-releases': Newspaper,
}

export function GoldRule({ className = '', delay = 0.15 }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`an-rule ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 0.61, 0.36, 1] }}
    />
  )
}

export function Eyebrow({ children, icon: Icon = Megaphone }) {
  return (
    <span className="an-eyebrow">
      <span className="an-eyebrow-icon" aria-hidden="true"><Icon size={17} strokeWidth={2.2} /></span>
      {children}
    </span>
  )
}

// Cover image with a branded fallback when there is no image or it fails to load.
export function AnnMedia({ a, className = '', sizes, eager = false, iconSize = 44 }) {
  const [failed, setFailed] = useState(false)
  const Icon = CATEGORY_ICONS[a?.category?.slug] || Megaphone
  const show = a?.image && !failed
  return (
    <div className={`an-media ${className}`}>
      {show ? (
        <img
          src={a.image}
          alt={a.imageAlt || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="an-media-fallback" aria-hidden="true"><Icon size={iconSize} strokeWidth={1.4} /></div>
      )}
    </div>
  )
}

export function CardMeta({ a, t, language, showType = true }) {
  return (
    <div className="an-meta">
      <span className="an-tag">{categoryLabel(t, a.category)}</span>
      {showType && a.type && <span className="an-tag an-tag-ghost">{typeLabel(t, a.type)}</span>}
      {a.publishedAt && (
        <time dateTime={a.publishedAt}>
          <CalendarDays size={15} aria-hidden="true" /> {annDate(a.publishedAt, language)}
        </time>
      )}
    </div>
  )
}

export function ReadMore({ t }) {
  return (
    <span className="an-readmore" aria-hidden="true">
      {t('announcements.readMore')} <ArrowRight size={17} />
    </span>
  )
}

// Large featured card. `wide` = image beside text on desktop (archive).
export function FeatureCard({ a, t, language, wide = false, eager = false }) {
  return (
    <article className={`an-card an-feature ${wide ? 'an-feature-wide' : ''}`}>
      <AnnMedia a={a} eager={eager} iconSize={72} sizes="(min-width: 900px) 640px, 100vw" />
      {a.isFeatured && <span className="an-feature-badge an-tag an-tag-maroon">{t('announcements.featured')}</span>}
      <div className="an-feature-body">
        <CardMeta a={a} t={t} language={language} />
        <h3 lang={a.language}>
          <Link to={annPath(a)} className="an-card-link"><span className="an-card-title">{a.title}</span></Link>
        </h3>
        {a.shortDescription && <p className="an-desc" lang={a.language}>{a.shortDescription}</p>}
        <ReadMore t={t} />
      </div>
    </article>
  )
}

// Image card for grids.
export function ImageCard({ a, t, language, headingLevel = 3 }) {
  const H = `h${headingLevel}`
  return (
    <article className="an-card">
      <AnnMedia a={a} className="tw:aspect-[16/10]" sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
      <div className="tw:flex tw:flex-col tw:gap-3 tw:p-5 tw:flex-1">
        <CardMeta a={a} t={t} language={language} />
        <H lang={a.language}>
          <Link to={annPath(a)} className="an-card-link"><span className="an-card-title">{a.title}</span></Link>
        </H>
        {a.shortDescription && <p className="an-desc" lang={a.language}>{a.shortDescription}</p>}
        <ReadMore t={t} />
      </div>
    </article>
  )
}

// Horizontal preview (thumbnail + text).
export function RowCard({ a, t, language }) {
  return (
    <article className="an-card an-row">
      <AnnMedia a={a} iconSize={30} sizes="170px" />
      <div className="an-row-body">
        <CardMeta a={a} t={t} language={language} showType={false} />
        <h3 lang={a.language}>
          <Link to={annPath(a)} className="an-card-link"><span className="an-card-title">{a.title}</span></Link>
        </h3>
        {a.shortDescription && <p className="an-desc" lang={a.language}>{a.shortDescription}</p>}
        <ReadMore t={t} />
      </div>
    </article>
  )
}

// Text-only list row with a calendar-style date.
export function ListRow({ a, t, language }) {
  return (
    <article className="an-list-item">
      <div className="an-list-date" aria-hidden="true">
        <b>{annDate(a.publishedAt, language, { day: '2-digit' })}</b>
        <span>{annDate(a.publishedAt, language, { month: 'short', year: 'numeric' })}</span>
      </div>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:min-w-0">
        <CardMeta a={a} t={t} language={language} />
        <h3 lang={a.language}>
          <Link to={annPath(a)} className="an-card-link"><span className="an-card-title">{a.title}</span></Link>
        </h3>
        {a.shortDescription && <p className="an-desc" lang={a.language} style={{ WebkitLineClamp: 2 }}>{a.shortDescription}</p>}
      </div>
      <ReadMore t={t} />
    </article>
  )
}

// Category filter tabs with live counts and a sliding maroon pill.
export function FilterTabs({ t, value, onChange, counts, layoutId = 'an-filter-pill', label }) {
  return (
    <div className="an-filters" role="group" aria-label={label || t('announcements.filterLabel')}>
      {CATEGORY_FILTERS.map((key) => {
        const active = value === key
        const n = key === 'all' ? counts?.all : counts?.categories?.[key]
        return (
          <button key={key} type="button" className="an-filter" aria-pressed={active} onClick={() => onChange(key)}>
            {active && (
              <motion.span layoutId={layoutId} className="an-filter-bg" transition={{ type: 'spring', stiffness: 420, damping: 38 }} />
            )}
            <span>{t(`announcements.filters.${key}`)}</span>
            {counts && <span className="an-filter-n">{n ?? 0}</span>}
          </button>
        )
      })}
    </div>
  )
}

// Party / General / Government — rendered only when the API returned sub-types for this viewer.
export function SubTypeFilters({ t, subTypes, value, onChange, counts }) {
  if (!subTypes?.length) return null
  return (
    <div className="an-subfilters" role="group" aria-label={t('announcements.subFilterLabel')}>
      <button type="button" className="an-subfilter" aria-pressed={!value} onClick={() => onChange('')}>
        {t('announcements.types.all')}
      </button>
      {subTypes.map((type) => (
        <button key={type} type="button" className="an-subfilter" aria-pressed={value === type} onClick={() => onChange(type)}>
          {typeLabel(t, type)}{counts?.[type] != null ? ` · ${counts[type]}` : ''}
        </button>
      ))}
    </div>
  )
}

export function StateBox({ kind = 'empty', title, text, action }) {
  const Icon = kind === 'error' ? AlertCircle : kind === 'search' ? SearchX : Megaphone
  return (
    <div className="an-state" role={kind === 'error' ? 'alert' : 'status'}>
      <span className="an-state-icon" aria-hidden="true"><Icon size={28} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function RetryButton({ t, onClick }) {
  return (
    <button type="button" className="an-btn an-btn-maroon" onClick={onClick}>
      <RotateCcw size={17} aria-hidden="true" /> {t('announcements.retry')}
    </button>
  )
}

export function Skeleton({ className = '', style }) {
  return <div className={`an-skel ${className}`} style={style} aria-hidden="true" />
}
