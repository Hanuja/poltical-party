import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUp, Loader2, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { memApi } from '../components/membership/memApi'
import { memText } from '../components/membership/membershipText'
import { useReveal, scrollToId } from '../components/membership/memUi'
import PageBanner from '../components/PageBanner'
import WhyJoin from '../components/membership/WhyJoin'
import ApplicationForm from '../components/membership/ApplicationForm'
import SuccessScreen from '../components/membership/SuccessScreen'
import TrackStatus from '../components/membership/TrackStatus'
import MembershipExperienceHero from '../components/membership/MembershipExperienceHero'
import '../styles/membership.css'

// Join Us (/membership): hero → why join → 5-step application → tracking → final call to action.
// Page content is admin-managed (Admin → Membership Management → Join Us page settings).
export default function Membership() {
  const { language } = useLanguage()
  const s = memText(language)
  const rootRef = useRef(null)
  const [params] = useSearchParams()
  const { data: page, loading, error, reload } = useFetch(() => memApi.page(language), [language])
  const [result, setResult] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const [approvedCount, setApprovedCount] = useState(0)

  useEffect(() => { setPageSEO({ title: s.seoTitle, description: s.seoDesc }) }, [s])
  useReveal(rootRef, [loading, !!result])

  useEffect(() => {
    let live = true
    let inFlight = false
    let timer = null
    const updateCount = () => {
      if (!live || inFlight || document.visibilityState !== 'visible') return
      inFlight = true
      memApi.approvedCount().then((response) => {
        if (live) setApprovedCount(Number(response?.count) || 0)
      }).catch(() => {}).finally(() => { inFlight = false })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateCount()
        if (!timer) timer = window.setInterval(updateCount, 30000)
      } else if (timer) {
        window.clearInterval(timer)
        timer = null
      }
    }
    onVisibilityChange()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => { live = false; if (timer) window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibilityChange) }
  }, [])

  // Links from emails: /membership?track=1 opens straight at the tracker.
  useEffect(() => {
    if (params.get('track') && !loading) setTimeout(() => scrollToId('mb-track'), 120)
  }, [params, loading])

  const onSubmitted = (res) => {
    setResult(res)
    setTimeout(() => scrollToId('mb-apply'), 50)
  }
  const goTrack = () => {
    if (result) setPrefill({ reference: result.reference, email: result.email })
    setTimeout(() => scrollToId('mb-track'), 50)
  }

  return (
    <div className="mb-root" ref={rootRef} lang={language}>
      <PageBanner breadcrumbItems={[{ label: 'Join Us' }]} />

      <MembershipExperienceHero language={language} count={approvedCount} onJoin={() => scrollToId('mb-apply')} />

      <WhyJoin s={s} adminImages={page?.whyImages} />

      <section id="mb-apply" className="mb-apply" aria-label={s.form.title}>
        <div className="mb-wrap">
          {loading && (
            <div className="mb-card mb-state" role="status"><Loader2 size={28} className="mb-spin" aria-hidden="true" /><p>{s.loading}</p></div>
          )}
          {!loading && error && (
            <div className="mb-card mb-state" role="alert">
              <p>{s.pageError}</p>
              <button type="button" className="mb-btn mb-btn-primary" onClick={reload}><RefreshCw size={18} aria-hidden="true" />{s.retry}</button>
            </div>
          )}
          {!loading && !error && page && (result
            ? <SuccessScreen result={result} s={s} lang={language} message={page.successMessage} onTrack={goTrack} />
            : <ApplicationForm page={page} s={s} lang={language} onSubmitted={onSubmitted} onTrack={goTrack} />)}
        </div>
      </section>

      <section id="mb-track" className="mb-track" aria-labelledby="mb-track-title">
        <div className="mb-wrap"><TrackStatus s={s} lang={language} prefill={prefill} /></div>
      </section>

      <section className="mb-cta" aria-labelledby="mb-cta-title">
        <div className="mb-cta-bg" aria-hidden="true" />
        <div className="mb-wrap mb-cta-inner" data-mb-reveal="">
          <h2 id="mb-cta-title" className="mb-cta-title">{s.cta.title}</h2>
          <p>{s.cta.text}</p>
          {!result && (
            <button type="button" className="mb-btn mb-btn-gold mb-btn-lg" onClick={() => scrollToId('mb-apply')}>
              {s.cta.button}<ArrowUp size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
