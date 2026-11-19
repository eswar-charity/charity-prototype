import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Archive, CalendarDays, Clock, MapPin, PauseCircle, Share2, ChevronLeft, Eye, Flag as FlagIcon } from 'lucide-react'
import { Attendance, Avatar, CauseBadge, LivePill, Progress, Reveal } from '../components/Brand.jsx'
import { JoinButton, SaveButton } from '../components/Cards.jsx'
import { useDonate } from '../components/DonateDialog.jsx'
import { Empty, StatusBadge, Tabs, dollars, fmtDate } from '../ui/kit.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { ROLES, eventTotals, startsAt } from '../domain/engine.js'
import { coverOf, photoList, postsFor, visibility } from '../domain/selectors.js'
import Affordances from '../roles/guest/Affordances.jsx'
import PhotoViewer from '../roles/guest/PhotoViewer.jsx'
import { ChatPanel, Room } from '../roles/guest/Room.jsx'
import { ShareSheet } from '../roles/guest/ShareSheet.jsx'
import { donateBlock, eventUrl, phaseOf, publicName, whenFor } from '../roles/guest/lib.js'
import NotFound from './NotFound.jsx'

/** /events/:key. What a person sees depends on selectors.visibility(): full page, "temporarily unavailable", or not found. */
export default function EventPage() {
  const { key } = useParams()
  const s = useDomain()
  const { user } = useSession()
  const ev = s.events[key]
  const vis = visibility(s, ev, user)
  if (vis === 'hidden') return <NotFound what="event" stage />
  if (vis === 'unavailable') return <Unavailable />
  return <EventView key={ev.key} ev={ev} />
}

function Unavailable() {
  return (
    <section className="page-head page-head--center ch-stage page-head--stage">
      <div className="wrap">
        <p className="ch-eyebrow">Paused</p>
        <h1 className="h-display-3">Temporarily unavailable</h1>
        <p className="lede">Charity Hub has paused this event while the team looks into it. Please check back soon.</p>
        <p className="page-head__cta"><Link to="/#discover" className="ch-btn ch-btn--primary">Find other events</Link></p>
      </div>
    </section>
  )
}

function EventView({ ev }) {
  const s = useDomain()
  const { user } = useSession()
  const np = s.nonprofits[ev.nonprofitId]
  const t = eventTotals(s, ev.key)
  const phase = phaseOf(s, ev)
  const photos = photoList(ev)
  const posts = postsFor(s, ev.key)
  const [tab, setTab] = useState('about')
  const [sharing, setSharing] = useState(false)
  const [light, setLight] = useState(null)
  const { start, dialog } = useDonate()

  const publicStatus = ['Live', 'Completed', 'Archived'].includes(ev.status)
  const closed = ev.status === 'Blocked' || ev.status === 'Archived'
  const preview = !publicStatus && ev.status !== 'Blocked'
  const ended = phase === 'ended' && ev.status !== 'Archived'
  const give = donateBlock(s, ev)
  const cover = coverOf(ev)
  const st = startsAt(ev)
  const dateLine = st ? st.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date to be announced'
  const organizer = s.users[ev.organizerId]
  const seHost = ev.kind === 'SE-led' && organizer?.role === ROLES.SE && organizer.status === 'active'
  const supporters = s.donations
    .filter((d) => d.eventKey === ev.key && ['Successful', 'Disputed'].includes(d.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'room', label: 'The room', count: posts.length },
    { id: 'photos', label: 'Photos', count: photos.length },
  ]

  return (
    <>
      <section className="ev-hero ch-stage">
        {cover && <img src={cover} alt="" style={{ objectPosition: ev.focus }} />}
        <span className="ev-hero__overlay" aria-hidden="true" />
        <p className="hero__giant" aria-hidden="true" style={{ '--len': ev.title.length }}>{ev.title}</p>
        <div className="wrap ev-hero__inner">
          <Link to="/#discover" className="back-link"><ChevronLeft size={18} aria-hidden="true" /> All events</Link>
          <div className="ev-hero__tags">
            {ev.status === 'Live' && phase === 'live' && <LivePill glass />}
            {ev.status === 'Live' && phase === 'upcoming' && <span className="ch-pill ch-pill--presence">Upcoming</span>}
            {ended && <span className="ch-pill ch-pill--presence">Closed</span>}
            {ev.status === 'Archived' && <span className="ch-pill ch-pill--presence">Archived</span>}
            {(preview || ev.status === 'Blocked') && <StatusBadge status={ev.status} />}
            {np && <CauseBadge name={np.name} glass />}
          </div>
          <h1 className="ev-hero__h1">{ev.title}</h1>
          {ev.mission && <p className="ev-hero__sub">{ev.mission}</p>}
          <ul className="ev-hero__facts ch-glass">
            <li><CalendarDays size={18} aria-hidden="true" /> {dateLine}</li>
            <li><Clock size={18} aria-hidden="true" /> {ev.start && ev.end ? `${ev.start} to ${ev.end}` : 'Times to be announced'}</li>
            <li><MapPin size={18} aria-hidden="true" /> {ev.location || 'Location to be announced'}</li>
          </ul>
        </div>
      </section>

      <div className="wrap ev-notices">
        {ev.status === 'Archived' && (
          <p className="banner banner--info" role="status"><Archive size={20} aria-hidden="true" /> <span><strong>This event is archived.</strong> The page is read-only: you can look back, but joining, giving and posting are closed.</span></p>
        )}
        {ev.status === 'Blocked' && (
          <p className="banner banner--warn" role="status"><PauseCircle size={20} aria-hidden="true" /> <span><strong>Paused by Charity Hub.</strong> {ev.blocked?.reason ? `Reason: ${ev.blocked.reason}. ` : ''}{ev.blocked?.expiresAt ? `Unless it is restored, this block ends on ${fmtDate(ev.blocked.expiresAt)}. ` : ''}Only you and Charity Hub can see this page.</span></p>
        )}
        {preview && (
          <p className="banner banner--info" role="status"><Eye size={20} aria-hidden="true" /> <span><strong>Preview.</strong> This event is {ev.status.toLowerCase()}, so only the people working on it can see this page.</span></p>
        )}
        {ended && (
          <p className="banner banner--info" role="status"><CalendarDays size={20} aria-hidden="true" /> <span><strong>This event is closed.</strong> {give ? 'The room stays open for photos and thank-yous.' : 'The room stays open for photos and thank-yous, and gifts are closed.'}</span></p>
        )}
        <Affordances ev={ev} user={user} />
      </div>

      <div className="wrap ev-layout">
        <div className="ev-main">
          <Tabs tabs={tabs} value={tab} onChange={setTab} label="Event sections" />

          {tab === 'about' && (
            <Reveal className="panel" role="tabpanel" id="panel-about" aria-labelledby="tab-about">
              <h2 className="h-heading">About this event</h2>
              {(ev.story || ev.mission || '').split(/\n+/).filter(Boolean).map((para, i) => <p key={i} className="body">{para}</p>)}
              <p className="body">{t.joined} {t.joined === 1 ? 'person is' : 'people are'} going{closed ? '.' : ', and the room is open for anyone who wants in.'}</p>

              <div className="host-card ch-accent">
                <p className="cause-note__label">Hosted by</p>
                {seHost ? (
                  <Link to={`/organizers/${organizer.id}`} className="host-card__who"><Avatar name={organizer.name} /> <span><strong>{organizer.name}</strong>{organizer.city ? <span className="ch-muted"> · {organizer.city}</span> : null}</span></Link>
                ) : np ? (
                  <Link to={`/nonprofits/${np.slug}`} className="host-card__who"><Avatar name={np.name} /> <span><strong>{np.name}</strong> <span className="ch-muted">· hosted by the nonprofit</span></span></Link>
                ) : <p>The host has not chosen a nonprofit yet.</p>}
              </div>

              {np && (
                <div className="cause-note ch-accent">
                  <p className="cause-note__label">The cause</p>
                  <p>
                    This event is hosted for <Link to={`/nonprofits/${np.slug}`}>{np.name}</Link>, a verified 501(c)(3) partner that{' '}
                    {np.mission ? np.mission.charAt(0).toLowerCase() + np.mission.slice(1) : 'does good work in its community.'}
                  </p>
                </div>
              )}

              {supporters.length > 0 && (
                <>
                  <h2 className="h-heading">Recent supporters</h2>
                  <ul className="supporters">
                    {supporters.map((d) => (
                      <li key={d.id}><Avatar name={d.anonymous ? 'Anonymous' : d.publicName} /> <span><strong>{d.anonymous ? 'Anonymous' : publicName(d.publicName)}</strong> gave {dollars(d.amountCents / 100)}</span></li>
                    ))}
                  </ul>
                  <p className="demo-note">Supporter names and totals are demo content.</p>
                </>
              )}
            </Reveal>
          )}

          {tab === 'room' && (
            <div className="panel" role="tabpanel" id="panel-room" aria-labelledby="tab-room">
              <Room ev={ev} closed={closed} />
            </div>
          )}

          {tab === 'photos' && (
            <div className="panel" role="tabpanel" id="panel-photos" aria-labelledby="tab-photos">
              {photos.length === 0 ? <Empty title="No photos yet">The host has not added photos.</Empty> : (
                <ul className="gallery">
                  {photos.map((src, i) => (
                    <li key={src} className={i === 0 ? 'gallery__lead' : ''}>
                      <button type="button" onClick={() => setLight(i)} aria-label={`Open photo ${i + 1} of ${photos.length}`}>
                        <img src={src} alt={`${ev.title}, photo ${i + 1}`} loading="lazy" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside className="ev-side" aria-label="Join, give and chat">
          {!preview && (
            <div className="side-card ch-accent">
              <Attendance eventKey={ev.key} count={t.joined} />
              <JoinButton event={ev} size="md" className="ch-btn--block" />
              <div className="side-card__row">
                <SaveButton event={ev} label />
                <button type="button" className="ch-btn ch-btn--text" onClick={() => setSharing(true)}><Share2 size={16} aria-hidden="true" /> Share</button>
              </div>
            </div>
          )}

          <div className="side-card">
            <p className="side-card__label">Support the cause</p>
            {!preview && (
              <>
                <p className="side-total">{dollars(t.raised)}</p>
                <p className="ch-muted side-sub">raised by {t.backed} {t.backed === 1 ? 'backer' : 'backers'}, toward a {dollars(ev.goal)} demo goal</p>
                <Progress raised={t.raised} goal={ev.goal} label="Progress toward the demo goal" />
              </>
            )}
            {give ? (
              !preview && <p className="ch-muted" role="status">{give}</p>
            ) : (
              <button type="button" className="ch-btn ch-btn--secondary ch-btn--block" onClick={() => start(ev)}>Donate to {np?.name ?? 'the cause'}</button>
            )}
            {np && (
              <Link to={`/nonprofits/${np.slug}`} className="side-np">
                <Avatar name={np.name} size="lg" />
                <span><span className="ch-muted">Benefiting</span><br /><strong>{np.name}</strong></span>
              </Link>
            )}
            <p className="demo-note side-demo">Figures are demo content and the goal is illustrative.</p>
          </div>

          <ChatPanel ev={ev} closed={closed} preview={preview} />
          {ev.status !== 'Archived' && !preview && <p className="ch-muted gate-fine side-report"><FlagIcon size={14} aria-hidden="true" /> See something that does not belong? Use Report on any message.</p>}
        </aside>
      </div>

      {sharing && <ShareSheet title={ev.title} text={`${ev.title}${ev.location ? ` in ${ev.location}` : ''}. ${whenFor(s, ev)}.`} url={eventUrl(ev.key)} onClose={() => setSharing(false)} />}
      {light !== null && <PhotoViewer photos={photos} index={light} title={ev.title} onIndex={setLight} onClose={() => setLight(null)} />}
      {dialog}
    </>
  )
}
