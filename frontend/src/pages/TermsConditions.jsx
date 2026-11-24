import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getPage } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { formatDate } from '../utils/format'

export default function TermsConditions() {
  const { t, language } = useLanguage()
  const { data: page, loading } = useFetch(() => getPage('terms-conditions', language), [language])

  useEffect(() => {
    setPageSEO({ title: t('terms.title') })
  }, [t, language])

  return (
    <>
      <Breadcrumb items={[{ label: t('footer.terms') }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          {loading ? <LoadingSpinner /> : page && (
            <article className="prose">
              <p className="text-muted">{t('terms.lastUpdated')}: {formatDate(new Date().toISOString().slice(0, 10), 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </article>
          )}
        </div>
      </section>
    </>
  )
}
