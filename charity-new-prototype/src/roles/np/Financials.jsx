import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { PageHeader, Section, Empty, Stat, StatRow, StatusBadge, Modal, centsToDollars, fmtDate, plural } from '../../ui/kit.jsx'
import { npDonations, useNp } from './shared.jsx'
import { derivePayouts } from './payouts.js'

const PAGE = 20
const FILTERS = ['All', 'Successful', 'Refunded', 'Disputed', 'Failed', 'Initiated']

function StripeCard({ np, balance }) {
  const [open, setOpen] = useState(false)
  const state = np.stripe.state
  return (
    <Section id="stripe" title="Stripe" aside={<StatusBadge status={state === 'connected' ? 'Ready' : state === 'incomplete' ? 'Pending' : 'Missing'}>{state === 'connected' ? 'Connected' : state === 'incomplete' ? 'Setup incomplete' : 'Not connected'}</StatusBadge>}>
      {state === 'none' && (
        <>
          <p className="ch-muted">Connect Stripe so supporters can give to your events and payouts can reach your bank.</p>
          <div><Link className="ch-btn ch-btn--primary ch-btn--sm" to="/np/setup">Connect Stripe</Link></div>
        </>
      )}
      {state === 'incomplete' && (
        <>
          <p className="ch-muted">Stripe setup was started but not finished, so gifts cannot be paid out yet.</p>
          <div><Link className="ch-btn ch-btn--primary ch-btn--sm" to="/np/setup">Finish Stripe setup</Link></div>
        </>
      )}
      {state === 'connected' && (
        <>
          <dl className="np-balance">
            <div><dt>Paid out</dt><dd>{centsToDollars(balance.paid)}</dd></div>
            <div><dt>On the way</dt><dd>{centsToDollars(balance.transit)}</dd></div>
            <div><dt>Account</dt><dd>{np.stripe.account}</dd></div>
          </dl>
          <div><button className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => setOpen(true)}><Landmark size={16} aria-hidden="true" /> Open Stripe dashboard</button></div>
        </>
      )}
      {open && (
        <Modal title="Stripe dashboard (simulated)" onClose={() => setOpen(false)} labelledBy="stripe-dash-t">
          <div className="stack">
            <p className="np-banner"><strong>Simulated screen.</strong> In the live product this opens Stripe in a new tab. Nothing here is connected to a real account.</p>
            <dl className="np-balance">
              <div><dt>Available</dt><dd>{centsToDollars(balance.paid)}</dd></div>
              <div><dt>Pending</dt><dd>{centsToDollars(balance.transit)}</dd></div>
              <div><dt>Account</dt><dd>{np.stripe.account}</dd></div>
            </dl>
            <div className="dialog-actions"><button className="ch-btn ch-btn--primary" onClick={() => setOpen(false)}>Close</button></div>
          </div>
        </Modal>
      )}
    </Section>
  )
}

export default function Financials() {
  const { s, now, np } = useNp()
  const [filter, setFilter] = useState('All')
  const [limit, setLimit] = useState(PAGE)
  const all = npDonations(s, np.id)
  const payouts = np.stripe.state === 'connected' ? derivePayouts(all, now) : []
  const balance = {
    paid: payouts.filter((p) => p.status === 'Paid').reduce((t, p) => t + p.amountCents, 0),
    transit: payouts.filter((p) => p.status === 'In transit').reduce((t, p) => t + p.amountCents, 0),
  }
  const refunds = all.filter((d) => d.status === 'Refunded')
  const held = all.filter((d) => d.status === 'Disputed')
  const shown = all.filter((d) => filter === 'All' || d.status === filter)
  const received = all.filter((d) => d.status === 'Successful').reduce((t, d) => t + d.amountCents, 0)

  return (
    <>
      <PageHeader eyebrow="Financials" title="Gifts and payouts" lede="Gifts go straight to your Stripe account. Charity Hub never holds the money." />

      <StatRow label="Money">
        <Stat label="Received" value={centsToDollars(received)} hint={`${plural(all.filter((d) => d.status === 'Successful').length, 'successful gift')}`} />
        <Stat label="Refunded" value={centsToDollars(refunds.reduce((t, d) => t + d.amountCents, 0))} hint={plural(refunds.length, 'refund')} />
        <Stat label="On hold" value={centsToDollars(held.reduce((t, d) => t + d.amountCents, 0))} hint={held.length ? `${plural(held.length, 'disputed gift')}` : 'No disputes'} />
      </StatRow>

      <StripeCard np={np} balance={balance} />

      <Section id="payouts" title="Payouts" aside={<span className="ch-muted">Weekly, paid the Wednesday after each week closes (prototype rule)</span>}>
        {np.stripe.state !== 'connected' ? <Empty title="No payouts yet" action={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np/setup">Connect Stripe</Link>}>Payouts start once Stripe is connected.</Empty>
          : payouts.length === 0 ? <Empty title="No payouts yet">Payouts appear after your first successful gift.</Empty> : (
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Payouts table">
              <table className="table">
                <thead><tr><th scope="col">Week</th><th scope="col">Gifts</th><th scope="col">Payout date</th><th scope="col">Status</th><th scope="col" className="num">Amount</th></tr></thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <th scope="row" className="np-rowhead">{fmtDate(p.weekStart)} to {fmtDate(p.weekEnd)}</th>
                      <td>{p.count}</td>
                      <td>{fmtDate(p.payoutDate)}</td>
                      <td><span className={`badge ${p.status === 'Paid' ? 'badge--ok' : 'badge--info'}`}>{p.status}</span></td>
                      <td className="num">{centsToDollars(p.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Section>

      <Section id="donations" title="Donations" aside={
        <label className="np-filter"><span className="ch-muted">Status</span>
          <select className="ch-field__input" value={filter} onChange={(e) => { setFilter(e.target.value); setLimit(PAGE) }}>
            {FILTERS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>}>
        {shown.length === 0 ? <Empty title="No donations to show">{filter === 'All' ? 'Gifts to your events are listed here.' : `No ${filter.toLowerCase()} donations.`}</Empty> : (
          <>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Donations table">
              <table className="table">
                <thead><tr><th scope="col">Receipt</th><th scope="col">Date</th><th scope="col">Event</th><th scope="col">Donor</th><th scope="col" className="num">Amount</th><th scope="col" className="num">Fee</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {shown.slice(0, limit).map((d) => (
                    <tr key={d.id}>
                      <th scope="row" className="np-rowhead">{d.receiptNo ?? 'Not issued'}</th>
                      <td>{fmtDate(d.paidAt ?? d.createdAt)}</td>
                      <td>{s.events[d.eventKey]?.title ?? d.eventKey}</td>
                      <td>{d.publicName}</td>
                      <td className="num">{centsToDollars(d.amountCents)}</td>
                      <td className="num">{centsToDollars(d.feeCents)}</td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="ch-muted gate-fine">Fees are processing fees the donor pays on top of the gift, so your payout is the full amount.</p>
            {shown.length > limit && <div><button className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => setLimit((n) => n + PAGE)}>Show more ({shown.length - limit} left)</button></div>}
          </>
        )}
      </Section>

      <Section id="refunds" title="Refunds">
        {refunds.length === 0 ? <Empty title="No refunds">Refunded gifts, and the reason, are listed here.</Empty> : (
          <ul className="np-list">
            {refunds.map((d) => (
              <li key={d.id} className="np-list__item">
                <div>
                  <p className="np-list__title">{centsToDollars(d.amountCents)} to {s.events[d.eventKey]?.title ?? d.eventKey}</p>
                  <p className="ch-muted">{d.publicName} · {fmtDate(d.refundedAt)} · {d.refundReason}</p>
                </div>
                <StatusBadge status="Refunded" />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
