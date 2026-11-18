import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Printer, Share2 } from 'lucide-react'
import { Avatar } from '../components/Brand.jsx'
import { StatusBadge, centsToDollars, dollars, fmtDate } from '../ui/kit.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { ROLES, eventTotals } from '../domain/engine.js'
import { ShareSheet } from '../roles/guest/ShareSheet.jsx'
import { eventUrl, publicName } from '../roles/guest/lib.js'
import NotFound from './NotFound.jsx'

/** /donate/success/:id: thank-you, a printable receipt and the people backing the same event. */
export default function DonateSuccess() {
  const { id } = useParams()
  const s = useDomain()
  const { user } = useSession()
  const [sharing, setSharing] = useState(false)
  const d = s.donations.find((x) => x.id === id)
  const mine = !!d && !!user && (d.donorId === user.id || user.role === ROLES.ADMIN)
  if (!d || !mine) return <NotFound what="receipt" />

  const ev = s.events[d.eventKey]
  const np = s.nonprofits[d.nonprofitId]
  const paid = ['Successful', 'Disputed', 'Refunded'].includes(d.status)

  if (!paid) {
    return (
      <section className="page-head page-head--center">
        <div className="wrap">
          <p className="ch-eyebrow">Gift not completed</p>
          <h1 className="h-display-3">This gift did not go through</h1>
          <p className="lede">{d.lastError ?? 'The payment was not completed, so nothing was charged.'} You can try again from the event page.</p>
          <p className="page-head__cta"><Link to={`/events/${d.eventKey}`} className="ch-btn ch-btn--primary">Back to {ev?.title ?? 'the event'}</Link></p>
        </div>
      </section>
    )
  }

  const t = eventTotals(s, d.eventKey)
  const backers = s.donations
    .filter((x) => x.eventKey === d.eventKey && ['Successful', 'Disputed'].includes(x.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
  const shownAs = d.anonymous ? 'Anonymous' : publicName(d.publicName)

  return (
    <>
      <section className="page-head page-head--center no-print">
        <div className="wrap">
          <span className="wizard-done__icon"><Check size={32} aria-hidden="true" /></span>
          <h1 className="h-display-3">Thank you{user ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
          <p className="lede">Your gift to <strong>{ev?.title}</strong> is recorded and will reach {np?.name}. Your receipt is below.</p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap success">
          <article className="receipt" aria-labelledby="receipt-h">
            <header className="receipt__head">
              <div>
                <p className="ch-eyebrow">Receipt</p>
                <h2 id="receipt-h" className="h-heading-sm">{d.receiptNo}</h2>
              </div>
              <StatusBadge status={d.status === 'Successful' ? 'Successful' : d.status} />
            </header>
            <dl className="receipt__rows">
              <div><dt>Date</dt><dd>{fmtDate(d.paidAt ?? d.createdAt)}</dd></div>
              <div><dt>Event</dt><dd>{ev?.title}</dd></div>
              <div><dt>Nonprofit</dt><dd>{np?.name}{np?.ein ? <span className="ch-muted"> · EIN {np.ein}</span> : null}</dd></div>
              <div><dt>Shown as</dt><dd>{shownAs}</dd></div>
              <div><dt>Gift</dt><dd>{centsToDollars(d.amountCents)}</dd></div>
              <div><dt>Card processing fee</dt><dd>{centsToDollars(d.feeCents)}</dd></div>
              <div className="receipt__total"><dt>Total charged</dt><dd>{centsToDollars(d.totalCents)}</dd></div>
              <div><dt>Payment reference</dt><dd>{d.ref}</dd></div>
            </dl>
            {d.status === 'Refunded' && <p className="banner banner--info" role="status">This gift was refunded{d.refundedAt ? ` on ${fmtDate(d.refundedAt)}` : ''}.</p>}
            <p className="receipt__fine">Demo receipt for the Charity Hub prototype: no money moved and it is not valid for tax purposes.</p>
          </article>

          <aside className="success__side no-print" aria-label="Next steps">
            <div className="side-card ch-accent">
              <button type="button" className="ch-btn ch-btn--primary ch-btn--block" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print receipt</button>
              <button type="button" className="ch-btn ch-btn--secondary ch-btn--block" onClick={() => setSharing(true)}><Share2 size={16} aria-hidden="true" /> Share {ev?.title}</button>
              <Link to={`/events/${d.eventKey}`} className="ch-btn ch-btn--text ch-btn--block">Back to the event</Link>
              <Link to="/saved" className="ch-btn ch-btn--text ch-btn--block">Saved events and tickets</Link>
            </div>
            <div className="side-card">
              <p className="side-card__label">{t.backed} {t.backed === 1 ? 'person is' : 'people are'} backing {ev?.title}</p>
              <ul className="supporters">
                {backers.map((b) => (
                  <li key={b.id}><Avatar name={b.anonymous ? 'Anonymous' : b.publicName} /> <span><strong>{b.anonymous ? 'Anonymous' : publicName(b.publicName)}</strong> gave {dollars(b.amountCents / 100)}</span></li>
                ))}
              </ul>
              <p className="demo-note side-demo">Supporter names and totals are demo content.</p>
            </div>
          </aside>
        </div>
      </section>
      {sharing && ev && <ShareSheet title={ev.title} text={`I just backed ${ev.title} on Charity Hub.`} url={eventUrl(ev.key)} onClose={() => setSharing(false)} />}
    </>
  )
}
