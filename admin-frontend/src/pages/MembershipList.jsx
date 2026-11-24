import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Search, RefreshCw, CloudOff, Settings2, ChevronLeft, ChevronRight, UserPlus, Eye, X } from 'lucide-react';
import { membershipApi, STATUS, fmtDateTime } from '../lib/membership';
import '../membership.css';

const TABS = [['', 'All'], ['pending', 'Received'], ['under_review', 'Under review'], ['verified', 'Approved'], ['rejected', 'Declined']];

export function StatusPill({ status, lang = 'en' }) {
  const s = STATUS[status] || { label: status, tone: 'review' };
  const labels = { en: { pending: 'Received', under_review: 'Under review', verified: 'Approved', rejected: 'Declined', suspended: 'Suspended', expired: 'Expired' }, ta: { pending: 'பெறப்பட்டது', under_review: 'பரிசீலனையில்', verified: 'அங்கீகரிக்கப்பட்டது', rejected: 'நிராகரிக்கப்பட்டது', suspended: 'இடைநிறுத்தப்பட்டது', expired: 'காலாவதியானது' }, si: { pending: 'ලැබී ඇත', under_review: 'සමාලෝචනය වෙමින්', verified: 'අනුමතයි', rejected: 'ප්‍රතික්ෂේපයි', suspended: 'අත්හිටුවා ඇත', expired: 'කල් ඉකුත් වී ඇත' } };
  return <span className={`ms-pill ms-pill-${s.tone}`}>{labels[lang]?.[status] || s.label}</span>;
}

export default function MembershipList() {
  const { lang, t } = useOutletContext();
  const [data, setData] = useState({ items: [], stats: {}, districts: [], total: 0, pages: 1 });
  const [state, setState] = useState('loading');
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [photos, setPhotos] = useState({});

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [status, district, debouncedQ]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (district) params.district = district;
      if (debouncedQ) params.q = debouncedQ;
      setData(await membershipApi.list(params));
      setState('ready');
    } catch (e) {
      setState(e.status === 403 ? 'forbidden' : 'error');
    }
  }, [page, status, district, debouncedQ]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    const urls = [];
    Promise.all((data.items || []).filter((member) => member.hasPhoto).map(async (member) => {
      try {
        const blob = await membershipApi.photoBlob(member.id);
        const url = URL.createObjectURL(blob);
        urls.push(url);
        return [member.id, url];
      } catch { return [member.id, '']; }
    })).then((entries) => { if (!cancelled) setPhotos(Object.fromEntries(entries)); });
    return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [data.items]);

  const st = data.stats || {};
  const cards = [['', t.total, st.total], ['pending', t.received, st.pending], ['under_review', t.underReview, st.under_review], ['verified', t.approved, st.verified], ['rejected', t.declined, st.rejected]];
  const filtered = Boolean(status || district || debouncedQ);

  return (
    <div className="ms-page" lang={lang}>
      <div className="ms-head">
        <div>
          <h1><UserPlus size={24} /> {t.membership}</h1>
          <p className="ms-sub">{lang === 'ta' ? 'பொதுவான Join Us பக்கத்தில் சமர்ப்பிக்கப்பட்ட விண்ணப்பங்கள். அங்கீகரித்ததும் உறுப்பினர் எண் உருவாக்கப்பட்டு மின்னஞ்சல் அனுப்பப்படும்.' : lang === 'si' ? 'පොදු Join Us පිටුවෙන් ලැබුණු අයදුම්පත්. අනුමත කළ විට සාමාජික අංකයක් සාදා විද්‍යුත් තැපෑල යවනු ලැබේ.' : 'Applications submitted on the public Join Us page. Approving generates a membership ID and emails the applicant.'}</p>
        </div>
        <Link to="/membership/settings" className="ms-btn ms-btn-ghost"><Settings2 size={17} /> {lang === 'ta' ? 'Join Us பக்கம் மற்றும் மின்னஞ்சல்கள்' : lang === 'si' ? 'Join Us පිටුව සහ ඊමේල්' : 'Join Us page & emails'}</Link>
      </div>

      <div className="ms-stats">
        {cards.map(([key, label, n]) => (
          <button key={label} type="button" className={`ms-stat ${status === key ? 'active' : ''}`} onClick={() => setStatus(key)} aria-pressed={status === key}>
            <span className="ms-stat-num">{state === 'loading' && !data.items.length ? '–' : (n || 0)}</span>
            <span className="ms-stat-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="ms-toolbar">
        <div className="ms-tabs" role="tablist">
          {TABS.map(([key]) => {
            const label = key === '' ? t.all : key === 'pending' ? t.received : key === 'under_review' ? t.underReview : key === 'verified' ? t.approved : t.declined;
            return <button key={key || 'all'} type="button" role="tab" aria-selected={status === key} className={`ms-tab ${status === key ? 'active' : ''}`} onClick={() => setStatus(key)}>{label}</button>;
          })}
        </div>
        <div className="ms-filters">
          <select className="ms-select" value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="District">
            <option value="">{t.allDistricts}</option>
            {data.districts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="ms-search">
            <Search size={16} aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={14} /></button>}
          </label>
        </div>
      </div>

      {state === 'error' && (
        <div className="ms-empty"><CloudOff size={30} /><p>{t.loadFailed}</p><button type="button" className="ms-btn ms-btn-primary" onClick={load}><RefreshCw size={16} /> {t.retry}</button></div>
      )}
      {state === 'forbidden' && <div className="ms-empty"><p>Only Super Admin and Admin accounts can review membership applications.</p></div>}

      {(state === 'ready' || (state === 'loading' && data.items.length > 0)) && (
        data.items.length === 0 ? (
          <div className="ms-empty">
            <UserPlus size={30} />
            <p>{filtered ? t.noResults : t.noApplications}</p>
            {filtered && <button type="button" className="ms-btn ms-btn-ghost" onClick={() => { setStatus(''); setDistrict(''); setQ(''); }}>{t.clear}</button>}
          </div>
        ) : (
          <div className={`ms-table-wrap ${state === 'loading' ? 'is-loading' : ''}`}>
            <table className="ms-table">
              <thead><tr><th>{t.applicant}</th><th>{t.reference}</th><th>{t.district}</th><th>{lang === 'ta' ? 'மாகாணம்' : lang === 'si' ? 'පළාත' : 'Province'}</th><th>{t.submitted}</th><th>{t.status}</th><th><span className="ms-sr">{t.actions}</span></th></tr></thead>
              <tbody>
                {data.items.map((m) => (
                  <tr key={m.id}>
                    <td data-label={t.applicant}><div className="ms-member-cell">{photos[m.id] ? <img className="ms-member-photo" src={photos[m.id]} alt=""/> : <span className="ms-member-photo ms-member-initial">{(m.fullName || '?').trim().slice(0, 1).toUpperCase()}</span>}<div><Link to={`/membership/${m.id}`} className="ms-name">{m.fullName}</Link><span className="ms-muted">{m.email}</span></div></div></td>
                    <td data-label={t.reference}><code>{m.reference}</code>{m.membershipId && <span className="ms-muted">ID {m.membershipId}</span>}</td>
                    <td data-label={t.district}>{m.district || '—'}</td>
                    <td data-label={lang === 'ta' ? 'மாகாணம்' : lang === 'si' ? 'පළාත' : 'Province'}>{m.province || '—'}</td>
                    <td data-label={t.submitted}>{fmtDateTime(m.submittedAt)}</td>
                    <td data-label={t.status}><StatusPill status={m.status} lang={lang} /></td>
                    <td className="ms-actions"><Link to={`/membership/${m.id}`} className="ms-btn ms-btn-ghost ms-btn-sm"><Eye size={15} /> {t.review}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {state === 'loading' && !data.items.length && <div className="ms-empty"><RefreshCw size={24} className="ms-spin" /><p>{lang === 'ta' ? 'விண்ணப்பங்கள் ஏற்றப்படுகின்றன…' : lang === 'si' ? 'අයදුම්පත් පූරණය වෙමින්…' : 'Loading applications…'}</p></div>}

      {data.pages > 1 && (
        <div className="ms-pager">
          <button type="button" className="ms-btn ms-btn-ghost ms-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /> {t.previous}</button>
          <span>{t.page} {data.page} / {data.pages} · {data.total} {t.applications}</span>
          <button type="button" className="ms-btn ms-btn-ghost ms-btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>{t.next} <ChevronRight size={15} /></button>
        </div>
      )}
    </div>
  );
}
