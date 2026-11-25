// Registration availability helpers shared by the Events card, Event Details page and the Register popup.
// The status string comes from the Events API (backend/helpers/registration.php → reg_event_open):
//   open | NOT_YET_OPEN | REGISTRATION_CLOSED | EVENT_COMPLETED | EVENT_CANCELLED | FULL | NOT_PUBLISHED
// `stage` is the lifecycle stage computed server-side: upcoming | registration_open |
// registration_closed | completed | cancelled.

export const isRegistrationOpen = (status) => !status || status === 'open'

/** Short label for a button or badge — null when registration is open. */
export function registrationLabel(status, T, stage) {
  if (isRegistrationOpen(status)) return null
  if (status === 'NOT_YET_OPEN') return T('upcomingReg')
  if (status === 'FULL') return T('registrationFull')
  return T('registrationClosed') // closed AND completed both read "Registration Closed"
}

/** Title + explanation for the status panel inside the popup — null when registration is open. */
export function registrationNotice(status, T) {
  if (isRegistrationOpen(status)) return null
  if (status === 'NOT_YET_OPEN') return { tone: 'soon', title: T('upcomingReg'), text: T('upcomingRegHint') }
  if (status === 'FULL') return { tone: 'full', title: T('registrationFull'), text: T('FULL') }
  const text = status === 'EVENT_COMPLETED' ? T('EVENT_COMPLETED')
    : status === 'EVENT_CANCELLED' ? T('EVENT_CANCELLED')
    : ['FULL', 'EVENT_PAST', 'NOT_PUBLISHED'].includes(status) ? T(status)
    : T('REGISTRATION_CLOSED')
  return { tone: 'closed', title: status === 'EVENT_CANCELLED' ? T('EVENT_CANCELLED') : T('registrationClosed'), text }
}
