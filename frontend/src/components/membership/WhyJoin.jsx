import { useEffect, useRef, useState } from 'react'
import { HandHeart, Users, MessagesSquare, Sprout } from 'lucide-react'
import { PHOTOS } from '../../data/roadmapPhotos'
import { Eyebrow } from './memUi'

// Editorial "Why Join Us?": one large image stage that changes with the active theme (desktop),
// each theme with its own image on small screens. Admin-uploaded images (Join Us settings) replace
// the defaults; the defaults are the site's credited Wikimedia Commons photos from the roadmap page.
const ITEMS = [
  { key: 'service', Icon: HandHeart, photo: 'library-jaffna' },
  { key: 'unity', Icon: Users, photo: 'hero-sangupiddy' },
  { key: 'community', Icon: MessagesSquare, photo: 'palmyra-shop' },
  { key: 'development', Icon: Sprout, photo: 'paddy-ampara' },
]

function imageFor(item, i, adminImages) {
  const custom = adminImages?.[i]
  if (custom) return { src: custom, alt: '', credit: null }
  const p = PHOTOS.find((x) => x.key === item.photo)
  return p ? { src: p.src, alt: p.alt, credit: p } : { src: '', alt: '', credit: null }
}

function Credit({ credit, label }) {
  if (!credit) return null
  return (
    <p className="mb-why-credit">
      {label}: <a href={credit.source} target="_blank" rel="noreferrer">{credit.author}</a>,{' '}
      <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a>, Wikimedia Commons
    </p>
  )
}

export default function WhyJoin({ s, adminImages }) {
  const [active, setActive] = useState(0)
  const listRef = useRef(null)
  const images = ITEMS.map((it, i) => imageFor(it, i, adminImages))

  // Scrolling through the list on desktop moves the image stage along with it.
  useEffect(() => {
    const list = listRef.current
    if (!list || !('IntersectionObserver' in window)) return undefined
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.index)) })
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 })
    list.querySelectorAll('[data-index]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="mb-why" aria-labelledby="mb-why-title">
      <div className="mb-wrap">
        <header className="mb-why-head" data-mb-reveal="">
          <Eyebrow>{s.why.eyebrow}</Eyebrow>
          <h2 id="mb-why-title" className="mb-h2">{s.why.title}</h2>
          <p className="mb-lead">{s.why.intro}</p>
        </header>

        <div className="mb-why-grid">
          <div className="mb-why-stage" aria-hidden="true">
            {images.map((img, i) => img.src && (
              <figure key={i} className={`mb-why-slide ${active === i ? 'is-active' : ''}`}>
                <img src={img.src} alt="" loading="lazy" decoding="async" />
                <figcaption><span>{String(i + 1).padStart(2, '0')}</span>{s.why.items[ITEMS[i].key][0]}</figcaption>
              </figure>
            ))}
            <span className="mb-why-stage-bar" style={{ '--mb-progress': (active + 1) / ITEMS.length }} />
          </div>

          <ol className="mb-why-list" ref={listRef}>
            {ITEMS.map((it, i) => {
              const [title, text] = s.why.items[it.key]
              const img = images[i]
              return (
                <li key={it.key} data-index={i} data-mb-reveal="" style={{ '--mb-i': i }}
                  className={`mb-why-item ${active === i ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
                  {img.src && (
                    <div className="mb-why-inline">
                      <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
                    </div>
                  )}
                  <div className="mb-why-body">
                    <span className="mb-why-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="mb-why-title"><it.Icon size={22} aria-hidden="true" />{title}</h3>
                      <p>{text}</p>
                      <Credit credit={img.credit} label={s.why.photo} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
