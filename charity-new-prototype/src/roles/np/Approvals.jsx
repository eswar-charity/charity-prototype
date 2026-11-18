import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { PageHeader, Empty, Tabs, StatusBadge, fmtDate, plural } from '../../ui/kit.jsx'
import { npEvents, npQueue } from '../../domain/selectors.js'
import { Cover, ageLabel, daysSince, useNp, whenOf } from './shared.jsx'

const DECISION = { approved: 'Approved', rejected: 'Rejected', changes_requested: 'Changes requested' }

/** Events this nonprofit has already decided on (autopilot decisions live on the autopilot page). */
export const decidedEvents = (s, npId) =>
  npEvents(s, npId)
    .filter((e) => !['Submitted', 'Draft'].includes(e.status) && e.review && DECISION[e.review.decision])
    .sort((a, b) => new Date(b.review.at) - new Date(a.review.at))

export default function Approvals() {
  const { s, now, np } = useNp()
  const [tab, setTab] = useState('waiting')
  const queue = npQueue(s, np.id)
  const decided = decidedEvents(s, np.id)

  return (
    <>
      <PageHeader eyebrow="Approvals" title="Events waiting for you" lede="Organizers submit events for your nonprofit. Approve, send back with notes, or decline." />
      <Tabs label="Approvals" value={tab} onChange={setTab} tabs={[{ id: 'waiting', label: 'Waiting', count: queue.length }, { id: 'decided', label: 'Decided', count: decided.length }]} />

      {tab === 'waiting' && (
        <div role="tabpanel" id="panel-waiting" aria-labelledby="tab-waiting">
          {queue.length === 0 ? (
            <Empty title="Nothing is waiting">When an organizer submits an event for {np.name}, it shows up here.</Empty>
          ) : (
            <ul className="np-queue">
              {queue.map((ev) => {
                const org = s.users[ev.organizerId]
                const days = daysSince(ev.submittedAt, now)
                return (
                  <li key={ev.key} className="np-queue__item">
                    <Cover ev={ev} className="np-cover np-cover--lg" />
                    <div className="np-queue__body">
                      <h2 className="np-queue__title">{ev.title}</h2>
                      <p className="ch-muted">By {org?.name ?? 'Unknown organizer'}</p>
                      <p className="np-meta"><CalendarDays size={16} aria-hidden="true" /> {whenOf(ev) || 'Date not set'}</p>
                      <p className="np-meta"><MapPin size={16} aria-hidden="true" /> {ev.location || 'Place not set'}</p>
                      <p className="np-excerpt">{ev.story}</p>
                      <p className="ch-muted gate-fine">Submitted {fmtDate(ev.submittedAt)} · {ageLabel(days)}</p>
                    </div>
                    <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/np/approvals/${ev.key}`} aria-label={`Review ${ev.title}`}>Review</Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {tab === 'decided' && (
        <div role="tabpanel" id="panel-decided" aria-labelledby="tab-decided">
          {decided.length === 0 ? (
            <Empty title="No decisions yet">Events you approve, decline or send back appear here.</Empty>
          ) : (
            <ul className="np-queue">
              {decided.map((ev) => {
                const org = s.users[ev.organizerId]
                const r = ev.review
                return (
                  <li key={ev.key} className="np-queue__item">
                    <Cover ev={ev} className="np-cover np-cover--lg" />
                    <div className="np-queue__body">
                      <h2 className="np-queue__title">{ev.title}</h2>
                      <p className="ch-muted">By {org?.name ?? 'Unknown organizer'}</p>
                      <p className="row"><StatusBadge status={ev.status} /> <span>{DECISION[r.decision]} on {fmtDate(r.at)}</span></p>
                      {r.reason && <p className="np-excerpt">Reason: {r.reason}</p>}
                      {r.feedback && <p className="np-excerpt">Asked for: {r.areas.join(', ')}. {r.feedback}</p>}
                    </div>
                    <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/np/approvals/${ev.key}`} aria-label={`View ${ev.title}`}>View</Link>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="ch-muted gate-fine">{plural(decided.length, 'decision')} so far. Events approved by autopilot are on the <Link to="/np/settings/autopilot">autopilot page</Link>.</p>
        </div>
      )}
    </>
  )
}
