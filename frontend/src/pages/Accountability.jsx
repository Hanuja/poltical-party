import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import {
  ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Banknote, BookOpenCheck,
  Check, ChevronDown, CircleHelp, ClipboardCheck, FileSearch,
  FileText, MapPin, MessageCircle, Search, ShieldCheck, Sparkles, Timer,
  WalletCards,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { getLeadershipMeta } from '../services/content'
import PageBanner from '../components/PageBanner'
import { setPageSEO } from '../utils/seo'
import '../styles/accountability.css'

const SECTIONS = [
  ['commitments', 'Promise tracker'], ['areas', 'Area scorecards'], ['finance', 'Public budget'],
  ['funding', 'Funding transparency'], ['reports', 'Performance reports'], ['library', 'Evidence library'],
  ['corrections', 'Corrections register'], ['questions', 'Public questions'],
]
const EMPTY = 'Information not yet published.'
const PAGE_TITLES = {
  en: 'Accountability & Transparency',
  ta: 'பொறுப்புக்கூறல் மற்றும் வெளிப்படைத்தன்மை',
  si: 'වගවීම සහ විනිවිදභාවය',
}
const INDICATORS = [
  { label: 'Public commitments', Icon: ClipboardCheck, note: 'Published commitments available to track' },
  { label: 'Projects reported', Icon: MapPin, note: 'Projects with public progress updates' },
  { label: 'Published reports', Icon: BookOpenCheck, note: 'Reports and official documents' },
  { label: 'Public questions answered', Icon: MessageCircle, note: 'Questions with a published response' },
]
const PILLARS = [
  { n: '01', title: 'Promises you can follow', text: 'Commitments should be published with clear milestones, owners and updates.', Icon: Check, href: '#commitments' },
  { n: '02', title: 'Resources you can understand', text: 'Budgets and reported expenditure belong in the public record.', Icon: WalletCards, href: '#finance' },
  { n: '03', title: 'Corrections that stay visible', text: 'When information changes, the reason and history should remain accessible.', Icon: FileSearch, href: '#corrections' },
]

function EmptyNotice({ children = EMPTY }) {
  return <div className="ac-empty"><span className="ac-empty-mark"><FileSearch size={19} /></span><p>{children}</p></div>
}

function SectionHeading({ eyebrow, title, text, index }) {
  return <motion.div className="ac-section-head" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .55 }}>
    <div className="ac-section-kicker"><span>{index}</span><i />{eyebrow}</div>
    <h2>{title}</h2><p>{text}</p>
  </motion.div>
}

export default function Accountability() {
  const { language } = useLanguage()
  const pageTitle = PAGE_TITLES[language] || PAGE_TITLES.en
  const [active, setActive] = useState('commitments')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [province, setProvince] = useState('northern')
  const [district, setDistrict] = useState('')
  const [documentQuery, setDocumentQuery] = useState('')
  const [documentCategory, setDocumentCategory] = useState('')
  const [documentYear, setDocumentYear] = useState('')
  const [geo, setGeo] = useState({ provinces: [], districts: [] })

  useEffect(() => { setPageSEO({ title: pageTitle, description: 'Public commitments, project progress, official reports, public resources and corrections.' }) }, [language, pageTitle])
  useEffect(() => { let live = true; getLeadershipMeta().then((data) => { if (live) setGeo({ provinces: data.provinces || [], districts: data.districts || [] }) }).catch(() => {}); return () => { live = false } }, [])
  useEffect(() => {
    const nodes = document.querySelectorAll('.ac-section[id]')
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActive(visible.target.id)
    }, { rootMargin: '-25% 0px -65% 0px' })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
  const areaDistricts = useMemo(() => geo.districts.filter((d) => d.province === province), [geo.districts, province])

  const jump = (id) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }
  const filteredCount = useMemo(() => [search, category, status, district].filter(Boolean).length, [search, category, status, district])

  return <MotionConfig reducedMotion="user">
    <div className="ac-page">
      <PageBanner breadcrumbItems={[{ label: pageTitle }]} />
      <section className="ac-hero">
        <div className="ac-wrap ac-hero-grid">
          <div className="ac-hero-copy">
            <div className="ac-language-row"><LanguageSwitcher /></div>
            <div className="ac-eyebrow"><span className="ac-live-dot" />PUBLIC ACCOUNTABILITY</div>
            <h1>{language === 'en' ? <><em>Accountability</em><br /><span className="ac-and">&amp; Transparency</span></> : pageTitle}</h1>
            <p className="ac-lead">Public trust begins with accountability. Every commitment should be measurable, every project should be transparent, and every citizen deserves to know the progress.</p>
            <p className="ac-support">Accountability is not simply a promise. It is an ongoing responsibility to the people.</p>
            <div className="ac-hero-actions"><button className="ac-button ac-button-dark" onClick={() => jump('commitments')}>Explore our commitments <ArrowDown size={16} /></button><button className="ac-button ac-button-outline" onClick={() => jump('reports')}>View public reports <ArrowUpRight size={16} /></button></div>
            <div className="ac-trust-note"><ShieldCheck size={17} /><span>Information is presented as officially reported, independently verified or independently audited.</span></div>
          </div>
          <motion.div className="ac-hero-art" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .8, delay: .15 }} aria-label="Editorial illustration of public reporting">
            <div className="ac-art-index">PUBLIC RECORD <span>SECTION 07</span></div>
            <div className="ac-art-paper ac-paper-back"><i /><i /><i /></div>
            <div className="ac-art-paper ac-paper-front">
              <div className="ac-paper-top"><span className="ac-paper-seal"><ShieldCheck size={18} /></span><span>OPEN<br />RECORD</span></div>
              <div className="ac-paper-title">A record<br />you can trust.</div>
              <div className="ac-paper-lines"><i /><i /><i /><i /></div>
              <div className="ac-paper-foot"><span>PUBLIC ACCOUNTABILITY</span><ArrowUpRight size={16} /></div>
            </div>
            <div className="ac-art-progress"><span className="ac-progress-ring"><span>—</span></span><div><b>Progress, made visible.</b><small>Published updates will appear here.</small></div></div>
            <div className="ac-art-caption">COMMITMENTS · EVIDENCE · ANSWERS</div>
          </motion.div>
        </div>
        <div className="ac-wrap ac-hero-foot"><span>TRANSPARENCY IS A PRACTICE</span><span>Scroll to explore <ArrowDown size={14} /></span></div>
      </section>

      <section className="ac-glance" aria-labelledby="ac-glance-title">
        <div className="ac-wrap"><div className="ac-glance-head"><div><span className="ac-label">AT A GLANCE</span><h2 id="ac-glance-title">The public record, today.</h2></div><p>Only published information is shown. Figures will appear when source records are available.</p></div>
          <div className="ac-stat-grid">{INDICATORS.map(({ label, Icon, note }, i) => <motion.article className="ac-stat" key={label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08, duration: .4 }}><div className="ac-stat-top"><span>0{i + 1}</span><Icon size={19} /></div><strong>—</strong><h3>{label}</h3><p>{EMPTY}</p><small>{note}</small></motion.article>)}</div>
        </div>
      </section>

      <nav className="ac-subnav" aria-label="Accountability sections"><div className="ac-wrap ac-subnav-inner"><span className="ac-subnav-label">EXPLORE</span>{SECTIONS.map(([id, label]) => <button key={id} className={active === id ? 'is-active' : ''} onClick={() => jump(id)}>{label}</button>)}</div></nav>

      <main className="ac-wrap ac-main">
        <section className="ac-principles" aria-label="Our accountability principles">{PILLARS.map(({ n, title, text, Icon, href }, i) => <motion.a className="ac-pillar" href={href} key={n} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .07 }}><span className="ac-pillar-no">{n}</span><Icon size={20} /><h3>{title}</h3><p>{text}</p><span className="ac-pillar-link">Explore <ArrowRight size={15} /></span></motion.a>)}</section>

        <section className="ac-section" id="commitments">
          <SectionHeading index="01" eyebrow="PROMISE TRACKER" title="Our promises. Our progress." text="Follow published commitments and see the milestones, evidence and updates behind each one." />
          <div className="ac-filter-panel"><div className="ac-filter-title"><span>FIND A COMMITMENT</span><small>{filteredCount ? `${filteredCount} filters applied` : 'Search the public record'}</small></div><div className="ac-filters"><label className="ac-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search promise title" /></label><label><span className="sr-only">Category</span><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option><option>Education</option><option>Healthcare</option><option>Infrastructure</option><option>Agriculture</option></select><ChevronDown size={14} /></label><label><span className="sr-only">Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Not started</option><option>Planning</option><option>In progress</option><option>Delayed</option><option>Completed</option><option>On hold</option></select><ChevronDown size={14} /></label><label><span className="sr-only">Province</span><select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict('') }}><option value="">All areas</option>{geo.provinces.filter((p) => ['northern', 'eastern'].includes(p.key)).map((p) => <option key={p.key} value={p.key}>{p.labels?.[language] || p.labels?.en}</option>)}</select><ChevronDown size={14} /></label><label><span className="sr-only">District</span><select value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">All districts</option>{areaDistricts.map((d) => <option key={d.key} value={d.key}>{d.labels?.[language] || d.labels?.en}</option>)}</select><ChevronDown size={14} /></label></div><EmptyNotice>Commitments matching these filters have not yet been published.</EmptyNotice></div>
          <div className="ac-project-note"><Timer size={18} /><div><b>Milestones and project updates</b><span>Target dates, actual completion, supporting evidence and update history will be displayed with each published commitment.</span></div><span className="ac-status-pill">AWAITING PUBLIC RECORDS</span></div>
        </section>

        <section className="ac-section ac-section-soft" id="areas">
          <SectionHeading index="02" eyebrow="AREA SCORECARDS" title="Every area. Every project. Every responsibility." text="Explore published project and financial reporting across the Northern and Eastern Provinces." />
          <div className="ac-area-bar"><div><span className="ac-label">SELECT A PROVINCE</span><div className="ac-area-tabs">{geo.provinces.filter((p) => ['northern', 'eastern'].includes(p.key)).map((p) => <button className={province === p.key ? 'is-active' : ''} key={p.key} onClick={() => { setProvince(p.key); setDistrict('') }}>{p.labels?.[language] || p.labels?.en}</button>)}</div></div><label className="ac-area-select"><span>District</span><select value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">All districts</option>{areaDistricts.map((d) => <option key={d.key} value={d.key}>{d.labels?.[language] || d.labels?.en}</option>)}</select></label></div>
          <div className="ac-score-grid">{['Published projects', 'Completed', 'In progress', 'Delayed'].map((label, i) => <div className="ac-score" key={label}><span>0{i + 1}</span><b>—</b><strong>{label}</strong><small>{EMPTY}</small></div>)}</div>
          <div className="ac-area-empty"><MapPin size={21} /><div><b>{district ? areaDistricts.find((d) => d.key === district)?.labels?.[language] : (geo.provinces.find((p) => p.key === province)?.labels?.[language] || 'Selected area')}</b><span>Project totals, budget allocations and reported expenditure will appear when published.</span></div><span className="ac-unavailable">NOT YET REPORTED</span></div>
          <p className="ac-method-note"><BadgeCheck size={15} /> No composite or political performance score is calculated. Each metric will be reported with its source and calculation method.</p>
        </section>

        <section className="ac-section" id="finance">
          <SectionHeading index="03" eyebrow="PUBLIC BUDGET & EXPENDITURE" title="Where public resources go." text="See how published allocations are reported, used and accounted for, with the financial year and reporting period clearly identified." />
          <div className="ac-finance-grid"><article className="ac-chart-card"><div className="ac-card-heading"><div><span className="ac-label">BUDGET VS EXPENDITURE</span><h3>Reported financial position</h3></div><Banknote size={20} /></div><div className="ac-chart-empty"><div className="ac-chart-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="ac-chart-placeholder"><span /><span /><span /><span /><p>Financial data not yet published</p></div></div><div className="ac-legend"><span><i className="ac-legend-budget" />Published allocation</span><span><i className="ac-legend-spent" />Reported expenditure</span></div></article><article className="ac-finance-note"><span className="ac-note-icon"><ShieldCheck size={21} /></span><h3>Clear labels matter.</h3><p>Published allocations, approved budgets, reported expenditure and independently audited figures are distinct. Reports will identify which measure is shown and cite its source.</p><div className="ac-currency-note">Currency format <b>LKR</b></div><EmptyNotice /></article></div>
          <div className="ac-report-strip"><span className="ac-file-icon"><FileText size={20} /></span><div><b>Financial reports</b><span>Financial year, reporting period, department, publication date and source document.</span></div><span className="ac-coming">{EMPTY}</span></div>
        </section>

        <section className="ac-section ac-section-ink" id="funding">
          <SectionHeading index="04" eyebrow="FUNDING TRANSPARENCY" title="Transparency in every resource." text="Understand disclosed funding sources, allocations and reported outcomes. Confirmed, proposed and anticipated funding will be clearly distinguished." />
          <div className="ac-funding-grid">{['Funding source', 'Amount received', 'Amount allocated', 'Reported expenditure'].map((label, i) => <div className="ac-funding-item" key={label}><span>0{i + 1}</span><Sparkles size={17} /><b>{label}</b><strong>—</strong><small>{EMPTY}</small></div>)}</div>
          <div className="ac-funding-footer"><WalletCards size={19} /><span>Purpose, financial year, related projects and source documents will accompany each published funding record.</span><span className="ac-status-pill">NO FIGURES ASSUMED</span></div>
        </section>

        <section className="ac-section" id="reports">
          <SectionHeading index="05" eyebrow="PERFORMANCE REPORTS" title="What has been done. What remains." text="Read official performance reports with their scope, reporting period, achievements, limitations and supporting evidence." />
          <div className="ac-report-empty"><BookOpenCheck size={22} /><div><b>No performance reports published yet.</b><span>When reports are available, this space will include a summary, reporting period, department, achievements, challenges and source documents.</span></div></div>
        </section>

        <section className="ac-section ac-section-soft" id="library">
          <SectionHeading index="06" eyebrow="EVIDENCE LIBRARY" title="Evidence behind every report." text="Find published documents, records and supporting materials connected to commitments and performance." />
          <div className="ac-library-tools"><label className="ac-search"><Search size={17} /><input value={documentQuery} onChange={(e) => setDocumentQuery(e.target.value)} placeholder="Search public documents" /></label><label className="ac-library-filter"><select value={documentCategory} onChange={(e) => setDocumentCategory(e.target.value)}><option value="">All document types</option>{['Official reports', 'Project documents', 'Budget reports', 'Expenditure reports', 'Performance reports', 'Audit reports', 'Policy documents', 'Supporting evidence'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><label className="ac-library-filter"><select value={documentYear} onChange={(e) => setDocumentYear(e.target.value)}><option value="">All financial years</option>{['2026/27', '2025/26', '2024/25', '2023/24'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label></div>
          <div className="ac-doc-types">{['Official reports', 'Project documents', 'Budget reports', 'Expenditure', 'Performance', 'Audit reports', 'Policies', 'Supporting evidence', 'Project photographs'].map((label, i) => <div className="ac-doc-type" key={label}><span>0{i + 1}</span><FileText size={18} /><b>{label}</b><span className="ac-doc-count">—</span></div>)}</div><EmptyNotice>Public documents have not yet been added to the evidence library.</EmptyNotice>
        </section>

        <section className="ac-section" id="corrections">
          <SectionHeading index="07" eyebrow="CORRECTIONS REGISTER" title="Accuracy matters. Transparency matters." text="If published information requires correction, the original record, updated information and reason should remain visible." />
          <div className="ac-correction-header"><div><span>PUBLICATION HISTORY</span><b>Changes stay on the record.</b></div><span>CHRONOLOGICAL REGISTER</span></div>
          <div className="ac-correction-empty"><div className="ac-original"><span>ORIGINAL INFORMATION</span><i>—</i></div><div className="ac-correction-arrow"><ArrowRight size={18} /></div><div className="ac-updated"><span>UPDATED INFORMATION</span><i>—</i></div><p>{EMPTY} Correction records will include publication and correction dates, explanation and links to both versions.</p></div>
        </section>

        <section className="ac-section ac-questions" id="questions">
          <div className="ac-question-copy"><SectionHeading index="08" eyebrow="PUBLIC QUESTIONS & REPLIES" title="Your questions deserve answers." text="Accountability begins with listening. Ask about public services, local development, projects or public resources." /><p>Questions and responses appear publicly only after review. Private contact details are not displayed.</p><Link className="ac-button ac-button-gold" to="/public-voice">Share a concern or question <ArrowRight size={16} /></Link></div>
          <div className="ac-question-card"><div className="ac-question-mark"><CircleHelp size={25} /></div><span className="ac-label">CITIZEN ENGAGEMENT</span><h3>One place to be heard.</h3><p>Use Public Voice to share a community concern with context, location and supporting evidence. Published items are reviewed before appearing on the public site.</p><div className="ac-question-categories">{['Public services', 'Education', 'Healthcare', 'Infrastructure', 'Employment', 'Agriculture', 'Local development', 'Public finance'].map((x) => <span key={x}>{x}</span>)}</div><Link to="/public-voice" className="ac-question-link">Go to Public Voice <ArrowUpRight size={15} /></Link></div>
          <div className="ac-public-questions"><span className="ac-label">PUBLISHED QUESTIONS</span><EmptyNotice>Public questions and official replies are not yet published.</EmptyNotice></div>
        </section>
      </main>

      <section className="ac-manifesto"><div className="ac-wrap"><span>OUR STANDARD</span><blockquote>“Every promise should be traceable. Every resource should be accountable. Every correction should be visible. Every citizen should have a voice.”</blockquote><Link to="/public-voice">Make your voice heard <ArrowRight size={16} /></Link></div></section>
    </div>
  </MotionConfig>
}
