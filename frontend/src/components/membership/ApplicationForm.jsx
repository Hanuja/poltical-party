import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, Save, Send, ShieldCheck, Loader2, Upload, X, Copy, RotateCcw, Info, AlertTriangle, ExternalLink, Pencil,
} from 'lucide-react'
import { Field, CheckRow, Chips, Eyebrow, scrollToId } from './memUi'
import { fill } from './membershipText'
import { memApi } from './memApi'
import {
  EMPTY_FORM, DECLARATION_KEYS, validateStep, toPayload, fromDraft, ageFrom, stepOfField,
} from './memForm'

const TOTAL = 5
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function fmtDate(iso, lang, withTime = false) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const loc = lang === 'ta' ? 'ta-LK' : lang === 'si' ? 'si-LK' : 'en-GB'
  return d.toLocaleString(loc, { day: 'numeric', month: 'long', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
}

// ---------------------------------------------------------------- small pieces

function Progress({ step, maxStep, s, onGo }) {
  return (
    <nav className="mb-progress" aria-label={fill(s.form.stepOf, { n: step, total: TOTAL })}>
      <div className="mb-progress-bar" aria-hidden="true"><span style={{ width: `${((step - 1) / (TOTAL - 1)) * 100}%` }} /></div>
      <ol>
        {s.steps.map((label, i) => {
          const n = i + 1
          const done = n < step
          const reachable = n <= maxStep && n !== step
          return (
            <li key={n} className={`${n === step ? 'is-current' : ''} ${done ? 'is-done' : ''}`}>
              <button type="button" onClick={() => reachable && onGo(n)} disabled={!reachable}
                aria-current={n === step ? 'step' : undefined}>
                <span className="mb-progress-dot" aria-hidden="true">{done ? <Check size={15} strokeWidth={3} /> : n}</span>
                <span className="mb-progress-label">{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Banner({ banner, onClose }) {
  if (!banner) return null
  const Icon = banner.type === 'error' ? AlertTriangle : Info
  return (
    <div className={`mb-banner is-${banner.type}`} role={banner.type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div>
        <p>{banner.text}</p>
        {banner.action && <button type="button" className="mb-link-btn" onClick={banner.action.onClick}>{banner.action.label}</button>}
      </div>
      {onClose && <button type="button" className="mb-icon-btn" onClick={onClose} aria-label="×"><X size={16} /></button>}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [onClose])
  return (
    <div className="mb-modal-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mb-modal" role="dialog" aria-modal="true" aria-labelledby="mb-modal-title">
        <button ref={closeRef} type="button" className="mb-icon-btn mb-modal-x" onClick={onClose} aria-label="×"><X size={18} /></button>
        <h3 id="mb-modal-title">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard blocked */ }
  }
  return [copied, copy]
}

function ResumePanel({ s, onRestored, onCancel }) {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (!code.trim() || !email.trim()) { setError(s.errors.required); return }
    setState('loading'); setError('')
    try {
      const r = await memApi.loadDraft(code.trim(), email.trim())
      onRestored(r)
    } catch (err) {
      setState('idle')
      setError(err.status === 404 ? s.resume.notFound : err.status === 429 ? s.errors.rate_limited : err.code === 'network' ? s.errors.network : s.errors.generic)
    }
  }
  return (
    <form className="mb-resume" onSubmit={submit} noValidate>
      <h3>{s.resume.title}</h3>
      <p>{s.resume.text}</p>
      <div className="mb-grid-2">
        <Field label={s.resume.code} required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" spellCheck="false" maxLength={20} />
        <Field label={s.resume.email} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      {error && <p className="mb-msg mb-msg-error" role="alert">{error}</p>}
      <div className="mb-row-actions">
        <button type="button" className="mb-btn mb-btn-quiet" onClick={onCancel}>{s.resume.cancel}</button>
        <button type="submit" className="mb-btn mb-btn-primary" disabled={state === 'loading'}>
          {state === 'loading' ? <Loader2 size={18} className="mb-spin" aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}{s.resume.button}
        </button>
      </div>
    </form>
  )
}

function PhotoField({ s, photo, setPhoto, error, setError }) {
  const [url, setUrl] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    if (!photo) { setUrl(''); return undefined }
    const u = URL.createObjectURL(photo)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photo])
  const pick = (file) => {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) { setError('photo_type'); return }
    if (file.size > 5 * 1024 * 1024) { setError('photo_too_large'); return }
    const img = new Image()
    const u = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(u)
      if (img.naturalWidth < 200 || img.naturalHeight < 200) { setError('photo_dimensions'); return }
      setError(null); setPhoto(file)
    }
    img.onerror = () => { URL.revokeObjectURL(u); setError('photo_type') }
    img.src = u
  }
  return (
    <div className={`mb-photo ${error ? 'has-error' : ''}`}>
      <div className="mb-photo-preview" aria-hidden="true">{url ? <img src={url} alt="" /> : <Upload size={26} />}</div>
      <div>
        <p className="mb-photo-label">{s.form.photo}<span className="mb-req" aria-hidden="true"> *</span></p>
        <p className="mb-msg">{s.form.photoHint}</p>
        <input ref={inputRef} type="file" accept={PHOTO_TYPES.join(',')} className="tw:sr-only" id="mb-photo-input"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} aria-describedby={error ? 'mb-photo-err' : undefined} />
        <label htmlFor="mb-photo-input" className="mb-btn mb-btn-outline mb-btn-sm">{photo ? s.form.photoChange : s.form.photoChoose}</label>
        {error && <p id="mb-photo-err" className="mb-msg mb-msg-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- the form

export default function ApplicationForm({ page, s, lang, onSubmitted, onTrack }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [step, setStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState('') // '' | 'submitting' | 'saving'
  const [banner, setBanner] = useState(null)
  const [draftCode, setDraftCode] = useState('')
  const [saved, setSaved] = useState(null)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [copied, copy] = useCopy()
  const headRef = useRef(null)
  const firstRender = useRef(true)

  const meta = page.meta
  const minAge = page.minAge
  const requirePhoto = page.requirePhoto
  const opts = { minAge, requirePhoto, photo }
  const age = ageFrom(form.dateOfBirth)

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((er) => { const n = { ...er }; delete n[k]; return n })
  }
  const setDecl = (k) => (v) => {
    setForm((f) => ({ ...f, declarations: { ...f.declarations, [k]: v } }))
    setErrors((er) => { const n = { ...er }; delete n[`declarations.${k}`]; return n })
  }

  const districts = useMemo(() => meta.districts.filter((d) => String(d.provinceId) === String(form.provinceId)), [meta, form.provinceId])
  const divisions = useMemo(() => meta.divisions.filter((d) => String(d.districtId) === String(form.districtId)), [meta, form.districtId])
  const division = divisions.find((d) => String(d.id) === String(form.divisionId))

  const err = (field) => {
    const code = errors[field]
    if (!code) return null
    if (code === 'too_young') return fill(s.errors.too_young, { age: minAge })
    if (field === 'photo') return s.errors[code] || s.errors[`photo_${code}`] || s.errors.required
    if (code === 'invalid') {
      if (field === 'phone') return s.errors.phone
      if (field === 'email') return s.errors.email
      if (field === 'nic') return s.errors.nic
      if (field === 'fullName') return s.errors.nameInvalid
    }
    return s.errors[code] || s.errors.invalid
  }

  // Move focus to the step heading on step change (not on first render), for keyboard / screen readers.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    scrollToId('mb-apply')
    setTimeout(() => headRef.current?.focus({ preventScroll: true }), 350)
  }, [step])

  const goTo = (n) => { setBanner(null); setStep(n); setMaxStep((m) => Math.max(m, n)) }

  const next = () => {
    const e = validateStep(step, form, opts)
    setErrors(e)
    if (Object.keys(e).length) { setBanner({ type: 'error', text: s.errors.fixStep }); return }
    goTo(step + 1)
  }

  const applyServerErrors = (fields) => {
    setErrors(fields)
    const first = Math.min(...Object.keys(fields).map(stepOfField))
    if (first !== step) { setStep(first); setBanner({ type: 'error', text: s.errors.fixOther }) }
    else setBanner({ type: 'error', text: s.errors.fixStep })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (step < TOTAL) { next(); return }
    // Re-check every step: an earlier answer may have been edited after its step was passed.
    for (let n = 1; n <= TOTAL; n += 1) {
      const er = validateStep(n, form, opts)
      if (Object.keys(er).length) { applyServerErrors(er); return }
    }
    setBusy('submitting'); setBanner(null)
    try {
      const res = await memApi.apply(toPayload(form, lang, draftCode), requirePhoto ? photo : null)
      onSubmitted(res)
    } catch (ex) {
      if (ex.code === 'validation' && ex.fields) applyServerErrors(ex.fields)
      else if (ex.code === 'duplicate') {
        const field = ex.field === 'email' ? 'email' : 'nic'
        setErrors({ [field]: 'invalid' })
        setBanner({ type: 'error', text: field === 'email' ? s.errors.duplicate_email : s.errors.duplicate_nic, action: { label: s.track.title, onClick: onTrack } })
      } else if (ex.status === 429) setBanner({ type: 'error', text: s.errors.rate_limited })
      else setBanner({ type: 'error', text: ex.code === 'network' ? s.errors.network : s.errors.generic })
    } finally {
      setBusy('')
    }
  }

  const saveProgress = async () => {
    const email = form.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setBanner({ type: 'info', text: s.saved.needEmail, action: step !== 2 ? { label: s.steps[1], onClick: () => goTo(2) } : null })
      if (step === 2) setErrors((er) => ({ ...er, email: email ? 'email' : 'required' }))
      return
    }
    setBusy('saving'); setBanner(null)
    try {
      const r = await memApi.saveDraft({ email, step, data: form, code: draftCode || undefined })
      setDraftCode(r.code)
      setSaved(r)
    } catch (ex) {
      setBanner({ type: 'error', text: ex.status === 429 ? s.errors.rate_limited : ex.code === 'network' ? s.errors.network : s.errors.generic })
    } finally {
      setBusy('')
    }
  }

  const restore = (r) => {
    setForm(fromDraft(r.data))
    setDraftCode(r.code)
    setErrors({})
    setResumeOpen(false)
    const st = Math.min(Math.max(1, r.step || 1), TOTAL)
    setStep(st); setMaxStep(st)
    setBanner({ type: 'info', text: requirePhoto ? `${s.resume.restored} ${s.saved.photo}` : s.resume.restored })
  }

  const docLink = (key) => {
    const href = page.links?.[key]
    if (!href) return null
    const internal = href.startsWith('/')
    return internal
      ? <> · <Link to={href} target="_blank" rel="noreferrer" className="mb-inline-link">{s.form.read}<ExternalLink size={13} aria-hidden="true" /></Link></>
      : <> · <a href={href} target="_blank" rel="noreferrer" className="mb-inline-link">{s.form.read}<ExternalLink size={13} aria-hidden="true" /></a></>
  }

  const optionLabel = (list, id) => list.find((x) => String(x.id) === String(id))?.name || s.form.none
  const reviewRows = [
    [1, s.form.fullName, form.fullName],
    [1, s.form.dob, form.dateOfBirth ? `${fmtDate(`${form.dateOfBirth}T00:00:00`, lang)}${age !== null && age >= 0 ? ` · ${fill(s.form.age, { n: age })}` : ''}` : ''],
    [2, s.form.district, `${optionLabel(meta.districts, form.districtId)} · ${optionLabel(meta.divisions, form.divisionId)}`],
    [2, s.form.email, form.email],
    [2, s.form.phone, form.phone],
    [3, s.form.nic, form.nic.toUpperCase()],
    [4, s.form.occupation, form.occupation],
    [4, s.form.interests, form.interests.map((k) => s.form.interestOpts[k]).join(', ')],
  ]

  return (
    <div className="mb-apply-grid">
      <form className="mb-card mb-form" onSubmit={submit} noValidate aria-labelledby="mb-form-title">
        <div className="mb-form-top">
          <div>
            <Eyebrow>{s.form.eyebrow}</Eyebrow>
            <h2 id="mb-form-title" className="mb-h2">{s.form.title}</h2>
            <p className="mb-muted">{s.form.intro}</p>
          </div>
          {!resumeOpen && (
            <button type="button" className="mb-link-btn" onClick={() => { setResumeOpen(true); setBanner(null) }}>
              <RotateCcw size={15} aria-hidden="true" />{s.form.resumeLink}
            </button>
          )}
        </div>

        {resumeOpen && <ResumePanel s={s} onRestored={restore} onCancel={() => setResumeOpen(false)} />}

        <Progress step={step} maxStep={maxStep} s={s} onGo={goTo} />

        <div className="mb-step" key={step}>
          <p className="mb-step-count">{fill(s.form.stepOf, { n: step, total: TOTAL })}</p>
          <h3 className="mb-step-title" tabIndex={-1} ref={headRef}>{s.steps[step - 1]}</h3>
          <Banner banner={banner} onClose={() => setBanner(null)} />

          {step === 1 && (
            <div className="mb-fields">
              <Field label={s.form.fullName} required value={form.fullName} onChange={set('fullName')} error={err('fullName')} autoComplete="name" maxLength={160} />
              <div className="mb-grid-2">
                <Field label={s.form.dob} required type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} error={err('dateOfBirth')}
                  max={new Date().toISOString().slice(0, 10)} min="1900-01-01" autoComplete="bday" />
                <div className="mb-age" aria-live="polite">
                  <span className="mb-age-num">{age !== null && age >= 0 && age <= 120 ? age : '—'}</span>
                  <span className="mb-age-label">{fill(s.form.age, { n: '' }).replace(/[:\s]+$/, '')}</span>
                </div>
              </div>
              <Chips legend={s.form.gender} name="gender" value={form.gender} onChange={set('gender')}
                options={meta.genders.map((g) => [g, s.form.genders[g]])} />
              {requirePhoto && (
                <PhotoField s={s} photo={photo} setPhoto={(f) => { setPhoto(f); setErrors((er) => { const n = { ...er }; delete n.photo; return n }) }}
                  error={err('photo')} setError={(code) => setErrors((er) => (code ? { ...er, photo: code } : er))} />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mb-fields">
              <Field as="textarea" rows={3} label={s.form.residential} required value={form.residentialAddress} onChange={set('residentialAddress')}
                error={err('residentialAddress')} autoComplete="street-address" maxLength={500} />
              <CheckRow checked={form.mailingSame} onChange={set('mailingSame')}>{s.form.mailingSame}</CheckRow>
              {!form.mailingSame && (
                <Field as="textarea" rows={3} label={s.form.mailing} required value={form.mailingAddress} onChange={set('mailingAddress')}
                  error={err('mailingAddress')} maxLength={500} />
              )}
              <div className="mb-grid-3">
                <Field as="select" label={s.form.province} required value={form.provinceId} error={err('provinceId')}
                  onChange={(e) => { setForm((f) => ({ ...f, provinceId: e.target.value, districtId: '', divisionId: '' })); setErrors((er) => ({ ...er, provinceId: undefined })) }}>
                  <option value="" disabled hidden />
                  {meta.provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Field>
                <Field as="select" label={s.form.district} required value={form.districtId} error={err('districtId')} disabled={!form.provinceId}
                  hint={!form.provinceId ? fill(s.form.chooseFirst, { field: s.form.province.toLowerCase() }) : undefined}
                  onChange={(e) => { setForm((f) => ({ ...f, districtId: e.target.value, divisionId: '' })); setErrors((er) => ({ ...er, districtId: undefined })) }}>
                  <option value="" disabled hidden />
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Field>
                <Field as="select" label={s.form.division} required value={form.divisionId} onChange={set('divisionId')} error={err('divisionId')}
                  disabled={!form.districtId}
                  hint={!form.districtId ? fill(s.form.chooseFirst, { field: s.form.district.toLowerCase() }) : division ? fill(s.form.divisionHint, { ed: division.electoralDistrict }) : undefined}>
                  <option value="" disabled hidden />
                  {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Field>
              </div>
              <div className="mb-grid-2">
                <Field label={s.form.phone} required type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} error={err('phone')}
                  hint={s.form.phoneHint} autoComplete="tel" maxLength={22} />
                <Field label={s.form.email} required type="email" value={form.email} onChange={set('email')} error={err('email')}
                  hint={s.form.emailHint} autoComplete="email" maxLength={160} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mb-fields">
              <Field label={s.form.nic} required value={form.nic} onChange={set('nic')} error={err('nic')} hint={s.form.nicHint}
                autoComplete="off" spellCheck="false" maxLength={14} className="mb-field-mono" />
              <Chips legend={s.form.citizenship} required name="citizenship" value={form.citizenship} onChange={set('citizenship')} error={err('citizenship')}
                options={meta.citizenship.map((c) => [c, s.form.citizenshipOpts[c]])} />
              <CheckRow checked={form.eligible} onChange={set('eligible')} error={err('eligible')}>
                {minAge > 0 ? fill(s.form.eligible, { age: minAge }) : s.form.eligibleNoAge}<span className="mb-req" aria-hidden="true"> *</span>
              </CheckRow>
            </div>
          )}

          {step === 4 && (
            <div className="mb-fields">
              <Field label={s.form.occupation} required value={form.occupation} onChange={set('occupation')} error={err('occupation')} autoComplete="organization-title" maxLength={120} />
              <Chips legend={s.form.interests} multi name="interests" value={form.interests} onChange={set('interests')}
                options={meta.interests.map((k) => [k, s.form.interestOpts[k]])} />
              <Chips legend={s.form.previous} required name="previousMember" value={form.previousMember} error={err('previousMember')}
                onChange={(v) => { setForm((f) => ({ ...f, previousMember: v })); setErrors((er) => ({ ...er, previousMember: undefined })) }}
                options={[[true, s.form.yes], [false, s.form.no]]} />
              {form.previousMember && (
                <Field label={s.form.previousOrg} required value={form.previousOrganisation} onChange={set('previousOrganisation')} error={err('previousOrganisation')} maxLength={160} />
              )}
            </div>
          )}

          {step === 5 && (
            <div className="mb-fields">
              <div className="mb-review">
                <h4>{s.form.review}</h4>
                <dl>
                  {reviewRows.map(([n, label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value || s.form.none}</dd>
                      <button type="button" className="mb-icon-btn" onClick={() => goTo(n)} aria-label={`${s.form.edit}: ${label}`}><Pencil size={14} /></button>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mb-decls">
                {DECLARATION_KEYS.map((k) => (
                  <CheckRow key={k} checked={form.declarations[k]} onChange={setDecl(k)} error={err(`declarations.${k}`)}>
                    {s.form.decl[k]}<span className="mb-req" aria-hidden="true"> *</span>
                    {k === 'rules' && docLink('rules')}
                    {k === 'constitution' && docLink('constitution')}
                    {k === 'conduct' && docLink('conduct')}
                  </CheckRow>
                ))}
              </div>
              <Field label={s.form.signature} required value={form.signature} onChange={set('signature')} error={err('signature')}
                hint={s.form.signatureHint} autoComplete="off" maxLength={160} className="mb-field-sign" />
            </div>
          )}
        </div>

        <div className="mb-form-actions">
          {step > 1 ? (
            <button type="button" className="mb-btn mb-btn-quiet" onClick={() => goTo(step - 1)} disabled={!!busy}>
              <ArrowLeft size={18} aria-hidden="true" />{s.form.prev}
            </button>
          ) : <span />}
          <div className="mb-form-actions-right">
            <button type="button" className="mb-btn mb-btn-outline" onClick={saveProgress} disabled={!!busy}>
              {busy === 'saving' ? <Loader2 size={18} className="mb-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
              {busy === 'saving' ? s.form.saving : s.form.save}
            </button>
            {step < TOTAL ? (
              <button type="submit" className="mb-btn mb-btn-primary" disabled={!!busy}>{s.form.next}<ArrowRight size={18} aria-hidden="true" /></button>
            ) : (
              <button type="submit" className="mb-btn mb-btn-primary" disabled={!!busy} aria-busy={busy === 'submitting' || undefined}>
                {busy === 'submitting' ? <Loader2 size={18} className="mb-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                {busy === 'submitting' ? s.form.submitting : s.form.submit}
              </button>
            )}
          </div>
        </div>
      </form>

      <aside className="mb-privacy" aria-labelledby="mb-privacy-title">
        <ShieldCheck size={26} aria-hidden="true" className="mb-privacy-icon" />
        <h3 id="mb-privacy-title">{s.privacy.title}</h3>
        <ul>{s.privacy.points.map((p) => <li key={p}>{p}</li>)}</ul>
        <Link to="/privacy-policy" className="mb-inline-link">{s.privacy.policy}<ArrowRight size={14} aria-hidden="true" /></Link>
      </aside>

      {saved && (
        <Modal title={s.saved.title} onClose={() => setSaved(null)}>
          {saved.updated && <p className="mb-muted">{s.saved.updated}</p>}
          <p>{s.saved.text}</p>
          <div className="mb-code">
            <code>{saved.code}</code>
            <button type="button" className="mb-btn mb-btn-outline mb-btn-sm" onClick={() => copy(saved.code)}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied ? s.saved.copied : s.saved.copy}
            </button>
          </div>
          <p className="mb-muted">{fill(s.saved.expires, { date: fmtDate(saved.expiresAt, lang, true) })}</p>
          {requirePhoto && <p className="mb-muted">{s.saved.photo}</p>}
          <div className="mb-row-actions"><button type="button" className="mb-btn mb-btn-primary" onClick={() => setSaved(null)}>{s.saved.close}</button></div>
        </Modal>
      )}
    </div>
  )
}
