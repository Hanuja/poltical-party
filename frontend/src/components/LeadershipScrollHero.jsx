import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
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
  const staticLayout = true

  return (
    <section id={id} ref={ref} className="ls-hero ls-hero--static" aria-label={title}>
      <div className="ls-stage">
        <div className="ls-media">
          {image && <img src={image} alt={title} fetchPriority="high" />}
        </div>

        <div className="ls-copy">
          <p className="ls-eyebrow">{eyebrow}</p>
          <h1 className="ls-title"><HighlightedName name={title} /></h1>
          {position && <p className="ls-position">{position}</p>}
          <span className="ls-rule" aria-hidden="true" />
          {bio && <div className="ls-desc">{bio.split(/\n\s*\n|\r?\n/).map((paragraph, index) => paragraph.trim() && <p key={index}>{paragraph.trim()}</p>)}</div>}
          {location && <p className="ls-loc">{location}</p>}
          {responsibilities.length > 0 && (
            <p className="ls-resp">
              {strings.responsibilities || 'Responsibilities'}: {responsibilities.length}
            </p>
          )}
          {politicalExperience && <p className="ls-extra">{strings.experience || 'Political Experience'}: {politicalExperience}</p>}
          {previousPositions.length > 0 && <p className="ls-extra">{strings.previousPositions || 'Previous Positions'}: {previousPositions.join(', ')}</p>}
          {achievements.length > 0 && <p className="ls-extra">{strings.achievements || 'Achievements'}: {achievements.join(', ')}</p>}
          <div>
            <Link to={profileUrl} viewTransition className="ls-cta">
              {ctaLabel} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
