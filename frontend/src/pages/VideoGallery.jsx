import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getVideos } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import VideoCard from '../components/VideoCard'
import { SkeletonCards, EmptyState } from '../components/LoadingSpinner'
import { Clapperboard } from 'lucide-react'

export default function VideoGallery() {
  const { t, language } = useLanguage()
  const [cat, setCat] = useState('')
  const { data, loading } = useFetch(() => getVideos(language), [language])

  useEffect(() => {
    setPageSEO({ title: t('gallery.videoTitle'), description: t('home.videosTitle') })
  }, [t, language])

  const categories = useMemo(() => [...new Set((data || []).map(v => v.category).filter(Boolean))], [data])
  const filtered = useMemo(() => cat ? (data || []).filter(v => v.category === cat) : (data || []), [data, cat])
  const featured = filtered.filter(v => v.isFeatured)
  const rest = filtered.filter(v => !v.isFeatured)

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.gallery'), to: '/gallery' }, { label: t('nav.videoGallery') }]} />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('gallery.eyebrow')}</span>
            <h2>{t('gallery.videoTitle')}</h2>
          </div>

          {categories.length > 0 && (
            <div className="category-chips" style={{ marginBottom: 28 }}>
              <button className={`chip${!cat ? ' active' : ''}`} onClick={() => setCat('')}>{t('common.all')}</button>
              {categories.map(c => (
                <button key={c} className={`chip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          )}

          {loading ? <SkeletonCards count={6} /> : filtered.length === 0 ? (
            <EmptyState title={t('gallery.noVideos')} icon={<Clapperboard size={56} />} />
          ) : (
            <>
              {featured.length > 0 && (
                <>
                  <h3 className="mb-3">{t('gallery.featuredVideos')}</h3>
                  <div className="grid grid-3 mb-4">{featured.map(v => <VideoCard key={v.id} video={v} />)}</div>
                </>
              )}
              {rest.length > 0 && (
                <div className="grid grid-3">{rest.map(v => <VideoCard key={v.id} video={v} />)}</div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
