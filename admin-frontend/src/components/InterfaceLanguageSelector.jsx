import { UI_LANGUAGES } from '../i18n/adminInterface';

export default function InterfaceLanguageSelector({ lang, onChange, label }) {
  return (
    <div className="admin-language" role="group" aria-label={label}>
      {UI_LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          lang={item.code}
          aria-pressed={lang === item.code}
          className={`admin-language-button${lang === item.code ? ' active' : ''}`}
          onClick={() => onChange(item.code)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
