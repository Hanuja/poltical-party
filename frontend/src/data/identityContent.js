// Trilingual copy for the Our Identity page (/our-identity).
//
// Every statement here is taken from (or translated from) content that
// already existed on the site: storyContent.js, the home/about translation
// keys and the About page structure list. Nothing new has been claimed.
//
// Dynamic content — leaders, policies, official documents and press
// statements — is NOT stored here. It is loaded live from the API (with the
// existing mock fallback) so it always reflects what the party publishes.
//
// TO VERIFY WITH THE PARTY before going live:
//   • symbol.colours — describes the colours used in the emblem/website only;
//     replace with the party's official colour meanings if they exist.
//   • Flag artwork — add the authentic file as /public/images/party-flag.png.

const EN = {
  title: 'Our Identity',
  subtitle: 'A Journey of Identity, Principles and Purpose.',
  chapter: 'Chapter',
  chapters: 'Eight chapters',
  prev: 'Previous',
  next: 'Next',
  close: 'Close',

  story: {
    label: 'Our Story & Formation',
    hero: 'A Journey of the People',
    intro: 'Our party was founded on the principles of equality, social justice and national development. We work across every district to build a Sri Lanka where every citizen has the opportunity to thrive.',
    paras: [
      'Our story begins with ordinary citizens who believed that politics should serve the people, not the powerful. Born from decades of public service, community work and a shared frustration with a system that left too many behind, our party emerged as a vehicle for change.',
      'From its earliest days, we have organised in villages, towns and cities — listening to teachers, farmers, workers, students and families, and carrying their concerns into the public square. What began as a small circle of committed volunteers has grown into a nationwide movement with members in every district.',
    ],
    quote: 'Today, our story is still being written — one district, one branch, one conversation at a time.',
    timelineTitle: 'Our Journey — Six Chapters',
    archiveCaption: 'Historical archive',
    formationTitle: 'The Formation',
    formationTagline: 'From humble beginnings to a national movement.',
    formationText: 'Our party was formed to give voice to those the system had overlooked — to rebuild trust in public life through transparency, participation and service. We believed a movement rooted in communities could restore that trust.',
    items: [
      { t: 'Historical Background', p: 'Many citizens grew weary of politics that served narrow interests rather than the national good.' },
      { t: 'Social Background', p: 'Communities across the island shared common struggles — education, dignified work, healthcare and accountable institutions.' },
      { t: 'Political Background', p: 'Citizens wanted representatives who listened first, governed honestly and treated every district with equal seriousness.' },
      { t: 'Reasons for Formation', p: 'To give voice to those the system had overlooked, and to rebuild trust through transparency, participation and service.' },
      { t: 'Founding Objectives', p: 'Equality of opportunity, social justice in every policy, development that leaves no district behind, and open, accountable politics.' },
      { t: 'Early Organisation', p: 'Volunteer networks, community meetings and door-to-door outreach built district structures, branch by branch.' },
    ],
  },

  vision: {
    label: 'Vision & Mission',
    intro: 'Our founding vision was a Sri Lanka where every citizen — in Jaffna or Galle, in city or village — could live with dignity, opportunity and hope.',
    visionLabel: 'Our Vision',
    visionText: 'A united, prosperous and equitable Sri Lanka where every community enjoys equal rights, opportunity and dignity.',
    visionMark: 'equal rights, opportunity and dignity',
    missionLabel: 'Our Mission',
    missionText: 'To deliver honest governance, sustainable development and inclusive policies that improve the lives of all Sri Lankans.',
    missionMark: 'honest governance',
    missionParas: [
      'We imagined public institutions that serve rather than dominate, and politics that unites rather than divides.',
      'We commit to building that vision patiently: through education, economic opportunity, honest governance and the simple discipline of keeping our promises.',
    ],
    closing: 'A Sri Lanka that works for all of us, together.',
    beliefLabel: 'Founding Belief',
    beliefText: 'Our party was founded on the principles of equality, social justice and national development. We believe in a Sri Lanka where every citizen has the opportunity to thrive.',
    commitLabel: 'Our Commitment',
    commitText: 'We are committed to serving the people, upholding transparency, and working across every district to build a better future for all Sri Lankans.',
  },

  principles: {
    label: 'Principles & Ideology',
    intro: 'Our founding principles are the compass that guides every decision we make.',
    items: [
      { t: 'Equality', p: 'Every citizen matters equally — regardless of district, language, religion or background.' },
      { t: 'Social Justice', p: 'The benefits of development must reach those who need them most.' },
      { t: 'Development', p: 'Building a Sri Lanka that works for all of us, together.' },
      { t: 'Unity', p: 'Politics that unites rather than divides.' },
      { t: 'Transparency', p: 'Honesty in public statements and accountability for every promise we make.' },
      { t: 'People First', p: 'Respect for every community we serve.' },
    ],
    closing: 'These are not slogans — they are the conditions we set for ourselves before asking for anyone’s trust.',
  },

  symbol: {
    label: 'Our Flag & Symbol Meanings',
    intro: 'Our flag and emblem carry the identity of the movement — at every gathering, in every branch and on every official publication.',
    flagCaption: 'The Party Flag',
    flagPending: 'The official flag artwork will be displayed here.',
    symbolTitle: 'The Party Emblem',
    symbolText: 'Our emblem brings together a rising sun, the outline of the island of Sri Lanka and the people standing together with raised flags.',
    coloursTitle: 'Our Colours',
    explore: {
      hint: 'Move, drag or tap across the artwork to explore each colour and symbol.',
      colour: 'Colour',
      symbol: 'Symbol',
      original: 'As it appears',
      choose: 'Select a colour or symbol on the artwork to see what it represents.',
      flagNote: 'The official flag artwork will appear here once it is added.',
    },
    // Describes what is visible in the emblem. Add official meanings as a
    // `meaning` field on any colour or symbol and the panel will show it.
    symbols: {
      sun: { name: 'The Rising Sun', p: 'The rising sun spreads its rays behind the island in our emblem.' },
      island: { name: 'The Island of Sri Lanka', p: 'The outline of the island of Sri Lanka at the centre of our emblem.' },
      people: { name: 'The People', p: 'The people standing together with raised flags along the base of our emblem.' },
    },
    colours: [
      { name: 'Maroon', token: 'primary', p: 'The principal colour of our emblem and of every official publication.' },
      { name: 'Golden Yellow', token: 'accent', p: 'The colour of the rising sun in our emblem.' },
      { name: 'Cream White', token: 'cream', p: 'The ground on which our colours stand.' },
    ],
  },

  leadership: {
    label: 'Leadership Overview',
    intro: 'The party is led by office-bearers accountable to its members, organised from the national leadership to every district.',
    groups: { party: 'Party Leadership', org: 'Organisational Leadership', regional: 'Regional Leadership' },
    empty: 'Profiles will be published soon.',
    viewAll: 'View full leadership',
    viewProfile: 'View profile',
    fullProfile: 'Open full profile',
    close: 'Close',
    regionalEmpty: 'Regional leadership profiles will be published soon.',
    ctaTitle: 'Leadership in Service of the People',
    ctaText: 'Discover the individuals and representatives working together to serve the people and strengthen the organisation.',
    ctaButton: 'Explore Full Leadership',
  },

  history: {
    label: 'History & Milestones',
    subtitle: 'The Journey Through Time',
    intro: 'Founded with a vision of unity and justice, our party has grown into a nationwide movement representing the aspirations of communities across Sri Lanka.',
    items: [
      { year: 'Founding', t: 'The Beginning', p: 'A small group of citizens gathered with a shared conviction: that ordinary people, organised honestly, could change the direction of public life. The first discussions were held in community halls and living rooms.', major: true },
      { year: 'Growth', t: 'Building the Movement', p: 'Word spread, and with it new members. District networks formed, local leaders emerged, and the party grew from a handful of branches to a recognisable organisation across the island.' },
      { year: 'Elections', t: 'Standing in Elections', p: 'Our candidates contested elections on platforms of accountability and service. Each campaign deepened our roots.' },
      { year: 'Today', t: 'A Movement Continues', p: 'Today our movement spans every district, supported by members who believe that politics can be a force for unity, justice and shared prosperity.', major: true },
    ],
    closingTitle: 'Our Journey Continues',
    closing: 'Our history reflects our foundation, our principles and our journey towards the future.',
  },

  constitution: {
    label: 'Constitution & Public Policies',
    intro: 'The documents and structures that govern how our party is organised, how decisions are made and what we stand for in public life.',
    article: 'Article',
    constitutionTitle: 'Party Constitution',
    constitutionText: 'The party constitution defines our structures, membership rules and democratic processes.',
    structureTitle: 'Organisational Structure',
    levels: [
      { t: 'National Organisation', p: 'National leadership and policy-making body' },
      { t: 'Provincial Organisation', p: 'Provincial coordination across all nine provinces' },
      { t: 'District Organisation', p: 'District-level organisation and membership' },
      { t: 'Local Organisation', p: 'Branch and community-level networks' },
    ],
    policiesTitle: 'Public Policies',
    policiesText: 'Our policies set out practical plans for Sri Lanka across every sector.',
    allPolicies: 'Explore all policies',
    governanceTitle: 'Governance Principles',
    governanceText: 'We hold ourselves to the standards we ask of others: honesty in public statements, accountability for our promises, and respect for every community we serve.',
    documentsTitle: 'Official documents',
    download: 'Download PDF',
    viewDocuments: 'View official documents',
  },

  statements: {
    label: 'Official Statements & Declarations',
    intro: 'Official statements and press releases issued by the party, arranged with the most recent first.',
    featured: 'Featured statement',
    archive: 'Statement archive',
    read: 'Read Statement',
    empty: 'No official statements have been published yet.',
    all: 'All press releases',
  },
}

const TA = {
  title: 'எங்கள் அடையாளம்',
  subtitle: 'அடையாளம், கொள்கைகள் மற்றும் நோக்கத்தின் ஒரு பயணம்.',
  chapter: 'அத்தியாயம்',
  chapters: 'எட்டு அத்தியாயங்கள்',
  prev: 'முந்தையது',
  next: 'அடுத்தது',
  close: 'மூடு',

  story: {
    label: 'எங்கள் கதை மற்றும் உருவாக்கம்',
    hero: 'மக்களின் பயணம்',
    intro: 'சமத்துவம், சமூக நீதி மற்றும் தேசிய அபிவிருத்தி ஆகிய கொள்கைகளின் அடிப்படையில் எங்கள் கட்சி நிறுவப்பட்டது. ஒவ்வொரு குடிமகனும் முன்னேறும் வாய்ப்பைப் பெறும் இலங்கையைக் கட்டியெழுப்ப நாங்கள் ஒவ்வொரு மாவட்டத்திலும் பணியாற்றுகிறோம்.',
    paras: [
      'அரசியல் அதிகாரம் படைத்தவர்களுக்கு அல்ல, மக்களுக்கே சேவை செய்ய வேண்டும் என்று நம்பிய சாதாரண குடிமக்களிடமிருந்து எங்கள் கதை தொடங்குகிறது. பல தசாப்த கால பொதுச் சேவை, சமூகப் பணி மற்றும் பலரைப் பின்தள்ளிய ஒரு முறைமை மீதான பகிரப்பட்ட அதிருப்தியிலிருந்து பிறந்த எங்கள் கட்சி, மாற்றத்திற்கான ஒரு வாகனமாக உருவெடுத்தது.',
      'ஆரம்ப நாட்களிலிருந்தே கிராமங்கள், நகரங்கள் மற்றும் பெருநகரங்களில் நாங்கள் ஒன்றிணைந்தோம் — ஆசிரியர்கள், விவசாயிகள், தொழிலாளர்கள், மாணவர்கள் மற்றும் குடும்பங்களின் குரல்களைக் கேட்டு, அவர்களின் கவலைகளைப் பொது அரங்கிற்குக் கொண்டு சென்றோம். அர்ப்பணிப்புள்ள தன்னார்வலர்களின் சிறிய வட்டமாகத் தொடங்கியது, இன்று ஒவ்வொரு மாவட்டத்திலும் உறுப்பினர்களைக் கொண்ட நாடு தழுவிய இயக்கமாக வளர்ந்துள்ளது.',
    ],
    quote: 'இன்றும் எங்கள் கதை எழுதப்பட்டுக்கொண்டிருக்கிறது — ஒரு மாவட்டம், ஒரு கிளை, ஒரு உரையாடல் என ஒவ்வொன்றாக.',
    timelineTitle: 'எங்கள் பயணம் — ஆறு அத்தியாயங்கள்',
    archiveCaption: 'வரலாற்றுக் காப்பகம்',
    formationTitle: 'உருவாக்கம்',
    formationTagline: 'எளிய தொடக்கத்திலிருந்து ஒரு தேசிய இயக்கம் வரை.',
    formationText: 'முறைமையால் புறக்கணிக்கப்பட்டவர்களுக்குக் குரல் கொடுக்கவும், வெளிப்படைத்தன்மை, பங்கேற்பு மற்றும் சேவை மூலம் பொது வாழ்வில் நம்பிக்கையை மீளக் கட்டியெழுப்பவும் எங்கள் கட்சி உருவாக்கப்பட்டது. சமூகங்களில் வேரூன்றிய ஓர் இயக்கம் அந்த நம்பிக்கையை மீட்டெடுக்க முடியும் என்று நாங்கள் நம்பினோம்.',
    items: [
      { t: 'வரலாற்றுப் பின்னணி', p: 'தேசிய நலனுக்குப் பதிலாக குறுகிய நலன்களுக்குச் சேவை செய்த அரசியலால் பல குடிமக்கள் சோர்வடைந்தனர்.' },
      { t: 'சமூகப் பின்னணி', p: 'கல்வி, கண்ணியமான தொழில், சுகாதாரம் மற்றும் பொறுப்புக்கூறும் நிறுவனங்கள் — தீவு முழுவதும் சமூகங்கள் பொதுவான போராட்டங்களை எதிர்கொண்டன.' },
      { t: 'அரசியல் பின்னணி', p: 'முதலில் செவிமடுத்து, நேர்மையாக ஆட்சி செய்து, ஒவ்வொரு மாவட்டத்தையும் சமமாக மதிக்கும் பிரதிநிதிகளை மக்கள் விரும்பினர்.' },
      { t: 'உருவாக்கத்திற்கான காரணங்கள்', p: 'முறைமையால் புறக்கணிக்கப்பட்டவர்களுக்குக் குரல் கொடுக்கவும், வெளிப்படைத்தன்மை, பங்கேற்பு மற்றும் சேவை மூலம் நம்பிக்கையை மீளக் கட்டியெழுப்பவும்.' },
      { t: 'ஸ்தாபக நோக்கங்கள்', p: 'சம வாய்ப்பு, ஒவ்வொரு கொள்கையிலும் சமூக நீதி, எந்த மாவட்டத்தையும் பின்தள்ளாத அபிவிருத்தி, திறந்த மற்றும் பொறுப்புக்கூறும் அரசியல்.' },
      { t: 'ஆரம்பகால அமைப்பு வளர்ச்சி', p: 'தன்னார்வ வலையமைப்புகள், சமூகக் கூட்டங்கள் மற்றும் வீடு வீடாகச் சென்ற தொடர்புகள் மூலம் மாவட்டக் கட்டமைப்புகள் கிளை கிளையாகக் கட்டியெழுப்பப்பட்டன.' },
    ],
  },

  vision: {
    label: 'தொலைநோக்கு மற்றும் பணி',
    intro: 'யாழ்ப்பாணமோ காலியோ, நகரமோ கிராமமோ — ஒவ்வொரு குடிமகனும் கண்ணியம், வாய்ப்பு மற்றும் நம்பிக்கையுடன் வாழக்கூடிய இலங்கையே எங்கள் ஸ்தாபகத் தொலைநோக்கு.',
    visionLabel: 'எங்கள் தொலைநோக்கு',
    visionText: 'ஒவ்வொரு சமூகமும் சம உரிமைகள், வாய்ப்பு மற்றும் கண்ணியத்தை அனுபவிக்கும் ஒன்றுபட்ட, செழிப்பான மற்றும் சமத்துவமான இலங்கை.',
    visionMark: 'சம உரிமைகள், வாய்ப்பு மற்றும் கண்ணியத்தை',
    missionLabel: 'எங்கள் பணி',
    missionText: 'அனைத்து இலங்கையர்களின் வாழ்க்கையையும் மேம்படுத்தும் நேர்மையான ஆட்சி, நிலையான அபிவிருத்தி மற்றும் உள்ளடக்கிய கொள்கைகளை வழங்குதல்.',
    missionMark: 'நேர்மையான ஆட்சி',
    missionParas: [
      'ஆதிக்கம் செலுத்தாமல் சேவை செய்யும் பொது நிறுவனங்களையும், பிரிக்காமல் ஒன்றிணைக்கும் அரசியலையும் நாங்கள் கனவு கண்டோம்.',
      'கல்வி, பொருளாதார வாய்ப்பு, நேர்மையான ஆட்சி மற்றும் எங்கள் வாக்குறுதிகளைக் காப்பாற்றும் எளிய ஒழுக்கம் மூலம் அந்தத் தொலைநோக்கைப் பொறுமையுடன் கட்டியெழுப்ப நாங்கள் உறுதிபூண்டுள்ளோம்.',
    ],
    closing: 'நம் அனைவருக்குமாக ஒன்றாகச் செயல்படும் ஓர் இலங்கை.',
    beliefLabel: 'ஸ்தாபக நம்பிக்கை',
    beliefText: 'சமத்துவம், சமூக நீதி மற்றும் தேசிய அபிவிருத்தி ஆகிய கொள்கைகளின் அடிப்படையில் எங்கள் கட்சி நிறுவப்பட்டது. ஒவ்வொரு குடிமகனும் முன்னேறும் வாய்ப்பைப் பெறும் இலங்கையை நாங்கள் நம்புகிறோம்.',
    commitLabel: 'எங்கள் உறுதிப்பாடு',
    commitText: 'மக்களுக்குச் சேவை செய்யவும், வெளிப்படைத்தன்மையைப் பேணவும், அனைத்து இலங்கையர்களுக்கும் சிறந்த எதிர்காலத்தைக் கட்டியெழுப்ப ஒவ்வொரு மாவட்டத்திலும் பணியாற்றவும் நாங்கள் உறுதிபூண்டுள்ளோம்.',
  },

  principles: {
    label: 'கொள்கைகள் மற்றும் சித்தாந்தம்',
    intro: 'எங்கள் ஸ்தாபகக் கொள்கைகளே நாங்கள் எடுக்கும் ஒவ்வொரு முடிவையும் வழிநடத்தும் திசைகாட்டி.',
    items: [
      { t: 'சமத்துவம்', p: 'மாவட்டம், மொழி, மதம் அல்லது பின்னணி எதுவாயினும் ஒவ்வொரு குடிமகனும் சமமாக முக்கியமானவர்.' },
      { t: 'சமூக நீதி', p: 'அபிவிருத்தியின் பலன்கள் மிகவும் தேவைப்படுவோரைச் சென்றடைய வேண்டும்.' },
      { t: 'அபிவிருத்தி', p: 'நம் அனைவருக்குமாக ஒன்றாகச் செயல்படும் இலங்கையைக் கட்டியெழுப்புதல்.' },
      { t: 'ஒற்றுமை', p: 'பிரிக்காமல் ஒன்றிணைக்கும் அரசியல்.' },
      { t: 'வெளிப்படைத்தன்மை', p: 'பொது அறிக்கைகளில் நேர்மை, நாங்கள் அளிக்கும் ஒவ்வொரு வாக்குறுதிக்கும் பொறுப்புக்கூறல்.' },
      { t: 'மக்களே முதன்மை', p: 'நாங்கள் சேவை செய்யும் ஒவ்வொரு சமூகத்திற்கும் மரியாதை.' },
    ],
    closing: 'இவை வெறும் கோஷங்கள் அல்ல — யாருடைய நம்பிக்கையையும் கேட்பதற்கு முன் நாங்கள் எங்களுக்கே விதித்துக்கொள்ளும் நிபந்தனைகள்.',
  },

  symbol: {
    label: 'எங்கள் கொடி மற்றும் சின்னத்தின் அர்த்தங்கள்',
    intro: 'எங்கள் கொடியும் சின்னமும் இயக்கத்தின் அடையாளத்தைச் சுமந்து நிற்கின்றன — ஒவ்வொரு கூட்டத்திலும், ஒவ்வொரு கிளையிலும், ஒவ்வொரு உத்தியோகபூர்வ வெளியீட்டிலும்.',
    flagCaption: 'கட்சிக் கொடி',
    flagPending: 'உத்தியோகபூர்வ கொடி வடிவம் இங்கே காட்சிப்படுத்தப்படும்.',
    symbolTitle: 'கட்சிச் சின்னம்',
    symbolText: 'உதிக்கும் சூரியன், இலங்கைத் தீவின் வரைபடம், உயர்த்திய கொடிகளுடன் ஒன்றாக நிற்கும் மக்கள் — இவை அனைத்தையும் எங்கள் சின்னம் ஒன்றிணைக்கிறது.',
    coloursTitle: 'எங்கள் நிறங்கள்',
    explore: {
      hint: 'ஒவ்வொரு நிறத்தையும் சின்னத்தையும் அறிய, படத்தின் மீது நகர்த்தவும், இழுக்கவும் அல்லது தொடவும்.',
      colour: 'நிறம்',
      symbol: 'சின்னம்',
      original: 'உள்ளபடி',
      choose: 'படத்தில் ஒரு நிறத்தை அல்லது சின்னத்தைத் தேர்ந்தெடுத்தால் அது எதைக் குறிக்கிறது என்பதைக் காணலாம்.',
      flagNote: 'உத்தியோகபூர்வ கொடி வடிவம் சேர்க்கப்பட்டதும் இங்கே தோன்றும்.',
    },
    symbols: {
      sun: { name: 'உதிக்கும் சூரியன்', p: 'எங்கள் சின்னத்தில் தீவின் பின்னால் உதிக்கும் சூரியன் தன் கதிர்களைப் பரப்புகிறது.' },
      island: { name: 'இலங்கைத் தீவு', p: 'எங்கள் சின்னத்தின் மையத்தில் இலங்கைத் தீவின் வரைபடம்.' },
      people: { name: 'மக்கள்', p: 'எங்கள் சின்னத்தின் அடிப்பகுதியில் உயர்த்திய கொடிகளுடன் ஒன்றாக நிற்கும் மக்கள்.' },
    },
    colours: [
      { name: 'மரூன்', token: 'primary', p: 'எங்கள் சின்னத்தினதும் ஒவ்வொரு உத்தியோகபூர்வ வெளியீட்டினதும் முதன்மை நிறம்.' },
      { name: 'பொன் மஞ்சள்', token: 'accent', p: 'எங்கள் சின்னத்தில் உதிக்கும் சூரியனின் நிறம்.' },
      { name: 'கிரீம் வெள்ளை', token: 'cream', p: 'எங்கள் நிறங்கள் நிற்கும் அடித்தளம்.' },
    ],
  },

  leadership: {
    label: 'தலைமைத்துவ மேலோட்டம்',
    intro: 'தேசியத் தலைமை முதல் ஒவ்வொரு மாவட்டம் வரை, உறுப்பினர்களுக்குப் பொறுப்புக்கூறும் பதவியாளர்களால் கட்சி வழிநடத்தப்படுகிறது.',
    groups: { party: 'கட்சித் தலைமை', org: 'அமைப்புத் தலைமை', regional: 'பிராந்தியத் தலைமை' },
    empty: 'விவரங்கள் விரைவில் வெளியிடப்படும்.',
    viewAll: 'முழுத் தலைமைத்துவத்தைக் காண்க',
    viewProfile: 'சுயவிவரத்தைக் காண்க',
    fullProfile: 'முழு சுயவிவரம்',
    close: 'மூடு',
    regionalEmpty: 'பிராந்தியத் தலைமைத்துவ விவரங்கள் விரைவில் வெளியிடப்படும்.',
    ctaTitle: 'மக்கள் சேவையில் தலைமைத்துவம்',
    ctaText: 'மக்களுக்குச் சேவை செய்யவும் அமைப்பை வலுப்படுத்தவும் ஒன்றிணைந்து பணியாற்றும் நபர்களையும் பிரதிநிதிகளையும் அறிந்துகொள்ளுங்கள்.',
    ctaButton: 'முழுத் தலைமைத்துவத்தைக் காண்க',
  },

  history: {
    label: 'வரலாறு மற்றும் மைல்கற்கள்',
    subtitle: 'காலத்தின் ஊடான பயணம்',
    intro: 'ஒற்றுமை மற்றும் நீதியின் தொலைநோக்குடன் நிறுவப்பட்ட எங்கள் கட்சி, இலங்கை முழுவதும் உள்ள சமூகங்களின் அபிலாஷைகளைப் பிரதிநிதித்துவப்படுத்தும் நாடு தழுவிய இயக்கமாக வளர்ந்துள்ளது.',
    items: [
      { year: 'ஆரம்பம்', t: 'தொடக்கம்', p: 'ஒழுங்கமைக்கப்பட்ட சாதாரண மக்கள் பொது வாழ்வின் திசையை மாற்ற முடியும் என்ற பகிரப்பட்ட நம்பிக்கையுடன் குடிமக்கள் சிலர் ஒன்றுகூடினர். முதல் கலந்துரையாடல்கள் சமூக மண்டபங்களிலும் வீடுகளிலும் நடைபெற்றன.', major: true },
      { year: 'வளர்ச்சி', t: 'இயக்கத்தைக் கட்டியெழுப்புதல்', p: 'செய்தி பரவியது, புதிய உறுப்பினர்கள் இணைந்தனர். மாவட்ட வலையமைப்புகள் உருவாகின, உள்ளூர்த் தலைவர்கள் தோன்றினர்; சில கிளைகளிலிருந்து தீவு முழுவதும் அறியப்பட்ட அமைப்பாகக் கட்சி வளர்ந்தது.' },
      { year: 'தேர்தல்கள்', t: 'தேர்தல்களில் போட்டியிடுதல்', p: 'பொறுப்புக்கூறல் மற்றும் சேவையின் அடிப்படையில் எங்கள் வேட்பாளர்கள் தேர்தல்களில் போட்டியிட்டனர். ஒவ்வொரு பிரசாரமும் எங்கள் வேர்களை ஆழப்படுத்தியது.' },
      { year: 'இன்று', t: 'தொடரும் இயக்கம்', p: 'இன்று எங்கள் இயக்கம் ஒவ்வொரு மாவட்டத்திலும் பரவியுள்ளது; அரசியல் ஒற்றுமை, நீதி மற்றும் பகிரப்பட்ட செழிப்புக்கான சக்தியாக இருக்க முடியும் என நம்பும் உறுப்பினர்களால் ஆதரிக்கப்படுகிறது.', major: true },
    ],
    closingTitle: 'எங்கள் பயணம் தொடர்கிறது',
    closing: 'எங்கள் வரலாறு எங்கள் அடித்தளத்தையும், கொள்கைகளையும், எதிர்காலத்தை நோக்கிய பயணத்தையும் பிரதிபலிக்கிறது.',
  },

  constitution: {
    label: 'அரசியலமைப்பு மற்றும் பொதுக் கொள்கைகள்',
    intro: 'எங்கள் கட்சி எவ்வாறு ஒழுங்கமைக்கப்படுகிறது, முடிவுகள் எவ்வாறு எடுக்கப்படுகின்றன, பொது வாழ்வில் நாங்கள் எதற்காக நிற்கிறோம் என்பதை நிர்வகிக்கும் ஆவணங்களும் கட்டமைப்புகளும்.',
    article: 'பிரிவு',
    constitutionTitle: 'கட்சி அரசியலமைப்பு',
    constitutionText: 'கட்சியின் அரசியலமைப்பு எங்கள் கட்டமைப்புகள், உறுப்புரிமை விதிகள் மற்றும் ஜனநாயக நடைமுறைகளை வரையறுக்கிறது.',
    structureTitle: 'அமைப்புக் கட்டமைப்பு',
    levels: [
      { t: 'தேசிய அமைப்பு', p: 'தேசியத் தலைமை மற்றும் கொள்கை வகுக்கும் அமைப்பு' },
      { t: 'மாகாண அமைப்பு', p: 'ஒன்பது மாகாணங்களிலும் ஒருங்கிணைப்பு' },
      { t: 'மாவட்ட அமைப்பு', p: 'மாவட்ட மட்ட அமைப்பு மற்றும் உறுப்புரிமை' },
      { t: 'உள்ளூர் அமைப்பு', p: 'கிளை மற்றும் சமூக மட்ட வலையமைப்புகள்' },
    ],
    policiesTitle: 'பொதுக் கொள்கைகள்',
    policiesText: 'ஒவ்வொரு துறையிலும் இலங்கைக்கான நடைமுறைத் திட்டங்களை எங்கள் கொள்கைகள் முன்வைக்கின்றன.',
    allPolicies: 'அனைத்துக் கொள்கைகளையும் காண்க',
    governanceTitle: 'ஆட்சிக் கொள்கைகள்',
    governanceText: 'மற்றவர்களிடம் நாங்கள் கேட்கும் தரங்களுக்கே நாங்களும் கட்டுப்படுகிறோம்: பொது அறிக்கைகளில் நேர்மை, எங்கள் வாக்குறுதிகளுக்குப் பொறுப்புக்கூறல், நாங்கள் சேவை செய்யும் ஒவ்வொரு சமூகத்திற்கும் மரியாதை.',
    documentsTitle: 'உத்தியோகபூர்வ ஆவணங்கள்',
    download: 'PDF பதிவிறக்கம்',
    viewDocuments: 'உத்தியோகபூர்வ ஆவணங்களைக் காண்க',
  },

  statements: {
    label: 'உத்தியோகபூர்வ அறிக்கைகள் மற்றும் பிரகடனங்கள்',
    intro: 'கட்சியால் வெளியிடப்பட்ட உத்தியோகபூர்வ அறிக்கைகளும் ஊடக அறிக்கைகளும், அண்மையவை முதலில்.',
    featured: 'சிறப்பு அறிக்கை',
    archive: 'அறிக்கைக் காப்பகம்',
    read: 'அறிக்கையைப் படிக்க',
    empty: 'இதுவரை உத்தியோகபூர்வ அறிக்கைகள் எதுவும் வெளியிடப்படவில்லை.',
    all: 'அனைத்து ஊடக அறிக்கைகள்',
  },
}

const SI = {
  title: 'අපගේ අනන්‍යතාව',
  subtitle: 'අනන්‍යතාව, මූලධර්ම සහ අරමුණේ ගමනක්.',
  chapter: 'පරිච්ඡේදය',
  chapters: 'පරිච්ඡේද අටක්',
  prev: 'පෙර',
  next: 'ඊළඟ',
  close: 'වසන්න',

  story: {
    label: 'අපගේ කතාව සහ පිහිටුවීම',
    hero: 'ජනතාවගේ ගමන',
    intro: 'සමානාත්මතාව, සමාජ සාධාරණත්වය සහ ජාතික සංවර්ධනය යන මූලධර්ම මත අපගේ පක්ෂය පිහිටුවන ලදී. සෑම පුරවැසියෙකුටම දියුණු වීමට අවස්ථාව ඇති ශ්‍රී ලංකාවක් ගොඩනැගීමට අපි සෑම දිස්ත්‍රික්කයකම කටයුතු කරමු.',
    paras: [
      'අපගේ කතාව ආරම්භ වන්නේ දේශපාලනය බලවතුන්ට නොව ජනතාවට සේවය කළ යුතු බව විශ්වාස කළ සාමාන්‍ය පුරවැසියන්ගෙනි. දශක ගණනාවක මහජන සේවය, ප්‍රජා සේවය සහ බොහෝ දෙනා පසුපසින් තැබූ ක්‍රමයක් කෙරෙහි වූ පොදු කලකිරීමෙන් උපන් අපගේ පක්ෂය වෙනසක් සඳහා වූ මාධ්‍යයක් ලෙස මතු විය.',
      'මුල් දිනවල සිටම අපි ගම්, නගර සහ මහනගරවල සංවිධානය වූයෙමු — ගුරුවරුන්, ගොවීන්, කම්කරුවන්, සිසුන් සහ පවුල්වලට සවන් දී, ඔවුන්ගේ ගැටලු මහජන අවකාශයට ගෙන ගියෙමු. කැපවූ ස්වේච්ඡා සේවකයන්ගේ කුඩා කණ්ඩායමක් ලෙස ආරම්භ වූ දෙය අද සෑම දිස්ත්‍රික්කයකම සාමාජිකයන් සිටින ජාතික ව්‍යාපාරයක් දක්වා වර්ධනය වී ඇත.',
    ],
    quote: 'අද පවා අපගේ කතාව ලියැවෙමින් පවතී — එක් දිස්ත්‍රික්කයක්, එක් ශාඛාවක්, එක් සංවාදයක් බැගින්.',
    timelineTitle: 'අපගේ ගමන — පරිච්ඡේද හයක්',
    archiveCaption: 'ඓතිහාසික ලේඛනාගාරය',
    formationTitle: 'පිහිටුවීම',
    formationTagline: 'නිහතමානී ආරම්භයක සිට ජාතික ව්‍යාපාරයක් දක්වා.',
    formationText: 'ක්‍රමය විසින් නොසලකා හරින ලද අයට හඬක් ලබා දීමට සහ විනිවිදභාවය, සහභාගීත්වය සහ සේවය තුළින් මහජන ජීවිතයේ විශ්වාසය නැවත ගොඩනැගීමට අපගේ පක්ෂය පිහිටුවන ලදී. ප්‍රජාවන් තුළ මුල් බැසගත් ව්‍යාපාරයකට එම විශ්වාසය යළි ඇති කළ හැකි බව අපි විශ්වාස කළෙමු.',
    items: [
      { t: 'ඓතිහාසික පසුබිම', p: 'ජාතික යහපත වෙනුවට පටු අවශ්‍යතාවලට සේවය කළ දේශපාලනයෙන් බොහෝ පුරවැසියන් වෙහෙසට පත් විය.' },
      { t: 'සමාජ පසුබිම', p: 'අධ්‍යාපනය, ගෞරවනීය රැකියා, සෞඛ්‍ය සේවා සහ වගකිවයුතු ආයතන — දිවයින පුරා ප්‍රජාවන් පොදු අරගලවලට මුහුණ දුන්නේය.' },
      { t: 'දේශපාලන පසුබිම', p: 'පළමුව සවන් දෙන, අවංකව පාලනය කරන සහ සෑම දිස්ත්‍රික්කයකටම සමානව සලකන නියෝජිතයන් පුරවැසියන්ට අවශ්‍ය විය.' },
      { t: 'පිහිටුවීමට හේතු', p: 'ක්‍රමය විසින් නොසලකා හරින ලද අයට හඬක් ලබා දීමට සහ විනිවිදභාවය, සහභාගීත්වය සහ සේවය තුළින් විශ්වාසය නැවත ගොඩනැගීමට.' },
      { t: 'ආරම්භක අරමුණු', p: 'සමාන අවස්ථා, සෑම ප්‍රතිපත්තියකම සමාජ සාධාරණත්වය, කිසිදු දිස්ත්‍රික්කයක් පසුපසින් නොතබන සංවර්ධනය සහ විවෘත, වගකිවයුතු දේශපාලනය.' },
      { t: 'මුල් සංවිධාන සංවර්ධනය', p: 'ස්වේච්ඡා ජාල, ප්‍රජා රැස්වීම් සහ නිවසින් නිවසට ගිය සම්බන්ධතා තුළින් දිස්ත්‍රික් ව්‍යුහයන් ශාඛාවෙන් ශාඛාව ගොඩනැගිණි.' },
    ],
  },

  vision: {
    label: 'දැක්ම සහ මෙහෙවර',
    intro: 'යාපනයේ හෝ ගාල්ලේ, නගරයේ හෝ ගමේ — සෑම පුරවැසියෙකුටම ගෞරවයෙන්, අවස්ථාවෙන් සහ බලාපොරොත්තුවෙන් ජීවත් විය හැකි ශ්‍රී ලංකාවක් අපගේ ආරම්භක දැක්ම විය.',
    visionLabel: 'අපගේ දැක්ම',
    visionText: 'සෑම ප්‍රජාවක්ම සමාන අයිතිවාසිකම්, අවස්ථා සහ ගෞරවය භුක්ති විඳින එක්සත්, සමෘද්ධිමත් සහ සාධාරණ ශ්‍රී ලංකාවක්.',
    visionMark: 'සමාන අයිතිවාසිකම්, අවස්ථා සහ ගෞරවය',
    missionLabel: 'අපගේ මෙහෙවර',
    missionText: 'සියලු ශ්‍රී ලාංකිකයන්ගේ ජීවිත වැඩිදියුණු කරන අවංක පාලනයක්, තිරසාර සංවර්ධනයක් සහ සියල්ලන් ඇතුළත් ප්‍රතිපත්ති ලබා දීම.',
    missionMark: 'අවංක පාලනයක්',
    missionParas: [
      'ආධිපත්‍යය නොව සේවය කරන මහජන ආයතන සහ බෙදීම නොව එක්සත් කරන දේශපාලනයක් අපි සිතුවෙමු.',
      'අධ්‍යාපනය, ආර්ථික අවස්ථා, අවංක පාලනය සහ අපගේ පොරොන්දු ඉටු කිරීමේ සරල විනය තුළින් එම දැක්ම ඉවසීමෙන් ගොඩනැගීමට අපි කැපවී සිටිමු.',
    ],
    closing: 'අප සැමට එක්ව වැඩ කරන ශ්‍රී ලංකාවක්.',
    beliefLabel: 'ආරම්භක විශ්වාසය',
    beliefText: 'සමානාත්මතාව, සමාජ සාධාරණත්වය සහ ජාතික සංවර්ධනය යන මූලධර්ම මත අපගේ පක්ෂය පිහිටුවන ලදී. සෑම පුරවැසියෙකුටම දියුණු වීමට අවස්ථාව ඇති ශ්‍රී ලංකාවක් අපි විශ්වාස කරමු.',
    commitLabel: 'අපගේ කැපවීම',
    commitText: 'ජනතාවට සේවය කිරීමට, විනිවිදභාවය ආරක්ෂා කිරීමට සහ සියලු ශ්‍රී ලාංකිකයන් සඳහා වඩා හොඳ අනාගතයක් ගොඩනැගීමට සෑම දිස්ත්‍රික්කයකම කටයුතු කිරීමට අපි කැපවී සිටිමු.',
  },

  principles: {
    label: 'මූලධර්ම සහ මතවාදය',
    intro: 'අපගේ ආරම්භක මූලධර්ම අප ගන්නා සෑම තීරණයක්ම මෙහෙයවන මාලිමාවයි.',
    items: [
      { t: 'සමානාත්මතාව', p: 'දිස්ත්‍රික්කය, භාෂාව, ආගම හෝ පසුබිම කුමක් වුවත් සෑම පුරවැසියෙකුම සමානව වැදගත් ය.' },
      { t: 'සමාජ සාධාරණත්වය', p: 'සංවර්ධනයේ ප්‍රතිලාභ වඩාත්ම අවශ්‍ය අය වෙත ළඟා විය යුතුය.' },
      { t: 'සංවර්ධනය', p: 'අප සැමට එක්ව වැඩ කරන ශ්‍රී ලංකාවක් ගොඩනැගීම.' },
      { t: 'එකමුතුකම', p: 'බෙදීම නොව එක්සත් කරන දේශපාලනය.' },
      { t: 'විනිවිදභාවය', p: 'මහජන ප්‍රකාශවල අවංකභාවය සහ අප දෙන සෑම පොරොන්දුවකටම වගවීම.' },
      { t: 'ජනතාව පළමුව', p: 'අප සේවය කරන සෑම ප්‍රජාවකටම ගෞරවය.' },
    ],
    closing: 'මේවා සටන් පාඨ නොවේ — ඕනෑම කෙනෙකුගේ විශ්වාසය ඉල්ලීමට පෙර අප අපටම පනවා ගන්නා කොන්දේසි වේ.',
  },

  symbol: {
    label: 'අපගේ ධජය සහ සංකේතයේ අර්ථ',
    intro: 'අපගේ ධජය සහ සංකේතය ව්‍යාපාරයේ අනන්‍යතාව දරයි — සෑම රැස්වීමකම, සෑම ශාඛාවකම සහ සෑම නිල ප්‍රකාශනයකම.',
    flagCaption: 'පක්ෂ ධජය',
    flagPending: 'නිල ධජ නිර්මාණය මෙහි ප්‍රදර්ශනය කෙරේ.',
    symbolTitle: 'පක්ෂ සංකේතය',
    symbolText: 'උදාවන හිරු, ශ්‍රී ලංකා දිවයිනේ සිතියම සහ ඔසවන ලද ධජ සමඟ එක්ව සිටින ජනතාව — අපගේ සංකේතය මේ සියල්ල එක් කරයි.',
    coloursTitle: 'අපගේ වර්ණ',
    explore: {
      hint: 'එක් එක් වර්ණය සහ සංකේතය ගවේෂණය කිරීමට, රූපය මත ගෙන යන්න, අදින්න හෝ තට්ටු කරන්න.',
      colour: 'වර්ණය',
      symbol: 'සංකේතය',
      original: 'දිස්වන ආකාරය',
      choose: 'රූපයේ වර්ණයක් හෝ සංකේතයක් තෝරා එය නිරූපණය කරන්නේ කුමක්දැයි බලන්න.',
      flagNote: 'නිල ධජ නිර්මාණය එක් කළ පසු මෙහි දිස්වේ.',
    },
    symbols: {
      sun: { name: 'උදාවන හිරු', p: 'අපගේ සංකේතයේ දිවයිනට පිටුපසින් උදාවන හිරු සිය කිරණ විහිදුවයි.' },
      island: { name: 'ශ්‍රී ලංකා දිවයින', p: 'අපගේ සංකේතයේ මධ්‍යයේ ශ්‍රී ලංකා දිවයිනේ සිතියම.' },
      people: { name: 'ජනතාව', p: 'අපගේ සංකේතයේ පාදමේ ඔසවන ලද ධජ සමඟ එක්ව සිටින ජනතාව.' },
    },
    colours: [
      { name: 'මෙරූන්', token: 'primary', p: 'අපගේ සංකේතයේ සහ සෑම නිල ප්‍රකාශනයකම ප්‍රධාන වර්ණය.' },
      { name: 'රන් කහ', token: 'accent', p: 'අපගේ සංකේතයේ උදාවන හිරුගේ වර්ණය.' },
      { name: 'ක්‍රීම් සුදු', token: 'cream', p: 'අපගේ වර්ණ රැඳී සිටින පදනම.' },
    ],
  },

  leadership: {
    label: 'නායකත්ව දළ විශ්ලේෂණය',
    intro: 'ජාතික නායකත්වයේ සිට සෑම දිස්ත්‍රික්කයක් දක්වාම, සාමාජිකයන්ට වගකිවයුතු නිලධාරීන් විසින් පක්ෂය මෙහෙයවනු ලැබේ.',
    groups: { party: 'පක්ෂ නායකත්වය', org: 'සංවිධාන නායකත්වය', regional: 'ප්‍රාදේශීය නායකත්වය' },
    empty: 'විස්තර ඉක්මනින් ප්‍රකාශයට පත් කෙරේ.',
    viewAll: 'සම්පූර්ණ නායකත්වය බලන්න',
    viewProfile: 'පැතිකඩ බලන්න',
    fullProfile: 'සම්පූර්ණ පැතිකඩ',
    close: 'වසන්න',
    regionalEmpty: 'ප්‍රාදේශීය නායකත්ව පැතිකඩ ඉක්මනින් ප්‍රකාශයට පත් කෙරේ.',
    ctaTitle: 'ජනතා සේවයේ නායකත්වය',
    ctaText: 'ජනතාවට සේවය කිරීමට සහ සංවිධානය ශක්තිමත් කිරීමට එක්ව කටයුතු කරන පුද්ගලයන් සහ නියෝජිතයන් හඳුනා ගන්න.',
    ctaButton: 'සම්පූර්ණ නායකත්වය ගවේෂණය කරන්න',
  },

  history: {
    label: 'ඉතිහාසය සහ සන්ධිස්ථාන',
    subtitle: 'කාලය හරහා ගමන',
    intro: 'එකමුතුකම සහ සාධාරණත්වය පිළිබඳ දැක්මකින් පිහිටුවන ලද අපගේ පක්ෂය, ශ්‍රී ලංකාව පුරා ප්‍රජාවන්ගේ අපේක්ෂාවන් නියෝජනය කරන ජාතික ව්‍යාපාරයක් දක්වා වර්ධනය වී ඇත.',
    items: [
      { year: 'ආරම්භය', t: 'පටන් ගැනීම', p: 'අවංකව සංවිධානය වූ සාමාන්‍ය ජනතාවට මහජන ජීවිතයේ දිශාව වෙනස් කළ හැකිය යන පොදු විශ්වාසයෙන් පුරවැසියන් කුඩා පිරිසක් එක්රැස් වූහ. පළමු සාකච්ඡා ප්‍රජා ශාලාවල සහ නිවෙස්වල පැවැත්විණි.', major: true },
      { year: 'වර්ධනය', t: 'ව්‍යාපාරය ගොඩනැගීම', p: 'පණිවිඩය පැතිරුණු අතර නව සාමාජිකයන් එක් වූහ. දිස්ත්‍රික් ජාල බිහි වූ අතර ප්‍රාදේශීය නායකයන් මතු වූහ; ශාඛා කිහිපයක සිට දිවයින පුරා හඳුනාගත් සංවිධානයක් දක්වා පක්ෂය වර්ධනය විය.' },
      { year: 'මැතිවරණ', t: 'මැතිවරණවලට තරඟ කිරීම', p: 'වගවීම සහ සේවය මත පදනම්ව අපගේ අපේක්ෂකයන් මැතිවරණවලට තරඟ කළහ. සෑම ව්‍යාපාරයක්ම අපගේ මුල් ගැඹුරු කළේය.' },
      { year: 'අද', t: 'ඉදිරියට යන ව්‍යාපාරය', p: 'අද අපගේ ව්‍යාපාරය සෑම දිස්ත්‍රික්කයකම ව්‍යාප්ත වී ඇති අතර, දේශපාලනය එකමුතුකම, සාධාරණත්වය සහ හවුල් සමෘද්ධිය සඳහා බලවේගයක් විය හැකි යැයි විශ්වාස කරන සාමාජිකයන්ගේ සහාය ලබයි.', major: true },
    ],
    closingTitle: 'අපගේ ගමන දිගටම',
    closing: 'අපගේ ඉතිහාසය අපගේ පදනම, මූලධර්ම සහ අනාගතය දෙසට වූ ගමන පිළිබිඹු කරයි.',
  },

  constitution: {
    label: 'ව්‍යවස්ථාව සහ මහජන ප්‍රතිපත්ති',
    intro: 'අපගේ පක්ෂය සංවිධානය වී ඇති ආකාරය, තීරණ ගනු ලබන ආකාරය සහ මහජන ජීවිතයේ අප පෙනී සිටින්නේ කුමක් සඳහාද යන්න පාලනය කරන ලේඛන සහ ව්‍යුහයන්.',
    article: 'වගන්තිය',
    constitutionTitle: 'පක්ෂ ව්‍යවස්ථාව',
    constitutionText: 'පක්ෂ ව්‍යවස්ථාව අපගේ ව්‍යුහයන්, සාමාජිකත්ව නීති සහ ප්‍රජාතන්ත්‍රවාදී ක්‍රියාවලීන් නිර්වචනය කරයි.',
    structureTitle: 'සංවිධාන ව්‍යුහය',
    levels: [
      { t: 'ජාතික සංවිධානය', p: 'ජාතික නායකත්වය සහ ප්‍රතිපත්ති සම්පාදන මණ්ඩලය' },
      { t: 'පළාත් සංවිධානය', p: 'පළාත් නවයේම සම්බන්ධීකරණය' },
      { t: 'දිස්ත්‍රික් සංවිධානය', p: 'දිස්ත්‍රික් මට්ටමේ සංවිධානය සහ සාමාජිකත්වය' },
      { t: 'ප්‍රාදේශීය සංවිධානය', p: 'ශාඛා සහ ප්‍රජා මට්ටමේ ජාල' },
    ],
    policiesTitle: 'මහජන ප්‍රතිපත්ති',
    policiesText: 'සෑම අංශයකම ශ්‍රී ලංකාව සඳහා ප්‍රායෝගික සැලසුම් අපගේ ප්‍රතිපත්ති ඉදිරිපත් කරයි.',
    allPolicies: 'සියලු ප්‍රතිපත්ති බලන්න',
    governanceTitle: 'පාලන මූලධර්ම',
    governanceText: 'අප අන් අයගෙන් ඉල්ලා සිටින ප්‍රමිතීන්ටම අපද බැඳී සිටිමු: මහජන ප්‍රකාශවල අවංකභාවය, අපගේ පොරොන්දුවලට වගවීම සහ අප සේවය කරන සෑම ප්‍රජාවකටම ගෞරවය.',
    documentsTitle: 'නිල ලේඛන',
    download: 'PDF බාගන්න',
    viewDocuments: 'නිල ලේඛන බලන්න',
  },

  statements: {
    label: 'නිල ප්‍රකාශ සහ ප්‍රකාශන',
    intro: 'පක්ෂය විසින් නිකුත් කරන ලද නිල ප්‍රකාශ සහ මාධ්‍ය නිවේදන, නවතම ඒවා මුලින්.',
    featured: 'විශේෂ ප්‍රකාශය',
    archive: 'ප්‍රකාශ ලේඛනාගාරය',
    read: 'ප්‍රකාශය කියවන්න',
    empty: 'තවමත් නිල ප්‍රකාශ කිසිවක් ප්‍රකාශයට පත් කර නැත.',
    all: 'සියලු මාධ්‍ය නිවේදන',
  },
}

export const IDENTITY = { en: EN, ta: TA, si: SI }
export default IDENTITY
