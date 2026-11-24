import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { VISION_SCENES, pickText } from '../../data/roadmapContent'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Icon, Media } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]
const pad = (n) => String(n).padStart(2, '0')

// Desktop: a sticky "stage" whose photo changes as you scroll through seven scenes.
function StickyStory({ t, lang }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const n = VISION_SCENES.length
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const drift = useTransform(scrollYProgress, [0, 1], ['-4%', '4%'])
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(n - 1, Math.max(0, Math.floor(v * n * 0.999)))))

  const jump = (i) => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: top + span * ((i + 0.5) / n), behavior: reduce ? 'auto' : 'smooth' })
  }
  const s = VISION_SCENES[active]

  return (
    <div ref={ref} className="fr-story" style={{ height: `${n * 80}vh` }}>
      <div className="fr-story-sticky">
        <div>
          <p className="tw:font-display tw:text-maroon tw:text-[1.1rem] tw:font-semibold">{pad(active + 1)} / {pad(n)}</p>
          <AnimatePresence mode="wait">
            <motion.div key={s.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.5, ease }}>
              <h3 className="tw:mt-4 tw:text-[clamp(2rem,3.4vw,3rem)] tw:font-semibold tw:leading-tight">{pickText(s.title, lang)}</h3>
              <p className="tw:mt-4 tw:text-[1.25rem] tw:leading-relaxed tw:text-ink tw:max-w-[36ch]">{pickText(s.line, lang)}</p>
            </motion.div>
          </AnimatePresence>
          <div className="tw:mt-8 tw:flex tw:items-center tw:gap-5">
            <div className="fr-scene-dots" role="group" aria-label={t('roadmap.vision.eyebrow')}>
              {VISION_SCENES.map((x, i) => (
                <button key={x.key} type="button" aria-current={i === active ? 'true' : undefined} aria-label={pickText(x.title, lang)} onClick={() => jump(i)} />
              ))}
            </div>
            <span className="tw:relative tw:block tw:h-1 tw:flex-1 tw:max-w-40 tw:rounded tw:bg-maroon/15 tw:overflow-hidden" aria-hidden="true">
              <motion.span className="tw:absolute tw:inset-0 tw:bg-maroon tw:origin-left" style={{ scaleX: bar }} />
            </span>
          </div>
        </div>
        <div className="fr-stage">
          {VISION_SCENES.map((x, i) => (
            <motion.div
              key={x.key}
              className="fr-stage-layer"
              initial={false}
              animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.08, clipPath: i <= active ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }}
              transition={{ duration: 0.9, ease }}
              style={{ zIndex: i === active ? 2 : 1 }}
              aria-hidden={i !== active}
            >
              <motion.div className="tw:absolute tw:inset-[-5%]" style={{ y: drift }}>
                <Media photoKey={x.photo} icon={x.icon} className="tw:absolute tw:inset-0" alt={x.photo ? undefined : pickText(x.title, lang)} sizes="(max-width: 1240px) 55vw, 680px" />
              </motion.div>
            </motion.div>
          ))}
          <span className="fr-stage-tag"><Icon name={s.icon} size={18} /> {pickText(s.title, lang)}</span>
        </div>
      </div>
    </div>
  )
}

// Mobile / tablet: scenes stacked, each revealed as it scrolls in.
function StackedStory({ lang }) {
  return (
    <ol className="tw:flex tw:flex-col tw:gap-14">
      {VISION_SCENES.map((x, i) => (
        <motion.li key={x.key} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease }}>
          <motion.div className="tw:relative tw:aspect-[4/3] tw:rounded-3xl tw:overflow-hidden tw:shadow-xl"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }} whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, ease }}>
            <Media photoKey={x.photo} icon={x.icon} className="tw:absolute tw:inset-0" alt={x.photo ? undefined : pickText(x.title, lang)} sizes="100vw" />
          </motion.div>
          <p className="tw:mt-5 tw:font-display tw:text-maroon tw:font-semibold">{pad(i + 1)} / {pad(VISION_SCENES.length)}</p>
          <h3 className="tw:mt-1 tw:text-[1.8rem] tw:font-semibold tw:leading-tight">{pickText(x.title, lang)}</h3>
          <p className="tw:mt-2 tw:text-[1.15rem]">{pickText(x.line, lang)}</p>
        </motion.li>
      ))}
    </ol>
  )
}

export default function FiftyYearVision({ t, lang, onOpenVision }) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  return (
    <section id="fr-vision" className="fr-vision tw:py-24 tw:lg:pt-32 tw:lg:pb-20" aria-labelledby="fr-vision-title">
      <div className="fr-wrap">
        <div className="tw:relative tw:grid tw:lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] tw:items-end tw:gap-6 tw:mb-14 tw:lg:mb-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.8, ease }}>
            <p className="fr-eyebrow">{t('roadmap.vision.eyebrow')}</p>
            <h2 id="fr-vision-title" className="tw:mt-4 tw:text-[clamp(2.3rem,5vw,4.2rem)] tw:font-semibold tw:leading-[1.08]">{t('roadmap.vision.title')}</h2>
            <p className="tw:mt-5 tw:text-[1.25rem] tw:text-mute tw:max-w-[44ch]">{t('roadmap.vision.sub')}</p>
            <button type="button" className="fr-btn tw:mt-8" onClick={(e) => onOpenVision(e.currentTarget)} aria-haspopup="dialog">
              {t('roadmap.vision.open')} <ArrowRight size={18} aria-hidden="true" />
            </button>
          </motion.div>
          <motion.div className="fr-vision-50 tw:hidden tw:lg:block tw:justify-self-end" aria-hidden="true"
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease }}>
            50
          </motion.div>
        </div>
        {desktop ? <StickyStory t={t} lang={lang} /> : <StackedStory lang={lang} />}
      </div>
    </section>
  )
}
