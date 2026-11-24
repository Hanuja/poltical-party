import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useFetch } from '../../hooks/useFetch'
import { announcementsApi } from '../../services/api'
import { Eyebrow, GoldRule, FilterTabs, FeatureCard, RowCard, StateBox, RetryButton, Skeleton } from './annShared'
import { rise, stagger } from './annUtils'
import '../../styles/announcements.css'

// Homepage "Latest Announcements": one large featured item + up to three previews.
// Everything shown (items and counts) is already permission-filtered by the API.
export default function LatestAnnouncements() {
  const { t, language } = useLanguage()
  const [filter, setFilter] = useState('all')
  const res = useFetch(
    () => announcementsApi.homepage(language, { category: filter === 'all' ? undefined : filter }),
    [language, filter]
  )

  const data = res.data
  const items = data?.items || []
  const count = !data ? null : filter === 'all' ? data.counts?.all ?? 0 : data.counts?.categories?.[filter] ?? 0
  const firstLoad = res.loading && !data

  // Nothing published at all → leave the homepage exactly as it was (no empty band).
  if (!res.loading && !res.error && filter === 'all' && (data?.counts?.all ?? 0) === 0) return null

  const [lead, ...rest] = items

  return (
    <MotionConfig reducedMotion="user">
      <section className="an-root an-home" aria-labelledby="an-home-title">
        <div className="an-wrap">
          <motion.header
            className="tw:flex tw:flex-col tw:gap-6 tw:lg:flex-row tw:lg:items-end tw:lg:justify-between tw:mb-8"
            variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}
          >
            <div className="tw:flex tw:flex-col tw:gap-3">
              <motion.div variants={rise}><Eyebrow>{t('announcements.eyebrow')}</Eyebrow></motion.div>
              <motion.h2 variants={rise} id="an-home-title" className="an-title">{t('announcements.homeTitle')}</motion.h2>
              <GoldRule delay={0.35} />
              <motion.p variants={rise} className="an-subtitle tw:mt-1">{t('announcements.homeSubtitle')}</motion.p>
            </div>
            <motion.div variants={rise} className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
              {count != null && (
                <span className="an-count" aria-live="polite">
                  <strong>{count}</strong> {t('announcements.countLabel', { count })}
                </span>
              )}
              <Link to="/announcements" className="an-btn an-btn-gold">
                {t('announcements.viewAll')} <ArrowRight size={18} className="an-arrow" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.header>

          <div className="tw:mb-8">
            <FilterTabs t={t} value={filter} onChange={setFilter} layoutId="an-home-pill" />
          </div>

          {firstLoad ? (
            <div className="tw:grid tw:gap-6 tw:lg:grid-cols-12" aria-busy="true">
              <Skeleton className="tw:lg:col-span-7" style={{ minHeight: 460, borderRadius: 18 }} />
              <div className="tw:lg:col-span-5 tw:grid tw:gap-4">
                {[0, 1, 2].map((i) => <Skeleton key={i} style={{ minHeight: 140, borderRadius: 18 }} />)}
              </div>
            </div>
          ) : res.error && !data ? (
            <StateBox kind="error" title={t('announcements.errorTitle')} text={t('announcements.errorText')}
              action={<RetryButton t={t} onClick={res.reload} />} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${filter}-${items.map((a) => a.id).join('.')}`}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: res.loading ? 0.55 : 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                aria-busy={res.loading}
              >
                {items.length === 0 ? (
                  <StateBox title={t('announcements.emptyFilterTitle')} text={t('announcements.emptyFilterText')} />
                ) : (
                  <motion.div
                    className="tw:grid tw:gap-6 tw:lg:grid-cols-12"
                    variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
                  >
                    <motion.div variants={rise} className={rest.length ? 'tw:lg:col-span-7' : 'tw:lg:col-span-12'}>
                      <FeatureCard a={lead} t={t} language={language} wide={!rest.length} />
                    </motion.div>
                    {rest.length > 0 && (
                      <div className="tw:lg:col-span-5 tw:grid tw:gap-4 tw:md:grid-cols-2 tw:lg:grid-cols-1 tw:content-start">
                        {rest.map((a) => (
                          <motion.div key={a.id} variants={rise}><RowCard a={a} t={t} language={language} /></motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </MotionConfig>
  )
}
