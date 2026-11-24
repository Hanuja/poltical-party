import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * Cinematic chapter reader for "Our Journey — Six Chapters".
 * Each chapter index gets its own animation family (chm-v1…v6) while sharing
 * one editorial design language: ivory sheet, ink text, maroon + gold accents.
 * All copy comes from identityContent.js — nothing is invented here.
 */
export default function ChapterModal({ chapter, index, total, chapterLabel, labels, onClose, onNav }) {
  const sheetRef = useRef(null)
  const v = (index % 6) + 1

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNav(-1)
      if (e.key === 'ArrowRight') onNav(1)
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [onClose, onNav])

  if (!chapter) return null

  const modal = (
    <div className={`chm-backdrop chm-v${v}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`chm-sheet chm-v${v}`} role="dialog" aria-modal="true" aria-labelledby="chm-title" ref={sheetRef} tabIndex={-1}>
        <button type="button" className="chm-x" onClick={onClose} aria-label={labels?.close || 'Close'}><X size={22} /></button>

        {/* per-chapter decorative layers (pure CSS, aria-hidden) */}
        <div className="chm-fx" aria-hidden="true">
          {v === 1 && <><i className="chm-doc d1" /><i className="chm-doc d2" /><i className="chm-doc d3" /></>}
          {v === 2 && <><i className="chm-tl-line" /><i className="chm-tl-dot a" /><i className="chm-tl-dot b" /><i className="chm-tl-dot c" /></>}
          {v === 3 && <><i className="chm-panel p1" /><i className="chm-panel p2" /><i className="chm-panel p3" /></>}
          {v === 4 && <i className="chm-spot" />}
          {v === 5 && <><i className="chm-grow-line" /><i className="chm-grow-dot a" /><i className="chm-grow-dot b" /><i className="chm-grow-dot c" /></>}
          {v === 6 && <i className="chm-light" />}
        </div>

        <div className="chm-scroll">
          <div className="chm-head">
            <span className="chm-eyebrow">{chapterLabel} {pad2(index + 1)}</span>
            <span className="chm-ghost" aria-hidden="true">{pad2(index + 1)}</span>
            <span className="chm-heading-rule" aria-hidden="true" />
            <h2 id="chm-title" className="chm-title">{chapter.t}</h2>
            <p className="chm-lead">{chapter.p}</p>
          </div>

          {chapter.body?.length > 0 && (
            <div className="chm-body">
              {chapter.body.map((p, i) => <p key={i} style={{ '--d': `${0.35 + i * 0.22}s` }}>{p}</p>)}
            </div>
          )}
        </div>

        <div className="chm-foot">
          <button type="button" className="chm-nav" onClick={() => onNav(-1)} disabled={index === 0}>
            <ChevronLeft size={18} /> <span>{labels?.prev || 'Previous'}</span>
          </button>
          <span className="chm-count">{pad2(index + 1)} / {pad2(total)}</span>
          <button type="button" className="chm-nav" onClick={() => onNav(1)} disabled={index === total - 1}>
            <span>{labels?.next || 'Next'}</span> <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
