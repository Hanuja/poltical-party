import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Ban, CalendarDays, ChevronLeft, ChevronRight, Clock3, Download, FilterX, Pencil, QrCode, Search, Ticket, Trash2, UserPlus } from 'lucide-react';
import api from '../lib/api';
import '../activityHistory.css';

const ACTIONS = [
  ['REGISTERED', 'Registration created'],
  ['DETAILS_UPDATED', 'Details updated'],
  ['TICKET_CANCELLED', 'Registration cancelled'],
  ['QR_SCANNED', 'Check-in scan'],
  ['REGISTRATION_DELETED', 'Registration deleted'],
];
const ACTION_META = {
  REGISTERED: { Icon: UserPlus, tone: 'green' },
  DETAILS_UPDATED: { Icon: Pencil, tone: 'gold' },
  TICKET_CANCELLED: { Icon: Ban, tone: 'red' },
  QR_SCANNED: { Icon: QrCode, tone: 'maroon' },
  REGISTRATION_DELETED: { Icon: Trash2, tone: 'red' },
};
const emptyFilters = { q: '', action: '', eventId: '', from: '', to: '' };
const ACTION_LABELS = {
  ta: { REGISTERED: 'பதிவு உருவாக்கப்பட்டது', DETAILS_UPDATED: 'விவரங்கள் புதுப்பிக்கப்பட்டன', TICKET_CANCELLED: 'பதிவு ரத்து செய்யப்பட்டது', QR_SCANNED: 'வருகைப் பதிவு', REGISTRATION_DELETED: 'பதிவு நீக்கப்பட்டது' },
  si: { REGISTERED: 'ලියාපදිංචිය සාදන ලදී', DETAILS_UPDATED: 'විස්තර යාවත්කාලීන කරන ලදී', TICKET_CANCELLED: 'ලියාපදිංචිය අවලංගුයි', QR_SCANNED: 'පැමිණීම සලකුණු කිරීම', REGISTRATION_DELETED: 'ලියාපදිංචිය මකා දමන ලදී' },
};

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(date);
}

export default function History() {
  const { lang, t } = useOutletContext();
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ history: '1', page: String(page), limit: String(limit) });
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.action) params.set('action_type', filters.action);
    if (filters.eventId) params.set('event_id', filters.eventId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    try {
      const response = await api.get(`/registrations/?${params.toString()}`);
      const data = response.data?.data || {};
      setItems(data.items || []);
      setTotal(Number(data.total || 0));
      setPages(Number(data.pages || 1));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load registration activity. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => {
    api.get('/events/?admin=1').then((r) => setEvents(r.data?.data?.items || r.data?.data || [])).catch(() => {});
  }, []);

  const applyFilters = (event) => { event.preventDefault(); setPage(1); setFilters({ ...draft }); };
  const clearFilters = () => { setDraft({ ...emptyFilters }); setPage(1); setFilters({ ...emptyFilters }); };
  const exportCsv = () => {
    const header = ['Date and time', 'Registration ID', 'Ticket', 'Participant', 'Event', 'Action', 'Details', 'Performed by'];
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = items.map((item) => [displayDate(item.createdAt), item.registrationId ? `REG-${String(item.registrationId).padStart(6, '0')}` : '', item.ticketCode, item.attendeeName, item.eventTitle, item.action, item.details, item.performedBy]);
    const blob = new Blob([[header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `registration-activity-page-${page}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="dash-wrap ah-page" lang={lang}>
    <header className="dash-head ah-heading"><div><span className="ah-kicker"><Activity size={14}/> {lang === 'ta' ? 'நிகழ்வு பதிவு மேலாண்மை' : lang === 'si' ? 'සිදුවීම් ලියාපදිංචි කළමනාකරණය' : 'EVENT REGISTER MANAGEMENT'}</span><h1>{t.history}</h1><p className="dash-sub">{t.activitySubtitle}</p></div><button className="ah-export" onClick={exportCsv} disabled={!items.length || loading}><Download size={16}/>{t.exportPage}</button></header>
    <div className="ah-summary"><div className="ah-summary-icon"><Clock3 size={18}/></div><div><b>{total.toLocaleString()}</b><span>{t.recordedActivities}</span></div><small>{t.newestFirst}</small></div>
    <form className="ah-filters" onSubmit={applyFilters}>
      <label className="ah-search"><span>{t.searchActivity}</span><div><Search size={16}/><input value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder={lang === 'ta' ? 'பெயர், பதிவு எண், டிக்கெட் அல்லது விவரங்கள்' : lang === 'si' ? 'නම, ලියාපදිංචි අංකය, ටිකට්පත හෝ විස්තර' : 'Name, registration ID, ticket or details'}/></div></label>
      <label><span>{t.action}</span><select value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })}><option value="">{t.allActions}</option>{ACTIONS.map(([value, label]) => <option value={value} key={value}>{ACTION_LABELS[lang]?.[value] || label}</option>)}</select></label>
      <label><span>{t.event}</span><select value={draft.eventId} onChange={(e) => setDraft({ ...draft, eventId: e.target.value })}><option value="">{t.allEvents}</option>{events.map((event) => <option value={event.id} key={event.id}>{event.title || event.name || `Event #${event.id}`}</option>)}</select></label>
      <label><span>{t.from}</span><input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })}/></label>
      <label><span>{t.to}</span><input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })}/></label>
      <div className="ah-filter-actions"><button className="ah-apply" type="submit"><Search size={15}/>{t.applyFilters}</button><button className="ah-clear" type="button" onClick={clearFilters}><FilterX size={15}/>{t.clear}</button></div>
    </form>
    {error && <div className="ah-error" role="alert">{error}<button onClick={loadHistory}>Retry</button></div>}
    <section className="ah-card" aria-label="Registration activity records">
      <div className="ah-card-head"><div><h2>{t.registrationActivity}</h2><p>{total ? `${total.toLocaleString()} ${t.matchingRecords}` : lang === 'ta' ? 'நிகழ்வு பதிவுகளின் தணிக்கை வரலாறு' : lang === 'si' ? 'සිදුවීම් ලියාපදිංචි විගණන ඉතිහාසය' : 'Audit history from the event registration system'}</p></div><span className="ah-live"><i/> LIVE RECORDS</span></div>
      {loading ? <div className="ah-state"><span className="ah-spinner"/>{lang === 'ta' ? 'செயல்பாடுகள் ஏற்றப்படுகின்றன…' : lang === 'si' ? 'ක්‍රියාකාරකම් පූරණය වෙමින්…' : 'Loading activity…'}</div> : items.length === 0 ? <div className="ah-state ah-empty"><CalendarDays size={25}/><b>{t.noActivity}</b><span>{t.filterHint}</span></div> : <div className="ah-table-wrap"><table className="ah-table"><thead><tr><th>{t.dateTime}</th><th>{t.registration}</th><th>{t.participantEvent}</th><th>{t.action}</th><th>{t.details}</th><th>{t.performedBy}</th></tr></thead><tbody>{items.map((item) => {
        const meta = ACTION_META[item.action] || { Icon: Ticket, tone: 'neutral' };
        const Icon = meta.Icon;
        const actionName = ACTION_LABELS[lang]?.[item.action] || ACTIONS.find(([value]) => value === item.action)?.[1] || String(item.action || 'Activity').replaceAll('_', ' ').toLowerCase();
        return <tr key={item.id}><td className="ah-time">{displayDate(item.createdAt)}</td><td><b className="ah-mono">{item.registrationId ? `REG-${String(item.registrationId).padStart(6, '0')}` : '—'}</b>{item.ticketCode && <small className="ah-ticket">Ticket {item.ticketCode}</small>}</td><td><strong>{item.attendeeName || 'Participant unavailable'}</strong><small>{item.eventTitle || (item.eventId ? `Event #${item.eventId}` : 'Event unavailable')}</small></td><td><span className={`ah-action ah-${meta.tone}`}><Icon size={14}/>{actionName}</span></td><td className="ah-details">{item.details || '—'}</td><td>{item.performedBy || 'System'}</td></tr>;
      })}</tbody></table></div>}
      <footer className="ah-pager"><span>{t.page} {page} / {pages} · {total.toLocaleString()} {t.matchingRecords}</span><div><label>{t.rows}<select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><button aria-label={t.previous} disabled={page <= 1 || loading} onClick={() => setPage((n) => n - 1)}><ChevronLeft size={16}/></button><button aria-label={t.next} disabled={page >= pages || loading} onClick={() => setPage((n) => n + 1)}><ChevronRight size={16}/></button></div></footer>
    </section>
  </div>;
}
