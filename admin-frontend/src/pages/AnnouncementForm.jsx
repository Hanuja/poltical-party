import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'si', label: 'සිංහල' },
];

const EMPTY_TR = { title: '', shortDescription: '', content: '', imageCaption: '' };

const LANG_LABELS = {
  en: { title: 'Announcement Title', titlePh: 'Enter the announcement title', short: 'Short Description', shortPh: 'Brief summary', content: 'Full Announcement Content', contentPh: 'Full announcement details' },
  ta: { title: 'அறிவிப்பு தலைப்பு', titlePh: 'தமிழில் அறிவிப்பின் தலைப்பை உள்ளிடவும்', short: 'சுருக்கமான விளக்கம்', shortPh: 'தமிழில் சுருக்கமான விளக்கத்தை உள்ளிடவும்', content: 'முழுமையான அறிவிப்பு உள்ளடக்கம்', contentPh: 'முழுமையான அறிவிப்பு விபரங்களை உள்ளிடவும்' },
  si: { title: 'නිවේදන මාතෘකාව', titlePh: 'සිංහලෙන් මාතෘකාව ඇතුළත් කරන්න', short: 'කෙටි විස්තරය', shortPh: 'කෙටි සාරාංශයක්', content: 'සම්පූර්ණ නිවේදන අන්තර්ගතය', contentPh: 'සම්පූර්ණ විස්තර ඇතුළත් කරන්න' },
};

const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'];

const EMPTY_FORM = {
  categoryId: '', categorySlug: '', status: 'auto_draft', isFeatured: false, isImportant: false,
  isBreaking: false, breakingPriority: 0, announcementType: '', eventType: '',
  spokesperson: '', meetingLocation: '', noticeCategory: '', district: '',
  dsDivision: '', gnDivision: '', contactPerson: '', contactPhone: '', contactEmail: '',
  coverImage: '', videoUrl: '', pdfPath: '', publishedAt: '', scheduledAt: '',
  pressMeetingDate: '', noticeDate: '', eventDate: '', expiresAt: '',
  showOnHomepage: false,
  allowSocialSharing: true,
  translations: { ta: { ...EMPTY_TR }, en: { ...EMPTY_TR }, si: { ...EMPTY_TR } },
};

export default function AnnouncementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeLang, setActiveLang] = useState('en');
  const [annId, setAnnId] = useState(id ? Number(id) : null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const timer = useRef(null);

  const catSlug = form.categorySlug || cats.find(c => String(c.id) === String(form.categoryId))?.slug || '';
  const effectiveCatId = form.categoryId || (cats.find(c => c.slug === catSlug)?.id ?? '');
  const isPress = catSlug === 'press-releases';
  const isNotice = catSlug === 'public-notices';
  const isOfficial = catSlug === 'official-announcements';
  const tr = form.translations[activeLang] || EMPTY_TR;

  useEffect(() => {
    api.get('/announcements/?categories=1').then((r) => setCats(r.data.data || [])).catch(() => {});
    if (isEdit) {
      api.get(`/announcements/?id=${id}`).then((r) => {
        const a = r.data.data;
        setForm({
          ...EMPTY_FORM,
          categoryId: '', categorySlug: a.category?.slug || '', status: a.status || 'auto_draft',
          isFeatured: !!a.isFeatured, isImportant: !!a.isImportant, isBreaking: !!a.isBreaking,
          breakingPriority: a.breakingPriority || 0, announcementType: a.announcementType || '',
          eventType: a.eventType || '', spokesperson: a.spokesperson || '',
          meetingLocation: a.meetingLocation || '', noticeCategory: a.noticeCategory || '',
          district: a.district || '', dsDivision: a.dsDivision || '', gnDivision: a.gnDivision || '',
          contactPerson: a.contactPerson || '', contactPhone: a.contactPhone || '', contactEmail: a.contactEmail || '',
          coverImage: a.coverImage || '', videoUrl: a.videoUrl || '',
          pdfPath: a.pdfPath || '', publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : '',
          scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : '',
          pressMeetingDate: a.pressMeetingDate ? a.pressMeetingDate.slice(0, 10) : '',
          noticeDate: a.noticeDate ? a.noticeDate.slice(0, 10) : '',
          eventDate: a.eventDate ? a.eventDate.slice(0, 10) : '',
          expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '',
          referenceNumber: a.referenceNumber || '', announcementCode: a.announcementCode || '',
          showOnHomepage: !!a.showOnHomepage, allowSocialSharing: a.allowSocialSharing !== false,
          translations: {
            ta: { ...(a.translations?.ta || EMPTY_TR) },
            en: { ...(a.translations?.en || EMPTY_TR) },
            si: { ...(a.translations?.si || EMPTY_TR) },
          },
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const payload = useCallback(() => ({
    categoryId: effectiveCatId ? Number(effectiveCatId) : null,
    status: form.status, isFeatured: form.isFeatured, isImportant: form.isImportant,
    isBreaking: form.isBreaking, breakingPriority: form.breakingPriority,
    announcementType: form.announcementType || null, eventType: form.eventType || null,
    spokesperson: form.spokesperson || null, meetingLocation: form.meetingLocation || null,
    noticeCategory: form.noticeCategory || null, district: form.district || null,
    dsDivision: form.dsDivision || null, gnDivision: form.gnDivision || null,
    contactPerson: form.contactPerson || null, contactPhone: form.contactPhone || null,
    contactEmail: form.contactEmail || null,
    coverImage: form.coverImage || null, videoUrl: form.videoUrl || null,
    pdfPath: form.pdfPath || null,
    publishedAt: form.publishedAt || null, scheduledAt: form.scheduledAt || null,
    pressMeetingDate: form.pressMeetingDate || null, noticeDate: form.noticeDate || null,
    eventDate: form.eventDate || null, expiresAt: form.expiresAt || null,
    referenceNumber: form.referenceNumber || null, announcementCode: form.announcementCode || null,
    showOnHomepage: form.showOnHomepage, allowSocialSharing: form.allowSocialSharing,
    translations: form.translations,
  }), [form, effectiveCatId, catSlug]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateTr = (lang, field, value) =>
    setForm((f) => ({ ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], [field]: value } } }));

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/announcements/?action=upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.path;
  };

  const uploadImage = async (file) => {
    if (!file) return;
    try { setField('coverImage', await uploadFile(file)); }
    catch (e) { alert(e.response?.data?.error || 'Upload failed'); }
  };

  const uploadVideo = async (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { alert('Video must be under 100MB'); return; }
    try { setField('videoUrl', await uploadFile(file)); }
    catch (e) { alert(e.response?.data?.error || 'Upload failed'); }
  };

  const save = async () => {
    clearTimeout(timer.current);
    setSaving(true);
    try {
      if (annId) {
        const res = await api.put(`/announcements/?id=${annId}`, payload());
        if (res.data?.data?.id) setAnnId(res.data.data.id);
      } else {
        const res = await api.post('/announcements/', payload());
        if (res.data?.data?.id) {
          setAnnId(res.data.data.id);
          window.history.replaceState(null, '', `/announcements/${res.data.data.id}/edit`);
        }
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const hasContent = form.translations.en.title || form.translations.ta.title || form.translations.si.title
      || form.coverImage || form.videoUrl;
    if (!hasContent) return;
    timer.current = setTimeout(save, 1500);
    return () => clearTimeout(timer.current);
  }, [form]); // eslint-disable-line

  const flushAndPublish = async () => {
    setPublishing(true);
    try {
      clearTimeout(timer.current);
      if (annId) await api.put(`/announcements/?id=${annId}`, payload());
      else {
        const res = await api.post('/announcements/', payload());
        const newId = res.data?.data?.id;
        if (!newId) throw new Error('Save failed');
        await api.post(`/announcements/?action=publish&id=${newId}`);
        navigate('/announcements', { replace: true });
        return;
      }
      await api.post(`/announcements/?action=publish&id=${annId}`);
      navigate('/announcements', { replace: true });
    } catch (e) {
      alert(e.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const saveWithStatus = async (status) => {
    clearTimeout(timer.current);
    try {
      if (status === 'scheduled' && !form.scheduledAt) { alert('Set a scheduled date/time first'); return; }
      if (annId) await api.put(`/announcements/?id=${annId}`, { ...payload(), status });
      else {
        const res = await api.post('/announcements/', { ...payload(), status });
        if (res.data?.data?.id) {
          setAnnId(res.data.data.id);
          window.history.replaceState(null, '', `/announcements/${res.data.data.id}/edit`);
        }
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    }
  };

  if (loading) return <div className="dash-wrap"><p>Loading…</p></div>;

  return (
    <div className="dash-wrap ann-form">
      <div className="dash-head">
        <div>
          <h1>{isEdit ? 'Edit Announcement' : (isOfficial ? 'Create Official Announcement' : isPress ? 'Create Press Release' : isNotice ? 'Create Public Notice' : 'Create Announcement')}</h1>
          <p className="dash-sub">{saving ? 'Saving…' : annId ? `ID ${annId}` : 'New draft'}</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-col">
          <label className="fld"><span>Category</span>
            <select value={effectiveCatId} onChange={(e) => { const c = cats.find(x => String(x.id) === e.target.value); setForm(f => ({ ...f, categoryId: e.target.value, categorySlug: c?.slug || '' })); }}>
              <option value="">Select Category</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name || c.title || c.slug}</option>)}
            </select></label>

          <div className="fld-row">
            <label className="fld"><span>Announcement Date</span>
              <input type="date" value={form.publishedAt} onChange={(e) => setField('publishedAt', e.target.value)} /></label>
            <label className="fld"><span>Scheduled Date &amp; Time</span>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setField('scheduledAt', e.target.value)} /></label>
          </div>

          <label className="fld"><span>Status</span>
            <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="auto_draft">Auto</option>
              <option value="auto_draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select></label>

          <div className="checks">
            {[['isBreaking','Breaking Announcement'],['showOnHomepage','Show on Homepage']].map(([k,label]) => (
              <label key={k} className="check">
                <input type="checkbox" checked={form[k]} onChange={(e) => setField(k, e.target.checked)} /> {label}
              </label>
            ))}
          </div>

          {isOfficial && <>
            <label className="fld"><span>Announcement Type</span>
              <select value={form.announcementType} onChange={(e) => setField('announcementType', e.target.value)}>
                <option value="">Select Type</option><option>General</option><option>Government</option><option>Party</option>
              </select></label>
          </>}
          {isPress && <>
            <label className="fld"><span>Media Event Type</span>
              <select value={form.eventType} onChange={(e) => setField('eventType', e.target.value)}>
                <option value="">—</option><option>Press Release</option><option>Press Conference</option><option>Media Statement</option>
              </select></label>
            <label className="fld"><span>Spokesperson</span>
              <input value={form.spokesperson} onChange={(e) => setField('spokesperson', e.target.value)} /></label>
            <label className="fld"><span>Meeting Location</span>
              <input value={form.meetingLocation} onChange={(e) => setField('meetingLocation', e.target.value)} /></label>
            <label className="fld"><span>Video URL / YouTube</span>
              <input value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} placeholder="https://…" /></label>
          </>}
          {isNotice && <>
            <label className="fld"><span>Notice Category</span>
              <select value={form.noticeCategory} onChange={(e) => setField('noticeCategory', e.target.value)}>
                <option value="">—</option><option>General Notice</option><option>Public Meeting</option><option>Public Service</option><option>Important Notice</option><option>Other</option>
              </select></label>
            <label className="fld"><span>District</span>
              <select value={form.district} onChange={(e) => setField('district', e.target.value)}>
                <option value="">—</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select></label>
            <div className="fld-row">
              <label className="fld"><span>DS Division</span>
                <input value={form.dsDivision} onChange={(e) => setField('dsDivision', e.target.value)} /></label>
              <label className="fld"><span>GN Division</span>
                <input value={form.gnDivision} onChange={(e) => setField('gnDivision', e.target.value)} /></label>
            </div>
          </>}

          {!isOfficial && <>
            <div className="fld-row">
              <label className="fld"><span>Press Meeting Date</span>
                <input type="date" value={form.pressMeetingDate} onChange={(e) => setField('pressMeetingDate', e.target.value)} /></label>
              <label className="fld"><span>Event / Meeting Date</span>
                <input type="date" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} /></label>
            </div>
            <label className="fld">
              <span>Notice Date</span>
              <input type="date" value={form.noticeDate} onChange={(e) => setField('noticeDate', e.target.value)} />
            </label>
            <label className="fld">
              <span>Expiry Date</span>
              <input type="date" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)} />
            </label>
            <div className="fld-row">
              <label className="fld"><span>Contact Person</span>
                <input value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} /></label>
              <label className="fld"><span>Contact Phone</span>
                <input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} /></label>
            </div>
            <label className="fld"><span>Contact Email</span>
              <input type="email" value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} /></label>
          </>}

          {/* Media — all categories */}
          <label className="fld">
            <span>Cover Image</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImage(e.target.files?.[0])} />
            {form.coverImage && (
              <div className="cover-preview">
                <img src={form.coverImage} alt="" />
                <button type="button" className="act-del" onClick={() => setField('coverImage', '')}>Remove</button>
              </div>
            )}
          </label>

          <label className="fld">
            <span>Video Clip (MP4 / WEBM / MOV, max 100MB)</span>
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => uploadVideo(e.target.files?.[0])} />
            {form.videoUrl && !/^https?:/.test(form.videoUrl) && (
              <div className="cover-preview"><video src={form.videoUrl} controls style={{maxWidth:'100%'}} /><button type="button" className="act-del" onClick={() => setField('videoUrl', '')}>Remove</button></div>
            )}
          </label>
          <label className="fld">
            <span>YouTube / Video URL</span>
            <input value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=… or uploaded path" />
          </label>

          {!isOfficial && <>
            <label className="fld"><span>PDF Document Path</span>
              <input value={form.pdfPath} onChange={(e) => setField('pdfPath', e.target.value)} placeholder="/uploads/… (use upload below)" /></label>
          </>}
        </div>

        <div className="form-col">
          <div className="lang-tabs">
            {LANGS.map(l => (
              <button key={l.code} type="button" className={activeLang === l.code ? 'active' : ''} onClick={() => setActiveLang(l.code)}>{l.label}</button>
            ))}
          </div>
          <label className="fld">
            <span>{LANG_LABELS[activeLang].title}</span>
            <input value={tr.title} onChange={(e) => updateTr(activeLang, 'title', e.target.value)} placeholder={LANG_LABELS[activeLang].titlePh} />
          </label>
          <label className="fld">
            <span>{LANG_LABELS[activeLang].short}</span>
            <textarea rows="3" maxLength="500" placeholder={LANG_LABELS[activeLang].shortPh} value={tr.shortDescription} onChange={(e) => updateTr(activeLang, 'shortDescription', e.target.value)} />
          </label>
          <label className="fld">
            <span>{LANG_LABELS[activeLang].content}</span>
            <textarea rows="10" value={tr.content} onChange={(e) => updateTr(activeLang, 'content', e.target.value)} placeholder={LANG_LABELS[activeLang].contentPh} />
          </label>
          <label className="fld">
            <span>Image Caption (optional)</span>
            <input value={tr.imageCaption} onChange={(e) => updateTr(activeLang, 'imageCaption', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" disabled={!annId} onClick={() => { if (!annId) { alert('Save the announcement first, then preview.'); return; } window.open(`/announcements/${annId}/preview`, '_blank'); }}>Preview</button>
        <button type="button" className="btn-secondary" onClick={() => { if (!form.scheduledAt) { alert('Set a scheduled date/time first'); return; } saveWithStatus('scheduled'); }}>Schedule</button>
        <button type="button" className="btn-secondary" onClick={() => saveWithStatus('auto_draft')}>Save as Draft</button>
        <button type="button" className="btn-publish" onClick={flushAndPublish} disabled={publishing}>
          {publishing ? 'Saving…' : (isEdit ? 'Update Announcement' : 'Publish')}
        </button>
      </div>
    </div>
  );
}
