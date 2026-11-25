import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { UI_LANGUAGES } from '../i18n/adminInterface';

export default function InterfaceLanguageSelector({ lang, onChange, label }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const selected = UI_LANGUAGES.find((item) => item.code === lang) || UI_LANGUAGES[1];

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const closeEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  const choose = (code) => { onChange(code); setOpen(false); };

  return (
    <div className="admin-language" ref={root}>
      <button
        type="button"
        className="admin-language-button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={15} aria-hidden="true" />
        <span lang={selected.code}>{selected.nativeName}</span>
        <ChevronDown size={14} aria-hidden="true" className={open ? 'is-open' : ''} />
      </button>
      {open && (
        <div className="admin-language-menu" role="listbox" aria-label={label}>
          {UI_LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              role="option"
              lang={item.code}
              aria-selected={lang === item.code}
              className={`admin-language-option${lang === item.code ? ' active' : ''}`}
              onClick={() => choose(item.code)}
            >
              {item.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
