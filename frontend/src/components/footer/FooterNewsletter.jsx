import { useId, useRef, useState } from 'react'
import { Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { newsletterApi } from '../../services/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * "Stay Connected With TMK" — subscribes through POST /api/newsletter/?action=subscribe.
 * The API answers 409 for an address that is already subscribed; that is shown as its own message.
 */
export default function FooterNewsletter({ content, ui, language }) {
  const id = useId()
  const inputRef = useRef(null)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [state, setState] = useState('idle') // idle | sending | success | duplicate | invalid | error
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (state === 'sending') return
    const value = email.trim()
    if (!EMAIL_RE.test(value) || value.length > 150) {
      setState('invalid'); setMessage(ui.invalid); inputRef.current?.focus(); return
    }
    setState('sending'); setMessage('')
    try {
      const res = await newsletterApi.subscribe({ email: value, language, website })
      setState('success')
      setMessage(res?.status === 'resubscribed' ? ui.resubscribed : (content.success || ui.resubscribed))
      setEmail('')
    } catch (err) {
      const status = err.response?.status
      if (status === 409) { setState('duplicate'); setMessage(content.duplicate || err.response?.data?.error) }
      else if (status === 422) { setState('invalid'); setMessage(ui.invalid); inputRef.current?.focus() }
      else { setState('error'); setMessage(ui.error) }
    }
  }

  const invalid = state === 'invalid'
  const positive = state === 'success'
  const msgId = `${id}-msg`

  return (
    <div className="rf-glass rf-card-pad tw:h-full tw:flex tw:flex-col tw:justify-center">
      <h2 id={`${id}-title`} className="rf-nl-title tw:font-semibold">{content.title}</h2>
      {content.text && <p className="tw:mt-2 tw:text-[0.93rem] tw:text-white/75">{content.text}</p>}

      <form onSubmit={submit} noValidate aria-labelledby={`${id}-title`} className="tw:mt-5">
        <div className="tw:flex tw:flex-wrap tw:gap-3">
          <div className="rf-input-wrap">
            <Mail size={17} aria-hidden="true" />
            <label htmlFor={`${id}-email`} className="tw:sr-only">{ui.email}</label>
            <input
              ref={inputRef}
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              className="rf-input"
              placeholder={content.placeholder || ui.email}
              value={email}
              maxLength={150}
              onChange={(e) => { setEmail(e.target.value); if (state !== 'sending') { setState('idle'); setMessage('') } }}
              aria-invalid={invalid || undefined}
              aria-describedby={message ? msgId : undefined}
              required
            />
          </div>
          <div className="rf-hp" aria-hidden="true">
            <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>
          <button type="submit" className="rf-btn tw:shrink-0 tw:max-sm:w-full" disabled={state === 'sending'}>
            {state === 'sending' ? ui.sending : (content.button || 'Subscribe')}
            {state !== 'sending' && <Send size={16} aria-hidden="true" />}
          </button>
        </div>
        <div aria-live="polite" role="status">
          {message && (
            <p id={msgId} className={`rf-msg ${positive ? 'rf-msg-ok' : 'rf-msg-err'}`}>
              {positive ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
              <span>{message}</span>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
