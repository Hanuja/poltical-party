// Public policy content is maintained in this file. PDF paths must point to
// real files placed under frontend/public so the links work in production.
// Keep documents empty until approved, complete PDFs are available.
export const policyCategories = [
  { slug: 'economy', title: 'Economy', focus: 'economic policy and the national economy' },
  { slug: 'education', title: 'Education', focus: 'education and learning' },
  { slug: 'healthcare', title: 'Healthcare', focus: 'healthcare and public health' },
  { slug: 'agriculture', title: 'Agriculture', focus: 'agriculture and rural livelihoods' },
  { slug: 'employment', title: 'Employment', focus: 'employment and decent work' },
  { slug: 'infrastructure', title: 'Infrastructure', focus: 'public infrastructure and connectivity' },
  { slug: 'environment', title: 'Environment', focus: 'environmental protection and sustainability' },
  { slug: 'youth-development', title: 'Youth Development', focus: 'young people and youth development' },
  { slug: 'women-development', title: "Women's Development", focus: "women's rights and development" },
  { slug: 'social-welfare', title: 'Social Welfare', focus: 'social protection and welfare' },
  { slug: 'national-development', title: 'National Development', focus: 'national development' },
  { slug: 'tamil-community-rights', title: 'Tamil Community Rights', focus: 'Tamil community rights' },
  { slug: 'language-rights', title: 'Language Rights', focus: 'language rights and access' },
  { slug: 'provincial-development', title: 'Provincial Development', focus: 'provincial development and governance' },
].map(category => ({
  ...category,
  introduction: `Published party material on ${category.focus} will be collected in this section.`,
  overview: '',
  vision: '',
  objectives: [],
  sections: [],
  documents: [],
}))

export const getPolicyCategory = (slug) => policyCategories.find(category => category.slug === slug)

export const getPolicyDocument = (id) => policyCategories
  .flatMap(category => category.documents.map(document => ({ ...document, category })))
  .find(document => document.id === id)
