import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, BadgeCheck, Users } from 'lucide-react'
import { Progress, CategoryIcon, Initials } from './Brand.jsx'
import { categoryByName } from '../data/index.js'
import { money, compact } from '../lib/format.js'
import { useStore } from '../lib/store.jsx'

export function EventCard({ event, onDonate }) {
  const { stats } = useStore()
  const s = stats(event.key)
  const cat = categoryByName[event.category]
  return (
    <article className="card card-hover event-card">
      <Link to={`/events/${event.key}`} className="event-card-media" aria-label={`${event.title}: view event`}>
        <img src={event.cover} alt="" loading="lazy" style={{ objectPosition: event.focus }} />
        <span className="chip chip-on-image">
          <CategoryIcon name={cat?.icon} size={14} /> {event.category}
        </span>
      </Link>
      <div className="event-card-body">
        <h3 className="h3 event-card-title">
          <Link to={`/events/${event.key}`}>{event.title}</Link>
        </h3>
        <p className="caption">
          For <Link to={`/nonprofits/${event.nonprofit}`}>{event.nonprofitName}</Link>
        </p>
        <p className="event-card-text">{event.mission}</p>
        <ul className="meta-list">
          <li><CalendarDays size={14} aria-hidden="true" /> {event.date} · {event.start}</li>
          <li><MapPin size={14} aria-hidden="true" /> {event.location}</li>
        </ul>
        <div>
          <Progress raised={s.raised} goal={event.goal} label={`${event.title} progress`} />
          <p className="caption progress-caption">
            <strong>{money(s.raised)}</strong> raised of {money(event.goal)} · {compact(s.backed)} backers
          </p>
        </div>
        <div className="event-card-actions">
          <Link to={`/events/${event.key}`} className="btn btn-ghost btn-sm">View event</Link>
          <button className="btn btn-donate btn-sm" onClick={() => onDonate(event)}>Donate</button>
        </div>
      </div>
    </article>
  )
}

export function NonprofitCard({ np, eventCount }) {
  const cat = categoryByName[np.category]
  return (
    <article className="card card-hover np-card">
      <div className="np-card-head">
        <Initials name={np.name} color={cat?.color ?? 'var(--blue)'} size={44} />
        <div>
          <h3 className="h3" style={{ color: 'var(--blue-deep)' }}>
            <Link to={`/nonprofits/${np.slug}`}>{np.name}</Link>
          </h3>
          <p className="caption">{np.cause}</p>
        </div>
      </div>
      <p className="event-card-text">{np.mission}</p>
      <ul className="meta-list">
        <li><MapPin size={14} aria-hidden="true" /> {np.headquarters}</li>
        <li><BadgeCheck size={14} aria-hidden="true" /> Verified · EIN {np.ein}</li>
        {eventCount > 0 && (
          <li><Users size={14} aria-hidden="true" /> {eventCount} active {eventCount === 1 ? 'event' : 'events'}</li>
        )}
      </ul>
      <Link to={`/nonprofits/${np.slug}`} className="btn btn-ghost btn-sm">View profile</Link>
    </article>
  )
}
