import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import '../App.css';

const STATUSES = ['published', 'scheduled', 'archived'];

// Tabs -> API filters. Categories resolved via slug -> id map fetched once.
const TABS = [
  { key: 'all', label: 'All Announcements' },
  { key: 'official-announcements', label: 'Official Announcements' },
  { key: 'press-releases', label: 'Press Releases' },
  { key: 'public-notices', label: 'Public Notices' },
  { key: 'breaking', label: 'Breaking Announcements', flag: 'breaking' },
  { key: 'scheduled', label: 'Scheduled', status: 'scheduled' },
  { key: 'drafts', label: 'Auto Drafts', status: 'auto_draft' },
  { key: 'archived', label: 'Archived', status: 'archived' },
];

export default function Announcements() {
  const [data, setData] = useState({ items: [], stats: {}, total: 0 });
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [params, setParams] = useSearchParams();

  const catSlug = params.get('cat') || '';
  const flagBreaking = params.get('flag') === 'breaking';
  const statusParam = params.get('status') || '';
  const [fStatus, setFStatus] = useState('');
  const [fBreaking, setFBreaking] = useState('');
  const [fDistrict, setFDistrict] = useState('');
  const activeTab = TABS.find((t) =>
    t.key === 'all' ? !catSlug && !flagBreaking && !statusParam
    : t.flag ? flagBreaking
    : t.key === catSlug || t.status === statusParam
  )?.key || 'all';

  // Load categories once for slug -> id mapping
  useEffect(() => {
    api.get('/announcements/?categories=1').then((r) => setCats(r.data.data || [])).catch(() => {});
  }, []);

  const catId = cats.find((c) => c.slug === catSlug)?.id || null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ all: 1, page, limit: 15 });
      if (q) p.set('q', q);
      if (statusParam) p.set('status', statusParam);
      if (catId) p.set('category', catId);
      if (flagBreaking) p.set('breakingOnly', 1);
      if (fStatus) p.set('status', fStatus);
      else if (statusParam) p.set('status', statusParam);
      if (fBreaking === '1') p.set('breakingOnly', 1);
      if (fBreaking === '0') p.set('notBreaking', 1);
      if (fDistrict) p.set('district', fDistrict);
      const res = await api.get(`/announcements/?${p}`);
      setData(res.data.data || { items: [], stats: {}, total: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, q, statusParam, catId, flagBreaking, fStatus, fBreaking, fDistrict]);

  useEffect(() => { load(); }, [load]);

  const selectTab = (tab) => {
    setPage(1);
    const next = new URLSearchParams();
    if (tab.key !== 'all') {
      if (tab.flag) next.set('flag', tab.flag);
      else if (tab.status) next.set('status', tab.status);
      else next.set('cat', tab.key);
    }
    setParams(next);
  };

  const setStat = async (id, st) => {
    try {
      await api.post(`/announcements/?action=status&id=${id}`, { status: st });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const publish = async (id) => {
    try {
      await api.post(`/announcements/?action=publish&id=${id}`);
      load();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const archive = async (id) => {
    if (!window.confirm('Archive this announcement?')) return;
    await setStat(id, 'archived');
  };

  const restore = async (id) => {
    await setStat(id, 'draft');
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/?id=${id}`);
      load();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const stats = data.stats || {};
  const statCards = [
    ['Total', stats.total || 0, 'total'],
    ['Published', stats.published || 0, 'published'],
    ['Auto Drafts', stats.auto_draft || 0, 'drafts'],
    ['Scheduled', stats.scheduled || 0, 'scheduled'],
    ['Archived', stats.archived || 0, 'archived'],
  ];

  return (
    <div className="admin-page">
      <main className="admin-main">
        <div className="ann-page-head">
          <h1>Announcement Management</h1>
          <Link to="/announcements/new" className="btn-add">+ Add New</Link>
        </div>

        <div className="stat-grid">
          {statCards.map(([label, val, kind]) => (
            <div key={label} className={`stat-card ann-stat-card ann-stat-${kind}${(kind === 'total' && activeTab === 'all') || activeTab === kind ? ' active' : ''}`}>
              <span className="stat-num">{val}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="ann-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`ann-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => selectTab(t)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-filters">
          <input
            type="search"
            placeholder="Search by title…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? <p>Loading…</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thumbnail</th><th>Title</th><th>Category</th><th>Status</th>
                <th>Breaking</th><th>District</th><th>Published</th><th>Updated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.coverImage ? <img src={a.coverImage} alt="" className="thumb" /> : <div className="thumb thumb-empty" />}
                  </td>
                  <td>{a.title || <em>(untitled)</em>}</td>
                  <td>{a.category?.name || '—'}</td>
                  <td><span className={`badge-status st-${a.status}`}>{a.status}</span></td>
                  <td>{a.isBreaking ? <span className="badge-status st-breaking">Yes</span> : '—'}</td>
                  <td>{a.district || '—'}</td>
                  <td>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}</td>
                  <td>{a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : '—'}</td>
                  <td className="row-actions">
                    <select
                      className="status-select"
                      value={a.status}
                      onChange={(e) => setStat(a.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Link className="act" to={`/announcements/${a.id}/edit`}>Edit</Link>
                    <Link className="act" to={`/announcements/${a.id}/preview`}>Preview</Link>
                    {a.status !== 'published' && a.status !== 'archived' && (
                      <button className="act" onClick={() => publish(a.id)}>Publish</button>
                    )}
                    {a.status === 'archived' ? (
                      <button className="act" onClick={() => restore(a.id)}>Restore</button>
                    ) : (
                      <button className="act act-del" onClick={() => archive(a.id)}>Archive</button>
                    )}
                    <button className="act act-del" onClick={() => remove(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td colSpan="9" className="empty">No announcements in this view. Click "+ Add New" to create one.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {Math.ceil((data.total || 0) / 15) > 1 && (
          <div className="ann-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span>Page {page} of {Math.ceil(data.total / 15)}</span>
            <button disabled={page >= Math.ceil(data.total / 15)} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}
