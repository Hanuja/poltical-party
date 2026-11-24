import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, AudioLines, BadgeCheck, Camera, CheckCircle2,
  ChevronLeft, ChevronRight, CloudOff, FileAudio, FileVideo2, Eye, Filter,
  Image, Loader2, MapPin, Mic, RefreshCw, Save, Search, Send, ShieldCheck,
  UserRound, Video, XCircle,
} from 'lucide-react'
import {
  publicVoiceAdminApi, PUBLIC_VOICE_CATEGORIES, PUBLIC_VOICE_STATUSES, publicVoiceDate,
} from '../lib/publicVoice'
import '../publicVoice.css'

const NEXT = {
  pending_review: ['under_review', 'approved', 'more_info_requested', 'rejected'],
  under_review: ['approved', 'more_info_requested', 'rejected'],
  more_info_requested: ['under_review', 'approved', 'rejected'],
  approved: ['published', 'rejected'],
  published: ['approved'],
  rejected: ['under_review'],
}

function Status({ value }) {
  const status = PUBLIC_VOICE_STATUSES[value] || { label: value, tone: 'pending' }
  return <span className={`pvm-status pvm-status-${status.tone}`}><i />{status.label}</span>
}

function Notice({ children, tone = 'error' }) { return <div className={`pvm-notice pvm-notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{tone === 'error' ? <AlertTriangle size={17}/> : <CheckCircle2 size={17}/>}<span>{children}</span></div> }

export default function PublicVoiceManagement() {
  const { id } = useParams()
  return id ? <PublicVoiceDetail id={id} /> : <PublicVoiceList />
}

function PublicVoiceList() {
  const [data, setData] = useState({ items: [], stats: {}, total: 0, page: 1, pages: 1 })
  const [state, setState] = useState('loading')
  const [filters, setFilters] = useState({ q: '', status: '', category: '', district: '' })
  const [page, setPage] = useState(1)
  const load = useCallback(async () => {
    setState('loading')
    try { setData(await publicVoiceAdminApi.list({ ...filters, page, limit: 20 })); setState('ready') }
    catch (error) { setState(error.status === 403 ? 'forbidden' : 'error') }
  }, [filters, page])
  useEffect(() => { const timer = setTimeout(load, 180); return () => clearTimeout(timer) }, [load])
  useEffect(() => { setPage(1) }, [filters])

  const stats = data.stats || {}
  const cards = [
    ['Total submissions', stats.total, 'total'], ['Pending review', stats.pending_review, 'pending_review'],
    ['Under review', stats.under_review, 'under_review'], ['Approved', stats.approved, 'approved'],
    ['Published', stats.published, 'published'], ['This month', stats.this_month, 'month'],
  ]
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return <div className="pvm-page">
    <div className="pvm-header"><div><span className="pvm-eyebrow"><span/>Community submissions</span><h1><Mic size={25}/> Public Voice Management</h1><p>Review concerns privately, approve safe public content, and publish only when ready.</p></div><span className="pvm-header-mark"><AudioLines size={19}/></span></div>
    <div className="pvm-stat-grid">{cards.map(([label, value, key]) => <button type="button" key={key} className={`pvm-stat${filters.status === key ? ' active' : ''}`} onClick={() => setFilter('status', key === 'total' || key === 'month' ? '' : filters.status === key ? '' : key)}><span>{value ?? '—'}</span><small>{label}</small></button>)}</div>
    <div className="pvm-toolbar"><div className="pvm-filter-heading"><Filter size={16}/><b>Submission inbox</b><span>{data.total} records</span></div><div className="pvm-filters"><label className="pvm-search"><Search size={15}/><input value={filters.q} onChange={(e) => setFilter('q', e.target.value)} placeholder="Reference, title, village or district"/></label><select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option>{Object.entries(PUBLIC_VOICE_STATUSES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select><select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}><option value="">All categories</option>{Object.entries(PUBLIC_VOICE_CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select><input value={filters.district} onChange={(e) => setFilter('district', e.target.value)} placeholder="District" aria-label="Filter by district"/></div></div>
    {state === 'forbidden' && <div className="pvm-empty"><ShieldCheck size={30}/><p>Your account cannot review Public Voice submissions.</p></div>}
    {state === 'error' && <div className="pvm-empty"><CloudOff size={29}/><p>Could not load submissions.</p><button className="pvm-button pvm-button-primary" onClick={load}><RefreshCw size={15}/>Try again</button></div>}
    {state === 'loading' && !data.items.length && <div className="pvm-empty"><Loader2 size={24} className="pvm-spin"/><p>Loading review inbox…</p></div>}
    {(state === 'ready' || (state === 'loading' && data.items.length > 0)) && (data.items.length === 0 ? <div className="pvm-empty"><Mic size={29}/><p>No submissions match the current filters.</p></div> : <div className={`pvm-table-wrap${state === 'loading' ? ' is-loading' : ''}`}><table className="pvm-table"><thead><tr><th>Reference / concern</th><th>Category</th><th>District / village</th><th>Submitted</th><th>Evidence</th><th>Status</th><th><span className="pvm-sr">Review</span></th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td data-label="Reference / concern"><Link className="pvm-reference" to={`/public-voice/${item.id}`}>{item.reference_number}</Link><b className="pvm-row-title">{item.title}</b></td><td data-label="Category">{PUBLIC_VOICE_CATEGORIES[item.category] || item.category}</td><td data-label="District / village">{item.district}<small>{item.village}</small></td><td data-label="Submitted">{publicVoiceDate(item.created_at)}</td><td data-label="Evidence"><span className="pvm-evidence-count"><Camera size={14}/>{item.photoCount}</span>{item.videoCount > 0 && <span className="pvm-evidence-count"><Video size={14}/>{item.videoCount}</span>}{item.hasAudio && <AudioLines size={15} aria-label="Voice recording"/>}</td><td data-label="Status"><Status value={item.status}/></td><td data-label="Review"><Link to={`/public-voice/${item.id}`} className="pvm-button pvm-button-ghost"><Eye size={14}/>Review</Link></td></tr>)}</tbody></table></div>)}
    {data.pages > 1 && <div className="pvm-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={16}/>Previous</button><span>Page {data.page} of {data.pages}</span><button type="button" disabled={page >= data.pages} onClick={() => setPage((current) => current + 1)}>Next<ChevronRight size={16}/></button></div>}
  </div>
}

function PublicVoiceDetail({ id }) {
  const [item, setItem] = useState(null)
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [publicTitle, setPublicTitle] = useState('')
  const [publicDescription, setPublicDescription] = useState('')
  const [publicResponse, setPublicResponse] = useState('')
  const [mediaUrls, setMediaUrls] = useState({})

  const load = useCallback(async () => {
    setState('loading')
    try {
      const record = await publicVoiceAdminApi.detail(id)
      setItem(record)
      setPublicTitle(record.public_title || record.title || '')
      setPublicDescription(record.public_description || record.description || '')
      setPublicResponse(record.public_response || '')
      setState('ready')
    } catch (e) { setState(e.status === 404 ? 'missing' : e.status === 403 ? 'forbidden' : 'error') }
  }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    let active = true
    const made = []
    if (item?.media) Promise.all(item.media.map(async (media) => {
      try { const blob = await publicVoiceAdminApi.media(media.id); const url = URL.createObjectURL(blob); made.push(url); return [media.id, url] }
      catch { return [media.id, ''] }
    })).then((entries) => { if (active) setMediaUrls(Object.fromEntries(entries)) })
    return () => { active = false; made.forEach((url) => URL.revokeObjectURL(url)) }
  }, [item?.id])

  const runReview = async (status) => {
    if (['rejected', 'more_info_requested'].includes(status) && note.trim().length < 5) { setError('Add a short reason for this action.'); return }
    setBusy(true); setError('')
    try { await publicVoiceAdminApi.review(id, status, note, publicResponse); setFlash(`Status updated: ${PUBLIC_VOICE_STATUSES[status].label}.`); setNote(''); await load() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const savePublic = async () => {
    setBusy(true); setError('')
    try { await publicVoiceAdminApi.updatePublic(id, { title: publicTitle, description: publicDescription, publicResponse, note }); setFlash('Public-facing copy saved.'); setNote(''); await load() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const setMediaApproved = async (media, approved) => {
    setBusy(true); setError('')
    try { await publicVoiceAdminApi.updateMedia(id, [{ id: media.id, approved }]); setFlash('Media publication permission updated.'); await load() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  if (state !== 'ready' || !item) return <div className="pvm-page"><Link className="pvm-back" to="/public-voice"><ArrowLeft size={16}/>Submission inbox</Link><div className="pvm-empty">{state === 'loading' ? <Loader2 size={24} className="pvm-spin"/> : <><CloudOff size={28}/><p>{state === 'missing' ? 'Submission not found.' : state === 'forbidden' ? 'Your account cannot review this submission.' : 'Could not load this submission.'}</p><button type="button" className="pvm-button pvm-button-primary" onClick={load}>Try again</button></>}</div></div>

  const available = NEXT[item.status] || []
  const groups = ['PHOTO', 'VIDEO', 'AUDIO', 'AI_IMAGE']
  return <div className="pvm-page pvm-detail-page">
    <Link className="pvm-back" to="/public-voice"><ArrowLeft size={16}/>All submissions</Link>
    <div className="pvm-detail-header"><div><span className="pvm-eyebrow"><span/>{item.reference_number} · submitted {publicVoiceDate(item.created_at)}</span><h1>{item.title}</h1><div className="pvm-detail-meta"><Status value={item.status}/><span><MapPin size={14}/>{[item.village,item.district,item.province].filter(Boolean).join(' · ')}</span><span>{PUBLIC_VOICE_CATEGORIES[item.category] || item.category}</span></div></div><span className="pvm-detail-seal"><Mic size={23}/></span></div>
    {flash && <Notice tone="success">{flash}</Notice>}{error && <Notice>{error}</Notice>}
    <div className="pvm-detail-columns"><div className="pvm-detail-main">
      <section className="pvm-panel"><h2>Original submission</h2><dl className="pvm-facts"><div><dt>Full description</dt><dd className="pvm-pre">{item.description}</dd></div><div><dt>Province / District</dt><dd>{item.province} · {item.district}</dd></div><div><dt>DS / GN division</dt><dd>{item.ds_division}{item.gn_division ? ` · ${item.gn_division}` : ''}</dd></div><div><dt>Village / specific location</dt><dd>{item.village}{item.specific_location ? ` · ${item.specific_location}` : ''}</dd></div><div><dt>Publication consent</dt><dd>{Number(item.consent_publication) ? 'Granted' : 'Not granted'}</dd></div></dl></section>
      <section className="pvm-panel"><h2><UserRound size={18}/> Private contact details <span className="pvm-private-tag"><ShieldCheck size={13}/>Admin only</span></h2><dl className="pvm-facts"><div><dt>Name</dt><dd>{item.submitter_name}</dd></div><div><dt>Phone</dt><dd><a href={`tel:${item.contact_number}`}>{item.contact_number}</a></dd></div><div><dt>Email</dt><dd>{item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : 'Not provided'}</dd></div><div><dt>Preferred contact</dt><dd>{item.preferred_contact_method || 'No preference'}</dd></div></dl></section>
      {groups.map((type) => { const media = item.media.filter((entry) => entry.media_type === type); if (!media.length) return null; return <section className="pvm-panel" key={type}><h2>{type === 'PHOTO' ? <Camera size={18}/> : type === 'VIDEO' ? <Video size={18}/> : type === 'AUDIO' ? <FileAudio size={18}/> : <Image size={18}/>} {type === 'AI_IMAGE' ? 'AI-generated illustrations' : `${type.charAt(0)}${type.slice(1).toLowerCase()} files`} <small>{media.length}</small></h2>{type === 'PHOTO' || type === 'AI_IMAGE' ? <div className="pvm-media-grid">{media.map((entry) => <article key={entry.id}><img src={mediaUrls[entry.id]} alt={entry.isAiGenerated ? 'AI-generated illustration' : entry.original_filename}/>{entry.isAiGenerated && <em>AI-generated illustration</em>}<label><input type="checkbox" checked={entry.isApproved} onChange={(event) => setMediaApproved(entry,event.target.checked)} disabled={busy || item.status === 'rejected'}/><span>Approve for publication</span></label>{entry.ai_description && <p>{entry.ai_description}</p>}</article>)}</div> : <div className="pvm-media-files">{media.map((entry) => <article key={entry.id}><div>{type === 'VIDEO' ? <video src={mediaUrls[entry.id]} controls preload="metadata"/> : <audio src={mediaUrls[entry.id]} controls preload="metadata"/>}<div className="pvm-media-file-name"><b>{entry.original_filename}</b><small>{(entry.fileSize/1048576).toFixed(1)} MB{entry.duration ? ` · ${Math.round(entry.duration)} sec` : ''}</small></div></div><label><input type="checkbox" checked={entry.isApproved} onChange={(event) => setMediaApproved(entry,event.target.checked)} disabled={busy || item.status === 'rejected'}/><span>Approve for publication</span></label></article>)}</div>}</section> })}
      <section className="pvm-panel"><h2>Public-facing version</h2><p className="pvm-muted">Correct spelling or remove sensitive details before publication. The original submission is retained in the review history.</p><label className="pvm-field"><span>Public title</span><input value={publicTitle} maxLength={120} onChange={(event) => setPublicTitle(event.target.value)}/></label><label className="pvm-field"><span>Public description</span><textarea value={publicDescription} maxLength={3000} rows={6} onChange={(event) => setPublicDescription(event.target.value)}/></label><label className="pvm-field"><span>Public response (optional)</span><textarea value={publicResponse} rows={3} maxLength={3000} onChange={(event) => setPublicResponse(event.target.value)}/></label><button type="button" className="pvm-button pvm-button-primary" onClick={savePublic} disabled={busy}><Save size={15}/>Save public-facing copy</button></section>
      <section className="pvm-panel"><h2>Review history</h2>{item.history?.length ? <ol className="pvm-history">{item.history.map((event,index) => <li key={`${event.created_at}-${index}`}><i/><div><b>{event.action.replaceAll('_',' ')}</b>{event.new_status && <Status value={event.new_status}/>}<small>{publicVoiceDate(event.created_at)}</small>{event.internal_note && <p>{event.internal_note}</p>}</div></li>)}</ol> : <p className="pvm-muted">No review actions recorded yet.</p>}</section>
    </div><aside className="pvm-review-panel"><div className="pvm-review-sticky"><h2>Review action</h2><p>Submissions remain private until you approve and explicitly publish them.</p><label className="pvm-field"><span>Internal note / action reason</span><textarea value={note} rows={4} onChange={(event) => setNote(event.target.value)} placeholder="Required when requesting information or rejecting"/></label><label className="pvm-field"><span>Public response</span><textarea value={publicResponse} rows={4} onChange={(event) => setPublicResponse(event.target.value)} placeholder="Optional response shown with the published concern"/></label><div className="pvm-review-actions">{available.map((status) => <button type="button" key={status} disabled={busy} className={`pvm-action pvm-action-${status}`} onClick={() => runReview(status)}>{busy ? <Loader2 size={15} className="pvm-spin"/> : status === 'published' ? <Send size={15}/> : status === 'rejected' ? <XCircle size={15}/> : status === 'approved' ? <BadgeCheck size={15}/> : <CheckCircle2 size={15}/>}<span>{status === 'approved' && item.status === 'published' ? 'Unpublish' : PUBLIC_VOICE_STATUSES[status].label}</span></button>)}</div></div></aside></div>
  </div>
}
