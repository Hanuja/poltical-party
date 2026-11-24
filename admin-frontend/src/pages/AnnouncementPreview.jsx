import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import '../App.css';

// Admin-side preview that renders the announcement like the public detail page.
export default function AnnouncementPreview() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/announcements/?id=${id}`).then((r) => setA(r.data.data)).catch((e) => setErr(e.response?.data?.error || 'Not found'));
  }, [id]);

  if (err) return <div className="admin-page"><main className="admin-main"><p className="form-error">{err}</p><Link to="/announcements">Back</Link></main></div>;
  if (!a) return <div className="admin-page"><main className="admin-main"><p>Loading…</p></main></div>;

  const t = a.translations?.en || a.translations?.ta || {};
  const img = (p) => (p && p.startsWith('http') ? p : (p ? `/${p.replace(/^\/+/, '')}` : null));

  return (
    <div className="admin-page">
      <main className="admin-main" style={{ maxWidth: 860, margin: '0 auto' }}>
        <p><Link to={`/announcements/${a.id}/edit`}>← Back to editor</Link> · <Link to="/announcements">All announcements</Link></p>
        <article className="ann-detail">
          {a.isBreaking ? <span className="badge breaking">Breaking</span> : null}
          <h1>{t.title}</h1>
          <p className="ann-meta">
            {a.category?.name} · {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'Unpublished'}
            {a.district ? ` · ${a.district}` : ''}
            {a.referenceNumber ? ` · Ref: ${a.referenceNumber}` : ''}
          </p>
          {a.coverImage && <img src={img(a.coverImage)} alt={a.imageAlt || ''} style={{ width: '100%', borderRadius: 12, margin: '16px 0' }} />}
          {t.shortDescription && <p className="ann-lead">{t.shortDescription}</p>}
          <div className="ann-body" dangerouslySetInnerHTML={{ __html: t.content || '' }} />
          {a.videoUrl && <p><a href={a.videoUrl} target="_blank" rel="noreferrer">Watch video</a></p>}
          {a.pdfPath && <p><a href={img(a.pdfPath)} target="_blank" rel="noreferrer">Download PDF</a></p>}
          {a.attachments?.length > 0 && (
            <div className="ann-attachments">
              <h3>Attachments</h3>
              <ul>{a.attachments.map((f) => <li key={f.id}><a href={img(f.file_path)} target="_blank" rel="noreferrer">{f.original_name}</a></li>)}</ul>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
