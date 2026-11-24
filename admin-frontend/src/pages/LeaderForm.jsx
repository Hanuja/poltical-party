import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Cloud, CloudOff, Check, LoaderCircle, ImagePlus, Trash2, Eye, Send, EyeOff, FileText,
  UserRound, Languages, Mail, Phone, Globe, RefreshCw, X, BookOpen, BadgeCheck, CalendarDays, Building2,
} from 'lucide-react';
import {
  FORM_LANGS, formStrings, getContentLang, saveContentLang,
} from '../i18n/leadershipForm';
import {
  emptyLeader, fromApi, toPayload, langComplete, pickTr, newProfileKey, loadMeta, flushKeepalive,
  leadershipApi, sectionOf, EMAIL_RE, PHONE_RE, backup,
} from '../lib/leadership';
import DeleteLeaderModal from '../components/DeleteLeaderModal';
import '../leadership.css';

const AUTOSAVE_MS = 900;
const MAX_IMAGE = 5 * 1024 * 1024;
const IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;

const parseTs = (v) => (v ? new Date(String(v).replace(' ', 'T')) : null);
const fmtTime = (d, lang) => (d && !Number.isNaN(d.getTime())
  ? d.toLocaleTimeString(lang === 'en' ? 'en-GB' : `${lang}-LK`, { hour: '2-digit', minute: '2-digit' })
  : '');

// Normalise anything restored from the device backup into the current form shape.
const normalise = (f) => fromApi({ ...emptyLeader(), ...f });

export default function LeaderForm() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const routeKey = id || search.get('key') || '';

  // Form language: labels, buttons, messages, and which language version of the content is edited.
  const { lang: ui } = useOutletContext();
  const [contentLang, setContentLang] = useState(getContentLang);
  const s = formStrings[ui];

  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(emptyLeader);
  const [leaderId, setLeaderId] = useState(id ? Number(id) : null);
  const [status, setStatus] = useState('draft');
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error | deleted
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [savedAt, setSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [touched, setTouched] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  const formRef = useRef(form);
  const idRef = useRef(leaderId);
  const keyRef = useRef(null);
  const loadedFor = useRef(null);
  const version = useRef(0);
  const savedVersion = useRef(0);
  const inFlight = useRef(null);
  const queued = useRef(false);
  const failures = useRef(0);
  const timer = useRef(null);
  const retryTimer = useRef(null);
  const fileInput = useRef(null);

  const switchContentLang = (code) => { setContentLang(code); saveContentLang(code); };

  // ---------- Load ----------
  useEffect(() => { loadMeta().then(setMeta).catch(() => {}); }, []);

  useEffect(() => {
    if (loadedFor.current && (Number(id) === idRef.current || routeKey === keyRef.current)) return;
    if (loadedFor.current && version.current !== savedVersion.current) flushKeepalive(idRef.current, buildPayload());
    loadedFor.current = null;

    if (!routeKey) {
      keyRef.current = newProfileKey();
      navigate(`/leadership/new?key=${keyRef.current}`, { replace: true });
      return;
    }

    let cancelled = false;
    setLoadState('loading');
    (async () => {
      try {
        let l = null;
        if (id) {
          l = await leadershipApi.get(id);
        } else {
          keyRef.current = routeKey;
          try { l = await leadershipApi.getByKey(routeKey); } catch (e) { if (e.response?.status !== 404) throw e; }
        }
        if (cancelled) return;
        clearTimeout(timer.current); clearTimeout(retryTimer.current);
        version.current = 0; savedVersion.current = 0; failures.current = 0;
        setTouched({}); setShowErrors(false); setNotice(null);

        const key = l?.profileKey || keyRef.current;
        keyRef.current = key;
        const serverTs = parseTs(l?.autoSavedAt || l?.updatedAt)?.getTime() || 0;
        const local = backup.read(key);
        const restore = local && (!l || local.at > serverTs);
        if (local && !restore) backup.clear(key);

        const f = restore ? normalise(local.form) : (l ? fromApi(l) : emptyLeader());
        formRef.current = f; setForm(f);
        idRef.current = l?.id || null; setLeaderId(l?.id || null);
        setStatus(l?.status || 'draft');
        setSavedAt(l ? parseTs(l.autoSavedAt || l.updatedAt) : null);
        setSaveState(l ? 'saved' : 'idle');
        loadedFor.current = routeKey;
        if (l && !id) navigate(`/leadership/${l.id}/edit`, { replace: true });
        setLoadState('ready');

        if (restore) {
          version.current = 1;
          setNotice({ type: 'warn', key: 'recovered' });
          setSaveState('saving');
          timer.current = setTimeout(() => saveRef.current(), 300);
        }
      } catch (e) {
        if (!cancelled) setLoadState(e.response?.status === 404 ? 'deleted' : 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [routeKey, id, navigate]);

  // ---------- Auto-save ----------
  const buildPayload = () => ({ ...toPayload(formRef.current), profileKey: keyRef.current });

  const saveRef = useRef(null);
  saveRef.current = async () => {
    clearTimeout(timer.current);
    clearTimeout(retryTimer.current);
    if (inFlight.current) { queued.current = true; return inFlight.current; }
    if (!idRef.current && version.current === 0) return undefined;
    if (idRef.current && version.current === savedVersion.current) return undefined;

    const v = version.current;
    setSaveState('saving');
    const run = (async () => {
      let ok = false;
      try {
        const saved = await leadershipApi.save(idRef.current, buildPayload());
        ok = true;
        failures.current = 0;
        savedVersion.current = Math.max(savedVersion.current, v);
        setStatus(saved.status);
        setSavedAt(new Date());
        const synced = version.current === savedVersion.current;
        setSaveState(synced ? 'saved' : 'saving');
        if (synced) backup.clear(keyRef.current);
        setNotice((n) => (n?.key === 'recovered' || n?.key === 'failedKept' ? null : n));
        if (!idRef.current) {
          idRef.current = saved.id;
          setLeaderId(saved.id);
          navigate(`/leadership/${saved.id}/edit`, { replace: true });
        }
      } catch (e) {
        if (e.response?.status === 410 || e.response?.status === 404) { setLoadState('deleted'); return; }
        failures.current += 1;
        setSaveState('error');
        retryTimer.current = setTimeout(() => saveRef.current(), Math.min(30000, 3000 * 2 ** (failures.current - 1)));
      } finally {
        inFlight.current = null;
        if (queued.current) {
          queued.current = false;
          if (ok) saveRef.current();
        }
      }
    })();
    inFlight.current = run;
    return run;
  };
  const saveNow = useCallback(() => saveRef.current(), []);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current;
    await saveRef.current();
    if (inFlight.current) await inFlight.current;
    return version.current === savedVersion.current;
  }, []);

  const update = useCallback((fn) => {
    const next = fn(formRef.current);
    formRef.current = next;
    setForm(next);
    version.current += 1;
    if (keyRef.current) backup.write(keyRef.current, next);
    setSaveState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveRef.current(), AUTOSAVE_MS);
  }, []);

  useEffect(() => {
    const flushOnExit = () => {
      if (version.current !== savedVersion.current && keyRef.current) flushKeepalive(idRef.current, buildPayload());
    };
    window.addEventListener('pagehide', flushOnExit);
    return () => {
      window.removeEventListener('pagehide', flushOnExit);
      clearTimeout(timer.current); clearTimeout(retryTimer.current);
      flushOnExit();
    };
  }, []);

  // ---------- Field helpers ----------
  const setField = (k, v) => update((f) => ({ ...f, [k]: v }));
  const setTr = (field, v) => update((f) => ({
    ...f, translations: { ...f.translations, [contentLang]: { ...f.translations[contentLang], [field]: v } },
  }));
  const setProvince = (p) => update((f) => {
    const d = meta?.districts.find((x) => x.key === f.district);
    return { ...f, province: p, district: d && p && d.province !== p ? '' : f.district };
  });
  const setDistrict = (dk) => update((f) => {
    const d = meta?.districts.find((x) => x.key === dk);
    return { ...f, district: dk, province: d ? d.province : f.province };
  });
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const onFile = async (file) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.test(file.type) || file.size > MAX_IMAGE) { setNotice({ type: 'error', key: 'photoTypeError' }); return; }
    setUploading(true);
    try {
      const r = await leadershipApi.upload(file);
      update((f) => ({ ...f, image: r.path, imageUrl: r.url }));
    } catch (e) {
      setNotice({ type: 'error', text: e.response?.data?.error ? `${s.uploadFailed}: ${e.response.data.error}` : null, key: 'uploadFailed' });
    } finally {
      setUploading(false);
    }
  };

  // ---------- Validation ----------
  const anyComplete = useMemo(() => FORM_LANGS.some((l) => langComplete(form.translations[l.code])), [form.translations]);
  const errors = useMemo(() => ({
    email: form.email && !EMAIL_RE.test(form.email.trim()) ? 'invalidEmail' : null,
    phone: form.phone && !PHONE_RE.test(form.phone.trim()) ? 'invalidPhone' : null,
    name: !anyComplete ? 'publishNeeds' : null,
    section: !sectionOf(form.positionKey) ? 'sectionRequired' : null,
  }), [form.email, form.phone, form.positionKey, anyComplete]);
  const showErr = (k) => errors[k] && (showErrors || touched[k]);

  // ---------- Status / preview / delete ----------
  const changeStatus = async (next) => {
    if (next === 'published') {
      setShowErrors(true);
      const first = ['name', 'section', 'email', 'phone'].find((k) => errors[k]);
      if (first) { setNotice({ type: 'error', key: first === 'name' || first === 'section' ? errors[first] : 'fixBeforePublish' }); return; }
    }
    setStatusBusy(true); setNotice(null);
    try {
      const ok = await flush();
      if (!ok || !idRef.current) throw new Error('save');
      const l = await leadershipApi.setStatus(idRef.current, next);
      setStatus(l.status);
      setNotice({ type: 'success', key: { published: 'publishedToast', inactive: 'inactiveToast', draft: 'draftToast' }[next] });
    } catch (e) {
      const field = e.response?.data?.data?.field;
      const map = { name: 'publishNeeds', section: 'sectionRequired', email: 'invalidEmail', phone: 'invalidPhone' };
      if (field) setShowErrors(true);
      setNotice({ type: 'error', key: map[field] || 'failed' });
    } finally {
      setStatusBusy(false);
    }
  };

  const openPreview = async () => {
    await flush();
    if (idRef.current) navigate(`/leadership/${idRef.current}/preview?lang=${contentLang}`);
  };

  const doDelete = async () => {
    clearTimeout(timer.current); clearTimeout(retryTimer.current);
    if (inFlight.current) await inFlight.current;
    await leadershipApi.remove(idRef.current);
    savedVersion.current = version.current;
    backup.clear(keyRef.current);
    navigate('/leadership', { replace: true, state: { flash: 'deleted' } });
  };

  // ---------- Render ----------
  // Content-language tabs remain local to the editor; the interface language is global in AdminHeader.
  const LanguageSwitch = (
    <div className="lm-uiswitch" role="group" aria-label={s.contentLanguage}>
      <span className="lm-uiswitch-label"><Languages size={15} /> {s.contentLanguage}</span>
      {FORM_LANGS.map((l) => {
        const done = langComplete(form.translations[l.code]);
        return (
          <button key={l.code} type="button" lang={l.code} className={contentLang === l.code ? 'active' : ''}
            aria-pressed={contentLang === l.code} onClick={() => switchContentLang(l.code)} title={done ? s.langComplete : s.langMissing}>
            {l.label}
            {done && <Check size={12} strokeWidth={3} className="lm-uiswitch-done" aria-label={s.langComplete} />}
          </button>
        );
      })}
    </div>
  );

  if (loadState !== 'ready') {
    return (
      <div className="lm-page" lang={ui}>
        {loadState === 'loading'
          ? <div className="lm-state"><LoaderCircle className="spin" size={28} /> {s.loading}</div>
          : (
            <div className="lm-state lm-state-error">
              <CloudOff size={30} />
              <p>{loadState === 'deleted' ? s.deletedProfile : s.loadError}</p>
              <div className="lm-state-actions">
                {loadState === 'error' && <button type="button" className="lm-btn lm-btn-primary" onClick={() => window.location.reload()}><RefreshCw size={16} /> {s.retry}</button>}
                <Link className="lm-btn lm-btn-ghost" to="/leadership"><ArrowLeft size={16} /> {s.backToList}</Link>
              </div>
            </div>
          )}
      </div>
    );
  }

  const tr = form.translations[contentLang];
  const districts = (meta?.districts || []).filter((d) => !form.province || d.province === form.province)
    .sort((a, b) => a.labels[ui].localeCompare(b.labels[ui], ui));
  const displayName = pickTr(form.translations, 'name', contentLang);
  const section = sectionOf(form.positionKey);
  const chip = <b className="lm-lang-chip" lang={contentLang}>{FORM_LANGS.find((l) => l.code === contentLang).short}</b>;
  const noticeText = notice && (notice.text || s[notice.key]);

  return (
    <div className="lm-page" lang={ui}>
      <div className="lm-head">
        <div className="lm-head-main">
          <Link to="/leadership" className="lm-back"><ArrowLeft size={16} /> {s.backToList}</Link>
          <h1>{leaderId ? s.editTitle : s.createTitle}</h1>
        </div>
        <div className="lm-head-side">
          {LanguageSwitch}
          <SaveIndicator s={s} state={saveState} savedAt={savedAt} live={status === 'published'} lang={ui} onRetry={saveNow} />
        </div>
      </div>

      {notice && (
        <div className={`lm-notice lm-notice-${notice.type}`} role="status">
          <span>{noticeText}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Close"><X size={16} /></button>
        </div>
      )}
      {saveState === 'error' && <div className="lm-notice lm-notice-error" role="alert"><span>{s.failed} — {s.failedKept}</span></div>}

      <div className="lm-grid">
        <aside className="lm-aside">
          <section className="lm-card lm-photo-card">
            <h2 className="lm-card-title"><UserRound size={17} /> {s.secPhoto}</h2>
            <div className={`lm-photo ${form.imageUrl ? 'has-img' : ''}`}>
              {form.imageUrl
                ? <img src={form.imageUrl} alt={displayName} />
                : <span className="lm-photo-empty"><UserRound size={54} strokeWidth={1.4} /></span>}
              {uploading && <span className="lm-photo-busy"><LoaderCircle className="spin" size={26} /> {s.uploading}</span>}
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden
              onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="lm-photo-actions">
              <button type="button" className="lm-btn lm-btn-primary" disabled={uploading} onClick={() => fileInput.current?.click()}>
                <ImagePlus size={16} /> {form.image ? s.changePhoto : s.uploadPhoto}
              </button>
              {form.image && (
                <button type="button" className="lm-btn lm-btn-ghost" disabled={uploading}
                  onClick={() => update((f) => ({ ...f, image: '', imageUrl: '' }))}>{s.removePhoto}</button>
              )}
            </div>
            <p className="lm-hint">{s.photoHint}</p>
          </section>

          <section className={`lm-card lm-status-card st-${status}`}>
            <h2 className="lm-card-title">{s.status}</h2>
            <span className={`lm-badge lm-badge-${status}`}>{s[status]}</span>
            <p className="lm-hint">{{ draft: s.hintDraft, published: s.hintPublished, inactive: s.hintInactive }[status]}</p>
          </section>
        </aside>

        <div className="lm-main">
          {/* 01 · Basic information */}
          <section className="lm-card">
            <h2 className="lm-card-title"><BadgeCheck size={17} /> {s.secBasic}</h2>
            <div className="lm-row">
              <label className={`lm-fld ${showErr('name') ? 'has-err' : ''}`}>
                <span>{s.fullName} {chip}</span>
                <input lang={contentLang} value={tr.name} placeholder={s.fullNamePh} maxLength={150}
                  onBlur={() => touch('name')} onChange={(e) => setTr('name', e.target.value)} />
                {showErr('name') && <small className="lm-err">{s.requiredToPublish}</small>}
              </label>
              <label className={`lm-fld ${showErr('name') ? 'has-err' : ''}`}>
                <span>{s.position} {chip}</span>
                <input lang={contentLang} value={tr.position} placeholder={s.positionPh} maxLength={150}
                  onBlur={() => touch('name')} onChange={(e) => setTr('position', e.target.value)} />
                {showErr('name') && <small className="lm-err">{s.requiredToPublish}</small>}
              </label>
            </div>
            <fieldset className={`lm-fld lm-sections ${showErr('section') ? 'has-err' : ''}`}>
              <legend>{s.section}</legend>
              <div className="lm-section-opts" role="radiogroup" aria-label={s.section}>
                {(meta?.sections || []).map((o) => (
                  <label key={o.key} className={`lm-section-opt ${section === o.key ? 'active' : ''}`}>
                    <input type="radio" name="lm-section" value={o.key} checked={section === o.key}
                      onChange={() => { touch('section'); setField('positionKey', o.key); }} />
                    {o.labels[ui]}
                  </label>
                ))}
              </div>
              <small className={showErr('section') ? 'lm-err' : 'lm-hint lm-hint-tight'}>{showErr('section') ? s.sectionRequired : s.sectionHint}</small>
            </fieldset>
            <label className="lm-fld lm-fld-narrow">
              <span>{s.displayOrder}</span>
              <input type="number" min="0" step="1" value={form.displayOrder}
                onChange={(e) => setField('displayOrder', e.target.value)} />
              <small className="lm-hint lm-hint-tight">{s.displayOrderHint}</small>
            </label>
          </section>

          {/* 02 · Biography & leadership details (per language) */}
          <section className="lm-card">
            <h2 className="lm-card-title">
              <BookOpen size={17} /> {s.secBio}
              <span className="lm-tag lm-tag-lang"><Globe size={12} /> {s.perLanguage}</span>
            </h2>
            <label className="lm-fld">
              <span>{s.shortBio} {chip}</span>
              <textarea lang={contentLang} rows={3} className="lm-textarea-sm" value={tr.shortBio} placeholder={s.shortBioPh}
                maxLength={2000} onChange={(e) => setTr('shortBio', e.target.value)} />
            </label>
            <label className="lm-fld">
              <span>{s.bio} {chip}</span>
              <textarea lang={contentLang} rows={7} value={tr.bio} placeholder={s.bioPh}
                onChange={(e) => setTr('bio', e.target.value)} />
            </label>
            <div className="lm-row">
              <label className="lm-fld">
                <span>{s.resp} {chip}</span>
                <textarea lang={contentLang} rows={5} className="lm-textarea-sm" value={tr.responsibilities} placeholder={s.respPh}
                  onChange={(e) => setTr('responsibilities', e.target.value)} />
                <small className="lm-hint lm-hint-tight">{s.respHint}</small>
              </label>
              <label className="lm-fld">
                <span>{s.previous} {chip}</span>
                <textarea lang={contentLang} rows={5} className="lm-textarea-sm" value={tr.previousPositions} placeholder={s.previousPh}
                  onChange={(e) => setTr('previousPositions', e.target.value)} />
              </label>
            </div>
            <label className="lm-fld">
              <span>{s.experience} {chip}</span>
              <textarea lang={contentLang} rows={4} className="lm-textarea-sm" value={tr.politicalExperience} placeholder={s.experiencePh}
                onChange={(e) => setTr('politicalExperience', e.target.value)} />
            </label>
            <label className="lm-fld">
              <span>{s.achievements} {chip}</span>
              <textarea lang={contentLang} rows={4} className="lm-textarea-sm" value={tr.achievements} placeholder={s.achievementsPh}
                onChange={(e) => setTr('achievements', e.target.value)} />
            </label>
          </section>

          {/* 03 · Official information */}
          <section className="lm-card">
            <h2 className="lm-card-title"><Building2 size={17} /> {s.secOfficial}</h2>
            <div className="lm-row lm-row-3">
              <label className="lm-fld">
                <span><CalendarDays size={13} /> {s.appointment}</span>
                <input type="date" value={form.appointmentDate || ''} onChange={(e) => setField('appointmentDate', e.target.value)} />
              </label>
              <label className={`lm-fld ${showErr('email') ? 'has-err' : ''}`}>
                <span><Mail size={13} /> {s.email}</span>
                <input type="email" value={form.email} placeholder={s.emailPh} maxLength={150}
                  onBlur={() => touch('email')} onChange={(e) => setField('email', e.target.value)} aria-invalid={showErr('email') ? true : undefined} />
                {showErr('email') && <small className="lm-err">{s.invalidEmail}</small>}
              </label>
              <label className={`lm-fld ${showErr('phone') ? 'has-err' : ''}`}>
                <span><Phone size={13} /> {s.phone}</span>
                <input type="tel" value={form.phone} placeholder={s.phonePh} maxLength={30}
                  onBlur={() => touch('phone')} onChange={(e) => setField('phone', e.target.value)} aria-invalid={showErr('phone') ? true : undefined} />
                {showErr('phone') && <small className="lm-err">{s.invalidPhone}</small>}
              </label>
              <label className="lm-fld">
                <span><Building2 size={13} /> {s.office} {chip}</span>
                <input lang={contentLang} value={tr.officeBranch} placeholder={s.officePh} maxLength={255}
                  onChange={(e) => setTr('officeBranch', e.target.value)} />
              </label>
              <label className="lm-fld">
                <span>{s.province}</span>
                <select value={form.province} onChange={(e) => setProvince(e.target.value)}>
                  <option value="">{s.select}</option>
                  {meta?.provinces.map((p) => <option key={p.key} value={p.key}>{p.labels[ui]}</option>)}
                </select>
              </label>
              <label className="lm-fld">
                <span>{s.district}</span>
                {/* Only the districts of the selected province are offered. */}
                <select value={form.province ? form.district : ''} disabled={!form.province}
                  onChange={(e) => setDistrict(e.target.value)}>
                  <option value="">{form.province ? s.select : s.chooseProvinceFirst}</option>
                  {form.province && districts.map((d) => <option key={d.key} value={d.key}>{d.labels[ui]}</option>)}
                </select>
              </label>
            </div>
            <h3 className="lm-subhead"><Globe size={14} /> {s.secSocial}</h3>
            <div className="lm-row">
              {[['facebook', 'Facebook'], ['twitter', 'X (Twitter)'], ['instagram', 'Instagram'], ['youtube', 'YouTube']].map(([k, label]) => (
                <label key={k} className="lm-fld">
                  <span>{label}</span>
                  <input type="url" value={form[k]} placeholder="https://…" maxLength={255}
                    onChange={(e) => setField(k, e.target.value)} />
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="lm-actionbar">
        <div className="lm-actionbar-left">
          {leaderId && (
            <button type="button" className="lm-btn lm-btn-danger-ghost" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} /> {s.delete}
            </button>
          )}
        </div>
        <div className="lm-actionbar-right">
          <button type="button" className="lm-btn lm-btn-ghost" disabled={!leaderId || statusBusy} onClick={openPreview}>
            <Eye size={16} /> {s.preview}
          </button>
          {status === 'published' && (
            <button type="button" className="lm-btn lm-btn-ghost" disabled={statusBusy} onClick={() => changeStatus('inactive')}>
              <EyeOff size={16} /> {s.markInactive}
            </button>
          )}
          {status !== 'draft' && (
            <button type="button" className="lm-btn lm-btn-ghost" disabled={statusBusy} onClick={() => changeStatus('draft')}>
              <FileText size={16} /> {s.moveToDraft}
            </button>
          )}
          {status !== 'published' && (
            <button type="button" className="lm-btn lm-btn-primary lm-btn-publish" disabled={statusBusy || !leaderId}
              onClick={() => changeStatus('published')}>
              <Send size={16} /> {statusBusy ? s.publishing : status === 'inactive' ? s.republish : s.publish}
            </button>
          )}
        </div>
      </div>

      {showDelete && (
        <DeleteLeaderModal leader={{ ...form, status }} name={displayName} lang={ui}
          onCancel={() => setShowDelete(false)} onConfirm={doDelete} />
      )}
    </div>
  );
}

function SaveIndicator({ s, state, savedAt, live, lang, onRetry }) {
  if (state === 'saving') return <span className="lm-save st-saving" aria-live="polite"><LoaderCircle className="spin" size={15} /> {s.saving}</span>;
  if (state === 'error') {
    return (
      <span className="lm-save st-error" aria-live="assertive">
        <CloudOff size={15} /> {s.failed}
        <button type="button" onClick={onRetry}>{s.retry}</button>
      </span>
    );
  }
  if (state === 'saved') {
    const t = fmtTime(savedAt, lang);
    return <span className="lm-save st-saved" aria-live="polite"><Check size={15} /> {live ? s.savedLive : s.savedDraft}{t && <em> · {t}</em>}</span>;
  }
  return <span className="lm-save st-idle"><Cloud size={15} /> {s.idle}</span>;
}
