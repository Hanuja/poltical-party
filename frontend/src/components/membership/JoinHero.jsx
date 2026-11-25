import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, Quote } from 'lucide-react'
import { Eyebrow, scrollToId } from './memUi'
import { fill } from './membershipText'
import { PARTY_LOGO } from '../../config/branding'

const EASE = [0.22, 1, 0.36, 1]

// Leader portrait with a cinematic reveal: a maroon curtain lifts, the frame unmasks from the
// bottom and the photo settles from a slow zoom. Everything comes from admin settings; with no
// photo set, the party emblem is shown instead (never a stock or guessed portrait).
function HeroMedia({ hero, s, loading }) {
  const reduce = useReducedMotion()
  const photo = hero?.leaderPhoto
  if (loading) return <div className="mb-hero-media"><div className="mb-hero-frame mb-skel" aria-hidden="true" /></div>

  const frame = reduce ? {} : {
    initial: { clipPath: 'inset(100% 0% 0% 0%)' },
    animate: { clipPath: 'inset(0% 0% 0% 0%)' },
    transition: { duration: 1.3, ease: EASE, delay: 0.15 },
  }
  const img = reduce ? {} : {
    initial: { scale: 1.22, filter: 'saturate(0.6) brightness(0.8)' },
    animate: { scale: 1, filter: 'saturate(1) brightness(1)' },
    transition: { duration: 2.2, ease: EASE, delay: 0.15 },
  }
  return (
    <div className="mb-hero-media">
      <span className="mb-hero-ring" aria-hidden="true" />
      <motion.div className={`mb-hero-frame ${photo ? '' : 'is-emblem'}`} {...frame}>
        {photo ? (
          <motion.img src={photo} alt={hero.leaderName ? fill(s.hero.photoAlt, { name: hero.leaderName }) : ''} {...img} />
        ) : (
          <span className="party-logo-circle mb-party-logo"><motion.img className="mb-hero-emblem" src={PARTY_LOGO} alt={s.hero.logoAlt} {...img} /></span>
        )}
        {!reduce && (
          <motion.span className="mb-hero-curtain" aria-hidden="true"
            initial={{ y: '0%' }} animate={{ y: '-101%' }} transition={{ duration: 1.1, ease: EASE }} />
        )}
      </motion.div>
      {photo && (hero.leaderName || hero.leaderTitle) && (
        <motion.div className="mb-hero-caption"
          initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.1, ease: EASE }}>
          {hero.leaderName && <strong>{hero.leaderName}</strong>}
          {hero.leaderTitle && <span>{hero.leaderTitle}</span>}
        </motion.div>
      )}
    </div>
  )
}

export default function JoinHero({ page, loading, s, lang }) {
  const reduce = useReducedMotion()
  const hero = page?.hero
  const up = (d) => (reduce ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: d, ease: EASE } })

  return (
    <section className="mb-hero" aria-labelledby="mb-hero-title">
      <div className="mb-hero-bg" aria-hidden="true" />
      <div className="mb-wrap mb-hero-grid">
        <div className="mb-hero-copy">
          <motion.div {...up(0)}><Eyebrow light>{s.hero.eyebrow}</Eyebrow></motion.div>
          <motion.h1 id="mb-hero-title" className="mb-hero-title" lang={lang} {...up(0.08)}>{s.hero.title}</motion.h1>

          {loading ? (
            <div className="mb-hero-names" aria-hidden="true"><span className="mb-skel mb-skel-line w60" /><span className="mb-skel mb-skel-line w40" /></div>
          ) : (hero?.partyNameTa || hero?.partyNameEn) && (
            <motion.div className="mb-hero-names" {...up(0.18)}>
              {hero.partyNameTa && <p className="mb-name-ta" lang="ta">{hero.partyNameTa}</p>}
              {hero.partyNameEn && <p className="mb-name-en" lang="en">{hero.partyNameEn}</p>}
            </motion.div>
          )}

          {!loading && hero?.slogan && <motion.p className="mb-hero-slogan" {...up(0.26)}>“{hero.slogan}”</motion.p>}

          {!loading && hero?.welcome && (
            <motion.blockquote className="mb-hero-welcome" {...up(0.34)}>
              <Quote size={22} aria-hidden="true" className="mb-hero-quote" />
              <span className="tw:sr-only">{s.hero.messageFrom}: </span>
              {hero.welcome.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
              {(hero.leaderName || hero.leaderTitle) && (
                <footer>— {hero.leaderName}{hero.leaderName && hero.leaderTitle ? ', ' : ''}{hero.leaderTitle}</footer>
              )}
            </motion.blockquote>
          )}

          <motion.div className="mb-hero-actions" {...up(0.42)}>
            <button type="button" className="mb-btn mb-btn-gold" onClick={() => scrollToId('mb-apply')}>
              {s.hero.join}<ArrowDown size={18} aria-hidden="true" />
            </button>
            <Link to="/our-identity?section=vision" className="mb-btn mb-btn-ghost-light">
              {s.hero.vision}<ArrowRight size={18} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
        <HeroMedia hero={hero} s={s} loading={loading} />
      </div>
    </section>
  )
}
