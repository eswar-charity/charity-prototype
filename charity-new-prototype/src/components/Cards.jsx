import { Link } from 'react-router-dom'
import { MapPin, BadgeCheck, Check, Plus } from 'lucide-react'
import { Attendance, CauseBadge, LivePill, Avatar } from './Brand.jsx'
import { eventState, whenLabel } from '../lib/format.js'
import { useStore } from '../lib/store.jsx'

/** Join / joined toggle, shared by cards, spotlight and the event page. */
export function JoinButton({ event, size = 'sm', className = '' }) {
  const { isJoined, toggleJoin } = useStore()
  const on = isJoined(event.key)
  return (
    <button
      type="button"
      className={`ch-btn ${on ? 'ch-btn--secondary' : 'ch-btn--primary'} ${size === 'sm' ? 'ch-btn--sm' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? `You're going to ${event.title}. Leave event` : `Join ${event.title}`}
      onClick={() => toggleJoin(event.key)}
    >
      {on ? <><Check size={16} aria-hidden="true" /> Going</> : <><Plus size={16} aria-hidden="true" /> Join</>}
    </button>
  )
}

export function EventCard({ event, onDonate }) {
  const { stats } = useStore()
  const s = stats(event.key)
  const live = eventState(event.date, event.start, event.end) === 'live'
  return (
    <article className="ch-card event-card">
      <Link to={`/events/${event.key}`} className="event-card__media" aria-label={`${event.title}: open event`} tabIndex={-1}>
        <img src={event.cover} alt="" loading="lazy" style={{ objectPosition: event.focus }} />
        <span className="event-card__shade" aria-hidden="true" />
        {live && <LivePill glass />}
      </Link>
      <div className="ch-card__body ch-accent">
        <h3 className="ch-card__title">
          <Link to={`/events/${event.key}`} className="plain-link">{event.title}</Link>
        </h3>
        <p className="event-card__where"><MapPin size={16} aria-hidden="true" /> {event.location}</p>
        <p className="ch-card__when">{whenLabel(event.date, event.start, event.end)}</p>
        <div className="event-card__row">
          <Attendance eventKey={event.key} count={s.joined} />
        </div>
        <div className="ch-card__foot">
          <JoinButton event={event} />
          <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => onDonate(event)}
            aria-label={`Donate to ${event.title}`}>Donate</button>
        </div>
        <CauseBadge name={event.nonprofitName} />
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
        <li><MapPin size={16} aria-hidden="true" /> {np.headquarters}</li>
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
