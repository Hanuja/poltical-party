import { ArrowRight } from 'lucide-react'
import './PoliticalInfoCard.css'

export default function PoliticalInfoCard({ title, desc, img, bgImg, hasLayer, index }) {
  return (
    <article className={`political-info-card reveal reveal-${index}`}>
      {/* Section 1 – Leader Image (red background + 3D pop-out) */}
      <div className="political-card-frame">
        <div className="political-card-bg">
          {bgImg ? <img src={bgImg} alt={title} loading="lazy" /> : null}
        </div>
        {hasLayer && (
          <div className="political-card-foreground">
            <img src={img} alt={title} loading="lazy" />
          </div>
        )}
      </div>

      {/* Section 2 – Red Title Button */}
      <button className="political-card-btn">
        <span>{title}</span>
        <span className="political-card-arrow">
          <ArrowRight size={18} />
        </span>
      </button>

      {/* Section 3 – Description Text */}
      <p className="political-card-desc">{desc}</p>
    </article>
  )
}
