import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Receipt, Ticket as TicketIcon } from 'lucide-react'
import { EventCard } from '../components/Cards.jsx'
import { useDonate } from '../components/DonateDialog.jsx'
import { Empty, PageHeader, Section, centsToDollars, fmtDate } from '../ui/kit.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { visibility } from '../domain/selectors.js'
import TicketModal from '../roles/guest/Ticket.jsx'
import { whenFor } from '../roles/guest/lib.js'

/** /saved: events you saved, the tickets you hold, nonprofits you follow and your receipts. */
export default function SavedPage() {
  const s = useDomain()
  const { user } = useSession()
  const { start, dialog } = useDonate()
  const [ticketFor, setTicketFor] = useState(null)

  if (!user) {
    return (
      <div className="wrap page-pad saved">
        <PageHeader eyebrow="Saved" title="Your saved events and tickets" lede="Save events to come back to and keep your tickets in one place." />
        <Empty title="Nothing here yet" action={<><Link to="/#discover" className="ch-btn ch-btn--primary">Find events</Link> <Link to="/signin?next=%2Fsaved" className="ch-btn ch-btn--secondary">Sign in</Link></>}>
          Join or save an event and we will keep it here. You only need an email.
        </Empty>
      </div>
    )
  }

  const visible = Object.values(s.events).filter((e) => visibility(s, e, user) === 'full')
  const saved = visible.filter((e) => e.savedIds.includes(user.id))
  const tickets = visible.filter((e) => e.joinedIds.includes(user.id) && e.tickets[user.id])
  const follows = s.follows.filter((f) => f.userId === user.id).map((f) => s.nonprofits[f.nonprofitId]).filter(Boolean)
  const gifts = s.donations.filter((d) => d.donorId === user.id && ['Successful', 'Disputed', 'Refunded'].includes(d.status)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="wrap page-pad saved">
      <PageHeader eyebrow="Saved" title="Your saved events and tickets" lede={`Signed in as ${user.name}.`} />

      <Section title="My tickets" id="tickets">
        {tickets.length === 0 ? (
          <Empty title="No tickets yet" action={<Link to="/#discover" className="ch-btn ch-btn--secondary">Find an event to join</Link>}>Join an event and your ticket appears here with its QR code.</Empty>
        ) : (
          <ul className="ticket-list">
            {tickets.map((e) => (
              <li key={e.key} className="ticket-row">
                <span className="ticket-row__icon"><TicketIcon size={20} aria-hidden="true" /></span>
                <div className="ticket-row__main">
                  <Link to={`/events/${e.key}`} className="plain-link"><strong>{e.title}</strong></Link>
                  <span className="ch-muted"><CalendarDays size={14} aria-hidden="true" /> {whenFor(s, e)}{e.location ? <> · <MapPin size={14} aria-hidden="true" /> {e.location}</> : null}</span>
                  <span className="ticket-row__code">{e.tickets[user.id]}</span>
                </div>
                <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" aria-label={`View ticket for ${e.title}`} onClick={() => setTicketFor(e)}>View ticket</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Saved events" id="saved-events">
        {saved.length === 0 ? (
          <Empty title="No saved events" action={<Link to="/#discover" className="ch-btn ch-btn--secondary">Browse events</Link>}>Tap the bookmark on any event to keep it here.</Empty>
        ) : (
          <div className="feed-grid">{saved.map((e) => <EventCard key={e.key} event={e} onDonate={start} />)}</div>
        )}
      </Section>

      <Section title="Nonprofits you follow" id="following">
        {follows.length === 0 ? (
          <Empty title="You are not following anyone yet" action={<Link to="/nonprofits" className="ch-btn ch-btn--secondary">See nonprofits</Link>}>Follow a nonprofit from its profile page.</Empty>
        ) : (
          <ul className="plain-list">
            {follows.map((n) => <li key={n.id}><Link to={`/nonprofits/${n.slug}`}>{n.name}</Link> <span className="ch-muted">· {n.cause}</span></li>)}
          </ul>
        )}
      </Section>

      {gifts.length > 0 && (
        <Section title="Your gifts and receipts" id="gifts">
          <ul className="plain-list">
            {gifts.map((d) => (
              <li key={d.id}><Receipt size={16} aria-hidden="true" /> <Link to={`/donate/success/${d.id}`}>{d.receiptNo}</Link> <span className="ch-muted">· {centsToDollars(d.amountCents)} to {s.events[d.eventKey]?.title} · {fmtDate(d.paidAt ?? d.createdAt)}</span></li>
            ))}
          </ul>
        </Section>
      )}

      {ticketFor && <TicketModal event={ticketFor} onClose={() => setTicketFor(null)} />}
      {dialog}
    </div>
  )
}
