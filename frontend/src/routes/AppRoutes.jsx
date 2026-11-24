import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getEvent } from '../services/content'
import PublicLayout from '../layouts/PublicLayout'
import { LoadingSpinner } from '../components/LoadingSpinner'

const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const History = lazy(() => import('../pages/History'))
const VisionMission = lazy(() => import('../pages/VisionMission'))
const Departments = lazy(() => import('../pages/Departments'))
const Leadership = lazy(() => import('../pages/Leadership'))
const LeaderDetails = lazy(() => import('../pages/LeaderDetails'))
const Policies = lazy(() => import('../pages/Policies'))
const PolicyDetails = lazy(() => import('../pages/PolicyDetails'))
const News = lazy(() => import('../pages/News'))
const Announcements = lazy(() => import('../pages/Announcements'))
const AnnouncementDetails = lazy(() => import('../pages/AnnouncementDetails'))
const NewsDetails = lazy(() => import('../pages/NewsDetails'))
const PressReleases = lazy(() => import('../pages/PressReleases'))
const Events = lazy(() => import('../pages/Events'))
const EventDetails = lazy(() => import('../pages/EventDetails'))

const TicketPage = lazy(() => import('../pages/TicketPage'))
const FindTicket = lazy(() => import('../pages/FindTicket'))
const PhotoGallery = lazy(() => import('../pages/PhotoGallery'))
const VideoGallery = lazy(() => import('../pages/VideoGallery'))
const Membership = lazy(() => import('../pages/Membership'))
const SearchResults = lazy(() => import('../pages/SearchResults'))
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'))
const TermsConditions = lazy(() => import('../pages/TermsConditions'))
const NotFound = lazy(() => import('../pages/NotFound'))
const ModulePage = lazy(() => import('../pages/ModulePage.jsx'))
const OurPeople = lazy(() => import('../pages/OurPeople.jsx'))
const OurIdentity = lazy(() => import('../pages/OurIdentity.jsx'))
const PrinciplesIdeology = lazy(() => import('../pages/PrinciplesIdeology.jsx'))
const ConstitutionPolicies = lazy(() => import('../pages/ConstitutionPolicies.jsx'))
const GeoOrg = lazy(() => import('../pages/GeoOrg.jsx'))
const GeoStructure = lazy(() => import('../pages/GeoStructure.jsx'))
const ProvinceReps = lazy(() => import('../pages/ProvinceReps.jsx'))
const Roadmap = lazy(() => import('../pages/Roadmap.jsx'))
const PublicVoice = lazy(() => import('../pages/PublicVoice.jsx'))
const Accountability = lazy(() => import('../pages/Accountability.jsx'))


const fallback = <div className="container" style={{ padding: '80px 0' }}><LoadingSpinner /></div>

// There is no registration page: registration is the popup on the event page. These two paths exist only so that
// event-poster QR codes and links that were already printed or shared (…/events/register?event_id=12 and
// …/events/<slug>/register) still land on the right event with the popup open.
function RegRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/events/${slug}?register=1`} replace />
}

function RegisterQrLink() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const id = params.get('event_id')
  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) { navigate('/events', { replace: true }); return undefined }
    let off = false
    getEvent(id, language)
      .then((ev) => { if (!off) navigate(`/events/${ev.slug || ev.id}?register=1`, { replace: true }) })
      .catch(() => { if (!off) navigate('/events', { replace: true }) })
    return () => { off = true }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return fallback
}

export default function AppRoutes() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="about/history" element={<History />} />
          <Route path="about/vision-mission" element={<VisionMission />} />
          <Route path="about/story" element={<Navigate to="/our-identity?section=story" replace />} />
          <Route path="our-identity" element={<OurIdentity />} />
          <Route path="principles-ideology" element={<PrinciplesIdeology />} />
          <Route path="our-identity/principles-ideology" element={<Navigate to="/principles-ideology" replace />} />
          <Route path="our-people" element={<OurPeople />} />
          <Route path="our-people/org-chart" element={<GeoStructure />} />
          <Route path="our-people/northern" element={<ProvinceReps province="northern" />} />
          <Route path="our-people/eastern" element={<ProvinceReps province="eastern" />} />

          <Route path="departments" element={<Departments />} />
          <Route path="departments/:slug" element={<Departments />} />
          <Route path="leadership" element={<Leadership />} />
          <Route path="leadership/:slug" element={<LeaderDetails />} />
          <Route path="policies" element={<Policies />} />
          <Route path="policies/:slug" element={<PolicyDetails />} />
          <Route path="departments" element={<Departments />} />
          <Route path="departments/:slug" element={<Departments />} />
          <Route path="news" element={<News />} />
          <Route path="news/:slug" element={<NewsDetails />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="announcements/:slug" element={<AnnouncementDetails />} />
          <Route path="press-releases" element={<PressReleases />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:slug" element={<EventDetails />} />
          <Route path="events/:slug/register" element={<RegRedirect />} />
          <Route path="events/register" element={<RegisterQrLink />} />

          <Route path="events/ticket/:code" element={<TicketPage />} />
          <Route path="events/my-ticket" element={<FindTicket />} />
          <Route path="gallery" element={<PhotoGallery />} />
          <Route path="videos" element={<VideoGallery />} />
          <Route path="membership" element={<Membership />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="public-voice" element={<PublicVoice />} />
          <Route path="public-voice/:id" element={<PublicVoice />} />
          <Route path="accountability" element={<Accountability />} />
          <Route path=":module" element={<ModulePage />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-conditions" element={<TermsConditions />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
