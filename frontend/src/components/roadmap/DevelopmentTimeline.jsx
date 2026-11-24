import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { MILESTONES } from '../../data/roadmapContent'
import MilestoneItem from './MilestoneItem'

const ease = [0.22, 1, 0.36, 1]

// Seven milestones on one journey. The maroon → gold connector draws itself as you scroll.
export default function DevelopmentTimeline({ t, lang, onOpen }) {
  const listRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 60%'] })
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="fr-journey" className="tw:relative tw:bg-white tw:py-24 tw:lg:py-32" aria-labelledby="fr-journey-title">
      <div className="fr-wrap">
        <motion.header className="tw:max-w-[760px] tw:mx-auto tw:text-center tw:mb-16 tw:lg:mb-24"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, ease }}>
          <p className="fr-eyebrow">{t('roadmap.journey.eyebrow')}</p>
          <h2 id="fr-journey-title" className="tw:mt-4 tw:text-[clamp(2.2rem,4.6vw,3.6rem)] tw:font-semibold tw:leading-tight">{t('roadmap.journey.title')}</h2>
          <p className="tw:mt-5 tw:text-[1.15rem] tw:text-mute">{t('roadmap.journey.sub')}</p>
        </motion.header>

        <div className="tw:relative">
          <span className="fr-tl-line" aria-hidden="true"><motion.span style={{ scaleY: draw }} /></span>
          <ol ref={listRef} className="tw:relative tw:flex tw:flex-col tw:gap-20 tw:lg:gap-28">
            {MILESTONES.map((m, i) => (
              <MilestoneItem key={m.key} m={m} index={i} total={MILESTONES.length} lang={lang} t={t} onOpen={onOpen} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
