import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, Crown, MapPin, RefreshCw, TicketCheck, Users } from 'lucide-react';
import api, { getStoredUser } from '../lib/api';
import '../dashboard.css';

const DashboardCharts = lazy(() => import('./DashboardCharts'));
const asArray = (value) => Array.isArray(value) ? value : [];

const COPY = {
  en: { welcome: 'Welcome back', subtitle: 'A live overview of your organisation.', leaders: 'Leadership profiles', published: 'Published leaders', drafts: 'Draft profiles', members: 'Registered members', active: 'Active members', pending: 'Pending members', inactive: 'Inactive members', thisMonth: 'New this month', events: 'Total events', upcoming: 'Upcoming events', ongoing: 'Ongoing events', completed: 'Completed events', registrations: 'Event registrations', confirmed: 'Confirmed registrations', cancelled: 'Cancelled registrations', analytics: 'Analytics', growth: 'Membership growth', memberStatus: 'Membership status', leadershipDist: 'Leadership by district', eventStatus: 'Event status', regActivity: 'Monthly registration activity', eventRegistrations: 'Registrations by event', recentActivity: 'Recent activity', recentLeaders: 'Recently added leaders', recentMembers: 'Recent member registrations', upcomingEvents: 'Upcoming events', eventName: 'Event', eventDate: 'Date', location: 'Location', count: 'Registrations', status: 'Status', action: 'Action', by: 'By', time: 'Date & time', view: 'View all', refresh: 'Refresh dashboard', refreshed: 'Updated', range: 'Date range', days7: 'Last 7 days', days30: 'Last 30 days', months3: 'Last 3 months', months6: 'Last 6 months', year: 'This year', custom: 'Custom range', from: 'From', to: 'To', apply: 'Apply', loading: 'Loading your live dashboard…', error: 'Dashboard data could not be loaded.', retry: 'Try again', noData: 'No records found for this range.', registrationsTotal: 'Total', memberName: 'Member name', membershipId: 'Membership ID', district: 'District', province: 'Province', viewDetails: 'View', online: 'Live database', signout: 'Sign out', live: 'Live', starts: 'Starts', ends: 'Ends', venueTba: 'Venue to be announced' },
  ta: { welcome: 'மீண்டும் வரவேற்கிறோம்', subtitle: 'உங்கள் அமைப்பின் நேரடி கண்ணோட்டம்.', leaders: 'தலைமைத்துவ விவரங்கள்', published: 'வெளியிடப்பட்ட தலைவர்கள்', drafts: 'வரைவு விவரங்கள்', members: 'பதிவு செய்த உறுப்பினர்கள்', active: 'செயலில் உள்ள உறுப்பினர்கள்', pending: 'நிலுவை உறுப்பினர்கள்', inactive: 'செயலற்ற உறுப்பினர்கள்', thisMonth: 'இந்த மாதம் புதியவர்கள்', events: 'மொத்த நிகழ்வுகள்', upcoming: 'வரவிருக்கும் நிகழ்வுகள்', ongoing: 'நடைபெறும் நிகழ்வுகள்', completed: 'நிறைவுற்ற நிகழ்வுகள்', registrations: 'நிகழ்வு பதிவுகள்', confirmed: 'உறுதிப்படுத்தப்பட்ட பதிவுகள்', cancelled: 'ரத்து செய்யப்பட்டவை', analytics: 'பகுப்பாய்வு', growth: 'உறுப்பினர் வளர்ச்சி', memberStatus: 'உறுப்பினர் நிலை', leadershipDist: 'மாவட்ட வாரியான தலைமை', eventStatus: 'நிகழ்வு நிலை', regActivity: 'மாதாந்திர பதிவு செயல்பாடு', eventRegistrations: 'நிகழ்வு வாரியான பதிவுகள்', recentActivity: 'சமீபத்திய செயல்பாடுகள்', recentLeaders: 'சமீபத்தில் சேர்க்கப்பட்ட தலைவர்கள்', recentMembers: 'சமீபத்திய உறுப்பினர் பதிவுகள்', upcomingEvents: 'வரவிருக்கும் நிகழ்வுகள்', eventName: 'நிகழ்வு', eventDate: 'தேதி', location: 'இடம்', count: 'பதிவுகள்', status: 'நிலை', action: 'செயல்', by: 'செய்தவர்', time: 'தேதி & நேரம்', view: 'அனைத்தையும் பார்', refresh: 'பலகையைப் புதுப்பி', refreshed: 'புதுப்பிக்கப்பட்டது', range: 'தேதி வரம்பு', days7: 'கடந்த 7 நாட்கள்', days30: 'கடந்த 30 நாட்கள்', months3: 'கடந்த 3 மாதங்கள்', months6: 'கடந்த 6 மாதங்கள்', year: 'இந்த ஆண்டு', custom: 'தனிப்பயன் வரம்பு', from: 'தொடக்கம்', to: 'முடிவு', apply: 'பயன்படுத்து', loading: 'உங்கள் நேரடி பலகை ஏற்றப்படுகிறது…', error: 'பலகைத் தரவை ஏற்ற முடியவில்லை.', retry: 'மீண்டும் முயற்சிக்கவும்', noData: 'இந்த வரம்பில் பதிவுகள் இல்லை.', registrationsTotal: 'மொத்தம்', memberName: 'உறுப்பினர் பெயர்', membershipId: 'உறுப்பினர் எண்', district: 'மாவட்டம்', province: 'மாகாணம்', viewDetails: 'பார்', online: 'நேரடி தரவுத்தளம்', signout: 'வெளியேறு', live: 'நேரடி', starts: 'தொடக்கம்', ends: 'முடிவு', venueTba: 'இடம் அறிவிக்கப்படும்' },
  si: { welcome: 'නැවත සාදරයෙන් පිළිගනිමු', subtitle: 'ඔබගේ සංවිධානයේ සජීවී සාරාංශය.', leaders: 'නායකත්ව පැතිකඩ', published: 'ප්‍රකාශිත නායකයන්', drafts: 'කෙටුම්පත් පැතිකඩ', members: 'ලියාපදිංචි සාමාජිකයන්', active: 'සක්‍රිය සාමාජිකයන්', pending: 'අපේක්ෂිත සාමාජිකයන්', inactive: 'අක්‍රිය සාමාජිකයන්', thisMonth: 'මෙම මාසයේ නව සාමාජිකයන්', events: 'මුළු සිදුවීම්', upcoming: 'ඉදිරි සිදුවීම්', ongoing: 'දැනට පැවැත්වෙන සිදුවීම්', completed: 'අවසන් කළ සිදුවීම්', registrations: 'සිදුවීම් ලියාපදිංචි කිරීම්', confirmed: 'තහවුරු කළ ලියාපදිංචි කිරීම්', cancelled: 'අවලංගු කළ ලියාපදිංචි කිරීම්', analytics: 'විශ්ලේෂණ', growth: 'සාමාජික වර්ධනය', memberStatus: 'සාමාජික තත්ත්වය', leadershipDist: 'දිස්ත්‍රික්ක අනුව නායකත්වය', eventStatus: 'සිදුවීම් තත්ත්වය', regActivity: 'මාසික ලියාපදිංචි ක්‍රියාකාරකම්', eventRegistrations: 'සිදුවීම අනුව ලියාපදිංචි කිරීම්', recentActivity: 'මෑත ක්‍රියාකාරකම්', recentLeaders: 'මෑතකදී එක් කළ නායකයන්', recentMembers: 'මෑත සාමාජික ලියාපදිංචි කිරීම්', upcomingEvents: 'ඉදිරි සිදුවීම්', eventName: 'සිදුවීම', eventDate: 'දිනය', location: 'ස්ථානය', count: 'ලියාපදිංචි කිරීම්', status: 'තත්ත්වය', action: 'ක්‍රියාව', by: 'සිදු කළේ', time: 'දිනය & වේලාව', view: 'සියල්ල බලන්න', refresh: 'උපකරණ පුවරුව නැවුම් කරන්න', refreshed: 'යාවත්කාලීන කරන ලදී', range: 'දිනයේ පරාසය', days7: 'පසුගිය දින 7', days30: 'පසුගිය දින 30', months3: 'පසුගිය මාස 3', months6: 'පසුගිය මාස 6', year: 'මෙම වර්ෂය', custom: 'අභිරුචි පරාසය', from: 'සිට', to: 'දක්වා', apply: 'යොදන්න', loading: 'ඔබගේ සජීවී උපකරණ පුවරුව පූරණය වෙමින්…', error: 'උපකරණ පුවරු දත්ත පූරණය කළ නොහැකි විය.', retry: 'නැවත උත්සාහ කරන්න', noData: 'මෙම පරාසය සඳහා වාර්තා නැත.', registrationsTotal: 'මුළු', memberName: 'සාමාජිකයාගේ නම', membershipId: 'සාමාජික කේතය', district: 'දිස්ත්‍රික්කය', province: 'පළාත', viewDetails: 'බලන්න', online: 'සජීවී දත්ත ගබඩාව', signout: 'ඉවත්වන්න', live: 'සජීවී', starts: 'ආරම්භය', ends: 'අවසානය', venueTba: 'ස්ථානය තහවුරු කෙරේ' },
};

const fmtDate = (value, lang, options = { dateStyle: 'medium' }) => {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(lang === 'en' ? 'en-LK' : `${lang}-LK`, { ...options, timeZone: 'Asia/Colombo' }).format(date);
};
const num = (value) => Number(value || 0).toLocaleString();
const fmtTime = (value) => value ? String(value).slice(0, 5) : '';
const memberStatusLabel = (status, t) => status === 'verified' ? t.active : (status === 'pending' || status === 'under_review') ? t.pending : t.inactive;

function AnimatedValue({ value }) {
  const target = Number(value || 0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / 700);
      setShown(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{num(shown)}</>;
}

function actionText(action, lang) {
  const dictionary = {
    'leadership.created': { en: 'Leadership profile added', ta: 'தலைமைத்துவ விவரம் சேர்க்கப்பட்டது', si: 'නායකත්ව පැතිකඩක් එක් කරන ලදී' },
    'leadership.updated': { en: 'Leadership profile updated', ta: 'தலைமைத்துவ விவரம் புதுப்பிக்கப்பட்டது', si: 'නායකත්ව පැතිකඩ යාවත්කාලීන කරන ලදී' },
    'leadership.status.published': { en: 'Leadership profile published', ta: 'தலைமைத்துவ விவரம் வெளியிடப்பட்டது', si: 'නායකත්ව පැතිකඩ ප්‍රකාශයට පත් කරන ලදී' },
    'leadership.delete': { en: 'Leadership profile deleted', ta: 'தலைமைத்துவ விவரம் நீக்கப்பட்டது', si: 'නායකත්ව පැතිකඩ මකා දමන ලදී' },
    'membership.registered': { en: 'New member registered', ta: 'புதிய உறுப்பினர் பதிவு செய்தார்', si: 'නව සාමාජිකයෙකු ලියාපදිංචි විය' },
    'membership.approve': { en: 'Membership approved', ta: 'உறுப்பினர் விண்ணப்பம் அங்கீகரிக்கப்பட்டது', si: 'සාමාජිකත්වය අනුමත කරන ලදී' },
    'membership.decline': { en: 'Membership declined', ta: 'உறுப்பினர் விண்ணப்பம் நிராகரிக்கப்பட்டது', si: 'සාමාජිකත්වය ප්‍රතික්ෂේප කරන ලදී' },
    'event.created': { en: 'New event created', ta: 'புதிய நிகழ்வு உருவாக்கப்பட்டது', si: 'නව සිදුවීමක් සාදන ලදී' },
    'event.updated': { en: 'Event updated', ta: 'நிகழ்வு புதுப்பிக்கப்பட்டது', si: 'සිදුවීම යාවත්කාලීන කරන ලදී' },
    'event.deleted': { en: 'Event deleted', ta: 'நிகழ்வு நீக்கப்பட்டது', si: 'සිදුවීම මකා දමන ලදී' },
    REGISTERED: { en: 'Event registration received', ta: 'நிகழ்வு பதிவு பெறப்பட்டது', si: 'සිදුවීම් ලියාපදිංචිය ලැබුණි' },
    QR_SCANNED: { en: 'Event attendee checked in', ta: 'நிகழ்வு பங்கேற்பாளர் வருகை பதிவு செய்தார்', si: 'සිදුවීම් සහභාගිවන්නා පැමිණීම සලකුණු කළේය' },
    'announcement.publish': { en: 'Announcement published', ta: 'அறிவிப்பு வெளியிடப்பட்டது', si: 'නිවේදනය ප්‍රකාශයට පත් කරන ලදී' },
  };
  return dictionary[action]?.[lang] || String(action || '').replace(/[._]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Activity recorded';
}

export default function Dashboard() {
  const { lang = 'en' } = useOutletContext() || {};
  const t = COPY[lang] || COPY.en;
  const user = getStoredUser();
  const [range, setRange] = useState('6m');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const todayIso = `${todayParts.find((p) => p.type === 'year')?.value}-${todayParts.find((p) => p.type === 'month')?.value}-${todayParts.find((p) => p.type === 'day')?.value}`;

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ range });
      if (range === 'custom' && custom.from && custom.to) { params.set('from', custom.from); params.set('to', custom.to); }
      const response = await api.get(`/dashboard/?${params.toString()}`);
      const payload = response.data?.data;
      if (!payload || typeof payload !== 'object') {
        setData(null);
      } else {
        setData({
          ...payload,
          leadership: { ...payload.leadership, recent: asArray(payload.leadership?.recent), byDistrict: asArray(payload.leadership?.byDistrict), byProvince: asArray(payload.leadership?.byProvince) },
          members: { ...payload.members, monthly: asArray(payload.members?.monthly), recent: asArray(payload.members?.recent), byProvince: asArray(payload.members?.byProvince) },
          events: { ...payload.events, upcomingList: asArray(payload.events?.upcomingList), recent: asArray(payload.events?.recent) },
          registrations: { ...payload.registrations, monthly: asArray(payload.registrations?.monthly), byEvent: asArray(payload.registrations?.byEvent) },
          activity: asArray(payload.activity),
        });
      }
    } catch (e) {
      setError(e.response?.data?.error || t.error);
    } finally { setLoading(false); setRefreshing(false); }
  }, [range, custom, t.error]);

  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 60000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => {
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') load(true); };
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => { window.removeEventListener('focus', refreshOnReturn); document.removeEventListener('visibilitychange', refreshOnReturn); };
  }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);

  const leader = data?.leadership || { recent: [], byDistrict: [], byProvince: [] };
  const members = data?.members || { monthly: [], recent: [], byProvince: [] };
  const events = data?.events || { upcomingList: [], recent: [] };
  const registrations = data?.registrations || { monthly: [], byEvent: [] };

  const cards = [
    { label: t.leaders, value: leader.total, Icon: Crown, route: '/leadership', note: `${num(leader.published)} ${t.published.toLowerCase()}` },
    { label: t.members, value: members.total, Icon: Users, route: '/membership', note: `${num(members.thisMonth)} ${t.thisMonth.toLowerCase()}` },
    { label: t.events, value: events.total, Icon: CalendarDays, route: '/events', note: `${num(events.upcoming)} ${t.upcoming.toLowerCase()}` },
    { label: t.registrations, value: registrations.total, Icon: TicketCheck, route: '/registrations', note: `${num(registrations.thisMonth)} ${t.thisMonth.toLowerCase()}` },
  ];
  const cards2 = [
    { label: t.published, value: leader.published, Icon: CheckCircle2, route: '/leadership', note: `${num(leader.draft)} ${t.drafts.toLowerCase()}` },
    { label: t.active, value: members.active, Icon: Users, route: '/membership', note: `${num(members.pending)} ${t.pending.toLowerCase()}` },
    { label: t.upcoming, value: events.upcoming, Icon: Clock3, route: '/events', note: `${num(events.ongoing)} ${t.ongoing.toLowerCase()}` },
    { label: t.confirmed, value: registrations.confirmed, Icon: CheckCircle2, route: '/registrations', note: `${num(registrations.cancelled)} ${t.cancelled.toLowerCase()}` },
  ];

  const monthSeries = useMemo(() => {
    const membersByMonth = Object.fromEntries(asArray(members.monthly).map((row) => [row.month, Number(row.count)]));
    const registrationsByMonth = Object.fromEntries(asArray(registrations.monthly).map((row) => [row.month, Number(row.count)]));
    const months = [...new Set([...Object.keys(membersByMonth), ...Object.keys(registrationsByMonth)])].sort();
    return months.map((month) => ({ month: new Intl.DateTimeFormat(lang === 'en' ? 'en-LK' : `${lang}-LK`, { month: 'short', year: '2-digit' }).format(new Date(`${month}-01T00:00:00`)), members: membersByMonth[month] || 0, registrations: registrationsByMonth[month] || 0 }));
  }, [members.monthly, registrations.monthly, lang]);

  const districtRows = asArray(leader.byDistrict);
  const leadershipDist = (districtRows.length ? districtRows : asArray(leader.byProvince)).map((row) => ({ district: row.district || row.province, count: row.count }));

  const todayText = new Intl.DateTimeFormat(lang === 'en' ? 'en-LK' : `${lang}-LK`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }).format(now);
  const clockText = new Intl.DateTimeFormat(lang === 'en' ? 'en-LK' : `${lang}-LK`, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' }).format(now);

  if (loading && !data) return <div className="dh-page" lang={lang}><div className="dh-loading"><span className="dh-spinner"/>{t.loading}</div></div>;
  if (error && !data) return <div className="dh-page" lang={lang}><div className="dh-error"><Activity size={24}/><b>{t.error}</b><p>{error}</p><button onClick={() => load()}><RefreshCw size={15}/>{t.retry}</button></div></div>;

  const StatRow = ({ items, offset = 0 }) => <div className="dh-stat-grid">{items.map(({ label, value, Icon, route, note }, index) => <Link to={route} className="dh-stat" key={label} style={{ '--dh-order': offset + index }}><span className="dh-stat-top"><span className="dh-stat-icon"><Icon size={20}/></span><ArrowRight size={15} className="dh-stat-arrow"/></span><span className="dh-stat-value"><AnimatedValue value={value}/></span><span className="dh-stat-label">{label}</span><span className="dh-stat-note">{note}</span></Link>)}</div>;

  return <div className="dh-page" lang={lang}>
    <header className="dh-welcome">
      <div>
        <span className="dh-eyebrow">RISE GOVERNANCE HUB <i/>{t.online}</span>
        <h1>{t.welcome}{user?.name ? `, ${user.name}` : ', Administrator'}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="dh-welcome-meta">
        <span><CalendarDays size={15}/>{todayText}</span>
        <b>{clockText}</b>
        <button className="dh-refresh" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'dh-rotate' : ''}/>{refreshing ? '…' : t.refresh}</button>
      </div>
    </header>

    {error && <div className="dh-inline-error" role="alert">{error}</div>}

    <StatRow items={cards}/>
    <StatRow items={cards2} offset={4}/>

    <Suspense fallback={<div className="dh-loading"><span className="dh-spinner"/>{t.loading}</div>}>
      <DashboardCharts
        monthSeries={monthSeries}
        memberStatus={members}
        eventStatus={events}
        leadershipDist={leadershipDist}
        regByEvent={registrations.byEvent || []}
        labels={t}
        range={range} setRange={setRange} custom={custom} setCustom={setCustom}
        onApply={() => load(true)} noData={t.noData} lang={lang}
      />
    </Suspense>

    <div className="dh-lower-grid">
      <section className="dh-panel">
        <header><div><span className="dh-panel-kicker">{t.events}</span><h2>{t.upcomingEvents}</h2></div><Link to="/events" className="dh-view-all">{t.view}<ArrowRight size={14}/></Link></header>
        <div className="dh-upcoming-list">
          {(events.upcomingList || []).map((event) => {
            const isLive = event.event_date === todayIso;
            return <Link to="/events" className="dh-upcoming-card" key={event.id}>
              <div className="dh-upcoming-img">
                {event.image ? <img src={event.image} alt="" loading="lazy"/> : <CalendarDays size={22}/>}
                {isLive && <span className="dh-live-badge">{t.live}</span>}
              </div>
              <div className="dh-upcoming-info">
                <b>{event.title}</b>
                <span><CalendarDays size={12}/>{fmtDate(event.event_date, lang)}{event.start_time ? ` · ${fmtTime(event.start_time)}` : ''}</span>
                <span><MapPin size={12}/>{event.venue || t.venueTba}</span>
                <em>{num(event.registrations)} {t.registrations.toLowerCase()}</em>
              </div>
            </Link>;
          })}
          {!events.upcomingList?.length && <div className="dh-table-empty">{t.noData}</div>}
        </div>
      </section>

      <section className="dh-panel">
        <header><div><span className="dh-panel-kicker">{t.members}</span><h2>{t.recentMembers}</h2></div><Link to="/membership" className="dh-view-all">{t.view}<ArrowRight size={14}/></Link></header>
        <div className="dh-table-wrap">
          <table className="dh-table">
            <thead><tr><th>{t.memberName}</th><th>{t.membershipId}</th><th>{t.district}</th><th>{t.eventDate}</th><th>{t.status}</th></tr></thead>
            <tbody>
              {(members.recent || []).map((m) => <tr key={m.id}>
                <td><b>{m.full_name}</b><small>{m.province}</small></td>
                <td>{m.membership_id || '—'}</td>
                <td>{m.district}</td>
                <td>{fmtDate(m.created_at, lang)}</td>
                <td><span className={`dh-badge ${m.status === 'verified' ? 'dh-badge-live' : m.status === 'pending' || m.status === 'under_review' ? 'dh-badge-up' : 'dh-badge-done'}`}>{memberStatusLabel(m.status, t)}</span></td>
              </tr>)}
              {!members.recent?.length && <tr><td colSpan="5" className="dh-table-empty-cell">{t.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div className="dh-lower-grid">
      <section className="dh-panel">
        <header><div><span className="dh-panel-kicker">RISE</span><h2>{t.recentActivity}</h2></div><Link to="/history" className="dh-view-all">{t.view}<ArrowRight size={14}/></Link></header>
        <ol className="dh-activity">
          {(data?.activity || []).slice(0, 8).map((item) => <li key={item.id}><i/><div><b>{actionText(item.action, lang)}</b><span>{item.actor}</span><small>{fmtDate(item.at, lang, { dateStyle: 'medium', timeStyle: 'short' })}</small></div></li>)}
        </ol>
        {!data?.activity?.length && <div className="dh-table-empty">{t.noData}</div>}
      </section>

      <section className="dh-panel">
        <header><div><span className="dh-panel-kicker">{t.leaders}</span><h2>{t.recentLeaders}</h2></div><Link to="/leadership" className="dh-view-all">{t.view}<ArrowRight size={14}/></Link></header>
        <div className="dh-leader-list">
          {(leader.recent || []).slice(0, 6).map((person) => <Link to="/leadership" className="dh-leader-row" key={person.id}>
            <span className="dh-avatar"><Crown size={15}/></span>
            <span><b>{person.name || `Leader #${person.id}`}</b><small>{[person.district, person.province].filter(Boolean).join(' · ') || '—'}</small></span>
            <span className={`dh-badge ${person.status === 'published' ? 'dh-badge-live' : 'dh-badge-draft'}`}>{person.status}</span>
          </Link>)}
          {!leader.recent?.length && <div className="dh-table-empty">{t.noData}</div>}
        </div>
      </section>
    </div>

    <footer className="dh-footer"><span>{t.online}</span><span>{t.refreshed} {fmtDate(data?.generatedAt, lang, { dateStyle: 'medium', timeStyle: 'short' })}</span><span>{lang === 'ta' ? 'தானியங்கி புதுப்பிப்பு: 60 விநாடிகள்' : lang === 'si' ? 'ස්වයංක්‍රීය යාවත්කාලීන කිරීම: තත්පර 60' : 'Auto refresh: 60 seconds'}</span></footer>
  </div>;
}
