import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Search, Pencil, Eye, Trash2, UserRound, Users, RefreshCw, CloudOff, X } from 'lucide-react';
import { leadershipApi, loadMeta, labelOf, pickTr, sectionOf, LANG_CODES } from '../lib/leadership';
import { formStrings, listStrings } from '../i18n/leadershipForm';
import DeleteLeaderModal from '../components/DeleteLeaderModal';
import '../leadership.css';

const fmtDate = (v, lang) => {
  if (!v) return '—';
  const d = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '—'
    : d.toLocaleString(lang === 'en' ? 'en-GB' : `${lang}-LK`, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function LeadershipList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang: ui } = useOutletContext();
  const t = listStrings[ui];
  const fs = formStrings[ui];
  const [data, setData] = useState({ items: [], stats: {} });
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [statusFilter, setStatusFilter] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [flash, setFlash] = useState(location.state?.flash === 'deleted');

  useEffect(() => { loadMeta().then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (district) params.district = district;
      if (province) params.province = province;
      if (debouncedQ) params.q = debouncedQ;
      setData(await leadershipApi.list(params));
      setState('ready');
    } catch {
      setState('error');
    }
  }, [statusFilter, district, province, debouncedQ]);

  useEffect(() => { load(); }, [load]);

  const stats = data.stats || {};
  const statCards = useMemo(() => [
    [t.total, stats.total || 0, 'total'],
    [t.published, stats.published || 0, 'published'],
    [t.drafts, stats.draft || 0, 'draft'],
    [t.inactive, stats.inactive || 0, 'inactive'],
  ], [stats, t]);
  const tabs = [['', t.all], ['draft', t.drafts], ['published', t.published], ['inactive', t.inactive]];

  const districtOptions = (meta?.districts || []).filter((d) => !province || d.province === province)
    .sort((a, b) => a.labels[ui].localeCompare(b.labels[ui], ui));
  const filtered = Boolean(statusFilter || debouncedQ || district || province);
  const clearFilters = () => { setStatusFilter(''); setQ(''); setDistrict(''); setProvince(''); };
  const onProvince = (p) => {
    setProvince(p);
    const d = meta?.districts.find((x) => x.key === district);
    if (d && p && d.province !== p) setDistrict('');
  };

  const confirmDelete = async () => {
    await leadershipApi.remove(toDelete.id);
    setToDelete(null);
    setFlash(true);
    load();
  };

  return (
    <div className="lm-page" lang={ui}>
      <div className="lm-head">
        <div className="lm-head-main">
          <h1>{t.title}</h1>
          <p className="lm-sub">{t.sub}</p>
        </div>
        <div className="lm-head-side">
          <Link to="/leadership/new" className="lm-btn lm-btn-primary"><Plus size={17} /> {t.add}</Link>
        </div>
      </div>

      {flash && (
        <div className="lm-notice lm-notice-success" role="status">
          <span>{t.deleted}</span>
          <button type="button" onClick={() => setFlash(false)} aria-label="Close"><X size={16} /></button>
        </div>
      )}

      <div className="lm-stats">
        {statCards.map(([label, val, key]) => (
          <button key={key} type="button" className={`lm-stat lm-stat-${key} ${(statusFilter || 'total') === key ? 'active' : ''}`}
            onClick={() => setStatusFilter(key === 'total' ? '' : key)}>
            <span className="lm-stat-num">{state === 'loading' && !data.items.length ? '–' : val}</span>
            <span className="lm-stat-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="lm-toolbar">
        <div className="lm-tabs" role="tablist">
          {tabs.map(([key, label]) => (
            <button key={key || 'all'} type="button" role="tab" aria-selected={statusFilter === key}
              className={`lm-tab ${statusFilter === key ? 'active' : ''}`} onClick={() => setStatusFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="lm-filters">
          <select className="lm-filter-select" value={province} onChange={(e) => onProvince(e.target.value)} aria-label={t.cProvince}>
            <option value="">{t.allProvinces}</option>
            {meta?.provinces.map((p) => <option key={p.key} value={p.key}>{p.labels[ui]}</option>)}
          </select>
          <select className="lm-filter-select" value={district} onChange={(e) => setDistrict(e.target.value)} aria-label={t.cDistrict}>
            <option value="">{t.allDistricts}</option>
            {districtOptions.map((d) => <option key={d.key} value={d.key}>{d.labels[ui]}</option>)}
          </select>
          <label className="lm-search">
            <Search size={16} />
            <input type="search" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="lm-table-wrap">
        <table className="lm-table">
          <thead>
            <tr>
              <th>{t.cPhoto}</th><th>{t.cName}</th><th>{t.cPosition}</th><th>{t.cDistrict}</th><th>{t.cProvince}</th>
              <th>{t.cLangs}</th><th>{t.cStatus}</th><th>{t.cUpdated}</th><th className="lm-th-actions">{t.cActions}</th>
            </tr>
          </thead>
          <tbody>
            {state === 'loading' && Array.from({ length: 4 }).map((_, i) => (
              <tr key={`sk${i}`} className="lm-skel-row">
                {Array.from({ length: 9 }).map((__, j) => <td key={j}><span className={`lm-skel ${j === 0 ? 'lm-skel-avatar' : ''}`} /></td>)}
              </tr>
            ))}

            {state === 'error' && (
              <tr><td colSpan={9}>
                <div className="lm-state lm-state-error">
                  <CloudOff size={30} />
                  <p>{t.loadError}</p>
                  <button type="button" className="lm-btn lm-btn-primary" onClick={load}><RefreshCw size={16} /> {t.retry}</button>
                </div>
              </td></tr>
            )}

            {state === 'ready' && data.items.length === 0 && (
              <tr><td colSpan={9}>
                <div className="lm-state">
                  <Users size={34} />
                  {filtered ? (
                    <>
                      <p>{t.noMatch}</p>
                      <button type="button" className="lm-btn lm-btn-ghost" onClick={clearFilters}>{t.clear}</button>
                    </>
                  ) : (
                    <>
                      <p>{t.empty}</p>
                      <Link to="/leadership/new" className="lm-btn lm-btn-primary"><Plus size={16} /> {t.add}</Link>
                    </>
                  )}
                </div>
              </td></tr>
            )}

            {state === 'ready' && data.items.map((l) => {
              const name = pickTr(l.translations, 'name', ui);
              return (
                <tr key={l.id}>
                  <td data-label={t.cPhoto} data-col="photo">
                    {l.imageUrl ? <img className="lm-avatar" src={l.imageUrl} alt="" />
                      : <span className="lm-avatar lm-avatar-empty"><UserRound size={20} /></span>}
                  </td>
                  <td data-label={t.cName} data-col="name" className="lm-td-name">
                    <Link to={`/leadership/${l.id}/edit`}>{name || <em>{t.untitled}</em>}</Link>
                  </td>
                  <td data-label={t.cPosition} data-col="position">
                    {pickTr(l.translations, 'position', ui) || '—'}
                    {l.positionKey && meta && <small>{labelOf(meta.sections, sectionOf(l.positionKey), ui)}</small>}
                  </td>
                  <td data-label={t.cDistrict} data-col="district">{(meta && labelOf(meta.districts, l.district, ui)) || '—'}</td>
                  <td data-label={t.cProvince} data-col="province">{(meta && labelOf(meta.provinces, l.province, ui)) || '—'}</td>
                  <td data-label={t.cLangs} data-col="langs">
                    <span className="lm-langs">
                      {LANG_CODES.map((c) => {
                        const on = l.languages.includes(c);
                        return <span key={c} className={`lm-lang ${on ? 'on' : ''}`} title={`${c.toUpperCase()}: ${on ? t.filled : t.missing}`}>{c.toUpperCase()}</span>;
                      })}
                    </span>
                  </td>
                  <td data-label={t.cStatus} data-col="status"><span className={`lm-badge lm-badge-${l.status}`}>{fs[l.status]}</span></td>
                  <td data-label={t.cUpdated} data-col="updated" className="lm-td-date">{fmtDate(l.updatedAt, ui)}</td>
                  <td data-label={t.cActions} data-col="actions">
                    <div className="lm-actions">
                      <Link className="lm-act" to={`/leadership/${l.id}/edit`}><Pencil size={15} /> <span>{t.edit}</span></Link>
                      <Link className="lm-act" to={`/leadership/${l.id}/preview?lang=${ui}`}><Eye size={15} /> <span>{t.preview}</span></Link>
                      <button type="button" className="lm-act lm-act-del" onClick={() => setToDelete(l)}><Trash2 size={15} /> <span>{t.delete}</span></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toDelete && (
        <DeleteLeaderModal leader={toDelete} name={pickTr(toDelete.translations, 'name', ui)} lang={ui}
          onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}
