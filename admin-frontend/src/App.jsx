import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import AnnouncementForm from './pages/AnnouncementForm';
import AnnouncementPreview from './pages/AnnouncementPreview';
import LeadershipList from './pages/LeadershipList';
import LeaderForm from './pages/LeaderForm';
import LeaderPreview from './pages/LeaderPreview';
import MembershipList from './pages/MembershipList';
import MembershipDetail from './pages/MembershipDetail';
import MembershipSettings from './pages/MembershipSettings';
import Events from './pages/Events';
import EventForm from './pages/EventForm';
import Registrations from './pages/Registrations';
import History from './pages/History';
import PublicVoiceManagement from './pages/PublicVoiceManagement';
import AdminLayout from './components/AdminLayout';
import RequireAuth from './components/RequireAuth';
import { getToken } from './lib/api';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={getToken() ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/:id/edit" element={<EventForm />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/history" element={<History />} />
          <Route path="/public-voice" element={<PublicVoiceManagement />} />
          <Route path="/public-voice/:id" element={<PublicVoiceManagement />} />
          <Route path="/announcements/new" element={<AnnouncementForm />} />
          <Route path="/announcements/categories" element={<Announcements />} />
          <Route path="/announcements/media" element={<Announcements />} />
          <Route path="/announcements/settings" element={<Announcements />} />
          <Route path="/announcements/:id/edit" element={<AnnouncementForm />} />
          <Route path="/announcements/:id/preview" element={<AnnouncementPreview />} />
          <Route path="/leadership" element={<LeadershipList />} />
          <Route path="/leadership/new" element={<LeaderForm />} />
          <Route path="/leadership/:id/edit" element={<LeaderForm />} />
          <Route path="/leadership/:id/preview" element={<LeaderPreview />} />
          <Route path="/membership" element={<MembershipList />} />
          <Route path="/membership/settings" element={<MembershipSettings />} />
          <Route path="/membership/:id" element={<MembershipDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={getToken() ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
