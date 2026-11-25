import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MEMBERSHIP_PLEDGES, PLEDGE_READER_COPY } from './membershipPledges'

const PAGE_SIZE = 3

export default function PledgePagination({ language = 'ta' }) {
  const [page, setPage] = useState(0)
  const copy = PLEDGE_READER_COPY[language] || PLEDGE_READER_COPY.en
  const pageCount = Math.ceil(MEMBERSHIP_PLEDGES.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const pledges = MEMBERSHIP_PLEDGES.slice(start, start + PAGE_SIZE)

  return (
    <div className="mb-pledge-reader">
      <p className="mb-pledge-intro">{copy.intro}</p>
      <ol className="mb-pledge-list mb-pledge-list-reader" aria-live="polite">
        {pledges.map((pledge, index) => (
          <li key={pledge.key} className="mb-pledge-card">
            <div className="mb-pledge-copy">
              <span className="mb-pledge-text"><strong>{start + index + 1}. {copy.pledges[pledge.key]?.title || pledge.title}:</strong> {copy.pledges[pledge.key]?.text || pledge.text}</span>
            </div>
          </li>
        ))}
      </ol>
      <nav className="mb-pledge-pagination" aria-label={copy.pagination}>
        <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label={`${copy.page} ${page === 0 ? 1 : page}`}>
          <ArrowLeft size={15} aria-hidden="true" /> <span>{copy.previous}</span>
        </button>
        <div className="mb-pledge-page-buttons">
          {Array.from({ length: pageCount }, (_, index) => (
            <button key={index} type="button" onClick={() => setPage(index)} aria-current={page === index ? 'page' : undefined} aria-label={`${copy.page} ${index + 1}`}>
              {index + 1}
            </button>
          ))}
        </div>
        <span className="mb-pledge-page-status" aria-live="polite">{page + 1} / {pageCount}</span>
        <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page === pageCount - 1} aria-label={`${copy.page} ${page === pageCount - 1 ? pageCount : page + 2}`}>
          <span>{copy.next}</span> <ArrowRight size={15} aria-hidden="true" />
        </button>
      </nav>
    </div>
  )
}
