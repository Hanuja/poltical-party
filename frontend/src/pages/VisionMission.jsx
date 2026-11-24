import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { setPageSEO } from '../utils/seo'
import Breadcrumb from '../components/Breadcrumb'
import { pickLang, mockPages } from '../data/mock'
import { Compass, Target, ArrowRight } from 'lucide-react'

export default function VisionMission() {
  const { t, language } = useLanguage()

  useEffect(() => {
    setPageSEO({ title: t('nav.visionMission'), description: t('home.visionText') })
  }, [t, language])

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.about'), to: '/about' }, { label: t('nav.visionMission') }]} />
      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="grid grid-2" style={{ gap: 32 }}>
            <div className="card vm-card" style={{ textAlign: 'center', padding: '48px 36px' }}>
              <div className="vm-icon"><Compass size={34} /></div>
              <h2>{t('home.visionTitle')}</h2>
              <p style={{ fontSize: '1.05rem' }}>{t('home.visionText')}</p>
            </div>
            <div className="card vm-card" style={{ textAlign: 'center', padding: '48px 36px' }}>
              <div className="vm-icon"><Target size={34} /></div>
              <h2>{t('home.missionTitle')}</h2>
              <p style={{ fontSize: '1.05rem' }}>{t('home.missionText')}</p>
            </div>
          </div>

          <div className="mt-4 prose" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div dangerouslySetInnerHTML={{ __html: pickLang(mockPages.vision.content, language) }} />
          </div>

          <div className="text-center mt-4">
            <Link to="/policies" className="btn btn-primary">{t('home.explorePolicies')} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
