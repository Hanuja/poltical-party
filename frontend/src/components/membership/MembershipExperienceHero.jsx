import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const DIGITS = 6
const COPY = {
  en: { eyebrow: 'A stronger voice, together', title: 'JOIN OUR GROWING COMMUNITY', body: 'Become a member of our community and stand together for a stronger, more informed society.', count: 'OUR ACTIVE MEMBERS', cta: 'BECOME A MEMBER', hint: 'Your membership begins with one step.' },
  ta: { eyebrow: 'ஒன்றிணைந்த வலிமையான குரல்', title: 'நமது பயணத்தில் உங்கள் இடம்.', body: 'ஒவ்வொரு மாவட்டத்திற்கும் கண்ணியம், வாய்ப்பு மற்றும் சிறந்த எதிர்காலத்திற்காக ஒன்றிணையும் சமூகத்தில் இணையுங்கள்.', count: 'அங்கீகரிக்கப்பட்ட உறுப்பினர்கள்', cta: 'உறுப்பினராகுங்கள்', hint: 'உங்கள் பயணம் ஒரு படியில் தொடங்குகிறது.' },
  si: { eyebrow: 'එකට ශක්තිමත් හඬක්', title: 'අපේ ගමනේ ඔබටත් තැනක්.', body: 'සෑම දිස්ත්‍රික්කයකටම ගෞරවය, අවස්ථා සහ යහපත් අනාගතයක් වෙනුවෙන් එක්වන ප්‍රජාවට එකතු වන්න.', count: 'අනුමත සාමාජිකයන්', cta: 'සාමාජිකයෙකු වන්න', hint: 'ඔබේ ගමන එක් පියවරකින් ඇරඹේ.' },
}

function MemberFigure() {
  return <svg className="mbx-person" viewBox="0 0 520 700" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="mbx-shirt" x1="180" y1="165" x2="325" y2="390" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".5" stopColor="#f3f3f1"/><stop offset="1" stopColor="#cbd0d0"/></linearGradient>
      <linearGradient id="mbx-skin" x1="270" y1="55" x2="330" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor="#efc5a1"/><stop offset="1" stopColor="#a96d4c"/></linearGradient>
      <linearGradient id="mbx-pants" x1="194" y1="355" x2="336" y2="658" gradientUnits="userSpaceOnUse"><stop stopColor="#27282b"/><stop offset="1" stopColor="#08090b"/></linearGradient>
      <linearGradient id="mbx-chain" x1="7" y1="300" x2="135" y2="364" gradientUnits="userSpaceOnUse"><stop stopColor="#7d8588"/><stop offset=".48" stopColor="#f4f6f6"/><stop offset="1" stopColor="#707679"/></linearGradient>
      <filter id="mbx-shadow" x="80" y="30" width="400" height="680" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="13"/></filter>
    </defs>
    <ellipse cx="266" cy="672" rx="136" ry="15" fill="#1c1720" opacity=".17" filter="url(#mbx-shadow)"/>
    {/* Long chain held in the left hand */}
    <g className="mbx-chain-motion"><path d="M15 304 C38 304 40 341 62 341 C83 341 84 306 105 306 C122 306 119 331 133 333" stroke="url(#mbx-chain)" strokeWidth="9" strokeLinecap="round"/>
    <g stroke="#f8f9f8" strokeWidth="2" opacity=".9"><ellipse cx="22" cy="304" rx="9" ry="5" transform="rotate(18 22 304)"/><ellipse cx="42" cy="322" rx="9" ry="5" transform="rotate(70 42 322)"/><ellipse cx="61" cy="340" rx="9" ry="5" transform="rotate(-18 61 340)"/><ellipse cx="81" cy="324" rx="9" ry="5" transform="rotate(-70 81 324)"/><ellipse cx="101" cy="306" rx="9" ry="5" transform="rotate(18 101 306)"/><ellipse cx="120" cy="321" rx="8" ry="5" transform="rotate(65 120 321)"/></g></g>
    {/* Shoes and tailored black trousers */}
    <path d="M204 510 L196 647 L175 666 Q168 674 181 680 H244 Q256 677 250 664 L242 641 L260 525Z" fill="url(#mbx-pants)"/>
    <path d="M283 510 L286 644 L273 665 Q269 677 283 680 H355 Q369 677 361 665 L332 640 L340 518Z" fill="url(#mbx-pants)"/>
    <path d="M182 662 Q205 660 248 664 L255 677 Q256 684 246 686 H178 Q166 683 174 674Z" fill="#131416"/>
    <path d="M278 662 Q309 660 359 665 L369 677 Q370 684 359 686 H281 Q267 684 272 674Z" fill="#131416"/>
    <path d="M257 373 L337 377 L344 505 Q318 518 286 511 L267 463 L248 512 Q221 519 194 506 L213 376Z" fill="url(#mbx-pants)"/>
    <path d="M278 384 L285 503" stroke="#56585c" strokeWidth="2" opacity=".7"/>
    {/* Neck and head */}
    <path d="M262 133 L261 177 L304 184 L310 136Z" fill="url(#mbx-skin)"/>
    <path d="M224 82 Q226 39 273 36 Q320 37 326 85 L317 125 Q304 157 274 161 Q243 155 231 126Z" fill="url(#mbx-skin)"/>
    <path d="M224 94 Q212 52 243 34 Q270 12 305 31 Q331 47 326 88 L313 78 Q305 58 286 59 Q264 77 237 72 L230 101Z" fill="#191719"/>
    <path d="M244 100 Q253 96 261 100 M289 100 Q298 96 306 100" stroke="#3f2b25" strokeWidth="3" strokeLinecap="round"/>
    <path d="M272 104 L268 122 L278 124 M262 137 Q277 145 293 136" stroke="#8f5540" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Shirt and collar */}
    <path d="M235 166 L262 153 L282 171 L301 154 L329 168 Q350 182 358 218 L339 350 Q304 372 249 367 Q205 366 179 348 L195 218 Q203 184 235 166Z" fill="url(#mbx-shirt)" stroke="#c4c7c7" strokeWidth="2"/>
    <path d="M262 153 L278 174 L266 196 L244 165Z M282 171 L301 154 L313 164 L289 196 L266 196Z" fill="#fff" stroke="#b9bfc0" strokeWidth="1.5"/>
    <path d="M277 197 L278 353" stroke="#c7cbca" strokeWidth="2"/>
    <circle cx="279" cy="220" r="2.7" fill="#767b7b"/><circle cx="279" cy="246" r="2.7" fill="#767b7b"/><circle cx="279" cy="272" r="2.7" fill="#767b7b"/>
    <path d="M239 179 Q225 239 232 338 M316 182 Q329 235 322 340" stroke="#fff" strokeWidth="7" opacity=".48"/>
    {/* Left sleeve and arm, hand clasping chain */}
    <path d="M199 187 Q175 190 164 215 L142 281 Q134 301 119 307 L126 325 Q149 335 164 314 L198 260Z" fill="url(#mbx-shirt)" stroke="#b7bfc0" strokeWidth="2"/>
    <path d="M129 310 Q118 306 108 309 L99 319 Q95 325 103 328 L120 332 Q128 341 141 336 L151 326Z" fill="url(#mbx-skin)"/>
    <path d="M112 322 L128 327 M108 328 L123 333" stroke="#8d563f" strokeWidth="2" strokeLinecap="round"/>
    {/* Right sleeve and extended pointing arm */}
    <g className="mbx-point-arm">
      <path d="M328 181 Q354 184 370 209 L389 234 L438 233 Q451 224 468 214 L488 208 Q497 205 500 211 Q501 216 493 220 L472 230 L450 252 Q443 260 425 260 L376 263 Q356 266 345 250 L326 224Z" fill="url(#mbx-skin)" stroke="#a76d4f" strokeWidth="2"/>
      <path d="M326 184 Q356 185 370 209 L389 236 L363 263 Q338 259 324 233Z" fill="url(#mbx-shirt)" stroke="#bcc1c1" strokeWidth="2"/>
      <path d="M469 214 L490 207 Q500 204 502 210 Q503 215 495 219 L473 228" stroke="#87543f" strokeWidth="2"/>
      <path d="M464 233 L486 231 Q495 231 495 236 Q494 241 486 241 L465 244" stroke="#87543f" strokeWidth="2"/>
    </g>
    <path d="M184 350 Q260 370 347 349" stroke="#c5c8c8" strokeWidth="2"/>
  </svg>
}

export default function MembershipExperienceHero({ language = 'en', count = 0, onJoin }) {
  const reduce = useReducedMotion()
  const [displayCount, setDisplayCount] = useState(count)
  const copy = COPY[language] || COPY.en
  useEffect(() => { setDisplayCount(count) }, [count])
  const digits = String(Math.max(0, Number(displayCount) || 0)).padStart(DIGITS, '0').slice(-DIGITS)
  const rise = (delay) => reduce ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: .75, delay } }

  return <section className="mbx-hero" aria-labelledby="mbx-title">
    <div className="mbx-wrap">
      <div className="mbx-brand"><img src="/images/logo.png" alt="Ilankai Tamil Arasu Katchi" /><span>ILANKAI TAMIL ARASU KATCHI</span></div>
      <div className="mbx-main">
        <div className="mbx-stage">
          <div className="mbx-stage-glow" aria-hidden="true" />
          <div className="mbx-chain-label" aria-hidden="true">COMMUNITY · CONNECTION · SERVICE</div>
          <MemberFigure />
          <motion.span className="mbx-tap-dot" aria-hidden="true" animate={reduce ? {} : { scale: [1, 1.3, 1], opacity: [.45, .9, .45] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        <div className="mbx-copy">
          <motion.div className="mbx-count-dock" {...rise(.18)}>
            <div className="mbx-count-card" role="status" aria-live="polite" aria-atomic="true" aria-label={`${digits} ${copy.count}`}>
              <span className="mb-sr">{digits} {copy.count}</span>
              <span className="mbx-count-label">{copy.count}</span>
              <span className="mbx-digits">{digits.split('').map((digit, index) => <span key={`${index}-${digits}`} className="mbx-digit" aria-hidden="true">{digit}</span>)}</span>
              <span className="mbx-count-hint">{copy.hint}</span>
            </div>
            <motion.button type="button" className="mbx-cta" onClick={onJoin} {...rise(.28)}>
              {copy.cta}<ArrowRight size={17} aria-hidden="true" />
            </motion.button>
          </motion.div>
          <motion.span className="mbx-eyebrow" {...rise(.34)}>{copy.eyebrow}</motion.span>
          <motion.h1 id="mbx-title" {...rise(.4)}>{copy.title}</motion.h1>
          <motion.p className="mbx-description" {...rise(.48)}>{copy.body}</motion.p>
          <span className="mbx-note"><ArrowDown size={14} /> {language === 'ta' ? 'கீழே சென்று விண்ணப்பிக்கவும்' : language === 'si' ? 'අයදුම් කිරීමට පහළට යන්න' : 'Continue below to apply'}</span>
        </div>
      </div>
    </div>
  </section>
}
