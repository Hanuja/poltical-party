import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { Info, Image as ImageIcon, CalendarClock, MapPin, Link2, Settings } from 'lucide-react';

const LANGS = [['en','English'],['ta','தமிழ்'],['si','සිංහල']];
const EMPTY_TR = { en: { title: '', slug: '', description: '' }, ta: { title: '', slug: '', description: '' }, si: { title: '', slug: '', description: '' } };
const EMPTY = {
  categoryId: '', image: '', eventDate: '', startTime: '', endTime: '', venue: '', address: '', city: '',
  mapUrl: '', streamUrl: '', externalUrl: '', registrationUrl: '', gallery: [],
  isFeatured: false, showOnHomepage: true, registrationOpen: true, registrationLimit: '', registrationOpensAt: '', registrationClosesAt: '', registrationOpenMode: 'auto', displayOrder: 0,
  eventStatus: 'upcoming', status: 'draft',
  translations: JSON.parse(JSON.stringify(EMPTY_TR)),
};
// Must match the backend upload rules in backend/api/events/index.php
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const IMG_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const IMG_MAX = 8 * 1024 * 1024;
const slugify = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

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
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(isEdit);
  const [dirty, setDirty] = useState(false);
  const tr = form.translations[lang];

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/events/?id=${id}`).then((r) => {
      const e = r.data.data;
      originalImage.current = e.image || '';
      setForm({
        ...EMPTY,
        categoryId: e.categoryId || '', image: e.image || '', eventDate: (e.eventDate || e.date || '').slice(0, 10),
        startTime: e.startTime || '', endTime: e.endTime || '', venue: e.venue || '', address: e.address || '',
        city: e.city || '', mapUrl: e.mapUrl || '', streamUrl: e.streamUrl || '', externalUrl: e.externalUrl || '',
        registrationUrl: e.registrationUrl || '', gallery: Array.isArray(e.gallery) ? e.gallery : [],
        isFeatured: !!e.isFeatured, showOnHomepage: e.showOnHomepage !== false, registrationOpen: e.registrationOpen !== false,
        registrationLimit: e.registrationLimit ?? '', registrationOpensAt: (e.registrationOpensAt||'').slice(0,16), registrationClosesAt: (e.registrationClosesAt||'').slice(0,16), registrationOpenMode: e.registrationOpenMode || 'auto', displayOrder: e.displayOrder || 0,
        eventStatus: e.eventStatus || e.status || 'upcoming', status: e.publishStatus || 'draft',
        translations: {
          en: { title: e.title || '', slug: e.slug || '', description: e.description || '' },
          ta: { title: '', slug: '', description: '' }, si: { title: '', slug: '', description: '' },
          ...(e.translations || {}),
        },
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, isEdit]);

  // Run the state update immediately (the old curried version returned a function that was never called,
  // so typed values and the uploaded cover image were silently dropped).
  const mark = (fn) => { setDirty(true); fn(); };
  const set = (k, v) => mark(() => setForm(f => ({ ...f, [k]: v })));
  const setTr = (f, v) => mark(() => setForm(x => ({ ...x, translations: { ...x.translations, [lang]: { ...x.translations[lang], [f]: v } } })));

  // Cover image: instant local preview while uploading; the saved image is only replaced once the upload succeeds.
  const [coverPreview, setCoverPreview] = useState('');
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverErr, setCoverErr] = useState('');
  const [coverBroken, setCoverBroken] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const originalImage = useRef('');
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);
  useEffect(() => { setCoverBroken(false); }, [form.image]);

  const checkFile = (file) => {
    if (!file) return 'No file selected';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!IMG_EXT.includes(ext) || (file.type && !IMG_MIME.includes(file.type))) return 'Only JPG, JPEG, PNG or WEBP images are allowed';
    if (file.size > IMG_MAX) return `Image is too large (max ${IMG_MAX / 1024 / 1024} MB)`;
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
      setCoverErr(e.response?.data?.error || e.message || 'Upload failed');
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
      alert(e.response?.data?.error || e.message || 'Upload failed');
    } finally { setGalleryBusy(false); }
  };

  const shownCover = coverPreview || form.image;

  const validate = () => {
    if (!tr.title?.trim()) { alert('Event title is required'); return false; }
    if (!form.eventDate) { alert('Event date is required'); return false; }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) { alert('End time must be later than start time'); return false; }
    return true;
  };

  const save = async (publish) => {
    if (coverBusy || galleryBusy) { alert('Please wait for the image upload to finish'); return; }
    if (!validate()) return;
    const payload = {
      ...form,
      status: publish === undefined ? form.status : (publish ? 'published' : 'draft'),
      registrationLimit: form.registrationLimit === '' ? null : Number(form.registrationLimit),
      displayOrder: Number(form.displayOrder) || 0,
    };
    try {
      if (isEdit) await api.put(`/events/?id=${id}`, payload);
      else await api.post('/events/', payload);
      setDirty(false);
      navigate('/events');
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
  };

  const cancel = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    navigate('/events');
  };

  if (loading) return <div className="dash-wrap"><p>Loading…</p></div>;

  return (
    <div className="dash-wrap ann-form">
      <div className="dash-head"><div>
        <h1>{isEdit ? 'Edit Event' : 'Add Event'}</h1>
        <p className="dash-sub">{isEdit ? `ID ${id}` : 'New event'}</p>
      </div></div>

      <Section icon={Info} title="Basic Information">
        <div className="lang-tabs">
          {LANGS.map(([c,l]) => <button key={c} type="button" className={lang===c?'active':''} onClick={()=>setLang(c)}>{l}</button>)}
        </div>
        <div className="fld-row">
          <label className="fld"><span>Event Title *</span>
            <input value={tr.title} onChange={e=>{ setTr('title',e.target.value); if(lang==='en' && !tr.slug) setTr('slug', slugify(e.target.value)); }} /></label>
          <label className="fld"><span>Event Slug</span>
            <input value={tr.slug} onChange={e=>setTr('slug',e.target.value)} /></label>
        </div>
        <label className="fld"><span>Short Description</span>
          <textarea rows="2" maxLength="300" value={form.translations[lang].description?.slice(0,300) || ''} onChange={e=>setTr('description',e.target.value)} placeholder="Brief summary" /></label>
        <label className="fld"><span>Full Description</span>
          <textarea rows="8" value={tr.description} onChange={e=>setTr('description',e.target.value)} /></label>
      </Section>

      <Section icon={ImageIcon} title="Event Media">
        <div className="fld"><span>Cover Image</span>
          <div className="cover-field">
            <div className={`cover-frame${shownCover && !coverBroken ? '' : ' is-empty'}`}>
              {shownCover && !coverBroken
                ? <img key={shownCover} src={shownCover} alt="Cover preview" onError={() => setCoverBroken(true)} />
                : <div className="cover-empty"><ImageIcon size={28} /><small>{coverBroken ? 'Image could not be loaded' : 'No cover image'}</small></div>}
              {coverBusy && <div className="cover-busy">Uploading…</div>}
            </div>
            <div className="cover-actions">
              <label className="btn-secondary" style={{ cursor: coverBusy ? 'wait' : 'pointer' }}>
                {form.image ? 'Replace Image' : 'Upload Image'}
                <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden disabled={coverBusy}
                  onChange={e => { uploadCover(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {form.image && !coverBusy && <button type="button" className="act-del" onClick={() => set('image', '')}>Remove Image</button>}
              {isEdit && originalImage.current && form.image !== originalImage.current && !coverBusy &&
                <button type="button" className="btn-secondary" onClick={() => set('image', originalImage.current)}>Restore Saved Image</button>}
              <small className="cover-hint">JPG, JPEG, PNG or WEBP · max 8 MB · shown on Admin View and the public website</small>
              {coverErr && <small className="cover-err">{coverErr}</small>}
            </div>
          </div>
        </div>
        <div className="fld"><span>Gallery Images</span>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {form.gallery.map((g,i)=>(
              <div key={i} style={{position:'relative',width:100}}>
                <img src={g} style={{width:'100%',height:64,objectFit:'cover',borderRadius:8}} alt="" />
                <button type="button" className="act-del" style={{position:'absolute',top:2,right:2}} onClick={()=>set('gallery', form.gallery.filter((_,x)=>x!==i))}>✕</button>
              </div>
            ))}
          </div>
          <label className="btn-secondary" style={{cursor:galleryBusy?'wait':'pointer',display:'inline-block',marginTop:8}}>{galleryBusy ? 'Uploading…' : '+ Add Image'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={galleryBusy} onChange={e=>{uploadGallery(e.target.files?.[0]);e.target.value='';}} /></label>
        </div>
      </Section>

      <Section icon={CalendarClock} title="Event Schedule">
        <div className="fld-row">
          <label className="fld"><span>Event Date *</span><input type="date" value={form.eventDate} onChange={e=>set('eventDate',e.target.value)} /></label>
          <label className="fld"><span>Start Time</span><input type="time" value={form.startTime} onChange={e=>set('startTime',e.target.value)} /></label>
          <label className="fld"><span>End Time</span><input type="time" value={form.endTime} onChange={e=>set('endTime',e.target.value)} /></label>
        </div>
      </Section>

      <Section icon={MapPin} title="Event Location">
        <div className="fld-row">
          <label className="fld"><span>Venue Name</span><input value={form.venue} onChange={e=>set('venue',e.target.value)} /></label>
          <label className="fld"><span>City / District</span><input value={form.city} onChange={e=>set('city',e.target.value)} /></label>
        </div>
        <label className="fld"><span>Full Address</span><textarea rows="2" value={form.address} onChange={e=>set('address',e.target.value)} /></label>
        <label className="fld"><span>Google Maps URL</span><input value={form.mapUrl} onChange={e=>set('mapUrl',e.target.value)} placeholder="https://maps.google.com/…" /></label>
      </Section>

      <Section icon={Link2} title="Event Links">
        <label className="fld"><span>Live Streaming URL</span><input value={form.streamUrl} onChange={e=>set('streamUrl',e.target.value)} placeholder="https://…" /></label>
        <div className="fld-row">
          <label className="fld"><span>External Event Website</span><input value={form.externalUrl} onChange={e=>set('externalUrl',e.target.value)} placeholder="https://…" /></label>
          <label className="fld"><span>Registration URL</span><input value={form.registrationUrl} onChange={e=>set('registrationUrl',e.target.value)} placeholder="https://…" /></label>
        </div>
      </Section>

      <Section icon={Settings} title="Event Settings">
        <div className="fld-row">
          <label className="fld"><span>Event Status</span>
            <select value={form.eventStatus} onChange={e=>set('eventStatus',e.target.value)}>
              <option value="upcoming">Upcoming</option><option value="live">Live</option>
              <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select><small>The public LIVE badge appears only during the scheduled event time. Future events remain Upcoming.</small></label>
          <label className="fld"><span>Publication Status</span>
            <select value={form.status} onChange={e=>set('status',e.target.value)}>
              <option value="draft">Draft</option><option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select></label>
        </div>
        <div className="checks">
          <label className="check"><input type="checkbox" checked={form.isFeatured} onChange={e=>set('isFeatured',e.target.checked)} /> Featured Event</label>
          <label className="check"><input type="checkbox" checked={form.showOnHomepage} onChange={e=>set('showOnHomepage',e.target.checked)} /> Show on Homepage</label>
          <label className="check"><input type="checkbox" checked={form.registrationOpen} onChange={e=>set('registrationOpen',e.target.checked)} /> Registration Open</label>
        </div>
        <div className="fld-row">
          <label className="fld"><span>Registration Limit</span><input type="number" value={form.registrationLimit} onChange={e=>set('registrationLimit',e.target.value)} /></label>
          <label className="fld"><span>Opening Mode</span><select value={form.registrationOpenMode} onChange={e=>set('registrationOpenMode',e.target.value)}><option value="auto">Automatic (10 days before event)</option><option value="manual">Manual dates</option></select></label>
          <label className="fld"><span>Registration Opens (default: 10 days before)</span><input type="datetime-local" value={form.registrationOpensAt} onChange={e=>set('registrationOpensAt',e.target.value)} /></label>
          <label className="fld"><span>Registration Closes (default: event start)</span><input type="datetime-local" value={form.registrationClosesAt} onChange={e=>set('registrationClosesAt',e.target.value)} /></label>
          <label className="fld"><span>Display Order</span><input type="number" value={form.displayOrder} onChange={e=>set('displayOrder',e.target.value)} /></label>
        </div>
      </Section>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={cancel}>Cancel</button>
        <button type="button" className="btn-secondary" onClick={()=>save(false)}>Save as Draft</button>
        {isEdit && <button type="button" className="btn-secondary" onClick={()=>save()}>Update Event</button>}
        <button type="button" className="btn-publish" onClick={()=>save(true)}>{isEdit?'Update & Publish':'Publish Event'}</button>
      </div>
    </div>
  );
}
