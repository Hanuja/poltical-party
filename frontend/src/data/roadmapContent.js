// Future Roadmap — the single data module for the page.
//
// UI labels live in translations/{en,ta,si}.json under "roadmap.*".
// This file holds the CONTENT: milestones, 50-year scenes, categories and map projects.
//
// IMPORTANT — SAMPLE CONTENT: no approved roadmap or project data exists yet
// (backend/api has no roadmap/projects endpoint). Every record below is marked
// `sample: true` and the page labels it "Sample" wherever it is shown. Replace these
// records with approved, verified data (same shape) and set `sample: false`.
//
// Multilingual text uses { en, ta, si } objects; `pickText()` falls back to English.
// Photos: see data/roadmapPhotos.js (Wikimedia Commons, credited on the page).

import { PHOTOS } from './roadmapPhotos'

export const pickText = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.en ?? '') : (v ?? ''))
export const pickList = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] || v.en || []) : (v || []))
export const photo = (key) => PHOTOS.find((p) => p.key === key) || null

// ── Development categories (also used by milestones, scenes and map filters) ──
export const CATEGORIES = [
  { key: 'education', icon: 'GraduationCap', photo: 'library-jaffna',
    title: { en: 'Education', ta: 'கல்வி', si: 'අධ්‍යාපනය' },
    desc: { en: 'Good schools, libraries and skills for every child.', ta: 'ஒவ்வொரு பிள்ளைக்கும் நல்ல பாடசாலைகள், நூலகங்கள், திறன்கள்.', si: 'සෑම දරුවෙකුටම හොඳ පාසල්, පුස්තකාල සහ කුසලතා.' } },
  { key: 'healthcare', icon: 'HeartPulse', photo: null,
    title: { en: 'Healthcare', ta: 'சுகாதாரம்', si: 'සෞඛ්‍ය සේවා' },
    desc: { en: 'Hospitals and clinics close to every family.', ta: 'ஒவ்வொரு குடும்பத்துக்கும் அருகில் வைத்தியசாலைகளும் சிகிச்சை நிலையங்களும்.', si: 'සෑම පවුලකටම ළඟින් රෝහල් සහ සායන.' } },
  { key: 'infrastructure', icon: 'Construction', photo: 'expressway',
    title: { en: 'Infrastructure', ta: 'உட்கட்டமைப்பு', si: 'යටිතල පහසුකම්' },
    desc: { en: 'Roads, bridges, water and power that connect us.', ta: 'நம்மை இணைக்கும் வீதிகள், பாலங்கள், நீர், மின்சாரம்.', si: 'අප සම්බන්ධ කරන මාර්ග, පාලම්, ජලය සහ විදුලිය.' } },
  { key: 'economy', icon: 'Landmark', photo: 'harbour-trincomalee',
    title: { en: 'Economy', ta: 'பொருளாதாரம்', si: 'ආර්ථිකය' },
    desc: { en: 'Trade, ports and businesses that create wealth.', ta: 'செல்வத்தை உருவாக்கும் வர்த்தகம், துறைமுகங்கள், வணிகங்கள்.', si: 'ධනය උත්පාදනය කරන වෙළඳාම, වරාය සහ ව්‍යාපාර.' } },
  { key: 'agriculture', icon: 'Wheat', photo: 'paddy-ampara',
    title: { en: 'Agriculture', ta: 'விவசாயம்', si: 'කෘෂිකර්මය' },
    desc: { en: 'Better harvests, water and fair prices for farmers.', ta: 'விவசாயிகளுக்குச் சிறந்த அறுவடை, நீர், நியாய விலை.', si: 'ගොවීන්ට වඩා හොඳ අස්වැන්න, ජලය සහ සාධාරණ මිල.' } },
  { key: 'technology', icon: 'Cpu', photo: 'lotus-tower',
    title: { en: 'Technology', ta: 'தொழில்நுட்பம்', si: 'තාක්ෂණය' },
    desc: { en: 'Internet, digital services and new ideas.', ta: 'இணையம், டிஜிட்டல் சேவைகள், புதிய சிந்தனைகள்.', si: 'අන්තර්ජාලය, ඩිජිටල් සේවා සහ නව අදහස්.' } },
  { key: 'employment', icon: 'BriefcaseBusiness', photo: 'palmyra-shop',
    title: { en: 'Employment', ta: 'வேலைவாய்ப்பு', si: 'රැකියා' },
    desc: { en: 'Skills and good jobs close to home.', ta: 'சொந்த ஊருக்கு அருகில் திறன்களும் நல்ல வேலைகளும்.', si: 'නිවසට ළඟින් කුසලතා සහ හොඳ රැකියා.' } },
  { key: 'environment', icon: 'Trees', photo: 'mangrove',
    title: { en: 'Environment', ta: 'சுற்றுச்சூழல்', si: 'පරිසරය' },
    desc: { en: 'Forests, lagoons and coasts protected for the future.', ta: 'எதிர்காலத்துக்காகப் பாதுகாக்கப்படும் காடுகள், களப்புகள், கரையோரங்கள்.', si: 'අනාගතය සඳහා ආරක්ෂා කළ වනාන්තර, කලපු සහ වෙරළ.' } },
  { key: 'transportation', icon: 'TrainFront', photo: 'train-northern-line',
    title: { en: 'Transportation', ta: 'போக்குவரத்து', si: 'ප්‍රවාහනය' },
    desc: { en: 'Trains, buses and safe travel for everyone.', ta: 'அனைவருக்கும் புகையிரதங்கள், பேருந்துகள், பாதுகாப்பான பயணம்.', si: 'සැමට දුම්රිය, බස් සහ ආරක්ෂිත ගමන්.' } },
  { key: 'rural', icon: 'House', photo: 'village-alaveddi',
    title: { en: 'Rural Development', ta: 'கிராமிய அபிவிருத்தி', si: 'ග්‍රාමීය සංවර්ධනය' },
    desc: { en: 'Thriving villages with services and opportunity.', ta: 'சேவைகளும் வாய்ப்புகளும் நிறைந்த செழிப்பான கிராமங்கள்.', si: 'සේවා සහ අවස්ථා සහිත සශ්‍රීක ගම්.' } },
]
export const category = (key) => CATEGORIES.find((c) => c.key === key)

// ── Seven milestones (SAMPLE plan content) ──────────────────────────────────
export const MILESTONES = [
  {
    key: 'y1', years: 1, photo: 'village-alaveddi', shape: 'arch', sample: true,
    categories: ['rural', 'infrastructure', 'healthcare'],
    title: { en: '1-Year Plan', ta: '1-ஆண்டு திட்டம்', si: 'වසර 1 සැලැස්ම' },
    tagline: { en: 'Immediate Actions', ta: 'உடனடி நடவடிக்கைகள்', si: 'ක්ෂණික ක්‍රියාමාර්ග' },
    intro: { en: 'The first year is about listening to people and fixing the problems they face every day.', ta: 'முதல் ஆண்டு மக்களின் குரலைக் கேட்டு, அவர்கள் நாள்தோறும் எதிர்கொள்ளும் பிரச்சினைகளைத் தீர்ப்பதற்கானது.', si: 'පළමු වසර ජනතාවට සවන් දී, ඔවුන් දිනපතා මුහුණ දෙන ගැටලු විසඳීම සඳහා ය.' },
    objectives: { en: ['Meet communities in every district', 'Solve urgent local problems quickly', 'Make public services easier to reach'], ta: ['ஒவ்வொரு மாவட்டத்திலும் சமூகங்களைச் சந்தித்தல்', 'அவசர உள்ளூர்ப் பிரச்சினைகளை விரைவாகத் தீர்த்தல்', 'பொதுச் சேவைகளை எளிதில் அணுகக்கூடியதாக்குதல்'], si: ['සෑම දිස්ත්‍රික්කයකම ප්‍රජාවන් හමුවීම', 'හදිසි ප්‍රාදේශීය ගැටලු ඉක්මනින් විසඳීම', 'රාජ්‍ය සේවා වෙත ළඟා වීම පහසු කිරීම'] },
    activities: { en: ['Public listening meetings', 'Repairs to damaged roads, wells and drains', 'Help desks for documents and services'], ta: ['மக்கள் கருத்துக் கேட்புக் கூட்டங்கள்', 'சேதமடைந்த வீதிகள், கிணறுகள், வடிகால்களைச் சீரமைத்தல்', 'ஆவணங்கள், சேவைகளுக்கான உதவி மையங்கள்'], si: ['මහජන අදහස් විමසීමේ රැස්වීම්', 'හානි වූ මාර්ග, ළිං සහ කාණු අලුත්වැඩියා කිරීම', 'ලේඛන සහ සේවා සඳහා උපකාරක මධ්‍යස්ථාන'] },
    benefits: { en: ['Faster help when it is needed', 'Safer streets and cleaner water', 'Less time spent travelling for services'], ta: ['தேவைப்படும்போது விரைவான உதவி', 'பாதுகாப்பான வீதிகள், சுத்தமான நீர்', 'சேவைகளுக்காகப் பயணிக்கும் நேரம் குறைவு'], si: ['අවශ්‍ය විට ඉක්මන් සහාය', 'ආරක්ෂිත මාර්ග සහ පිරිසිදු ජලය', 'සේවා සඳහා ගමන් කරන කාලය අඩු වීම'] },
    timeline: { en: ['Months 1–3: listen and set priorities', 'Months 4–9: start urgent repairs', 'Months 10–12: report back to the people'], ta: ['1–3 மாதங்கள்: கருத்துக் கேட்டு முன்னுரிமைகளை நிர்ணயித்தல்', '4–9 மாதங்கள்: அவசரச் சீரமைப்புகளைத் தொடங்குதல்', '10–12 மாதங்கள்: மக்களுக்கு அறிக்கையிடுதல்'], si: ['මාස 1–3: අදහස් විමසා ප්‍රමුඛතා තීරණය කිරීම', 'මාස 4–9: හදිසි අලුත්වැඩියා ආරම්භ කිරීම', 'මාස 10–12: ජනතාවට වාර්තා කිරීම'] },
  },
  {
    key: 'y2', years: 2, photo: 'palmyra-shop', shape: 'circle', sample: true,
    categories: ['employment', 'economy', 'education'],
    title: { en: '2-Year Plan', ta: '2-ஆண்டு திட்டம்', si: 'වසර 2 සැලැස්ම' },
    tagline: { en: 'Strengthening Communities', ta: 'சமூகங்களை வலுப்படுத்துதல்', si: 'ප්‍රජාවන් ශක්තිමත් කිරීම' },
    intro: { en: 'The second year builds strong, connected communities that can grow on their own.', ta: 'இரண்டாம் ஆண்டு, தாமாகவே வளரக்கூடிய வலுவான, இணைந்த சமூகங்களைக் கட்டியெழுப்புகிறது.', si: 'දෙවන වසර තනිවම වර්ධනය විය හැකි ශක්තිමත්, එකිනෙක සම්බන්ධ ප්‍රජාවන් ගොඩනගයි.' },
    objectives: { en: ['Support local groups and co-operatives', 'Create skills training for young people', 'Help women start small businesses'], ta: ['உள்ளூர்க் குழுக்களுக்கும் கூட்டுறவுகளுக்கும் ஆதரவு', 'இளைஞர்களுக்குத் திறன் பயிற்சி', 'பெண்கள் சிறு தொழில்கள் தொடங்க உதவி'], si: ['ප්‍රාදේශීය කණ්ඩායම් සහ සමුපකාරවලට සහාය', 'තරුණයින්ට කුසලතා පුහුණුව', 'කාන්තාවන්ට කුඩා ව්‍යාපාර ආරම්භ කිරීමට උදව්'] },
    activities: { en: ['Community centres as meeting places', 'Training courses in trades and digital skills', 'Small grants and market links for local products'], ta: ['சந்திப்பு இடங்களாகச் சமூக நிலையங்கள்', 'தொழில், டிஜிட்டல் திறன் பயிற்சி நெறிகள்', 'உள்ளூர் உற்பத்திகளுக்குச் சிறு நிதியுதவியும் சந்தை இணைப்பும்'], si: ['රැස්වීම් ස්ථාන ලෙස ප්‍රජා මධ්‍යස්ථාන', 'වෘත්තීය සහ ඩිජිටල් කුසලතා පාඨමාලා', 'ප්‍රාදේශීය නිෂ්පාදන සඳහා කුඩා ප්‍රදාන සහ වෙළඳපොළ සම්බන්ධතා'] },
    benefits: { en: ['More local jobs', 'Young people can stay close to home', 'Families earn a steadier income'], ta: ['அதிக உள்ளூர் வேலைவாய்ப்புகள்', 'இளைஞர்கள் சொந்த ஊரிலேயே வாழ முடிதல்', 'குடும்பங்களுக்கு நிலையான வருமானம்'], si: ['වැඩි ප්‍රාදේශීය රැකියා', 'තරුණයින්ට නිවසට ළඟින් රැඳී සිටිය හැකි වීම', 'පවුල්වලට වඩා ස්ථාවර ආදායමක්'] },
    timeline: { en: ['First half: open community centres', 'Second half: launch training programmes', 'End of year 2: review results with communities'], ta: ['முதல் அரையாண்டு: சமூக நிலையங்களைத் திறத்தல்', 'இரண்டாம் அரையாண்டு: பயிற்சித் திட்டங்களைத் தொடங்குதல்', '2ஆம் ஆண்டு இறுதி: சமூகங்களுடன் முடிவுகளை மீளாய்வு செய்தல்'], si: ['පළමු භාගය: ප්‍රජා මධ්‍යස්ථාන විවෘත කිරීම', 'දෙවන භාගය: පුහුණු වැඩසටහන් ආරම්භ කිරීම', '2 වන වසර අවසානය: ප්‍රජාවන් සමඟ ප්‍රතිඵල සමාලෝචනය'] },
  },
  {
    key: 'y3', years: 3, photo: 'paddy-ampara', shape: 'wide', sample: true,
    categories: ['agriculture', 'economy', 'education'],
    title: { en: '3-Year Plan', ta: '3-ஆண்டு திட்டம்', si: 'වසර 3 සැලැස්ම' },
    tagline: { en: 'Accelerating Development', ta: 'அபிவிருத்தியை விரைவுபடுத்துதல்', si: 'සංවර්ධනය වේගවත් කිරීම' },
    intro: { en: 'By year three, development moves faster in farming, fishing and local industry.', ta: 'மூன்றாம் ஆண்டில் விவசாயம், கடற்றொழில், உள்ளூர்க் கைத்தொழில் ஆகியவற்றில் அபிவிருத்தி வேகமடைகிறது.', si: 'තුන්වන වසර වන විට ගොවිතැන, ධීවර සහ ප්‍රාදේශීය කර්මාන්තවල සංවර්ධනය වේගවත් වේ.' },
    objectives: { en: ['Help farmers and fishers earn more', 'Bring new investment to the regions', 'Improve schools and learning'], ta: ['விவசாயிகளும் மீனவர்களும் அதிகம் சம்பாதிக்க உதவுதல்', 'பிராந்தியங்களுக்குப் புதிய முதலீடுகளைக் கொண்டுவருதல்', 'பாடசாலைகளையும் கற்றலையும் மேம்படுத்துதல்'], si: ['ගොවීන්ට සහ ධීවරයින්ට වැඩි ආදායමක් ලැබීමට උදව් කිරීම', 'කලාපවලට නව ආයෝජන ගෙන ඒම', 'පාසල් සහ ඉගෙනීම වැඩිදියුණු කිරීම'] },
    activities: { en: ['Repair irrigation tanks and canals', 'Storage and processing for crops and fish', 'New classrooms and learning materials'], ta: ['நீர்ப்பாசனக் குளங்களையும் கால்வாய்களையும் புனரமைத்தல்', 'பயிர்கள், மீன்களுக்கான களஞ்சிய, பதனிடும் வசதிகள்', 'புதிய வகுப்பறைகளும் கற்றல் உபகரணங்களும்'], si: ['වාරි වැව් සහ ඇළ මාර්ග ප්‍රතිසංස්කරණය', 'බෝග සහ මාළු සඳහා ගබඩා සහ සැකසුම් පහසුකම්', 'නව පන්ති කාමර සහ ඉගෙනුම් උපකරණ'] },
    benefits: { en: ['Better harvests and fair prices', 'New jobs in local industries', 'Children learn in better schools'], ta: ['சிறந்த அறுவடையும் நியாயமான விலையும்', 'உள்ளூர்க் கைத்தொழில்களில் புதிய வேலைகள்', 'சிறந்த பாடசாலைகளில் பிள்ளைகளின் கல்வி'], si: ['වඩා හොඳ අස්වැන්න සහ සාධාරණ මිල', 'ප්‍රාදේශීය කර්මාන්තවල නව රැකියා', 'වඩා හොඳ පාසල්වල දරුවන්ගේ ඉගෙනීම'] },
    timeline: { en: ['Early in year 3: choose priority projects', 'Mid year 3: start building', 'End of year 3: share progress openly'], ta: ['3ஆம் ஆண்டு தொடக்கம்: முன்னுரிமைத் திட்டங்களைத் தெரிவு செய்தல்', '3ஆம் ஆண்டு நடுப்பகுதி: நிர்மாணத்தைத் தொடங்குதல்', '3ஆம் ஆண்டு இறுதி: முன்னேற்றத்தை வெளிப்படையாகப் பகிர்தல்'], si: ['3 වන වසර මුල: ප්‍රමුඛ ව්‍යාපෘති තෝරා ගැනීම', '3 වන වසර මැද: ඉදිකිරීම් ආරම්භ කිරීම', '3 වන වසර අවසානය: ප්‍රගතිය විවෘතව බෙදා ගැනීම'] },
  },
  {
    key: 'y5', years: 5, photo: 'expressway', shape: 'tall', sample: true,
    categories: ['infrastructure', 'transportation', 'environment'],
    title: { en: '5-Year Plan', ta: '5-ஆண்டு திட்டம்', si: 'වසර 5 සැලැස්ම' },
    tagline: { en: 'Building Infrastructure', ta: 'உட்கட்டமைப்பைக் கட்டியெழுப்புதல்', si: 'යටිතල පහසුකම් ගොඩනැගීම' },
    intro: { en: 'Five years is the time to build the roads, bridges, water and power that connect every village.', ta: 'ஒவ்வொரு கிராமத்தையும் இணைக்கும் வீதிகள், பாலங்கள், நீர், மின்சாரம் ஆகியவற்றைக் கட்டியெழுப்பும் காலம் ஐந்து ஆண்டுகள்.', si: 'සෑම ගමක්ම සම්බන්ධ කරන මාර්ග, පාලම්, ජලය සහ විදුලිය ගොඩනැගීමට කාලය වසර පහකි.' },
    objectives: { en: ['Connect villages with good roads', 'Bring clean water to more homes', 'Provide reliable electricity'], ta: ['நல்ல வீதிகளால் கிராமங்களை இணைத்தல்', 'மேலும் பல வீடுகளுக்குச் சுத்தமான நீர்', 'நம்பகமான மின்சார வழங்கல்'], si: ['හොඳ මාර්ගවලින් ගම් සම්බන්ධ කිරීම', 'තවත් නිවෙස්වලට පිරිසිදු ජලය', 'විශ්වාසදායක විදුලි සැපයුම'] },
    activities: { en: ['Build and repair main and rural roads', 'Water supply schemes for towns and villages', 'Renewable energy such as solar and wind'], ta: ['பிரதான, கிராமிய வீதிகளை அமைத்தலும் சீரமைத்தலும்', 'நகரங்கள், கிராமங்களுக்கான நீர் வழங்கல் திட்டங்கள்', 'சூரிய, காற்று போன்ற புதுப்பிக்கத்தக்க சக்தி'], si: ['ප්‍රධාන සහ ග්‍රාමීය මාර්ග ඉදිකිරීම සහ අලුත්වැඩියාව', 'නගර සහ ගම් සඳහා ජල සැපයුම් යෝජනා ක්‍රම', 'සූර්ය සහ සුළං වැනි පුනර්ජනනීය බලශක්තිය'] },
    benefits: { en: ['Shorter, safer journeys', 'Healthier families', 'Power for homes, schools and businesses'], ta: ['குறுகிய, பாதுகாப்பான பயணங்கள்', 'ஆரோக்கியமான குடும்பங்கள்', 'வீடுகள், பாடசாலைகள், வணிகங்களுக்கு மின்சாரம்'], si: ['කෙටි, ආරක්ෂිත ගමන්', 'සෞඛ්‍ය සම්පන්න පවුල්', 'නිවෙස්, පාසල් සහ ව්‍යාපාර සඳහා විදුලිය'] },
    timeline: { en: ['Years 1–2: plan and design', 'Years 2–4: build in stages', 'Year 5: complete and maintain'], ta: ['1–2 ஆண்டுகள்: திட்டமிடலும் வடிவமைப்பும்', '2–4 ஆண்டுகள்: கட்டம் கட்டமாக நிர்மாணம்', '5ஆம் ஆண்டு: நிறைவு செய்தலும் பராமரித்தலும்'], si: ['වසර 1–2: සැලසුම් කිරීම සහ නිර්මාණය', 'වසර 2–4: අදියර වශයෙන් ඉදිකිරීම', '5 වන වසර: සම්පූර්ණ කිරීම සහ නඩත්තුව'] },
  },
  {
    key: 'y10', years: 10, photo: 'harbour-trincomalee', shape: 'arch', sample: true,
    categories: ['economy', 'technology', 'healthcare'],
    title: { en: '10-Year Plan', ta: '10-ஆண்டு திட்டம்', si: 'වසර 10 සැලැස්ම' },
    tagline: { en: 'Long-Term Development', ta: 'நீண்டகால அபிவிருத்தி', si: 'දිගුකාලීන සංවර්ධනය' },
    intro: { en: 'Over ten years, the region grows into a strong economy with ports, industry and good jobs.', ta: 'பத்து ஆண்டுகளில், துறைமுகங்கள், கைத்தொழில்கள், நல்ல வேலைவாய்ப்புகளுடன் பிராந்தியம் வலுவான பொருளாதாரமாக வளர்கிறது.', si: 'වසර දහයක් තුළ, වරාය, කර්මාන්ත සහ හොඳ රැකියා සමඟ කලාපය ශක්තිමත් ආර්ථිකයක් බවට වර්ධනය වේ.' },
    objectives: { en: ['Grow trade through ports and markets', 'Build modern hospitals and universities', 'Create good jobs for the next generation'], ta: ['துறைமுகங்கள், சந்தைகள் மூலம் வர்த்தகத்தை வளர்த்தல்', 'நவீன வைத்தியசாலைகளையும் பல்கலைக்கழகங்களையும் கட்டியெழுப்புதல்', 'அடுத்த தலைமுறைக்கு நல்ல வேலைவாய்ப்புகள்'], si: ['වරාය සහ වෙළඳපොළ හරහා වෙළඳාම වර්ධනය', 'නවීන රෝහල් සහ විශ්වවිද්‍යාල ගොඩනැගීම', 'ඊළඟ පරම්පරාවට හොඳ රැකියා'] },
    activities: { en: ['Upgrade harbours and transport links', 'Industrial and technology zones', 'Expand higher education and research'], ta: ['துறைமுகங்களையும் போக்குவரத்து இணைப்புகளையும் தரமுயர்த்தல்', 'கைத்தொழில், தொழில்நுட்ப வலயங்கள்', 'உயர்கல்வியையும் ஆராய்ச்சியையும் விரிவாக்குதல்'], si: ['වරාය සහ ප්‍රවාහන සම්බන්ධතා උසස් කිරීම', 'කාර්මික සහ තාක්ෂණ කලාප', 'උසස් අධ්‍යාපනය සහ පර්යේෂණ පුළුල් කිරීම'] },
    benefits: { en: ['A stronger local economy', 'Quality care and education nearby', 'Fewer people forced to leave for work'], ta: ['வலுவான உள்ளூர்ப் பொருளாதாரம்', 'அருகிலேயே தரமான பராமரிப்பும் கல்வியும்', 'வேலைக்காக இடம்பெயர வேண்டிய நிலை குறைதல்'], si: ['ශක්තිමත් ප්‍රාදේශීය ආර්ථිකයක්', 'ළඟින්ම ගුණාත්මක සත්කාර සහ අධ්‍යාපනය', 'රැකියා සඳහා පිටව යාමට සිදුවන අය අඩු වීම'] },
    timeline: { en: ['Years 1–3: plans and partnerships', 'Years 4–7: major construction', 'Years 8–10: full operation'], ta: ['1–3 ஆண்டுகள்: திட்டங்களும் கூட்டுறவுகளும்', '4–7 ஆண்டுகள்: பாரிய நிர்மாணம்', '8–10 ஆண்டுகள்: முழுமையான செயற்பாடு'], si: ['වසර 1–3: සැලසුම් සහ හවුල්කාරිත්ව', 'වසර 4–7: ප්‍රධාන ඉදිකිරීම්', 'වසර 8–10: පූර්ණ ක්‍රියාකාරිත්වය'] },
  },
  {
    key: 'y15', years: 15, photo: 'mangrove', shape: 'circle', sample: true,
    categories: ['environment', 'agriculture', 'rural'],
    title: { en: '15-Year Plan', ta: '15-ஆண்டு திட்டம்', si: 'වසර 15 සැලැස්ම' },
    tagline: { en: 'Sustainable Future', ta: 'நிலைபேறான எதிர்காலம்', si: 'තිරසාර අනාගතය' },
    intro: { en: 'By fifteen years, growth is balanced with care for land, sea and climate.', ta: 'பதினைந்து ஆண்டுகளில், வளர்ச்சி நிலம், கடல், காலநிலை ஆகியவற்றின் மீதான அக்கறையுடன் சமநிலைப்படுத்தப்படுகிறது.', si: 'වසර පහළොව වන විට, වර්ධනය ගොඩබිම, මුහුද සහ දේශගුණය කෙරෙහි සැලකිල්ල සමඟ සමතුලිත වේ.' },
    objectives: { en: ['Protect forests, lagoons and coasts', 'Use clean, renewable energy', 'Prepare for floods and droughts'], ta: ['காடுகள், களப்புகள், கரையோரங்களைப் பாதுகாத்தல்', 'சுத்தமான, புதுப்பிக்கத்தக்க சக்தியைப் பயன்படுத்துதல்', 'வெள்ளம், வறட்சிக்கு முன்னாயத்தம்'], si: ['වනාන්තර, කලපු සහ වෙරළ ආරක්ෂා කිරීම', 'පිරිසිදු, පුනර්ජනනීය බලශක්තිය භාවිතය', 'ගංවතුර සහ නියඟ සඳහා සූදානම'] },
    activities: { en: ['Replant mangroves and trees', 'Solar and wind power for communities', 'Better water storage and early warning'], ta: ['கண்டல் தாவரங்களையும் மரங்களையும் மீள நடுதல்', 'சமூகங்களுக்குச் சூரிய, காற்றுச் சக்தி', 'சிறந்த நீர்ச் சேமிப்பும் முன்னெச்சரிக்கையும்'], si: ['කඩොලාන සහ ගස් නැවත සිටුවීම', 'ප්‍රජාවන් සඳහා සූර්ය සහ සුළං බලය', 'වඩා හොඳ ජල ගබඩාව සහ පූර්ව අනතුරු ඇඟවීම'] },
    benefits: { en: ['Cleaner air and water', 'Lower energy costs', 'Safer homes in bad weather'], ta: ['சுத்தமான காற்றும் நீரும்', 'குறைந்த சக்திச் செலவு', 'மோசமான காலநிலையிலும் பாதுகாப்பான வீடுகள்'], si: ['පිරිසිදු වාතය සහ ජලය', 'අඩු බලශක්ති වියදම', 'අයහපත් කාලගුණයේදී ආරක්ෂිත නිවෙස්'] },
    timeline: { en: ['Years 1–5: protect what we have', 'Years 6–10: switch to clean energy', 'Years 11–15: a climate-ready region'], ta: ['1–5 ஆண்டுகள்: இருப்பதைப் பாதுகாத்தல்', '6–10 ஆண்டுகள்: சுத்தமான சக்திக்கு மாறுதல்', '11–15 ஆண்டுகள்: காலநிலைக்குத் தயாரான பிராந்தியம்'], si: ['වසර 1–5: ඇති දේ ආරක්ෂා කිරීම', 'වසර 6–10: පිරිසිදු බලශක්තියට මාරු වීම', 'වසර 11–15: දේශගුණයට සූදානම් කලාපයක්'] },
  },
  {
    key: 'y50', years: 50, photo: 'colombo-skyline', shape: 'wide', sample: true, vision: true,
    categories: ['technology', 'transportation', 'education'],
    title: { en: '50-Year Vision', ta: '50-ஆண்டு தொலைநோக்கு', si: 'වසර 50 දැක්ම' },
    tagline: { en: 'Future Generations', ta: 'எதிர்காலத் தலைமுறைகள்', si: 'අනාගත පරම්පරා' },
    intro: { en: 'The fifty-year vision is the future we want to hand to our children and grandchildren.', ta: 'ஐம்பது ஆண்டுத் தொலைநோக்கு, நம் பிள்ளைகளுக்கும் பேரப்பிள்ளைகளுக்கும் நாம் கையளிக்க விரும்பும் எதிர்காலம்.', si: 'වසර පනහේ දැක්ම අපගේ දරුවන්ට සහ මුනුබුරු මිනිබිරියන්ට භාර දීමට අප කැමති අනාගතයයි.' },
    objectives: { en: ['Equal opportunity for every child', 'A green, modern and connected region', 'Peace, dignity and prosperity for all'], ta: ['ஒவ்வொரு பிள்ளைக்கும் சம வாய்ப்பு', 'பசுமையான, நவீன, இணைக்கப்பட்ட பிராந்தியம்', 'அனைவருக்கும் அமைதி, கண்ணியம், செழிப்பு'], si: ['සෑම දරුවෙකුටම සමාන අවස්ථා', 'හරිත, නවීන සහ සම්බන්ධිත කලාපයක්', 'සැමට සාමය, ගෞරවය සහ සමෘද්ධිය'] },
    activities: { en: ['Smart, green towns and cities', 'Modern transport across the island', 'World-class education and healthcare'], ta: ['திறன்மிகு, பசுமை நகரங்கள்', 'தீவு முழுவதும் நவீன போக்குவரத்து', 'உலகத் தரக் கல்வியும் சுகாதாரமும்'], si: ['ස්මාර්ට්, හරිත නගර', 'දිවයින පුරා නවීන ප්‍රවාහනය', 'ලෝක මට්ටමේ අධ්‍යාපනය සහ සෞඛ්‍ය සේවා'] },
    benefits: { en: ['Children grow up with hope', 'A healthy environment for generations', 'A fair society where everyone belongs'], ta: ['நம்பிக்கையுடன் வளரும் பிள்ளைகள்', 'தலைமுறைகளுக்கு ஆரோக்கியமான சூழல்', 'அனைவரும் இணைந்த நீதியான சமூகம்'], si: ['බලාපොරොත්තුවෙන් වැඩෙන දරුවන්', 'පරම්පරා සඳහා සෞඛ්‍ය සම්පන්න පරිසරයක්', 'සැමට අයිතියක් ඇති සාධාරණ සමාජයක්'] },
    timeline: { en: ['Decade 1: strong foundations', 'Decades 2–3: growth and innovation', 'Decades 4–5: a society that lasts'], ta: ['முதல் தசாப்தம்: வலுவான அடித்தளங்கள்', '2–3 தசாப்தங்கள்: வளர்ச்சியும் புத்தாக்கமும்', '4–5 தசாப்தங்கள்: நிலைத்திருக்கும் சமூகம்'], si: ['පළමු දශකය: ශක්තිමත් පදනම්', 'දශක 2–3: වර්ධනය සහ නවෝත්පාදනය', 'දශක 4–5: කල් පවතින සමාජයක්'] },
  },
]

// ── 50-year vision scenes ───────────────────────────────────────────────────
export const VISION_SCENES = [
  { key: 'smartCity', photo: 'colombo-skyline', icon: 'Building2',
    title: { en: 'Smart, Green Cities', ta: 'திறன்மிகு பசுமை நகரங்கள்', si: 'ස්මාර්ට්, හරිත නගර' },
    line: { en: 'Cities that are clean, connected and full of opportunity.', ta: 'சுத்தமான, இணைக்கப்பட்ட, வாய்ப்புகள் நிறைந்த நகரங்கள்.', si: 'පිරිසිදු, සම්බන්ධිත සහ අවස්ථාවලින් පිරි නගර.' } },
  { key: 'green', photo: 'tea-haputale', icon: 'Trees',
    title: { en: 'Green Landscapes', ta: 'பசுமை நிலப்பரப்புகள்', si: 'හරිත භූ දර්ශන' },
    line: { en: 'Fields, forests and hills cared for by every generation.', ta: 'ஒவ்வொரு தலைமுறையும் பேணும் வயல்கள், காடுகள், மலைகள்.', si: 'සෑම පරම්පරාවක්ම රැකබලා ගන්නා කෙත්, වනාන්තර සහ කඳු.' } },
  { key: 'transport', photo: 'train-northern-line', icon: 'TrainFront',
    title: { en: 'Modern Transportation', ta: 'நவீன போக்குவரத்து', si: 'නවීන ප්‍රවාහනය' },
    line: { en: 'Fast, safe travel linking the north, the east and the whole island.', ta: 'வடக்கு, கிழக்கு, முழுத் தீவையும் இணைக்கும் விரைவான, பாதுகாப்பான பயணம்.', si: 'උතුර, නැගෙනහිර සහ මුළු දිවයිනම සම්බන්ධ කරන වේගවත්, ආරක්ෂිත ගමන්.' } },
  { key: 'education', photo: 'library-jaffna', icon: 'BookOpen',
    title: { en: 'Advanced Education', ta: 'மேம்பட்ட கல்வி', si: 'උසස් අධ්‍යාපනය' },
    line: { en: 'Libraries, universities and research that open every door.', ta: 'எல்லாக் கதவுகளையும் திறக்கும் நூலகங்கள், பல்கலைக்கழகங்கள், ஆராய்ச்சி.', si: 'සෑම දොරක්ම විවෘත කරන පුස්තකාල, විශ්වවිද්‍යාල සහ පර්යේෂණ.' } },
  { key: 'healthcare', photo: null, icon: 'HeartPulse',
    title: { en: 'Healthcare for All', ta: 'அனைவருக்கும் சுகாதாரம்', si: 'සැමට සෞඛ්‍ය සේවා' },
    line: { en: 'Modern care, from the first breath to old age.', ta: 'முதல் மூச்சிலிருந்து முதுமை வரை நவீன பராமரிப்பு.', si: 'පළමු හුස්මේ සිට මහලු විය දක්වා නවීන සත්කාර.' } },
  { key: 'communities', photo: 'solar-kurivisuttakulam', icon: 'Sun',
    title: { en: 'Sustainable Communities', ta: 'நிலைபேறான சமூகங்கள்', si: 'තිරසාර ප්‍රජාවන්' },
    line: { en: 'Villages powered by clean energy and local enterprise.', ta: 'சுத்தமான சக்தியும் உள்ளூர்த் தொழில்முயற்சியும் இயக்கும் கிராமங்கள்.', si: 'පිරිසිදු බලශක්තිය සහ ප්‍රාදේශීය ව්‍යවසාය මගින් බලගැන්වූ ගම්.' } },
  { key: 'infrastructure', photo: 'expressway', icon: 'Construction',
    title: { en: 'Modern Infrastructure', ta: 'நவீன உட்கட்டமைப்பு', si: 'නවීන යටිතල පහසුකම්' },
    line: { en: 'Bridges, ports and networks built to last a century.', ta: 'ஒரு நூற்றாண்டு நிலைக்கும் வகையில் கட்டப்பட்ட பாலங்கள், துறைமுகங்கள், வலையமைப்புகள்.', si: 'සියවසක් පවතින ලෙස ඉදි කළ පාලම්, වරාය සහ ජාල.' } },
]

// ── Map: provinces / districts (keys match public/data/sri-lanka-boundaries.json) ──
export const PROVINCE_NAMES = {
  northern: { en: 'Northern Province', ta: 'வடக்கு மாகாணம்', si: 'උතුරු පළාත' },
  eastern: { en: 'Eastern Province', ta: 'கிழக்கு மாகாணம்', si: 'නැගෙනහිර පළාත' },
  central: { en: 'Central Province', ta: 'மத்திய மாகாணம்', si: 'මධ්‍යම පළාත' },
  'north-central': { en: 'North Central Province', ta: 'வட மத்திய மாகாணம்', si: 'උතුරු මැද පළාත' },
  'north-western': { en: 'North Western Province', ta: 'வடமேல் மாகாணம்', si: 'වයඹ පළාත' },
  sabaragamuwa: { en: 'Sabaragamuwa Province', ta: 'சப்ரகமுவ மாகாணம்', si: 'සබරගමුව පළාත' },
  southern: { en: 'Southern Province', ta: 'தென் மாகாணம்', si: 'දකුණු පළාත' },
  uva: { en: 'Uva Province', ta: 'ஊவா மாகாணம்', si: 'ඌව පළාත' },
  western: { en: 'Western Province', ta: 'மேல் மாகாணம்', si: 'බස්නාහිර පළාත' },
}
export const DISTRICT_NAMES = {
  jaffna: { en: 'Jaffna', ta: 'யாழ்ப்பாணம்', si: 'යාපනය' },
  kilinochchi: { en: 'Kilinochchi', ta: 'கிளிநொச்சி', si: 'කිලිනොච්චිය' },
  mannar: { en: 'Mannar', ta: 'மன்னார்', si: 'මන්නාරම' },
  mullaitivu: { en: 'Mullaitivu', ta: 'முல்லைத்தீவு', si: 'මුලතිව්' },
  vavuniya: { en: 'Vavuniya', ta: 'வவுனியா', si: 'වවුනියාව' },
  trincomalee: { en: 'Trincomalee', ta: 'திருகோணமலை', si: 'ත්‍රිකුණාමලය' },
  batticaloa: { en: 'Batticaloa', ta: 'மட்டக்களப்பு', si: 'මඩකලපුව' },
  ampara: { en: 'Ampara', ta: 'அம்பாறை', si: 'අම්පාර' },
  galle: { en: 'Galle', ta: 'காலி', si: 'ගාල්ල' },
  hambantota: { en: 'Hambantota', ta: 'அம்பாந்தோட்டை', si: 'හම්බන්තොට' },
  matara: { en: 'Matara', ta: 'மாத்தறை', si: 'මාතර' },
  anuradhapura: { en: 'Anuradhapura', ta: 'அனுராதபுரம்', si: 'අනුරාධපුරය' },
  polonnaruwa: { en: 'Polonnaruwa', ta: 'பொலன்னறுவை', si: 'පොළොන්නරුව' },
  badulla: { en: 'Badulla', ta: 'பதுளை', si: 'බදුල්ල' },
  monaragala: { en: 'Monaragala', ta: 'மொனராகலை', si: 'මොණරාගල' },
  colombo: { en: 'Colombo', ta: 'கொழும்பு', si: 'කොළඹ' },
  gampaha: { en: 'Gampaha', ta: 'கம்பகா', si: 'ගම්පහ' },
  kalutara: { en: 'Kalutara', ta: 'களுத்துறை', si: 'කළුතර' },
  kegalle: { en: 'Kegalle', ta: 'கேகாலை', si: 'කෑගල්ල' },
  ratnapura: { en: 'Ratnapura', ta: 'இரத்தினபுரி', si: 'රත්නපුර' },
  kurunegala: { en: 'Kurunegala', ta: 'குருநாகல்', si: 'කුරුණෑගල' },
  puttalam: { en: 'Puttalam', ta: 'புத்தளம்', si: 'පුත්තලම' },
  kandy: { en: 'Kandy', ta: 'கண்டி', si: 'මහනුවර' },
  matale: { en: 'Matale', ta: 'மாத்தளை', si: 'මාතලේ' },
  'nuwara-eliya': { en: 'Nuwara Eliya', ta: 'நுவரெலியா', si: 'නුවරඑළිය' },
}

// ── Map projects (ALL SAMPLE — for demonstration until real projects are published) ──
// Shape: { id, sample, category, province, district, position: [lat, lng], photo|null,
//          name, desc, benefit: {en,ta,si}, timeline: 'YYYY–YYYY', progress: 0–100 }
// Positions are the real towns named; the projects themselves are not real.
export const PROJECTS = [
  { id: 'p1', sample: true, category: 'rural', province: 'northern', district: 'kilinochchi', position: [9.3803, 80.377], photo: 'village-alaveddi', timeline: '2027–2028', progress: 35,
    name: { en: 'Village road improvement', ta: 'கிராம வீதி மேம்பாடு', si: 'ගම් මාර්ග වැඩිදියුණු කිරීම' },
    desc: { en: 'Upgrading gravel roads that link villages to schools and markets.', ta: 'கிராமங்களைப் பாடசாலைகளுடனும் சந்தைகளுடனும் இணைக்கும் கிரவல் வீதிகளைத் தரமுயர்த்தல்.', si: 'ගම් පාසල් සහ වෙළඳපොළ සමඟ සම්බන්ධ කරන බොරළු මාර්ග උසස් කිරීම.' },
    benefit: { en: 'Safer travel in every season', ta: 'எல்லாப் பருவங்களிலும் பாதுகாப்பான பயணம்', si: 'සෑම සෘතුවකම ආරක්ෂිත ගමන්' } },
  { id: 'p2', sample: true, category: 'education', province: 'northern', district: 'jaffna', position: [9.6615, 80.0255], photo: 'library-jaffna', timeline: '2027', progress: 60,
    name: { en: 'Digital learning library', ta: 'டிஜிட்டல் கற்றல் நூலகம்', si: 'ඩිජිටල් ඉගෙනුම් පුස්තකාලය' },
    desc: { en: 'Computers, internet and study space for students and adults.', ta: 'மாணவர்களுக்கும் பெரியோர்களுக்கும் கணினிகள், இணையம், கற்றல் இடம்.', si: 'සිසුන්ට සහ වැඩිහිටියන්ට පරිගණක, අන්තර්ජාලය සහ අධ්‍යයන අවකාශය.' },
    benefit: { en: 'Free access to knowledge for everyone', ta: 'அனைவருக்கும் இலவச அறிவு அணுகல்', si: 'සැමට නොමිලේ දැනුම ලබා ගැනීම' } },
  { id: 'p3', sample: true, category: 'agriculture', province: 'northern', district: 'vavuniya', position: [8.7514, 80.4971], photo: 'paddy-ampara', timeline: '2027–2029', progress: 20,
    name: { en: 'Irrigation tank renewal', ta: 'நீர்ப்பாசனக் குளப் புனரமைப்பு', si: 'වාරි වැව් ප්‍රතිසංස්කරණය' },
    desc: { en: 'Restoring a village tank so farmers can grow two crops a year.', ta: 'விவசாயிகள் ஆண்டுக்கு இரு போகம் பயிரிட ஒரு கிராமக் குளத்தைப் புனரமைத்தல்.', si: 'ගොවීන්ට වසරකට කන්න දෙකක් වගා කිරීමට ගම් වැවක් ප්‍රතිසංස්කරණය කිරීම.' },
    benefit: { en: 'Reliable water for farming', ta: 'விவசாயத்துக்கு நம்பகமான நீர்', si: 'ගොවිතැනට විශ්වාසදායක ජලය' } },
  { id: 'p4', sample: true, category: 'economy', province: 'northern', district: 'mullaitivu', position: [9.2671, 80.8142], photo: 'fishing-boat', timeline: '2028', progress: 10,
    name: { en: 'Fisheries landing site upgrade', ta: 'மீன்பிடி இறங்குதுறை மேம்பாடு', si: 'ධීවර ගොඩබෑමේ ස්ථානය උසස් කිරීම' },
    desc: { en: 'Cold storage and a clean landing area for local fishers.', ta: 'உள்ளூர் மீனவர்களுக்குக் குளிரூட்டல் களஞ்சியமும் சுத்தமான இறங்குதுறையும்.', si: 'ප්‍රාදේශීය ධීවරයින් සඳහා ශීතාගාර සහ පිරිසිදු ගොඩබෑමේ ස්ථානයක්.' },
    benefit: { en: 'Better prices for fresh fish', ta: 'புதிய மீனுக்குச் சிறந்த விலை', si: 'නැවුම් මාළුවලට වඩා හොඳ මිලක්' } },
  { id: 'p5', sample: true, category: 'environment', province: 'eastern', district: 'batticaloa', position: [7.731, 81.6747], photo: 'mangrove', timeline: '2027–2030', progress: 45,
    name: { en: 'Lagoon mangrove restoration', ta: 'களப்புக் கண்டல் மீளுருவாக்கம்', si: 'කලපු කඩොලාන ප්‍රතිෂ්ඨාපනය' },
    desc: { en: 'Replanting mangroves to protect the lagoon and its fish.', ta: 'களப்பையும் அதன் மீன்வளத்தையும் பாதுகாக்கக் கண்டல் தாவரங்களை மீள நடுதல்.', si: 'කලපුව සහ එහි මත්ස්‍ය සම්පත ආරක්ෂා කිරීමට කඩොලාන නැවත සිටුවීම.' },
    benefit: { en: 'Protection from storms and more fish', ta: 'புயலிலிருந்து பாதுகாப்பும் அதிக மீன்வளமும்', si: 'කුණාටුවලින් ආරක්ෂාව සහ වැඩි මත්ස්‍ය සම්පත' } },
  { id: 'p6', sample: true, category: 'transportation', province: 'eastern', district: 'trincomalee', position: [8.5874, 81.2152], photo: 'train-northern-line', timeline: '2028–2030', progress: 5,
    name: { en: 'Bus and rail connection hub', ta: 'பேருந்து–புகையிரத இணைப்பு மையம்', si: 'බස් සහ දුම්රිය සම්බන්ධතා මධ්‍යස්ථානය' },
    desc: { en: 'One station where buses and trains meet, with shelter and information.', ta: 'நிழல், தகவல் வசதிகளுடன் பேருந்துகளும் புகையிரதங்களும் சந்திக்கும் ஒரு நிலையம்.', si: 'සෙවණ සහ තොරතුරු සහිතව බස් සහ දුම්රිය හමුවන එක් ස්ථානයක්.' },
    benefit: { en: 'Easier, shorter journeys', ta: 'எளிதான, குறுகிய பயணங்கள்', si: 'පහසු, කෙටි ගමන්' } },
  { id: 'p7', sample: true, category: 'healthcare', province: 'eastern', district: 'ampara', position: [7.2975, 81.682], photo: null, timeline: '2027–2028', progress: 70,
    name: { en: 'Rural health clinic', ta: 'கிராமிய சுகாதார நிலையம்', si: 'ග්‍රාමීය සෞඛ්‍ය සායනය' },
    desc: { en: 'A clinic with a doctor, nurses and a pharmacy for nearby villages.', ta: 'அருகிலுள்ள கிராமங்களுக்கு வைத்தியர், தாதியர், மருந்தகத்துடன் கூடிய சிகிச்சை நிலையம்.', si: 'අවට ගම් සඳහා වෛද්‍යවරයෙකු, හෙදියන් සහ ඖෂධ ශාලාවක් සහිත සායනයක්.' },
    benefit: { en: 'Care without long travel', ta: 'நீண்ட பயணமின்றிப் பராமரிப்பு', si: 'දිගු ගමනකින් තොරව සත්කාර' } },
  { id: 'p8', sample: true, category: 'technology', province: 'northern', district: 'mannar', position: [8.981, 79.9044], photo: null, timeline: '2028', progress: 15,
    name: { en: 'Youth technology centre', ta: 'இளைஞர் தொழில்நுட்ப நிலையம்', si: 'තරුණ තාක්ෂණ මධ්‍යස්ථානය' },
    desc: { en: 'Training in coding, repairs and online work for young people.', ta: 'இளைஞர்களுக்குக் குறியீட்டு எழுத்து, பழுதுபார்ப்பு, இணையவழி வேலைகளில் பயிற்சி.', si: 'තරුණයින්ට කේතකරණය, අලුත්වැඩියා සහ මාර්ගගත රැකියා පිළිබඳ පුහුණුව.' },
    benefit: { en: 'New skills and new jobs', ta: 'புதிய திறன்கள், புதிய வேலைகள்', si: 'නව කුසලතා සහ නව රැකියා' } },
  { id: 'p9', sample: true, category: 'employment', province: 'northern', district: 'jaffna', position: [9.8167, 80.2333], photo: 'palmyra-shop', timeline: '2027–2028', progress: 40,
    name: { en: 'Palmyra craft enterprise centre', ta: 'பனை உற்பத்தி தொழில் மையம்', si: 'තල් නිෂ්පාදන ව්‍යවසාය මධ්‍යස්ථානය' },
    desc: { en: 'A shared workshop helping families make and sell palmyra products.', ta: 'குடும்பங்கள் பனை உற்பத்திகளைத் தயாரித்து விற்க உதவும் பொதுப் பட்டறை.', si: 'පවුල්වලට තල් නිෂ්පාදන සාදා විකිණීමට උදව් කරන පොදු වැඩපොළක්.' },
    benefit: { en: 'Steady income for local families', ta: 'உள்ளூர்க் குடும்பங்களுக்கு நிலையான வருமானம்', si: 'ප්‍රාදේශීය පවුල්වලට ස්ථාවර ආදායමක්' } },
  { id: 'p10', sample: true, category: 'infrastructure', province: 'eastern', district: 'trincomalee', position: [8.4925, 81.1833], photo: null, timeline: '2027–2029', progress: 25,
    name: { en: 'Drinking water supply scheme', ta: 'குடிநீர் விநியோகத் திட்டம்', si: 'පානීය ජල සැපයුම් යෝජනා ක්‍රමය' },
    desc: { en: 'Piped clean water for homes in dry-zone villages.', ta: 'உலர் வலயக் கிராம வீடுகளுக்குக் குழாய் மூலம் சுத்தமான நீர்.', si: 'වියළි කලාපීය ගම්වල නිවෙස්වලට නළ මගින් පිරිසිදු ජලය.' },
    benefit: { en: 'Clean water at every tap', ta: 'ஒவ்வொரு குழாயிலும் சுத்தமான நீர்', si: 'සෑම කරාමයකම පිරිසිදු ජලය' } },
]

// Compatibility aliases for Roadmap.jsx imports
export const HORIZONS = MILESTONES
export const HORIZON_DETAILS = {}
export const DISTRICTS = DISTRICT_NAMES
export const PROVINCES = PROVINCE_NAMES
export const SECTORS = CATEGORIES
export const VISION_THEMES = VISION_SCENES
export const CHAPTER_SECTIONS = []
export const EVIDENCE = []
export const PROGRESS_RECORDS = []
export const PROGRESS_UNIT = { en: '%', ta: '%', si: '%' }
export const REPORTS = []
export const hasFile = (p) => !!(p && p.fileUrl && p.fileUrl !== '#')
