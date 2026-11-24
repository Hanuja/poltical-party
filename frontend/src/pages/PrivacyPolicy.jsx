import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getPage } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { formatDate } from '../utils/format'

export default function PrivacyPolicy() {
  const { t, language } = useLanguage()
  const { data: page, loading } = useFetch(() => getPage('privacy-policy', language), [language])

  useEffect(() => {
    setPageSEO({ title: t('privacy.title') })
  }, [t, language])

  return (
    <>
      <Breadcrumb items={[{ label: t('footer.privacy') }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          {loading ? <LoadingSpinner /> : page && (
            <article className="prose">
              <p className="text-muted">{t('privacy.lastUpdated')}: {formatDate(new Date().toISOString().slice(0, 10), 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </article>
          )}
        </div>
      </section>
    </>
  )
}
