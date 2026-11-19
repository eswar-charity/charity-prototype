import { Navigate } from 'react-router-dom'
import { openKeysFor, openSteps } from './wizard/helpers.js'

/** Where "Resume" goes: the saved step, the first flagged step in fix mode, or step 1 for a rejected event. */
export function editLink(ev) {
  if (ev.status === 'Rejected') return { to: `/se/create/${ev.key}/1`, label: 'Edit and resubmit' }
  if (ev.status === 'Changes Requested') return { to: `/se/create/${ev.key}/${openSteps(openKeysFor(ev))[0]}`, label: 'Fix and resubmit' }
  return { to: `/se/create/${ev.key}/${Math.min(4, ev.wizardStep ?? 1)}`, label: 'Resume' }
}

/** The old drafts page now lives in the events console: same place, with search, filters and pagination. */
export default function DraftsRedirect() {
  return <Navigate to="/se?tab=drafts" replace />
}
