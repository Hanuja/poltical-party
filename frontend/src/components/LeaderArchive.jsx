// Political leaders — photo cards. Clicking a card pops out the vintage
// parchment quote card (QuoteCard) for that leader.
import { useEffect, useState } from 'react'
import QuoteCard from './QuoteCard.jsx'
import '../styles/leader-archive.css'

const pad = (n) => String(n).padStart(2, '0')
const pick = (o, l) => o?.[l] || o?.en || {}

// Real portrait when the image loads, otherwise an archival initials plate.
function Portrait({ p, name }) {
  const [ok, setOk] = useState(true)
  return ok
    ? <img src={p.img} alt={name} draggable="false" onError={() => setOk(false)} />
    : <span className="la-plate" role="img" aria-label={name}><span>{p.initials}</span></span>
}

// 3D tilt toward the cursor. Sets --rx/--ry for rotation and --gx/--gy for the glare.
function tilt(e) {
  const el = e.currentTarget, r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
  el.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`)
  el.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(2)}deg`)
  el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
  el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
}
function untilt(e) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

export default function LeaderArchive({ leaders, language, labels }) {
  const [openIdx, setOpenIdx] = useState(null)

  // lock page scrolling while the quote card is open; return to the same spot afterwards
  useEffect(() => {
    if (openIdx === null) return
    const { body, documentElement: html } = document
    const y = window.scrollY
    const bar = window.innerWidth - html.clientWidth
    const prev = { o: body.style.overflow, p: body.style.paddingRight }
    body.style.overflow = 'hidden'
    if (bar > 0) body.style.paddingRight = `${bar}px`
    return () => {
      body.style.overflow = prev.o; body.style.paddingRight = prev.p
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [openIdx])

  const active = openIdx !== null ? leaders[openIdx] : null

  return (
    <div className={`la${active ? ' is-active' : ''}`}>
      <ol className="la-grid">
        {leaders.map((p, i) => {
          const t = pick(p, language)
          return (
            <li key={p.id} className="la-card-wrap" style={{ '--i': i }}>
              {/* .la-float carries the gentle vertical bob; the <li> carries the left → right drift (leader-archive.css) */}
              <span className="la-float">
              <button type="button" className={`la-card${p.current ? ' is-current' : ''}`} onClick={() => setOpenIdx(i)}
                aria-haspopup="dialog" onMouseMove={tilt} onMouseLeave={untilt}>
                <span className="la-card-photo">
                  <Portrait p={p} name={t.name} />
                  <span className="la-glare" aria-hidden="true" />
                  <span className="la-card-veil" aria-hidden="true" />
                  <span className="la-card-no">{pad(i + 1)}</span>
                  <span className="la-card-cap">
                    <strong>{t.name}</strong>
                    <span>{p.period}</span>
                  </span>
                </span>
              </button>
              </span>
            </li>
          )
        })}
      </ol>

      {active && (
        <QuoteCard key={active.id} leader={active} text={pick(active, language)} language={language}
          labels={labels} onClose={() => setOpenIdx(null)} />
      )}
    </div>
  )
}
