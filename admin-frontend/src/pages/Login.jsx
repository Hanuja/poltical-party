import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api, { setSession } from '../lib/api';
import { translations, LANGUAGES, LANG_KEY, getInitialLang, saveLang } from '../i18n/translations';
import '../App.css';

export default function Login() {
  const [lang, setLang] = useState(getInitialLang());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.className = `lang-${lang}`;
  }, [lang]);

  const switchLang = (code) => {
    setLang(code);
    saveLang(code);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError(t.requiredFields);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      const { token, user } = res.data.data;
      setSession(token, user, remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      setError(status === 401 ? t.invalidLogin : (msg || t.loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Language switcher */}
      <div className="lang-switcher">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`lang-btn ${lang === l.code ? 'active' : ''}`}
            onClick={() => switchLang(l.code)}
            aria-pressed={lang === l.code}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Left branding panel */}
      <aside className="brand-panel">
        <div className="brand-decor" aria-hidden="true">
          <span className="decor-circle c1" />
          <span className="decor-circle c2" />
          <span className="decor-circle c3" />
        </div>
        <div className="brand-inner">
          <img src="/images/logo.png" alt="Party logo" className="brand-logo" />
          <div className="rise-word">RISE</div>
          <div className="portal-title">Governance Hub</div>
          <p className="portal-subtitle">{t.portalTagline}</p>
          <div className="brand-divider" />
          <p className="brand-identity">{t.identity}</p>
          <p className="brand-values">{t.values}</p>
        </div>
        <footer className="brand-footer">{t.footer}</footer>
      </aside>

      {/* Right login panel */}
      <main className="login-panel">
        <form className="login-card" onSubmit={submit} noValidate>
          <h1 className="login-heading">{t.welcome}</h1>
          <p className="login-desc">{t.description}</p>

          <label className="field">
            <span>{t.username}</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.usernamePlaceholder}
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>{t.password}</span>
            <div className="pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? t.hidePassword : t.showPassword}
                title={showPw ? t.hidePassword : t.showPassword}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="form-row">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <span>{t.rememberMe}</span>
            </label>
            <a href="#" className="forgot" onClick={(e) => e.preventDefault()}>
              {t.forgotPassword}
            </a>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button type="submit" className="btn-signin" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : null}
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>
      </main>
    </div>
  );
}
