import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Share2, Check, ChevronLeft, UserPlus, UserCheck, X } from 'lucide-react'
import { eventByKey, nonprofitBySlug, timelines, categoryByName } from '../data/index.js'
import { Progress, CategoryIcon, Initials } from '../components/Brand.jsx'
import DonateDialog from '../components/DonateDialog.jsx'
import { money, compact, relativeHours, eventState } from '../lib/format.js'
import { useStore } from '../lib/store.jsx'
import NotFound from './NotFound.jsx'

const PHASES = [
  { key: 'all', label: 'All updates' },
  { key: 'before', label: 'Before' },
  { key: 'during', label: 'During' },
  { key: 'after', label: 'After' },
]

export default function EventPage() {
  const { key } = useParams()
  const event = eventByKey[key]
  const { stats, isJoined, toggleJoin, donations } = useStore()
  const [tab, setTab] = useState('story')
  const [phase, setPhase] = useState('all')
  const [donate, setDonate] = useState(false)
  const [copied, setCopied] = useState(false)
  const [light, setLight] = useState(null)

  if (!event) return <NotFound what="event" />
  const np = nonprofitBySlug[event.nonprofit]
  const s = stats(event.key)
  const state = eventState(event.date, event.start, event.end)
  const posts = (timelines[event.key] ?? []).filter((p) => phase === 'all' || p.phase === phase)
  const mine = donations.filter((d) => d.eventKey === event.key).slice().reverse()
  const cat = categoryByName[event.category]

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable: ignore in prototype */
    }
  }

  return (
    <>
      <section className="ev-hero">
        <img src={event.cover} alt="" style={{ objectPosition: event.focus }} />
        <div className="ev-hero-shade" />
        <div className="container ev-hero-inner">
          <Link to="/" className="back"><ChevronLeft size={16} aria-hidden="true" /> All events</Link>
          <span className="chip chip-on-image"><CategoryIcon name={cat?.icon} size={14} /> {event.category}</span>
          <h1 className="display">{event.title}</h1>
          <p className="ev-hero-sub">{event.mission}</p>
        </div>
      </section>

      <div className="container ev-layout">
        <div className="ev-main">
          <ul className="ev-meta card">
            <li><CalendarDays size={18} aria-hidden="true" /> <span><strong>{event.date}</strong><br /><span className="caption">{state === 'past' ? 'Event ended' : state === 'live' ? 'Happening now' : 'Upcoming'}</span></span></li>
            <li><Clock size={18} aria-hidden="true" /> <span><strong>{event.start} – {event.end}</strong><br /><span className="caption">Local time</span></span></li>
            <li><MapPin size={18} aria-hidden="true" /> <span><strong>{event.location}</strong></span></li>
          </ul>

          <div role="tablist" aria-label="Event sections" className="tabs">
            {[['story', 'Story'], ['timeline', `Timeline (${(timelines[event.key] ?? []).length})`], ['gallery', 'Gallery']].map(([k, l]) => (
              <button key={k} role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`}
                tabIndex={tab === k ? 0 : -1} className={`tab ${tab === k ? 'is-on' : ''}`}
                onClick={() => setTab(k)}
                onKeyDown={(e) => {
                  const order = ['story', 'timeline', 'gallery']
                  const i = order.indexOf(tab)
                  if (e.key === 'ArrowRight') { setTab(order[(i + 1) % 3]); document.getElementById(`tab-${order[(i + 1) % 3]}`)?.focus() }
                  if (e.key === 'ArrowLeft') { setTab(order[(i + 2) % 3]); document.getElementById(`tab-${order[(i + 2) % 3]}`)?.focus() }
                }}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'story' && (
            <div role="tabpanel" id="panel-story" aria-labelledby="tab-story" className="panel">
              <h2 className="h2">About this event</h2>
              <p>{event.mission} Join {compact(s.joined)} supporters in a friendly race to raise more for {np.name}.</p>
              <p>Every dollar goes to <Link to={`/nonprofits/${np.slug}`}>{np.name}</Link>, a verified nonprofit that {np.mission.charAt(0).toLowerCase() + np.mission.slice(1)}</p>

              <h2 className="h2" style={{ marginTop: 'var(--s-lg)' }}>Recent supporters</h2>
              {mine.length === 0 ? (
                <p className="caption">Be the first to give in this session.</p>
              ) : (
                <ul className="supporters">
                  {mine.map((d, i) => (
                    <li key={i}><Initials name={d.name} size={32} /> <span><strong>{d.name}</strong> donated {money(d.amount)}</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'timeline' && (
            <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" className="panel">
              <div className="chips" role="group" aria-label="Filter timeline">
                {PHASES.map((p) => (
                  <button key={p.key} className={`chip chip-btn ${phase === p.key ? 'is-on' : ''}`} aria-pressed={phase === p.key}
                    onClick={() => setPhase(p.key)}>{p.label}</button>
                ))}
              </div>
              <ol className="timeline">
                {posts.map((p, i) => {
                  const authorName = p.author?.name ?? np.name
                  return (
                    <li key={i} className={`post post-${p.phase}`}>
                      <div className="post-head">
                        <Initials name={authorName} color={p.author?.color ?? 'var(--blue)'} size={36} />
                        <div>
                          <strong>{authorName}</strong>
                          <p className="caption">{relativeHours(p.h)}</p>
                        </div>
                        <span className="badge" style={{ marginLeft: 'auto' }}>{p.phase}</span>
                      </div>
                      <p>{p.text}</p>
                      {p.image && (
                        <img className="post-img" src={event.photos[(i + 1) % event.photos.length]} alt="" loading="lazy" />
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {tab === 'gallery' && (
            <div role="tabpanel" id="panel-gallery" aria-labelledby="tab-gallery" className="panel">
              <ul className="gallery">
                {event.photos.map((src, i) => (
                  <li key={src}>
                    <button onClick={() => setLight(src)} aria-label={`Open photo ${i + 1} of ${event.photos.length}`}>
                      <img src={src} alt={`${event.title} photo ${i + 1}`} loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="ev-side card" aria-label="Donate">
          <p className="ev-raised">{money(s.raised)}</p>
          <p className="caption">raised of {money(event.goal)} goal</p>
          <Progress raised={s.raised} goal={event.goal} label="Fundraising progress" />
          <dl className="ev-counts">
            <div><dt>Backers</dt><dd>{compact(s.backed)}</dd></div>
            <div><dt>Joined</dt><dd>{compact(s.joined)}</dd></div>
            <div><dt>Chat</dt><dd>{compact(event.chat)}</dd></div>
          </dl>
          <button className="btn btn-donate btn-block" onClick={() => setDonate(true)}>Donate</button>
          <button className="btn btn-ghost btn-block" onClick={() => toggleJoin(event.key)} aria-pressed={isJoined(event.key)}>
            {isJoined(event.key) ? <><UserCheck size={16} aria-hidden="true" /> You’re joined</> : <><UserPlus size={16} aria-hidden="true" /> Join the event</>}
          </button>
          <button className="btn btn-ghost btn-block" onClick={share}>
            {copied ? <><Check size={16} aria-hidden="true" /> Link copied</> : <><Share2 size={16} aria-hidden="true" /> Share</>}
          </button>
          <Link to={`/nonprofits/${np.slug}`} className="ev-np">
            <Initials name={np.name} color={cat?.color} size={36} />
            <span><span className="caption">Benefiting</span><br /><strong>{np.name}</strong></span>
          </Link>
        </aside>
      </div>

      {donate && <DonateDialog event={event} onClose={() => setDonate(false)} />}
      {light && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLight(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLight(null)}>
          <button className="dialog-x light-x" onClick={() => setLight(null)} aria-label="Close photo" autoFocus><X size={22} aria-hidden="true" /></button>
          <img src={light} alt="Enlarged event photo" />
        </div>
      )}
    </>
  )
}
