import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X, UserRound } from 'lucide-react';

const STR = {
  en: {
    title: 'Delete leader profile?',
    body: 'This removes the profile from the admin list and from the public website. It cannot be undone from the admin panel.',
    live: 'This profile is currently live on the website.',
    type: 'Type DELETE to confirm',
    cancel: 'Cancel', confirm: 'Delete profile', deleting: 'Deleting…',
    failed: 'Delete failed. Please try again.',
  },
  ta: {
    title: 'தலைவர் சுயவிவரத்தை நீக்கவா?',
    body: 'இது சுயவிவரத்தை நிர்வாகப் பட்டியலிலிருந்தும் பொது இணையதளத்திலிருந்தும் நீக்கும். நிர்வாகப் பலகத்திலிருந்து இதைத் திரும்பப் பெற முடியாது.',
    live: 'இந்தச் சுயவிவரம் தற்போது இணையதளத்தில் நேரலையில் உள்ளது.',
    type: 'உறுதிப்படுத்த DELETE என தட்டச்சு செய்யவும்',
    cancel: 'ரத்து செய்', confirm: 'சுயவிவரத்தை நீக்கு', deleting: 'நீக்குகிறது…',
    failed: 'நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
  },
  si: {
    title: 'නායක පැතිකඩ මකන්නද?',
    body: 'මෙය පැතිකඩ පරිපාලන ලැයිස්තුවෙන් සහ පොදු වෙබ් අඩවියෙන් ඉවත් කරයි. පරිපාලන පුවරුවෙන් මෙය අහෝසි කළ නොහැක.',
    live: 'මෙම පැතිකඩ දැනට වෙබ් අඩවියේ සජීවීව ඇත.',
    type: 'තහවුරු කිරීමට DELETE ලෙස ටයිප් කරන්න',
    cancel: 'අවලංගු කරන්න', confirm: 'පැතිකඩ මකන්න', deleting: 'මකමින්…',
    failed: 'මැකීම අසාර්ථක විය. නැවත උත්සාහ කරන්න.',
  },
};

// Confirmation modal: the destructive button stays disabled until the admin types DELETE.
export default function DeleteLeaderModal({ leader, name, lang = 'en', onCancel, onConfirm }) {
  const s = STR[lang] || STR.en;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const armed = text.trim().toUpperCase() === 'DELETE';

  const submit = async (e) => {
    e.preventDefault();
    if (!armed || busy) return;
    setBusy(true); setError('');
    try {
      await onConfirm();
    } catch {
      setError(s.failed);
      setBusy(false);
    }
  };

  return (
    <div className="lm-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <form className="lm-modal" role="alertdialog" aria-modal="true" aria-labelledby="lm-del-title" onSubmit={submit}>
        <button type="button" className="lm-modal-x" onClick={onCancel} disabled={busy} aria-label={s.cancel}><X size={18} /></button>
        <div className="lm-modal-icon"><AlertTriangle size={26} /></div>
        <h2 id="lm-del-title">{s.title}</h2>
        <div className="lm-modal-who">
          {leader.imageUrl ? <img src={leader.imageUrl} alt="" /> : <span className="lm-avatar-empty"><UserRound size={22} /></span>}
          <strong>{name || '—'}</strong>
        </div>
        <p>{s.body}</p>
        {leader.status === 'published' && <p className="lm-modal-live">{s.live}</p>}
        <label className="lm-modal-type">
          <span>{s.type}</span>
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck="false" placeholder="DELETE" disabled={busy} />
        </label>
        {error && <p className="lm-modal-err" role="alert">{error}</p>}
        <div className="lm-modal-actions">
          <button type="button" className="lm-btn lm-btn-ghost" onClick={onCancel} disabled={busy}>{s.cancel}</button>
          <button type="submit" className="lm-btn lm-btn-danger" disabled={!armed || busy}>
            <Trash2 size={16} /> {busy ? s.deleting : s.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}
