import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from '../SocialIcons'

const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true, focusable: false }

function WhatsappIcon(props) {
  return (
    <svg {...svg} {...props}>
      <path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 4.9-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.3 1 2.5.1.1 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3z" />
    </svg>
  )
}

function TelegramIcon(props) {
  return (
    <svg {...svg} {...props}>
      <path d="M21.4 4.2 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5zM8.9 14l9.3-5.9c.5-.3.9-.1.5.2l-7.7 7-.3 3.4L8.9 14z" />
    </svg>
  )
}

export const SOCIAL = {
  facebook: { Icon: FacebookIcon, label: 'Facebook' },
  x: { Icon: TwitterIcon, label: 'X' },
  instagram: { Icon: InstagramIcon, label: 'Instagram' },
  youtube: { Icon: YoutubeIcon, label: 'YouTube' },
  whatsapp: { Icon: WhatsappIcon, label: 'WhatsApp' },
  telegram: { Icon: TelegramIcon, label: 'Telegram' },
}

// UI strings that are not admin content. Everything else comes from Footer Settings.
const STRINGS = {
  en: {
    footer: 'Site footer', invalid: 'Please enter a valid email address.', error: 'Something went wrong. Please try again.',
    sending: 'Subscribing…', email: 'Email address', resubscribed: 'Welcome back! Your subscription is active again.',
    address: 'Address', phone: 'Phone', mail: 'Email', hours: 'Working hours', map: 'Location',
    newTab: '(opens in a new tab)', social: 'Follow us', legal: 'Legal', mapLink: 'View on Google Maps', write: 'Write to us',
  },
  ta: {
    footer: 'இணையதள அடிக்குறிப்பு', invalid: 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.', error: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    sending: 'பதிவு செய்யப்படுகிறது…', email: 'மின்னஞ்சல் முகவரி', resubscribed: 'மீண்டும் வருக! உங்கள் சந்தா மீண்டும் செயல்பாட்டில் உள்ளது.',
    address: 'முகவரி', phone: 'தொலைபேசி', mail: 'மின்னஞ்சல்', hours: 'அலுவலக நேரம்', map: 'இருப்பிடம்',
    newTab: '(புதிய தாவலில் திறக்கும்)', social: 'எங்களைப் பின்தொடருங்கள்', legal: 'சட்டத் தகவல்', mapLink: 'Google வரைபடத்தில் காண்க', write: 'எமக்கு எழுதுங்கள்',
  },
  si: {
    footer: 'වෙබ් අඩවි පාදකය', invalid: 'කරුණාකර වලංගු විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න.', error: 'යම් දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.',
    sending: 'දායක වෙමින්…', email: 'විද්‍යුත් තැපැල් ලිපිනය', resubscribed: 'නැවත සාදරයෙන් පිළිගනිමු! ඔබගේ දායකත්වය නැවත සක්‍රීයයි.',
    address: 'ලිපිනය', phone: 'දුරකථනය', mail: 'විද්‍යුත් තැපෑල', hours: 'කාර්යාල වේලාවන්', map: 'ස්ථානය',
    newTab: '(නව ටැබයක විවෘත වේ)', social: 'අප අනුගමනය කරන්න', legal: 'නීතිමය', mapLink: 'Google සිතියමේ බලන්න', write: 'අපට ලියන්න',
  },
}
export const uiStrings = (lang) => STRINGS[lang] || STRINGS.en

const isInternal = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
const isWeb = (url) => /^https?:\/\//i.test(url || '')

// Our People anchors (#op-leader …) render after the page fetches its data, so wait for the target.
function scrollToHash(hash) {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  if (!id) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const started = Date.now()
  // Timers, not requestAnimationFrame: rAF is paused in background tabs.
  const tick = () => {
    const el = document.getElementById(id)
    if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return }
    if (Date.now() - started < 5000) setTimeout(tick, 80)
  }
  // Let the layout's scroll-to-top for the new route run first.
  setTimeout(tick, 80)
}

/** Internal path → router Link (with #hash support); http(s)/mailto/tel → <a>. */
export function SmartLink({ to, children, className, newTabLabel, ...rest }) {
  const location = useLocation()
  const navigate = useNavigate()
  if (!to) return null

  if (isInternal(to)) {
    const [pathAndQuery, hash = ''] = to.split('#')
    const current = location.pathname + location.search
    const isCurrent = !hash && (pathAndQuery === current || (pathAndQuery === location.pathname && !pathAndQuery.includes('?') && !location.search))
    const onClick = hash ? (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      if (location.pathname + location.search !== pathAndQuery) navigate(to)
      else window.history.replaceState(null, '', to)
      scrollToHash(hash)
    } : undefined
    return (
      <Link to={to} className={className} onClick={onClick} aria-current={isCurrent ? 'page' : undefined} {...rest}>
        {children}
      </Link>
    )
  }

  const external = isWeb(to)
  return (
    <a href={to} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
      {external && newTabLabel && <span className="tw:sr-only"> {newTabLabel}</span>}
    </a>
  )
}

/** Kolam-style dot lattice (pulli kolam) — a quiet Tamil geometric texture behind the footer. */
export function KolamPattern() {
  return (
    <svg className="rf-pattern" aria-hidden="true" focusable="false" style={{
      WebkitMaskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,.55) 45%, transparent 85%)',
      maskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,.55) 45%, transparent 85%)',
    }}>
      <defs>
        <pattern id="rf-kolam" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M0 32 Q4 4 32 0 Q60 4 64 32 Q60 60 32 64 Q4 60 0 32Z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M32 18 Q46 18 46 32 Q46 46 32 46 Q18 46 18 32 Q18 18 32 18Z" fill="none" stroke="currentColor" strokeWidth=".8" />
          <circle cx="32" cy="32" r="2.2" fill="currentColor" />
          <circle cx="0" cy="0" r="1.8" fill="currentColor" />
          <circle cx="64" cy="0" r="1.8" fill="currentColor" />
          <circle cx="0" cy="64" r="1.8" fill="currentColor" />
          <circle cx="64" cy="64" r="1.8" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rf-kolam)" />
    </svg>
  )
}

/** Faint rising-sun rays — the dawn of a democratic tomorrow — behind the call to action. */
export function SunRays({ className = '' }) {
  const rays = Array.from({ length: 13 }, (_, i) => -90 + i * 15)
  return (
    <svg className={className} viewBox="0 0 400 220" aria-hidden="true" focusable="false">
      <g transform="translate(200 220)" fill="currentColor">
        {rays.map((a) => (
          <path key={a} d="M-5 0 L0 -210 L5 0Z" transform={`rotate(${a})`} />
        ))}
        <circle r="54" />
      </g>
    </svg>
  )
}
