import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Eye, Mail, RefreshCw, CloudOff, Clock, Search, AlertTriangle, X, BadgeCheck, Send,
} from 'lucide-react';
import {
  membershipApi, INTERESTS, GENDERS, CITIZENSHIP, TEMPLATE_LABELS, EMAIL_STATUS, fmtDateTime, fmtDate, STATUS,
} from '../lib/membership';
import { StatusPill } from './MembershipList';
import '../membership.css';

const DECL_LABELS = {
  rules: 'Agrees to follow the membership rules', constitution: 'Accepts the party constitution', conduct: 'Will follow the code of conduct',
  privacy: 'Consents to data use for membership', declaration: 'Declares the information is true and complete',
};

function Dialog({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="ms-dialog-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ms-dialog" role="dialog" aria-modal="true" aria-labelledby="ms-dialog-title">
        <button ref={ref} type="button" className="ms-icon-btn ms-dialog-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h2 id="ms-dialog-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return <div className="ms-row"><dt>{label}</dt><dd>{children || '—'}</dd></div>;
}

export default function MembershipDetail() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [state, setState] = useState('loading');
  const [photoUrl, setPhotoUrl] = useState('');
  const [dialog, setDialog] = useState(null); // approve | decline | review | {email}
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [emailHtml, setEmailHtml] = useState(null);

  const load = useCallback(async () => {
    try {
      setM(await membershipApi.detail(id));
      setState('ready');
    } catch (e) {
      setState(e.status === 404 ? 'missing' : e.status === 403 ? 'forbidden' : 'error');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!m?.hasPhoto) return undefined;
    let url = '';
    membershipApi.photoBlob(m.id).then((b) => { url = URL.createObjectURL(b); setPhotoUrl(url); }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [m?.id, m?.hasPhoto]);

  const decide = async (decision) => {
    setBusy(true); setError('');
    try {
      const r = await membershipApi.decide(m.id, decision, decision === 'decline' ? reason.trim() : '');
      const mail = r.emailStatus ? ` Email: ${EMAIL_STATUS[r.emailStatus] || r.emailStatus}.` : '';
      setFlash(decision === 'approve' ? `Approved. Membership ID ${r.membershipId}.${mail}` : decision === 'decline' ? `Application declined.${mail}` : 'Marked as under review.');
      setDialog(null); setReason('');
      await load();
    } catch (e) {
      setError(e.message);
      if (e.status === 409) { setDialog(null); setFlash(''); await load(); setError(e.message); }
    } finally {
      setBusy(false);
    }
  };

  const retryEmail = async (template) => {
    setBusy(true); setError('');
    try {
      const r = await membershipApi.resendEmail(m.id, template);
      setFlash(`Email ${EMAIL_STATUS[r.emailStatus] || r.emailStatus}.`);
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const viewEmail = async (emailId) => {
    try { setEmailHtml(await membershipApi.viewEmail(emailId)); } catch (e) { setError(e.message); }
  };

  if (state === 'loading') return <div className="ms-page"><div className="ms-empty"><RefreshCw size={24} className="ms-spin" /><p>Loading application…</p></div></div>;
  if (state !== 'ready') {
    return (
      <div className="ms-page">
        <Link to="/membership" className="ms-back"><ArrowLeft size={16} /> All applications</Link>
        <div className="ms-empty">
          {state === 'missing' ? <><Search size={28} /><p>This application doesn’t exist.</p></>
            : state === 'forbidden' ? <p>Only Super Admin and Admin accounts can review membership applications.</p>
              : <><CloudOff size={28} /><p>Couldn’t load the application.</p><button type="button" className="ms-btn ms-btn-primary" onClick={load}><RefreshCw size={16} /> Try again</button></>}
        </div>
      </div>
    );
  }

  const open = m.status === 'pending' || m.status === 'under_review';
  const decl = m.declarations || {};

  return (
    <div className="ms-page">
      <Link to="/membership" className="ms-back"><ArrowLeft size={16} /> All applications</Link>

      <div className="ms-detail-head">
        <div>
          <p className="ms-kicker"><code>{m.reference}</code> · submitted {fmtDateTime(m.submittedAt)}</p>
          <h1>{m.fullName}</h1>
          <div className="ms-head-meta">
            <StatusPill status={m.status} />
            {m.membershipId && <span className="ms-idchip"><BadgeCheck size={15} /> {m.membershipId}</span>}
          </div>
        </div>
        {open && (
          <div className="ms-decide">
            {m.status === 'pending' && (
              <button type="button" className="ms-btn ms-btn-ghost" onClick={() => setDialog('review')} disabled={busy}><Clock size={17} /> Mark under review</button>
            )}
            <button type="button" className="ms-btn ms-btn-danger-ghost" onClick={() => { setDialog('decline'); setError(''); }} disabled={busy}><XCircle size={17} /> Decline</button>
            <button type="button" className="ms-btn ms-btn-primary" onClick={() => { setDialog('approve'); setError(''); }} disabled={busy}><CheckCircle2 size={17} /> Approve</button>
          </div>
        )}
      </div>

      {flash && <div className="ms-notice ms-notice-ok" role="status"><span>{flash}</span><button type="button" onClick={() => setFlash('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {error && !dialog && <div className="ms-notice ms-notice-err" role="alert"><AlertTriangle size={16} /><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss"><X size={15} /></button></div>}
      {!m.mail?.configured && (
        <div className="ms-notice ms-notice-warn"><Mail size={16} /><span>No mail server is configured (MAIL_HOST / MAIL_FROM in <code>backend/.env</code>), so emails are recorded below but <b>not delivered</b>. Tell the applicant the outcome another way, or configure SMTP and use “Send again”.</span></div>
      )}
      {m.status === 'rejected' && m.decisionReason && (
        <div className="ms-notice ms-notice-declined"><XCircle size={16} /><span><b>Declined:</b> {m.decisionReason}</span></div>
      )}

      <div className="ms-detail-grid">
        <div className="ms-col">
          <section className="ms-card">
            <h2>Personal details</h2>
            <div className="ms-person">
              {m.hasPhoto && <div className="ms-photo">{photoUrl ? <img src={photoUrl} alt={`Photo of ${m.fullName}`} /> : <span>Loading…</span>}</div>}
              <dl className="ms-dl">
                <Row label="Full name">{m.fullName}</Row>
                <Row label="Date of birth">{m.dateOfBirth ? `${fmtDate(m.dateOfBirth)} (age ${m.age})` : null}</Row>
                <Row label="Gender">{GENDERS[m.gender] || (m.gender ? m.gender : 'Not given')}</Row>
                <Row label="Preferred language">{{ en: 'English', ta: 'Tamil', si: 'Sinhala' }[m.language] || m.language}</Row>
              </dl>
            </div>
          </section>

          <section className="ms-card">
            <h2>Contact &amp; location</h2>
            <dl className="ms-dl">
              <Row label="Email"><a href={`mailto:${m.email}`}>{m.email}</a></Row>
              <Row label="Phone"><a href={`tel:${m.phone}`}>{m.phone}</a></Row>
              <Row label="Residential address"><span className="ms-pre">{m.residentialAddress}</span></Row>
              <Row label="Mailing address">{m.mailingAddress ? <span className="ms-pre">{m.mailingAddress}</span> : 'Same as residential'}</Row>
              <Row label="Province / district">{[m.province, m.district].filter(Boolean).join(' · ')}</Row>
              <Row label="Constituency">{m.division ? `${m.division}${m.electoralDistrict ? ` (${m.electoralDistrict} electoral district)` : ''}` : null}</Row>
            </dl>
          </section>

          <section className="ms-card">
            <h2>Identity &amp; background</h2>
            <dl className="ms-dl">
              <Row label="NIC number"><code>{m.nic}</code></Row>
              <Row label="Citizenship">{CITIZENSHIP[m.citizenship] || m.citizenship}</Row>
              <Row label="Occupation">{m.occupation}</Row>
              <Row label="Interests">{m.interests?.length ? m.interests.map((k) => INTERESTS[k] || k).join(', ') : 'None selected'}</Row>
              <Row label="Previous membership">{m.previousMember ? (m.previousOrganisation || 'Yes') : 'No'}</Row>
            </dl>
          </section>

          <section className="ms-card">
            <h2>Declaration</h2>
            <ul className="ms-decl">
              {Object.entries(DECL_LABELS).map(([k, label]) => (
                <li key={k} className={decl[k] ? 'yes' : 'no'}>{decl[k] ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{label}</li>
              ))}
            </ul>
            <p className="ms-muted">Signed as <b className="ms-sign">{m.signature}</b> on {fmtDateTime(m.declaredAt)}</p>
          </section>
        </div>

        <div className="ms-col">
          <section className="ms-card">
            <h2>History</h2>
            <ol className="ms-history">
              {m.history.map((h) => (
                <li key={h.id}>
                  <span className={`ms-hdot ms-h-${h.new_status}`} aria-hidden="true" />
                  <div>
                    <p><b>{STATUS[h.new_status]?.label || h.new_status}</b>{h.previous_status ? <span className="ms-muted"> from {STATUS[h.previous_status]?.label || h.previous_status}</span> : null}</p>
                    <p className="ms-muted">{fmtDateTime(h.decision_at)} · {h.reviewer || (h.reviewer_role === 'applicant' ? 'Applicant' : 'System')}</p>
                    {h.notes && <p className="ms-note">{h.notes}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="ms-card">
            <h2>Emails</h2>
            {m.emails.length === 0 ? <p className="ms-muted">No emails yet.</p> : (
              <ul className="ms-emails">
                {m.emails.map((e) => (
                  <li key={e.id}>
                    <div>
                      <p><b>{TEMPLATE_LABELS[e.template_key] || e.template_key}</b></p>
                      <p className="ms-muted">{e.recipient} · {fmtDateTime(e.sent_at || e.updated_at)}{e.attempts > 1 ? ` · ${e.attempts} attempts` : ''}</p>
                      <span className={`ms-mail ms-mail-${e.status}`}>{EMAIL_STATUS[e.status] || e.status}</span>
                      {e.status === 'failed' && e.error && <p className="ms-muted ms-err-text">{e.error}</p>}
                    </div>
                    <div className="ms-email-actions">
                      <button type="button" className="ms-btn ms-btn-ghost ms-btn-sm" onClick={() => viewEmail(e.id)}><Eye size={14} /> View</button>
                      {e.status !== 'sent' && m.mail?.configured && (
                        <button type="button" className="ms-btn ms-btn-ghost ms-btn-sm" onClick={() => retryEmail(e.template_key)} disabled={busy}><Send size={14} /> Send again</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {dialog === 'approve' && (
        <Dialog title="Approve this application?" onClose={() => !busy && setDialog(null)}>
          <p>A membership ID will be generated for <b>{m.fullName}</b> and an approval email {m.mail?.configured ? 'sent' : 'recorded (no mail server configured, so it will not be delivered)'} to {m.email}. This can’t be undone from here.</p>
          {error && <p className="ms-err-text" role="alert">{error}</p>}
          <div className="ms-dialog-actions">
            <button type="button" className="ms-btn ms-btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
            <button type="button" className="ms-btn ms-btn-primary" onClick={() => decide('approve')} disabled={busy}>{busy ? <RefreshCw size={16} className="ms-spin" /> : <CheckCircle2 size={16} />} Approve</button>
          </div>
        </Dialog>
      )}
      {dialog === 'decline' && (
        <Dialog title="Decline this application?" onClose={() => !busy && setDialog(null)}>
          <label className="ms-label" htmlFor="ms-reason">Reason (included in the email to the applicant)</label>
          <textarea id="ms-reason" className="ms-textarea" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000}
            placeholder="e.g. The NIC number could not be verified." />
          <p className="ms-muted">{reason.trim().length < 5 ? 'At least 5 characters.' : `${reason.length}/1000`}</p>
          {error && <p className="ms-err-text" role="alert">{error}</p>}
          <div className="ms-dialog-actions">
            <button type="button" className="ms-btn ms-btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
            <button type="button" className="ms-btn ms-btn-danger" onClick={() => decide('decline')} disabled={busy || reason.trim().length < 5}>{busy ? <RefreshCw size={16} className="ms-spin" /> : <XCircle size={16} />} Decline</button>
          </div>
        </Dialog>
      )}
      {dialog === 'review' && (
        <Dialog title="Mark as under review?" onClose={() => !busy && setDialog(null)}>
          <p>The applicant will see “Under Review” when they track their application. No email is sent for this step.</p>
          {error && <p className="ms-err-text" role="alert">{error}</p>}
          <div className="ms-dialog-actions">
            <button type="button" className="ms-btn ms-btn-ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
            <button type="button" className="ms-btn ms-btn-primary" onClick={() => decide('review')} disabled={busy}><Clock size={16} /> Mark under review</button>
          </div>
        </Dialog>
      )}
      {emailHtml && (
        <Dialog title={emailHtml.subject} onClose={() => setEmailHtml(null)}>
          <p className="ms-muted">To {emailHtml.recipient} · {EMAIL_STATUS[emailHtml.status] || emailHtml.status}</p>
          <iframe title="Email preview" className="ms-email-frame" sandbox="" srcDoc={emailHtml.html} />
        </Dialog>
      )}
    </div>
  );
}
