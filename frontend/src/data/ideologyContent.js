// Principles & Ideology page (/principles-ideology) — trilingual content.
//
// PRINCIPLES: the 11 ideological principles. The descriptions are ORIGINAL,
// neutral wording written for this site (no official text was supplied).
// Replace `lead` / `more` with the party's approved wording when available.
//
// PRESIDENTS: historical information about publicly documented roles, dates
// and positions, newest first. Please verify against reliable sources before
// publishing. They do not represent the party's official ideology.
//
// Images (used automatically when the file exists, otherwise a designed placeholder):
//   principles  →  /public/images/principles/<id>.jpg
//   presidents  →  /public/images/presidents/<id>.jpg

const PR = (id, en, ta, si) => ({ id, img: `/images/principles/${id}.jpg`, en, ta, si })
const D = (t, lead, more) => ({ t, lead, more })

export const PRINCIPLES = [
  PR('democracy',
    D('Democracy', 'Power belongs to the people, exercised through free, fair and regular elections.', 'We believe in accountable government, open debate and respect for every vote, with institutions that answer to the public and protect the rights of the minority as well as the majority.'),
    D('ஜனநாயகம்', 'அதிகாரம் மக்களுக்கே உரியது; சுதந்திரமான, நியாயமான, சீரான தேர்தல்கள் மூலம் அது செயற்படுத்தப்படுகிறது.', 'பொறுப்புக்கூறும் அரசாங்கம், திறந்த விவாதம், ஒவ்வொரு வாக்குக்குமான மதிப்பு ஆகியவற்றை நாம் நம்புகிறோம்; பெரும்பான்மையினரின் உரிமைகளைப் போலவே சிறுபான்மையினரின் உரிமைகளையும் பாதுகாக்கும், மக்களுக்குப் பதில் கூறும் நிறுவனங்கள் வேண்டும்.'),
    D('ප්‍රජාතන්ත්‍රවාදය', 'බලය ජනතාව සතුය; එය නිදහස්, සාධාරණ සහ නිතිපතා මැතිවරණ හරහා ක්‍රියාත්මක වේ.', 'වගකිවයුතු ආණ්ඩුවක්, විවෘත විවාදය සහ සෑම ඡන්දයකටම ගෞරවය අපි විශ්වාස කරමු; බහුතරයේ මෙන්ම සුළුතරයේ අයිතිවාසිකම්ද ආරක්ෂා කරන, ජනතාවට වගකියන ආයතන අවශ්‍යය.')),
  PR('social-justice',
    D('Equitable Social Justice', 'Fair opportunities for every community, with support directed to those who need it most.', 'Social justice means removing the barriers created by birth, caste, class, region or gender, so that education, employment and public services reach everyone on equal terms.'),
    D('சமத்துவ சமூக நீதி', 'ஒவ்வொரு சமூகத்திற்கும் நியாயமான வாய்ப்புகள்; மிகவும் தேவைப்படுவோருக்கு முன்னுரிமை ஆதரவு.', 'பிறப்பு, சாதி, வர்க்கம், பிரதேசம் அல்லது பாலினம் உருவாக்கும் தடைகளை நீக்கி, கல்வி, வேலைவாய்ப்பு, பொதுச் சேவைகள் அனைவரையும் சம அடிப்படையில் சென்றடையச் செய்வதே சமூக நீதி.'),
    D('සාධාරණ සමාජ යුක්තිය', 'සෑම ප්‍රජාවකටම සාධාරණ අවස්ථා; වඩාත් අවශ්‍ය අයට ප්‍රමුඛ සහාය.', 'උපත, කුලය, පන්තිය, ප්‍රදේශය හෝ ස්ත්‍රී පුරුෂ භාවය නිසා ඇති වන බාධක ඉවත් කර, අධ්‍යාපනය, රැකියා සහ මහජන සේවා සැමට සමානව ළඟා කිරීම සමාජ යුක්තියයි.')),
  PR('equality',
    D('Equality', 'Every citizen is equal in dignity and before the law.', 'No person should be favoured or disadvantaged because of religion, language, caste, gender or background; equal rights must be matched by equal treatment in practice.'),
    D('சமத்துவம்', 'ஒவ்வொரு குடிமகனும் கண்ணியத்திலும் சட்டத்தின் முன்னும் சமமானவர்.', 'மதம், மொழி, சாதி, பாலினம் அல்லது பின்னணி காரணமாக எவரும் சலுகை பெறவோ பாதிக்கப்படவோ கூடாது; சம உரிமைகள் நடைமுறையில் சம நடத்தையுடன் இணைய வேண்டும்.'),
    D('සමානාත්මතාව', 'සෑම පුරවැසියෙකුම ගෞරවයෙන් සහ නීතිය ඉදිරියේ සමාන වේ.', 'ආගම, භාෂාව, කුලය, ස්ත්‍රී පුරුෂ භාවය හෝ පසුබිම නිසා කිසිවෙකු වාසි හෝ අවාසි නොලැබිය යුතුය; සමාන අයිතිවාසිකම් ප්‍රායෝගිකව සමාන සැලකීමක් සමඟ ගැළපිය යුතුය.')),
  PR('secularism',
    D('Secularism', 'The state treats all religions with equal respect and favours none.', 'Freedom of belief is protected for every citizen, and public institutions remain neutral so that faith is never a basis for discrimination.'),
    D('மதச்சார்பின்மை', 'அரசு எல்லா மதங்களையும் சம மரியாதையுடன் நடத்துகிறது; எதற்கும் சார்பாக இல்லை.', 'ஒவ்வொரு குடிமகனின் நம்பிக்கைச் சுதந்திரமும் பாதுகாக்கப்படுகிறது; நம்பிக்கை ஒருபோதும் பாகுபாட்டுக்குக் காரணமாகாமல் இருக்கப் பொது நிறுவனங்கள் நடுநிலையாக இருக்கின்றன.'),
    D('ලෞකිකවාදය', 'රාජ්‍යය සියලු ආගම්වලට සමාන ගෞරවයක් දක්වන අතර කිසිවකට පක්ෂපාත නොවේ.', 'සෑම පුරවැසියෙකුගේම ඇදහීමේ නිදහස ආරක්ෂා වන අතර, ඇදහිල්ල කිසිදා වෙනස්කම් කිරීමට හේතුවක් නොවන පරිදි මහජන ආයතන මධ්‍යස්ථව පවතී.')),
  PR('state-autonomy',
    D('Right to State Autonomy', 'Regions should have meaningful powers to govern their own affairs.', 'Decisions are best made close to the people they affect; constitutional autonomy for regions strengthens democracy and allows communities to shape their own development.'),
    D('மாநில சுயாட்சி உரிமை', 'பிராந்தியங்கள் தமது சொந்த விவகாரங்களை நிர்வகிக்க அர்த்தமுள்ள அதிகாரங்களைக் கொண்டிருக்க வேண்டும்.', 'முடிவுகள் அவை பாதிக்கும் மக்களுக்கு அருகில் எடுக்கப்படுவதே சிறந்தது; பிராந்தியங்களுக்கான அரசியலமைப்புச் சுயாட்சி ஜனநாயகத்தை வலுப்படுத்தி, சமூகங்கள் தமது அபிவிருத்தியைத் தாமே வடிவமைக்க உதவுகிறது.'),
    D('ප්‍රාන්ත ස්වයං පාලන අයිතිය', 'ප්‍රදේශවලට තම කටයුතු පාලනය කිරීමට අර්ථවත් බලතල තිබිය යුතුය.', 'තීරණ ගැනීම එය බලපාන ජනතාවට ළඟින් සිදු වීම වඩාත් සුදුසුය; ප්‍රදේශ සඳහා ආණ්ඩුක්‍රම ව්‍යවස්ථාපිත ස්වාධීනත්වය ප්‍රජාතන්ත්‍රවාදය ශක්තිමත් කර, ප්‍රජාවන්ට තම සංවර්ධනය හැඩගැස්වීමට ඉඩ සලසයි.')),
  PR('two-language-policy',
    D('Two-Language Policy', 'Two languages are given equal standing in administration, education and public life.', 'Citizens should be able to learn, work and deal with government in their own language, while sharing a common language that connects them with others.'),
    D('இருமொழிக் கொள்கை', 'நிர்வாகம், கல்வி, பொது வாழ்வில் இரு மொழிகளுக்கும் சம அந்தஸ்து வழங்கப்படுகிறது.', 'குடிமக்கள் தமது சொந்த மொழியில் கற்கவும், பணியாற்றவும், அரசுடன் தொடர்புகொள்ளவும் முடிய வேண்டும்; அதேவேளை மற்றவர்களுடன் இணைக்கும் பொது மொழியையும் பகிர்ந்துகொள்ள வேண்டும்.'),
    D('ද්විභාෂා ප්‍රතිපත්තිය', 'පරිපාලනය, අධ්‍යාපනය සහ මහජන ජීවිතයේ භාෂා දෙකටම සමාන තත්ත්වයක් හිමි වේ.', 'පුරවැසියන්ට තම භාෂාවෙන් ඉගෙන ගැනීමට, වැඩ කිරීමට සහ රජය සමඟ කටයුතු කිරීමට හැකි විය යුතු අතර, අන් අය සමඟ සම්බන්ධ කරන පොදු භාෂාවක්ද බෙදා ගත යුතුය.')),
  PR('fundamental-rights',
    D('Administration Upholding Fundamental Rights without Political Interference', 'Public administration should protect citizens’ fundamental rights, free from political pressure.', 'Officials must serve the public impartially and according to law; appointments, policing and services should never be used for political advantage.'),
    D('அரசியல் தலையீடின்றி அடிப்படை உரிமைகளைப் பேணும் நிர்வாகம்', 'பொது நிர்வாகம் அரசியல் அழுத்தமின்றி குடிமக்களின் அடிப்படை உரிமைகளைப் பாதுகாக்க வேண்டும்.', 'அதிகாரிகள் சட்டத்தின்படி பக்கச்சார்பின்றிப் பொதுமக்களுக்குச் சேவை செய்ய வேண்டும்; நியமனங்கள், காவல்துறை, சேவைகள் ஒருபோதும் அரசியல் இலாபத்திற்குப் பயன்படுத்தப்படக் கூடாது.'),
    D('දේශපාලන මැදිහත්වීමකින් තොරව මූලික අයිතිවාසිකම් සුරකින පරිපාලනය', 'මහජන පරිපාලනය දේශපාලන බලපෑමකින් තොරව පුරවැසියන්ගේ මූලික අයිතිවාසිකම් ආරක්ෂා කළ යුතුය.', 'නිලධාරීන් නීතියට අනුව අපක්ෂපාතීව ජනතාවට සේවය කළ යුතුය; පත්වීම්, පොලිසිය සහ සේවා කිසිදා දේශපාලන වාසිය සඳහා භාවිත නොකළ යුතුය.')),
  PR('rationalist-mindset',
    D('Rationalist Mindset', 'Public decisions should be guided by reason, evidence and scientific thinking.', 'Encouraging questioning and critical thinking helps society move beyond superstition and prejudice, and leads to better policy.'),
    D('பகுத்தறிவுச் சிந்தனை', 'பொது முடிவுகள் காரணம், சான்று, அறிவியல் சிந்தனை ஆகியவற்றால் வழிநடத்தப்பட வேண்டும்.', 'கேள்வி கேட்பதையும் விமர்சனச் சிந்தனையையும் ஊக்குவிப்பது சமூகத்தை மூடநம்பிக்கைக்கும் முன்முடிவுக்கும் அப்பால் கொண்டுசென்று சிறந்த கொள்கைகளுக்கு வழிவகுக்கிறது.'),
    D('තාර්කික චින්තනය', 'මහජන තීරණ හේතු, සාක්ෂි සහ විද්‍යාත්මක චින්තනය මගින් මෙහෙයවිය යුතුය.', 'ප්‍රශ්න කිරීම සහ විවේචනාත්මක චින්තනය දිරිමත් කිරීම සමාජය මිථ්‍යා විශ්වාස සහ අගතිවලින් ඔබ්බට ගෙන යමින් වඩා හොඳ ප්‍රතිපත්තිවලට මඟ පාදයි.')),
  PR('abolition-of-untouchability',
    D('Abolition of Untouchability', 'Caste-based discrimination and untouchability have no place in society.', 'Every person has equal access to public spaces, places of worship, education and employment; caste discrimination must be ended in law and in everyday life.'),
    D('தீண்டாமை ஒழிப்பு', 'சாதி அடிப்படையிலான பாகுபாட்டுக்கும் தீண்டாமைக்கும் சமூகத்தில் இடமில்லை.', 'பொது இடங்கள், வழிபாட்டுத் தலங்கள், கல்வி, வேலைவாய்ப்பு ஆகியவற்றில் ஒவ்வொருவருக்கும் சம அணுகல் உண்டு; சாதிப் பாகுபாடு சட்டத்திலும் அன்றாட வாழ்விலும் ஒழிக்கப்பட வேண்டும்.'),
    D('අස්පෘශ්‍යතාව අහෝසි කිරීම', 'කුල පදනම් කරගත් වෙනස්කම් කිරීම්වලට සහ අස්පෘශ්‍යතාවට සමාජයේ ඉඩක් නැත.', 'මහජන ස්ථාන, ආගමික ස්ථාන, අධ්‍යාපනය සහ රැකියාවලට සැමට සමාන ප්‍රවේශයක් ඇත; කුල වෙනස්කම් නීතියෙන් සහ එදිනෙදා ජීවිතයෙන් තුරන් කළ යුතුය.')),
  PR('environmental-protection',
    D('Environmental Protection', 'Natural resources must be protected for present and future generations.', 'Development should be sustainable, safeguarding land, water, forests and coasts, and addressing pollution and climate change.'),
    D('சுற்றுச்சூழல் பாதுகாப்பு', 'இயற்கை வளங்கள் இன்றைய மற்றும் எதிர்காலத் தலைமுறைகளுக்காகப் பாதுகாக்கப்பட வேண்டும்.', 'நிலம், நீர், காடுகள், கடற்கரைகளைப் பாதுகாத்து, மாசுபாட்டையும் காலநிலை மாற்றத்தையும் எதிர்கொண்டு, அபிவிருத்தி நிலைபேறானதாக இருக்க வேண்டும்.'),
    D('පරිසර සංරක්ෂණය', 'ස්වාභාවික සම්පත් වර්තමාන සහ අනාගත පරම්පරා සඳහා ආරක්ෂා කළ යුතුය.', 'ඉඩම්, ජලය, වනාන්තර සහ වෙරළ ආරක්ෂා කරමින්, දූෂණය සහ දේශගුණ විපර්යාසවලට මුහුණ දෙමින් සංවර්ධනය තිරසාර විය යුතුය.')),
  PR('drug-free',
    D('Drug-Free Tamil Nadu', 'A society free from the harm of drug abuse.', 'Prevention, education and rehabilitation protect young people and families, alongside firm action against the drug trade.'),
    D('போதையில்லா தமிழ்நாடு', 'போதைப்பொருள் பாவனையின் தீங்கிலிருந்து விடுபட்ட சமூகம்.', 'தடுப்பு, விழிப்புணர்வு, மறுவாழ்வு ஆகியவை இளைஞர்களையும் குடும்பங்களையும் பாதுகாக்கின்றன; அதேவேளை போதைப்பொருள் வர்த்தகத்திற்கு எதிராக உறுதியான நடவடிக்கை தேவை.'),
    D('මත්ද්‍රව්‍යවලින් තොර තමිල්නාඩුව', 'මත්ද්‍රව්‍ය භාවිතයේ හානියෙන් තොර සමාජයක්.', 'වැළැක්වීම, දැනුවත් කිරීම සහ පුනරුත්ථාපනය තරුණයන් සහ පවුල් ආරක්ෂා කරන අතර, මත්ද්‍රව්‍ය ජාවාරමට එරෙහිව ස්ථිර ක්‍රියාමාර්ග අවශ්‍යය.')),
]

// real portraits supplied for the site (others fall back to /images/presidents/<id>.jpg, then to an initials plate)
const PHOTOS = {
  'chandrika-bandaranaike-kumaratunga': '/images/Chandrika_Bandaranaike_Kumaratunga.jpg',
  'william-gopallawa': '/images/William%20Gopallawa.webp',
}
// Quotes for the vintage quote card (opened by clicking the portrait in the book).
// Only real, verified quotes go here. Lines are shown in order; wrap words in *…* to highlight them.
// e.g. 'chandrika-bandaranaike-kumaratunga': { en: { lines: ['…', 'A *SUN,*'] }, ta: {…}, si: {…} }
// Leaders with a photo but no quote get the same card with their name and term instead.
const QUOTES = {
  // 'chandrika-bandaranaike-kumaratunga': awaiting the quote from the site owner
}
// Ideology lines for the poster (shown inside the quote marks, name and years below).
// Built only from each leader's political positions listed further down — a summary of their
// stated direction, not a verbatim quote. A real quote in QUOTES takes priority.
// Keep English lines short (about 14 characters) so they stay on one line; *…* = highlighted.
const IDEALS = {
  'chandrika-bandaranaike-kumaratunga': {
    en: ['DEVOLUTION,', 'A NEGOTIATED', '*PEACE*,', 'SOCIAL', '*DEMOCRACY.*'],
    ta: ['அதிகாரப் *பரவலாக்கம்*,', 'பேச்சுவார்த்தை மூலம் *சமாதானம்*,', 'சமூக *ஜனநாயகம்.*'],
    si: ['බලය *බෙදාහැරීම*,', 'සාකච්ඡා මගින් *සාමය*,', 'සමාජ *ප්‍රජාතන්ත්‍රවාදය.*'],
  },
  'mahinda-rajapaksa': {
    en: ['NATIONAL', '*SECURITY*,', 'STRONG CENTRAL', 'GOVERNMENT,', '*NATIONALISM.*'],
    ta: ['தேசியப் *பாதுகாப்பு*,', 'வலுவான மத்திய அரசு,', '*தேசியவாதம்.*'],
    si: ['ජාතික *ආරක්ෂාව*,', 'ශක්තිමත් මධ්‍යම ආණ්ඩුව,', '*ජාතිකවාදය.*'],
  },
  'maithripala-sirisena': {
    en: ['GOOD', '*GOVERNANCE*,', 'REDUCED', 'PRESIDENTIAL', '*POWERS.*'],
    ta: ['*நல்லாட்சி*,', 'ஜனாதிபதி அதிகாரங்களைக் *குறைத்தல்.*'],
    si: ['*යහපාලනය*,', 'ජනාධිපති බලතල *අඩු කිරීම.*'],
  },
  'gotabaya-rajapaksa': {
    en: ['NATIONAL', '*SECURITY*,', 'A STRONGER', 'EXECUTIVE,', '*TECHNOCRACY.*'],
    ta: ['தேசியப் *பாதுகாப்பு*,', 'வலுவான நிறைவேற்று அதிகாரம்,', 'தொழில்நுட்ப நிபுணத்துவ *ஆட்சி.*'],
    si: ['ජාතික *ආරක්ෂාව*,', 'ශක්තිමත් විධායකය,', 'තාක්ෂණික විශේෂඥ *පාලනය.*'],
  },
  'ranil-wickremesinghe': {
    en: ['ECONOMIC', '*STABILITY*,', 'OPEN MARKETS,', 'LIBERAL', '*DEMOCRACY.*'],
    ta: ['பொருளாதார *ஸ்திரப்படுத்தல்*,', 'சந்தை சார்ந்த பொருளாதாரம்,', 'தாராளவாத *ஜனநாயகம்.*'],
    si: ['ආර්ථික *ස්ථායීකරණය*,', 'වෙළඳපොළ මූලික ආර්ථිකය,', 'ලිබරල් *ප්‍රජාතන්ත්‍රවාදය.*'],
  },
  'anura-kumara-dissanayake': {
    en: ['CLEAN', '*GOVERNANCE*,', 'SOCIAL', '*JUSTICE*,', 'ECONOMIC', '*REFORM.*'],
    ta: ['தூய்மையான *ஆட்சி*,', 'சமூக *நீதி*,', 'பொருளாதாரச் *சீர்திருத்தம்.*'],
    si: ['පිරිසිදු *පාලනය*,', 'සමාජ *සාධාරණත්වය*,', 'ආර්ථික *ප්‍රතිසංස්කරණ.*'],
  },
}
const PS = (id, period, initials, current, en, ta, si) => ({
  id, period, initials, current, img: PHOTOS[id] || `/images/presidents/${id}.jpg`,
  hasPhoto: Boolean(PHOTOS[id]), quote: QUOTES[id] || null, ideals: IDEALS[id] || null, en, ta, si,
})
const B = (name, background, positions, moments = []) => ({ name, background, positions, moments })

// Newest first.
export const PRESIDENTS = [
  PS('anura-kumara-dissanayake', '2024 –', 'AKD', true,
    B('Anura Kumara Dissanayake', 'Elected Sri Lanka’s ninth executive President in September 2024, leading the National People’s Power on a platform of clean governance and systemic change.',
      ['Anti-corruption and accountability', 'Democratic governance', 'Social justice', 'Economic reform'],
      ['Won a two-thirds parliamentary majority in the November 2024 general election']),
    B('அநுர குமார திசாநாயக்க', '2024 செப்டம்பரில் இலங்கையின் ஒன்பதாவது நிறைவேற்று ஜனாதிபதியாகத் தெரிவான இவர், தூய்மையான ஆட்சி மற்றும் முறைமை மாற்றம் என்ற அடிப்படையில் தேசிய மக்கள் சக்தியை வழிநடத்துகிறார்.',
      ['ஊழல் ஒழிப்பும் பொறுப்புக்கூறலும்', 'ஜனநாயக ஆட்சி', 'சமூக நீதி', 'பொருளாதாரச் சீர்திருத்தம்'],
      ['2024 நவம்பர் பொதுத் தேர்தலில் மூன்றில் இரண்டு பாராளுமன்றப் பெரும்பான்மையைப் பெற்றார்']),
    B('අනුර කුමාර දිසානායක', '2024 සැප්තැම්බරයේ ශ්‍රී ලංකාවේ නවවන විධායක ජනාධිපති ලෙස තේරී පත් වූ ඔහු, පිරිසිදු පාලනය සහ ක්‍රමවේද වෙනසක් මත ජාතික ජන බලවේගය මෙහෙයවයි.',
      ['දූෂණ විරෝධය සහ වගවීම', 'ප්‍රජාතන්ත්‍රවාදී පාලනය', 'සමාජ සාධාරණත්වය', 'ආර්ථික ප්‍රතිසංස්කරණ'],
      ['2024 නොවැම්බර් මහ මැතිවරණයේ දෙතුනේ පාර්ලිමේන්තු බහුතරයක් දිනා ගත්තේය'])),

  PS('ranil-wickremesinghe', '2022 – 2024', 'RW', false,
    B('Ranil Wickremesinghe', 'Leader of the United National Party, who served several terms as Prime Minister. He was elected President by Parliament in July 2022, after his predecessor resigned during the economic crisis.',
      ['Economic stabilisation with an IMF-supported programme', 'Market-oriented economic policy', 'Liberal democracy']),
    B('ரணில் விக்ரமசிங்க', 'ஐக்கிய தேசியக் கட்சியின் தலைவரும் பலமுறை பிரதமராகப் பதவி வகித்தவருமான இவர், பொருளாதார நெருக்கடியின் போது முன்னைய ஜனாதிபதி பதவி விலகியதைத் தொடர்ந்து 2022 ஜூலையில் பாராளுமன்றத்தால் ஜனாதிபதியாகத் தெரிவு செய்யப்பட்டார்.',
      ['சர்வதேச நாணய நிதிய ஆதரவுடனான பொருளாதார ஸ்திரப்படுத்தல்', 'சந்தை சார்ந்த பொருளாதாரக் கொள்கை', 'தாராளவாத ஜனநாயகம்']),
    B('රනිල් වික්‍රමසිංහ', 'එක්සත් ජාතික පක්ෂයේ නායකයා සහ කිහිප වතාවක් අගමැති ධුරය දැරූ ඔහු, ආර්ථික අර්බුදය අතරතුර පූර්ව ජනාධිපති ඉල්ලා අස්වීමෙන් පසු 2022 ජූලි මාසයේ පාර්ලිමේන්තුව විසින් ජනාධිපති ලෙස තේරී පත් කරන ලදී.',
      ['ජාත්‍යන්තර මූල්‍ය අරමුදලේ සහාය ඇතිව ආර්ථික ස්ථායීකරණය', 'වෙළඳපොළ මූලික ආර්ථික ප්‍රතිපත්තිය', 'ලිබරල් ප්‍රජාතන්ත්‍රවාදය'])),

  PS('gotabaya-rajapaksa', '2019 – 2022', 'GR', false,
    B('Gotabaya Rajapaksa', 'Secretary of Defence from 2005 to 2015. Elected President in November 2019, he resigned in July 2022 amid the economic crisis and mass protests.',
      ['National security', 'A stronger executive presidency (20th Amendment, 2020)', 'Technocratic governance']),
    B('கோட்டாபய ராஜபக்ஷ', '2005 முதல் 2015 வரை பாதுகாப்புச் செயலாளராகப் பணியாற்றினார். 2019 நவம்பரில் ஜனாதிபதியாகத் தெரிவான இவர், பொருளாதார நெருக்கடி மற்றும் மக்கள் போராட்டங்களுக்கு மத்தியில் 2022 ஜூலையில் பதவி விலகினார்.',
      ['தேசியப் பாதுகாப்பு', 'வலுவான நிறைவேற்று ஜனாதிபதி முறை (20 ஆவது திருத்தம், 2020)', 'தொழில்நுட்ப நிபுணத்துவ ஆட்சி']),
    B('ගෝඨාභය රාජපක්ෂ', '2005 සිට 2015 දක්වා ආරක්ෂක ලේකම් ලෙස සේවය කළේය. 2019 නොවැම්බරයේ ජනාධිපති ලෙස තේරී පත් වූ ඔහු, ආර්ථික අර්බුදය සහ මහජන විරෝධතා මධ්‍යයේ 2022 ජූලි මාසයේ ඉල්ලා අස් විය.',
      ['ජාතික ආරක්ෂාව', 'ශක්තිමත් විධායක ජනාධිපති ධුරය (20 වන සංශෝධනය, 2020)', 'තාක්ෂණික විශේෂඥ පාලනය'])),

  PS('maithripala-sirisena', '2015 – 2019', 'MS', false,
    B('Maithripala Sirisena', 'A former General Secretary of the SLFP and Minister of Health, he won the January 2015 election as the common opposition candidate.',
      ['Good governance (Yahapalanaya)', 'Reduced presidential powers (19th Amendment, 2015)', 'Independent commissions']),
    B('மைத்திரிபால சிறிசேன', 'ஸ்ரீலங்கா சுதந்திரக் கட்சியின் முன்னாள் பொதுச் செயலாளரும் சுகாதார அமைச்சருமான இவர், 2015 ஜனவரித் தேர்தலில் பொது எதிரணி வேட்பாளராகப் போட்டியிட்டு வெற்றி பெற்றார்.',
      ['நல்லாட்சி', 'ஜனாதிபதி அதிகாரங்களைக் குறைத்தல் (19 ஆவது திருத்தம், 2015)', 'சுயாதீன ஆணைக்குழுக்கள்']),
    B('මෛත්‍රීපාල සිරිසේන', 'ශ්‍රී ලංකා නිදහස් පක්ෂයේ හිටපු මහලේකම් සහ සෞඛ්‍ය ඇමති වූ ඔහු, පොදු විපක්ෂ අපේක්ෂකයා ලෙස 2015 ජනවාරි මැතිවරණය ජයග්‍රහණය කළේය.',
      ['යහපාලනය', 'ජනාධිපති බලතල අඩු කිරීම (19 වන සංශෝධනය, 2015)', 'ස්වාධීන කොමිෂන් සභා'])),

  PS('mahinda-rajapaksa', '2005 – 2015', 'MR', false,
    B('Mahinda Rajapaksa', 'Led the government that ended the armed conflict in 2009 and pursued large state-led infrastructure projects; later served as Prime Minister.',
      ['National security', 'State-led infrastructure', 'Strong central government', 'Nationalism'],
      ['His government ended the 26-year armed conflict in May 2009', 'Prime Minister, 2019 – 2022']),
    B('மகிந்த ராஜபக்ஷ', '2009 இல் ஆயுத மோதலை முடிவுக்குக் கொண்டுவந்த அரசாங்கத்தை வழிநடத்தியதுடன், பாரிய அரசு தலைமையிலான உட்கட்டமைப்புத் திட்டங்களை முன்னெடுத்தார்; பின்னர் பிரதமராகவும் பதவி வகித்தார்.',
      ['தேசியப் பாதுகாப்பு', 'அரசு தலைமையிலான உட்கட்டமைப்பு', 'வலுவான மத்திய அரசு', 'தேசியவாதம்'],
      ['இவரது அரசாங்கம் 2009 மே மாதம் 26 ஆண்டுகால ஆயுத மோதலை முடிவுக்குக் கொண்டுவந்தது', 'பிரதமர், 2019 – 2022']),
    B('මහින්ද රාජපක්ෂ', '2009 දී සන්නද්ධ ගැටුම අවසන් කළ රජය මෙහෙයවූ ඔහු, විශාල රාජ්‍ය මූලික යටිතල පහසුකම් ව්‍යාපෘති ක්‍රියාත්මක කළේය; පසුව අගමැති ලෙසද කටයුතු කළේය.',
      ['ජාතික ආරක්ෂාව', 'රාජ්‍ය මූලික යටිතල පහසුකම්', 'ශක්තිමත් මධ්‍යම ආණ්ඩුව', 'ජාතිකවාදය'],
      ['ඔහුගේ රජය 2009 මැයි මාසයේ වසර 26ක සන්නද්ධ ගැටුම අවසන් කළේය', 'අගමැති, 2019 – 2022'])),

  PS('chandrika-bandaranaike-kumaratunga', '1994 – 2005', 'CBK', false,
    B('Chandrika Bandaranaike Kumaratunga', 'Sri Lanka’s first woman President, leading the SLFP-led People’s Alliance. She was briefly Prime Minister in 1994 before winning the presidency.',
      ['Devolution and constitutional reform proposals', 'A negotiated peace process', 'Social democracy']),
    B('சந்திரிகா பண்டாரநாயக்க குமாரதுங்க', 'இலங்கையின் முதலாவது பெண் ஜனாதிபதியான இவர், ஸ்ரீலங்கா சுதந்திரக் கட்சி தலைமையிலான பொதுஜன முன்னணியை வழிநடத்தினார். ஜனாதிபதியாவதற்கு முன் 1994 இல் சிறிது காலம் பிரதமராக இருந்தார்.',
      ['அதிகாரப் பரவலாக்கமும் அரசியலமைப்புச் சீர்திருத்த முன்மொழிவுகளும்', 'பேச்சுவார்த்தை மூலமான சமாதான முயற்சி', 'சமூக ஜனநாயகம்']),
    B('චන්ද්‍රිකා බණ්ඩාරනායක කුමාරතුංග', 'ශ්‍රී ලංකාවේ පළමු කාන්තා ජනාධිපතිනිය වූ ඇය, ශ්‍රී ලංකා නිදහස් පක්ෂය මූලික පොදු පෙරමුණ මෙහෙයවූවාය. ජනාධිපති ධුරය දිනා ගැනීමට පෙර 1994 දී කෙටි කලක් අගමැතිනිය වූවාය.',
      ['බලය බෙදාහැරීම සහ ආණ්ඩුක්‍රම ව්‍යවස්ථා ප්‍රතිසංස්කරණ යෝජනා', 'සාකච්ඡා මගින් සාම ක්‍රියාවලිය', 'සමාජ ප්‍රජාතන්ත්‍රවාදය'])),

  PS('db-wijetunga', '1993 – 1994', 'DBW', false,
    B('D. B. Wijetunga', 'Prime Minister from 1989, he succeeded to the presidency after President Premadasa’s assassination in May 1993 and served until the 1994 election.',
      ['Continuity of United National Party government', 'Oversaw the 1994 parliamentary and presidential elections']),
    B('டி. பி. விஜேதுங்க', '1989 முதல் பிரதமராக இருந்த இவர், 1993 மே மாதம் ஜனாதிபதி பிரேமதாச படுகொலை செய்யப்பட்டதைத் தொடர்ந்து ஜனாதிபதியாகி, 1994 தேர்தல் வரை பதவி வகித்தார்.',
      ['ஐக்கிய தேசியக் கட்சி அரசாங்கத்தின் தொடர்ச்சி', '1994 பாராளுமன்ற மற்றும் ஜனாதிபதித் தேர்தல்களை மேற்பார்வையிட்டார்']),
    B('ඩී. බී. විජේතුංග', '1989 සිට අගමැති වූ ඔහු, 1993 මැයි මාසයේ ජනාධිපති ප්‍රේමදාස ඝාතනයෙන් පසු ජනාධිපති ධුරයට පත් වී 1994 මැතිවරණය දක්වා සේවය කළේය.',
      ['එක්සත් ජාතික පක්ෂ ආණ්ඩුවේ අඛණ්ඩතාව', '1994 පාර්ලිමේන්තු සහ ජනාධිපතිවරණ අධීක්ෂණය කළේය'])),

  PS('ranasinghe-premadasa', '1989 – 1993', 'RP', false,
    B('Ranasinghe Premadasa', 'Known for large housing and poverty-alleviation programmes aimed at low-income and rural communities.',
      ['Poverty alleviation', 'Housing for all', 'Rural development', 'Social welfare'],
      ['The Hundred Thousand Houses and Million Houses programmes', 'The Janasaviya poverty-alleviation programme']),
    B('ரணசிங்க பிரேமதாச', 'குறைந்த வருமானம் கொண்ட மற்றும் கிராமியச் சமூகங்களை இலக்காகக் கொண்ட பாரிய வீடமைப்பு மற்றும் வறுமை ஒழிப்புத் திட்டங்களுக்காக அறியப்படுகிறார்.',
      ['வறுமை ஒழிப்பு', 'அனைவருக்கும் வீடு', 'கிராமிய அபிவிருத்தி', 'சமூக நலன்'],
      ['இலட்சம் வீடுகள் மற்றும் பத்து இலட்சம் வீடுகள் திட்டங்கள்', 'ஜனசவிய வறுமை ஒழிப்புத் திட்டம்']),
    B('රණසිංහ ප්‍රේමදාස', 'අඩු ආදායම්ලාභී සහ ග්‍රාමීය ප්‍රජාවන් ඉලක්ක කළ විශාල නිවාස සහ දරිද්‍රතා නිවාරණ වැඩසටහන් සඳහා ප්‍රසිද්ධය.',
      ['දරිද්‍රතාව පිටුදැකීම', 'සැමට නිවාස', 'ග්‍රාමීය සංවර්ධනය', 'සමාජ සුබසාධනය'],
      ['ලක්ෂ නිවාස සහ දසලක්ෂ නිවාස වැඩසටහන්', 'ජනසවිය දරිද්‍රතා නිවාරණ වැඩසටහන'])),

  PS('jr-jayewardene', '1978 – 1989', 'JRJ', false,
    B('J. R. Jayewardene', 'Opened Sri Lanka’s economy in 1977 and introduced the 1978 Constitution, which created the executive presidency; he was its first holder.',
      ['Open-market economy', 'Executive presidential system', 'Private investment and trade'],
      ['Introduced the 1978 Constitution and the executive presidency', 'Signed the 1987 Indo–Sri Lanka Accord, which led to the provincial council system']),
    B('ஜே. ஆர். ஜயவர்தன', '1977 இல் இலங்கைப் பொருளாதாரத்தைத் திறந்துவிட்டதுடன், நிறைவேற்று ஜனாதிபதி முறையை உருவாக்கிய 1978 அரசியலமைப்பை அறிமுகப்படுத்தி, அதன் முதலாவது ஜனாதிபதியானார்.',
      ['திறந்த சந்தைப் பொருளாதாரம்', 'நிறைவேற்று ஜனாதிபதி முறை', 'தனியார் முதலீடும் வர்த்தகமும்'],
      ['1978 அரசியலமைப்பையும் நிறைவேற்று ஜனாதிபதி முறையையும் அறிமுகப்படுத்தினார்', 'மாகாண சபை முறைமைக்கு வழிவகுத்த 1987 இந்திய–இலங்கை ஒப்பந்தத்தில் கைச்சாத்திட்டார்']),
    B('ජේ. ආර්. ජයවර්ධන', '1977 දී ශ්‍රී ලංකා ආර්ථිකය විවෘත කළ ඔහු, විධායක ජනාධිපති ධුරය නිර්මාණය කළ 1978 ආණ්ඩුක්‍රම ව්‍යවස්ථාව හඳුන්වා දී එහි පළමු ජනාධිපති විය.',
      ['විවෘත වෙළඳපොළ ආර්ථිකය', 'විධායක ජනාධිපති ක්‍රමය', 'පෞද්ගලික ආයෝජන සහ වෙළඳාම'],
      ['1978 ආණ්ඩුක්‍රම ව්‍යවස්ථාව සහ විධායක ජනාධිපති ධුරය හඳුන්වා දුන්නේය', 'පළාත් සභා ක්‍රමයට මඟ පෑදූ 1987 ඉන්දු–ලංකා ගිවිසුමට අත්සන් තැබීය'])),

  PS('william-gopallawa', '1972 – 1978', 'WG', false,
    B('William Gopallawa', 'The last Governor-General of Ceylon (1962 – 1972), he became the first President of Sri Lanka when the country became a republic in 1972. The office was ceremonial.',
      ['Constitutional, non-executive head of state', 'A non-partisan office']),
    B('வில்லியம் கொப்பல்லாவ', 'இலங்கையின் கடைசி மகா தேசாதிபதியான (1962 – 1972) இவர், 1972 இல் நாடு குடியரசானபோது இலங்கையின் முதலாவது ஜனாதிபதியானார். அது ஒரு சம்பிரதாயபூர்வ பதவியாகும்.',
      ['அரசியலமைப்பு ரீதியான, நிறைவேற்று அதிகாரமற்ற அரச தலைவர்', 'கட்சி சார்பற்ற பதவி']),
    B('විලියම් ගොපල්ලව', 'ලංකාවේ අවසාන අග්‍රාණ්ඩුකාරවරයා (1962 – 1972) වූ ඔහු, 1972 දී රට ජනරජයක් වූ විට ශ්‍රී ලංකාවේ පළමු ජනාධිපති විය. එම ධුරය චාරිත්‍රානුකූල එකක් විය.',
      ['ආණ්ඩුක්‍රම ව්‍යවස්ථාපිත, විධායක නොවන රාජ්‍ය නායකයා', 'පක්ෂග්‍රාහී නොවන ධුරය'])),
]

export const IDEOLOGY = {
  en: {
    title: 'Principles & Ideology',
    s1Title: 'The Principles That Shape Our Struggle', s1Intro: 'Democracy • Equality • Federalism • Justice',
    flagLabel: 'The Party Flag', leaderLabel: 'Party Leader',
    s2Eyebrow: 'Our Ideological Foundation', s2Title: 'The Principles That Define Our Beliefs',
    s2Sub: 'The ideas, values and democratic convictions that shape our political identity and guide our commitment to the Tamil people.',
    closeLabel: 'Close',
    readMore: 'Read more', readLess: 'Show less',
    s3Title: 'Political Thinkers', s3Sub: 'Presidents of Sri Lanka',
    designation: 'President of Sri Lanka', current: 'Current President', presidency: 'Presidency',
    background: 'Background', positions: 'Political positions', moments: 'Key moments',
    viewProfile: 'View profile', close: 'Close', prev: 'Previous', next: 'Next',
    now: 'Present', number: 'No.', pause: 'Pause', play: 'Play',
    note: 'Historical profiles, presented for information. They do not represent the party’s official ideology.',
  },
  ta: {
    title: 'கொள்கைகள் & சித்தாந்தம்',
    s1Title: 'எங்கள் போராட்டத்தை வடிவமைக்கும் கொள்கைகள்', s1Intro: 'ஜனநாயகம் • சமத்துவம் • சமஷ்டி • நீதி',
    flagLabel: 'கட்சிக் கொடி', leaderLabel: 'கட்சித் தலைவர்',
    s2Eyebrow: 'எங்கள் சித்தாந்த அடித்தளம்', s2Title: 'எங்கள் நம்பிக்கைகளை வரையறுக்கும் கொள்கைகள்',
    s2Sub: 'எங்கள் அரசியல் அடையாளத்தை வடிவமைத்து, தமிழ் மக்களுக்கான எங்கள் அர்ப்பணிப்பை வழிநடத்தும் கருத்துக்கள், விழுமியங்கள் மற்றும் ஜனநாயக உறுதிப்பாடுகள்.',
    closeLabel: 'மூடு',
    readMore: 'மேலும் வாசிக்க', readLess: 'சுருக்கு',
    s3Title: 'அரசியல் சிந்தனையாளர்கள்', s3Sub: 'இலங்கை ஜனாதிபதிகள்',
    designation: 'இலங்கை ஜனாதிபதி', current: 'தற்போதைய ஜனாதிபதி', presidency: 'பதவிக்காலம்',
    background: 'பின்னணி', positions: 'அரசியல் நிலைப்பாடுகள்', moments: 'முக்கிய தருணங்கள்',
    viewProfile: 'சுயவிவரத்தைக் காண்க', close: 'மூடு', prev: 'முந்தைய', next: 'அடுத்து',
    now: 'இன்று வரை', number: 'இல.', pause: 'இடைநிறுத்து', play: 'இயக்கு',
    note: 'தகவலுக்காக வழங்கப்படும் வரலாற்று விவரங்கள். இவை கட்சியின் உத்தியோகபூர்வ சித்தாந்தத்தைக் குறிக்கவில்லை.',
  },
  si: {
    title: 'මූලධර්ම සහ මතවාදය',
    s1Title: 'අපගේ අරගලය හැඩගස්වන මූලධර්ම', s1Intro: 'ප්‍රජාතන්ත්‍රවාදය • සමානාත්මතාව • ෆෙඩරල්වාදය • යුක්තිය',
    flagLabel: 'පක්ෂ ධජය', leaderLabel: 'පක්ෂ නායක',
    s2Eyebrow: 'අපගේ මතවාදී පදනම', s2Title: 'අපගේ විශ්වාසයන් නිර්වචනය කරන මූලධර්ම',
    s2Sub: 'අපගේ දේශපාලන අනන්‍යතාව හැඩගස්වන සහ දෙමළ ජනතාව වෙනුවෙන් අපගේ කැපවීම මෙහෙයවන අදහස්, වටිනාකම් සහ ප්‍රජාතන්ත්‍රවාදී විශ්වාසයන්.',
    closeLabel: 'වසන්න',
    readMore: 'තවත් කියවන්න', readLess: 'අඩුවෙන් පෙන්වන්න',
    s3Title: 'දේශපාලන චින්තකයෝ', s3Sub: 'ශ්‍රී ලංකා ජනාධිපතිවරු',
    designation: 'ශ්‍රී ලංකා ජනාධිපති', current: 'වත්මන් ජනාධිපති', presidency: 'ධුර කාලය',
    background: 'පසුබිම', positions: 'දේශපාලන ස්ථාවරයන්', moments: 'ප්‍රධාන අවස්ථා',
    viewProfile: 'පැතිකඩ බලන්න', close: 'වසන්න', prev: 'පෙර', next: 'ඊළඟ',
    now: 'මේ දක්වා', number: 'අංක', pause: 'විරාම කරන්න', play: 'ධාවනය කරන්න',
    note: 'තොරතුරු සඳහා ඉදිරිපත් කරන ඓතිහාසික පැතිකඩ. ඒවා පක්ෂයේ නිල මතවාදය නියෝජනය නොකරයි.',
  },
}

export default IDEOLOGY
