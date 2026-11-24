import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { setPageSEO } from '../utils/seo'
import Breadcrumb from '../components/Breadcrumb'
import { policyCategories } from '../data/policies'
import {
  ArrowDownToLine, ArrowUpRight, BriefcaseBusiness, Building2, Coins,
  FileText, Flag, GraduationCap, HandHeart, HeartPulse, Languages, Leaf,
  Map, Scale, Wheat, Users, UserRound,
} from 'lucide-react'
import '../styles/policies.css'

const categoryIcons = {
  economy: Coins,
  education: GraduationCap,
  healthcare: HeartPulse,
  agriculture: Wheat,
  employment: BriefcaseBusiness,
  infrastructure: Building2,
  environment: Leaf,
  'youth-development': Users,
  'women-development': UserRound,
  'social-welfare': HandHeart,
  'national-development': Flag,
  'tamil-community-rights': Scale,
  'language-rights': Languages,
  'provincial-development': Map,
}

export default function Policies() {
  const { t, language } = useLanguage()
  const [params, setParams] = useSearchParams()
  const requestedCategory = params.get('category')
  const selected = policyCategories.find(category => category.slug === requestedCategory) || policyCategories[0]

  useEffect(() => {
    setPageSEO({
      title: `${categoryLabel(selected)} | ${t('policies.title')}`,
      description: t('home.policiesText'),
    })
  }, [t, language, selected.slug])

  const categoryLabel = (category) => t(`policies.categoryLabels.${category.slug}`, { defaultValue: category.title })

  const selectCategory = (slug) => setParams({ category: slug }, { replace: false })

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.policies') }]} />
      <main className="section policy-library">
        <div className="container">
          <div className="policy-library-layout">
            <aside className="policy-sidebar" aria-label={t('policies.categoryNavigation', { defaultValue: 'Policy categories' })}>
              <p className="policy-sidebar-label">{t('policies.categoryNavigation', { defaultValue: 'Policy categories' })}</p>
              <nav className="policy-category-list" aria-label={t('policies.categoryNavigation', { defaultValue: 'Policy categories' })}>
                {policyCategories.map((category, index) => {
                  const Icon = categoryIcons[category.slug] || FileText
                  const active = selected.slug === category.slug
                  return (
                    <button
                      className={`policy-category-button${active ? ' is-active' : ''}`}
                      key={category.slug}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => selectCategory(category.slug)}
                    >
                      <span className="policy-category-number">{String(index + 1).padStart(2, '0')}</span>
                      <Icon size={17} aria-hidden="true" />
                      <span>{categoryLabel(category)}</span>
                      <ArrowUpRight size={15} className="policy-category-arrow" aria-hidden="true" />
                    </button>
                  )
                })}
              </nav>
            </aside>

            <article className="policy-content" key={selected.slug}>
              <header className="policy-content-heading">
                <p className="policy-eyebrow">{t('policies.title')}</p>
                <h1>{categoryLabel(selected)}</h1>
                <span className="policy-heading-rule" aria-hidden="true" />
                <p className="policy-introduction">{selected.introduction}</p>
              </header>

              {selected.overview && (
                <section className="policy-copy-section">
                  <h2>{t('policies.overview', { defaultValue: 'Policy overview' })}</h2>
                  <p>{selected.overview}</p>
                </section>
              )}

              {(selected.vision || selected.objectives?.length > 0) && (
                <section className="policy-vision-grid">
                  {selected.vision && <div className="policy-vision-card"><h2>{t('policies.vision', { defaultValue: 'Vision' })}</h2><p>{selected.vision}</p></div>}
                  {selected.objectives?.length > 0 && <div className="policy-vision-card"><h2>{t('policies.objectives', { defaultValue: 'Objectives' })}</h2><ul>{selected.objectives.map(item => <li key={item}>{item}</li>)}</ul></div>}
                </section>
              )}

              {selected.sections?.length > 0 && (
                <section className="policy-copy-section policy-key-sections">
                  <h2>{t('policies.keySections', { defaultValue: 'Key policy sections' })}</h2>
                  {selected.sections.map(section => <div className="policy-detail-section" key={section.title}><h3>{section.title}</h3><p>{section.body}</p></div>)}
                </section>
              )}

              <section className="policy-document-section" aria-labelledby="policy-documents-title">
                <div className="policy-documents-heading">
                  <div>
                    <p className="policy-eyebrow">{t('policies.manifestoTitle', { defaultValue: 'Documents' })}</p>
                    <h2 id="policy-documents-title">{t('policies.documents', { defaultValue: 'Policy documents' })}</h2>
                  </div>
                  <span className="policy-document-count">{String(selected.documents.length).padStart(2, '0')}</span>
                </div>

                {selected.documents.length ? (
                  <div className="policy-document-list">
                    {selected.documents.map(document => (
                      <article className="policy-document" key={document.id}>
                        <span className="policy-pdf-icon"><FileText size={21} aria-hidden="true" /><small>PDF</small></span>
                        <div className="policy-document-copy">
                          <h3>{document.title}</h3>
                          {document.description && <p>{document.description}</p>}
                          <span className="policy-language-tag">{document.language}</span>
                        </div>
                        <div className="policy-document-actions">
                          <a href={document.path} target="_blank" rel="noreferrer" className="policy-view-link">{t('policies.viewPdf', { defaultValue: 'View PDF' })}<ArrowUpRight size={15} /></a>
                          <a href={document.path} download className="policy-download-link" aria-label={`${t('policies.downloadPdf', { defaultValue: 'Download PDF' })}: ${document.title}`}><ArrowDownToLine size={16} />{t('policies.downloadPdf', { defaultValue: 'Download' })}</a>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="policy-empty-documents">
                    <FileText size={22} aria-hidden="true" />
                    <p>{t('policies.noDocuments', { defaultValue: 'No published documents are available in this category yet.' })}</p>
                  </div>
                )}
              </section>
            </article>
          </div>
        </div>
      </main>
    </>
  )
}
