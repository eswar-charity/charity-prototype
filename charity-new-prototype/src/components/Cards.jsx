import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, BadgeCheck, Check, Plus, Bookmark } from 'lucide-react'
import { Attendance, CauseBadge, LivePill, Avatar } from './Brand.jsx'
import TicketModal from '../roles/guest/Ticket.jsx'
import { joinBlock, phaseOf, whenFor } from '../roles/guest/lib.js'
import { useGate } from '../ui/Gate.jsx'
import { useRun, useToast } from '../ui/kit.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { eventTotals } from '../domain/engine.js'
import { coverOf } from '../domain/selectors.js'

/** Join → ticket. Anonymous visitors pass the identity gate first and the join resumes. Joined people open their ticket. */
export function JoinButton({ event, size = 'sm', className = '' }) {
  const s = useDomain()
  const { user } = useSession()
  const { ensureIdentity } = useGate()
  const run = useRun()
  const [ticket, setTicket] = useState(false)
  const ev = s.events[event.key] ?? event
  const going = !!user && ev.joinedIds.includes(user.id)
  const block = going ? null : joinBlock(s, ev)
  const sizeCls = size === 'sm' ? 'ch-btn--sm' : ''

  const click = async () => {
    if (going) { setTicket(true); return }
    if (!(await ensureIdentity({ action: 'join', event: ev }))) return
    run('joinEvent', { eventKey: ev.key }, { onOk: () => setTicket(true) })
  }

  if (block) {
    return <button type="button" className={`ch-btn ch-btn--secondary ${sizeCls} ${className}`} disabled title={block}>{'Closed'}</button>
  }
  return (
    <>
      <button type="button" className={`ch-btn ${going ? 'ch-btn--secondary' : 'ch-btn--primary'} ${sizeCls} ${className}`}
        aria-label={going ? `You are going to ${ev.title}. View your ticket` : `Join ${ev.title}`} onClick={click}>
        {going ? <><Check size={16} aria-hidden="true" /> Going</> : <><Plus size={16} aria-hidden="true" /> Join</>}
      </button>
      {ticket && <TicketModal event={ev} onClose={() => setTicket(false)} />}
    </>
  )
}

/** Save for later (gated). `label` shows text next to the icon; cards use the compact icon-only form. */
export function SaveButton({ event, label = false, className = '' }) {
  const s = useDomain()
  const { user } = useSession()
  const { ensureIdentity } = useGate()
  const run = useRun()
  const toast = useToast()
  const ev = s.events[event.key] ?? event
  const saved = !!user && ev.savedIds.includes(user.id)
  const click = async () => {
    if (!(await ensureIdentity({ action: 'save', event: ev }))) return
    const r = run('toggleSaveEvent', { eventKey: ev.key })
    if (r.ok) toast(r.data.saved ? 'Saved. Find it under Saved events.' : 'Removed from saved events.', 'ok')
  }
  return (
    <button type="button" className={`${label ? 'ch-btn ch-btn--text' : 'save-btn'} ${saved ? 'is-on' : ''} ${className}`} aria-pressed={saved}
      aria-label={saved ? `Remove ${ev.title} from saved` : `Save ${ev.title}`} onClick={click}>
      <Bookmark size={18} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
      {label && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}

export function EventCard({ event }) {
  const s = useDomain()
  const ev = s.events[event.key] ?? event
  const t = eventTotals(s, ev.key)
  const np = s.nonprofits[ev.nonprofitId]
  const phase = phaseOf(s, ev)
  const cover = coverOf(ev)

  return (
    <article className="ch-card event-card">
      <div className="event-card__media-wrap">
        <Link to={`/events/${ev.key}`} className="event-card__media" aria-label={`${ev.title}: open event`} tabIndex={-1}>
          {cover && <img src={cover} alt="" loading="lazy" style={{ objectPosition: ev.focus }} />}
          <span className="event-card__shade" aria-hidden="true" />
          {phase === 'live' && ev.status === 'Live' && <LivePill glass />}
        </Link>
        <SaveButton event={ev} className="event-card__save" />
      </div>
      <div className="ch-card__body ch-accent">
        <h3 className="ch-card__title">
          <Link to={`/events/${ev.key}`} className="plain-link">{ev.title}</Link>
        </h3>
        <p className="event-card__where"><MapPin size={16} aria-hidden="true" /> {ev.location || 'Location to be announced'}</p>
        <p className="ch-card__when">{whenFor(s, ev)}</p>
        <div className="event-card__row"><Attendance eventKey={ev.key} count={t.joined} /></div>
        <div className="ch-card__foot">
          <JoinButton event={ev} />
        </div>
        {np && <CauseBadge name={np.name} />}
      </div>
    </article>
  )
}

export function NonprofitCard({ np, eventCount }) {
  return (
    <article className="ch-card np-card">
      <div className="np-card__head">
        <Avatar name={np.name} size="lg" />
        <div>
          <h3 className="ch-card__title">
            <Link to={`/nonprofits/${np.slug}`} className="plain-link">{np.name}</Link>
          </h3>
          <p className="ch-muted np-card__cause">{np.cause}</p>
        </div>
      </div>
      <p className="np-card__mission">{np.mission}</p>
      <ul className="np-card__meta">
        <li><MapPin size={16} aria-hidden="true" /> {np.headquarters || 'Headquarters not listed'}</li>
        <li><BadgeCheck size={16} aria-hidden="true" /> Verified · EIN {np.ein}</li>
      </ul>
      <div className="np-card__foot">
        <Link to={`/nonprofits/${np.slug}`} className="ch-btn ch-btn--secondary ch-btn--sm">View profile</Link>
        {eventCount > 0 && (
          <span className="ch-pill ch-pill--presence">{eventCount} {eventCount === 1 ? 'event' : 'events'}</span>
        )}
      </div>
    </article>
  )
}
