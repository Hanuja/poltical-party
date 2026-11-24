// Interactive flag / emblem explorer, shared by the Our Identity page and
// the Principles & Ideology page. `s` is the `symbol` block of identityContent.
import { useEffect, useRef, useState } from 'react'
import '../styles/flag-explorer.css'

/* ── 04 Flag & Symbol: interactive artwork explorer ────────
   The artwork is never altered: it is read once into a small hidden canvas,
   every pixel is labelled with the colour or symbol it belongs to, and the
   highlight is painted on a transparent overlay canvas above the image.
   Hover/drag highlights, release (or click / tap) selects one area. */
const PALETTE = { maroon: [150, 15, 35], gold: [240, 180, 20], cream: [235, 225, 205] }
const COLOUR_TOKEN = { maroon: 'primary', gold: 'accent', cream: 'cream' }
const MATCH_DIST = 110 // max RGB distance for a pixel to count as a palette colour

// Areas are in fractions of the artwork (0–1). Earlier symbols win where they overlap.
const ARTWORKS = {
  // TODO: once /public/images/party-flag.png is added, list its symbols here too.
  flag: { src: '/images/party-flag.png', colours: ['maroon', 'gold', 'cream'], symbols: [] },
  emblem: {
    src: '/images/logo.png',
    colours: ['maroon', 'gold', 'cream'],
    symbols: [
      { id: 'island', poly: [[0.492, 0.24], [0.515, 0.245], [0.545, 0.3], [0.565, 0.37], [0.575, 0.45], [0.578, 0.53], [0.57, 0.6], [0.548, 0.655], [0.52, 0.68], [0.49, 0.675], [0.47, 0.63], [0.465, 0.55], [0.467, 0.42], [0.473, 0.3]] },
      { id: 'people', box: [0.13, 0.6, 0.8, 0.16], colours: ['maroon'] },
      { id: 'sun', box: [0.36, 0, 0.47, 0.6], colours: ['gold', 'maroon'] },
    ],
  },
}

function inPoly(u, v, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const bboxOf = (sym) => {
  if (sym.box) return sym.box
  const xs = sym.poly.map(p => p[0]), ys = sym.poly.map(p => p[1])
  const x = Math.min(...xs), y = Math.min(...ys)
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y]
}
const hex = (rgb) => '#' + rgb.map(n => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase()

// Label every pixel of the artwork once (at a reduced size for speed).
function analyseArtwork(img, art) {
  const AW = Math.min(640, img.naturalWidth)
  const AH = Math.round(AW * img.naturalHeight / img.naturalWidth)
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, AW, AH)
  const data = ctx.getImageData(0, 0, AW, AH).data
  const parts = [
    ...art.symbols.map(s => ({ id: s.id, kind: 'symbol', sym: s, bbox: bboxOf(s) })),
    ...art.colours.map(id => ({ id, kind: 'colour' })),
  ]
  const colourIndex = Object.fromEntries(art.colours.map(id => [id, parts.findIndex(p => p.id === id)]))
  const labels = new Int16Array(AW * AH).fill(-1)
  const sums = parts.map(() => [0, 0, 0, 0])
  for (let y = 0; y < AH; y++) {
    for (let x = 0; x < AW; x++) {
      const i = (y * AW + x) * 4
      if (data[i + 3] < 64) continue
      const r = data[i], g = data[i + 1], b = data[i + 2]
      let colour = null, best = MATCH_DIST * MATCH_DIST
      for (const id of art.colours) {
        const c = PALETTE[id]; const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2
        if (d < best) { best = d; colour = id }
      }
      const u = (x + 0.5) / AW, v = (y + 0.5) / AH
      let label = colour ? colourIndex[colour] : -1
      for (let k = 0; k < art.symbols.length; k++) {
        const s = art.symbols[k]
        if (s.poly) { if (inPoly(u, v, s.poly)) { label = k; break } }
        else {
          const [bx, by, bw, bh] = s.box
          if (u >= bx && u <= bx + bw && v >= by && v <= by + bh && (!s.colours || s.colours.includes(colour))) { label = k; break }
        }
      }
      if (label < 0) continue
      labels[y * AW + x] = label
      const sm = sums[label]; sm[0] += r; sm[1] += g; sm[2] += b; sm[3]++
    }
  }
  parts.forEach((p, k) => { const sm = sums[k]; p.count = sm[3]; p.rgb = sm[3] ? [sm[0] / sm[3], sm[1] / sm[3], sm[2] / sm[3]] : PALETTE[p.id] || [128, 0, 32] })
  // Opaque silhouette, used to softly dim everything except the chosen area.
  const dim = document.createElement('canvas'); dim.width = AW; dim.height = AH
  const dctx = dim.getContext('2d'); const dimData = dctx.createImageData(AW, AH)
  for (let i = 0; i < AW * AH; i++) if (data[i * 4 + 3] >= 64) { dimData.data[i * 4] = 255; dimData.data[i * 4 + 1] = 255; dimData.data[i * 4 + 2] = 255; dimData.data[i * 4 + 3] = 150 }
  dctx.putImageData(dimData, 0, 0)
  return { AW, AH, labels, parts: parts.filter(p => p.count > 0), allParts: parts, dim, masks: {} }
}

function partMask(an, id) {
  if (an.masks[id]) return an.masks[id]
  const k = an.allParts.findIndex(p => p.id === id)
  const cv = document.createElement('canvas'); cv.width = an.AW; cv.height = an.AH
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(an.AW, an.AH)
  for (let i = 0; i < an.labels.length; i++) if (an.labels[i] === k) { img.data[i * 4] = 128; img.data[i * 4 + 1] = 0; img.data[i * 4 + 2] = 32; img.data[i * 4 + 3] = 255 }
  ctx.putImageData(img, 0, 0)
  return (an.masks[id] = cv)
}

function FlagExplorer({ s, stacked = false }) {
  const ex = s.explore
  const [hasFlag, setHasFlag] = useState(null) // null = still checking
  const [artId, setArtId] = useState('emblem')
  const [analysis, setAnalysis] = useState(null)
  const [hover, setHover] = useState(null)
  const [selected, setSelected] = useState(null)
  const [tip, setTip] = useState(null)
  const imgRef = useRef(null), overlayRef = useRef(null), stageRef = useRef(null)
  const dragging = useRef(false)
  const art = ARTWORKS[artId]
  // Only trust an analysis made for the artwork currently shown.
  const an = analysis && analysis.src === art.src ? analysis : null

  // Use the official flag if the file exists, otherwise the emblem.
  useEffect(() => {
    const probe = new Image()
    probe.onload = () => { setHasFlag(true); setArtId('flag') }
    probe.onerror = () => setHasFlag(false)
    probe.src = ARTWORKS.flag.src
  }, [])

  useEffect(() => { setHover(null); setSelected(null); setTip(null) }, [artId])

  const onImgLoad = () => {
    const img = imgRef.current
    if (img && img.naturalWidth) setAnalysis({ ...analyseArtwork(img, art), src: art.src })
  }

  const text = (id) => {
    if (!id) return null
    if (s.symbols[id]) return { kind: 'symbol', ...s.symbols[id] }
    const col = s.colours.find(c => c.token === COLOUR_TOKEN[id])
    return col ? { kind: 'colour', ...col } : { kind: 'colour', name: id, p: '' }
  }

  // Paint the overlay: dim the rest of the artwork, glow around the active area.
  const active = hover || selected
  useEffect(() => {
    const cv = overlayRef.current, img = imgRef.current
    if (!cv || !img) return
    const dpr = window.devicePixelRatio || 1
    const w = img.clientWidth, h = img.clientHeight
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    Object.assign(cv.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: w + 'px', height: h + 'px' })
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, cv.width, cv.height)
    if (!an || !active) return
    const mask = partMask(an, active)
    ctx.drawImage(an.dim, 0, 0, cv.width, cv.height)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(mask, 0, 0, cv.width, cv.height)
    ctx.globalCompositeOperation = 'source-over'
    const glow = document.createElement('canvas'); glow.width = cv.width; glow.height = cv.height
    const g = glow.getContext('2d')
    g.shadowColor = 'rgba(128, 0, 32, 0.95)'; g.shadowBlur = 9 * dpr
    g.drawImage(mask, 0, 0, cv.width, cv.height)
    g.drawImage(mask, 0, 0, cv.width, cv.height)
    g.shadowBlur = 0
    g.globalCompositeOperation = 'destination-out'
    g.drawImage(mask, 0, 0, cv.width, cv.height)
    ctx.drawImage(glow, 0, 0)
  }, [an, active])

  // Redraw on resize so the overlay always matches the image.
  useEffect(() => {
    const img = imgRef.current
    if (!img || !('ResizeObserver' in window)) return
    const ro = new ResizeObserver(() => setAnalysis(a => (a ? { ...a } : a)))
    ro.observe(img)
    return () => ro.disconnect()
  }, [artId])

  const hit = (e) => {
    const img = imgRef.current
    if (!an || !img) return null
    const r = img.getBoundingClientRect()
    const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height
    if (u < 0 || v < 0 || u >= 1 || v >= 1) return null
    const k = an.labels[Math.floor(v * an.AH) * an.AW + Math.floor(u * an.AW)]
    return k >= 0 ? an.allParts[k].id : null
  }
  const track = (e) => {
    const id = hit(e)
    setHover(id)
    const sr = stageRef.current.getBoundingClientRect()
    setTip(id ? { id, x: e.clientX - sr.left, y: e.clientY - sr.top } : null)
  }
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    dragging.current = true
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    track(e)
  }
  const onPointerMove = (e) => {
    // Touch only explores while the finger is down; a mouse also explores on hover.
    if (e.pointerType === 'touch' && !dragging.current) return
    track(e)
  }
  const onPointerUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    const id = hit(e)
    if (id) setSelected(id)
    if (e.pointerType !== 'mouse') { setHover(null); setTip(null) }
  }
  const onPointerLeave = () => { if (!dragging.current) { setHover(null); setTip(null) } }
  const onPointerCancel = () => { dragging.current = false; setHover(null); setTip(null) }

  const sel = text(selected)
  const selPart = an?.allParts.find(p => p.id === selected)
  const cropStyle = (part) => {
    const [x, y, w, h] = part.bbox
    return {
      backgroundImage: `url(${art.src})`,
      backgroundSize: `${100 / w}% ${100 / h}%`,
      backgroundPosition: `${w < 1 ? (x / (1 - w)) * 100 : 0}% ${h < 1 ? (y / (1 - h)) * 100 : 0}%`,
    }
  }

  return (
    <div className={`oi-fx${stacked ? ' oi-fx--stacked' : ''}`} data-reveal>
      {hasFlag && (
        <div className="oi-fx-tabs" role="tablist">
          {['flag', 'emblem'].map(id => (
            <button key={id} type="button" role="tab" aria-selected={artId === id}
              className={artId === id ? 'is-active' : ''} onClick={() => setArtId(id)}>
              {id === 'flag' ? s.flagCaption : s.symbolTitle}
            </button>
          ))}
        </div>
      )}
      <p className="oi-fx-hint">{ex.hint}</p>

      {/* Artwork on the left, information panel beside it (stacks below on small screens). */}
      <div className="oi-fx-layout">
      <div className="oi-fx-main">
      <div className="oi-fx-stage" ref={stageRef}>
        <div className="oi-fx-art"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave} onPointerCancel={onPointerCancel}>
          <img ref={imgRef} key={art.src} src={art.src} alt={artId === 'flag' ? s.flagCaption : s.symbolTitle}
            draggable="false" onLoad={onImgLoad} />
          <canvas ref={overlayRef} className="oi-fx-overlay" aria-hidden="true" />
        </div>
        {tip && text(tip.id) && (
          <span className="oi-fx-tip" style={{ left: tip.x, top: tip.y }}>{text(tip.id).name}</span>
        )}
      </div>
      <p className="oi-fx-caption">
        <span className="oi-plaque-no">{artId === 'flag' ? 'I' : 'II'}</span>
        {artId === 'flag' ? s.flagCaption : s.symbolTitle}
      </p>
      {hasFlag === false && <p className="oi-fx-note">{ex.flagNote}</p>}

      {/* Same choices as buttons: keyboard access and a quick way in on touch screens. */}
      {an && (
        <div className="oi-fx-chips">
          {an.parts.map(p => {
            const t = text(p.id)
            return (
              <button key={p.id} type="button" aria-pressed={selected === p.id}
                className={`oi-fx-chip${selected === p.id ? ' is-active' : ''}`}
                onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.id)} onBlur={() => setHover(null)}
                onClick={() => setSelected(p.id)}>
                {p.kind === 'colour'
                  ? <span className="oi-fx-chip-swatch" style={{ background: hex(p.rgb) }} />
                  : <span className="oi-fx-chip-crop" style={cropStyle(p)} />}
                {t?.name}
              </button>
            )
          })}
        </div>
      )}
      </div>

      <aside className={`oi-fx-panel${sel ? ' is-open' : ''}`} aria-live="polite">
        <div className="oi-fx-panel-inner">
          {!(sel && selPart) && (
            <div className="oi-fx-empty">
              <span className="oi-fx-empty-icon" aria-hidden="true" />
              <p>{ex.choose}</p>
            </div>
          )}
          {sel && selPart && (
            <div className="oi-fx-card" key={selected}>
              <div className="oi-fx-rep">
                {selPart.kind === 'colour'
                  ? <span className="oi-fx-rep-swatch" style={{ background: hex(selPart.rgb) }} />
                  : <span className="oi-fx-rep-crop" style={cropStyle(selPart)} />}
                <span className="oi-fx-rep-label">
                  {ex.original}{selPart.kind === 'colour' && <code>{hex(selPart.rgb)}</code>}
                </span>
              </div>
              <div className="oi-fx-copy">
                <span className="oi-fx-kind">{sel.kind === 'colour' ? ex.colour : ex.symbol}</span>
                <h3>{sel.name}</h3>
                {sel.meaning && <p className="oi-fx-meaning">{sel.meaning}</p>}
                <p>{sel.p}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
      </div>
    </div>
  )
}

export default FlagExplorer
