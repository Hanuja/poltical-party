import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Check, ChevronDown, Globe } from 'lucide-react'

export default function LanguageSwitcher({ dark = false }) {
  const { language, languages, changeLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const select = (code) => {
    changeLanguage(code)
    setOpen(false)
    // Reload content in the new language where the page depends on fetched data
    navigate(0)
  }

  const current = languages.find(l => l.code === language) || languages[0]

  return (
    <div className="lang-switcher" ref={ref} style={{ position: 'relative' }}>
      <button
        className="lang-switcher-btn"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: dark ? '1px solid rgba(255,255,255,.4)' : '1px solid var(--color-gray-300)',
          color: dark ? '#fff' : 'var(--color-text)',
          borderRadius: 'var(--radius-sm)', padding: '6px 12px',
          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Globe size={16} />
        <span>{current.native}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <ul role="listbox" className="slide-down" style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 1000,
          background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', listStyle: 'none', margin: 0, padding: 6, minWidth: 150,
        }}>
          {languages.map(l => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === language}
                onClick={() => select(l.code)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 12px', border: 'none', background: 'transparent',
                  borderRadius: 4, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-cream)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>{l.native} <small style={{ color: 'var(--color-text-muted)' }}>({l.label})</small></span>
                {l.code === language && <Check size={15} color="var(--color-primary)" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
