// Manual trilingual content for Our Story & Formation page.
// ta/si bodies fall back to en until full translations are added.
const EN = {
  eyebrow: 'Our Identity',
  heroTitle: 'A Journey of the People',
  heroAccent: 'Journey',
  pageTitle: 'Our Story & Formation',
  heroP1: 'Our party was founded on the principles of equality, social justice and national development. We work across every district to build a Sri Lanka where every citizen has the opportunity to thrive.',
  heroP2: 'Founded with a vision of unity and justice, our party has grown into a movement representing the aspirations of communities across Sri Lanka.',
  story: {
    title: 'Our Story',
    paras: [
      'Our story begins with ordinary citizens who believed that politics should serve the people, not the powerful. Born from decades of public service, community work and a shared frustration with a system that left too many behind, our party emerged as a vehicle for change.',
      'From its earliest days, we have organised in villages, towns and cities — listening to teachers, farmers, workers, students and families, and carrying their concerns into the public square. What began as a small circle of committed volunteers has grown into a nationwide movement with members in every district.',
      'Our journey has not been easy. We have faced setbacks, scepticism and moments of doubt. Yet every challenge strengthened our resolve, because the communities we represent kept showing us why this work matters. Today, our story is still being written — one district, one branch, one conversation at a time.',
    ],
  },
  formation: {
    title: 'Formation Background',
    items: [
      { n: '01', t: 'Historical Background', p: 'Sri Lanka’s recent history has been marked by division, conflict and missed opportunities for shared prosperity. Many citizens grew weary of politics that served narrow interests rather than the national good.' },
      { n: '02', t: 'Social Background', p: 'Across the island, communities face common struggles — access to quality education, dignified work, healthcare and accountable public institutions. These shared concerns created fertile ground for a new kind of political organisation.' },
      { n: '03', t: 'Political Background', p: 'Existing political formations were seen by many as disconnected from grassroots realities. Citizens wanted representatives who listened first and governed honestly, and who treated every district with equal seriousness.' },
      { n: '04', t: 'Reasons for Formation', p: 'Our party was formed to give voice to those the system had overlooked — to rebuild trust in public life through transparency, participation and service. We believed a movement rooted in communities could restore that trust.' },
      { n: '05', t: 'Founding Objectives', p: 'Our founding objectives were clear: equality of opportunity for every citizen, social justice in every policy, national development that leaves no district behind, and politics conducted openly and accountably.' },
      { n: '06', t: 'Early Organizational Development', p: 'The early organisation grew through volunteer networks, community meetings and door-to-door outreach. District structures were built patiently, branch by branch, placing members at the heart of decision-making.' },
    ],
  },
  principles: {
    title: 'Founding Principles',
    paras: [
      'Our founding principles are the compass that guides every decision we make. Equality means every citizen matters equally — regardless of district, language, religion or background. Social justice means the benefits of development reach those who need them most. National development means building a Sri Lanka that works for all of us together.',
      'We hold ourselves to the standards we ask of others: honesty in public statements, accountability for our promises, and respect for every community we serve. These are not slogans — they are the conditions we set for ourselves before asking for anyone’s trust.',
    ],
  },
  vision: {
    title: 'Our Founding Vision',
    paras: [
      'We imagined public institutions that serve rather than dominate, and politics that unites rather than divides.',
      'We committed then, as we commit now, to building that vision patiently: through education, through economic opportunity, through honest governance and through the simple discipline of keeping our promises to the people who placed their faith in us.',
    ],
  },
  journey: {
    title: 'Our Historical Journey',
    items: [
      { year: 'Founding', t: 'The Beginning', p: 'A small group of citizens gathered with a shared conviction: that ordinary people, organised honestly, could change the direction of public life. The first discussions were held in community halls and living rooms.' },
      { year: 'Growth', t: 'Building the Movement', p: 'Word spread, and with it new members. District networks formed, local leaders emerged, and the party’s presence grew from a handful of branches to a recognisable organisation across the island.' },
      { year: 'Milestones', t: 'Standing in Elections', p: 'Our candidates contested elections on platforms of accountability and service. Each campaign deepened our roots and taught us to listen more closely to the people we sought to represent.' },
      { year: 'Today', t: 'A Movement Continues', p: 'Today our movement spans every district, supported by verified members who believe that politics can be a force for unity, justice and shared prosperity.' },
    ],
  },
  closing: {
    title: 'Our Journey Continues',
    p: 'Our history reflects our foundation, our principles and our journey towards the future.',
  },
}

const TA = {
  eyebrow: 'எங்கள் அடையாளம்',
  heroTitle: 'மக்களின் பயணம்',
  heroAccent: 'பயணம்',
  pageTitle: 'எங்கள் தோற்றம் மற்றும் உருவாக்கம்',
  heroP1: EN.heroP1,
  heroP2: EN.heroP2,
  story: { title: 'எங்கள் கதை', paras: EN.story.paras },
  formation: { title: 'கட்சியின் உருவாக்கப் பின்னணி', items: EN.formation.items },
  principles: { title: 'ஸ்தாபக அடிப்படைக் கொள்கைகள்', paras: EN.principles.paras },
  vision: { title: 'எங்கள் ஆரம்பகால தொலைநோக்குப் பார்வை', paras: EN.vision.paras },
  journey: { title: 'எங்கள் வரலாற்றுப் பயணம்', items: EN.journey.items },
  closing: { title: 'எங்கள் பயணம் தொடர்கிறது', p: EN.closing.p },
}

const SI = {
  eyebrow: 'අපගේ අනන්‍යතාව',
  heroTitle: 'ජනතාවේ ගමන',
  heroAccent: 'ගමන',
  pageTitle: 'අපගේ උපචාරය සහ පිහිටුවීම',
  heroP1: EN.heroP1,
  heroP2: EN.heroP2,
  story: { title: 'අපගේ කථාව', paras: EN.story.paras },
  formation: { title: 'සංවිධාන පසුබිම', items: EN.formation.items },
  principles: { title: 'ආරම්භක මූලධර්ම', paras: EN.principles.paras },
  vision: { title: 'අපගේ ආරම්භක දර්ශනය', paras: EN.vision.paras },
  journey: { title: 'අපගේ ඓතිහාසික ගමන', items: EN.journey.items },
  closing: { title: 'අපගේ ගමන දිගටම කරයි', p: EN.closing.p },
}

export const STORY = { en: EN, ta: TA, si: SI }
export default STORY
