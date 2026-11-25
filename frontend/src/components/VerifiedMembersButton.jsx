import { useEffect, useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memApi } from './membership/memApi'
import '../styles/verified-members.css'

const formatCount = (n) => {
  if (!Number.isFinite(n)) return '—'
  if (n < 1000) return n.toLocaleString('en-US')
  const compact = (value, suffix) => {
    const text = value >= 100 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')
    return `${text}${suffix}`
  }
  if (n >= 1_000_000) return compact(n / 1_000_000, 'M')
  const k = n / 1_000
  return k >= 1000 ? '1M' : compact(k, 'K')
}

export default function VerifiedMembersButton({ compact = false }) {
  const [count, setCount] = useState(null)

  useEffect(() => {
    let active = true
    const refresh = () => memApi.approvedCount()
      .then((result) => {
        const next = Number(result?.count)
        if (active && Number.isInteger(next) && next >= 0) setCount(next)
      })
      .catch(() => {})
    refresh()
    const timer = window.setInterval(refresh, 60_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  return (
    <Link
      to="/membership-count"
      className={`verified-members-button${compact ? ' is-compact' : ''}`}
      aria-label={`${count === null ? 'Loading' : count} verified members`}
      title={compact ? 'View verified member count' : undefined}
    >
      <span className="verified-members-copy">
        <span className="verified-members-number">{count === null ? '—' : formatCount(count)}</span>
        <span className="verified-members-label">{compact ? 'VERIFICATION COUNT' : 'VERIFIED MEMBERS'}</span>
      </span>
      <BadgeCheck size={compact ? 19 : 22} strokeWidth={2.2} aria-hidden="true" />
    </Link>
  )
}
