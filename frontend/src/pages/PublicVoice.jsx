import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import i18n from '../i18n'
import { publicVoiceText } from '../data/publicVoiceText'
import { publicVoiceApi } from '../services/api'
import { getLeadershipMeta } from '../services/content'
import { DS_BY_DISTRICT } from '../data/dsDivisions'
import PageBanner from '../components/PageBanner'
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, AudioLines, Camera, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, FileAudio, FileVideo2, ImagePlus,
  Loader2, MapPin, Mic, Paperclip, Pause, Play, Search, Send, ShieldCheck, Sparkles,
  Square, Trash2, Video, Waves, X,
} from 'lucide-react'
import '../styles/public-voice.css'

Object.entries(publicVoiceText).forEach(([languageCode, resources]) => {
  i18n.addResourceBundle(languageCode, 'translation', { pv: resources }, true, true)
})

const CATEGORIES = [
  'roads', 'water', 'electricity', 'drainage', 'waste', 'education', 'healthcare',
  'agriculture', 'employment', 'housing', 'infrastructure', 'environment',
  'public-service', 'village-development', 'safety', 'other',
]
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_EXT = /\.(jpe?g|png|webp)$/i
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
const VIDEO_EXT = /\.(mp4|mov|m4v|webm)$/i
const AUDIO_TYPES = ['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg', 'audio/x-m4a', 'video/mp4']
const AUDIO_EXT = /\.(webm|mp3|wav|m4a|ogg|mp4)$/i
const MAX_VOICE = 120

let uid = 0
const nid = () => ++uid

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PublicVoice() {
  const { t, language } = useLanguage()
  const { id } = useParams()
  const [concerns, setConcerns] = useState([])
  const [concernState, setConcernState] = useState('loading')
  const [filters, setFilters] = useState({ q: '', category: '', district: '' })
  const [geo, setGeo] = useState({ provinces: [], districts: [] })
  const [geoUnavailable, setGeoUnavailable] = useState(false)
  const listRef = useRef(null)
  const [form, setForm] = useState({
    category: '', province: '', district: '', dsDivision: '', dsOther: '', gnDivision: '',
    village: '', specificLocation: '', title: '', description: '',
    name: '', phone: '', email: '', contactMethod: 'phone',
    consent: false, aiConfirmation: false, aiDescription: '', website: '',
  })
  const [photos, setPhotos] = useState([])       // {id, file, url}
  const [videos, setVideos] = useState([])       // {id, file, url, duration, size}
  const [voice, setVoice] = useState(null)       // {blob, url, duration, name}
  const [illustration, setIllustration] = useState(null) // {file, url}
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [done, setDone] = useState(null)         // {referenceNumber}
  const [rec, setRec] = useState({ state: 'idle', elapsed: 0 }) // idle|recording|paused|done
  const [audioFile, setAudioFile] = useState(null)

  const photoInput = useRef(null)
  const photoCam = useRef(null)
  const videoInput = useRef(null)
  const videoCam = useRef(null)
  const audioInput = useRef(null)
  const illusInput = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTsRef = useRef(0)
  const pausedTotalRef = useRef(0)
  const pauseStartRef = useRef(0)

  useEffect(() => {
    let active = true
    getLeadershipMeta().then((meta) => { if (active) setGeo({ provinces: meta.provinces || [], districts: meta.districts || [] }) }).catch(() => { if (active) setGeoUnavailable(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setConcernState('loading')
    const districtLabel = geo.districts.find((district) => district.key === filters.district)?.labels?.en || filters.district
    publicVoiceApi.list({ ...filters, district: districtLabel, limit: 12, page: 1 })
      .then((data) => { if (active) { setConcerns(data.items || []); setConcernState('ready') } })
      .catch(() => { if (active) setConcernState('error') })
    return () => { active = false }
  }, [filters, geo.districts])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const districts = useMemo(() => {
    return geo.districts.filter((district) => !form.province || district.province === form.province)
  }, [geo.districts, form.province])

  const dsOptions = useMemo(() => {
    const d = geo.districts.find((x) => x.key === form.district)
    return DS_BY_DISTRICT[d?.labels?.en || ''] || []
  }, [geo.districts, form.district])

  const revoke = (item) => { if (item?.url) URL.revokeObjectURL(item.url) }

  /* ---------- photos ---------- */
  const addPhotos = useCallback((fileList) => {
    const seen = new Set(photos.map((p) => `${p.file.name}:${p.file.size}`))
    const next = []
    const errs = []
    for (const file of Array.from(fileList || [])) {
      if (!PHOTO_TYPES.includes(file.type) && !PHOTO_EXT.test(file.name)) { errs.push(file.name); continue }
      if (file.size > 10 * 1024 * 1024) { errs.push(file.name); continue }
      const key = `${file.name}:${file.size}`
      if (seen.has(key)) continue
      seen.add(key)
      next.push({ id: nid(), file, url: URL.createObjectURL(file) })
    }
    if (errs.length) setError(t('pv.errPhotoType'))
    setPhotos((p) => [...p, ...next].slice(0, 30))
  }, [photos, t])

  const removePhoto = (id) => {
    setPhotos((p) => { const it = p.find((x) => x.id === id); if (it) revoke(it); return p.filter((x) => x.id !== id) })
  }

  /* ---------- videos ---------- */
  const addVideos = useCallback(async (fileList) => {
    const next = []
    let bad = false
    for (const file of Array.from(fileList || [])) {
      if (!VIDEO_TYPES.includes(file.type) && !VIDEO_EXT.test(file.name)) { bad = true; continue }
      if (file.size > 100 * 1024 * 1024) { bad = true; continue }
      const url = URL.createObjectURL(file)
      const duration = await new Promise((res) => {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => { res(isFinite(v.duration) ? v.duration : null); URL.revokeObjectURL(url) }
        v.onerror = () => { res(null); URL.revokeObjectURL(url) }
        v.src = url
      })
      if (duration !== null && duration > 180) { bad = true; URL.revokeObjectURL(url); continue }
      next.push({ id: nid(), file, url, duration, size: file.size })
    }
    if (bad) setError(t('pv.errVideo'))
    setVideos((v) => [...v, ...next].slice(0, 3))
  }, [t])

  const removeVideo = (id) => {
    setVideos((v) => { const it = v.find((x) => x.id === id); if (it) revoke(it); return v.filter((x) => x.id !== id) })
  }

  /* ---------- voice recording ---------- */
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  const elapsedNow = () => {
    const base = startTsRef.current ? Date.now() - startTsRef.current - pausedTotalRef.current : 0
    return Math.floor(base / 1000)
  }

  const startRec = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m)) || ''
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((tr) => tr.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        if (blob.size) {
          setVoice((old) => { if (old) revoke(old); return { blob, url: URL.createObjectURL(blob), duration: elapsedNow(), name: 'voice-message' } })
          setAudioFile(null)
        }
        setRec({ state: 'idle', elapsed: 0 })
      }
      recorderRef.current = mr
      startTsRef.current = Date.now(); pausedTotalRef.current = 0; pauseStartRef.current = 0
      mr.start(250)
      setRec({ state: 'recording', elapsed: 0 })
      timerRef.current = setInterval(() => {
        const el = elapsedNow()
        setRec((r) => ({ ...r, elapsed: el }))
        if (el >= MAX_VOICE) stopRec()
      }, 500)
    } catch {
      setError(t('pv.errMic'))
    }
  }

  const pauseRec = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause()
      pauseStartRef.current = Date.now()
      setRec((r) => ({ ...r, state: 'paused' }))
    }
  }
  const resumeRec = () => {
    if (recorderRef.current?.state === 'paused') {
      pausedTotalRef.current += Date.now() - pauseStartRef.current
      pauseStartRef.current = 0
      recorderRef.current.resume()
      setRec((r) => ({ ...r, state: 'recording' }))
    }
  }
  const stopRec = () => {
    stopTimer()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
    else setRec({ state: 'idle', elapsed: 0 })
  }
  const discardRec = () => {
    stopTimer()
    const mr = recorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.ondataavailable = null
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((tr) => tr.stop())
        streamRef.current = null
        setRec({ state: 'idle', elapsed: 0 })
      }
      try { mr.stop() } catch { setRec({ state: 'idle', elapsed: 0 }) }
    } else setRec({ state: 'idle', elapsed: 0 })
  }

  const pickAudioFile = (file) => {
    if (!file) return
    const okType = AUDIO_TYPES.includes(file.type) || AUDIO_EXT.test(file.name)
    if (!okType || file.size > 12 * 1024 * 1024) { setError(t('pv.errAudio')); return }
    setError('')
    if (voice) revoke(voice)
    setVoice({ file, url: URL.createObjectURL(file), duration: null, name: file.name })
    setAudioFile(file)
    if (recorderRef.current) discardRec()
  }

  const removeVoice = () => {
    if (voice) revoke(voice)
    setVoice(null); setAudioFile(null)
    discardRec()
  }

  /* ---------- illustration ---------- */
  const pickIllustration = (file) => {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type) && !PHOTO_EXT.test(file.name)) { setError(t('pv.errPhotoType')); return }
    if (file.size > 10 * 1024 * 1024) { setError(t('pv.errPhotoType')); return }
    setError('')
    if (illustration) revoke(illustration)
    setIllustration({ file, url: URL.createObjectURL(file) })
    set('aiConfirmation', false)
  }

  /* ---------- validation & submit ---------- */
  const validate = () => {
    const e = {}
    if (!form.category) e.category = t('pv.req')
    if (!form.province) e.province = t('pv.req')
    if (!form.district) e.district = t('pv.req')
    const dsOk = form.dsDivision === '__other__' ? !!form.dsOther.trim() : !!form.dsDivision.trim()
    if (!dsOk) e.dsDivision = t('pv.req')
    if (!form.village.trim()) e.village = t('pv.req')
    if (form.title.trim().length < 4) e.title = t('pv.errTitle')
    if (form.description.trim().length < 30) e.description = t('pv.errDesc')
    if (photos.length < 3) e.photos = t('pv.errPhotosMin')
    if (photos.length > 30) e.photos = t('pv.errPhotosMax')
    if (!form.name.trim()) e.name = t('pv.req')
    if (!/^[0-9+().\s-]{7,40}$/.test(form.phone.trim())) e.phone = t('pv.errPhone')
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = t('pv.errEmail')
    if (!form.consent) e.consent = t('pv.reqConsent')
    if (illustration && !form.aiConfirmation) e.aiConfirmation = t('pv.reqAi')
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    setError('')
    if (!validate()) return
    setBusy(true); setProgress(0)
    try {
      const payload = {
        website: form.website,
        category: form.category,
        province: geo.provinces.find((province) => province.key === form.province)?.labels?.en || form.province,
        district: geo.districts.find((district) => district.key === form.district)?.labels?.en || form.district,
        dsDivision: form.dsDivision === '__other__' ? form.dsOther.trim() : form.dsDivision.trim(),
        gnDivision: form.gnDivision.trim() || null,
        village: form.village.trim(),
        specificLocation: form.specificLocation.trim() || null,
        title: form.title.trim(),
        description: form.description.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        contactMethod: form.contactMethod,
        consent: true,
        voiceDuration: voice?.duration ?? null,
        videoDurations: videos.map((v) => v.duration),
        aiConfirmation: !!illustration ? !!form.aiConfirmation : undefined,
        aiDescription: illustration ? form.aiDescription.trim() : undefined,
      }
      const fd = new FormData()
      fd.append('payload', JSON.stringify(payload))
      photos.forEach((p) => fd.append('photos[]', p.file, p.file.name))
      videos.forEach((v) => fd.append('videos[]', v.file, v.file.name))
      if (voice) {
        if (voice.file) fd.append('voice', voice.file, voice.file.name)
        else fd.append('voice', voice.blob, 'voice-message.webm')
      }
      if (illustration) fd.append('illustration', illustration.file, illustration.file.name)
      const res = await publicVoiceApi.submit(fd, (e) => {
        if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
      })
      setDone(res)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('pv.errSubmit'))
    } finally {
      setBusy(false); setProgress(0)
    }
  }

  if (id) return <PublicVoiceDetail id={id} language={language} t={t} />

  /* ---------- success ---------- */
  if (done) {
    return (
      <div className="pv-page">
        <PageBanner breadcrumbItems={[{ label: t('nav.moVoice') }]} />
        <div className="pv-wrap">
          <div className="pv-success" role="status">
            <CheckCircle2 size={56} className="pv-success-icon" />
            <h2>{t('pv.successTitle')}</h2>
            <p>{t('pv.successSub')}</p>
            <div className="pv-ref">{done.referenceNumber}</div>
            <p className="pv-ref-note">{t('pv.refNote')}</p>
          </div>
        </div>
      </div>
    )
  }

  const recording = rec.state === 'recording' || rec.state === 'paused'
  const selProvince = geo.provinces.find((province) => province.key === form.province)

  return (
    <div className="pv-page">
      <PageBanner breadcrumbItems={[{ label: t('nav.moVoice') }]} />
      <section className="pv-hero">
        <div className="pv-wrap pv-hero-layout">
          <div className="pv-hero-copy">
            <span className="pv-eyebrow"><span />{language === 'ta' ? 'மக்களின் குரல் · சமூகப் பிரச்சினைகள்' : 'Community concerns · Public Voice'}</span>
            <h1>{language === 'ta' ? 'உங்கள் குரல். உங்கள் பிரச்சினை. எங்கள் கவனம்.' : 'Your voice. Your community. Heard.'}</h1>
            <p>{language === 'ta' ? 'உங்கள் கிராமம், நகரம் அல்லது மாவட்டத்தில் உள்ள சவால்களைப் பகிருங்கள். உரை, குரல் பதிவு, புகைப்படங்கள் மற்றும் காணொளி ஆதாரங்களுடன் சமர்ப்பிக்கலாம்.' : 'Every community deserves to be heard. Share a local concern with photos, a short video, or a voice recording. Each submission is reviewed before anything is published.'}</p>
            <div className="pv-hero-actions"><a className="pv-primary-button" href="#pv-form">{language === 'ta' ? 'பொதுப் பிரச்சினையைச் சமர்ப்பிக்கவும்' : 'Submit a public concern'}<ArrowRight size={17}/></a><a className="pv-hero-ghost" href="#community-concerns">{language === 'ta' ? 'சமூகக் குரல்களைப் பாருங்கள்' : 'Explore community concerns'}<ArrowDown size={16}/></a></div>
            <div className="pv-hero-trust"><ShieldCheck size={16}/><span>{language === 'ta' ? 'உங்கள் தொடர்பு விவரங்கள் தனிப்பட்டவை. அங்கீகரிக்கப்பட்ட தகவல்கள் மட்டுமே வெளியிடப்படும்.' : 'Your contact details remain private. Only approved information is published.'}</span></div>
          </div>
          <div className="pv-hero-visual" aria-label="Microphone and audio waveform illustration"><span className="pv-visual-orbit pv-orbit-one"/><span className="pv-visual-orbit pv-orbit-two"/><div className="pv-mic-orb"><Mic size={68} strokeWidth={1.2}/></div><div className="pv-hero-wave" aria-hidden="true">{Array.from({ length: 43 }, (_, i) => <i key={i} style={{ '--wave-index': i, '--wave-height': `${12 + ((i * 17) % 34)}px` }}/>)}</div><span className="pv-visual-caption">01 / YOUR VOICE MATTERS</span></div>
        </div>
        <div className="pv-wrap pv-highlight-row"><div className="pv-highlight"><span>01</span><Mic size={18}/><b>{language === 'ta' ? 'பிரச்சினையைப் பகிருங்கள்' : 'Share your concern'}</b></div><div className="pv-highlight"><span>02</span><AudioLines size={18}/><b>{language === 'ta' ? 'உங்கள் குரலைப் பதிவு செய்யுங்கள்' : 'Record your voice'}</b></div><div className="pv-highlight"><span>03</span><ImagePlus size={18}/><b>{language === 'ta' ? 'புகைப்படம் மற்றும் காணொளி சேருங்கள்' : 'Add photo & video evidence'}</b></div></div>
      </section>
      <div className="pv-wrap">
        <form id="pv-form" className="pv-form" onSubmit={submit} noValidate>
          {/* honeypot */}
          <input type="text" name="website" value={form.website} onChange={(e) => set('website', e.target.value)} className="pv-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          {/* category + location */}
          <section className="pv-card">
            <h3><span>1</span>{t('pv.s1')}</h3>
            <div className="pv-grid">
              <label className="pv-field">
                <span>{t('pv.category')} <b>*</b></span>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={fieldErrors.category ? 'pv-invalid' : ''}>
                  <option value="">{t('pv.select')}</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{t(`pv.cat.${c}`)}</option>)}
                </select>
                {fieldErrors.category && <em>{fieldErrors.category}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.province')} <b>*</b></span>
                {geo.provinces.length ? <select value={form.province} onChange={(e) => { setForm((f) => ({ ...f, province: e.target.value, district: '', dsDivision: '', dsOther: '', gnDivision: '' })) }} className={fieldErrors.province ? 'pv-invalid' : ''}>
                  <option value="">{t('pv.select')}</option>
                  {geo.provinces.map((p) => <option key={p.key} value={p.key}>{p.labels?.[language] || p.labels?.en || p.key}</option>)}
                </select> : <input value={form.province} onChange={(e) => set('province', e.target.value)} placeholder={t('pv.province')} className={fieldErrors.province ? 'pv-invalid' : ''} />}
                {fieldErrors.province && <em>{fieldErrors.province}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.district')} <b>*</b></span>
                {geo.districts.length ? <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value, dsDivision: '', gnDivision: '' }))} disabled={!selProvince} className={fieldErrors.district ? 'pv-invalid' : ''}>
                  <option value="">{selProvince ? t('pv.select') : t('pv.pickProvince')}</option>
                  {districts.map((d) => <option key={d.key} value={d.key}>{d.labels?.[language] || d.labels?.en || d.key}</option>)}
                </select> : <input value={form.district} onChange={(e) => set('district', e.target.value)} placeholder={t('pv.district')} className={fieldErrors.district ? 'pv-invalid' : ''} />}
                {fieldErrors.district && <em>{fieldErrors.district}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.dsDivision')} <b>*</b></span>
                {dsOptions.length ? (
                  <select value={form.dsDivision} onChange={(e) => setForm((f) => ({ ...f, dsDivision: e.target.value, dsOther: e.target.value === '__other__' ? f.dsOther : '' }))} disabled={!form.district} className={fieldErrors.dsDivision ? 'pv-invalid' : ''}>
                    <option value="">{form.district ? t('pv.select') : t('pv.pickDistrict')}</option>
                    {dsOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                    <option value="__other__">{t('pv.otherDs')}</option>
                  </select>
                ) : (
                  <input value={form.dsDivision} onChange={(e) => set('dsDivision', e.target.value)} disabled={!form.district} placeholder={form.district ? t('pv.dsOtherPh') : t('pv.pickDistrict')} className={fieldErrors.dsDivision ? 'pv-invalid' : ''} />
                )}
                {form.dsDivision === '__other__' && (
                  <input value={form.dsOther} onChange={(e) => set('dsOther', e.target.value)} placeholder={t('pv.dsOtherPh')} className="pv-field-sub" />
                )}
                {fieldErrors.dsDivision && <em>{fieldErrors.dsDivision}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.gnDivision')}</span>
                <input value={form.gnDivision} onChange={(e) => set('gnDivision', e.target.value)} placeholder={t('pv.gnPh')} disabled={!form.district} />
              </label>
              <label className="pv-field">
                <span>{t('pv.village')} <b>*</b></span>
                <input value={form.village} onChange={(e) => set('village', e.target.value)} placeholder={t('pv.villagePh')} className={fieldErrors.village ? 'pv-invalid' : ''} />
                {fieldErrors.village && <em>{fieldErrors.village}</em>}
              </label>
              <label className="pv-field pv-span2">
                <span>{t('pv.specificLocation')}</span>
                <input value={form.specificLocation} onChange={(e) => set('specificLocation', e.target.value)} placeholder={t('pv.locPh')} />
              </label>
            </div>
          </section>

          {/* subject + description */}
          <section className="pv-card">
            <h3><span>2</span>{t('pv.s2')}</h3>
            <label className="pv-field">
              <span>{t('pv.subject')} <b>*</b></span>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} className={fieldErrors.title ? 'pv-invalid' : ''} />
              {fieldErrors.title && <em>{fieldErrors.title}</em>}
            </label>
            <label className="pv-field">
              <span>{t('pv.description')} <b>*</b></span>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={6} maxLength={3000} placeholder={t('pv.descPh')} className={fieldErrors.description ? 'pv-invalid' : ''} />
              <small className="pv-count">{form.description.trim().length}/3000</small>
              {fieldErrors.description && <em>{fieldErrors.description}</em>}
            </label>
          </section>

          {/* evidence */}
          <section className="pv-card">
            <h3><span>3</span>{t('pv.s3')}</h3>
            <div className="pv-evidence-bar">
              <button type="button" className="pv-ev pv-ev-photo" onClick={() => photoInput.current?.click()}>
                <Camera size={22} /><span>{t('pv.addPhotos')}</span><small>{t('pv.photosHint')}</small>
              </button>
              <button type="button" className="pv-ev pv-ev-video" onClick={() => videoInput.current?.click()}>
                <Video size={22} /><span>{t('pv.addVideos')}</span><small>{t('pv.videosHint')}</small>
              </button>
              <button type="button" className={`pv-ev pv-ev-voice ${recording ? 'is-rec' : ''}`} onClick={recording ? undefined : startRec}>
                <Mic size={22} /><span>{t('pv.recordVoice')}</span><small>{t('pv.voiceHint')}</small>
              </button>
            </div>

            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
            <input ref={photoCam} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
            <input ref={videoInput} type="file" accept="video/mp4,video/quicktime,video/webm,.m4v" multiple hidden onChange={(e) => { addVideos(e.target.files); e.target.value = '' }} />
            <input ref={videoCam} type="file" accept="video/mp4,video/quicktime,video/webm,.m4v" capture="environment" hidden onChange={(e) => { addVideos(e.target.files); e.target.value = '' }} />
            <input ref={audioInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" hidden onChange={(e) => { pickAudioFile(e.target.files?.[0]); e.target.value = '' }} />

            {/* photos */}
            <div className="pv-media-block">
              <div className="pv-media-head">
                <h4>{t('pv.photos')} <span className="pv-count-pill">{photos.length}/30</span></h4>
                <div className="pv-mini-actions">
                  <button type="button" onClick={() => photoCam.current?.click()}><Camera size={14} /> {t('pv.takePhoto')}</button>
                  <button type="button" onClick={() => photoInput.current?.click()}><ImagePlus size={14} /> {t('pv.gallery')}</button>
                </div>
              </div>
              {fieldErrors.photos && <em className="pv-err-inline">{fieldErrors.photos}</em>}
              <p className="pv-note">{t('pv.photosRule')}</p>
              {photos.length > 0 && (
                <div className="pv-thumbs">
                  {photos.map((p) => (
                    <figure key={p.id} className="pv-thumb">
                      <img src={p.url} alt="" loading="lazy" />
                      <button type="button" onClick={() => removePhoto(p.id)} aria-label={t('pv.remove')}><Trash2 size={13} /></button>
                    </figure>
                  ))}
                </div>
              )}
            </div>

            {/* videos */}
            <div className="pv-media-block">
              <div className="pv-media-head">
                <h4>{t('pv.videos')} <span className="pv-count-pill">{videos.length}/3</span></h4>
                <div className="pv-mini-actions">
                  <button type="button" onClick={() => videoCam.current?.click()}><Video size={14} /> {t('pv.recordVideo')}</button>
                  <button type="button" onClick={() => videoInput.current?.click()}><Paperclip size={14} /> {t('pv.gallery')}</button>
                </div>
              </div>
              {videos.map((v) => (
                <div key={v.id} className="pv-file-row">
                  <video src={v.url} controls preload="metadata" />
                  <div className="pv-file-meta">
                    <span>{v.file.name}</span>
                    <small>{fmtSize(v.size)}{v.duration ? ` · ${fmtTime(v.duration)}` : ''}</small>
                  </div>
                  <button type="button" onClick={() => removeVideo(v.id)} aria-label={t('pv.remove')}><X size={16} /></button>
                </div>
              ))}
            </div>

            {/* voice */}
            <div className="pv-media-block">
              <div className="pv-media-head"><h4>{t('pv.voiceMsg')}</h4></div>
              <div className={`pv-recorder ${rec.state}`}>
                {!voice && !recording && (
                  <div className="pv-rec-idle">
                    <button type="button" className="pv-mic-btn" onClick={startRec} aria-label={t('pv.recordVoice')}>
                      <Mic size={30} />
                    </button>
                    <p>{t('pv.recPrompt')}</p>
                    <small>{t('pv.recMax')}</small>
                    <button type="button" className="pv-link" onClick={() => audioInput.current?.click()}><FileAudio size={14} /> {t('pv.uploadAudio')}</button>
                  </div>
                )}
                {recording && (
                  <div className="pv-rec-live">
                    <span className={`pv-rec-dot ${rec.state}`} />
                    <strong className="pv-rec-time">{fmtTime(rec.elapsed)} <small>/ {fmtTime(MAX_VOICE)}</small></strong>
                    <div className="pv-rec-btns">
                      {rec.state === 'recording'
                        ? <button type="button" onClick={pauseRec} aria-label={t('pv.pause')}><Pause size={18} /></button>
                        : <button type="button" onClick={resumeRec} aria-label={t('pv.resume')}><Play size={18} /></button>}
                      <button type="button" className="pv-rec-stop" onClick={stopRec} aria-label={t('pv.stop')}><Square size={18} /></button>
                      <button type="button" onClick={discardRec} aria-label={t('pv.discard')}><Trash2 size={18} /></button>
                    </div>
                  </div>
                )}
                {voice && !recording && (
                  <div className="pv-rec-done">
                    <audio src={voice.url} controls preload="metadata" />
                    <div className="pv-file-meta"><span>{voice.name || 'voice-message'}</span><small>{voice.duration ? fmtTime(voice.duration) : ''}</small></div>
                    <div className="pv-mini-actions">
                      <button type="button" onClick={() => audioInput.current?.click()}><FileAudio size={14} /> {t('pv.uploadAudio')}</button>
                      <button type="button" onClick={startRec}><Mic size={14} /> {t('pv.rerecord')}</button>
                      <button type="button" onClick={removeVoice}><Trash2 size={14} /> {t('pv.remove')}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* optional AI illustration */}
            <div className="pv-media-block pv-illus">
              <div className="pv-media-head"><h4>{t('pv.illustration')}</h4></div>
              <p className="pv-note">{t('pv.illusNote')}</p>
              {illustration ? (
                <div className="pv-file-row">
                  <img src={illustration.url} alt="" className="pv-illus-thumb" />
                  <div className="pv-file-meta"><span>{illustration.file.name}</span><small>{fmtSize(illustration.file.size)}</small></div>
                  <button type="button" onClick={() => { revoke(illustration); setIllustration(null); set('aiConfirmation', false) }} aria-label={t('pv.remove')}><X size={16} /></button>
                </div>
              ) : (
                <button type="button" className="pv-illus-add" onClick={() => illusInput.current?.click()}><ImagePlus size={16} /> {t('pv.addIllustration')}</button>
              )}
              <input ref={illusInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickIllustration(e.target.files?.[0]); e.target.value = '' }} />
              {illustration && (
                <>
                  <label className="pv-check">
                    <input type="checkbox" checked={form.aiConfirmation} onChange={(e) => set('aiConfirmation', e.target.checked)} />
                    <span>{t('pv.aiConfirm')} <b>*</b></span>
                  </label>
                  {fieldErrors.aiConfirmation && <em className="pv-err-inline">{fieldErrors.aiConfirmation}</em>}
                  <input className="pv-field-sub" value={form.aiDescription} onChange={(e) => set('aiDescription', e.target.value)} placeholder={t('pv.aiDescPh')} maxLength={500} />
                </>
              )}
            </div>

            <div className="pv-policy">
              <AlertTriangle size={16} />
              <p>{t('pv.policy')}</p>
            </div>
          </section>

          {/* contact */}
          <section className="pv-card">
            <h3><span>4</span>{t('pv.s4')}</h3>
            <div className="pv-grid">
              <label className="pv-field">
                <span>{t('pv.name')} <b>*</b></span>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={160} className={fieldErrors.name ? 'pv-invalid' : ''} />
                {fieldErrors.name && <em>{fieldErrors.name}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.phone')} <b>*</b></span>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={40} inputMode="tel" className={fieldErrors.phone ? 'pv-invalid' : ''} />
                {fieldErrors.phone && <em>{fieldErrors.phone}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.email')}</span>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} maxLength={160} className={fieldErrors.email ? 'pv-invalid' : ''} />
                {fieldErrors.email && <em>{fieldErrors.email}</em>}
              </label>
              <label className="pv-field">
                <span>{t('pv.contactMethod')}</span>
                <select value={form.contactMethod} onChange={(e) => set('contactMethod', e.target.value)}>
                  <option value="phone">{t('pv.phone')}</option>
                  <option value="email">{t('pv.email')}</option>
                  <option value="either">{t('pv.either')}</option>
                </select>
              </label>
            </div>
            <label className="pv-check">
              <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
              <span>{t('pv.consent')} <b>*</b></span>
            </label>
            {fieldErrors.consent && <em className="pv-err-inline">{fieldErrors.consent}</em>}
            <p className="pv-note">{t('pv.privacyNote')}</p>
          </section>

          {error && <div className="pv-error" role="alert"><AlertTriangle size={16} /> {error}</div>}

          <button type="submit" className="pv-submit" disabled={busy}>
            {busy ? <><Loader2 size={18} className="pv-spin" /> {t('pv.submitting')} {progress > 0 && `${progress}%`}</> : t('pv.submit')}
          </button>
          {busy && <div className="pv-progress"><span style={{ width: `${progress}%` }} /></div>}
        </form>
      </div>
      <section className="pv-concerns" ref={listRef} id="community-concerns">
        <div className="pv-wrap">
          <div className="pv-section-heading"><div><span className="pv-eyebrow"><span/>{language === 'ta' ? 'சமூகக் குரல்கள்' : 'Community concerns'}</span><h2>{language === 'ta' ? 'மக்களிடமிருந்து நேரடியாக' : 'Concerns from the community'}</h2><p>{language === 'ta' ? 'சரிபார்க்கப்பட்டு வெளியிடப்பட்ட சமூகப் பிரச்சினைகள்.' : 'Verified concerns that have been reviewed and explicitly published.'}</p></div><a className="pv-primary-button pv-heading-cta" href="#pv-form">{language === 'ta' ? 'பிரச்சினையைச் சமர்ப்பிக்கவும்' : 'Submit a concern'}<ArrowRight size={16}/></a></div>
          <div className="pv-filter-bar">
            <label className="pv-search"><span className="pv-search-icon"><Search size={16}/></span><input value={filters.q} placeholder={language === 'ta' ? 'தலைப்பு, கிராமம் அல்லது மாவட்டம் தேடுங்கள்' : 'Search title, village or district'} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}/></label>
            <select aria-label="Category" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}><option value="">{language === 'ta' ? 'அனைத்து வகைகள்' : 'All categories'}</option>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`pv.cat.${c}`)}</option>)}</select>
            <select aria-label="District" value={filters.district} onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}><option value="">{language === 'ta' ? 'அனைத்து மாவட்டங்கள்' : 'All districts'}</option>{geo.districts.map((d) => <option key={d.key} value={d.key}>{d.labels?.[language] || d.labels?.en || d.key}</option>)}</select>
          </div>
          {concernState === 'loading' && <div className="pv-list-state"><span className="pv-spinner"/><p>{language === 'ta' ? 'வெளியிடப்பட்ட பிரச்சினைகள் ஏற்றப்படுகின்றன…' : 'Loading published concerns…'}</p></div>}
          {concernState === 'error' && <div className="pv-list-state"><p>{language === 'ta' ? 'பிரச்சினைகளைப் பெற முடியவில்லை.' : 'Could not load published concerns.'}</p><button type="button" onClick={() => setFilters((f) => ({ ...f }))}>{language === 'ta' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try again'}</button></div>}
          {concernState === 'ready' && concerns.length === 0 && <div className="pv-list-state pv-list-empty"><span><Mic size={23}/></span><p>{language === 'ta' ? 'இதுவரை வெளியிடப்பட்ட சமூகப் பிரச்சினைகள் இல்லை.' : 'There are no published community concerns yet.'}</p></div>}
          {concernState === 'ready' && concerns.length > 0 && <div className="pv-concern-grid">{concerns.map((item, index) => <article className="pv-concern-card" key={item.id} style={{ '--card-index': index }}><div className="pv-concern-card-top"><span className="pv-card-number">{String(index + 1).padStart(2, '0')}</span><span className="pv-card-tag">{t(`pv.cat.${item.category}`)}</span><span className="pv-card-photo-count"><ImagePlus size={14}/>{item.photoCount}</span></div><h3>{item.title}</h3><p className="pv-concern-location"><MapPin size={14}/>{[item.village, item.district].filter(Boolean).join(' · ')}</p><p className="pv-concern-excerpt">{item.description}</p><div className="pv-concern-card-bottom"><span>{new Date(item.published_at).toLocaleDateString(language === 'ta' ? 'ta-LK' : 'en-LK')}</span><span className="pv-card-media">{item.hasAudio && <AudioLines size={15}/>} {item.hasVideo && <FileVideo2 size={15}/>}</span><Link to={`/public-voice/${item.id}`}>{language === 'ta' ? 'பிரச்சினையைப் பாருங்கள்' : 'View concern'}<ArrowRight size={15}/></Link></div></article>)}</div>}
        </div>
      </section>
    </div>
  )
}

function PublicVoiceDetail({ id, language, t }) {
  const [concern, setConcern] = useState(null)
  const [state, setState] = useState('loading')
  const [lightbox, setLightbox] = useState(null)
  useEffect(() => {
    let active = true
    publicVoiceApi.get(id).then((data) => { if (active) { setConcern(data); setState('ready') } }).catch(() => { if (active) setState('missing') })
    return () => { active = false }
  }, [id])
  const photos = concern?.media?.filter((media) => media.media_type === 'PHOTO') || []
  const illustrations = concern?.media?.filter((media) => media.media_type === 'AI_IMAGE') || []
  const videos = concern?.media?.filter((media) => media.media_type === 'VIDEO') || []
  const audios = concern?.media?.filter((media) => media.media_type === 'AUDIO') || []
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setLightbox(null)
      if (event.key === 'ArrowRight' && lightbox !== null) setLightbox((current) => Math.min(current + 1, photos.length - 1))
      if (event.key === 'ArrowLeft' && lightbox !== null) setLightbox((current) => Math.max(current - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])
  return <div className="pv-page"><PageBanner breadcrumbItems={[{ label: t('nav.moVoice'), to: '/public-voice' }, { label: concern?.title || 'Community concern' }]} />
    <section className="pv-detail-page"><div className="pv-wrap"><Link className="pv-back-link" to="/public-voice"><ArrowLeft size={16}/>{language === 'ta' ? 'மக்களின் குரலுக்குத் திரும்பு' : 'Back to Public Voice'}</Link>
      {state === 'loading' && <div className="pv-list-state"><span className="pv-spinner"/><p>Loading published concern…</p></div>}
      {state === 'missing' && <div className="pv-list-state"><p>This concern is not available.</p></div>}
      {state === 'ready' && <article className="pv-detail-article"><span className="pv-detail-category">{t(`pv.cat.${concern.category}`)}</span><h1>{concern.title}</h1><div className="pv-detail-meta"><span><MapPin size={15}/>{[concern.village, concern.district, concern.province].filter(Boolean).join(' · ')}</span><span>Published · {new Date(concern.published_at).toLocaleDateString(language === 'ta' ? 'ta-LK' : 'en-LK')}</span></div><p className="pv-detail-description">{concern.description}</p>
        {photos.length > 0 && <section className="pv-detail-media"><h2>{photos.length} approved photos</h2><div className="pv-gallery-grid">{photos.map((media, index) => <button type="button" key={media.id} onClick={() => setLightbox(index)}><img src={media.url} alt={`${concern.title} evidence ${index + 1}`} loading="lazy"/></button>)}</div></section>}
        {illustrations.length > 0 && <section className="pv-detail-media"><h2>AI-generated illustrations</h2><div className="pv-gallery-grid">{illustrations.map((media) => <figure className="pv-ai-public" key={media.id}><img src={media.url} alt={media.ai_description || 'AI-generated illustration'} loading="lazy"/><figcaption>AI-generated illustration{media.ai_description ? ` · ${media.ai_description}` : ''}</figcaption></figure>)}</div></section>}
        {videos.length > 0 && <section className="pv-detail-media"><h2>Video evidence</h2><div className="pv-public-videos">{videos.map((media) => <video key={media.id} src={media.url} controls preload="metadata"/>)}</div></section>}
        {audios.length > 0 && <section className="pv-detail-media"><h2>Voice recording</h2>{audios.map((media) => <audio key={media.id} src={media.url} controls preload="metadata" className="pv-public-audio"/>)}</section>}
        {concern.public_response && <section className="pv-response"><span>Official response</span><p>{concern.public_response}</p></section>}
      </article>}
    </div></section>
    {lightbox !== null && <div className="pv-lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={() => setLightbox(null)}><button type="button" className="pv-lightbox-close" aria-label="Close"><X/></button>{lightbox > 0 && <button type="button" className="pv-lightbox-prev" onClick={(event) => { event.stopPropagation(); setLightbox((current) => current - 1) }} aria-label="Previous"><ChevronLeft/></button>}<img src={photos[lightbox]?.url} alt={`${concern?.title || ''} photo ${lightbox + 1}`} onClick={(event) => event.stopPropagation()}/>{lightbox < photos.length - 1 && <button type="button" className="pv-lightbox-next" onClick={(event) => { event.stopPropagation(); setLightbox((current) => current + 1) }} aria-label="Next"><ChevronRight/></button>}<span>{lightbox + 1} / {photos.length}</span></div>}
  </div>
}
