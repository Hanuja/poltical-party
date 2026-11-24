import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarClock, HandHeart, Info, ListChecks, Target, X } from 'lucide-react'
import { MILESTONES, category, pickList, pickText } from '../../data/roadmapContent'
import { Icon, Media, SampleBadge } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]

function Block({ icon: I, title, items }) {
  return (
    <div>
      <h3 className="tw:flex tw:items-center tw:gap-3 tw:text-[1.3rem] tw:font-semibold">
        <span className="tw:grid tw:place-items-center tw:w-10 tw:h-10 tw:rounded-full tw:bg-soft tw:text-maroon"><I size={20} aria-hidden="true" /></span>
        {title}
      </h3>
      <ul className="tw:mt-4 tw:flex tw:flex-col tw:gap-3">
        {items.map((x, i) => <li key={i} className="fr-list-item tw:text-[1.05rem]">{x}</li>)}
      </ul>
    </div>
  )
}

// Full-screen plan view for one milestone. Esc / close button / backdrop close it,
// Tab stays inside, focus returns to the milestone that opened it.
export default function MilestoneDetailModal({ index, onClose, onStep, t, lang }) {
  const m = index != null ? MILESTONES[index] : null
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!m) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [m])

  useEffect(() => {
    if (!m) return undefined
    closeRef.current?.focus({ preventScroll: true })
    dialogRef.current?.closest('.fr-modal-backdrop')?.scrollTo({ top: 0 })
  }, [m])

  useEffect(() => {
    if (!m) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled)
        if (!f.length) return
        const first = f[0]; const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [m, onClose])

  return (
    <AnimatePresence>
      {m && (
        <motion.div
          key="backdrop"
          className="fr-modal-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            ref={dialogRef}
            className="fr-modal tw:my-0 tw:sm:my-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fr-modal-title"
            initial={{ opacity: 0, y: 60, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.5, ease }}
          >
            <button ref={closeRef} type="button" className="fr-modal-close" onClick={onClose} aria-label={t('roadmap.modal.close')}>
              <X size={24} aria-hidden="true" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={m.key} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35, ease }}>
                <div className="fr-modal-hero">
                  <Media photoKey={m.photo} className="tw:absolute tw:inset-0" eager sizes="(max-width: 1080px) 100vw, 1080px" />
                </div>

                <div className="tw:px-5 tw:sm:px-10 tw:lg:px-14 tw:py-9 tw:lg:py-12">
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
                    <span className="tw:font-display tw:text-[3.2rem] tw:leading-none tw:font-bold tw:text-maroon">{m.years}</span>
                    {m.sample && <SampleBadge t={t} />}
                  </div>
                  <h2 id="fr-modal-title" className="tw:mt-3 tw:text-[clamp(2rem,4vw,3rem)] tw:font-semibold tw:leading-tight">{pickText(m.title, lang)}</h2>
                  <p className="tw:mt-1 tw:text-[1.35rem] tw:font-semibold tw:text-maroon">{pickText(m.tagline, lang)}</p>

                  {m.sample && (
                    <p className="tw:mt-6 tw:flex tw:gap-3 tw:items-start tw:rounded-2xl tw:bg-soft tw:p-4 tw:text-[.98rem] tw:text-ink tw:border-l-4 tw:border-gold">
                      <Info size={20} className="tw:shrink-0 tw:mt-0.5 tw:text-maroon" aria-hidden="true" />
                      {t('roadmap.sample.planNote')}
                    </p>
                  )}

                  <div className="tw:mt-8">
                    <h3 className="tw:text-[1.3rem] tw:font-semibold">{t('roadmap.modal.intro')}</h3>
                    <p className="tw:mt-3 tw:text-[1.2rem] tw:leading-relaxed">{pickText(m.intro, lang)}</p>
                  </div>

                  <div className="tw:mt-10 tw:grid tw:gap-10 tw:md:grid-cols-3">
                    <Block icon={Target} title={t('roadmap.modal.objectives')} items={pickList(m.objectives, lang)} />
                    <Block icon={ListChecks} title={t('roadmap.modal.activities')} items={pickList(m.activities, lang)} />
                    <Block icon={HandHeart} title={t('roadmap.modal.benefits')} items={pickList(m.benefits, lang)} />
                  </div>

                  <div className="tw:mt-12">
                    <h3 className="tw:flex tw:items-center tw:gap-3 tw:text-[1.3rem] tw:font-semibold">
                      <span className="tw:grid tw:place-items-center tw:w-10 tw:h-10 tw:rounded-full tw:bg-soft tw:text-maroon"><CalendarClock size={20} aria-hidden="true" /></span>
                      {t('roadmap.modal.timeline')}
                    </h3>
                    <ol className="fr-steps tw:mt-6">
                      {pickList(m.timeline, lang).map((s, i) => <li key={i} className="fr-step tw:text-[1.02rem] tw:font-medium">{s}</li>)}
                    </ol>
                  </div>

                  <div className="tw:mt-12">
                    <h3 className="tw:text-[1.3rem] tw:font-semibold">{t('roadmap.modal.categories')}</h3>
                    <ul className="tw:mt-4 tw:flex tw:flex-wrap tw:gap-2">
                      {m.categories.map((k) => {
                        const c = category(k)
                        return (
                          <li key={k} className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-maroon/20 tw:bg-white tw:px-4 tw:py-2 tw:font-semibold tw:text-[.95rem]">
                            <Icon name={c.icon} size={18} className="tw:text-maroon" /> {pickText(c.title, lang)}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="tw:mt-12 tw:pt-6 tw:border-t tw:border-black/10 tw:flex tw:flex-wrap tw:justify-between tw:gap-3">
                    <button type="button" className="fr-btn is-ghost" disabled={index === 0} style={index === 0 ? { visibility: 'hidden' } : undefined} onClick={() => onStep(index - 1)}>
                      <ArrowLeft size={18} aria-hidden="true" /> {t('roadmap.modal.prev')}
                    </button>
                    {index < MILESTONES.length - 1 && (
                      <button type="button" className="fr-btn" onClick={() => onStep(index + 1)}>
                        {t('roadmap.modal.next')}: {pickText(MILESTONES[index + 1].title, lang)} <ArrowRight size={18} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
