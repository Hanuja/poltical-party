import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { CalendarDays, CheckCircle, Clock, Eye, Pencil, Trash2, X, Star, Globe, FileText, Image as ImageIcon } from 'lucide-react';

const BADGE = {
  upcoming: 'ev-b-up', live: 'ev-b-live', completed: 'ev-b-done', cancelled: 'ev-b-can',
  published: 'ev-b-pub', draft: 'ev-b-draft', unpublished: 'ev-b-can',
};
// Lifecycle stages are computed server-side (backend/helpers/registration.php → reg_event_stage)
// from the event's own date/times — never stored, never trusted from the client.
const STAGE_BADGE = {
  upcoming: ['Upcoming', 'ev-b-up'],
  registration_open: ['Registration Open', 'ev-b-live'],
  registration_closed: ['Registration Closed', 'ev-b-can'],
  completed: ['Completed', 'ev-b-done'],
  cancelled: ['Cancelled', 'ev-b-can'],
};

// Event cover image (the same `image` field the Add/Edit form saves). Falls back only when there is no
// cover image or the file cannot be loaded.
function EventCover({ src, className, fallbackClassName, label }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src]);
  if (!src || broken) {
    return <div className={fallbackClassName}><ImageIcon size={label ? 26 : 16} />{label && <small>{broken ? 'Cover image could not be loaded' : 'No cover image'}</small>}</div>;
  }
  return <img key={src} className={className} src={src} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

export default function Events() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('');
  const [pubF, setPubF] = useState('');
  const [featOnly, setFeatOnly] = useState(false);
  const [view, setView] = useState(null);
  const [del, setDel] = useState(null);
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  const load = () => api.get('/events/?admin=1').then((r) => {
    const d = r.data?.data;
    setItems(d?.items || d || []);
  }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter(e => e.publishStatus === 'published').length,
    upcoming: items.filter(e => e.status === 'upcoming').length,
    live: items.filter(e => e.status === 'live').length,
    completed: items.filter(e => e.status === 'completed').length,
    drafts: items.filter(e => e.publishStatus === 'draft' || e.publishStatus === 'unpublished').length,
  }), [items]);

  const counts = useMemo(() => ({
    all: items.length,
    upcoming: items.filter(e => e.stage === 'upcoming').length,
    registration_open: items.filter(e => e.stage === 'registration_open').length,
    registration_closed: items.filter(e => e.stage === 'registration_closed').length,
    completed: items.filter(e => e.stage === 'completed').length,
    cancelled: items.filter(e => e.stage === 'cancelled').length,
    draft: items.filter(e => e.publishStatus === 'draft').length,
    published: items.filter(e => e.publishStatus === 'published').length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== 'all') {
      if (tab === 'draft' || tab === 'published') list = list.filter(e => e.publishStatus === tab);
      else list = list.filter(e => e.stage === tab);
    }
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(e => [e.title, e.slug, e.venue, e.city, e.address].filter(Boolean).join(' ').toLowerCase().includes(s));
    }
    if (statusF) list = list.filter(e => e.status === statusF);
    if (pubF) list = list.filter(e => e.publishStatus === pubF);
    if (featOnly) list = list.filter(e => e.isFeatured);
    return list;
  }, [items, tab, q, statusF, pubF, featOnly]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => setPage(1), [tab, q, statusF, pubF, featOnly, perPage]);

  // Show the row immediately, then refresh it from the event details API so the cover is always the saved one.
  const openView = (e) => {
    setView(e);
    api.get(`/events/?id=${e.id}`).then((r) => {
      const d = r.data?.data;
      if (d?.id) setView(v => (v && v.id === d.id ? { ...v, ...d } : v));
    }).catch(() => {});
  };

  const remove = async () => {
    if (!del) return;
    await api.delete(`/events/?id=${del.id}`);
    setDel(null); setView(null); load();
  };

  const STAT = [
    { n: stats.total, l: 'Total Events', i: CalendarDays, c: '#7A1735' },
    { n: stats.published, l: 'Published', i: CheckCircle, c: '#7A1735' },
    { n: stats.upcoming, l: 'Upcoming', i: Clock, c: '#4A1024' },
    { n: stats.live, l: 'Live', i: Globe, c: '#b91c1c' },
    { n: stats.completed, l: 'Completed', i: FileText, c: '#166534' },
    { n: stats.drafts, l: 'Drafts', i: FileText, c: '#666' },
  ];

  return (
    <div className="dash-wrap">
      <div className="dash-head">
        <div>
          <span className="ev-eyebrow">RISE | EVENTS &amp; ENGAGEMENT</span>
          <h1>Event Management</h1>
          <p className="dash-sub">Manage, organize and monitor all upcoming events, live programmes and completed activities from one workspace.</p>
        </div>
        <Link to="/events/new" className="btn-publish">+ Create New Event</Link>
      </div>

      <div className="ev-stats">
        {STAT.map((s, i) => (
          <div key={i} className="ev-stat">
            <s.i size={20} style={{ color: s.c }} />
            <b>{s.n}</b><span>{s.l}</span>
          </div>
        ))}
      </div>

      <div className="ev-tabs">
        {[['all','All Events'],['upcoming','Upcoming'],['registration_open','Registration Open'],['registration_closed','Registration Closed'],['completed','Completed'],['cancelled','Cancelled'],['draft','Draft'],['published','Published']].map(([k,l]) => (
          <button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l} <em>{counts[k]}</em></button>
        ))}
      </div>

      <div className="ev-filters">
        <input placeholder="Search title, slug, venue, location…" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="">All Statuses</option><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
        <select value={pubF} onChange={e=>setPubF(e.target.value)}>
          <option value="">All Publication</option><option value="published">Published</option><option value="draft">Draft</option><option value="unpublished">Unpublished</option>
        </select>
        <label className="ev-check"><input type="checkbox" checked={featOnly} onChange={e=>setFeatOnly(e.target.checked)} /> Featured only</label>
        <span className="ev-count">{filtered.length} result{filtered.length===1?'':'s'}</span>
      </div>

      {loading ? <p>Loading…</p> : paged.length === 0 ? <p>No events match.</p> : (
        <div className="ev-table-wrap">
          <table className="ev-table">
            <thead><tr><th>Event</th><th>Category</th><th>Date / Time</th><th>Location</th><th>Status</th><th>Publication</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="ev-cell-event">
                      <EventCover src={e.image} fallbackClassName="ev-noimg" />
                      <div><b>{e.title}</b><span>{e.excerpt || e.description || ''}</span></div>
                    </div>
                  </td>
                  <td>{e.category?.name || '—'}</td>
                  <td><b>{e.date}</b><span>{e.startTime || ''}</span></td>
                  <td>{e.venue || '—'}{e.city ? <span>{e.city}</span> : null}</td>
                  <td><span className={`ev-badge ${STAGE_BADGE[e.stage]?.[1]||''}`}>{STAGE_BADGE[e.stage]?.[0]||e.stage}</span></td>
                  <td><span className={`ev-badge ${BADGE[e.publishStatus]||''}`}>{e.publishStatus}</span></td>
                  <td>{e.isFeatured ? <Star size={15} color="#E5B94C" fill="#E5B94C" /> : '—'}</td>
                  <td className="ev-actions">
                    <button title="View" onClick={()=>openView(e)}><Eye size={15}/></button>
                    <Link to={`/events/${e.id}/edit`} title="Edit"><Pencil size={15}/></Link>
                    <button title="Delete" className="del" onClick={()=>setDel(e)}><Trash2 size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ev-pager">
        <select value={perPage} onChange={e=>setPerPage(Number(e.target.value))}>
          {[10,20,50].map(n=><option key={n} value={n}>{n} / page</option>)}
        </select>
        <span>Showing {(page-1)*perPage+1}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</span>
        <div>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>←</button>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>→</button>
        </div>
      </div>

      {view && (
        <div className="ev-drawer-bg" onClick={()=>setView(null)}>
          <div className="ev-drawer" onClick={e=>e.stopPropagation()}>
            <div className="ev-drawer-head">
              <h3>{view.title}</h3>
              <button onClick={()=>setView(null)}><X size={18}/></button>
            </div>
            <div className="ev-drawer-cover">
              <EventCover key={view.id} src={view.image} className="ev-drawer-img" fallbackClassName="ev-drawer-noimg" label />
            </div>
            <dl className="ev-drawer-info">
              <div><dt>Slug</dt><dd>{view.slug || '—'}</dd></div>
              <div><dt>Description</dt><dd>{view.description || '—'}</dd></div>
              <div><dt>Schedule</dt><dd>{view.date} {view.startTime}–{view.endTime}</dd></div>
              <div><dt>Location</dt><dd>{[view.venue, view.address, view.city].filter(Boolean).join(', ') || '—'}</dd></div>
              {view.mapUrl && <div><dt>Maps</dt><dd><a href={view.mapUrl} target="_blank" rel="noreferrer">Open map</a></dd></div>}
              <div><dt>Stream</dt><dd>{view.streamUrl ? <a href={view.streamUrl} target="_blank" rel="noreferrer">Watch</a> : '—'}</dd></div>
              <div><dt>Status</dt><dd>{view.status} / {view.publishStatus}{view.isFeatured ? ' ★' : ''}</dd></div>
            </dl>
            {view.gallery?.length > 0 && (
              <div className="ev-drawer-gallery">{view.gallery.map((g,i)=><img key={i} src={g} alt="" />)}</div>
            )}
            <Link className="btn-publish" to={`/events/${view.id}/edit`}>Edit Event</Link>
          </div>
        </div>
      )}

      {del && (
        <div className="ev-modal-bg" onClick={()=>setDel(null)}>
          <div className="ev-modal" onClick={e=>e.stopPropagation()}>
            <h3>Delete Event?</h3>
            <p>"{del.title}" will be permanently removed.</p>
            <div className="ev-modal-actions">
              <button className="btn-secondary" onClick={()=>setDel(null)}>Cancel</button>
              <button className="btn-publish" onClick={remove}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
