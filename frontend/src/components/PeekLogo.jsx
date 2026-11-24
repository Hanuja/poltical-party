import '../styles/peek-logo.css'

// Playful logo peek: the original logo stays untouched; a small party member
// hides behind it, peeks out, looks left/right, then ducks back — infinite loop.
export default function PeekLogo({ src, alt = '', className = '', imgClassName = '', height }) {
  return (
    <span className={`peek-logo ${className}`}>
      <img src={src} alt={alt} className={`peek-logo-img ${imgClassName}`} height={height} />
      <svg className="peek-person" viewBox="0 0 64 74" aria-hidden="true" focusable="false">
        {/* shoulders */}
        <path className="pk-body" d="M10 74c2-12 10-17 22-17s20 5 22 17z" />
        {/* head */}
        <ellipse className="pk-head" cx="32" cy="30" rx="19" ry="21" />
        {/* hair */}
        <path className="pk-hair" d="M13 28c-2-14 8-24 19-24s21 10 19 24c-4-7-9-10-19-10s-15 3-19 10z" />
        {/* party flag pin */}
        <path className="pk-pin" d="M46 12l8-4-2 9-6 3z" />
        <line className="pk-pin" x1="45" y1="13" x2="52" y2="7" strokeWidth="1.6" />
        {/* eyes */}
        <g className="pk-eye pk-eye-l">
          <ellipse cx="25" cy="32" rx="4.6" ry="5.4" className="pk-white" />
          <circle cx="25" cy="32.6" r="2.1" className="pk-pupil pk-pupil-l" />
        </g>
        <g className="pk-eye pk-eye-r">
          <ellipse cx="39" cy="32" rx="4.6" ry="5.4" className="pk-white" />
          <circle cx="39" cy="32.6" r="2.1" className="pk-pupil pk-pupil-r" />
        </g>
        {/* smile */}
        <path className="pk-smile" d="M27 41c3 3.4 7 3.4 10 0" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  )
}
