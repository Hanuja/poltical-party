import { useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, Map as MapIcon } from 'lucide-react'
import { photo } from '../../data/roadmapContent'
import { assetUrl, scrollToId } from './roadmapUi'

const ease = [0.22, 1, 0.36, 1]

export default function RoadmapHero({ t }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.06, 1])

  // Subtle 3D depth: floating photos follow the pointer.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18 })
  const sy = useSpring(my, { stiffness: 90, damping: 18 })
  const rotY = useTransform(sx, [-0.5, 0.5], [-8, 8])
  const rotX = useTransform(sy, [-0.5, 0.5], [6, -6])
  const shiftA = useTransform(sx, [-0.5, 0.5], [-18, 18])
  const shiftB = useTransform(sx, [-0.5, 0.5], [14, -14])
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const main = photo('hero-sangupiddy')
  const cardA = photo('village-alaveddi')
  const cardB = photo('colombo-skyline')

  return (
    <section ref={ref} className="fr-hero" onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0) }} aria-labelledby="fr-hero-title">
      <motion.div className="fr-hero-photo" style={{ y: photoY }}>
        <motion.img src={assetUrl(main.src)} alt={main.alt} style={{ scale: photoScale }} loading="eager" fetchPriority="high"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease }} />
      </motion.div>

      {/* Decorative maroon / gold shapes */}
      <svg className="fr-hero-arc tw:hidden tw:lg:block" style={{ right: '4%', top: '9%', width: 260, height: 260 }} viewBox="0 0 200 200" aria-hidden="true">
        <motion.circle cx="100" cy="100" r="92" fill="none" stroke="#FFC928" strokeWidth="3" strokeDasharray="6 10"
          initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1, rotate: 0 }} transition={{ duration: 2, ease }} />
      </svg>
      <motion.span aria-hidden="true" className="fr-hero-arc tw:block tw:rounded-full tw:bg-gold"
        style={{ left: '-60px', bottom: '-60px', width: 180, height: 180, opacity: 0.9 }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.2, delay: 0.4, ease }} />

      {/* Floating framed photos (desktop) */}
      <div className="tw:hidden tw:lg:block tw:absolute tw:inset-0 tw:pointer-events-none" aria-hidden="true" style={{ perspective: 1000 }}>
        <motion.div className="fr-float-card" style={{ width: 230, height: 170, right: '30%', bottom: '11%', rotateX: rotX, rotateY: rotY, x: shiftA }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9, ease }}>
          <img src={assetUrl(cardA.src)} alt="" />
        </motion.div>
        <motion.div className="fr-float-card" style={{ width: 200, height: 250, right: '5%', bottom: '18%', rotateX: rotX, rotateY: rotY, x: shiftB }}
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.1, ease }}>
          <img src={assetUrl(cardB.src)} alt="" />
          <span className="tw:absolute tw:left-0 tw:right-0 tw:bottom-0 tw:h-1.5 tw:bg-maroon" />
        </motion.div>
      </div>

      <div className="fr-wrap tw:relative tw:z-10 tw:flex tw:flex-col tw:justify-center tw:pt-8 tw:pb-24 tw:lg:min-h-[86vh] tw:lg:py-28">
        <div className="tw:max-w-[620px]">
          <motion.p className="fr-eyebrow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
            {t('roadmap.hero.eyebrow')}
          </motion.p>
          <h1 id="fr-hero-title" className="tw:mt-5">
            <motion.span lang="ta" className="fr-tamil tw:block tw:font-bold tw:text-maroon tw:leading-[1.25] tw:text-[clamp(2.6rem,6.2vw,4.8rem)]"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease }}>
              எதிர்காலப் பாதை
            </motion.span>
            <motion.span className="tw:block tw:mt-2 tw:font-display tw:font-semibold tw:text-ink tw:leading-[1.1] tw:text-[clamp(2.1rem,4.6vw,3.6rem)]"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
              {t('roadmap.hero.title')}
            </motion.span>
          </h1>
          <motion.span aria-hidden="true" className="tw:block tw:h-1 tw:w-28 tw:mt-7 tw:rounded tw:bg-maroon tw:origin-left"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.55, ease }} />
          <motion.p className="tw:mt-6 tw:text-[clamp(1.2rem,2vw,1.5rem)] tw:leading-relaxed tw:text-ink tw:font-medium"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6, ease }}>
            {t('roadmap.hero.subtitle')}
          </motion.p>
          <motion.div className="tw:mt-9 tw:flex tw:flex-wrap tw:gap-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease }}>
            <button type="button" className="fr-btn" onClick={() => scrollToId('fr-journey')}>
              {t('roadmap.hero.explore')} <ArrowDown size={18} aria-hidden="true" />
            </button>
            <button type="button" className="fr-btn is-ghost" onClick={() => scrollToId('fr-map')}>
              <MapIcon size={18} aria-hidden="true" /> {t('roadmap.hero.map')}
            </button>
          </motion.div>
        </div>
      </div>

      <div className="tw:absolute tw:left-1/2 tw:-translate-x-1/2 tw:bottom-5 tw:z-10">
        <motion.button type="button" className="fr-scrollcue" onClick={() => scrollToId('fr-journey')}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          <span className="fr-mouse" aria-hidden="true"><i /></span>
          {t('roadmap.hero.scroll')}
        </motion.button>
      </div>
    </section>
  )
}
