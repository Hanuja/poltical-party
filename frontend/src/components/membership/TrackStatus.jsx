import { useEffect, useState } from 'react'
import { Search, Loader2, Check, Clock, X, BadgeCheck, AlertTriangle } from 'lucide-react'
import { Field, Eyebrow } from './memUi'
import { memApi } from './memApi'
import { fill } from './membershipText'

const fmt = (iso, lang) => {
  if (!iso) return ''
  const d = new Date(iso)
  const loc = lang === 'ta' ? 'ta-LK' : lang === 'si' ? 'si-LK' : 'en-GB'
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(loc, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Status is only ever returned for the one application matching BOTH reference and email
// (server-side check, rate-limited); a wrong pair gets the same "not found" either way.
function Timeline({ status, s }) {
  const final = status === 'declined' ? 'declined' : 'approved'
  const order = ['received', 'under_review', final]
  const idx = status === 'approved' || status === 'declined' ? 2 : order.indexOf(status)
  return (
    <ol className="mb-timeline">
      {order.map((k, i) => {
        const state = i < idx ? 'done' : i === idx ? 'current' : 'todo'
        const Icon = state === 'done' ? Check : k === 'declined' && state === 'current' ? X : state === 'current' && i === 2 ? BadgeCheck : Clock
        return (
          <li key={k} className={`is-${state} ${k === 'declined' ? 'is-declined' : ''}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="mb-timeline-dot" aria-hidden="true"><Icon size={16} strokeWidth={2.6} /></span>
            <span>{s.track.statuses[k]}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function TrackStatus({ s, lang, prefill }) {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState({})

  useEffect(() => {
    if (prefill?.reference) { setReference(prefill.reference); setEmail(prefill.email || ''); setResult(null); setState('idle') }
  }, [prefill])

  const submit = async (e) => {
    e.preventDefault()
    const fe = {}
    if (!reference.trim()) fe.reference = s.errors.required
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) fe.email = email.trim() ? s.errors.email : s.errors.required
    setFieldErr(fe)
    if (Object.keys(fe).length) return
    setState('loading'); setError('')
    try {
      setResult(await memApi.track(reference.trim(), email.trim()))
      setState('done')
    } catch (ex) {
      setResult(null); setState('error')
      setError(ex.status === 404 ? s.track.notFound : ex.status === 429 ? s.errors.rate_limited : ex.code === 'network' ? s.errors.network : s.errors.generic)
    }
  }

  return (
    <div className="mb-track-grid">
      <div className="mb-track-copy" data-mb-reveal="">
        <Eyebrow>{s.track.eyebrow}</Eyebrow>
        <h2 id="mb-track-title" className="mb-h2">{s.track.title}</h2>
        <p className="mb-lead">{s.track.text}</p>
      </div>
      <div className="mb-card mb-track-card" data-mb-reveal="">
        <form onSubmit={submit} noValidate className="mb-fields">
          <Field label={s.track.reference} required value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())}
            error={fieldErr.reference} autoComplete="off" spellCheck="false" maxLength={20} className="mb-field-mono" />
          <Field label={s.track.email} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErr.email} autoComplete="email" />
          <button type="submit" className="mb-btn mb-btn-primary mb-btn-block" disabled={state === 'loading'}>
            {state === 'loading' ? <Loader2 size={18} className="mb-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
            {state === 'loading' ? s.track.checking : s.track.button}
          </button>
        </form>

        <div aria-live="polite">
          {state === 'error' && <p className="mb-banner is-error"><AlertTriangle size={18} aria-hidden="true" /><span>{error}</span></p>}
          {state === 'done' && result && (
            <div className={`mb-track-result is-${result.status}`}>
              <p className="mb-track-hello">{fill(s.track.hello, { name: result.firstName })}</p>
              <p className="mb-track-status">
                <span className={`mb-pill is-${result.status}`}>{s.track.statuses[result.status] || result.status}</span>
                <code>{result.reference}</code>
              </p>
              <p>{s.track.descriptions[result.status]}</p>
              <Timeline status={result.status} s={s} />
              <dl className="mb-track-facts">
                <div><dt>{s.track.submitted}</dt><dd>{fmt(result.submittedAt, lang)}</dd></div>
                {result.updatedAt && <div><dt>{s.track.updated}</dt><dd>{fmt(result.updatedAt, lang)}</dd></div>}
                {result.membershipId && <div><dt>{s.track.membershipId}</dt><dd><code>{result.membershipId}</code></dd></div>}
                {result.reason && <div className="is-wide"><dt>{s.track.reason}</dt><dd>{result.reason}</dd></div>}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
