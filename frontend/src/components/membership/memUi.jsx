import { useEffect, useId } from 'react'
import { AlertCircle, Check } from 'lucide-react'

// Fade/slide-in on scroll. Elements are hidden only once the observer runs (.mb-reveal-on on the
// root), CSS transitions do the motion, and a timer reveals everything after 3.5 s, so content can
// never stay invisible (framer's whileInView stalled in background tabs on this site).
export function useReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || !('IntersectionObserver' in window)) return undefined
    // State lives in a data attribute, not a class: React rewrites className on re-render.
    const show = (el) => el.setAttribute('data-mb-in', '')
    const items = [...root.querySelectorAll('[data-mb-reveal]:not([data-mb-in])')]
    root.classList.add('mb-reveal-on')
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 })
    items.forEach((el) => io.observe(el))
    const t = setTimeout(() => items.forEach(show), 3500)
    return () => { io.disconnect(); clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export const scrollToId = (id) => {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function Message({ id, error, hint }) {
  if (error) return <p id={id} className="mb-msg mb-msg-error" role="alert"><AlertCircle size={14} aria-hidden="true" />{error}</p>
  if (hint) return <p id={id} className="mb-msg">{hint}</p>
  return null
}

/** Floating-label text input / textarea / select. `value` drives the floated state. */
export function Field({ label, required, error, hint, as = 'input', value, onChange, children, className = '', inputRef, ...rest }) {
  const id = useId()
  const msgId = `${id}-msg`
  const Tag = as
  const filled = rest.type === 'date' || (value !== '' && value !== null && value !== undefined)
  return (
    <div className={`mb-field ${as === 'textarea' ? 'is-area' : ''} ${as === 'select' ? 'is-select' : ''} ${error ? 'has-error' : ''} ${className}`} data-filled={filled ? '' : undefined}>
      <Tag
        id={id}
        ref={inputRef}
        value={value ?? ''}
        onChange={onChange}
        placeholder={as === 'select' ? undefined : ' '}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        aria-required={required || undefined}
        {...rest}
      >
        {children}
      </Tag>
      <label htmlFor={id}>{label}{required && <span className="mb-req" aria-hidden="true"> *</span>}</label>
      <Message id={msgId} error={error} hint={hint} />
    </div>
  )
}

/** Custom checkbox row; children = label content (may contain links). */
export function CheckRow({ checked, onChange, error, children, name }) {
  const id = useId()
  return (
    <div className={`mb-check ${error ? 'has-error' : ''}`}>
      <input id={id} type="checkbox" name={name} checked={!!checked} onChange={(e) => onChange(e.target.checked)}
        aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-msg` : undefined} />
      <span className="mb-check-box" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
      <label htmlFor={id}>{children}</label>
      {error && <Message id={`${id}-msg`} error={error} />}
    </div>
  )
}

/** Radio-like (single) or checkbox-like (multi) chips inside a fieldset. */
export function Chips({ legend, options, value, onChange, multi = false, error, required, name }) {
  const id = useId()
  const isOn = (v) => (multi ? (value || []).includes(v) : value === v)
  const toggle = (v) => {
    if (!multi) return onChange(v)
    const cur = value || []
    onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }
  return (
    <fieldset className={`mb-chips ${error ? 'has-error' : ''}`} aria-describedby={error ? `${id}-msg` : undefined}>
      <legend>{legend}{required && <span className="mb-req" aria-hidden="true"> *</span>}</legend>
      <div className="mb-chip-row">
        {options.map(([v, label]) => (
          <label key={String(v)} className={`mb-chip ${isOn(v) ? 'is-on' : ''}`}>
            <input type={multi ? 'checkbox' : 'radio'} name={name || id} checked={isOn(v)} onChange={() => toggle(v)} />
            {multi && <Check size={14} strokeWidth={3} aria-hidden="true" />}
            <span>{label}</span>
          </label>
        ))}
      </div>
      <Message id={`${id}-msg`} error={error} />
    </fieldset>
  )
}

export function Eyebrow({ children, light = false }) {
  return <span className={`mb-eyebrow ${light ? 'is-light' : ''}`}>{children}</span>
}
