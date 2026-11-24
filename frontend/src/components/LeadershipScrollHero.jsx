import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import '../styles/leadership-hero.css'

function HighlightedName({ name = '' }) {
  const words = String(name).trim().split(/\s+/)
  if (words.length < 2) return <>{name}</>
  return <>{words.slice(0, -1).join(' ')} <span className="ls-name-accent">{words.at(-1)}</span></>
}

// Scroll-driven leadership hero: a large landscape image glides left and
// resolves into a 4:5 portrait while the Party Leader profile reveals on the
// right in a staggered sequence. Scroll-linked — scrolling up reverses it.
export default function LeadershipScrollHero({
  image = '',
  eyebrow = '',
  title = '',
  position = '',
  bio = '',
  location = '',
  responsibilities = [],
  politicalExperience = '',
  previousPositions = [],
  achievements = [],
  profileUrl = '/our-people',
  ctaLabel = 'View Full Profile',
  strings = {},
  id = 'op-leader',
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }))
  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = viewport.width <= 900
  const staticLayout = reduce
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.5 })

  // 9:16 opening portrait settles into the requested 4:5 editorial crop.
  const initialWidth = Math.min(viewport.height * 0.52, viewport.width * (isMobile ? 0.82 : 0.68))
  const finalWidth = isMobile ? Math.min(300, viewport.width - 44) : viewport.width <= 1100 ? 350 : 400
  const mediaWidth = useTransform(p, [0, 0.6], [initialWidth, finalWidth])
  const mediaAspect = useTransform(p, [0, 0.6], [9 / 16, 4 / 5])
  const mediaLeft = useTransform(p, [0, 0.6], ['50%', isMobile ? '50%' : '6%'])
  const mediaX = useTransform(p, [0, 0.6], ['-50%', isMobile ? '-50%' : '0%'])
  const mediaTop = useTransform(p, [0, 0.6], ['50%', isMobile ? '76%' : '50%'])
  const mediaY = useTransform(p, [0, 0.6], ['-50%', '-50%'])
  const mediaRadius = useTransform(p, [0, 0.6], [4, 18])

  // Staggered right-side reveal — each element gets its own scroll window
  const revealOffset = isMobile ? 0.24 : 0.44
  const eyebrowOpacity = useTransform(p, [revealOffset, revealOffset + 0.12], [0, 1])
  const eyebrowX = useTransform(p, [revealOffset, revealOffset + 0.12], [isMobile ? 0 : 90, 0])
  const titleOpacity = useTransform(p, [revealOffset + 0.04, revealOffset + 0.18], [0, 1])
  const titleX = useTransform(p, [revealOffset + 0.04, revealOffset + 0.18], [isMobile ? 0 : 90, 0])
  const posOpacity = useTransform(p, [revealOffset + 0.1, revealOffset + 0.24], [0, 1])
  const posX = useTransform(p, [revealOffset + 0.1, revealOffset + 0.24], [isMobile ? 0 : 60, 0])
  const ruleOpacity = useTransform(p, [revealOffset + 0.16, revealOffset + 0.28], [0, 1])
  const ruleScaleX = useTransform(p, [revealOffset + 0.16, revealOffset + 0.28], [0, 1])
  const bioOpacity = useTransform(p, [revealOffset + 0.22, revealOffset + 0.38], [0, 1])
  const bioY = useTransform(p, [revealOffset + 0.22, revealOffset + 0.38], [26, 0])
  const locOpacity = useTransform(p, [revealOffset + 0.3, revealOffset + 0.44], [0, 1])
  const locX = useTransform(p, [revealOffset + 0.3, revealOffset + 0.44], [isMobile ? 0 : 50, 0])
  const respOpacity = useTransform(p, [revealOffset + 0.36, revealOffset + 0.5], [0, 1])
  const respX = useTransform(p, [revealOffset + 0.36, revealOffset + 0.5], [isMobile ? 0 : 50, 0])
  const ctaOpacity = useTransform(p, [revealOffset + 0.42, revealOffset + 0.56], [0, 1])
  const ctaY = useTransform(p, [revealOffset + 0.42, revealOffset + 0.56], [22, 0])

  const mediaStyle = staticLayout ? undefined : { width: mediaWidth, aspectRatio: mediaAspect, left: mediaLeft, top: mediaTop, x: mediaX, y: mediaY, borderRadius: mediaRadius }

  return (
    <section id={id} ref={ref} className={`ls-hero${staticLayout ? ' ls-hero--static' : ''}`} aria-label={title}>
      <div className="ls-stage">
        <motion.div className="ls-media" style={mediaStyle}>
          {image && <img src={image} alt={title} fetchPriority="high" />}
        </motion.div>

        <div className="ls-copy">
          <motion.p className="ls-eyebrow" style={staticLayout ? undefined : { opacity: eyebrowOpacity, x: eyebrowX }}>{eyebrow}</motion.p>
          <motion.h1 className="ls-title" style={staticLayout ? undefined : { opacity: titleOpacity, x: titleX }}><HighlightedName name={title} /></motion.h1>
          {position && <motion.p className="ls-position" style={staticLayout ? undefined : { opacity: posOpacity, x: posX }}>{position}</motion.p>}
          <motion.span className="ls-rule" style={staticLayout ? undefined : { opacity: ruleOpacity, scaleX: ruleScaleX }} aria-hidden="true" />
          {bio && <motion.div className="ls-desc" style={staticLayout ? undefined : { opacity: bioOpacity, y: bioY }}>{bio.split(/\n\s*\n|\r?\n/).map((paragraph, index) => paragraph.trim() && <p key={index}>{paragraph.trim()}</p>)}</motion.div>}
          {location && <motion.p className="ls-loc" style={staticLayout ? undefined : { opacity: locOpacity, x: locX }}>{location}</motion.p>}
          {responsibilities.length > 0 && (
            <motion.p className="ls-resp" style={staticLayout ? undefined : { opacity: respOpacity, x: respX }}>
              {strings.responsibilities || 'Responsibilities'}: {responsibilities.length}
            </motion.p>
          )}
          {politicalExperience && <motion.p className="ls-extra" style={staticLayout ? undefined : { opacity: bioOpacity, y: bioY }}>{strings.experience || 'Political Experience'}: {politicalExperience}</motion.p>}
          {previousPositions.length > 0 && <motion.p className="ls-extra" style={staticLayout ? undefined : { opacity: respOpacity, x: respX }}>{strings.previousPositions || 'Previous Positions'}: {previousPositions.join(', ')}</motion.p>}
          {achievements.length > 0 && <motion.p className="ls-extra" style={staticLayout ? undefined : { opacity: respOpacity, x: respX }}>{strings.achievements || 'Achievements'}: {achievements.join(', ')}</motion.p>}
          <motion.div style={staticLayout ? undefined : { opacity: ctaOpacity, y: ctaY }}>
            <Link to={profileUrl} viewTransition className="ls-cta">
              {ctaLabel} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
