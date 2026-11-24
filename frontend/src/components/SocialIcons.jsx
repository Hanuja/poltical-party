// Brand icons — lucide-react no longer ships brand glyphs, so these are
// inline SVGs kept in one place for consistency.

const base = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor',
  'aria-hidden': true, focusable: false,
}

export function FacebookIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8v3h2.7v7h2.8z" />
    </svg>
  )
}

export function TwitterIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17.7 3H21l-7.3 8.3L22.2 21h-6.8l-5.3-7-6.1 7H1.6l7.8-8.9L1.5 3h7l4.8 6.4L17.7 3zm-1.2 16h1.9L7.1 4.9H5.1L16.5 19z" />
    </svg>
  )
}

export function InstagramIcon(props) {
  return (
    <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function YoutubeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2-5.2 3.2z" />
    </svg>
  )
}

export const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
}

export default SOCIAL_ICONS
