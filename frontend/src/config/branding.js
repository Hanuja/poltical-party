// Centralized party branding.
// Values here are fallbacks; the Website Settings API (admin panel) overrides them at runtime.
// Never hardcode party name/slogan/logo inside individual components — import from here.

export const branding = {
  partyName: {
    en: 'Ilankai Tamil Arasu Katchi',
    si: 'Ilankai Tamil Arasu Katchi',
    ta: 'இலங்கைத் தமிழரசுக் கட்சி',
  },
  slogan: {
    en: 'Your Official Slogan',
    si: 'ඔබේ නිල වාක්‍යය',
    ta: 'உங்கள் அதிகாரப்பூர்வ முழக்கம்',
  },
  logo: '/images/logo.png',       // primary logo
  logoDark: '/images/logo.png',
  favicon: '/favicon.svg',
  founded: '1990',
};

export function getBranding(lang = 'en') {
  return {
    name: branding.partyName[lang] || branding.partyName.en,
    slogan: branding.slogan[lang] || branding.slogan.en,
    logo: branding.logo,
    logoDark: branding.logoDark,
    favicon: branding.favicon,
  };
}
