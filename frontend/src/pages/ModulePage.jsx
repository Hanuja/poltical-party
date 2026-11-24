import { useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import Breadcrumb from '../components/Breadcrumb'

const SECTIONS = {
  development: {
    titleKey: 'nav.moDev',
    items: ['nav.moDevSectors','nav.moDevDistricts','nav.moDevCompare','nav.moDevStats','nav.moDevResearch','nav.moDevProjects'],
  },
  roadmap: {
    titleKey: 'nav.moRoadmap',
    items: ['nav.moRm1','nav.moRm2','nav.moRm3','nav.moRm5','nav.moRm10','nav.moRm15','nav.moRm50'],
  },
  'public-voice': {
    titleKey: 'nav.moVoice',
    items: ['nav.moVoiceProblem','nav.moVoiceIdea','nav.moVoiceObjection','nav.moVoiceFeedback','nav.moVoiceTrack'],
  },
  accountability: {
    titleKey: 'nav.moAccount',
    items: ['nav.moAccPromise','nav.moAccProgress','nav.moAccScore','nav.moAccBudget','nav.moAccFunding','nav.moAccEvidence'],
  },
}

export default function ModulePage() {
  const { module } = useParams()
  const { t } = useLanguage()
  const s = SECTIONS[module]
  if (!s) return null
  return (
    <>
    <Breadcrumb items={[{ label: t(s.titleKey) }]} />
    <section className="section">
      <div className="container">
        <div className="module-list">
          {s.items.map(k => (
            <div key={k} className="module-item">
              <span className="module-item-dot" />
              <span>{t(k)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  )
}
