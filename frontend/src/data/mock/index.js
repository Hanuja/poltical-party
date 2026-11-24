// Mock data layer — used ONLY when the PHP API is unreachable or returns an error.
// Shape mirrors the public API response so swapping to real data requires no page changes.
// NOTE: si/ta content fields intentionally fall back to English until translated
// content is published through the admin panel (placeholder data only).

const T = (en, si = '', ta = '') => ({ en, si, ta })

export const mockNews = [
  {
    id: 1, slug: 'party-launches-national-development-programme',
    category: 'Announcement', categorySlug: 'announcements',
    image: '/images/placeholder-news-1.svg',
    date: '2026-11-10', author: 'Party Media Unit',
    isFeatured: true, isBreaking: true, type: 'news',
    title: T('Party Launches National Development Programme'),
    excerpt: T('A comprehensive five-year programme covering education, healthcare, agriculture and infrastructure was unveiled at the party headquarters.'),
    content: T('<p>Full article content will be managed through the admin panel. This is placeholder text for the public website preview.</p>'),
  },
  {
    id: 2, slug: 'leadership-meets-community-leaders-kandy',
    category: 'Community', categorySlug: 'community',
    image: '/images/placeholder-news-2.svg',
    date: '2026-11-05', author: 'Correspondent',
    isFeatured: false, isBreaking: false, type: 'news',
    title: T('Leadership Meets Community Leaders in Kandy'),
    excerpt: T('Senior party leaders held discussions with local community representatives on development priorities.'),
    content: T('<p>Full article content will be managed through the admin panel.</p>'),
  },
  {
    id: 3, slug: 'education-policy-paper-released',
    category: 'Policy', categorySlug: 'policy',
    image: '/images/placeholder-news-3.svg',
    date: '2026-10-28', author: 'Policy Wing',
    isFeatured: false, isBreaking: false, type: 'news',
    title: T('Education Policy Paper Released'),
    excerpt: T('The party published its detailed education reform proposal focusing on rural schools and teacher training.'),
    content: T('<p>Full article content will be managed through the admin panel.</p>'),
  },
  {
    id: 4, slug: 'youth-wing-national-conference-2026',
    category: 'Event', categorySlug: 'events',
    image: '/images/placeholder-news-4.svg',
    date: '2026-10-20', author: 'Youth Wing',
    isFeatured: true, isBreaking: false, type: 'news',
    title: T('Youth Wing Holds National Conference'),
    excerpt: T('Over 500 young delegates gathered to discuss employment and civic participation.'),
    content: T('<p>Full article content will be managed through the admin panel.</p>'),
  },
  {
    id: 5, slug: 'official-statement-on-national-budget',
    category: 'Statement', categorySlug: 'statements',
    image: '/images/placeholder-news-5.svg',
    date: '2026-10-12', author: 'Party Secretariat',
    isFeatured: false, isBreaking: false, type: 'statement',
    title: T('Official Statement on National Budget'),
    excerpt: T('The party welcomed certain measures while calling for stronger rural investment.'),
    content: T('<p>Full article content will be managed through the admin panel.</p>'),
  },
  {
    id: 6, slug: 'press-release-membership-drive',
    category: 'Press Release', categorySlug: 'press',
    image: '/images/placeholder-news-6.svg',
    date: '2026-10-01', author: 'Media Cell',
    isFeatured: false, isBreaking: false, type: 'press',
    title: T('Press Release: New Membership Drive Announced'),
    excerpt: T('The party announced a year-long membership recruitment campaign across all districts.'),
    content: T('<p>Full article content will be managed through the admin panel.</p>'),
  },
]

export const mockEvents = [
  {
    id: 1, slug: 'national-rally-colombo',
    image: '/images/placeholder-event-1.svg',
    date: '2026-12-05', startTime: '16:00', endTime: '19:00',
    venue: 'BMICH Grand Bandstand', address: 'Bauddhaloka Mawatha, Colombo 07',
    mapUrl: 'https://maps.google.com/?q=Colombo', category: 'Rally',
    registrationLimit: 2000, registrationCount: 850,
    title: T('National Development Rally'),
    description: T('<p>Join us for our biggest rally of the year — speakers, cultural programme and policy announcements.</p>'),
  },
  {
    id: 2, slug: 'policy-forum-jaffna',
    image: '/images/placeholder-event-2.svg',
    date: '2026-12-12', startTime: '10:00', endTime: '13:00',
    venue: 'Jaffna Public Library Hall', address: 'Jaffna',
    mapUrl: 'https://maps.google.com/?q=Jaffna', category: 'Conference',
    registrationLimit: 500, registrationCount: 320,
    title: T('Policy Forum: Northern Province'),
    description: T('<p>Public forum on provincial development and language rights.</p>'),
  },
  {
    id: 3, slug: 'youth-encounter-galle',
    image: '/images/placeholder-event-3.svg',
    date: '2026-11-22', startTime: '14:00', endTime: '17:00',
    venue: 'Galle Face Green', address: 'Galle',
    mapUrl: 'https://maps.google.com/?q=Galle', category: 'Community Programme',
    registrationLimit: 800, registrationCount: 610,
    title: T('Youth Encounter'),
    description: T('<p>Sports, music and civic awareness activities for young members.</p>'),
  },
  {
    id: 4, slug: 'women-forum-kurunegala',
    image: '/images/placeholder-event-4.svg',
    date: '2026-10-15', startTime: '09:30', endTime: '12:30',
    venue: 'Kurunegala Town Hall', address: 'Kurunegala',
    mapUrl: '', category: 'Public Meeting',
    registrationLimit: null, registrationCount: 450,
    title: T("Women's Leadership Forum"),
    description: T('<p>Past event — women leaders discuss political participation.</p>'),
  },
]

export const mockLeadership = [
  {
    id: 1, slug: 'party-leader', positionKey: 'leader', positionOrder: 1,
    image: '/images/placeholder-leader.svg', district: 'Colombo',
    email: '', phone: '', facebook: '', twitter: '', instagram: '', youtube: '',
    name: T('Party Leader Name'),
    position: T('Party Leader'),
    bio: T('Veteran politician with decades of public service dedicated to national unity and development.'),
  },
  {
    id: 2, slug: 'deputy-leader-1', positionKey: 'deputy', positionOrder: 2,
    image: '/images/placeholder-leader.svg', district: 'Kandy',
    email: '', phone: '', facebook: '', twitter: '', instagram: '', youtube: '',
    name: T('Deputy Leader Name'),
    position: T('Deputy Leader'),
    bio: T('Community organiser focused on grassroots development and youth empowerment.'),
  },
  {
    id: 3, slug: 'general-secretary', positionKey: 'general_secretary', positionOrder: 3,
    image: '/images/placeholder-leader.svg', district: 'Galle',
    email: '', phone: '', facebook: '', twitter: '', instagram: '', youtube: '',
    name: T('General Secretary Name'),
    position: T('General Secretary'),
    bio: T('Administrative head overseeing party operations and membership growth.'),
  },
]

export const mockPolicies = [
  {
    id: 1, slug: 'education-reform', categorySlug: 'education', category: 'Education',
    image: '/images/placeholder-policy.svg', isFeatured: true,
    title: T('Education for All'),
    summary: T('Free quality education from primary to tertiary level, with special focus on rural schools.'),
    content: T('<h3>Our Commitment</h3><p>Every child deserves access to quality education regardless of location or income.</p><ul><li>Expand rural school infrastructure</li><li>Improve teacher training and salaries</li><li>Free textbooks and uniforms</li></ul>'),
  },
  {
    id: 2, slug: 'economic-recovery-plan', categorySlug: 'economy', category: 'Economy',
    image: '/images/placeholder-policy.svg', isFeatured: true,
    title: T('Economic Recovery Plan'),
    summary: T('Job creation, SME support and fiscal reforms to rebuild the economy.'),
    content: T('<p>Detailed economic framework for job creation, SME support and fiscal reforms.</p>'),
  },
  {
    id: 3, slug: 'universal-healthcare', categorySlug: 'healthcare', category: 'Healthcare',
    image: '/images/placeholder-policy.svg', isFeatured: false,
    title: T('Universal Healthcare'),
    summary: T('Strengthen public hospitals and guarantee affordable medicine for all citizens.'),
    content: T('<p>Strengthen public hospitals and guarantee affordable medicine for all citizens.</p>'),
  },
  {
    id: 4, slug: 'agricultural-modernisation', categorySlug: 'agriculture', category: 'Agriculture',
    image: '/images/placeholder-policy.svg', isFeatured: false,
    title: T('Agricultural Modernisation'),
    summary: T('Support farmers with technology, irrigation and fair prices for crops.'),
    content: T('<p>Support farmers with technology, irrigation and fair prices for crops.</p>'),
  },
  {
    id: 5, slug: 'youth-employment-guarantee', categorySlug: 'employment', category: 'Employment',
    image: '/images/placeholder-policy.svg', isFeatured: true,
    title: T('Youth Employment Guarantee'),
    summary: T('A national internship and apprenticeship programme for first-time job seekers.'),
    content: T('<p>A national internship and apprenticeship programme for first-time job seekers.</p>'),
  },
]

export const mockPolicyCategories = [
  { slug: 'economy', icon: 'coins' }, { slug: 'education', icon: 'graduation-cap' },
  { slug: 'healthcare', icon: 'heart-pulse' }, { slug: 'agriculture', icon: 'wheat' },
  { slug: 'employment', icon: 'briefcase' }, { slug: 'infrastructure', icon: 'building-2' },
  { slug: 'environment', icon: 'leaf' }, { slug: 'youth-development', icon: 'users' },
  { slug: 'women-development', icon: 'user-check' }, { slug: 'social-welfare', icon: 'hand-heart' },
  { slug: 'national-development', icon: 'flag' }, { slug: 'tamil-community-rights', icon: 'scale' },
  { slug: 'language-rights', icon: 'languages' }, { slug: 'provincial-development', icon: 'map' },
]

export const mockManifesto = [
  {
    id: 1, title: T('2026 Election Manifesto'),
    description: T('Complete policy document'),
    fileUrl: '#', fileName: 'manifesto-2026.pdf', publishedAt: '2026-10-01',
  },
  {
    id: 2, title: T('Economic Policy Document'),
    description: T('Detailed economic framework'),
    fileUrl: '#', fileName: 'economic-policy.pdf', publishedAt: '2026-09-15',
  },
]

export const mockAlbums = [
  { id: 1, slug: 'national-conference-2026', title: T('National Conference 2026'), image: '/images/placeholder-album-1.svg', photoCount: 24 },
  { id: 2, slug: 'community-programmes', title: T('Community Programmes'), image: '/images/placeholder-album-2.svg', photoCount: 18 },
  { id: 3, slug: 'youth-events', title: T('Youth Events'), image: '/images/placeholder-album-3.svg', photoCount: 31 },
  { id: 4, slug: 'leadership-tours', title: T('Leadership Tours'), image: '/images/placeholder-album-4.svg', photoCount: 15 },
]

export const mockGalleryImages = [
  { id: 1, albumId: 1, image: '/images/placeholder-gallery-1.svg', caption: T('Conference opening') },
  { id: 2, albumId: 1, image: '/images/placeholder-gallery-2.svg', caption: T('Keynote address') },
  { id: 3, albumId: 1, image: '/images/placeholder-gallery-3.svg', caption: T('Delegate group photo') },
  { id: 4, albumId: 2, image: '/images/placeholder-gallery-4.svg', caption: T('Rural development visit') },
  { id: 5, albumId: 2, image: '/images/placeholder-gallery-5.svg', caption: T('School donation programme') },
  { id: 6, albumId: 3, image: '/images/placeholder-gallery-6.svg', caption: T('Youth sports day') },
  { id: 7, albumId: 4, image: '/images/placeholder-gallery-7.svg', caption: T('Provincial tour') },
  { id: 8, albumId: 4, image: '/images/placeholder-gallery-8.svg', caption: T('Meeting with local leaders') },
]

export const mockVideos = [
  {
    id: 1, youtubeId: 'dQw4w9WgXcQ',
    title: T('Party Launches New Programme'),
    description: T('Watch the announcement'),
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    category: 'Announcements', isFeatured: true,
  },
  {
    id: 2, youtubeId: '9bZkp7q19f0',
    title: T('Youth Wing Promotional Video'),
    description: T('Join the movement'),
    thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',
    category: 'Promotional', isFeatured: false,
  },
  {
    id: 3, youtubeId: 'kJQP7kiw5Fk',
    title: T('Policy Explained: Education'),
    description: T('Our education reform plan'),
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    category: 'Policy', isFeatured: false,
  },
]

export const mockPages = {
  about: {
    slug: 'about',
    title: T('About Our Party'),
    content: T('<p>Our party was founded on the principles of equality, social justice and national development. We are a movement of ordinary citizens working together for a better Sri Lanka.</p>'),
  },
  history: {
    slug: 'history',
    title: T('Party History'),
    content: T('<p>Founded in the early years of Sri Lanka\'s modern democracy, our party has grown from a small group of idealists into a nationwide movement.</p><h3>Milestones</h3><ul><li>Foundation year — first branch opened</li><li>Expansion to all districts</li><li>Entry into parliament</li><li>National development programme launch</li></ul>'),
  },
  vision: {
    slug: 'vision-mission',
    title: T('Vision & Mission'),
    content: T('<h3>Vision</h3><p>A united, prosperous and equitable Sri Lanka where every community enjoys equal rights, opportunity and dignity.</p><h3>Mission</h3><p>To deliver honest governance, sustainable development and inclusive policies that improve the lives of all Sri Lankans.</p>'),
  },
  constitution: {
    slug: 'constitution',
    title: T('Party Constitution'),
    content: T('<p>The party constitution defines our structures, membership rules and democratic processes.</p>'),
  },
  privacy: {
    slug: 'privacy-policy',
    title: T('Privacy Policy'),
    content: T('<p>We respect your privacy. This policy explains how we collect, use and protect your personal information.</p><h3>Information We Collect</h3><p>We collect information you provide directly, such as when you register for membership, subscribe to our newsletter, or contact us.</p><h3>How We Use It</h3><p>Your information is used to respond to inquiries, process membership applications, send newsletters you have subscribed to, and improve our services.</p><h3>Data Protection</h3><p>We implement appropriate security measures to protect your personal information and do not sell your data to third parties.</p>'),
  },
  terms: {
    slug: 'terms-conditions',
    title: T('Terms & Conditions'),
    content: T('<p>By using this website, you agree to these terms and conditions.</p><h3>Use of Content</h3><p>All content on this website is owned by or licensed to the party and may not be reproduced without permission.</p><h3>Accuracy</h3><p>We strive to keep information accurate but do not guarantee completeness. Content may be updated without notice.</p>'),
  },
}

export const mockHeroBanner = {
  id: 0, isActive: true, sortOrder: 0,
  imageDesktop: '/images/placeholder-hero-banner.png',
  imageMobile: '/images/placeholder-hero-banner.png',
  logo: '/images/logo.svg',
  cta1Url: '/membership', cta2Url: '/manifesto',
  badge: T('A New Political Movement', 'නව දේශපාලන චලනයක්', 'புதிய அரசியல் இயக்கம்'),
  heading: T('A Better Future Starts With Us.', 'වඩා හොඳ අනාගතයක් අප සමඟ ආරම්භ වේ.', 'சிறந்த எதிர்காலம் நம்முடன் தொடங்குகிறது.'),
  headingHighlight: T('Better Future', 'වඩා හොඳ අනාගතයක්', 'சிறந்த எதிர்காலம்'),
  description: T('Equality, justice and dignity for every citizen — this is the vision our party is built on.',
    'සමානතාව, සාධාරණත්වය සහ සියලු වැසියන්ට ගෞරවය — අපේ පක්ෂයේ දැක්ම විස්තර කෙරේ.',
    'ஒவ்வொரு குடிமகனுக்கும் சமத்துவம், நீதி மற்றும் கண்ணியம் — இது எங்கள் கட்சி கட்டமைக்கப்பட்ட தத்துவம்.'),
  cta1Label: T('Join Our Movement', 'අපේ චලනයට එක්වෙන්න', 'எங்கள் இயக்கத்தில் சேருங்கள்'),
  cta2Label: T('Read Our Manifesto', 'අපේ ප්‍රකාශනය කියවන්න', 'எங்கள் அறிக்கை படிக்க'),
}

export const mockSettings = {
  contact: {
    email: 'info@example.com', phone: '+94 11 000 0000',
    address: T('Party Headquarters, Colombo'),
    facebook: '', twitter: '', instagram: '', youtube: '',
  },
  announcement: { enabled: true, text: T('Welcome to our official website. Join us in building a better Sri Lanka.') },
}

// Helper: pick a language value from a {en, si, ta} object
export function pickLang(obj, lang = 'en') {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[lang] || obj.en || Object.values(obj).find(Boolean) || ''
}
