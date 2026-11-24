import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { pickText } from '../../data/roadmapContent'
import { Media, SampleBadge } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]

// One stop on the journey: photo (in its own shape), big number, title and tagline.
// Hover / focus tilts the photo in 3D, zooms it and draws a gold ring; click opens the plan.
export default function MilestoneItem({ m, index, total, lang, t, onOpen }) {
  const [active, setActive] = useState(false)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 16 })
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [8, -8]), { stiffness: 160, damping: 16 })

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => { px.set(0); py.set(0); setActive(false) }
  const title = pickText(m.title, lang)
  const tagline = pickText(m.tagline, lang)
  const open = (e) => onOpen(index, e.currentTarget)
  const fromLeft = index % 2 === 0

  return (
    <motion.li
      className={`fr-ms${m.vision ? ' is-vision' : ''}`}
      data-active={active ? '' : undefined}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={reset}
      onFocus={() => setActive(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setActive(false) }}
    >
      <div className="fr-ms-media-col">
        <motion.button
          type="button"
          className="fr-ms-card"
          onClick={open}
          onPointerMove={onMove}
          style={{ rotateX, rotateY }}
          aria-label={`${title} — ${tagline}. ${t('roadmap.journey.open')}`}
          initial={{ opacity: 0, x: fromLeft ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease, delay: 0.1 }}
        >
          <span className={`fr-ms-shape fr-shape-${m.shape}`}>
            <span className="fr-ms-frame">
              <Media photoKey={m.photo} className="tw:absolute tw:inset-0" sizes="(max-width: 1023px) 100vw, 460px" />
            </span>
            <span className="fr-ms-ring" aria-hidden="true" />
          </span>
        </motion.button>
      </div>

      <span className="fr-ms-node" aria-hidden="true">{m.years}</span>

      <div className="fr-ms-text-col">
        <div className="fr-ms-meta tw:mb-2">
          <span className="tw:text-sm tw:font-semibold tw:text-mute">{t('roadmap.journey.stage', { n: index + 1, total })}</span>
          {m.sample && <SampleBadge t={t} />}
        </div>
        <div className="fr-ms-num" aria-hidden="true">{m.years}</div>
        <h3 className="fr-ms-title tw:mt-3 tw:text-[clamp(1.7rem,2.8vw,2.4rem)] tw:font-semibold tw:leading-tight">{title}</h3>
        <p className="tw:mt-1 tw:text-[1.2rem] tw:font-semibold tw:text-maroon">{tagline}</p>
        <p className="tw:mt-3 tw:text-mute tw:max-w-[46ch] tw:inline-block">{pickText(m.intro, lang)}</p>
        <div className="tw:mt-5">
          <button type="button" className="fr-ms-open" onClick={open} aria-haspopup="dialog">
            {t('roadmap.journey.open')} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.li>
  )
}
