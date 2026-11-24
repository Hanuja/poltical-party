import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, HandHeart, Info, MapPin } from 'lucide-react'
import { DISTRICT_NAMES, PROVINCE_NAMES, category, pickText } from '../../data/roadmapContent'
import { Icon, Media, SampleBadge } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]

// Details for one map project. Sample projects say so clearly, and their photos are marked illustrative.
export default function ProjectDetailPanel({ project: p, t, lang, onBack, backLabel }) {
  const c = category(p.category)
  return (
    <motion.article
      key={p.id}
      className="fr-panel"
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.45, ease }}
      aria-labelledby={`fr-proj-${p.id}`}
    >
      <div className="tw:relative tw:aspect-[16/10]">
        <Media photoKey={p.photo} icon={c?.icon} className="tw:absolute tw:inset-0" alt={p.photo ? undefined : pickText(p.name, lang)} sizes="(max-width: 1023px) 100vw, 420px" />
        {p.photo && p.sample && (
          <span className="tw:absolute tw:right-3 tw:bottom-3 tw:rounded-full tw:bg-white/90 tw:px-3 tw:py-1 tw:text-[.78rem] tw:font-semibold tw:text-ink">{t('roadmap.sample.photoNote')}</span>
        )}
      </div>
      <div className="tw:p-6">
        <button type="button" className="tw:inline-flex tw:items-center tw:gap-2 tw:min-h-11 tw:text-maroon tw:font-semibold tw:bg-transparent tw:border-0 tw:p-0 tw:cursor-pointer" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" /> {backLabel}
        </button>
        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2 tw:items-center">
          {p.sample && <SampleBadge t={t} />}
          <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-soft tw:px-3 tw:py-1 tw:text-[.85rem] tw:font-semibold">
            <Icon name={c?.icon} size={15} className="tw:text-maroon" /> {pickText(c?.title, lang)}
          </span>
        </div>
        <h3 id={`fr-proj-${p.id}`} className="tw:mt-3 tw:text-[1.6rem] tw:font-semibold tw:leading-tight">{pickText(p.name, lang)}</h3>
        <p className="tw:mt-2 tw:flex tw:items-center tw:gap-2 tw:text-mute tw:text-[.98rem]">
          <MapPin size={17} className="tw:text-maroon tw:shrink-0" aria-hidden="true" />
          {pickText(DISTRICT_NAMES[p.district], lang)}, {pickText(PROVINCE_NAMES[p.province], lang)}
        </p>

        {p.sample && (
          <p className="tw:mt-4 tw:flex tw:gap-2 tw:items-start tw:rounded-xl tw:bg-soft tw:p-3 tw:text-[.9rem] tw:border-l-4 tw:border-gold">
            <Info size={18} className="tw:shrink-0 tw:mt-0.5 tw:text-maroon" aria-hidden="true" /> {t('roadmap.sample.projectNote')}
          </p>
        )}

        <dl className="tw:mt-5 tw:grid tw:gap-4">
          <div>
            <dt className="tw:text-[.85rem] tw:font-bold tw:text-mute">{t('roadmap.map.description')}</dt>
            <dd className="tw:m-0 tw:mt-1 tw:text-[1.05rem]">{pickText(p.desc, lang)}</dd>
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-4">
            <div>
              <dt className="tw:text-[.85rem] tw:font-bold tw:text-mute">{t('roadmap.map.province')}</dt>
              <dd className="tw:m-0 tw:mt-1">{pickText(PROVINCE_NAMES[p.province], lang)}</dd>
            </div>
            <div>
              <dt className="tw:text-[.85rem] tw:font-bold tw:text-mute">{t('roadmap.map.district')}</dt>
              <dd className="tw:m-0 tw:mt-1">{pickText(DISTRICT_NAMES[p.district], lang)}</dd>
            </div>
          </div>
          <div>
            <dt className="tw:flex tw:items-center tw:gap-2 tw:text-[.85rem] tw:font-bold tw:text-mute"><CalendarClock size={16} aria-hidden="true" /> {t('roadmap.map.timeline')}</dt>
            <dd className="tw:m-0 tw:mt-1 tw:font-semibold">{p.timeline}</dd>
          </div>
          <div>
            <dt className="tw:flex tw:justify-between tw:text-[.85rem] tw:font-bold tw:text-mute">
              <span>{t('roadmap.map.progress')}</span><span className="tw:text-ink">{p.progress}%</span>
            </dt>
            <dd className="tw:m-0 tw:mt-2">
              <span className="fr-progress-bar tw:block" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.progress} aria-label={t('roadmap.map.progress')}>
                <motion.span initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1, ease, delay: 0.2 }} />
              </span>
            </dd>
          </div>
          <div>
            <dt className="tw:flex tw:items-center tw:gap-2 tw:text-[.85rem] tw:font-bold tw:text-mute"><HandHeart size={16} aria-hidden="true" /> {t('roadmap.map.benefits')}</dt>
            <dd className="tw:m-0 tw:mt-1 tw:text-[1.05rem]">{pickText(p.benefit, lang)}</dd>
          </div>
        </dl>
      </div>
    </motion.article>
  )
}
