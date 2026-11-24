import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// Crimson "Register for Event" button with a slow gold light sweep (static when reduced motion is on).
export default function AnimatedRegisterButton({ to, children, className = '', onClick, type = 'button', disabled = false, icon = true }) {
  const inner = (
    <>
      <span className="reg-btn-sweep" aria-hidden="true" />
      <span className="reg-btn-label">{children}</span>
      {icon && <ArrowRight className="reg-btn-icon" size={18} aria-hidden="true" />}
    </>
  )
  if (to && !disabled) return <Link to={to} className={`reg-btn ${className}`} onClick={onClick}>{inner}</Link>
  return <button type={type} className={`reg-btn ${className}`} onClick={onClick} disabled={disabled}>{inner}</button>
}
