// Footer content — the single place to edit the public-site footer.
//
// Links point only at routes that exist in routes/AppRoutes.jsx. A link with `to: null` is not rendered
// (use it for pages that don't exist yet). `i18n` names an existing translation key used for Tamil /
// Sinhala; English always uses `label` so the wording matches the footer design.
//
// Contact details and social URLs are intentionally empty: the site has no confirmed official values
// yet (the old mock data only had placeholders). Fill them in and they appear automatically.

export const FOOTER = {
  identity: {
    logo: '/images/logo.png',
    shortName: 'RISE',
    name: 'Ilankai Tamil Arasu Katchi',
    motto: 'Together for Our People. Building a Better Tomorrow.',
    vision: 'Committed to democratic values, equality, Tamil rights, social justice, and a prosperous future for our people.',
  },

  // Order = display order. Empty URL → icon hidden.
  social: [
    { platform: 'facebook', url: '' },
    { platform: 'x', url: '' },
    { platform: 'instagram', url: '' },
    { platform: 'youtube', url: '' },
    { platform: 'whatsapp', url: '' },
    { platform: 'telegram', url: '' },
  ],

  explore: {
    title: 'Explore ITAK',
    links: [
      { label: 'Home', i18n: 'nav.home', to: '/' },
      { label: 'Our Identity', i18n: 'nav.ourIdentity', to: '/our-identity' },
      { label: 'Our People', i18n: 'nav.ourPeople', to: '/our-people' },
      // The header's "More" is a dropdown only; there is no "More" page to link to.
      { label: 'More', i18n: 'nav.moreOptions', to: null },
      { label: 'Join Us', i18n: 'nav.joinUsLink', to: '/membership' },
      { label: 'Contact Us', i18n: 'nav.contactUsLink', to: '/contact' },
    ],
  },

  ourIdentity: {
    title: 'Our Identity',
    links: [
      { label: 'Our Story & Formation', i18n: 'nav.idStory', desc: 'Party formation and history.', to: '/our-identity?section=story' },
      { label: 'Vision & Mission', i18n: 'nav.idVision', desc: 'Our purpose and direction.', to: '/our-identity?section=vision' },
      { label: 'Principles & Ideology', i18n: 'nav.idIdeology', desc: 'Party policy positions.', to: '/principles-ideology' },
      { label: 'Constitution & Policies', i18n: 'nav.idConstitution', desc: 'Official policy documents.', to: '/our-identity?section=constitution' },
    ],
  },

  people: {
    title: 'Our People',
    links: [
      { label: 'Party Leadership', i18n: 'nav.ppLeadership', to: '/our-people' },
      { label: 'Party Leader', i18n: 'ourPeople.sections.leader', to: '/our-people#op-leader' },
      { label: 'General Secretary', i18n: 'ourPeople.sections.generalSecretary', to: '/our-people#op-generalSecretary' },
      { label: 'Deputy Leaders', i18n: 'ourPeople.sections.deputies', to: '/our-people#op-deputies' },
      // Not on the site yet — Our People only has Leader / General Secretary / Deputies / Executive sections.
      { label: 'National Organisers', to: null },
      { label: 'Provincial Representatives', to: null },
      { label: 'District Representatives', to: null },
    ],
  },

  resources: {
    title: 'Public Resources',
    links: [
      { label: 'Latest Announcements', i18n: 'announcements.title', to: '/announcements' },
      { label: 'News & Updates', i18n: 'nav.news', to: '/news' },
      { label: 'Events', i18n: 'nav.events', to: '/events' },
      { label: 'Media Gallery', i18n: 'nav.gallery', to: '/gallery' },
      { label: 'Development Data', i18n: 'nav.moDev', to: '/development' },
      { label: 'Future Roadmap', i18n: 'nav.moRoadmap', to: '/roadmap' },
    ],
  },

  connect: {
    title: 'Connect With RISE',
    address: '',      // Headquarters address (line breaks allowed)
    phone: '',
    email: '',
    hours: '',        // e.g. 'Mon – Fri, 9.00 am – 5.00 pm'
    mapUrl: '',       // https://maps.google.com/…
    contactPage: { label: 'Send us a message', i18n: 'nav.contactUsLink', to: '/contact' },
  },

  cta: {
    title: 'Be Part of the Change',
    text: 'Your voice and participation can help build a stronger and more progressive future for our people.',
    buttons: [
      { label: 'Join Us', i18n: 'nav.joinUsLink', to: '/membership' },
      // There is no volunteer registration page; volunteers get in touch through the Contact page.
      { label: 'Volunteer With Us', to: '/contact' },
    ],
  },

  newsletter: {
    title: 'Stay Connected With RISE',
    text: 'Receive the latest announcements, events, and important updates.',
    placeholder: 'Your email address',
    button: 'Subscribe',
    success: 'Thank you! You are now subscribed.',
    duplicate: 'This email is already subscribed.',
  },

  bottom: {
    copyright: 'Copyright © {year} RISE. All Rights Reserved.',
    credit: 'Designed for the People. Built for the Future.',
    links: [
      { label: 'Privacy Policy', i18n: 'footer.privacy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', i18n: 'footer.terms', to: '/terms-conditions' },
      // No pages yet — shown once a route exists.
      { label: 'Accessibility', to: null },
      { label: 'Website Credits', to: null },
    ],
  },
}
