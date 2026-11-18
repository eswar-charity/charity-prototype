import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, PageHeader, Section, StatusBadge, centsToDollars, fmtDate, plural, useConfirm, useRun } from '../../ui/kit.jsx'
import { useAct, useDomain } from '../../domain/store.jsx'
import { FilterBar, ReasonModal, ResultCount, SelectField } from './common.jsx'
import { STRIPE_LABEL } from './Nonprofits.jsx'

const PAGE = 25
const STATUSES = ['Initiated', 'Successful', 'Failed', 'Refunded', 'Disputed']

export default function Payments() {
  const s = useDomain()
  const act = useAct()
  const run = useRun()
  const confirm = useConfirm()
  const [status, setStatus] = useState('all')
  const [eventKey, setEventKey] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [refunding, setRefunding] = useState(null)

  const events = Object.values(s.events).filter((e) => s.donations.some((d) => d.eventKey === e.key)).sort((a, b) => a.title.localeCompare(b.title))
  const rows = s.donations
    .filter((d) => status === 'all' || d.status === status)
    .filter((d) => eventKey === 'all' || d.eventKey === eventKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const successfulTotal = rows.filter((d) => d.status === 'Successful').reduce((t, d) => t + d.amountCents, 0)
  const refundTarget = refunding && s.donations.find((d) => d.id === refunding)
  const filtered = status !== 'all' || eventKey !== 'all'

  const dispute = async (d) => {
    const ok = await confirm({
      title: `Mark ${d.receiptNo ?? 'this donation'} as disputed?`,
      body: 'This simulates the Stripe dispute notice. The donation moves to Disputed and a high-severity exception opens for follow-up.',
      confirm: 'Mark as disputed',
      danger: true,
    })
    if (ok) run('disputeDonation', { id: d.id }, { success: `${d.receiptNo ?? 'Donation'} marked as disputed` })
  }

  return (
    <>
      <PageHeader eyebrow="Payments" title="Payments" lede="Every donation on the platform and where each nonprofit stands with Stripe. Amounts are demo data." />

      <Section title="Donations" id="donations">
        <FilterBar label="Filter donations">
          <SelectField id="pay-status" label="Status" value={status} onChange={(v) => { setStatus(v); setLimit(PAGE) }} options={[{ value: 'all', label: 'All statuses' }, ...STATUSES]} />
          <SelectField id="pay-event" label="Event" value={eventKey} onChange={(v) => { setEventKey(v); setLimit(PAGE) }} options={[{ value: 'all', label: 'All events' }, ...events.map((e) => ({ value: e.key, label: e.title }))]} />
        </FilterBar>
        <ResultCount>{plural(rows.length, 'donation')}{rows.length > 0 ? `, ${centsToDollars(successfulTotal)} successful` : ''}</ResultCount>
        {rows.length === 0 ? (
          <Empty title="No donations match" action={filtered ? <button type="button" className="link-btn" onClick={() => { setStatus('all'); setEventKey('all') }}>Clear filters</button> : undefined}>
            Donations appear here as soon as someone starts giving to an event.
          </Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <caption className="ch-sr">Donations</caption>
                <thead><tr><th scope="col">Receipt</th><th scope="col">Given by</th><th scope="col">Event</th><th scope="col" className="num">Amount</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Actions</th></tr></thead>
                <tbody>
                  {rows.slice(0, limit).map((d) => {
                    const ev = s.events[d.eventKey]
                    return (
                      <tr key={d.id}>
                        <td className="adm-mono">{d.receiptNo ?? 'No receipt'}</td>
                        <td>{d.publicName}</td>
                        <td>{ev ? <Link to={`/events/${ev.key}`}>{ev.title}</Link> : d.eventKey}</td>
                        <td className="num">{centsToDollars(d.amountCents)}</td>
                        <td><StatusBadge status={d.status} />{d.refundReason && <span className="adm-docnote">{d.refundReason}</span>}</td>
                        <td className="adm-nowrap">{fmtDate(d.paidAt ?? d.createdAt)}</td>
                        <td>
                          {d.status === 'Successful' ? (
                            <div className="table-actions">
                              <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" aria-label={`Refund ${d.receiptNo ?? d.id}`} onClick={() => setRefunding(d.id)}>Refund</button>
                              <button type="button" className="ch-btn ch-btn--text ch-btn--sm" aria-label={`Mark ${d.receiptNo ?? d.id} as disputed`} onClick={() => dispute(d)}>Mark disputed</button>
                            </div>
                          ) : <span className="ch-muted">None available</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {rows.length > limit && <div><button type="button" className="ch-btn ch-btn--secondary" onClick={() => setLimit((l) => l + PAGE)}>Show more ({rows.length - limit} left)</button></div>}
          </>
        )}
      </Section>

      <Section title="Nonprofit settlement" id="settlement">
        <p className="ch-muted">Read-only. Stripe pays each nonprofit directly, so Charity Hub does not hold or move these balances. Fix payout problems from the nonprofit&rsquo;s page or in Exceptions.</p>
        <div className="table-wrap">
          <table className="table">
            <caption className="ch-sr">Settlement by nonprofit</caption>
            <thead><tr><th scope="col">Nonprofit</th><th scope="col">Stripe</th><th scope="col">Settlement</th><th scope="col" className="num">Collected</th><th scope="col" className="num">Refunded</th><th scope="col" className="num">Disputed</th><th scope="col" className="num">Stripe balance</th></tr></thead>
            <tbody>
              {Object.values(s.nonprofits).sort((a, b) => a.name.localeCompare(b.name)).map((n) => {
                const mine = s.donations.filter((d) => d.nonprofitId === n.id)
                const sum = (st) => mine.filter((d) => d.status === st).reduce((t, d) => t + d.amountCents, 0)
                return (
                  <tr key={n.id}>
                    <td><Link to={`/admin/nonprofits/${n.id}`}>{n.name}</Link></td>
                    <td>{STRIPE_LABEL[n.stripe.state]}{n.stripe.account && <span className="adm-docnote adm-mono">{n.stripe.account}</span>}</td>
                    <td><StatusBadge status={n.settlement} /></td>
                    <td className="num">{centsToDollars(sum('Successful'))}</td>
                    <td className="num">{centsToDollars(sum('Refunded'))}</td>
                    <td className="num">{centsToDollars(sum('Disputed'))}</td>
                    <td className="num">{centsToDollars(n.stripe.available * 100)} available, {centsToDollars(n.stripe.pending * 100)} pending</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {refundTarget && (
        <ReasonModal
          title={`Refund ${refundTarget.receiptNo ?? 'donation'}?`}
          intro={`${centsToDollars(refundTarget.amountCents)} from ${refundTarget.publicName} goes back to the donor. This cannot be undone, and the donor is told.`}
          label="Reason"
          hint="Recorded in the audit log."
          initial="Requested by admin"
          submitLabel="Refund donation"
          danger
          success={`${centsToDollars(refundTarget.amountCents)} refunded`}
          onSubmit={(reason) => act('refundDonation', { id: refundTarget.id, reason: reason || undefined })}
          onClose={() => setRefunding(null)}
        />
      )}
    </>
  )
}
