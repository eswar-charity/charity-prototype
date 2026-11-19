import { Link, useParams } from 'react-router-dom'
import { MapPin, UserRound } from 'lucide-react'
import { EventCard } from '../components/Cards.jsx'
import { Avatar } from '../components/Brand.jsx'
import { Empty, StatRow, Stat } from '../ui/kit.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { ROLES, eventTotals } from '../domain/engine.js'
import { feed } from '../domain/selectors.js'
import NotFound from './NotFound.jsx'

/** /organizers/:id: a social entrepreneur's public profile and the events they host. */
export default function OrganizerPage() {
  const { id } = useParams()
  const s = useDomain()
  const { user } = useSession()
  const org = s.users[id]
  if (!org || org.role !== ROLES.SE || org.status !== 'active') return <NotFound what="organizer" />

  const events = feed(s).filter((e) => e.organizerId === org.id)
  const joined = events.reduce((n, e) => n + eventTotals(s, e.key).joined, 0)
  const me = user?.id === org.id

  return (
    <>
      <section className="page-head">
        <div className="wrap org-head">
          <Avatar name={org.name} size="lg" />
          <div>
            <p className="ch-eyebrow">Event host</p>
            <h1 className="h-display-3">{org.name}</h1>
            {org.city && <p className="org-head__city"><MapPin size={16} aria-hidden="true" /> {org.city}</p>}
            {org.bio ? <p className="lede">{org.bio}</p> : <p className="lede ch-muted">This host has not added a bio yet.</p>}
            {me && <p className="page-head__cta"><Link to="/se/profile" className="ch-btn ch-btn--secondary ch-btn--sm"><UserRound size={16} aria-hidden="true" /> Edit your profile</Link></p>}
          </div>
        </div>
      </section>
      <section className="section section--tight">
        <div className="wrap">
          <StatRow label="Host figures">
            <Stat label="Public events" value={events.length} />
            <Stat label="People going" value={joined} hint="Across all their live events" />
          </StatRow>
          <h2 className="h-heading np-events-h org-events-h">Events by {org.name.split(' ')[0]}</h2>
          {events.length === 0 ? (
            <Empty title="No public events right now" action={<Link to="/#discover" className="ch-btn ch-btn--secondary">Browse all events</Link>}>
              Events appear here once the nonprofit approves them.
            </Empty>
          ) : (
            <div className="feed-grid">{events.map((e) => <EventCard key={e.key} event={e} />)}</div>
          )}
          <p className="demo-note">Names, bios and counts are demo content.</p>
        </div>
      </section>
    </>
  )
}
