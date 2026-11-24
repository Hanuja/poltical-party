import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Send, MapPin, Mail, Phone, Globe, UserRound, LoaderCircle, CloudOff, Eye, X, Building2, CalendarDays,
} from 'lucide-react';
import { FORM_LANGS, LANG_NAMES, formStrings, fill } from '../i18n/leadershipForm';
import { leadershipApi, loadMeta, labelOf, pickTr, sectionOf, EMPTY_TR } from '../lib/leadership';
import '../leadership.css';

const lines = (text) => String(text || '').split('\n').map((x) => x.replace(/^[\s•*\-–]+/, '').trim()).filter(Boolean);

// Shows the profile exactly as the public website will, in any of the three languages,
// using the same per-field fallback (selected language → English → Tamil → Sinhala).
// Previewing never publishes anything.
export default function LeaderPreview() {
  const { id } = useParams();
  const [search, setSearch] = useSearchParams();
  const lang = FORM_LANGS.some((l) => l.code === search.get('lang')) ? search.get('lang') : 'en';
  const s = formStrings[lang];
  const [leader, setLeader] = useState(null);
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let off = false;
    loadMeta().then((m) => !off && setMeta(m)).catch(() => {});
    leadershipApi.get(id).then((l) => { if (!off) { setLeader(l); setState('ready'); } })
      .catch(() => !off && setState('error'));
    return () => { off = true; };
  }, [id]);

  const publish = async () => {
    setBusy(true); setNotice(null);
    try {
      setLeader(await leadershipApi.setStatus(leader.id, 'published'));
      setNotice({ type: 'success', text: s.publishedToast });
    } catch (e) {
      const field = e.response?.data?.data?.field;
      const map = { name: s.publishNeeds, section: s.sectionRequired, email: s.invalidEmail, phone: s.invalidPhone };
      setNotice({ type: 'error', text: map[field] || s.failed });
    } finally { setBusy(false); }
  };

  if (state === 'loading') return <div className="lm-page" lang={lang}><div className="lm-state"><LoaderCircle className="spin" size={28} /> {s.loading}</div></div>;
  if (state === 'error') {
    return (
      <div className="lm-page" lang={lang}><div className="lm-state lm-state-error">
        <CloudOff size={30} /><p>{s.loadError}</p>
        <Link className="lm-btn lm-btn-ghost" to="/leadership"><ArrowLeft size={16} /> {s.backToList}</Link>
      </div></div>
    );
  }

  const tr = leader.translations;
  const v = (field) => pickTr(tr, field, lang);
  const name = v('name');
  const position = v('position');
  const shortBio = v('shortBio') || v('bio').split('\n').find((x) => x.trim()) || '';
  const district = meta ? labelOf(meta.districts, leader.district, lang) : '';
  const province = meta ? labelOf(meta.provinces, leader.province, lang) : '';
  const socials = ['facebook', 'twitter', 'instagram', 'youtube'].filter((k) => leader[k]);
  const section = meta ? labelOf(meta.sections, sectionOf(leader.positionKey), lang) : '';
  const missing = Object.keys(EMPTY_TR).some((k) => !String(tr[lang]?.[k] || '').trim() && v(k));
  const appointed = leader.appointmentDate
    ? new Date(`${leader.appointmentDate}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : `${lang}-LK`, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const responsibilities = lines(v('responsibilities'));
  const previous = lines(v('previousPositions'));
  const achievements = lines(v('achievements'));

  return (
    <div className="lm-page" lang={lang}>
      <div className="lm-head">
        <div className="lm-head-main">
          <Link to="/leadership" className="lm-back"><ArrowLeft size={16} /> {s.backToList}</Link>
          <h1><Eye size={22} /> {s.preview}</h1>
        </div>
        <div className="lm-head-actions">
          <Link to={`/leadership/${leader.id}/edit`} className="lm-btn lm-btn-ghost"><Pencil size={16} /> {s.editTitle}</Link>
          {leader.status !== 'published' && (
            <button type="button" className="lm-btn lm-btn-primary lm-btn-publish" onClick={publish}
              disabled={busy || !leader.languages.length} title={!leader.languages.length ? s.publishNeeds : undefined}>
              <Send size={16} /> {busy ? s.publishing : s.publish}
            </button>
          )}
        </div>
      </div>

      <div className="lm-langbar">
        <div className="lm-seg">
          {FORM_LANGS.map((l) => (
            <button key={l.code} type="button" className={`lm-seg-btn ${lang === l.code ? 'active' : ''}`}
              onClick={() => setSearch({ lang: l.code }, { replace: true })}>
              <span lang={l.code}>{l.label}</span>
              <span className={`lm-seg-dot ${leader.languages.includes(l.code) ? 'done' : ''}`} />
            </button>
          ))}
        </div>
        <span className={`lm-badge lm-badge-${leader.status}`}>{s[leader.status]}</span>
        <span className="lm-hint">{{ draft: s.hintDraft, published: s.hintPublished, inactive: s.hintInactive }[leader.status]}</span>
      </div>

      {notice && (
        <div className={`lm-notice lm-notice-${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Close"><X size={16} /></button>
        </div>
      )}
      {missing && <div className="lm-notice lm-notice-warn"><span>{fill(s.previewFallback, { lang: LANG_NAMES[lang][lang] })}</span></div>}

      <div className="lm-preview">
        <article className="lm-pv-card">
          <div className="lm-pv-photo">
            {leader.imageUrl ? <img src={leader.imageUrl} alt={name} /> : <UserRound size={64} strokeWidth={1.3} />}
          </div>
          <div className="lm-pv-card-body">
            <h3>{name || '—'}</h3>
            <p className="lm-pv-pos">{position}</p>
            {shortBio && <p className="lm-pv-muted lm-pv-short">{shortBio}</p>}
          </div>
        </article>

        <article className="lm-pv-detail">
          {section && <span className="lm-pv-section">{section}</span>}
          <span className="lm-pv-badge">{position || '—'}</span>
          <h2>{name || '—'}</h2>
          {(district || province) && <p className="lm-pv-muted"><MapPin size={15} /> {[district, province].filter(Boolean).join(', ')}</p>}
          {v('shortBio') && <p className="lm-pv-lead">{v('shortBio')}</p>}
          {v('bio') && <p className="lm-pv-bio">{v('bio')}</p>}
          {responsibilities.length > 0 && (
            <div className="lm-pv-resp"><h4>{s.resp}</h4><ul>{responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
          )}
          {v('politicalExperience') && (
            <div className="lm-pv-resp"><h4>{s.experience}</h4><p className="lm-pv-bio">{v('politicalExperience')}</p></div>
          )}
          {previous.length > 0 && (
            <div className="lm-pv-resp"><h4>{s.previous}</h4><ul>{previous.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
          )}
          {achievements.length > 0 && (
            <div className="lm-pv-resp"><h4>{s.achievements}</h4><ul>{achievements.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
          )}
          {(v('officeBranch') || appointed || leader.email || leader.phone || socials.length > 0) && (
            <div className="lm-pv-contact">
              {v('officeBranch') && <span><Building2 size={15} /> {v('officeBranch')}</span>}
              {appointed && <span><CalendarDays size={15} /> {s.appointedOn}: {appointed}</span>}
              {leader.email && <span><Mail size={15} /> {leader.email}</span>}
              {leader.phone && <span><Phone size={15} /> {leader.phone}</span>}
              {socials.map((k) => <a key={k} href={leader[k]} target="_blank" rel="noreferrer"><Globe size={15} /> {k}</a>)}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
