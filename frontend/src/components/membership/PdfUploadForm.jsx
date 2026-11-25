import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Upload, X, Eye, Paperclip, Loader2 } from 'lucide-react'
import { memApi } from './memApi'
import { Field } from './memUi'
import { fill } from './membershipText'

const PDF_LIMIT = 10 * 1024 * 1024
const SUPPORT_LIMIT = 5
const formatSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
const isPdf = (file) => file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf')

export default function PdfUploadForm({ s, lang, districts = [], onSubmitted }) {
  const c = s.pdfUpload
  const [form, setForm] = useState({ fullName: '', nic: '', phone: '', email: '', districtId: '', language: lang })
  const [pdfFile, setPdfFile] = useState(null)
  const [supportingFiles, setSupportingFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const pdfInputRef = useRef(null)
  const supportInputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const previewUrl = useMemo(() => pdfFile ? URL.createObjectURL(pdfFile) : '', [pdfFile])

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  useEffect(() => { setForm((current) => ({ ...current, language: lang })) }, [lang])

  const choosePdf = (file) => {
    if (!file) return
    if (!isPdf(file)) { setError(c.errors.notPdf); return }
    if (file.size > PDF_LIMIT) { setError(c.errors.tooLarge); return }
    setPdfFile(file)
    setError('')
  }

  const addSupporting = (files) => {
    const chosen = Array.from(files || [])
    if (!chosen.length) return
    if (supportingFiles.length + chosen.length > SUPPORT_LIMIT) { setError(fill(c.errors.supportMax, { max: SUPPORT_LIMIT })); return }
    if (chosen.some((file) => !isPdf(file) || file.size > PDF_LIMIT)) { setError(c.errors.supportType); return }
    if ([...supportingFiles, ...chosen].reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024) { setError(c.errors.supportTotal); return }
    setSupportingFiles((current) => [...current, ...chosen])
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.fullName.trim() || !form.nic.trim() || !form.phone.trim() || !form.districtId || !pdfFile) {
      setError(c.errors.required)
      return
    }
    setLoading(true)
    setProgress(0)
    try {
      const result = await memApi.applyPdf(form, pdfFile, null, supportingFiles, (event) => {
        if (event.total) setProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      })
      setProgress(100)
      onSubmitted({ ...result, email: form.email.trim() })
    } catch (submitError) {
      setError(submitError.message || c.errors.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mb-pdf-form" onSubmit={handleSubmit} lang={lang}>
      <header className="mb-pdf-form-head">
        <span className="mb-method-kicker">{s.form.eyebrow}</span>
        <h2 className="mb-form-title">{c.title}</h2>
        <p className="mb-form-subtitle">{c.subtitle}</p>
      </header>

      {error && <div className="mb-error-banner" role="alert">{error}</div>}

      <div className="mb-form-grid">
        <Field label={c.fullName} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" />
        <Field label={c.nic} required value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} autoComplete="off" />
        <Field label={c.phone} required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
        <Field label={c.email} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        <Field label={c.district} as="select" required value={form.districtId} onChange={(e) => setForm({ ...form, districtId: e.target.value })}>
          <option value="">{c.districtPlaceholder}</option>
          {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
        </Field>
      </div>

      <div className="mb-pdf-field">
        <span className="mb-pdf-label">{c.pdfLabel} <b>*</b></span>
        <div
          className={`mb-pdf-dropzone${dragging ? ' is-dragging' : ''}${pdfFile ? ' has-file' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); choosePdf(event.dataTransfer.files?.[0]) }}
        >
          <FileText size={30} aria-hidden="true" />
          <strong>{pdfFile ? c.selected : c.drop}</strong>
          <span>{c.limits}</span>
          <button type="button" className="mb-btn mb-btn-outline mb-browse-btn" onClick={() => pdfInputRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> {c.browse}
          </button>
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(event) => { choosePdf(event.target.files?.[0]); event.target.value = '' }} />
        </div>
        {pdfFile && (
          <div className="mb-uploaded-file">
            <FileText size={19} aria-hidden="true" />
            <span className="mb-uploaded-meta"><strong title={pdfFile.name}>{pdfFile.name}</strong><small>{formatSize(pdfFile.size)}</small></span>
            <button type="button" className="mb-file-action" onClick={() => setPreviewOpen(true)} aria-label={c.preview}><Eye size={17} /></button>
            <button type="button" className="mb-file-action" onClick={() => setPdfFile(null)} aria-label={c.remove}><X size={17} /></button>
          </div>
        )}
      </div>

      <div className="mb-pdf-field">
        <div className="mb-pdf-label-row"><span className="mb-pdf-label">{c.supportLabel} <small>{c.optional}</small></span><span className="mb-file-limit">{c.supportLimit}</span></div>
        <input ref={supportInputRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={(event) => { addSupporting(event.target.files); event.target.value = '' }} />
        <button type="button" className="mb-btn mb-btn-outline mb-support-btn" onClick={() => supportInputRef.current?.click()} disabled={supportingFiles.length >= SUPPORT_LIMIT}>
          <Paperclip size={16} aria-hidden="true" /> {c.addSupport}
        </button>
        {supportingFiles.map((file, index) => (
          <div className="mb-uploaded-file mb-support-file" key={`${file.name}-${file.lastModified}`}>
            <FileText size={18} aria-hidden="true" />
            <span className="mb-uploaded-meta"><strong title={file.name}>{file.name}</strong><small>{formatSize(file.size)}</small></span>
            <button type="button" className="mb-file-action" onClick={() => setSupportingFiles((current) => current.filter((_, i) => i !== index))} aria-label={fill(c.removeFile, { name: file.name })}><X size={17} /></button>
          </div>
        ))}
      </div>

      {loading && (
        <div className="mb-upload-progress" role="status" aria-live="polite">
          <div><span>{c.uploadingSecure}</span><strong>{progress}%</strong></div>
          <progress value={progress} max="100" aria-label={c.progress} />
        </div>
      )}

      <div className="mb-form-actions">
        <button type="submit" className="mb-btn mb-btn-primary mb-submit-pdf" disabled={loading || !districts.length}>
          {loading ? <><Loader2 size={17} className="mb-spin" /> {c.uploading}</> : c.submit}
        </button>
        {!districts.length && <small className="mb-district-note">{c.noDistricts}</small>}
      </div>

      {previewOpen && previewUrl && (
        <div className="mb-pdf-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false) }}>
          <section className="mb-pdf-preview-dialog" role="dialog" aria-modal="true" aria-label={c.previewDialog}>
            <header><strong>{pdfFile.name}</strong><button type="button" onClick={() => setPreviewOpen(false)} aria-label={c.closePreview}><X size={20} /></button></header>
            <iframe title={fill(c.previewOf, { name: pdfFile.name })} src={previewUrl} />
          </section>
        </div>
      )}
    </form>
  )
}
