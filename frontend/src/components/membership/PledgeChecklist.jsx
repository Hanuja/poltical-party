import { MEMBERSHIP_PLEDGES, PLEDGE_READER_COPY } from './membershipPledges'

export default function PledgeChecklist({ values, onChange, className = '', language = 'ta' }) {
  const copy = PLEDGE_READER_COPY[language] || PLEDGE_READER_COPY.en
  return (
    <ol className={`mb-pledge-list ${className}`.trim()}>
      {MEMBERSHIP_PLEDGES.map((pledge, index) => {
        const translated = copy.pledges[pledge.key] || pledge
        return (
          <li key={pledge.key} className="mb-pledge-card">
            <label className="mb-pledge-label">
              <input
                type="checkbox"
                checked={!!values[pledge.key]}
                onChange={(event) => onChange(pledge.key, event.target.checked)}
                aria-label={`${index + 1}. ${translated.accept || pledge.label}`}
              />
              <span className="mb-pledge-copy">
                <span className="mb-pledge-accept">{translated.accept || pledge.label}</span>
                <span className="mb-pledge-text"><strong>{index + 1}. {translated.title}:</strong> {translated.text}</span>
              </span>
            </label>
          </li>
        )
      })}
    </ol>
  )
}
