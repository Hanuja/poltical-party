import { useState } from 'react'
import { FileText, Globe, Upload, ArrowRight } from 'lucide-react'
import { memApi } from './memApi'
import PdfUploadForm from './PdfUploadForm'

export default function ApplicationMethodSelector({ s, lang, districts = [], onSelectOnline, onSubmitted }) {
  const [view, setView] = useState('select') // select | pdf-upload
  const [downloading, setDownloading] = useState(false)
  const copy = s.applicationMethod

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(memApi.downloadFormUrl())
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      if (await blob.slice(0, 5).text() !== '%PDF-') throw new Error('The server did not return a PDF file')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Membership_Application_Form.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (error) {
      console.error('Download error:', error)
      alert(copy.downloadError)
    } finally {
      setDownloading(false)
    }
  }

  if (view === 'pdf-upload') {
    return (
      <div className="mb-method-container">
        <button
          type="button"
          className="mb-back-btn"
          onClick={() => setView('select')}
        >
          ← {copy.back}
        </button>
        <PdfUploadForm
          s={s}
          lang={lang}
          districts={districts}
          onSubmitted={(result) => {
            onSubmitted(result)
            setView('select')
          }}
        />
      </div>
    )
  }

  return (
    <section className="mb-method-selector" aria-labelledby="mb-method-title" lang={lang}>
      <header className="mb-method-heading" data-mb-reveal="">
        <span className="mb-method-kicker">{s.form.eyebrow}</span>
        <h2 id="mb-method-title" className="mb-method-title">{copy.title}</h2>
        <span className="mb-method-rule" aria-hidden="true"><i /></span>
        <p className="mb-method-subtitle">{copy.subtitle}</p>
      </header>

      <div className="mb-method-cards">
        <article className="mb-method-card mb-method-card-online" data-mb-reveal="">
          <div className="mb-method-card-top">
            <span className="mb-method-option"><span className="mb-method-option-dot" />{copy.onlineOption}</span>
            <div className="mb-method-icon"><Globe size={27} strokeWidth={1.8} aria-hidden="true" /></div>
          </div>
          <div className="mb-method-card-copy">
            <h3>{copy.onlineTitle}</h3>
            <p>{copy.onlineText}</p>
          </div>
          <div className="mb-method-detail">
            <span className="mb-method-detail-mark" aria-hidden="true">01</span>
            <div><strong>{copy.onlineDetailTitle}</strong><span>{copy.onlineDetail}</span></div>
          </div>
          <button type="button" className="mb-btn mb-btn-primary mb-method-action" onClick={onSelectOnline}>
            {copy.onlineButton}<ArrowRight size={18} aria-hidden="true" />
          </button>
        </article>

        <article className="mb-method-card mb-method-card-pdf" data-mb-reveal="">
          <div className="mb-method-card-top">
            <span className="mb-method-option"><span className="mb-method-option-dot" />{copy.pdfOption}</span>
            <div className="mb-method-icon"><FileText size={27} strokeWidth={1.8} aria-hidden="true" /></div>
          </div>
          <div className="mb-method-card-copy">
            <h3>{copy.pdfTitle}</h3>
            <p>{copy.pdfText}</p>
          </div>
          <div className="mb-method-detail">
            <span className="mb-method-detail-mark" aria-hidden="true"><FileText size={17} /></span>
            <div><strong>{copy.pdfDetailTitle}</strong><span>{copy.pdfDetail}</span></div>
          </div>
          <div className="mb-pdf-actions">
            <button type="button" className="mb-btn mb-btn-outline mb-method-action" onClick={handleDownload} disabled={downloading}>
              <FileText size={17} aria-hidden="true" />{downloading ? copy.downloading : copy.download}
            </button>
            <button type="button" className="mb-btn mb-btn-primary mb-method-action" onClick={() => setView('pdf-upload')}>
              <Upload size={17} aria-hidden="true" />{copy.upload}
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
