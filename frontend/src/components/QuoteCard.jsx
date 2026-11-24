// Vintage editorial quote card — a parchment poster that pops out when a leader card is clicked.
// Left: oversized bronze quote marks, condensed display lines (with highlighted words),
// a gold rule and the attribution. Right: the portrait rising from the bottom-right,
// lit by a slow sunlight glow. Mouse tilt moves the portrait faster than the text for depth.
// Closes with X, a click outside, or Escape. Leaders without a photo get an initials seal.
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import '../styles/quote-card.css'

const CLOSE_MS = 420

// floating dust motes — fixed positions so the layout is stable between renders
const MOTES = [
  [8, 72, 3, 19, 0], [17, 34, 2, 23, 3], [26, 84, 4, 27, 6], [34, 18, 2, 21, 1], [43, 60, 3, 25, 8],
  [51, 28, 2, 18, 4], [58, 78, 3, 24, 2], [66, 44, 4, 29, 7], [73, 12, 2, 22, 5], [81, 66, 3, 26, 9],
  [88, 30, 2, 20, 3], [94, 82, 3, 28, 6], [12, 50, 2, 24, 10], [62, 90, 2, 21, 11],
]

// '*SUN.*' → highlighted segment
function Line({ text }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean)
  return parts.map((s, i) => (s.startsWith('*') && s.endsWith('*')
    ? <em key={i} className="qc-hl">{s.slice(1, -1)}</em>
    : <span key={i}>{s}</span>))
}

export default function QuoteCard({ leader, text, language, labels, onClose }) {
  const [leaving, setLeaving] = useState(false)
  const [imgOk, setImgOk] = useState(true)
  const card = useRef(null)
  const closeBtn = useRef(null)

  // what goes inside the quote marks: a verified quote, else the leader's ideology lines,
  // else (no data) the name itself in the poster style
  const q = leader.quote ? (leader.quote[language] || leader.quote.en) : null
  const ideals = !q && leader.ideals ? (leader.ideals[language] || leader.ideals.en) : null
  const marked = Boolean(q || ideals)
  const lines = q ? q.lines : ideals || text.name.split(' ').map((w, i, a) => (i === a.length - 1 ? `*${w}*` : w))
  // an open-ended term (current president) reads "2024 – Current President"
  const term = leader.current && /[–-]\s*$/.test(leader.period) ? `${leader.period.trim()} ${labels.current}` : leader.period
  // below the rule: small name, then the years
  const author = marked ? (q?.author || text.name) : term
  const authorSub = marked ? term : labels.designation

  const Tag = q ? 'blockquote' : 'div'
  const close = () => { if (!leaving) { setLeaving(true); setTimeout(onClose, CLOSE_MS) } }

  useEffect(() => {
    const opener = document.activeElement
    closeBtn.current?.focus({ preventScroll: true })
    // capture phase on window, so Escape is handled here first
    const onKey = (e) => {
      if (['Escape', 'ArrowLeft', 'ArrowRight'].includes(e.key)) { e.stopPropagation(); e.preventDefault() }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => { window.removeEventListener('keydown', onKey, true); opener?.focus?.({ preventScroll: true }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // layered parallax: --mx/--my in [-0.5, 0.5]
  const onMove = (e) => {
    const el = card.current; if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const onLeave = () => { card.current?.style.setProperty('--mx', 0); card.current?.style.setProperty('--my', 0) }

  return (
    <div className={`qc-overlay${leaving ? ' is-leaving' : ''}`} onClick={close}>
      <article ref={card} className={`qc-card${marked ? '' : ' is-profile'}`} role="dialog" aria-modal="true"
        aria-label={text.name} onClick={(e) => e.stopPropagation()} onMouseMove={onMove} onMouseLeave={onLeave}>
        <div className="qc-paper" aria-hidden="true" />
        <div className="qc-motes" aria-hidden="true">
          {MOTES.map(([x, y, s, d, delay], i) => (
            <span key={i} style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDuration: `${d}s`, animationDelay: `-${delay}s` }} />
          ))}
        </div>

        <div className="qc-text">
          {marked && <span className="qc-mark qc-mark-open" aria-hidden="true">“</span>}
          <Tag className="qc-lines" lang={language}>
            {lines.map((l, i) => (
              <span key={i} className="qc-line" style={{ '--d': `${0.45 + i * 0.12}s` }}>
                <span className="qc-line-in"><Line text={l} /></span>
              </span>
            ))}
          </Tag>
          <span className="qc-rule" aria-hidden="true" style={{ '--d': `${0.6 + lines.length * 0.12}s` }} />
          <p className="qc-author" style={{ '--d': `${0.95 + lines.length * 0.12}s` }}>
            — {author}
            {authorSub && <span className="qc-author-sub">{authorSub}</span>}
          </p>
          {marked && <span className="qc-mark qc-mark-close" aria-hidden="true" style={{ '--d': `${1.1 + lines.length * 0.12}s` }}>”</span>}
        </div>

        <div className="qc-portrait" aria-hidden="true">
          <span className="qc-sun" />
          {imgOk
            ? <img src={leader.img} alt="" draggable="false" onError={() => setImgOk(false)} />
            : <span className="qc-seal"><span>{leader.initials}</span></span>}
        </div>

        <button ref={closeBtn} type="button" className="qc-x" onClick={close} aria-label={labels.close}><X size={20} /></button>
      </article>
    </div>
  )
}
