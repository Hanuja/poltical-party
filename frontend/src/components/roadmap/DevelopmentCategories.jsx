import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { CATEGORIES, pickText } from '../../data/roadmapContent'
import { Icon, Media } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]
const ROWS = [CATEGORIES.slice(0, 5), CATEGORIES.slice(5)]

// Ten development areas as expanding photo strips (two rows of five on desktop,
// an accordion on smaller screens). Hover, focus or tap opens a strip.
export default function DevelopmentCategories({ t, lang, onShowOnMap }) {
  const [open, setOpen] = useState(['education', 'technology'])

  const openStrip = (row, key) => setOpen((o) => o.map((v, i) => (i === row ? key : v)))

  return (
    <section id="fr-categories" className="tw:bg-white tw:py-24 tw:lg:py-32" aria-labelledby="fr-cat-title">
      <div className="fr-wrap">
        <motion.header className="tw:grid tw:gap-5 tw:lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] tw:items-end tw:mb-12"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, ease }}>
          <div>
            <p className="fr-eyebrow">{t('roadmap.categories.eyebrow')}</p>
            <h2 id="fr-cat-title" className="tw:mt-4 tw:text-[clamp(2.2rem,4.6vw,3.6rem)] tw:font-semibold tw:leading-tight">{t('roadmap.categories.title')}</h2>
          </div>
          <p className="tw:text-[1.15rem] tw:text-mute">{t('roadmap.categories.sub')}</p>
        </motion.header>

        <div className="tw:flex tw:flex-col tw:gap-3 tw:lg:gap-4">
          {ROWS.map((row, r) => (
            <motion.div key={r} className="fr-strips"
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8, ease, delay: r * 0.1 }}>
              {row.map((c) => {
                const isOpen = open[r] === c.key
                const title = pickText(c.title, lang)
                return (
                  <div
                    key={c.key}
                    className={`fr-strip${c.photo ? '' : ' no-photo'}`}
                    data-open={isOpen ? '' : undefined}
                    onPointerEnter={(e) => { if (e.pointerType === 'mouse') openStrip(r, c.key) }}
                  >
                    <Media photoKey={c.photo} icon={c.icon} alt={c.photo ? undefined : title} sizes="(max-width: 1023px) 100vw, 640px" />
                    <span className="fr-strip-shade" aria-hidden="true" />
                    <button
                      type="button"
                      className="tw:absolute tw:inset-0 tw:z-[1] tw:cursor-pointer tw:bg-transparent tw:border-0"
                      aria-expanded={isOpen}
                      aria-controls={`fr-cat-${c.key}`}
                      onClick={() => openStrip(r, c.key)}
                      onFocus={() => openStrip(r, c.key)}
                    >
                      <span className="tw:sr-only">{title}</span>
                    </button>
                    <span className="fr-strip-icon tw:z-[2] tw:pointer-events-none"><Icon name={c.icon} size={24} /></span>
                    <span className="fr-strip-label tw:z-[2] tw:pointer-events-none" aria-hidden="true">{title}</span>
                    <div id={`fr-cat-${c.key}`} className="fr-strip-body tw:z-[3]" aria-hidden={!isOpen}>
                      <h3>{title}</h3>
                      <p className="tw:mt-2">{pickText(c.desc, lang)}</p>
                      <button type="button" className="fr-strip-go" tabIndex={isOpen ? 0 : -1} onClick={() => onShowOnMap(c.key)}>
                        <MapPin size={17} aria-hidden="true" /> {t('roadmap.categories.showOnMap')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
