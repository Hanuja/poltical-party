import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import api from '../lib/api';
import { ADMIN_UI } from '../i18n/adminInterface';
import { getAnnouncementFormCopy } from '../i18n/announcementFormCopy';

const EMPTY_TR = { title: '', shortDescription: '', content: '', imageCaption: '' };

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
  const { lang: ui = 'en' } = useOutletContext() || {};
  const t = (ADMIN_UI[ui] || ADMIN_UI.en).announcementForm;
  const c = getAnnouncementFormCopy(ui);
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY_FORM);
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

  useEffect(() => {
    api.get('/announcements/?categories=1').then((r) => setCats(r.data.data || [])).catch(() => {});
    if (isEdit) {
      api.get(`/announcements/?id=${id}`).then((r) => {
        const a = r.data.data;
        setForm({
          ...EMPTY_FORM,
          categoryId: '', categorySlug: a.category?.slug || '', status: a.status === 'auto_draft' && a.category?.slug === 'public-notices' ? 'draft' : (a.status || 'auto_draft'),
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
    status: isNotice && form.status === 'auto_draft' ? 'draft' : form.status, isFeatured: form.isFeatured, isImportant: form.isImportant,
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
    catch (e) { alert(e.response?.data?.error || c.uploadError); }
  };

  const uploadVideo = async (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { alert(c.videoLimit); return; }
    try { setField('videoUrl', await uploadFile(file)); }
    catch (e) { alert(e.response?.data?.error || c.uploadError); }
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
      alert(e.response?.data?.error || c.saveError);
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
      alert(e.response?.data?.error || c.publishError);
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
      setForm((current) => ({ ...current, status }));
    } catch (e) {
      alert(e.response?.data?.error || c.saveError);
    }
  };

  const deleteNotice = async () => {
    if (!annId || !window.confirm(c.noticeDeleteConfirm)) return;
    try {
      await api.delete(`/announcements/?id=${annId}`);
      navigate('/announcements', { replace: true });
    } catch (e) {
      alert(e.response?.data?.error || c.saveError);
    }
  };

  if (loading) return <div className="dash-wrap"><p>{c.loading}</p></div>;

  return (
    <div className="dash-wrap ann-form">
      <div className="dash-head">
        <div>
          <h1>{isNotice ? (isEdit ? c.noticeEdit : c.noticeCreate) : (isEdit ? t.edit : (isOfficial ? t.createOfficial : isPress ? t.createPress : t.create))}</h1>
          <p className="dash-sub">{saving ? c.saving : annId ? `ID ${annId}` : c.newDraft}</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-col">
          <label className="fld"><span>{t.category}</span>
            <select value={effectiveCatId} onChange={(e) => { const c = cats.find(x => String(x.id) === e.target.value); setForm(f => ({ ...f, categoryId: e.target.value, categorySlug: c?.slug || '', status: c?.slug === 'public-notices' && f.status === 'auto_draft' ? 'draft' : f.status })); }}>
              <option value="">{t.selectCategory}</option>
              {cats.map(category => <option key={category.id} value={category.id}>{({ 'official-announcements': c.categoryOfficial, 'press-releases': c.categoryPress, 'public-notices': c.categoryNotices })[category.slug] || category.name || category.title || category.slug}</option>)}
            </select></label>

          {isNotice ? <>
            <div className="fld-row">
              <label className="fld"><span>{c.noticeDateLabel}</span>
                <input type="date" value={form.noticeDate} onChange={(e) => setField('noticeDate', e.target.value)} /></label>
              <label className="fld"><span>{c.noticeExpiry}</span>
                <input type="date" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)} /></label>
            </div>
            <label className="fld"><span>{c.noticeScheduled}</span>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setField('scheduledAt', e.target.value)} /></label>
          </> : isPress ? <label className="fld"><span>{c.pressMeetingDate}</span>
            <input type="date" value={form.pressMeetingDate} onChange={(e) => setField('pressMeetingDate', e.target.value)} />
          </label> : <div className="fld-row">
            <label className="fld"><span>{t.announcementDate}</span>
              <input type="date" value={form.publishedAt} onChange={(e) => setField('publishedAt', e.target.value)} /></label>
            <label className="fld"><span>{t.scheduledDate}</span>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setField('scheduledAt', e.target.value)} /></label>
          </div>}

          {isNotice ? <div className="fld"><span>{c.noticeStatus}</span><strong className={`badge-status st-${form.status}`}>{form.status === 'draft' ? t.draftOption : t[form.status] || t.draftOption}</strong></div> : <label className="fld"><span>{t.status}</span>
            <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="auto_draft">{t.auto}</option>
              <option value="draft">{t.draftOption}</option>
              <option value="scheduled">{t.scheduled}</option>
              <option value="published">{t.published}</option>
              <option value="archived">{t.archived}</option>
            </select></label>}

          <div className="checks">
            {[['isBreaking', c.breaking],['showOnHomepage', c.homepage]].map(([k,label]) => (
              <label key={k} className="check">
                <input type="checkbox" checked={form[k]} onChange={(e) => setField(k, e.target.checked)} /> {label}
              </label>
            ))}
          </div>

          {isOfficial && <>
            <label className="fld"><span>{c.announcementType}</span>
              <select value={form.announcementType} onChange={(e) => setField('announcementType', e.target.value)}>
                <option value="">{c.selectAnnouncementType}</option><option value="General">{c.general}</option><option value="Government">{c.government}</option><option value="Party">{c.party}</option>
              </select></label>
          </>}
          {isPress && <>
            <label className="fld"><span>{c.eventType}</span>
              <select value={form.eventType} onChange={(e) => setField('eventType', e.target.value)}>
                <option value="">{c.selectType}</option><option value="Press Release">{c.pressRelease}</option><option value="Press Conference">{c.pressConference}</option><option value="Media Statement">{c.mediaStatement}</option>
              </select></label>
            <label className="fld"><span>{c.spokesperson}</span>
              <input value={form.spokesperson} onChange={(e) => setField('spokesperson', e.target.value)} /></label>
            <label className="fld"><span>{c.meetingLocation}</span>
              <input value={form.meetingLocation} onChange={(e) => setField('meetingLocation', e.target.value)} /></label>
            <label className="fld"><span>{c.videoYoutube}</span>
              <input value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} placeholder={c.videoPlaceholder} /></label>
          </>}
          {!isOfficial && !isPress && !isNotice && <>
            <div className="fld-row">
              <label className="fld"><span>{c.pressMeeting}</span>
                <input type="date" value={form.pressMeetingDate} onChange={(e) => setField('pressMeetingDate', e.target.value)} /></label>
              <label className="fld"><span>{c.eventMeeting}</span>
                <input type="date" value={form.eventDate} onChange={(e) => setField('eventDate', e.target.value)} /></label>
            </div>
            <label className="fld">
              <span>{c.noticeDate}</span>
              <input type="date" value={form.noticeDate} onChange={(e) => setField('noticeDate', e.target.value)} />
            </label>
            <label className="fld">
              <span>{c.expiryDate}</span>
              <input type="date" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)} />
            </label>
            <div className="fld-row">
              <label className="fld"><span>{c.contactPerson}</span>
                <input value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} /></label>
              <label className="fld"><span>{c.contactPhone}</span>
                <input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} /></label>
            </div>
            <label className="fld"><span>{c.contactEmail}</span>
              <input type="email" value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} /></label>
          </>}

          {isNotice && <div className="fld-row">
            <label className="fld"><span>{c.noticeContact}</span>
              <input value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} /></label>
            <label className="fld"><span>{c.noticePhone}</span>
              <input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} /></label>
            <label className="fld"><span>{c.noticeEmail}</span>
              <input type="email" value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} /></label>
          </div>}

          {/* Media ? all categories */}
          <label className="fld">
            <span>{isNotice ? c.noticeCover : c.coverImage}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImage(e.target.files?.[0])} />
            {form.coverImage && (
              <div className="cover-preview">
                <img src={form.coverImage} alt="" />
                <button type="button" className="act-del" onClick={() => setField('coverImage', '')}>{isNotice ? c.noticeRemoveImage : c.remove}</button>
              </div>
            )}
          </label>

          <label className="fld">
            <span>{isNotice ? c.noticeUploadVideo : c.videoClip}</span>
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => uploadVideo(e.target.files?.[0])} />
            {form.videoUrl && !/^https?:/.test(form.videoUrl) && (
              <div className="cover-preview"><video src={form.videoUrl} controls style={{maxWidth:'100%'}} /><button type="button" className="act-del" onClick={() => setField('videoUrl', '')}>{isNotice ? c.noticeRemoveVideo : c.remove}</button></div>
            )}
          </label>
          <label className="fld">
            <span>{isNotice ? c.noticeVideo : c.videoUrl}</span>
            <input value={form.videoUrl} onChange={(e) => setField('videoUrl', e.target.value)} placeholder={c.videoUrlPlaceholder} />
          </label>

        </div>

        <div className="form-col">
          {['en', 'ta', 'si'].map((contentLang) => (
            <section className="announcement-translation" key={contentLang} lang={contentLang} aria-labelledby={`announcement-${contentLang}-heading`}>
              <h2 id={`announcement-${contentLang}-heading`}>{c[contentLang === 'en' ? 'imageLanguage' : contentLang === 'ta' ? 'tamil' : 'sinhala']}</h2>
              <label className="fld">
                <span>{isNotice ? c.noticeTitle : t.title}</span>
                <input value={form.translations[contentLang]?.title || ''} onChange={(e) => updateTr(contentLang, 'title', e.target.value)} />
              </label>
              <label className="fld">
                <span>{isNotice ? c.noticeShort : t.short}</span>
                <textarea rows="3" maxLength="500" value={form.translations[contentLang]?.shortDescription || ''} onChange={(e) => updateTr(contentLang, 'shortDescription', e.target.value)} />
              </label>
              <label className="fld">
                <span>{isNotice ? c.noticeContent : t.content}</span>
                <textarea rows="10" value={form.translations[contentLang]?.content || ''} onChange={(e) => updateTr(contentLang, 'content', e.target.value)} />
              </label>
            </section>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" disabled={!annId} onClick={() => { if (!annId) { alert(isNotice ? c.previewFirst : c.previewFirst); return; } window.open(`/announcements/${annId}/preview`, '_blank'); }}>{isNotice ? c.noticePreview : c.preview}</button>
        {!isPress && <button type="button" className="btn-secondary" onClick={() => { if (!form.scheduledAt) { alert(c.scheduleFirst); return; } saveWithStatus('scheduled'); }}>{isNotice ? c.noticeSchedule : c.schedule}</button>}
        <button type="button" className="btn-secondary" onClick={() => saveWithStatus(isNotice || isPress ? 'draft' : 'auto_draft')}>{isNotice ? c.noticeSave : c.saveDraft}</button>
        {isNotice && annId && <button type="button" className="act act-del" onClick={deleteNotice}>{c.noticeDelete}</button>}
        <button type="button" className="btn-publish" onClick={flushAndPublish} disabled={publishing}>
          {publishing ? c.saving : (isNotice ? c.noticePublish : (isEdit ? c.update : c.publish))}
        </button>
      </div>
    </div>
  );
}
