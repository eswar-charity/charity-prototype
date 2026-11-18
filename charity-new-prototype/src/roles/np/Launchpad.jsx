import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, Circle } from 'lucide-react'
import { PageHeader, Section, Empty, Stat, StatRow, StatusBadge, dollars, centsToDollars, timeAgo, plural } from '../../ui/kit.jsx'
import { npEvents, npQueue, npSetupSteps, npStats } from '../../domain/selectors.js'
import { eventTotals } from '../../domain/engine.js'
import { LivePill } from '../../components/Brand.jsx'
import { Cover, npDonations, useNp, whenOf } from './shared.jsx'

export default function Launchpad() {
  const { s, user, now, np } = useNp()
  const steps = npSetupSteps(np)
  const done = steps.filter((x) => x.done).length
  const stats = npStats(s, np.id)
  const queue = npQueue(s, np.id)
  const live = npEvents(s, np.id).filter((e) => e.status === 'Live')
  const reupload = np.documents.filter((d) => d.status === 'Reupload')
  const stripeOpen = np.stripe.state !== 'connected'
  const recent = npDonations(s, np.id, (d) => d.status === 'Successful').slice(0, 5)
  const blocked = ['Suspended', 'Rejected'].includes(np.status)

  const actions = []
  if (queue.length) actions.push({ id: 'approvals', to: '/np/approvals', title: `${plural(queue.length, 'event')} waiting for your approval`, hint: 'Organizers are waiting on your decision.', cta: 'Review events' })
  reupload.forEach((d) => actions.push({ id: `doc-${d.id}`, to: '/np/setup', title: `Re-upload: ${d.label}`, hint: d.note || 'Charity Hub asked for a new file.', cta: 'Upload again' }))
  if (stripeOpen) actions.push({ id: 'stripe', to: '/np/setup', title: np.stripe.state === 'incomplete' ? 'Finish connecting Stripe' : 'Connect Stripe', hint: 'Supporters can give once payments are set up.', cta: 'Open setup' })

  return (
    <>
      <PageHeader eyebrow={np.name} title={`Hello, ${user.name.split(' ')[0]}`} lede="Your approvals, live events and giving at a glance."
        actions={<Link className="ch-btn ch-btn--primary ch-btn--sm" to="/np/events/new">Create an event</Link>} />

      {blocked && (
        <p className="np-banner np-banner--danger" role="status">
          <strong>{np.status === 'Suspended' ? 'Your nonprofit is suspended.' : 'Your nonprofit was not approved.'}</strong>{' '}
          {np.status === 'Suspended' ? 'Live events are paused and new gifts are held until Charity Hub reinstates you.' : 'Contact Charity Hub to talk it through.'}
        </p>
      )}

      {done < steps.length && (
        <Section id="setup" title="Finish setup" aside={<span className="ch-muted">{done} of {steps.length} steps done</span>}>
          <Link to="/np/setup" className="np-nudge">
            <span className="np-nudge__text">
              <strong>Finish setup ({done} of {steps.length})</strong>
              <span className="ch-muted">Next: {steps.find((x) => !x.done).label.toLowerCase()}.</span>
            </span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <ol className="np-steps np-steps--compact" aria-label="Setup steps">
            {steps.map((x) => (
              <li key={x.id} className={x.done ? 'is-done' : ''}>
                {x.done ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                <span>{x.label}</span>
                <span className="np-sr">{x.done ? 'Done' : 'To do'}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <StatRow label="Your totals">
        <Stat label="Events" value={stats.events} hint="Live, completed or archived" />
        <Stat label="Raised" value={dollars(stats.raised)} hint="Across your events (demo data)" />
        <Stat label="Backers" value={stats.backed} />
        <Stat label="People going" value={stats.joined} />
      </StatRow>

      <div className="grid-2c">
        <Section id="actions" title="Needs you">
          {actions.length === 0 ? <Empty title="Nothing needs you right now">Approvals, documents and payment setup show up here when they need attention.</Empty> : (
            <ul className="np-list">
              {actions.map((a) => (
                <li key={a.id} className="np-list__item">
                  <div>
                    <p className="np-list__title">{a.title}</p>
                    <p className="ch-muted">{a.hint}</p>
                  </div>
                  <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={a.to}>{a.cta}</Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section id="live" title="Live events">
          {live.length === 0 ? <Empty title="No events are live">Approve a submitted event or create your own and it appears here.</Empty> : (
            <ul className="np-list">
              {live.map((ev) => {
                const t = eventTotals(s, ev.key)
                return (
                  <li key={ev.key} className="np-list__item np-list__item--media">
                    <Cover ev={ev} />
                    <div className="np-grow">
                      <p className="np-list__title">{ev.title} <LivePill /></p>
                      <p className="ch-muted">{whenOf(ev)}</p>
                      <p className="ch-muted">{dollars(t.raised)} raised · {plural(t.joined, 'person', 'people')} going</p>
                    </div>
                    <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/np/live/${ev.key}`} aria-label={`Manage ${ev.title} live`}>Manage live</Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>

      <Section id="recent" title="Recent donations" aside={<Link to="/np/financials">See financials</Link>}>
        {recent.length === 0 ? <Empty title="No donations yet">Gifts to your events will be listed here.</Empty> : (
          <ul className="np-list">
            {recent.map((d) => (
              <li key={d.id} className="np-list__item">
                <div>
                  <p className="np-list__title">{d.publicName} gave {centsToDollars(d.amountCents)}</p>
                  <p className="ch-muted">{s.events[d.eventKey]?.title ?? d.eventKey} · {timeAgo(d.paidAt ?? d.createdAt, now)}</p>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
