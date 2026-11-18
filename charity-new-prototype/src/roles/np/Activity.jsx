import { Link } from 'react-router-dom'
import { PageHeader, Section, Empty, Stat, StatRow, StatusBadge, dollars, centsToDollars, fmtDate, plural } from '../../ui/kit.jsx'
import { npEvents, npStats } from '../../domain/selectors.js'
import { eventTotals } from '../../domain/engine.js'
import { npDonations, useNp } from './shared.jsx'

/** Supporters grouped by public name. Anonymous gifts are pooled so nobody is identified. */
export function supportersOf(donations) {
  const map = new Map()
  donations.filter((d) => ['Successful', 'Disputed'].includes(d.status)).forEach((d) => {
    const name = d.anonymous ? 'Anonymous' : d.publicName
    const row = map.get(name) ?? { name, gifts: 0, cents: 0, anonymous: !!d.anonymous }
    row.gifts += 1; row.cents += d.amountCents
    map.set(name, row)
  })
  return [...map.values()].sort((a, b) => b.cents - a.cents)
}

export default function Activity() {
  const { s, np } = useNp()
  const stats = npStats(s, np.id)
  const events = npEvents(s, np.id).filter((e) => ['Live', 'Completed', 'Archived', 'Blocked'].includes(e.status))
  const donations = npDonations(s, np.id)
  const supporters = supportersOf(donations)
  const rows = events.map((ev) => ({ ev, t: eventTotals(s, ev.key) })).sort((a, b) => b.t.raised - a.t.raised)

  return (
    <>
      <PageHeader eyebrow="Activity" title="How your events are doing" lede="Totals, supporters and updates across every event that supports you."
        actions={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np/financials">Open financials</Link>} />

      <StatRow label="Totals">
        <Stat label="Raised" value={dollars(stats.raised)} hint="Includes demo history" />
        <Stat label="Backers" value={stats.backed} />
        <Stat label="People going" value={stats.joined} />
        <Stat label="Events" value={stats.events} />
      </StatRow>

      <Section id="per-event" title="Totals by event">
        {rows.length === 0 ? <Empty title="No events yet">Totals appear once an event is live.</Empty> : (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Totals by event table">
            <table className="table">
              <thead><tr><th scope="col">Event</th><th scope="col">Status</th><th scope="col" className="num">Raised</th><th scope="col" className="num">Backers</th><th scope="col" className="num">Going</th><th scope="col" className="num">Updates</th></tr></thead>
              <tbody>
                {rows.map(({ ev, t }) => (
                  <tr key={ev.key}>
                    <th scope="row" className="np-rowhead"><Link to={['Live', 'Completed', 'Archived'].includes(ev.status) ? `/events/${ev.key}` : '/np/events'}>{ev.title}</Link></th>
                    <td><StatusBadge status={ev.status} /></td>
                    <td className="num">{dollars(t.raised)}</td>
                    <td className="num">{t.backed}</td>
                    <td className="num">{t.joined}</td>
                    <td className="num">{t.updates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section id="supporters" title="Supporters" aside={<span className="ch-muted">Anonymous gifts stay anonymous.</span>}>
        {supporters.length === 0 ? <Empty title="No supporters yet">People who give to your events are listed here.</Empty> : (
          <ul className="np-list">
            {supporters.map((p) => (
              <li key={p.name} className="np-list__item">
                <div>
                  <p className="np-list__title">{p.name}</p>
                  <p className="ch-muted">{plural(p.gifts, 'gift')}</p>
                </div>
                <strong>{centsToDollars(p.cents)}</strong>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="latest" title="Latest gifts">
        {donations.length === 0 ? <Empty title="No gifts yet" /> : (
          <ul className="np-list">
            {donations.slice(0, 8).map((d) => (
              <li key={d.id} className="np-list__item">
                <div>
                  <p className="np-list__title">{d.publicName} · {centsToDollars(d.amountCents)}</p>
                  <p className="ch-muted">{s.events[d.eventKey]?.title ?? d.eventKey} · {fmtDate(d.paidAt ?? d.createdAt)}</p>
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
