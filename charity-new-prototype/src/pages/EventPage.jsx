import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Share2, Check, ChevronLeft, X, BadgeCheck } from 'lucide-react'
import { eventByKey, nonprofitBySlug, timelines } from '../data/index.js'
import { Attendance, Avatar, CauseBadge, LivePill, Progress, Reveal } from '../components/Brand.jsx'
import { JoinButton } from '../components/Cards.jsx'
import DonateDialog from '../components/DonateDialog.jsx'
import { money, relativeHours, eventState, whenLabel } from '../lib/format.js'
import { useStore } from '../lib/store.jsx'
import NotFound from './NotFound.jsx'

const PHASES = [
  { key: 'all', label: 'All' },
  { key: 'before', label: 'Before' },
  { key: 'during', label: 'During' },
  { key: 'after', label: 'After' },
]
const TABS = [['about', 'About'], ['room', 'The room'], ['photos', 'Photos']]

export default function EventPage() {
  const { key } = useParams()
  const event = eventByKey[key]
  const { stats, donations } = useStore()
  const [tab, setTab] = useState('about')
  const [phase, setPhase] = useState('all')
  const [donate, setDonate] = useState(false)
  const [copied, setCopied] = useState(false)
  const [light, setLight] = useState(null)

  if (!event) return <NotFound what="event" />
  const np = nonprofitBySlug[event.nonprofit]
  const s = stats(event.key)
  const state = eventState(event.date, event.start, event.end)
  const all = timelines[event.key] ?? []
  const posts = all.filter((p) => phase === 'all' || p.phase === phase)
  const mine = donations.filter((d) => d.eventKey === event.key).slice().reverse()

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable: ignore in prototype */
    }
  }

  const onTabKey = (e) => {
    const order = TABS.map(([k]) => k)
    const i = order.indexOf(tab)
    const to = e.key === 'ArrowRight' ? order[(i + 1) % order.length] : e.key === 'ArrowLeft' ? order[(i + order.length - 1) % order.length] : null
    if (to) { setTab(to); document.getElementById(`tab-${to}`)?.focus() }
  }

  return (
    <>
      <section className="ev-hero ch-stage">
        <img src={event.cover} alt="" style={{ objectPosition: event.focus }} />
        <span className="ev-hero__overlay" aria-hidden="true" />
        <p className="hero__giant" aria-hidden="true" style={{ '--len': event.title.length }}>{event.title}</p>
        <div className="wrap ev-hero__inner">
          <Link to="/#discover" className="back-link"><ChevronLeft size={18} aria-hidden="true" /> All events</Link>
          <div className="ev-hero__tags">
            {state === 'live' && <LivePill glass />}
            <CauseBadge name={np.name} glass />
          </div>
          <h1 className="ev-hero__h1">{event.title}</h1>
          <p className="ev-hero__sub">{event.mission}</p>
          <ul className="ev-hero__facts ch-glass">
            <li><CalendarDays size={18} aria-hidden="true" /> {whenLabel(event.date, event.start, event.end)}</li>
            <li><Clock size={18} aria-hidden="true" /> {event.start} to {event.end}</li>
            <li><MapPin size={18} aria-hidden="true" /> {event.location}</li>
          </ul>
        </div>
      </section>

      <div className="wrap ev-layout">
        <div className="ev-main">
          <div role="tablist" aria-label="Event sections" className="tabs" onKeyDown={onTabKey}>
            {TABS.map(([k, l]) => (
              <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`}
                tabIndex={tab === k ? 0 : -1} className={`tab ${tab === k ? 'is-on' : ''}`} onClick={() => setTab(k)}>
                {l}{k === 'room' ? ` (${all.length})` : ''}
              </button>
            ))}
          </div>

          {tab === 'about' && (
            <Reveal className="panel" role="tabpanel" id="panel-about" aria-labelledby="tab-about">
              <h2 className="h-heading">About this event</h2>
              <p className="body">{event.mission} {s.joined} people are going, and the room is open for anyone who wants in.</p>
              <div className="cause-note ch-accent">
                <p className="cause-note__label">The cause</p>
                <p>
                  This event is hosted for <Link to={`/nonprofits/${np.slug}`}>{np.name}</Link>, a verified 501(c)(3) partner that{' '}
                  {np.mission.charAt(0).toLowerCase() + np.mission.slice(1)}
                </p>
              </div>

              {mine.length > 0 && (
                <>
                  <h2 className="h-heading">Recent supporters</h2>
                  <ul className="supporters">
                    {mine.map((d, i) => (
                      <li key={i}><Avatar name={d.name} /> <span><strong>{d.name}</strong> donated {money(d.amount)}</span></li>
                    ))}
                  </ul>
                </>
              )}
            </Reveal>
          )}

          {tab === 'room' && (
            <div className="panel" role="tabpanel" id="panel-room" aria-labelledby="tab-room">
              <div className="filter-row" role="group" aria-label="Filter the room">
                {PHASES.map((p) => (
                  <button key={p.key} className={`filter ${phase === p.key ? 'is-on' : ''}`} aria-pressed={phase === p.key}
                    onClick={() => setPhase(p.key)}>{p.label}</button>
                ))}
              </div>
              {posts.length === 0 ? (
                <p className="empty">Nothing here yet. Check the other stages.</p>
              ) : (
                <ol className="ch-room room">
                  <li className="ch-room__head">
                    <span>{event.title}</span>
                    <span className="ch-muted">{all.length} messages</span>
                  </li>
                  {posts.map((p, i) => {
                    const authorName = p.author?.name
                    const photo = event.photos[(i + 1) % event.photos.length]
                    return (
                      <li key={`${p.phase}-${i}`} className="room__item">
                        <div className={`ch-msg ${authorName ? '' : 'ch-msg--host'} ${p.image ? 'ch-msg--photo' : ''}`}>
                          <Avatar name={authorName ?? np.name} />
                          <div className="ch-msg__body">
                            <div className="ch-msg__meta">
                              <strong>{authorName ?? 'Host'}</strong>
                              {!authorName && <span className="ch-badge-host" role="img" aria-label="Verified host"><BadgeCheck aria-hidden="true" /></span>}
                              <span>{relativeHours(p.h)}</span>
                            </div>
                            <div className="ch-msg__bubble">
                              {p.image && <img className="room__photo" src={photo} alt="" loading="lazy" />}
                              <p>{p.text}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
              <p className="demo-note">Messages are demo content.</p>
            </div>
          )}

          {tab === 'photos' && (
            <div className="panel" role="tabpanel" id="panel-photos" aria-labelledby="tab-photos">
              <ul className="gallery">
                {event.photos.map((src, i) => (
                  <li key={src} className={i === 0 ? 'gallery__lead' : ''}>
                    <button onClick={() => setLight(src)} aria-label={`Open photo ${i + 1} of ${event.photos.length}`}>
                      <img src={src} alt={`${event.title} photo ${i + 1}`} loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="ev-side" aria-label="Donate">
          <div className="side-card ch-accent">
            <Attendance eventKey={event.key} count={s.joined} />
            <JoinButton event={event} size="md" className="ch-btn--block" />
            <button className="ch-btn ch-btn--text ch-btn--block" onClick={share}>
              {copied ? <><Check size={16} aria-hidden="true" /> Link copied</> : <><Share2 size={16} aria-hidden="true" /> Share this event</>}
            </button>
          </div>

          <div className="side-card">
            <p className="side-card__label">Support the cause</p>
            <p className="side-total">{money(s.raised)}</p>
            <p className="ch-muted side-sub">raised toward a {money(event.goal)} demo goal</p>
            <Progress raised={s.raised} goal={event.goal} label="Progress toward the demo goal" />
            <button className="ch-btn ch-btn--secondary ch-btn--block" onClick={() => setDonate(true)}>Donate</button>
            <Link to={`/nonprofits/${np.slug}`} className="side-np">
              <Avatar name={np.name} size="lg" />
              <span><span className="ch-muted">Benefiting</span><br /><strong>{np.name}</strong></span>
            </Link>
            <p className="demo-note side-demo">Figures are demo content and the goal is illustrative.</p>
          </div>
        </aside>
      </div>

      {donate && <DonateDialog event={event} onClose={() => setDonate(false)} />}
      {light && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLight(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLight(null)}>
          <button className="lightbox__x" onClick={() => setLight(null)} aria-label="Close photo" autoFocus><X size={22} aria-hidden="true" /></button>
          <img src={light} alt="Enlarged event photo" />
        </div>
      )}
    </>
  )
}
