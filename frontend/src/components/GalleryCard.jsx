import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function GalleryCard({ image, caption, onOpen, index }) {
  const { language } = useLanguage()
  const cap = typeof caption === 'object' ? (caption[language] || caption.en) : caption
  return (
    <button
      className="gallery-thumb"
      onClick={() => onOpen(index)}
      aria-label={cap || 'Open image'}
      style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
    >
      <img src={image} alt={cap || ''} loading="lazy" />
      {cap && <span className="gallery-caption">{cap}</span>}
    </button>
  )
}

export function Lightbox({ images, index, captions = {}, onClose, onNavigate }) {
  const { t, language } = useLanguage()
  if (index === null || index === undefined) return null
  const img = images[index]
  const cap = captions[img.id]
  const captionText = typeof cap === 'object' ? (cap[language] || cap.en) : cap

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label={t('common.close')}><X size={26} /></button>
      <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); onNavigate(-1) }} aria-label={t('common.previous')}><ChevronLeft size={30} /></button>
      <figure className="lightbox-figure" onClick={e => e.stopPropagation()}>
        <img src={img.image || img.image_path} alt={captionText || ''} />
        {captionText && <figcaption>{captionText}</figcaption>}
      </figure>
      <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); onNavigate(1) }} aria-label={t('common.next')}><ChevronRight size={30} /></button>
    </div>
  )
}
