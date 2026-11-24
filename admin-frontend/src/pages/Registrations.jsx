import { useEffect, useMemo, useState } from 'react'
import { Ban, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Eye, Search, TicketCheck, Trash2, Users, X } from 'lucide-react'
import api from '../lib/api'
import '../registrationHistory.css'

const STATUS = {
  registered: { label: 'Registered · Confirmed', cls: 'rh-status-confirmed' },
  checked_in: { label: 'Checked in · Attended', cls: 'rh-status-attended' },
  cancelled: { label: 'Cancelled', cls: 'rh-status-cancelled' },
}
const DATE_OPTIONS = [
  ['all', 'All dates'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['last7', 'Last 7 days'],
  ['last30', 'Last 30 days'], ['month', 'This month'], ['custom', 'Custom range'],
]
const initialFilters = { q: '', eventId: '', dateRange: 'all', status: '', from: '', to: '' }

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function dateBounds(filters) {
  if (filters.dateRange === 'custom') return { from: filters.from, to: filters.to }
  const today = new Date(); const end = new Date(today); const start = new Date(today)
  if (filters.dateRange === 'yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1) }
  if (filters.dateRange === 'last7') start.setDate(start.getDate() - 6)
  if (filters.dateRange === 'last30') start.setDate(start.getDate() - 29)
  if (filters.dateRange === 'month') start.setDate(1)
  if (filters.dateRange === 'all') return { from: '', to: '' }
  return { from: localDate(start), to: localDate(end) }
}
function prettyDate(value, withTime = true) {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-LK', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date)
}

export default function Registrations() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const [draft, setDraft] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState(null)
  const [statusDraft, setStatusDraft] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [actionError, setActionError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get('/events/?admin=1').then((response) => {
      const payload = response.data?.data
      setEvents(Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [])
    }).catch(() => {})
    api.get('/registrations/?stats=1').then((response) => setStats(response.data?.data || null)).catch(() => {})
  }, [])

  useEffect(() => {
    let current = true
    const params = new URLSearchParams({ admin: '1', page: String(page), limit: String(limit) })
    if (filters.q) params.set('q', filters.q)
    if (filters.eventId) params.set('event_id', filters.eventId)
    if (filters.status) params.set('status', filters.status)
    const bounds = dateBounds(filters)
    if (bounds.from) params.set('from', bounds.from)
    if (bounds.to) params.set('to', bounds.to)
    setLoading(true); setError('')
    api.get(`/registrations/?${params.toString()}`)
      .then((response) => { if (current) setData(response.data?.data || { items: [], total: 0, pages: 1 }) })
      .catch((requestError) => { if (current) setError(requestError.response?.data?.error || 'Could not load registration history. Please try again.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [filters, page, limit])

  const statCards = useMemo(() => [
    { label: 'Total registrations', value: stats?.totalRegistrations ?? '—', Icon: Users, color: 'maroon' },
    { label: "Today's registrations", value: stats?.todayRegistrations ?? '—', Icon: CalendarDays, color: 'gold' },
    { label: "This month's registrations", value: stats?.monthRegistrations ?? '—', Icon: TicketCheck, color: 'green' },
    { label: 'Events with registrations', value: stats?.eventsWithRegistrations ?? '—', Icon: CheckCircle2, color: 'slate' },
  ], [stats])

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const applyFilters = (event) => { event.preventDefault(); setPage(1); setFilters({ ...draft }) }
  const resetFilters = () => { setDraft(initialFilters); setFilters(initialFilters); setPage(1) }
  const openDetails = async (id) => {
    setActionError('')
    try {
      const response = await api.get(`/registrations/?admin=1&id=${id}`)
      const record = response.data?.data
      setView(record || null); setStatusDraft(record?.status || '')
    } catch (requestError) { setActionError(requestError.response?.data?.error || 'Could not load registration details.') }
  }
  const saveStatus = async () => {
    if (!view || !statusDraft || statusDraft === view.status) return
    setSavingStatus(true); setActionError('')
    try {
      await api.put(`/registrations/?id=${view.id}`, { status: statusDraft })
      await openDetails(view.id)
      setPage((current) => current)
      const params = new URLSearchParams({ admin: '1', page: String(page), limit: String(limit) })
      if (filters.q) params.set('q', filters.q)
      if (filters.eventId) params.set('event_id', filters.eventId)
      if (filters.status) params.set('status', filters.status)
      const bounds = dateBounds(filters)
      if (bounds.from) params.set('from', bounds.from)
      if (bounds.to) params.set('to', bounds.to)
      const refreshed = await api.get(`/registrations/?${params.toString()}`)
      setData(refreshed.data?.data || { items: [], total: 0, pages: 1 })
      const statResponse = await api.get('/registrations/?stats=1')
      setStats(statResponse.data?.data || null)
    } catch (requestError) { setActionError(requestError.response?.data?.error || 'Could not update registration status.') }
    finally { setSavingStatus(false) }
  }
  const cancelRegistration = async (record) => {
    if (!window.confirm(`Cancel ${record.registrationId || 'this registration'}?`)) return
    setActionError('')
    try {
      await api.post(`/registrations/?action=cancel&id=${record.id}`, {})
      if (view?.id === record.id) await openDetails(record.id)
      const params = new URLSearchParams({ admin: '1', page: String(page), limit: String(limit) })
      if (filters.q) params.set('q', filters.q)
      if (filters.eventId) params.set('event_id', filters.eventId)
      if (filters.status) params.set('status', filters.status)
      const bounds = dateBounds(filters)
      if (bounds.from) params.set('from', bounds.from)
      if (bounds.to) params.set('to', bounds.to)
      const refreshed = await api.get(`/registrations/?${params.toString()}`)
      setData(refreshed.data?.data || { items: [], total: 0, pages: 1 })
      const statResponse = await api.get('/registrations/?stats=1')
      setStats(statResponse.data?.data || null)
    } catch (requestError) { setActionError(requestError.response?.data?.error || 'Could not cancel this registration.') }
  }
  const deleteRegistration = async (record) => {
    if (!window.confirm(`Permanently delete ${record.registrationId || 'this registration'}? Its audit entry will be retained.`)) return
    setActionError('')
    try {
      await api.delete(`/registrations/?id=${record.id}`)
      if (view?.id === record.id) setView(null)
      const params = new URLSearchParams({ admin: '1', page: String(page), limit: String(limit) })
      if (filters.q) params.set('q', filters.q)
      if (filters.eventId) params.set('event_id', filters.eventId)
      if (filters.status) params.set('status', filters.status)
      const bounds = dateBounds(filters)
      if (bounds.from) params.set('from', bounds.from)
      if (bounds.to) params.set('to', bounds.to)
      const refreshed = await api.get(`/registrations/?${params.toString()}`)
      setData(refreshed.data?.data || { items: [], total: 0, pages: 1 })
      const statResponse = await api.get('/registrations/?stats=1')
      setStats(statResponse.data?.data || null)
    } catch (requestError) { setActionError(requestError.response?.data?.error || 'Could not delete this registration.') }
  }
  const exportCsv = async () => {
    setExporting(true); setActionError('')
    const params = new URLSearchParams({ export: 'registrations' })
    if (filters.q) params.set('q', filters.q)
    if (filters.eventId) params.set('event_id', filters.eventId)
    if (filters.status) params.set('status', filters.status)
    const bounds = dateBounds(filters)
    if (bounds.from) params.set('from', bounds.from)
    if (bounds.to) params.set('to', bounds.to)
    try {
      const response = await api.get(`/registrations/?${params.toString()}`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a'); link.href = url; link.download = `registration-history-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
    } catch (requestError) { setActionError(requestError.response?.data?.error || 'Could not export these registrations.') }
    finally { setExporting(false) }
  }

  return <div className="dash-wrap rh-page">
    <div className="rh-heading"><div><span className="rh-eyebrow">EVENTS MANAGEMENT</span><h1>Registration History</h1><p>Review public event registrations, apply filters and maintain attendee records.</p></div><button className="rh-export" onClick={exportCsv} disabled={exporting}><Download size={16}/>{exporting ? 'Preparing CSV…' : 'Export filtered CSV'}</button></div>

    <div className="rh-stat-grid">{statCards.map(({ label, value, Icon, color }) => <article className="rh-stat" key={label}><span className={`rh-stat-icon rh-${color}`}><Icon size={18}/></span><div><b>{typeof value === 'number' ? value.toLocaleString() : value}</b><span>{label}</span></div></article>)}</div>

    <div className="rh-workflow"><Clock3 size={16}/><span><b>Registration status:</b> Registered means the attendee is confirmed; Checked in means attendance was recorded; Cancelled means the registration is no longer active.</span></div>

    <form className="rh-filter-card" onSubmit={applyFilters}>
      <div className="rh-filter-top"><div><h2>Find registrations</h2><p>Filters are applied together in the database.</p></div><button type="button" className="rh-reset" onClick={resetFilters}>Reset filters</button></div>
      <div className="rh-filter-grid">
        <label className="rh-search"><span>Search participant</span><div><Search size={16}/><input value={draft.q} onChange={(event) => updateDraft('q', event.target.value)} placeholder="Name, email, phone or registration ID" /></div></label>
        <label><span>Event</span><select value={draft.eventId} onChange={(event) => updateDraft('eventId', event.target.value)}><option value="">All events</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title || `Event #${event.id}`}</option>)}</select></label>
        <label><span>Date range</span><select value={draft.dateRange} onChange={(event) => updateDraft('dateRange', event.target.value)}>{DATE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Status</span><select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}><option value="">All statuses</option><option value="registered">Registered · Confirmed</option><option value="checked_in">Checked in · Attended</option><option value="cancelled">Cancelled</option></select></label>
        {draft.dateRange === 'custom' && <div className="rh-custom-dates"><label><span>From</span><input type="date" value={draft.from} onChange={(event) => updateDraft('from', event.target.value)} /></label><label><span>To</span><input type="date" value={draft.to} onChange={(event) => updateDraft('to', event.target.value)} /></label></div>}
        <button className="rh-apply" type="submit">Apply filters <Search size={15}/></button>
      </div>
    </form>

    {actionError && !view && <div className="rh-alert" role="alert">{actionError}</div>}
    {error && <div className="rh-alert" role="alert">{error}</div>}
    {loading ? <div className="rh-state">Loading registration history…</div> : data.items?.length ? <div className="rh-table-wrap"><table className="rh-table"><thead><tr><th>Registration ID</th><th>Participant</th><th>Contact</th><th>Event</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.items.map((record) => {
      const status = STATUS[record.status] || { label: record.status, cls: 'rh-status-cancelled' }
      return <tr key={record.id}><td><b className="rh-mono">{record.registrationId || `REG-${String(record.id).padStart(6, '0')}`}</b></td><td><strong>{record.fullName || '—'}</strong><small>{[record.organization, record.designation].filter(Boolean).join(' · ') || 'Individual registration'}</small></td><td><span>{record.email || '—'}</span><small>{record.phone || '—'}</small></td><td><strong>{record.eventTitle || `Event #${record.eventId}`}</strong><small>{[record.eventDate, record.venue].filter(Boolean).join(' · ') || '—'}</small></td><td>{prettyDate(record.registeredAt)}</td><td><span className={`rh-status ${status.cls}`}><i/>{status.label}</span></td><td><button className="rh-view" onClick={() => openDetails(record.id)}><Eye size={15}/>Details</button>{record.status !== 'cancelled' && <button className="rh-cancel" title="Cancel registration" onClick={() => cancelRegistration(record)}><Ban size={15}/></button>}<button className="rh-delete" title="Delete registration" onClick={() => deleteRegistration(record)}><Trash2 size={15}/></button></td></tr>
    })}</tbody></table></div> : <div className="rh-state rh-empty"><TicketCheck size={28}/><b>No registrations found</b><span>Try a different search or reset the filters to see all registration records.</span></div>}

    <div className="rh-pager"><span>{data.total || 0} registrations · page {data.pages ? Math.min(page, data.pages) : 1} of {data.pages || 1}</span><div><label>Rows <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></label><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17}/></button><button aria-label="Next page" disabled={page >= (data.pages || 1) || loading} onClick={() => setPage((current) => current + 1)}><ChevronRight size={17}/></button></div></div>

    {view && <div className="rh-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setView(null) }}><section className="rh-modal" role="dialog" aria-modal="true" aria-labelledby="rh-detail-title"><header><div><span className="rh-eyebrow">REGISTRATION DETAIL</span><h2 id="rh-detail-title">{view.registrationId || `REG-${String(view.id).padStart(6, '0')}`}</h2></div><button className="rh-close" onClick={() => setView(null)} aria-label="Close details"><X size={19}/></button></header><div className="rh-detail-grid"><div><span>Participant</span><b>{view.fullName || '—'}</b></div><div><span>Email</span><b>{view.email || '—'}</b></div><div><span>Phone</span><b>{view.phone || '—'}</b></div><div><span>Event</span><b>{view.eventTitle || `Event #${view.eventId}`}</b></div><div><span>Event date &amp; time</span><b>{[view.eventDate, view.eventStart, view.eventEnd].filter(Boolean).join(' · ') || '—'}</b></div><div><span>Venue</span><b>{[view.venue, view.address].filter(Boolean).join(', ') || '—'}</b></div><div><span>Registered on</span><b>{prettyDate(view.registeredAt)}</b></div><div><span>Organisation / designation</span><b>{[view.organization, view.designation].filter(Boolean).join(' · ') || '—'}</b></div><div className="rh-detail-wide"><span>Additional information</span><b>{view.specialRequirements || 'No additional information supplied.'}</b></div></div><div className="rh-status-edit"><label><span>Registration status</span><select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}><option value="registered">Registered · Confirmed</option><option value="checked_in">Checked in · Attended</option><option value="cancelled">Cancelled</option></select></label><button className="rh-apply" onClick={saveStatus} disabled={savingStatus || statusDraft === view.status}>{savingStatus ? 'Saving…' : 'Save status'}</button><button className="rh-delete rh-delete-wide" onClick={() => deleteRegistration(view)}><Trash2 size={15}/>Delete registration</button></div>{actionError && <div className="rh-alert" role="alert">{actionError}</div>}<div className="rh-audit"><h3>Registration activity</h3>{view.history?.length ? <ol>{view.history.map((entry) => <li key={entry.id}><i/><div><b>{String(entry.action).replaceAll('_', ' ')}</b><p>{entry.details || '—'}</p><small>{prettyDate(entry.createdAt)} · {entry.performedBy || 'System'}</small></div></li>)}</ol> : <p>No activity has been recorded yet.</p>}</div></section></div>}
  </div>
}
