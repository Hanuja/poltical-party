import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MotionConfig, motion } from 'framer-motion'
import {
  ArrowLeft, ChevronRight, Home, FileText, Download, ExternalLink, Info, Share2, Loader2, CalendarDays,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { announcementsApi } from '../services/api'
import { setPageSEO } from '../utils/seo'
import { AnnMedia, Eyebrow, GoldRule, ImageCard, StateBox, RetryButton, Skeleton } from '../components/announcements/annShared'
import { annDate, annPath, categoryLabel, sanitizeHtml, rise, stagger } from '../components/announcements/annUtils'
import '../styles/announcements.css'

function fileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Attachment({ f, t }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const meta = [f.mime === 'application/pdf' ? 'PDF' : null, fileSize(f.size)].filter(Boolean).join(' · ')
  const body = (
    <>
      <span className="an-file-icon" aria-hidden="true"><FileText size={20} /></span>
      <span className="tw:flex-1 tw:min-w-0">
        <span className="tw:block tw:font-semibold tw:break-words">{f.name}</span>
        <small>{failed ? t('announcements.downloadFailed') : (meta || t('announcements.download'))}</small>
      </span>
      {busy ? <Loader2 size={18} className="tw:animate-spin" aria-hidden="true" />
        : f.url ? <ExternalLink size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
    </>
  )
  if (f.url) {
    return <a className="an-file" href={f.url} target="_blank" rel="noopener noreferrer">{body}</a>
  }
  const onClick = async () => {
    setBusy(true); setFailed(false)
    try { await announcementsApi.download(f.download, f.name) } catch { setFailed(true) } finally { setBusy(false) }
  }
  return (
    <button type="button" className="an-file" onClick={onClick} disabled={busy} aria-label={`${t('announcements.download')}: ${f.name}`}>
      {body}
    </button>
  )
}

// /announcements/:slug — the API re-checks access for the record and for every attachment download;
// a record the viewer may not open is answered exactly like a missing one.
export default function AnnouncementDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const ann = useFetch(() => announcementsApi.get(slug, language), [slug, language])
  const a = ann.data && !ann.error ? ann.data : null
  const related = useFetch(() => (a ? announcementsApi.related(a.id, language, 3) : Promise.resolve([])), [a?.id, language])
  const html = useMemo(() => sanitizeHtml(a?.content), [a?.content])

  useEffect(() => {
    if (a?.title) setPageSEO({ title: a.title, description: a.shortDescription || undefined })
  }, [a?.title, a?.shortDescription])

  // Normalise /announcements/12 → /announcements/title-12.
  useEffect(() => {
    if (a?.slug && a.slug !== slug) navigate(annPath(a), { replace: true })
  }, [a, slug, navigate])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [slug])

  const notFound = ann.error?.response?.status === 404 || /not found/i.test(ann.error?.message || '')

  if (ann.loading && !a) {
    return (
      <div className="an-root tw:bg-white" aria-busy="true">
        <div className="an-hero"><div className="an-wrap tw:py-24"><Skeleton style={{ height: 48, maxWidth: 560, opacity: 0.6 }} /></div></div>
        <div className="an-wrap tw:py-12 tw:grid tw:gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 22, maxWidth: `${90 - i * 12}%` }} />)}
        </div>
      </div>
    )
  }

  if (!a) {
    return (
      <div className="an-root tw:bg-white">
        <div className="an-wrap tw:py-20">
          {notFound ? (
            <StateBox title={t('announcements.notFoundTitle')} text={t('announcements.notFoundText')}
              action={<Link to="/announcements" className="an-btn an-btn-maroon"><ArrowLeft size={17} aria-hidden="true" /> {t('announcements.back')}</Link>} />
          ) : (
            <StateBox kind="error" title={t('announcements.errorTitle')} text={t('announcements.errorText')}
              action={<RetryButton t={t} onClick={ann.reload} />} />
          )}
        </div>
      </div>
    )
  }

  const facts = [
    ['referenceNumber', a.referenceNumber],
    ['published', a.publishedAt && annDate(a.publishedAt, language)],
    ['eventDate', a.eventDate && annDate(a.eventDate, language)],
    ['noticeDate', a.noticeDate && annDate(a.noticeDate, language)],
    ['pressMeetingDate', a.pressMeetingDate && annDate(a.pressMeetingDate, language)],
    ['location', a.meetingLocation],
    ['district', a.district],
    ['spokesperson', a.spokesperson],
    ['contact', [a.contactPerson, a.contactPhone, a.contactEmail].filter(Boolean).join(' · ')],
    ['validUntil', a.expiresAt && annDate(a.expiresAt, language)],
  ].filter(([, v]) => v)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = encodeURIComponent(`${a.title} — ${shareUrl}`)
  const relatedItems = related.data || []

  return (
    <MotionConfig reducedMotion="user">
      <article className="an-root tw:bg-white" lang={a.language}>
        {/* ---------- Hero ---------- */}
        <header className="an-hero an-detail-hero">
          <span className="an-hero-shape s1" aria-hidden="true" />
          <span className="an-hero-shape s3" aria-hidden="true" />
          <span className="an-hero-lines" aria-hidden="true" />
          <motion.div className="an-wrap tw:pt-10 tw:md:pt-14 tw:flex tw:flex-col tw:gap-5" variants={stagger(0.08)} initial="hidden" animate="show">
            <motion.nav variants={rise} aria-label={t('announcements.breadcrumb')} className="an-crumbs" lang={language}>
              <Link to="/"><Home size={15} aria-hidden="true" /> {t('nav.home')}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <Link to="/announcements">{t('announcements.title')}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <span aria-current="page" className="tw:line-clamp-1 tw:max-w-[40ch]">{a.title}</span>
            </motion.nav>
            <motion.div variants={rise} lang={language}>
              <Link to="/announcements" className="an-btn an-btn-outline tw:min-h-[44px]">
                <ArrowLeft size={17} aria-hidden="true" /> {t('announcements.back')}
              </Link>
            </motion.div>
            <motion.div variants={rise} className="tw:flex tw:flex-wrap tw:items-center tw:gap-3" lang={language}>
              <span className="an-tag">{categoryLabel(t, a.category)}</span>
              {a.type && <span className="an-tag an-tag-maroon">{t(`announcements.types.${a.type}`, { defaultValue: a.type })}</span>}
              {a.publishedAt && (
                <time dateTime={a.publishedAt} className="tw:inline-flex tw:items-center tw:gap-2 tw:text-an-mute">
                  <CalendarDays size={16} aria-hidden="true" /> {annDate(a.publishedAt, language)}
                </time>
              )}
            </motion.div>
            <motion.h1 variants={rise}>{a.title}</motion.h1>
            <GoldRule delay={0.4} />
          </motion.div>
        </header>

        {/* ---------- Cover ---------- */}
        <div className="an-wrap">
          {a.image ? (
            <motion.figure className="an-detail-cover tw:m-0" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <AnnMedia a={a} eager iconSize={80} sizes="(min-width: 1240px) 1180px, 100vw" />
              {a.imageCaption && <figcaption>{a.imageCaption}</figcaption>}
            </motion.figure>
          ) : <div className="an-detail-nocover" aria-hidden="true" />}
          {a.media?.length > 0 && (
            <div className="an-media-gallery tw:mt-8 tw:grid tw:gap-4" style={{gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
              {a.media.map((m,i)=>(
                m.type==='video' ? (
                  <video key={i} controls preload="metadata" className="tw:w-full tw:rounded-xl tw:bg-black" src={m.url} />
                ) : (
                  <a key={i} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt={m.caption||''} loading="lazy" className="tw:w-full tw:rounded-xl tw:object-cover" style={{aspectRatio:'16/10'}} /></a>
                )
              ))}
            </div>
          )}
          {a.videoUrl && (
            <div className="an-detail-video tw:mt-8">
              {(()=>{ const m=(a.videoUrl||'').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/); return m ? (
                <div className="tw:relative tw:w-full" style={{paddingTop:'56.25%'}}>
                  <iframe className="tw:absolute tw:inset-0 tw:w-full tw:h-full tw:rounded-2xl" src={`https://www.youtube.com/embed/`} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : (
                <video controls preload="metadata" className="tw:w-full tw:rounded-2xl tw:bg-black" src={a.videoUrl} />
              )})()}
            </div>
          )}
        </div>

        {/* ---------- Body ---------- */}
        <div className="an-wrap tw:py-12 tw:md:py-16 tw:grid tw:gap-10 tw:lg:grid-cols-[minmax(0,1fr)_340px] tw:lg:gap-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className={a.image ? '' : 'tw:bg-white tw:rounded-[22px] tw:border tw:border-an-line tw:p-6 tw:md:p-10 tw:relative tw:z-10'}>
            {a.shortDescription && <p className="an-lead tw:mb-8">{a.shortDescription}</p>}
            {html ? <div className="an-prose" dangerouslySetInnerHTML={{ __html: html }} /> : null}
          </motion.div>

          <aside className="tw:flex tw:flex-col tw:gap-5 tw:lg:sticky tw:lg:top-28 tw:self-start tw:w-full" lang={language}>
            {facts.length > 0 && (
              <section className="an-aside" aria-labelledby="an-facts-h">
                <h2 id="an-facts-h"><Info size={18} aria-hidden="true" /> {t('announcements.details')}</h2>
                <dl className="an-facts">
                  {facts.map(([k, v]) => (
                    <div key={k}><dt>{t(`announcements.fact.${k}`)}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              </section>
            )}
            {a.attachments?.length > 0 && (
              <section className="an-aside" aria-labelledby="an-files-h">
                <h2 id="an-files-h"><FileText size={18} aria-hidden="true" /> {t('announcements.attachments')}</h2>
                {a.attachments.map((f) => <Attachment key={`${f.id}-${f.name}`} f={f} t={t} />)}
              </section>
            )}
            {a.allowSocialSharing && (
              <section className="an-aside an-share" aria-labelledby="an-share-h">
                <h2 id="an-share-h"><Share2 size={18} aria-hidden="true" /> {t('announcements.shareTitle')}</h2>
                <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-4">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer">X</a>
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* ---------- Related ---------- */}
        {relatedItems.length > 0 && (
          <section className="tw:bg-white tw:border-t tw:border-an-line tw:py-14 tw:md:py-20" aria-labelledby="an-related-h" lang={language}>
            <div className="an-wrap">
              <div className="tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4 tw:mb-8">
                <div className="tw:flex tw:flex-col tw:gap-3">
                  <Eyebrow>{t('announcements.eyebrow')}</Eyebrow>
                  <h2 id="an-related-h" className="an-title" style={{ fontSize: 'clamp(1.7rem, 1.3rem + 1.4vw, 2.4rem)' }}>{t('announcements.related')}</h2>
                  <GoldRule />
                </div>
                <Link to="/announcements" className="an-btn an-btn-outline">
                  <ArrowLeft size={17} aria-hidden="true" /> {t('announcements.back')}
                </Link>
              </div>
              <motion.div className="tw:grid tw:gap-6 tw:sm:grid-cols-2 tw:lg:grid-cols-3" variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
                {relatedItems.map((r) => (
                  <motion.div key={r.id} variants={rise}><ImageCard a={r} t={t} language={language} /></motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}
      </article>
    </MotionConfig>
  )
}
