import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import api from '../lib/api';
import { ADMIN_UI } from '../i18n/adminInterface';
import { getEventFormCopy } from '../i18n/eventFormCopy';
import { Info, Image as ImageIcon, CalendarClock, MapPin, Link2, Settings, Video, User } from 'lucide-react';

const EMPTY_TR = { en: { title: '', slug: '', shortDescription: '', description: '' }, ta: { title: '', slug: '', shortDescription: '', description: '' }, si: { title: '', slug: '', shortDescription: '', description: '' } };
const EMPTY = {
  categoryId: '', image: '', eventDate: '', startTime: '', endTime: '', venue: '', address: '', city: '', contactPerson: '', contactPhone: '',
  mapUrl: '', streamUrl: '', externalUrl: '', registrationUrl: '', gallery: [],
  isFeatured: false, showOnHomepage: true, registrationOpen: true, registrationLimit: '', registrationOpensAt: '', registrationClosesAt: '', registrationOpenMode: 'auto', displayOrder: 0,
  streamPlatform: '', enableLiveStreaming: true, showLiveBadge: true, showViewerCount: false, contactEmail: '',
  eventStatus: 'upcoming', status: 'draft',
  // Completed event fields
  eventHighlights: '', eventSummary: '', eventAchievements: '', eventVideoUrl: '',
  // Cancelled event fields
  cancellationDate: '', cancellationReason: '', cancellationDetails: '', cancellationAnnouncement: '', cancellationImage: '', isRescheduled: false, rescheduledEventDate: '', refundInformation: '', organizerName: '', showCancellationOnHomepage: false, sendCancellationNotification: false,
  translations: JSON.parse(JSON.stringify(EMPTY_TR)),
};
// Must match the backend upload rules in backend/api/events/index.php
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const IMG_MAX = 8 * 1024 * 1024;
const slugify = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const ytVideoId = (url = '') => {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    let id = '';
    if (['youtu.be', 'www.youtu.be'].includes(host)) id = u.pathname.split('/').filter(Boolean)[0] || '';
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|live|shorts)\/([\w-]+)/)?.[1] || '';
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
  } catch { return ''; }
};
const streamEmbedUrl = (platform, url = '') => {
  if (!url) return '';
  if (platform === 'youtube') { const id = ytVideoId(url); return id ? `https://www.youtube.com/embed/${id}` : ''; }
  if (platform === 'facebook') return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  return url;
};
const validStreamUrl = (platform, value = '') => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (platform === 'youtube') return !!ytVideoId(value);
    if (platform === 'facebook') return ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch', 'www.fb.watch'].includes(host);
    return platform === 'external' && !!host;
  } catch { return false; }
};
const dateTimeLocalValue = (value) => String(value || '').slice(0, 16).replace(' ', 'T');

function Section({ icon: Icon, title, children }) {
  return (
    <section className="ev-section">
      <h3 className="ev-section-title"><Icon size={18} /> {title}</h3>
      <div className="ev-section-body">{children}</div>
    </section>
  );
}

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang: ui = 'en' } = useOutletContext() || {};
  const t = (ADMIN_UI[ui] || ADMIN_UI.en).eventForm;
  const c = getEventFormCopy(ui);
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const savedIdRef = useRef(isEdit ? Number(id) : null);
  const saveInFlight = useRef(false);
  const editVersion = useRef(0);
  const [autoSaveState, setAutoSaveState] = useState('');
  const [autoSaveTick, setAutoSaveTick] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/events/?id=${id}`).then((r) => {
      const e = r.data.data;
      const translations = e.translations && Object.keys(e.translations).length
        ? Object.fromEntries(['en', 'ta', 'si'].map((language) => [language, { ...EMPTY_TR[language], ...(e.translations[language] || {}) }]))
        : {
          en: { title: e.title || '', slug: e.slug || '', shortDescription: e.shortDescription || '', description: e.description || '' },
          ta: { ...EMPTY_TR.ta }, si: { ...EMPTY_TR.si },
        };
      originalImage.current = e.image || '';
      setForm({
        ...EMPTY,
        categoryId: e.categoryId || '', image: e.image || '', eventDate: (e.eventDate || e.date || '').slice(0, 10),
        startTime: e.startTime || '', endTime: e.endTime || '', venue: e.venue || '', address: e.address || '',
        city: e.city || '', contactPerson: e.contactPerson || '', contactPhone: e.contactPhone || '', contactEmail: e.contactEmail || '', mapUrl: e.mapUrl || '', streamUrl: e.streamUrl || '', streamPlatform: e.streamPlatform || '', enableLiveStreaming: e.enableLiveStreaming !== false, showLiveBadge: e.showLiveBadge !== false, showViewerCount: !!e.showViewerCount, externalUrl: e.externalUrl || '',
        registrationUrl: e.registrationUrl || '', gallery: Array.isArray(e.gallery) ? e.gallery : [],
        isFeatured: !!e.isFeatured, showOnHomepage: e.showOnHomepage !== false, registrationOpen: e.registrationOpen !== false,
        registrationLimit: e.registrationLimit ?? '', registrationOpensAt: dateTimeLocalValue(e.registrationOpensAt), registrationClosesAt: dateTimeLocalValue(e.registrationClosesAt), registrationOpenMode: e.registrationOpenMode || 'auto', displayOrder: e.displayOrder || 0,
        eventStatus: e.eventStatus || e.status || 'upcoming', status: e.publishStatus || 'draft',
        // Completed event fields
        eventHighlights: e.eventHighlights || '', eventSummary: e.eventSummary || '', eventAchievements: e.eventAchievements || '', eventVideoUrl: e.eventVideoUrl || '',
        // Cancelled event fields
        cancellationDate: e.cancellationDate || '', cancellationReason: e.cancellationReason || '', cancellationDetails: e.cancellationDetails || '', cancellationAnnouncement: e.cancellationAnnouncement || '', cancellationImage: e.cancellationImage || '', isRescheduled: !!e.isRescheduled, rescheduledEventDate: e.rescheduledEventDate || '', refundInformation: e.refundInformation || '', organizerName: e.organizerName || '', showCancellationOnHomepage: e.showCancellationOnHomepage !== false, sendCancellationNotification: !!e.sendCancellationNotification,
        translations,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, isEdit]);

  // Run the state update immediately (the old curried version returned a function that was never called,
  // so typed values and the uploaded cover image were silently dropped).
  const mark = (fn) => { editVersion.current += 1; setDirty(true); fn(); };
  const set = (k, v) => mark(() => setForm(f => ({ ...f, [k]: v })));
  const setTr = (contentLang, field, value) => mark(() => setForm(x => ({ ...x, translations: { ...x.translations, [contentLang]: { ...x.translations[contentLang], [field]: value } } })));

  // Cover image: instant local preview while uploading; the saved image is only replaced once the upload succeeds.
  const [coverPreview, setCoverPreview] = useState('');
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverErr, setCoverErr] = useState('');
  const [coverBroken, setCoverBroken] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [cancellationImageBusy, setCancellationImageBusy] = useState(false);
  const originalImage = useRef('');
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);
  useEffect(() => { setCoverBroken(false); }, [form.image]);

  const checkFile = (file) => {
    if (!file) return c.invalidImage;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!IMG_EXT.includes(ext) || (file.type && !IMG_MIME.includes(file.type)) || file.size > IMG_MAX) return c.invalidImage;
    return '';
  };

  const sendFile = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await api.post('/events/?action=upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const d = res.data?.data;
    const url = d?.url || d?.path;
    if (!res.data?.success || !url) throw new Error(res.data?.error || 'Upload failed');
    return url;
  };

  const uploadCover = async (file) => {
    const err = checkFile(file);
    if (err) { setCoverErr(err); return; }
    setCoverErr('');
    setCoverPreview(URL.createObjectURL(file));
    setCoverBusy(true);
    try {
      const url = await sendFile(file);
      set('image', url);
    } catch (e) {
      setCoverErr(e.response?.data?.error || e.message || c.invalidImage);
    } finally {
      setCoverBusy(false);
      setCoverPreview('');
    }
  };

  const uploadGallery = async (file) => {
    const err = checkFile(file);
    if (err) { alert(err); return; }
    setGalleryBusy(true);
    try {
      const url = await sendFile(file);
      mark(() => setForm(f => ({ ...f, gallery: [...f.gallery, url] })));
    } catch (e) {
      alert(e.response?.data?.error || e.message || c.invalidImage);
    } finally { setGalleryBusy(false); }
  };

  const isLive = form.eventStatus === 'live';
  const isUpcoming = form.eventStatus === 'upcoming';
  const isCompleted = form.eventStatus === 'completed';
  const isCancelled = form.eventStatus === 'cancelled';
  const hasSavedRecord = isEdit || !!savedIdRef.current;
  const shownCover = coverPreview || form.image;
  const activeTranslation = form.translations[ui] || EMPTY_TR[ui] || EMPTY_TR.en;
  const youtubeId = form.streamPlatform === 'youtube' ? ytVideoId(form.streamUrl) : '';
  const liveEmbed = streamEmbedUrl(form.streamPlatform, form.streamUrl);

  const validate = (publish = false) => {
    if (isCancelled ? !activeTranslation.title?.trim() : !Object.values(form.translations).some((translation) => translation.title?.trim())) { alert(c.requiredTitle); return false; }
    if (!form.eventDate) { alert(isCancelled ? c.originalEventDateRequired : c.requiredDate); return false; }
    if (isCancelled && (!form.cancellationDate || !form.cancellationReason || !form.cancellationAnnouncement.trim())) { alert(c.requiredCancellationInfo); return false; }
    if (isCancelled && form.isRescheduled && !form.rescheduledEventDate) { alert(c.newEventDateRequired); return false; }
    // Skip time validation for completed events (they don't have start/end time)
    if (!isCompleted && form.startTime && form.endTime && form.endTime <= form.startTime) { alert(c.badTime); return false; }
    if (form.registrationOpenMode === 'manual') {
      if (!form.registrationOpensAt || !form.registrationClosesAt) { alert(c.manualDatesRequired); return false; }
      if (form.registrationClosesAt <= form.registrationOpensAt) { alert(c.badRegistrationWindow); return false; }
    }
    if (form.registrationLimit !== '' && (!Number.isInteger(Number(form.registrationLimit)) || Number(form.registrationLimit) < 1)) { alert(c.limitHint); return false; }
    if (isLive && form.streamUrl && !validStreamUrl(form.streamPlatform, form.streamUrl)) { alert(c.invalidStreamUrl); return false; }
    if (isLive && publish && form.enableLiveStreaming && (!form.streamUrl || !liveEmbed || !validStreamUrl(form.streamPlatform, form.streamUrl))) { alert(c.streamUrlRequired); return false; }
    if (isLive && publish && form.enableLiveStreaming && (!form.startTime || !form.endTime)) { alert(c.liveTimeRequired); return false; }
    return true;
  };

  const buildPayload = (publish) => ({
    ...form,
    status: publish === undefined ? form.status : (publish ? 'published' : 'draft'),
    registrationLimit: form.registrationLimit === '' ? null : Number(form.registrationLimit),
    displayOrder: Number(form.displayOrder) || 0,
  });

  // Live records save through the existing event API. New records are always Draft;
  // existing records retain their current publication status while their edits autosave.
  useEffect(() => {
    if (!isLive || loading || !dirty || !form.eventDate || coverBusy || galleryBusy) return;
    const hasTitle = Object.values(form.translations).some((translation) => translation.title?.trim());
    if (!hasTitle) return;
    const timer = setTimeout(async () => {
      if (saveInFlight.current) return;
      saveInFlight.current = true;
      const version = editVersion.current;
      const payload = { ...buildPayload(), status: savedIdRef.current ? form.status : 'draft' };
      setAutoSaveState('saving');
      try {
        if (savedIdRef.current) {
          await api.put(`/events/?id=${savedIdRef.current}`, payload);
        } else {
          const response = await api.post('/events/', payload);
          const newId = Number(response.data?.data?.id);
          if (!newId) throw new Error('Event save did not return an ID');
          savedIdRef.current = newId;
          window.history.replaceState(null, '', `/events/${newId}/edit`);
        }
        if (editVersion.current === version) {
          setDirty(false);
          setAutoSaveState('saved');
        }
      } catch {
        setAutoSaveState('error');
      } finally {
        saveInFlight.current = false;
        if (editVersion.current !== version) setAutoSaveTick((tick) => tick + 1);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [isLive, loading, dirty, form, coverBusy, galleryBusy, autoSaveTick]); // eslint-disable-line

  const save = async (publish) => {
    if (coverBusy || galleryBusy || cancellationImageBusy) { alert(c.uploadWait); return; }
    if (!validate(publish)) return;
    try {
      if (savedIdRef.current) await api.put(`/events/?id=${savedIdRef.current}`, buildPayload(publish));
      else await api.post('/events/', buildPayload(publish));
      setDirty(false);
      navigate('/events');
    } catch { alert(t.saveError); }
  };

  const deleteEvent = async () => {
    if (!hasSavedRecord || !window.confirm(c.deleteConfirm)) return;
    setDeleting(true);
    try {
      await api.delete(`/events/?id=${savedIdRef.current || id}`);
      navigate('/events', { replace: true });
    } catch (e) {
      const active = e.response?.data?.data?.activeRegistrations;
      alert(active ? c.deleteHasRegistrations : e.response?.data?.error || t.saveError);
    } finally { setDeleting(false); }
  };

  const cancel = () => {
    if (dirty && !window.confirm(t.discard)) return;
    navigate('/events');
  };

  if (loading) return <div className="dash-wrap"><p>{c.loading}</p></div>;

  return (
    <div className="dash-wrap ann-form">
      <div className="dash-head"><div>
        <h1>{isCancelled ? (isEdit ? c.editCancelled : c.cancelledEventForm) : isEdit ? t.edit : t.create}</h1>
        <p className="dash-sub">{hasSavedRecord ? `ID ${savedIdRef.current || id}` : t.create}{isLive && autoSaveState ? ` · ${autoSaveState === 'saving' ? c.draftSaving : autoSaveState === 'saved' ? c.draftSaved : c.draftError}` : ''}</p>
      </div></div>

      <Section icon={Info} title={t.basic}>
        <div className="fld-row">
          <label className="fld"><span>{t.title} *</span>
            <input value={activeTranslation.title} onChange={e=>{ const title=e.target.value; mark(()=>setForm(x=>({ ...x, translations:{...x.translations,[ui]:{...x.translations[ui],title,...(!activeTranslation.slug && slugify(title) ? {slug:slugify(title)} : {})}} }))); }} /></label>
          <label className="fld"><span>{t.slug}</span>
            <input value={activeTranslation.slug} onChange={e=>setTr(ui, 'slug',e.target.value)} /></label>
        </div>
        <label className="fld"><span>{t.short}</span>
          <textarea rows="2" maxLength="500" value={activeTranslation.shortDescription || ''} onChange={e=>setTr(ui, 'shortDescription',e.target.value)} placeholder={t.shortPlaceholder} /></label>
        <label className="fld"><span>{t.description}</span>
          <textarea rows="8" value={activeTranslation.description} onChange={e=>setTr(ui, 'description',e.target.value)} /></label>
      </Section>

      <Section icon={ImageIcon} title={t.media}>
        <div className="fld"><span>{t.cover}</span>
          <div className="cover-field">
            <div className={`cover-frame${shownCover && !coverBroken ? '' : ' is-empty'}`}>
              {shownCover && !coverBroken
                ? <img key={shownCover} src={shownCover} alt={t.coverPreview} onError={() => setCoverBroken(true)} />
                : <div className="cover-empty"><ImageIcon size={28} /><small>{coverBroken ? t.imageError : t.noCover}</small></div>}
              {coverBusy && <div className="cover-busy">{c.uploading}</div>}
            </div>
            <div className="cover-actions">
              <label className="btn-secondary" style={{ cursor: coverBusy ? 'wait' : 'pointer' }}>
                {form.image ? t.replaceImage : t.uploadImage}
                <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden disabled={coverBusy}
                  onChange={e => { uploadCover(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {form.image && !coverBusy && <button type="button" className="act-del" onClick={() => set('image', '')}>{t.removeImage}</button>}
              {isEdit && originalImage.current && form.image !== originalImage.current && !coverBusy &&
                <button type="button" className="btn-secondary" onClick={() => set('image', originalImage.current)}>{t.restoreImage}</button>}
              <small className="cover-hint">{c.fileHint}</small>
              {coverErr && <small className="cover-err">{coverErr}</small>}
            </div>
          </div>
        </div>
        <div className="fld"><span>{t.gallery}</span>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {form.gallery.map((g,i)=>(
              <div key={i} style={{position:'relative',width:100}}>
                <img src={g} style={{width:'100%',height:64,objectFit:'cover',borderRadius:8}} alt="" />
                <button type="button" className="act-del" aria-label={c.removeImage} style={{position:'absolute',top:2,right:2}} onClick={()=>set('gallery', form.gallery.filter((_,x)=>x!==i))}>×</button>
              </div>
            ))}
          </div>
          <label className="btn-secondary" style={{cursor:galleryBusy?'wait':'pointer',display:'inline-block',marginTop:8}}>{galleryBusy ? c.uploading : `+ ${t.addImage}`}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={galleryBusy} onChange={e=>{uploadGallery(e.target.files?.[0]);e.target.value='';}} /></label>
        </div>
      </Section>

      <Section icon={CalendarClock} title={t.schedule}>
        <div className="fld-row">
          <label className="fld"><span>{isCancelled ? c.originalEventDate : t.date} *</span><input type="date" required value={form.eventDate} onChange={e=>set('eventDate',e.target.value)} /></label>
          {!isCompleted && <>
            <label className="fld"><span>{isLive ? c.liveStartTime : t.startTime}</span><input type="time" value={form.startTime} onChange={e=>set('startTime',e.target.value)} /></label>
            <label className="fld"><span>{isLive ? c.expectedEnd : t.endTime}</span><input type="time" value={form.endTime} onChange={e=>set('endTime',e.target.value)} /></label>
          </>}
        </div>
      </Section>

      <Section icon={MapPin} title={t.location}>
        {!isUpcoming && <>
          <div className="fld-row">
            <label className="fld"><span>{t.venue}</span><input value={form.venue} onChange={e=>set('venue',e.target.value)} /></label>
            <label className="fld"><span>{t.city}</span><input value={form.city} onChange={e=>set('city',e.target.value)} /></label>
          </div>
          <label className="fld"><span>{t.address}</span><textarea rows="2" value={form.address} onChange={e=>set('address',e.target.value)} /></label>
        </>}
        {!isCancelled && <div className="fld-row">
          <label className="fld"><span>{c.contactPerson}</span><input value={form.contactPerson || ''} onChange={e=>set('contactPerson',e.target.value)} /></label>
          <label className="fld"><span>{c.contactPhone}</span><input type="tel" value={form.contactPhone || ''} onChange={e=>set('contactPhone',e.target.value)} /></label>
          {(isLive || isCompleted) && <label className="fld"><span>{c.contactEmail}</span><input type="email" value={form.contactEmail || ''} onChange={e=>set('contactEmail',e.target.value)} /></label>}
        </div>}
        {!isUpcoming && <label className="fld"><span>{t.mapUrl}</span><input value={form.mapUrl} onChange={e=>set('mapUrl',e.target.value)} placeholder={c.mapPlaceholder} /></label>}
      </Section>

      {isLive && <Section icon={Video} title={c.streamingDetails}>
        <div className="fld-row">
          <label className="fld"><span>{c.platform}</span><select value={form.streamPlatform} onChange={e=>set('streamPlatform',e.target.value)}><option value="">—</option><option value="youtube">{c.youtube}</option><option value="facebook">{c.facebook}</option><option value="external">{c.externalPlatform}</option></select></label>
          <label className="fld"><span>{c.streamUrl}</span><input type="url" value={form.streamUrl} onChange={e=>set('streamUrl',e.target.value)} placeholder={c.urlPlaceholder} /></label>
        </div>
        {form.streamPlatform === 'youtube' && form.streamUrl && <div className="fld-row"><label className="fld"><span>{c.videoId}</span><input value={ytVideoId(form.streamUrl)} readOnly /></label><label className="fld"><span>{c.embedUrl}</span><input value={streamEmbedUrl(form.streamPlatform, form.streamUrl)} readOnly /></label></div>}
        <div className="checks">
          <label className="check"><input type="checkbox" checked={form.enableLiveStreaming} onChange={e=>set('enableLiveStreaming',e.target.checked)} /> {c.enableStreaming}</label>
          <label className="check"><input type="checkbox" checked={form.showLiveBadge} onChange={e=>set('showLiveBadge',e.target.checked)} /> {c.showLiveBadge}</label>
          <label className="check"><input type="checkbox" checked={form.showViewerCount} onChange={e=>set('showViewerCount',e.target.checked)} /> {c.showViewerCount}</label>
        </div><small>{c.viewerCountHint}</small>
      </Section>}

      <Section icon={Link2} title={t.links}>
        {!isLive && <label className="fld"><span>{t.streamUrl}</span><input value={form.streamUrl} onChange={e=>set('streamUrl',e.target.value)} placeholder={c.urlPlaceholder} /></label>}
        <div className="fld-row">
          <label className="fld"><span>{t.externalUrl}</span><input value={form.externalUrl} onChange={e=>set('externalUrl',e.target.value)} placeholder={c.urlPlaceholder} /></label>
          <label className="fld"><span>{t.registrationUrl}</span><input value={form.registrationUrl} onChange={e=>set('registrationUrl',e.target.value)} placeholder={c.urlPlaceholder} /></label>
        </div>
      </Section>

      {isCompleted && (
        <Section icon={Video} title={c.resultsHighlights}>
          <label className="fld"><span>{c.highlights}</span><textarea rows="4" value={form.eventHighlights} onChange={e=>set('eventHighlights',e.target.value)} placeholder={c.highlightsPlaceholder} /></label>
          <label className="fld"><span>{c.eventSummary}</span><textarea rows="6" value={form.eventSummary} onChange={e=>set('eventSummary',e.target.value)} placeholder={c.summaryPlaceholder} /></label>
          <label className="fld"><span>{c.achievements}</span><input value={form.eventAchievements} onChange={e=>set('eventAchievements',e.target.value)} placeholder={c.achievementsPlaceholder} /></label>
          <label className="fld"><span>{c.eventVideoUrl}</span><input type="url" value={form.eventVideoUrl} onChange={e=>set('eventVideoUrl',e.target.value)} placeholder={c.videoUrlPlaceholder} /></label>
        </Section>
      )}

      {isCancelled && (
        <Section icon={Info} title={c.cancellationInfo}>
          <label className="fld"><span>{c.cancellationDate} *</span><input type="date" required value={form.cancellationDate} onChange={e=>set('cancellationDate',e.target.value)} /></label>
          <label className="fld"><span>{c.cancellationReason}</span>
            <select required value={form.cancellationReason || ''} onChange={e=>set('cancellationReason',e.target.value)}>
              <option value="">{c.selectReason}</option>
              <option value="organisational_decision">{c.reasonOrganisational}</option>
              <option value="unavoidable_circumstances">{c.reasonUnavoidable}</option>
              <option value="weather_conditions">{c.reasonWeather}</option>
              <option value="venue_unavailability">{c.reasonVenue}</option>
              <option value="speaker_unavailability">{c.reasonSpeaker}</option>
              <option value="insufficient_registrations">{c.reasonRegistrations}</option>
              <option value="other">{c.reasonOther}</option>
            </select>
          </label>
          <label className="fld"><span>{c.cancellationAnnouncement} *</span><textarea rows="6" required value={form.cancellationAnnouncement} onChange={e=>set('cancellationAnnouncement',e.target.value)} placeholder={c.announcementPlaceholder} /></label>
          <label className="fld"><span>{c.rescheduled}</span><select value={form.isRescheduled ? 'yes' : 'no'} onChange={e=>{const value=e.target.value==='yes';mark(()=>setForm(f=>({...f,isRescheduled:value,...(!value?{rescheduledEventDate:''}:{})})));}}><option value="no">{c.no}</option><option value="yes">{c.yes}</option></select></label>
          {form.isRescheduled && <label className="fld"><span>{c.newEventDate} *</span><input type="date" required value={form.rescheduledEventDate} onChange={e=>set('rescheduledEventDate',e.target.value)} /></label>}
          <label className="fld"><span>{c.refundInformation}</span><textarea rows="3" value={form.refundInformation} onChange={e=>set('refundInformation',e.target.value)} placeholder={c.refundPlaceholder} /></label>
          <label className="fld"><span>{c.cancellationDetails}</span><textarea rows="4" value={form.cancellationDetails} onChange={e=>set('cancellationDetails',e.target.value)} placeholder={c.detailsPlaceholder} /></label>
        </Section>
      )}

      {isCancelled && <Section icon={ImageIcon} title={c.cancellationMedia}>
        <div className="fld"><span>{c.cancellationImage}</span>
          <div className="cover-field">
            <div className={`cover-frame${form.cancellationImage ? '' : ' is-empty'}`}>
              {form.cancellationImage ? <img src={form.cancellationImage} alt={c.cancellationImage} /> : <div className="cover-empty"><ImageIcon size={28} /><small>{t.noCover}</small></div>}
              {cancellationImageBusy && <div className="cover-busy">{c.uploading}</div>}
            </div>
            <div className="cover-actions">
              <label className="btn-secondary" style={{cursor:cancellationImageBusy?'wait':'pointer'}}>{form.cancellationImage ? t.replaceImage : t.uploadImage}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden disabled={cancellationImageBusy} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';const err=checkFile(file);if(err){setCoverErr(err);return;}setCancellationImageBusy(true);try{const url=await sendFile(file);set('cancellationImage',url);setCoverErr('');}catch(error){setCoverErr(error.response?.data?.error||error.message||c.invalidImage);}finally{setCancellationImageBusy(false);}}} /></label>
              {form.cancellationImage && !cancellationImageBusy && <button type="button" className="act-del" onClick={()=>set('cancellationImage','')}>{t.removeImage}</button>}
              {coverErr && <small className="cover-err">{coverErr}</small>}
            </div>
          </div>
        </div>
        <small>{c.additionalImagesUseGallery}</small>
      </Section>}

      {isCancelled && <Section icon={User} title={c.organizerInformation}>
        <label className="fld"><span>{c.organizerName}</span><input value={form.organizerName} onChange={e=>set('organizerName',e.target.value)} /></label>
        <div className="fld-row">
          <label className="fld"><span>{c.contactPerson}</span><input value={form.contactPerson || ''} onChange={e=>set('contactPerson',e.target.value)} /></label>
          <label className="fld"><span>{c.contactPhone}</span><input type="tel" value={form.contactPhone || ''} onChange={e=>set('contactPhone',e.target.value)} /></label>
          <label className="fld"><span>{c.contactEmail}</span><input type="email" value={form.contactEmail || ''} onChange={e=>set('contactEmail',e.target.value)} /></label>
        </div>
      </Section>}

      <Section icon={Settings} title={t.settings}>
        <div className="fld-row">
          <label className="fld"><span>{t.eventStatus}</span>
            <select value={form.eventStatus} onChange={e=>{ const v=e.target.value; mark(()=>setForm(f=>({...f,eventStatus:v,...(!isEdit && (v==='live' || v==='completed' || v==='cancelled') ? {status:'draft'} : {}),...(v==='cancelled' && form.eventStatus!=='cancelled' ? {showCancellationOnHomepage:true} : {})}))); }}>
              <option value="upcoming">{t.upcoming}</option><option value="live">{t.live}</option>
              <option value="completed">{t.completed}</option><option value="cancelled">{t.cancelled}</option>
            </select><small>{t.publicLiveHint}</small></label>
          {/* Hide publish status dropdown for live/completed/cancelled - they auto-draft */}
          {!isLive && !isCompleted && !isCancelled && <label className="fld"><span>{t.publishStatus}</span>
            <select value={form.status} onChange={e=>set('status',e.target.value)}>
              <option value="draft">{t.draft}</option><option value="published">{t.published}</option>
              <option value="unpublished">{t.unpublished}</option>
            </select></label>}
        </div>
        <div className="checks">
          <label className="check"><input type="checkbox" checked={form.isFeatured} onChange={e=>set('isFeatured',e.target.checked)} /> {isCancelled ? c.featuredCancellation : t.featured}</label>
          <label className="check"><input type="checkbox" checked={form.showOnHomepage} onChange={e=>set('showOnHomepage',e.target.checked)} /> {t.homepage}</label>
          {isCancelled && <label className="check"><input type="checkbox" checked={form.showCancellationOnHomepage} onChange={e=>set('showCancellationOnHomepage',e.target.checked)} /> {c.showCancellationNotice}</label>}
          {isCancelled && <label className="check"><input type="checkbox" checked={form.sendCancellationNotification} onChange={e=>set('sendCancellationNotification',e.target.checked)} /> {c.sendCancellationNotification}</label>}
          {!isLive && !isCompleted && !isCancelled && <label className="check"><input type="checkbox" checked={form.registrationOpen} onChange={e=>set('registrationOpen',e.target.checked)} /> {t.registrationOpen}</label>}
        </div>
        {!isLive && !isCompleted && !isCancelled && <div className="fld-row">
          <label className="fld"><span>{t.limit}</span><input type="number" min="1" step="1" value={form.registrationLimit} onChange={e=>set('registrationLimit',e.target.value)} /><small>{c.limitHint}</small></label>
          <label className="fld"><span>{t.openMode}</span><select value={form.registrationOpenMode} onChange={e=>set('registrationOpenMode',e.target.value)}><option value="auto">{t.automatic}</option><option value="manual">{t.manual}</option></select></label>
          {form.registrationOpenMode === 'manual' ? <>
            <p className="ev-registration-hint">{c.manualHint}</p>
            <label className="fld"><span>{t.opensAt}</span><input type="datetime-local" value={form.registrationOpensAt} onChange={e=>set('registrationOpensAt',e.target.value)} /></label>
            <label className="fld"><span>{t.closesAt}</span><input type="datetime-local" value={form.registrationClosesAt} onChange={e=>set('registrationClosesAt',e.target.value)} /></label>
          </> : <p className="ev-registration-hint">{c.automaticHint}</p>}
          <label className="fld"><span>{t.displayOrder}</span><input type="number" value={form.displayOrder} onChange={e=>set('displayOrder',e.target.value)} /></label>
        </div>}
      </Section>

      {!isLive && <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={cancel}>{t.cancel}</button>
        {(hasSavedRecord || isCancelled) && <button type="button" className="btn-secondary" onClick={()=>setPreview(true)}>{c.preview}</button>}
        <button type="button" className="btn-secondary" onClick={()=>save(false)}>{t.saveDraft}</button>
        {hasSavedRecord && !isCancelled && <button type="button" className="btn-secondary" onClick={()=>save()}>{t.update}</button>}
        <button type="button" className="btn-publish" onClick={()=>save(true)}>{isCancelled ? c.publishCancellation : hasSavedRecord ? t.updatePublish : t.publishEvent}</button>
        {hasSavedRecord && !isCancelled && <button type="button" className="act act-del" disabled={deleting} onClick={deleteEvent}>{deleting ? c.saving : c.delete}</button>}
      </div>}
      {preview && (
        <div className="ev-modal-bg" role="presentation" onClick={()=>setPreview(false)}>
          <div className="ev-modal event-preview" role="dialog" aria-modal="true" aria-labelledby="event-preview-title" onClick={e=>e.stopPropagation()}>
            <h3 id="event-preview-title">{form.translations[ui]?.title || form.translations.en.title || form.translations.ta.title || form.translations.si.title || t.title}</h3>
            {shownCover && <img src={shownCover} alt="" style={{width:'100%',maxHeight:260,objectFit:'cover',borderRadius:8}} />}
            {isCancelled && form.cancellationImage && <img src={form.cancellationImage} alt={c.cancellationImage} style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:8,marginTop:12}} />}
            <p>{form.eventDate} {form.startTime}{form.endTime ? ` – ${form.endTime}` : ''}</p>
            <p>{[form.venue, form.city, form.address].filter(Boolean).join(', ')}</p>
            <p>{form.translations[ui]?.description || form.translations.en.description || form.translations.ta.description || form.translations.si.description}</p>
            {isCancelled && <div><p><strong>{c.cancellationDate}:</strong> {form.cancellationDate}</p><p><strong>{c.cancellationReason}:</strong> {form.cancellationReason}</p><p>{form.cancellationAnnouncement}</p>{form.isRescheduled && <p><strong>{c.newEventDate}:</strong> {form.rescheduledEventDate}</p>}</div>}
            <div className="ev-modal-actions"><button className="btn-secondary" onClick={()=>setPreview(false)}>{t.cancel}</button><button className="btn-publish" onClick={()=>setPreview(false)}>{t.save}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
