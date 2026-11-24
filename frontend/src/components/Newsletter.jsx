import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { subscribeNewsletter } from '../services/content'
import { MailCheck } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Newsletter() {
  const { t, language } = useLanguage()
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | success | error
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) { setError(t('home.newsletterError')); setState('error'); return }
    setState('sending')
    try {
      await subscribeNewsletter({ email, language })
      setState('success')
      setEmail('')
    } catch {
      setState('error')
      setError(t('common.error'))
    }
  }

  return (
    <section className="section section-alt">
      <div className="container newsletter-box">
        <div>
          <span className="eyebrow">{t('home.newsletterEyebrow')}</span>
          <h2>{t('home.newsletterTitle')}</h2>
          <p className="text-muted">{t('home.newsletterText')}</p>
        </div>
        <form onSubmit={submit} className="newsletter-form" noValidate>
          {state === 'success' ? (
            <div className="alert alert-success" role="status"><MailCheck size={16} /> {t('home.newsletterSuccess')}</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="email"
                  className={`form-control${state === 'error' ? ' error' : ''}`}
                  placeholder={t('home.newsletterPlaceholder')}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setState('idle') }}
                  aria-label={t('home.newsletterTitle')}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>
                  {state === 'sending' ? t('common.sending') : t('home.newsletterButton')}
                </button>
              </div>
              {state === 'error' && <div className="form-error">{error}</div>}
            </>
          )}
        </form>
      </div>
    </section>
  )
}
