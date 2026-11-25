// Centralized party branding.
// Values here are fallbacks; the Website Settings API (admin panel) overrides them at runtime.
// Never hardcode party name/slogan/logo inside individual components — import from here.

export const PARTY_LOGO = '/images/logo.png'

// Official party names. Each is shown in its own script and font (components/PartyName.jsx).
export const PARTY_NAMES = {
  ta: 'தாயக மக்கள் கழகம்',
  en: 'Thayaga Makkal Kazhagam (TMK)',
  si: 'තායක ජනතා සංවිධානය',
}
export const PARTY_SHORT_NAME = 'TMK'

export const branding = {
  partyName: {
    en: PARTY_NAMES.en,
    si: PARTY_NAMES.si,
    ta: PARTY_NAMES.ta,
  },
  slogan: {
    en: 'Your Official Slogan',
    si: 'ඔබේ නිල වාක්‍යය',
    ta: 'உங்கள் அதிகாரப்பூர்வ முழக்கம்',
  },
  logo: PARTY_LOGO,
  logoDark: PARTY_LOGO,
  favicon: PARTY_LOGO,
  founded: '1990',
};

export function getBranding(lang = 'en') {
  return {
    name: branding.partyName[lang] || branding.partyName.en,
    names: PARTY_NAMES,
    slogan: branding.slogan[lang] || branding.slogan.en,
    logo: branding.logo,
    logoDark: branding.logoDark,
    favicon: branding.favicon,
  };
}
