import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { EVENT_STATUSES, eventTotals, startsAt } from '../../domain/engine.js'
import { coverOf, notificationsFor, seEvents, timing } from '../../domain/selectors.js'
import { Empty, PageHeader, Section, Stat, StatRow, StatusBadge, dollars, plural, timeAgo } from '../../ui/kit.jsx'
import { manageLink, npNameOf, whenText } from './common.jsx'

/** Live events that are running now or still to come: running first, then the soonest. Ended ones drop off. */
function upcomingEvents(s, events) {
  const rank = { live: 0, upcoming: 1 }
  return events
    .filter((e) => e.status === 'Live' && timing(s, e) !== 'ended')
    .sort((a, b) => rank[timing(s, a)] - rank[timing(s, b)] || (startsAt(a) ?? 0) - (startsAt(b) ?? 0))
}

export default function SeHome() {
  const s = useDomain()
  const act = useAct()
  const { user, now } = useSession()
  const mine = seEvents(s, user.id)
  const upcoming = upcomingEvents(s, mine).slice(0, 5)
  const attention = mine.filter((e) => ['Changes Requested', 'Rejected'].includes(e.status))
  const public_ = mine.filter((e) => ['Live', 'Completed', 'Archived'].includes(e.status))
  const raised = public_.reduce((t, e) => t + eventTotals(s, e.key).raised, 0)
  const going = public_.reduce((t, e) => t + eventTotals(s, e.key).joined, 0)
  const notes = notificationsFor(s, user.id).slice(0, 4)
  const groups = EVENT_STATUSES.map((status) => ({ status, items: mine.filter((e) => e.status === status) })).filter((g) => g.items.length)

  return (
    <>
      <PageHeader
        eyebrow="Social entrepreneur"
        title={`Hi ${user.name.split(' ')[0]}`}
        lede="Run your events from here: create, fix, go live and thank everyone."
        actions={<Link className="ch-btn ch-btn--primary" to="/se/create"><Plus size={18} aria-hidden="true" /> Create an event</Link>}
      />

      <StatRow label="Your totals">
        <Stat label="Events" value={mine.length} hint={`${mine.filter((e) => e.status === 'Live').length} live now`} />
        <Stat label="Raised" value={dollars(raised)} hint="Across live and finished events" />
        <Stat label="People going" value={going} />
        <Stat label="Need your attention" value={attention.length} />
      </StatRow>

      <Section title="Upcoming events" id="se-next" aside={upcoming.length > 0 && <span className="ch-muted">Showing {upcoming.length} of your running and upcoming events</span>}>
        {upcoming.length > 0 ? (
          <ul className="se-up">
            {upcoming.map((e) => {
              const t = eventTotals(s, e.key)
              const phase = timing(s, e)
              return (
                <li key={e.key} className="se-up__item">
                  {coverOf(e) ? <img className="se-up__img" src={coverOf(e)} alt="" /> : <div className="se-up__img" />}
                  <div className="se-up__main">
                    <div className="row"><StatusBadge status={e.status} /><span className="ch-muted">{phase === 'live' ? 'Happening now' : 'Coming up'}</span></div>
                    <h3 className="h-heading-sm">{e.title}</h3>
                    <p className="ch-muted">{whenText(e)} · {e.location}</p>
                    <p className="ch-muted"><strong>{dollars(t.raised)}</strong> raised · {t.joined} going</p>
                  </div>
                  <div className="se-up__actions">
                    <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/se/live/${e.key}`}>Live dashboard</Link>
                    <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${e.key}`}>Public page</Link>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty title="No event is running or coming up." action={<Link className="ch-btn ch-btn--primary" to="/se/create">Create an event</Link>}>
            When an event goes live, its numbers and check-in tools show up here.
          </Empty>
        )}
      </Section>

      {attention.length > 0 && (
        <Section title="Needs your attention" id="se-attention">
          <ul className="se-attn">
            {attention.map((e) => (
              <li key={e.key}>
                <div className="stack">
                  <div className="row"><strong>{e.title}</strong><StatusBadge status={e.status} /></div>
                  <p className="ch-muted">{e.status === 'Rejected' ? e.review?.reason : e.review?.feedback}</p>
                </div>
                <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/se/approval/${e.key}`}>{e.status === 'Rejected' ? 'See why' : 'See what to change'}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid-2c">
        <Section title="My events" id="se-events" aside={<Link className="link-btn" to="/se/drafts">Drafts and all events</Link>}>
          {groups.length === 0 ? (
            <Empty title="You have not created an event yet." action={<Link className="ch-btn ch-btn--primary" to="/se/create">Create your first event</Link>} />
          ) : groups.map((g) => (
            <div key={g.status} className="se-group">
              <h3 className="se-h3">{g.status} <span className="ch-muted">({g.items.length})</span></h3>
              <ul className="se-rows">
                {g.items.map((e) => {
                  const m = manageLink(e)
                  return (
                    <li key={e.key}>
                      <span className="se-rows__main"><strong>{e.title}</strong><span className="ch-muted">{npNameOf(s, e)} · {whenText(e)}</span></span>
                      <Link className="link-btn" to={m.to} aria-label={`${m.label}: ${e.title}`}>{m.label}</Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Recent notifications" id="se-notes" aside={<Link className="link-btn" to="/notifications">See all</Link>}>
          {notes.length === 0 ? <p className="ch-muted">Nothing yet.</p> : (
            <ul className="se-rows">
              {notes.map((n) => (
                <li key={n.id}>
                  <span className="se-rows__main">
                    <strong>{n.title}{!n.read && <span className="badge badge--info se-new">New</span>}</strong>
                    <span className="ch-muted">{n.body}</span>
                    <span className="ch-muted se-time">{timeAgo(n.createdAt, now)}</span>
                  </span>
                  {n.link?.startsWith('/') && <Link className="link-btn" to={n.link} onClick={() => act('markNotificationRead', { id: n.id })}>Open</Link>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}
