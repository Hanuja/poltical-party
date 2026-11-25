import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, Save, Send, ShieldCheck, Loader2, Upload, X, Copy, RotateCcw, Info, AlertTriangle, ExternalLink, Pencil,
} from 'lucide-react'
import { Field, CheckRow, Chips, Eyebrow, scrollToId } from './memUi'
import { fill } from './membershipText'
import PledgeChecklist from './PledgeChecklist'
import PledgePagination from './PledgePagination'
import { PLEDGE_READER_COPY, PLEDGES_REQUIRED_MESSAGE } from './membershipPledges'
import { memApi } from './memApi'
import {
  EMPTY_FORM, validateStep, toPayload, fromDraft, ageFrom, stepOfField,
} from './memForm'

const TOTAL = 7
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
  const submit = async () => {
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
    <div className="mb-resume">
      <h3>{s.resume.title}</h3>
      <p>{s.resume.text}</p>
      <div className="mb-grid-2">
        <Field label={s.resume.code} required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" spellCheck="false" maxLength={20} />
        <Field label={s.resume.email} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      {error && <p className="mb-msg mb-msg-error" role="alert">{error}</p>}
      <div className="mb-row-actions">
        <button type="button" className="mb-btn mb-btn-quiet" onClick={onCancel}>{s.resume.cancel}</button>
        <button type="button" className="mb-btn mb-btn-primary" onClick={submit} disabled={state === 'loading'}>
          {state === 'loading' ? <Loader2 size={18} className="mb-spin" aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}{s.resume.button}
        </button>
      </div>
    </div>
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
  const pledgeReaderCopy = PLEDGE_READER_COPY[lang] || PLEDGE_READER_COPY.en
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
  const setPledge = (k, value) => {
    setForm((f) => ({ ...f, pledges: { ...f.pledges, [k]: value } }))
    setErrors((er) => { const n = { ...er }; delete n.pledges; return n })
  }

  const districts = useMemo(() => meta.districts.filter((d) => String(d.provinceId) === String(form.provinceId)), [meta, form.provinceId])
  const divisions = useMemo(() => meta.divisions.filter((d) => String(d.districtId) === String(form.districtId)), [meta, form.districtId])
  const division = divisions.find((d) => String(d.id) === String(form.divisionId))

  const err = (field) => {
    const code = errors[field]
    if (!code) return null
    if (field === 'pledges' && code === 'pledges_incomplete') return pledgeReaderCopy.validation || PLEDGES_REQUIRED_MESSAGE
    if (code === 'too_young') return fill(s.errors.too_young, { age: minAge })
    if (code === 'required' && ['gender', 'maritalStatus'].includes(field)) return s.errors.required
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
    [1, s.form.fullNameTa, form.fullNameTa],
    [1, s.form.fullNameEn, form.fullNameEn],
    [1, s.form.nic, form.nic.toUpperCase()],
    [1, s.form.dob, form.dateOfBirth ? `${fmtDate(`${form.dateOfBirth}T00:00:00`, lang)}${age !== null && age >= 0 ? ` · ${fill(s.form.age, { n: age })}` : ''}` : ''],
    [1, s.form.gender, form.gender],
    [1, s.form.maritalStatus, form.maritalStatus],
    [2, s.form.permanentAddress, form.permanentAddress],
    [2, s.form.currentAddress, form.currentAddress],
    [2, s.form.gnDivision, form.gnDivision],
    [2, s.form.gnNumber, form.gnNumber],
    [2, s.form.dsDivision, form.dsDivision],
    [2, s.form.localAuthority, form.localAuthority],
    [2, s.form.electoralConstituency, form.electoralConstituency],
    [2, s.form.district, `${optionLabel(meta.districts, form.districtId)} · ${optionLabel(meta.divisions, form.divisionId)}`],
    [2, s.form.province, form.province],
    [2, s.form.phone, form.phone],
    [2, s.form.whatsapp, form.whatsapp],
    [2, s.form.email, form.email],
    [5, s.form.education, form.education.map((k) => s.form.educationOpts[k]).join(', ')],
    [5, s.form.employmentStatus, form.employmentStatus.map((k) => s.form.employmentOpts[k]).join(', ')],
    [6, s.form.interests, form.interests.map((k) => s.form.interestOpts[k]).join(', ')],
  ]

  return (
    <div className="mb-apply-grid">
      <aside className="mb-privacy" aria-labelledby="mb-privacy-title">
        <ShieldCheck size={26} aria-hidden="true" className="mb-privacy-icon" />
        <h3 id="mb-privacy-title">{pledgeReaderCopy.sectionTitle}</h3>
        <Link to="/privacy-policy" className="mb-inline-link">{pledgeReaderCopy.privacyPolicy}<ArrowRight size={14} aria-hidden="true" /></Link>
        <PledgePagination language={lang} />
      </aside>

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
              <Field label={s.form.fullNameTa} required value={form.fullNameTa} onChange={set('fullNameTa')} error={err('fullNameTa')} autoComplete="name" maxLength={160} />
              <Field label={s.form.fullNameEn} required value={form.fullNameEn} onChange={set('fullNameEn')} error={err('fullNameEn')} autoComplete="name" maxLength={160} />
              <div className="mb-grid-2">
                <Field label={s.form.nic} required value={form.nic} onChange={set('nic')} error={err('nic')} hint={s.form.nicHint}
                  autoComplete="off" spellCheck="false" maxLength={14} className="mb-field-mono" />
                <Field label={s.form.dob} required type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} error={err('dateOfBirth')}
                  max={new Date().toISOString().slice(0, 10)} min="1900-01-01" autoComplete="bday" />
              </div>
              <Chips legend={s.form.gender} name="gender" required error={err('gender')} value={form.gender} onChange={set('gender')}
                options={['male', 'female', 'other'].map((g) => [g, s.form.genderOpts?.[g] ?? s.form.genders?.[g] ?? g])} />
              <Chips legend={s.form.maritalStatus} name="maritalStatus" required error={err('maritalStatus')} value={form.maritalStatus} onChange={set('maritalStatus')}
                options={Object.entries(s.form.maritalStatusOpts || {}).map(([k, v]) => [k, v])} />
              {requirePhoto && (
                <PhotoField s={s} photo={photo} setPhoto={(f) => { setPhoto(f); setErrors((er) => { const n = { ...er }; delete n.photo; return n }) }}
                  error={err('photo')} setError={(code) => setErrors((er) => (code ? { ...er, photo: code } : er))} />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mb-fields">
              <Field as="textarea" rows={3} label={s.form.permanentAddress} required value={form.permanentAddress} onChange={set('permanentAddress')}
                error={err('permanentAddress')} autoComplete="street-address" maxLength={500} />
              <Field as="textarea" rows={2} label={s.form.currentAddress} value={form.currentAddress} onChange={set('currentAddress')}
                autoComplete="street-address" maxLength={500} />
              <div className="mb-grid-2">
                <Field label={s.form.gnDivision} required value={form.gnDivision} onChange={set('gnDivision')} error={err('gnDivision')} maxLength={100} />
                <Field label={s.form.gnNumber} value={form.gnNumber} onChange={set('gnNumber')} maxLength={20} />
              </div>
              <div className="mb-grid-2">
                <Field label={s.form.dsDivision} required value={form.dsDivision} onChange={set('dsDivision')} error={err('dsDivision')} maxLength={100} />
                <Field label={s.form.localAuthority} value={form.localAuthority} onChange={set('localAuthority')} maxLength={100} />
              </div>
              <Field label={s.form.electoralConstituency} value={form.electoralConstituency} onChange={set('electoralConstituency')} maxLength={100} />
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
              <div className="mb-grid-3">
                <Field label={s.form.phone} required type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} error={err('phone')}
                  hint={s.form.phoneHint} autoComplete="tel" maxLength={22} />
                <Field label={s.form.whatsapp} type="tel" inputMode="tel" value={form.whatsapp} onChange={set('whatsapp')}
                  autoComplete="tel" maxLength={22} />
                <Field label={s.form.email} type="email" value={form.email} onChange={set('email')} error={err('email')}
                  hint={s.form.emailHint} autoComplete="email" maxLength={160} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mb-fields">
              <section className="mb-pledge-section" aria-labelledby="mb-pledge-title">
                <h4 id="mb-pledge-title">{pledgeReaderCopy.declarationTitle}</h4>
                <p className="mb-pledge-intro">{pledgeReaderCopy.intro}</p>
                <PledgeChecklist values={form.pledges} onChange={setPledge} className="mb-pledge-list-declaration" language={lang} />
                {err('pledges') && <p className="mb-msg mb-msg-error" role="alert">{err('pledges')}</p>}
              </section>
              <div className="mb-decls">
                {['citizen', 'noOtherParty', 'govEmployee', 'trueInfo'].map((k) => (
                  <CheckRow key={k} checked={form.declarations[k]} onChange={setDecl(k)} error={err(`declarations.${k}`)}>
                    {s.form.decl[k]}<span className="mb-req" aria-hidden="true"> *</span>
                  </CheckRow>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mb-fields">
              <div className="mb-signature-pad">
                <label className="mb-field-label">{s.form.signature} <span className="mb-req">*</span></label>
                <canvas
                  ref={(el) => {
                    if (el && !el.dataset.init) {
                      el.dataset.init = 'true'
                      const ctx = el.getContext('2d')
                      ctx.strokeStyle = '#171717'
                      ctx.lineWidth = 2
                      ctx.lineCap = 'round'
                      ctx.lineJoin = 'round'
                    }
                  }}
                  width="400"
                  height="150"
                  className="mb-signature-canvas"
                  onMouseDown={(e) => {
                    const canvas = e.target
                    const ctx = canvas.getContext('2d')
                    const rect = canvas.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    const onMove = (ev) => {
                      const mx = ev.clientX - rect.left
                      const my = ev.clientY - rect.top
                      ctx.lineTo(mx, my)
                      ctx.stroke()
                    }
                    const onUp = () => {
                      canvas.removeEventListener('mousemove', onMove)
                      canvas.removeEventListener('mouseup', onUp)
                      const dataUrl = canvas.toDataURL()
                      setForm((f) => ({ ...f, signature: dataUrl }))
                    }
                    canvas.addEventListener('mousemove', onMove)
                    canvas.addEventListener('mouseup', onUp)
                  }}
                />
                <button
                  type="button"
                  className="mb-btn mb-btn-secondary"
                  onClick={() => {
                    const canvas = document.querySelector('.mb-signature-canvas')
                    if (canvas) {
                      const ctx = canvas.getContext('2d')
                      ctx.clearRect(0, 0, canvas.width, canvas.height)
                      setForm((f) => ({ ...f, signature: '' }))
                    }
                  }}
                >
                  {s.form.clearSignature}
                </button>
              </div>
              <Field label={s.form.signatureDate} required type="date" value={form.signatureDate} onChange={set('signatureDate')} error={err('signatureDate')} />
            </div>
          )}

          {step === 5 && (
            <div className="mb-fields">
              <Chips legend={s.form.education} required multi name="education" value={form.education} onChange={set('education')} error={err('education')}
                options={[
                  ['up_to_grade_9', s.form.educationOpts.up_to_grade_9],
                  ['gce_ol', s.form.educationOpts.gce_ol],
                  ['gce_al', s.form.educationOpts.gce_al],
                  ['diploma', s.form.educationOpts.diploma],
                  ['degree', s.form.educationOpts.degree],
                  ['postgraduate', s.form.educationOpts.postgraduate],
                ]} />
              <Chips legend={s.form.employmentStatus} required multi name="employmentStatus" value={form.employmentStatus} onChange={set('employmentStatus')} error={err('employmentStatus')}
                options={[
                  ['government', s.form.employmentOpts.government],
                  ['private', s.form.employmentOpts.private],
                  ['self_employed', s.form.employmentOpts.self_employed],
                  ['agriculture', s.form.employmentOpts.agriculture],
                  ['fisheries', s.form.employmentOpts.fisheries],
                  ['labour', s.form.employmentOpts.labour],
                  ['student', s.form.employmentOpts.student],
                  ['job_seeker', s.form.employmentOpts.job_seeker],
                  ['homemaker', s.form.employmentOpts.homemaker],
                  ['retired', s.form.employmentOpts.retired],
                  ['abroad', s.form.employmentOpts.abroad],
                  ['other', s.form.employmentOpts.other],
                ]} />
              {form.employmentStatus.includes('other') && (
                <Field label={s.form.employmentOther} required value={form.employmentOther} onChange={set('employmentOther')} error={err('employmentOther')} maxLength={100} />
              )}
            </div>
          )}

          {step === 6 && (
            <div className="mb-fields">
              <Chips legend={s.form.interests} required multi name="interests" value={form.interests} onChange={set('interests')} error={err('interests')}
                options={[
                  ['education', s.form.interestOpts.education],
                  ['healthcare', s.form.interestOpts.healthcare],
                  ['agriculture', s.form.interestOpts.agriculture],
                  ['fisheries', s.form.interestOpts.fisheries],
                  ['water', s.form.interestOpts.water],
                  ['environment', s.form.interestOpts.environment],
                  ['technology', s.form.interestOpts.technology],
                  ['law', s.form.interestOpts.law],
                  ['business', s.form.interestOpts.business],
                  ['arts_sports', s.form.interestOpts.arts_sports],
                  ['social_service', s.form.interestOpts.social_service],
                ]} />
            </div>
          )}

          {step === 7 && (
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
              <section className="mb-terms" aria-labelledby="mb-terms-title">
                <h4 id="mb-terms-title">{s.form.termsTitle}</h4>
                <div className="mb-terms-content">
                  {s.form.terms.map((term, i) => (
                    <p key={i}>{term}</p>
                  ))}
                </div>
              </section>
              <CheckRow checked={form.termsAccepted} onChange={set('termsAccepted')} error={err('termsAccepted')}>
                {s.form.termsAccept}<span className="mb-req" aria-hidden="true"> *</span>
              </CheckRow>
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
