import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { EVENT_STATUSES, eventTotals, startsAt } from '../../domain/engine.js'
import { coverOf, notificationsFor, seEvents, timing } from '../../domain/selectors.js'
import { Empty, PageHeader, Section, Stat, StatRow, StatusBadge, dollars, plural, timeAgo } from '../../ui/kit.jsx'
import { manageLink, npNameOf, whenText } from './common.jsx'

/** Running events first, then the soonest upcoming, then ones past their end time. */
function nextEvent(s, events) {
  const rank = { live: 0, upcoming: 1, ended: 2 }
  return events
    .filter((e) => e.status === 'Live')
    .sort((a, b) => rank[timing(s, a)] - rank[timing(s, b)] || (startsAt(a) ?? 0) - (startsAt(b) ?? 0))[0] ?? null
}

export default function SeHome() {
  const s = useDomain()
  const act = useAct()
  const { user, now } = useSession()
  const mine = seEvents(s, user.id)
  const next = nextEvent(s, mine)
  const attention = mine.filter((e) => ['Changes Requested', 'Rejected'].includes(e.status))
  const public_ = mine.filter((e) => ['Live', 'Completed', 'Archived'].includes(e.status))
  const raised = public_.reduce((t, e) => t + eventTotals(s, e.key).raised, 0)
  const going = public_.reduce((t, e) => t + eventTotals(s, e.key).joined, 0)
  const notes = notificationsFor(s, user.id).slice(0, 4)
  const groups = EVENT_STATUSES.map((status) => ({ status, items: mine.filter((e) => e.status === status) })).filter((g) => g.items.length)
  const nextTotals = next ? eventTotals(s, next.key) : null
  const when = next ? { live: 'Happening now', upcoming: 'Coming up', ended: 'Past its end time' }[timing(s, next)] : ''

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

      <Section title="Your next event" id="se-next">
        {next ? (
          <article className="se-next">
            {coverOf(next) ? <img className="se-next__img" src={coverOf(next)} alt="" /> : <div className="se-next__img" />}
            <div className="stack">
              <div className="row"><StatusBadge status={next.status} /><span className="ch-muted">{when}</span></div>
              <h3 className="h-heading">{next.title}</h3>
              <p className="ch-muted">{whenText(next)} · {next.location}</p>
              <p><strong>{dollars(nextTotals.raised)}</strong> raised from {plural(nextTotals.backed, 'backer')} · {nextTotals.joined} going</p>
              <div className="row">
                <Link className="ch-btn ch-btn--primary" to={`/se/live/${next.key}`}>Open live dashboard</Link>
                <Link className="ch-btn ch-btn--secondary" to={`/events/${next.key}`}>Public page</Link>
              </div>
            </div>
          </article>
        ) : (
          <Empty title="No event is live right now." action={<Link className="ch-btn ch-btn--primary" to="/se/create">Create an event</Link>}>
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
