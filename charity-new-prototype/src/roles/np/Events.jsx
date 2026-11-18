import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { PageHeader, Empty, StatusBadge, dollars, plural } from '../../ui/kit.jsx'
import { npEvents } from '../../domain/selectors.js'
import { eventTotals, EVENT_STATUSES } from '../../domain/engine.js'
import { Cover, useNp, whenOf } from './shared.jsx'

function Actions({ ev, user }) {
  const own = ev.organizerId === user.id
  if (ev.status === 'Submitted') return <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/np/approvals/${ev.key}`} aria-label={`Review ${ev.title}`}>Review</Link>
  if (ev.status === 'Live') {
    return (
      <>
        <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/np/live/${ev.key}`} aria-label={`Manage ${ev.title} live`}>Manage live</Link>
        <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${ev.key}`} aria-label={`Public page for ${ev.title}`}>Public page</Link>
      </>
    )
  }
  if (ev.status === 'Draft' && own) return <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/np/events/${ev.key}/${Math.min(4, ev.wizardStep ?? 1)}`} aria-label={`Continue ${ev.title}`}>Continue</Link>
  if (['Changes Requested', 'Rejected'].includes(ev.status)) return <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/np/approvals/${ev.key}`} aria-label={`View decision on ${ev.title}`}>View decision</Link>
  return <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${ev.key}`} aria-label={`Public page for ${ev.title}`}>Public page</Link>
}

export default function Events() {
  const { s, user, np } = useNp()
  const [status, setStatus] = useState('All')
  // Other organizers' drafts are private to them, so only the nonprofit's own drafts show here.
  const all = npEvents(s, np.id).filter((e) => e.status !== 'Draft' || e.organizerId === user.id)
  const list = all.filter((e) => status === 'All' || e.status === status).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const present = EVENT_STATUSES.filter((x) => all.some((e) => e.status === x))

  return (
    <>
      <PageHeader eyebrow="Events" title="Events for your nonprofit" lede="Events organizers run for you, and events you run yourself."
        actions={<Link className="ch-btn ch-btn--primary ch-btn--sm" to="/np/events/new">Create an event</Link>} />

      <div className="row np-filters">
        <label className="np-filter"><span className="ch-muted">Status</span>
          <select className="ch-field__input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            {present.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <span className="ch-muted" role="status">{plural(list.length, 'event')}</span>
      </div>

      {list.length === 0 ? (
        <Empty title={all.length ? 'No events with that status' : 'No events yet'} action={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np/events/new">Create an event</Link>}>
          {all.length ? 'Try another status.' : 'Events supporting your nonprofit appear here once organizers submit them.'}
        </Empty>
      ) : (
        <ul className="np-queue">
          {list.map((ev) => {
            const t = eventTotals(s, ev.key)
            const org = s.users[ev.organizerId]
            return (
              <li key={ev.key} className="np-queue__item">
                <Cover ev={ev} className="np-cover np-cover--lg" />
                <div className="np-queue__body">
                  <h2 className="np-queue__title">{ev.title}</h2>
                  <p className="row"><StatusBadge status={ev.status} /><span className="ch-muted">{ev.kind === 'NP-led' ? 'Run by your team' : `By ${org?.name ?? 'Unknown organizer'}`}</span></p>
                  <p className="np-meta"><CalendarDays size={16} aria-hidden="true" /> {whenOf(ev) || 'Date not set'}</p>
                  <p className="np-meta"><MapPin size={16} aria-hidden="true" /> {ev.location || 'Place not set'}</p>
                  {['Live', 'Completed', 'Archived'].includes(ev.status) && <p className="ch-muted gate-fine">{dollars(t.raised)} raised · {plural(t.joined, 'person', 'people')} going</p>}
                </div>
                <div className="np-queue__actions"><Actions ev={ev} user={user} /></div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
