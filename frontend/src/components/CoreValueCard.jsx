import { ArrowRight } from 'lucide-react'

export default function CoreValueCard({ title, desc, img, hasLayer, index }) {
  return (
    <article className={`core-value-card reveal reveal-${index}`}>
      {/* Section 1 – Leader Image */}
      <div className="core-value-frame">
        {hasLayer ? (
          <>
            <div className="core-value-bg">
              <img src={img} alt={title} loading="lazy" />
            </div>
            <div className="core-value-foreground">
              <img src={img} alt={title} loading="lazy" />
            </div>
          </>
        ) : (
          <div className="core-value-bg">
            <img src={img} alt={title} loading="lazy" />
          </div>
        )}
      </div>

      {/* Section 2 – Red Title Button */}
      <button className="core-value-btn">
        <span>{title}</span>
        <span className="core-value-arrow">
          <ArrowRight size={18} />
        </span>
      </button>

      {/* Section 3 – Description Text */}
      <p className="core-value-desc">{desc}</p>
    </article>
  )
}
