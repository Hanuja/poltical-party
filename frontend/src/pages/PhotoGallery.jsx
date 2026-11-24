import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useFetch } from '../hooks/useFetch'
import { setPageSEO } from '../utils/seo'
import { getAlbums, getAlbumImages } from '../services/content'
import Breadcrumb from '../components/Breadcrumb'
import GalleryCard, { Lightbox } from '../components/GalleryCard'
import { SkeletonCards, EmptyState } from '../components/LoadingSpinner'
import { pickLang } from '../data/mock'
import { Images } from 'lucide-react'

export default function PhotoGallery() {
  const { t, language } = useLanguage()
  const [albumId, setAlbumId] = useState(null) // null = all
  const [lightbox, setLightbox] = useState(null)

  const { data: albums, loading: albumsLoading } = useFetch(() => getAlbums(language), [language])
  const { data: allImages, loading: imagesLoading } = useFetch(
    () => albumId ? getAlbumImages(albumId, language) : Promise.resolve(
      // "All" view: gather images across albums from mock/API album list
      Promise.all((albums || []).map(a => getAlbumImages(a.id, language))).then(r => r.flat())
    ),
    [language, albumId, albums]
  )

  useEffect(() => {
    setPageSEO({ title: t('gallery.photoTitle'), description: t('gallery.eyebrow') })
  }, [t, language])

  const images = useMemo(() => allImages || [], [allImages])
  const loading = albumsLoading || imagesLoading

  const captions = useMemo(() => Object.fromEntries(images.map(i => [i.id, i.caption])), [images])

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.gallery'), to: '/gallery' }, { label: t('nav.photoGallery') }]} />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('gallery.eyebrow')}</span>
            <h2>{t('gallery.photoTitle')}</h2>
          </div>

          {/* Album filter */}
          <div className="category-chips" style={{ marginBottom: 28 }}>
            <button className={`chip${albumId === null ? ' active' : ''}`} onClick={() => setAlbumId(null)}>
              {t('gallery.allAlbums')}
            </button>
            {(albums || []).map(a => (
              <button key={a.id} className={`chip${albumId === a.id ? ' active' : ''}`} onClick={() => setAlbumId(a.id)}>
                {pickLang(a.title, language)}
              </button>
            ))}
          </div>

          {loading ? <SkeletonCards count={8} /> : images.length === 0 ? (
            <EmptyState title={t('gallery.noPhotos')} icon={<Images size={56} />} />
          ) : (
            <div className="gallery-grid">
              {images.map((img, i) => (
                <GalleryCard key={img.id} image={img.image || img.image_path} caption={img.caption} index={i} onOpen={setLightbox} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox
        images={images}
        index={lightbox}
        captions={captions}
        onClose={() => setLightbox(null)}
        onNavigate={(dir) => setLightbox(i => (i + dir + images.length) % images.length)}
      />
    </>
  )
}
