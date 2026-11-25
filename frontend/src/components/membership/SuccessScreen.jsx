import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Copy, Check, Search, Home, MailCheck, MailWarning } from 'lucide-react'
import { fill } from './membershipText'

const EASE = [0.22, 1, 0.36, 1]

export default function SuccessScreen({ result, s, lang, message, onTrack }) {
  const reduce = useReducedMotion()
  const headRef = useRef(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { headRef.current?.focus() }, [])

  const loc = lang === 'ta' ? 'ta-LK' : lang === 'si' ? 'si-LK' : 'en-GB'
  const date = new Date(result.submittedAt)
  const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleString(loc, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const copy = async () => {
    try { await navigator.clipboard.writeText(result.reference); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* blocked */ }
  }
  const sent = result.emailStatus === 'sent'

  return (
    <div className="mb-card mb-success" role="status">
      <svg className="mb-success-mark" viewBox="0 0 96 96" aria-hidden="true">
        <motion.circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE }} />
        <motion.path d="M30 49 L43 62 L67 36" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.7, ease: EASE }} />
      </svg>
      <h2 className="mb-h2" tabIndex={-1} ref={headRef}>{s.success.title}</h2>
      <div className="mb-success-msg">
        {(message || s.success.fallback).split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <dl className="mb-success-facts">
        <div className="is-ref">
          <dt>{s.success.reference}</dt>
          <dd>
            <code>{result.reference}</code>
            <button type="button" className="mb-btn mb-btn-outline mb-btn-sm" onClick={copy}>
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? s.success.copied : s.success.copy}
            </button>
          </dd>
        </div>
        <div><dt>{s.success.date}</dt><dd>{dateText}</dd></div>
        <div><dt>{s.success.status}</dt><dd><span className="mb-pill is-received">{s.success.pending}</span></dd></div>
        {result.email && <div><dt>{s.success.email}</dt><dd className="mb-break">{result.email}</dd></div>}
      </dl>

      {result.emailStatus && <p className={`mb-success-mail ${sent ? 'is-sent' : 'is-unsent'}`}>
        {sent ? <MailCheck size={18} aria-hidden="true" /> : <MailWarning size={18} aria-hidden="true" />}
        {sent ? fill(s.success.emailSent, { email: result.email }) : s.success.emailNotSent}
      </p>}

      <div className="mb-row-actions is-center">
        <button type="button" className="mb-btn mb-btn-primary" onClick={onTrack}><Search size={18} aria-hidden="true" />{s.success.track}</button>
        <Link to="/" className="mb-btn mb-btn-outline"><Home size={18} aria-hidden="true" />{s.success.home}</Link>
      </div>
    </div>
  )
}
