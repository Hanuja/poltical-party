import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const MAROON = '#7A0C12';
const MAROON_2 = '#B5121B';
const GOLD = '#FFD32A';
const GOLD_DEEP = '#E8B93B';
const INK = '#282828';
const MUTED = '#777777';
const GRID = '#F1E9EC';
const PIE_COLORS = [MAROON, GOLD_DEEP, MAROON_2, '#C9A24B', '#E8D9A0', '#6E0A10'];

const axisTick = { fill: MUTED, fontSize: 11 };
const tooltipStyle = { border: '1px solid #F1F1F1', borderRadius: 10, fontSize: 12, boxShadow: '0 8px 24px rgba(60, 10, 18,0.10)' };

function Panel({ kicker, title, children, extra }) {
  return <section className="dh-panel">
    <header><div><span className="dh-panel-kicker">{kicker}</span><h2>{title}</h2></div>{extra}</header>
    {children}
  </section>;
}

function Empty({ text }) { return <div className="dh-chart-empty">{text}</div>; }

export default function DashboardCharts({ monthSeries, memberStatus, eventStatus, leadershipDist, regByEvent, labels, range, setRange, custom, setCustom, onApply, noData, lang }) {
  const memberDonut = [
    { name: labels.active, value: Number(memberStatus?.active || 0), color: MAROON },
    { name: labels.pending, value: Number(memberStatus?.pending || 0), color: GOLD_DEEP },
    { name: labels.inactive, value: Number(memberStatus?.inactive || 0), color: '#D8CFCF' },
  ].filter((d) => d.value > 0);
  const donutTotal = memberDonut.reduce((s, d) => s + d.value, 0);

  const eventPie = [
    { name: labels.upcoming, value: Number(eventStatus?.upcoming || 0) },
    { name: labels.ongoing, value: Number(eventStatus?.ongoing || 0) },
    { name: labels.completed, value: Number(eventStatus?.completed || 0) },
    { name: labels.drafts, value: Number(eventStatus?.draft || 0) },
  ].filter((d) => d.value > 0);

  const leadershipBars = (leadershipDist || []).slice(0, 8).map((d, i) => ({ name: d.district || d.province || '—', count: Number(d.count), fill: i === 0 ? MAROON : MAROON_2 }));

  return <div className="dh-analytics">
    {/* Row 1 — membership growth line + status donut */}
    <div className="dh-analytics-row">
      <Panel kicker={labels.analytics} title={labels.growth} extra={
        <div className="dh-range-wrap">
          <label className="dh-range"><span>{labels.range}</span><select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7d">{labels.days7}</option><option value="30d">{labels.days30}</option>
            <option value="3m">{labels.months3}</option><option value="6m">{labels.months6}</option>
            <option value="year">{labels.year}</option><option value="custom">{labels.custom}</option>
          </select></label>
          {range === 'custom' && <div className="dh-custom-range">
            <label>{labels.from}<input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })}/></label>
            <label>{labels.to}<input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })}/></label>
            <button type="button" onClick={onApply}>{labels.apply}</button>
          </div>}
        </div>}>
        {monthSeries.length ? <div className="dh-chart dh-chart-tall">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthSeries} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false}/>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick}/>
              <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{ fontSize: 11, color: MUTED }}/>
              <Line type="monotone" dataKey="members" name={labels.members} stroke={MAROON} strokeWidth={2.5} dot={{ r: 3, fill: GOLD, stroke: MAROON, strokeWidth: 2 }} activeDot={{ r: 5, fill: GOLD, stroke: MAROON, strokeWidth: 2 }} animationDuration={700}/>
              <Line type="monotone" dataKey="registrations" name={labels.registrations} stroke={GOLD_DEEP} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5, fill: GOLD_DEEP }} animationDuration={700}/>
            </LineChart>
          </ResponsiveContainer>
        </div> : <Empty text={noData}/>}
      </Panel>

      <Panel kicker={labels.members} title={labels.memberStatus}>
        {donutTotal ? <div className="dh-chart dh-chart-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={memberDonut} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} strokeWidth={0} animationDuration={700}>
                {memberDonut.map((d) => <Cell key={d.name} fill={d.color}/>)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
          <div className="dh-donut-center"><b>{donutTotal.toLocaleString()}</b><span>{labels.members}</span></div>
        </div> : <Empty text={noData}/>}
      </Panel>
    </div>

    {/* Row 2 — registration bar + leadership horizontal bar */}
    <div className="dh-analytics-row">
      <Panel kicker={labels.registrations} title={labels.eventRegistrations}>
        {regByEvent?.length ? <div className="dh-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regByEvent.slice(0, 8)} margin={{ top: 12, right: 12, bottom: 40, left: -18 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false}/>
              <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={54}/>
              <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Bar dataKey="total" name={labels.registrationsTotal} fill={MAROON} radius={[5, 5, 0, 0]} animationDuration={700}>
                {regByEvent.slice(0, 8).map((d, i) => <Cell key={d.eventId || i} fill={i === 0 ? MAROON : MAROON_2}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div> : <Empty text={noData}/>}
      </Panel>

      <Panel kicker={labels.leaders} title={labels.leadershipDist}>
        {leadershipBars.length ? <div className="dh-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadershipBars} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 5" horizontal={false}/>
              <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" width={96} axisLine={false} tickLine={false} tick={{ ...axisTick, fontSize: 10 }}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Bar dataKey="count" name={labels.leaders} radius={[0, 5, 5, 0]} barSize={16} animationDuration={700}/>
            </BarChart>
          </ResponsiveContainer>
        </div> : <Empty text={noData}/>}
      </Panel>
    </div>

    {/* Row 3 — event status pie + monthly registration area */}
    <div className="dh-analytics-row">
      <Panel kicker={labels.events} title={labels.eventStatus}>
        {eventPie.length ? <div className="dh-chart dh-chart-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={eventPie} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="82%" paddingAngle={3} strokeWidth={0} animationDuration={700}>
                {eventPie.map((d, i) => <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
          <div className="dh-donut-center"><b>{eventPie.reduce((s, d) => s + d.value, 0).toLocaleString()}</b><span>{labels.events}</span></div>
        </div> : <Empty text={noData}/>}
      </Panel>

      <Panel kicker={labels.registrations} title={labels.regActivity}>
        {monthSeries.length ? <div className="dh-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthSeries} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="regAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MAROON} stopOpacity={0.28}/>
                  <stop offset="100%" stopColor={MAROON} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false}/>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick}/>
              <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Area type="monotone" dataKey="registrations" name={labels.registrations} stroke={MAROON} strokeWidth={2.5} fill="url(#regAreaFill)" dot={{ r: 3, fill: GOLD, stroke: MAROON, strokeWidth: 2 }} activeDot={{ r: 5 }} animationDuration={800}/>
            </AreaChart>
          </ResponsiveContainer>
        </div> : <Empty text={noData}/>}
      </Panel>
    </div>
  </div>;
}
