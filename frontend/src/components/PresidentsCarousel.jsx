// Presidents of Sri Lanka — one horizontal row of every President, oldest first (No. 01 William Gopallawa
// → today), moving continuously from left to right.
//
// How the loop stays seamless: the list is rendered several times side by side (only the 2nd copy is
// read by screen readers and reached with Tab; the duplicates stay clickable). One requestAnimationFrame loop moves the track with
// transform: translate3d(); whenever the visible window drifts a full list-width, the offset is shifted by
// exactly that width — the same cards are under the viewport before and after, so there is never a gap
// or a jump.
//
//   • pauses on hover, keyboard focus, drag, while a quote card is open, off-screen and in background tabs
//   • Previous / Next step one card · Pause / Play button · drag (mouse) and swipe (touch) with momentum
//   • eases in and out of every pause, so motion never starts or stops abruptly
//   • prefers-reduced-motion: no automatic movement (Play still lets the visitor opt in)
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import QuoteCard from './QuoteCard.jsx'
import '../styles/presidents-carousel.css'

const REAL = 1 // index of the interactive copy
const pick = (o, l) => o?.[l] || o?.en || {}
const pad = (n) => String(n).padStart(2, '0')
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const speedFor = (w) => (w < 640 ? 22 : w < 1024 ? 30 : 38) // px per second — slower on small screens
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Verified portrait when the file exists, otherwise an initials plate (never a stand-in photo).
function Portrait({ p }) {
  const [ok, setOk] = useState(true)
  return ok
    ? <img src={p.img} alt="" draggable="false" loading="lazy" decoding="async" onError={() => setOk(false)} />
    : <span className="pc-plate" aria-hidden="true"><span>{p.initials}</span></span>
}

export default function PresidentsCarousel({ presidents, language, labels }) {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const [copies, setCopies] = useState(3)
  const [openIdx, setOpenIdx] = useState(null)
  const [playing, setPlaying] = useState(() => !reducedMotion())
  const [dragging, setDragging] = useState(false)
  const n = presidents.length

  // engine state lives in a ref so the animation loop never re-renders React
  const s = useRef({
    x: 0, W: 0, step: 0, vw: 0, copies: 3, auto: 0, vel: 0, anim: null, drag: null,
    hover: false, focus: false, onScreen: true, hold: 0, suppressClick: false, raf: 0, last: 0, ready: false,
  })
  const live = useRef({ playing, open: false, reduced: false })
  live.current.playing = playing
  live.current.open = openIdx !== null

  const engine = useRef(null)

  useEffect(() => {
    const st = s.current
    const vp = viewportRef.current
    const tr = trackRef.current
    if (!vp || !tr) return undefined

    const apply = () => { tr.style.transform = `translate3d(${st.x.toFixed(2)}px,0,0)` }

    // keep the visible window inside the rendered copies by shifting exactly one list-width
    const normalize = () => {
      const W = st.W
      if (!W) return
      const max = st.copies * W - st.vw // furthest the window may go before running out of cards
      let shift = 0
      if (st.focus) { // keyboard user inside the carousel: only correct when strictly necessary
        if (-st.x < 0) shift = -W
        else if (-st.x > max) shift = W
      } else if (-st.x < 0.5 * W) shift = -W
      else if (-st.x > Math.min(max, (st.copies - 1.5) * W)) shift = W
      if (shift) {
        st.x += shift
        if (st.anim) { st.anim.from += shift; st.anim.to += shift }
        if (st.drag) st.drag.pos0 += shift
      }
    }

    const measure = () => {
      const first = tr.querySelector('.pc-item')
      if (!first) return
      const gap = parseFloat(getComputedStyle(tr).columnGap) || 0
      const step = first.getBoundingClientRect().width + gap
      const W = step * n
      const oldW = st.W
      st.step = step; st.W = W; st.vw = vp.clientWidth
      // enough copies that the window never runs past the last one, however wide the screen
      const need = Math.max(3, Math.ceil(st.vw / W + 1.5) + 1)
      st.copies = copies // what is actually rendered right now
      if (need > copies) setCopies(need) // re-renders with more copies, then re-measures
      st.x = oldW ? st.x * (W / oldW) : -W * REAL // first view: No. 01 at the left edge
      st.anim = null
      normalize(); apply()
      st.ready = true
    }

    const tick = (t) => {
      const realDt = st.last ? t - st.last : 16.7 // true elapsed time → easing is frame-rate independent
      const dt = Math.min(64, realDt)              // capped step → no lurch after a stalled frame
      st.last = t
      const L = live.current
      if (st.anim) {
        const k = Math.min(1, (t - st.anim.t0) / st.anim.dur)
        st.x = st.anim.from + (st.anim.to - st.anim.from) * easeInOut(k)
        if (k >= 1) st.anim = null
      } else if (st.drag?.moved) {
        // position follows the pointer (set in onPointerMove)
      } else if (st.vel) { // momentum after a swipe
        st.x += st.vel * dt
        st.vel *= Math.pow(0.94, dt / 16.7)
        if (Math.abs(st.vel) < 0.01) st.vel = 0
      } else {
        const run = L.playing && !L.open && !st.hover && !st.focus && !st.drag && t >= st.hold
        const target = run ? speedFor(st.vw) : 0
        st.auto += (target - st.auto) * Math.min(1, realDt / 380) // soft start / soft stop
        if (!target && st.auto < 0.05) st.auto = 0
        st.x += (st.auto * dt) / 1000 // + = left → right
      }
      normalize(); apply()
      st.raf = requestAnimationFrame(tick)
    }
    const start = () => { if (!st.raf && st.onScreen && !document.hidden) { st.last = 0; st.raf = requestAnimationFrame(tick) } }
    const stop = () => { if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0 } }

    const animateTo = (to, dur) => {
      st.vel = 0; st.auto = 0
      if (reducedMotion() || dur === 0) { st.anim = null; st.x = to; normalize(); apply(); return }
      st.anim = { from: st.x, to, t0: performance.now(), dur }
      start()
    }

    engine.current = {
      // dir +1 = Next (later President, content moves left) · -1 = Previous
      go(dir) {
        if (!st.step) return
        const base = st.anim ? st.anim.to : st.x
        const to = Math.round(base / st.step) * st.step - dir * st.step
        st.hold = performance.now() + 2600
        animateTo(to, 560)
      },
      // bring a focused card fully into view, choosing whichever identical copy position is closest
      reveal(el) {
        vp.scrollLeft = 0 // focusing can make the browser scroll this hidden-overflow box; the track position is ours
        const r = el.getBoundingClientRect(), v = vp.getBoundingClientRect()
        const edge = Math.min(32, v.width * 0.06)
        const lo = v.left + edge, hi = v.right - edge
        let best = null
        for (const shift of [-st.W, 0, st.W]) {
          const left = r.left + shift, right = r.right + shift
          const delta = left < lo ? lo - left : right > hi ? hi - right : 0
          const nx = st.x + shift + delta
          if (-nx < 0 || -nx > st.copies * st.W - st.vw) continue
          if (!best || Math.abs(delta) < Math.abs(best.delta)) best = { shift, delta }
        }
        if (!best) return
        st.x += best.shift
        if (best.delta) animateTo(st.x + best.delta, 420); else apply()
      },
      start,
      normalize,
      apply,
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(vp)
    const io = new IntersectionObserver(([e]) => { st.onScreen = e.isIntersecting; if (st.onScreen) start(); else stop() }, { rootMargin: '120px 0px' })
    io.observe(vp)
    const onVis = () => { if (document.hidden) stop(); else start() }
    document.addEventListener('visibilitychange', onVis)
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onMq = () => { if (mq.matches) setPlaying(false) }
    mq?.addEventListener?.('change', onMq)
    start()

    return () => {
      stop(); ro.disconnect(); io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      mq?.removeEventListener?.('change', onMq)
      engine.current = null
    }
  }, [n, copies])

  // lock page scrolling while a quote card is open; return to the same spot afterwards
  useEffect(() => {
    if (openIdx === null) return undefined
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

  // ---- pointer: hover pause, mouse drag, touch swipe (vertical page scroll stays native via touch-action) ----
  const onPointerEnter = (e) => { if (e.pointerType === 'mouse') s.current.hover = true }
  const onPointerLeave = (e) => { if (e.pointerType === 'mouse') s.current.hover = false }
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const st = s.current
    st.suppressClick = false
    st.drag = { id: e.pointerId, x0: e.clientX, pos0: st.x, moved: false, lx: e.clientX, lt: performance.now(), v: 0 }
  }
  const onPointerMove = (e) => {
    const st = s.current, d = st.drag
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) < 6) return
      d.moved = true; st.anim = null; st.vel = 0; st.auto = 0
      setDragging(true)
      try { viewportRef.current?.setPointerCapture(e.pointerId) } catch { /* pointer already released */ }
    }
    const now = performance.now()
    d.v = 0.75 * ((e.clientX - d.lx) / Math.max(1, now - d.lt)) + 0.25 * d.v
    d.lx = e.clientX; d.lt = now
    st.x = d.pos0 + dx
    engine.current?.normalize(); engine.current?.apply(); engine.current?.start()
  }
  const endDrag = (e) => {
    const st = s.current, d = st.drag
    if (!d || d.id !== e.pointerId) return
    st.drag = null
    if (!d.moved) return
    setDragging(false)
    st.suppressClick = true // the click that ends a drag must not open a card
    const idle = performance.now() - d.lt
    st.vel = idle > 90 || reducedMotion() ? 0 : Math.max(-2.4, Math.min(2.4, d.v))
    st.hold = performance.now() + 1800
    try { viewportRef.current?.releasePointerCapture(e.pointerId) } catch { /* already released */ }
    engine.current?.start()
  }
  const onClickCapture = (e) => {
    if (s.current.suppressClick) { e.preventDefault(); e.stopPropagation() }
    s.current.suppressClick = false
  }

  // ---- keyboard ----
  const onFocus = (e) => {
    if (!e.target.closest?.('.pc-card') || !e.target.matches(':focus-visible')) return
    s.current.focus = true
    engine.current?.reveal(e.target)
  }
  const onBlur = (e) => {
    if (viewportRef.current?.contains(e.relatedTarget)) return
    s.current.focus = false
    s.current.hold = performance.now() + 600
  }
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const card = e.target.closest?.('.pc-card')
    if (card) {
      const i = Number(card.dataset.index)
      const to = viewportRef.current?.querySelector(`.pc-list[data-copy="${REAL}"] .pc-card[data-index="${(i + dir + n) % n}"]`)
      if (!to) return
      s.current.focus = true
      to.focus({ preventScroll: true, focusVisible: true })
      engine.current?.reveal(to)
    } else engine.current?.go(dir)
  }

  const active = openIdx !== null ? presidents[openIdx] : null
  const term = (p) => (/[–-]\s*$/.test(p.period) ? `${p.period.trim()} ${labels.now || 'Present'}` : p.period)

  return (
    <div className="pc" role="region" aria-roledescription="carousel" aria-label={labels.title}>
      <div ref={viewportRef} className={`pc-viewport${dragging ? ' is-dragging' : ''}`}
        onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        onClickCapture={onClickCapture} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}
        onScroll={(e) => { if (e.currentTarget.scrollLeft) e.currentTarget.scrollLeft = 0 }}>
        <div ref={trackRef} className="pc-track">
          {Array.from({ length: copies }, (_, c) => (
            <ul key={c} className="pc-list" data-copy={c} aria-hidden={c === REAL ? undefined : true}>
              {presidents.map((p, i) => {
                const t = pick(p, language)
                const label = `${t.name}. ${labels.designation} ${labels.number || 'No.'} ${i + 1}. ${term(p)}${p.current ? `. ${labels.current}` : ''}`
                return (
                  <li key={p.id} className="pc-item">
                    <button type="button" className={`pc-card${p.current ? ' is-current' : ''}`} data-index={i}
                      tabIndex={c === REAL ? 0 : -1} aria-label={label} aria-haspopup="dialog" onClick={() => setOpenIdx(i)}>
                      <span className="pc-photo">
                        <Portrait p={p} />
                        <span className="pc-num" aria-hidden="true"><small>{labels.number || 'No.'}</small>{pad(i + 1)}</span>
                        {p.current && <span className="pc-now" aria-hidden="true">{labels.current}</span>}
                      </span>
                      <span className="pc-body" aria-hidden="true">
                        <strong className="pc-name">{t.name}</strong>
                        <span className="pc-term">{term(p)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      </div>

      <div className="pc-controls">
        <button type="button" className="pc-btn" onClick={() => engine.current?.go(-1)} aria-label={labels.prev || 'Previous'}>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button type="button" className="pc-btn pc-btn-play" onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? (labels.pause || 'Pause') : (labels.play || 'Play')}>
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
        <button type="button" className="pc-btn" onClick={() => engine.current?.go(1)} aria-label={labels.next || 'Next'}>
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      {active && (
        <QuoteCard key={active.id} leader={active} text={pick(active, language)} language={language}
          labels={labels} onClose={() => setOpenIdx(null)} />
      )}
    </div>
  )
}
