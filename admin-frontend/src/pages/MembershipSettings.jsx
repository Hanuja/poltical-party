import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, RefreshCw, CloudOff, Mail, Image as ImageIcon, RotateCcw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { membershipApi, TEMPLATE_LABELS } from '../lib/membership';
import '../membership.css';

const LANGS = [['en', 'English'], ['ta', 'தமிழ்'], ['si', 'සිංහල']];
const WHY = ['Public Service', 'Unity & Participation', 'Community Engagement', 'Collective Development'];
const PLACEHOLDERS = {
  received: ['{name}', '{reference}', '{date}', '{track_url}', '{party_name}'],
  approved: ['{name}', '{reference}', '{membership_id}', '{date}', '{party_name}'],
  declined: ['{name}', '{reference}', '{reason}', '{date}', '{party_name}'],
};
const FIELD_ERRORS = {
  invalid_url: 'Enter a full URL (https://…) or a site path starting with /.', invalid_email: 'Enter a valid email address.',
  invalid: 'Check this value.', incomplete: 'Fill in subject, heading and body — or clear all three to use the fallback.',
  missing_membership_id: 'The approval email must include {membership_id}.', missing_reason: 'The decline email must include {reason}.',
  missing_reference: 'Include {reference} in the subject or body.',
};

function ImageSlot({ label, hint, url, onUpload, onRemove, busy, tall }) {
  const ref = useRef(null);
  return (
    <div className="ms-imgslot">
      <div className={`ms-imgslot-preview ${tall ? 'is-tall' : ''}`}>{url ? <img src={url} alt="" /> : <ImageIcon size={26} />}</div>
      <div className="ms-imgslot-body">
        <p className="ms-label">{label}</p>
        {hint && <p className="ms-muted">{hint}</p>}
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onUpload(f); }} />
        <div className="ms-inline-actions">
          <button type="button" className="ms-btn ms-btn-ghost ms-btn-sm" onClick={() => ref.current?.click()} disabled={busy}><Upload size={14} /> {url ? 'Replace' : 'Upload'}</button>
          {url && <button type="button" className="ms-btn ms-btn-danger-ghost ms-btn-sm" onClick={onRemove} disabled={busy}><Trash2 size={14} /> Remove</button>}
        </div>
      </div>
    </div>
  );
}

function Input({ label, hint, error, area, ...rest }) {
  const Tag = area ? 'textarea' : 'input';
  return (
    <label className="ms-field">
      <span className="ms-label">{label}</span>
      <Tag className={area ? 'ms-textarea' : 'ms-input'} aria-invalid={error ? 'true' : undefined} {...rest} />
      {error ? <span className="ms-err-text">{error}</span> : hint ? <span className="ms-muted">{hint}</span> : null}
    </label>
  );
}

export default function MembershipSettings() {
  const [tab, setTab] = useState('page');
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [values, setValues] = useState({});
  const [lang, setLang] = useState('en');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);
  // templates
  const [tKey, setTKey] = useState('received');
  const [tLang, setTLang] = useState('en');
  const [templates, setTemplates] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await membershipApi.settings();
      setData(d); setValues(d.settings); setTemplates(d.templates); setState('ready');
    } catch (e) { setState(e.status === 403 ? 'forbidden' : 'error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };
  const L = (k) => `${k}_${lang}`;

  const savePage = async () => {
    setBusy('save'); setNotice(null); setErrors({});
    const out = { ...values };
    ['leader_photo', 'why_img_1', 'why_img_2', 'why_img_3', 'why_img_4'].forEach((k) => delete out[k]);
    try {
      await membershipApi.saveSettings(out);
      setNotice({ ok: true, text: 'Join Us page settings saved. The public page shows them on the next load.' });
    } catch (e) {
      setErrors(e.fields || {});
      setNotice({ ok: false, text: e.message });
    } finally { setBusy(''); }
  };

  const upload = async (slot, file) => {
    setBusy(slot); setNotice(null);
    try {
      const r = await membershipApi.uploadImage(slot, file);
      setData((d) => ({ ...d, imageUrls: { ...d.imageUrls, [slot]: r.url } }));
      setNotice({ ok: true, text: 'Image uploaded and published.' });
    } catch (e) { setNotice({ ok: false, text: e.message }); } finally { setBusy(''); }
  };
  const removeImage = async (slot) => {
    setBusy(slot);
    try {
      await membershipApi.saveSettings({ [slot]: '' });
      setData((d) => ({ ...d, imageUrls: { ...d.imageUrls, [slot]: '' } }));
      setNotice({ ok: true, text: 'Image removed.' });
    } catch (e) { setNotice({ ok: false, text: e.message }); } finally { setBusy(''); }
  };

  // ---- templates
  const cur = templates?.[tKey]?.[tLang] || { subject: '', heading: '', body: '' };
  const def = data?.defaults?.[tKey];
  const setT = (field) => (e) => setTemplates((t) => ({ ...t, [tKey]: { ...t[tKey], [tLang]: { ...t[tKey][tLang], [field]: e.target.value } } }));
  const useDefault = () => setTemplates((t) => ({ ...t, [tKey]: { ...t[tKey], [tLang]: { ...def, custom: false } } }));
  const clearT = () => setTemplates((t) => ({ ...t, [tKey]: { ...t[tKey], [tLang]: { subject: '', heading: '', body: '', custom: false } } }));

  useEffect(() => {
    if (tab !== 'emails' || !templates) return undefined;
    const t = setTimeout(() => {
      const draft = cur.body.trim() ? { subject: cur.subject, heading: cur.heading, body: cur.body } : null;
      membershipApi.previewEmail(tKey, tLang, draft).then(setPreview).catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(t);
  }, [tab, tKey, tLang, cur.subject, cur.heading, cur.body, templates]);

  const saveTemplates = async () => {
    setBusy('tpl'); setNotice(null); setErrors({});
    const list = [];
    Object.entries(templates).forEach(([key, langs]) => Object.entries(langs).forEach(([l, t]) => list.push({ key, lang: l, subject: t.subject, heading: t.heading, body: t.body })));
    try {
      const r = await membershipApi.saveTemplates(list);
      setTemplates(r.templates);
      setNotice({ ok: true, text: 'Email templates saved.' });
    } catch (e) {
      setErrors(e.fields || {});
      setNotice({ ok: false, text: e.message });
    } finally { setBusy(''); }
  };

  if (state === 'loading') return <div className="ms-page"><div className="ms-empty"><RefreshCw size={24} className="ms-spin" /><p>Loading settings…</p></div></div>;
  if (state !== 'ready') {
    return (
      <div className="ms-page">
        <Link to="/membership" className="ms-back"><ArrowLeft size={16} /> Membership Management</Link>
        <div className="ms-empty">{state === 'forbidden' ? <p>Only Super Admin and Admin accounts can change these settings.</p>
          : <><CloudOff size={28} /><p>Couldn’t load settings.</p><button type="button" className="ms-btn ms-btn-primary" onClick={load}><RefreshCw size={16} /> Try again</button></>}</div>
      </div>
    );
  }
  const img = data.imageUrls || {};
  const tplErr = errors[`${tKey}.${tLang}`];

  return (
    <div className="ms-page">
      <Link to="/membership" className="ms-back"><ArrowLeft size={16} /> Membership Management</Link>
      <div className="ms-head">
        <div>
          <h1>Join Us page &amp; emails</h1>
          <p className="ms-sub">Content for the public <b>/membership</b> page and the automatic emails. Empty fields are hidden on the page — only enter verified, official text.</p>
        </div>
      </div>

      <div className="ms-tabs ms-tabs-big" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'page'} className={`ms-tab ${tab === 'page' ? 'active' : ''}`} onClick={() => { setTab('page'); setNotice(null); }}>Page content</button>
        <button type="button" role="tab" aria-selected={tab === 'emails'} className={`ms-tab ${tab === 'emails' ? 'active' : ''}`} onClick={() => { setTab('emails'); setNotice(null); }}>Email templates</button>
      </div>

      {notice && (
        <div className={`ms-notice ${notice.ok ? 'ms-notice-ok' : 'ms-notice-err'}`} role={notice.ok ? 'status' : 'alert'}>
          {notice.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}<span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      {tab === 'page' && (
        <>
          <section className="ms-card">
            <h2>Hero</h2>
            <div className="ms-settings-grid">
              <ImageSlot label="Leader photo" tall hint="Portrait, JPG/PNG/WebP up to 5 MB. Without a photo the party emblem is shown." url={img.leader_photo}
                busy={!!busy} onUpload={(f) => upload('leader_photo', f)} onRemove={() => removeImage('leader_photo')} />
              <div className="ms-stack">
                <Input label="Party name — Tamil" value={values.party_name_ta || ''} onChange={set('party_name_ta')} lang="ta" />
                <Input label="Party name — English" value={values.party_name_en || ''} onChange={set('party_name_en')} />
              </div>
            </div>
            <div className="ms-langbar" role="group" aria-label="Content language">
              <span>Text for:</span>
              {LANGS.map(([c, l]) => <button key={c} type="button" lang={c} className={lang === c ? 'active' : ''} aria-pressed={lang === c} onClick={() => setLang(c)}>{l}</button>)}
              <em>Tamil and Sinhala fall back to English when empty.</em>
            </div>
            <div className="ms-stack" lang={lang}>
              <div className="ms-two">
                <Input label="Leader name" value={values[L('leader_name')] || ''} onChange={set(L('leader_name'))} />
                <Input label="Leader title / position" value={values[L('leader_title')] || ''} onChange={set(L('leader_title'))} />
              </div>
              <Input label="Official slogan" hint="Shown under the party name and in email headers. Leave empty until the official wording is confirmed." value={values[L('slogan')] || ''} onChange={set(L('slogan'))} />
              <Input area rows={5} label="Leader’s welcome message" hint="Leave empty to hide. Separate paragraphs with a blank line." value={values[L('welcome')] || ''} onChange={set(L('welcome'))} />
              <Input area rows={3} label="Success screen message" hint="Shown under “Thank You for Joining Us!”. Empty = a short default explaining the review." value={values[L('success')] || ''} onChange={set(L('success'))} />
            </div>
          </section>

          <section className="ms-card">
            <h2>“Why Join Us?” images</h2>
            <p className="ms-muted">Optional. Without uploads the page uses credited Wikimedia Commons photos already on the site.</p>
            <div className="ms-why-grid">
              {WHY.map((label, i) => {
                const slot = `why_img_${i + 1}`;
                return <ImageSlot key={slot} label={`${String(i + 1).padStart(2, '0')} · ${label}`} url={img[slot]} busy={!!busy}
                  onUpload={(f) => upload(slot, f)} onRemove={() => removeImage(slot)} />;
              })}
            </div>
          </section>

          <section className="ms-card">
            <h2>Application rules &amp; links</h2>
            <div className="ms-two">
              <Input label="Membership rules link" placeholder="https://… or /page" value={values.rules_url || ''} onChange={set('rules_url')} error={FIELD_ERRORS[errors.rules_url]} hint="Adds a “Read” link next to the declaration. Empty = no link." />
              <Input label="Party constitution link" placeholder="https://… or /page" value={values.constitution_url || ''} onChange={set('constitution_url')} error={FIELD_ERRORS[errors.constitution_url]} />
              <Input label="Code of conduct link" placeholder="https://… or /page" value={values.conduct_url || ''} onChange={set('conduct_url')} error={FIELD_ERRORS[errors.conduct_url]} />
              <Input label="Minimum age" type="number" min="0" max="100" value={values.min_age || ''} onChange={set('min_age')} error={FIELD_ERRORS[errors.min_age]} hint="Applicants younger than this can’t submit. 0 = no age check." />
              <Input label="Membership ID prefix" value={values.id_prefix || ''} onChange={set('id_prefix')} error={FIELD_ERRORS[errors.id_prefix]} hint={`2–8 letters/digits. IDs look like ${(values.id_prefix || 'ITAK').toUpperCase()}-${new Date().getFullYear()}-000001.`} />
              <label className="ms-switch">
                <input type="checkbox" checked={values.require_photo === '1'} onChange={set('require_photo')} />
                <span><b>Require a photograph</b><br /><span className="ms-muted">Off = the photo field is not shown and no photo is collected.</span></span>
              </label>
            </div>
          </section>

          <section className="ms-card">
            <h2>Email details</h2>
            <div className="ms-two">
              <Input label="Public website address" placeholder="https://www.example.org" value={values.public_site_url || ''} onChange={set('public_site_url')} error={FIELD_ERRORS[errors.public_site_url]} hint="Used for the logo, website link and tracking link in emails." />
              <Input label="Contact email (shown in email footer)" type="email" value={values.contact_email || ''} onChange={set('contact_email')} error={FIELD_ERRORS[errors.contact_email]} />
              <Input label="Contact phone (shown in email footer)" value={values.contact_phone || ''} onChange={set('contact_phone')} />
            </div>
            <p className={`ms-mailstate ${data.mail?.configured ? 'ok' : 'off'}`}>
              <Mail size={16} /> {data.mail?.configured ? `Mail server: ${data.mail.host}:${data.mail.port} (${data.mail.encryption}), from ${data.mail.from}`
                : 'No mail server configured — set MAIL_HOST, MAIL_PORT, MAIL_ENCRYPTION, MAIL_USERNAME, MAIL_PASSWORD and MAIL_FROM in backend/.env. Until then emails are recorded but not delivered.'}
            </p>
          </section>

          <div className="ms-savebar">
            <button type="button" className="ms-btn ms-btn-primary" onClick={savePage} disabled={!!busy}>{busy === 'save' ? <RefreshCw size={16} className="ms-spin" /> : <Save size={16} />} Save page settings</button>
          </div>
        </>
      )}

      {tab === 'emails' && templates && (
        <div className="ms-tpl-grid">
          <section className="ms-card">
            <div className="ms-tabs" role="tablist" aria-label="Template">
              {Object.keys(TEMPLATE_LABELS).map((k) => (
                <button key={k} type="button" role="tab" aria-selected={tKey === k} className={`ms-tab ${tKey === k ? 'active' : ''}`} onClick={() => setTKey(k)}>{TEMPLATE_LABELS[k]}</button>
              ))}
            </div>
            <div className="ms-langbar" role="group" aria-label="Email language">
              <span>Language:</span>
              {LANGS.map(([c, l]) => <button key={c} type="button" lang={c} className={tLang === c ? 'active' : ''} aria-pressed={tLang === c} onClick={() => setTLang(c)}>{l}</button>)}
              <em>{cur.custom ? 'Custom template' : tLang === 'en' ? 'Using the built-in default' : 'Empty — applicants who chose this language get the English email'}</em>
            </div>
            {tplErr && <p className="ms-err-text" role="alert">{FIELD_ERRORS[tplErr] || tplErr}</p>}
            <div className="ms-stack" lang={tLang}>
              <Input label="Subject" value={cur.subject} onChange={setT('subject')} placeholder={tLang === 'en' ? def?.subject : ''} />
              <Input label="Heading" value={cur.heading} onChange={setT('heading')} placeholder={tLang === 'en' ? def?.heading : ''} />
              <Input area rows={12} label="Body (plain text; blank line = new paragraph)" value={cur.body} onChange={setT('body')} placeholder={tLang === 'en' ? def?.body : ''} />
            </div>
            <p className="ms-muted">Placeholders: {PLACEHOLDERS[tKey].map((p) => <code key={p} className="ms-ph">{p}</code>)}</p>
            <div className="ms-inline-actions">
              <button type="button" className="ms-btn ms-btn-ghost ms-btn-sm" onClick={useDefault}><RotateCcw size={14} /> Start from default (English)</button>
              <button type="button" className="ms-btn ms-btn-danger-ghost ms-btn-sm" onClick={clearT}><Trash2 size={14} /> Clear</button>
            </div>
            <div className="ms-savebar">
              <button type="button" className="ms-btn ms-btn-primary" onClick={saveTemplates} disabled={!!busy}>{busy === 'tpl' ? <RefreshCw size={16} className="ms-spin" /> : <Save size={16} />} Save all templates</button>
            </div>
          </section>
          <section className="ms-card ms-preview">
            <h2>Preview</h2>
            <p className="ms-muted">{preview?.subject ? <>Subject: <b>{preview.subject}</b></> : 'Rendering…'}</p>
            {preview?.html && <iframe title="Email preview" className="ms-email-frame" sandbox="" srcDoc={preview.html} />}
            <p className="ms-muted">Sample values in [brackets] are replaced with the applicant’s details when sent. Header uses the party names and slogan from Page content.</p>
          </section>
        </div>
      )}
    </div>
  );
}
