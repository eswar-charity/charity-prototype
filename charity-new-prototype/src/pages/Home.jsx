import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, Trophy, ShieldCheck, Megaphone, HandCoins } from 'lucide-react'
import { events, nonprofits, totals, categoryByName, eventsForNonprofit } from '../data/index.js'
import { EventCard, NonprofitCard } from '../components/Cards.jsx'
import { CategoryIcon, Progress } from '../components/Brand.jsx'
import DonateDialog from '../components/DonateDialog.jsx'
import { useVariant } from '../components/PrototypeSwitcher.jsx'
import { money, compact } from '../lib/format.js'
import { useStore } from '../lib/store.jsx'

export default function Home() {
  const [donateFor, setDonateFor] = useState(null)
  return (
    <>
      <Hero />
      <FeatureBand />
      <Discover onDonate={setDonateFor} />
      <HowItWorks />
      <Mission />
      <FeaturedNonprofits />
      <Contact />
      {donateFor && <DonateDialog event={donateFor} onClose={() => setDonateFor(null)} />}
    </>
  )
}

/* ---------------- Hero ---------------- */
function Hero() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (paused || reduced) return
    const t = setInterval(() => setI((n) => (n + 1) % events.length), 6000)
    return () => clearInterval(t)
  }, [paused, reduced])

  const ev = events[i]
  return (
    <section className="hero" aria-label="Welcome">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow eyebrow-light">Competition For Good®</p>
          <h1 className="display">Give. Compete. Change your community.</h1>
          <p className="hero-lede">
            Back the events you love, cheer on your neighbors and watch every dollar reach a verified nonprofit.
          </p>
          <div className="hero-cta">
            <a href="#discover" className="btn btn-primary">Explore events <ArrowRight size={16} aria-hidden="true" /></a>
            <Link to="/create" className="btn btn-white">Create an event</Link>
          </div>
        </div>

        <div className="hero-media" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <Link to={`/events/${ev.key}`} className="hero-slide" aria-label={`${ev.title}, ${ev.date}: view event`}>
            <img key={ev.key} src={ev.cover} alt={`Photos from ${ev.title}`} style={{ objectPosition: ev.focus }} />
            <div className="hero-slide-cap">
              <strong>{ev.title}</strong>
              <span>{ev.date} · {ev.location}</span>
            </div>
          </Link>
          <div className="dots" role="group" aria-label="Choose featured event">
            {events.map((e, n) => (
              <button key={e.key} className={`dot ${n === i ? 'is-on' : ''}`} aria-label={`Show ${e.title}`}
                aria-current={n === i} onClick={() => setI(n)} />
            ))}
          </div>
        </div>
      </div>

      <dl className="container hero-stats">
        <div><dt>Raised so far</dt><dd>{money(totals.raised)}</dd></div>
        <div><dt>Backers</dt><dd>{compact(totals.backed)}</dd></div>
        <div><dt>Live events</dt><dd>{totals.events}</dd></div>
        <div><dt>Verified nonprofits</dt><dd>{totals.nonprofits}</dd></div>
      </dl>
    </section>
  )
}

function FeatureBand() {
  return (
    <div className="feature-band">
      <div className="container feature-band-inner">
        <p><Trophy size={20} aria-hidden="true" /> <strong>Competition For Good:</strong> every event is a friendly race to raise more for the cause.</p>
        <Link to="/causes" className="btn btn-secondary btn-sm">Browse causes</Link>
      </div>
    </div>
  )
}

/* ---------------- Discover + 3 variants ---------------- */
function Discover({ onDonate }) {
  const variant = useVariant()
  const [cat, setCat] = useState('All')
  const cats = useMemo(() => ['All', ...new Set(events.map((e) => e.category))], [])
  const list = cat === 'All' ? events : events.filter((e) => e.category === cat)

  return (
    <section id="discover" className="section" aria-labelledby="discover-h">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Discover</p>
            <h2 id="discover-h" className="h1">Events making a difference</h2>
          </div>
          <div className="chips" role="group" aria-label="Filter by cause">
            {cats.map((c) => (
              <button key={c} className={`chip chip-btn ${c === cat ? 'is-on' : ''}`} aria-pressed={c === cat}
                onClick={() => setCat(c)}>
                {c !== 'All' && <CategoryIcon name={categoryByName[c]?.icon} size={14} />} {c}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="empty">No events for this cause yet.</p>
        ) : (
          <>
            {variant === 'A' && <VariantA list={list} onDonate={onDonate} />}
            {variant === 'B' && <VariantB list={list} onDonate={onDonate} />}
            {variant === 'C' && <VariantC list={list} onDonate={onDonate} />}
          </>
        )}
      </div>
    </section>
  )
}

/* A — familiar card grid, brand-spec cards */
function VariantA({ list, onDonate }) {
  return (
    <div className="grid-3">
      {list.map((e) => <EventCard key={e.key} event={e} onDonate={onDonate} />)}
    </div>
  )
}

/* B — one spotlight + a ranked "Competition For Good" leaderboard */
function VariantB({ list, onDonate }) {
  const { stats } = useStore()
  const ranked = [...list].sort((a, b) => stats(b.key).raised - stats(a.key).raised)
  const top = ranked[0]
  const s = stats(top.key)
  return (
    <div className="spot">
      <article className="spot-main card">
        <img src={top.cover} alt="" style={{ objectPosition: top.focus }} />
        <div className="spot-shade" />
        <div className="spot-body">
          <span className="badge"><Trophy size={12} aria-hidden="true" /> Leading the race</span>
          <h3 className="display spot-title"><Link to={`/events/${top.key}`}>{top.title}</Link></h3>
          <p className="spot-text">{top.mission}</p>
          <p className="spot-meta"><CalendarDays size={14} aria-hidden="true" /> {top.date} <MapPin size={14} aria-hidden="true" /> {top.location}</p>
          <div className="spot-prog">
            <Progress raised={s.raised} goal={top.goal} label={`${top.title} progress`} />
            <p><strong>{money(s.raised)}</strong> of {money(top.goal)}</p>
          </div>
          <div className="spot-actions">
            <button className="btn btn-primary" onClick={() => onDonate(top)}>Donate</button>
            <Link to={`/events/${top.key}`} className="btn btn-white">View event</Link>
          </div>
        </div>
      </article>

      <aside className="board card" aria-label="Leaderboard">
        <h3 className="h2" style={{ padding: 'var(--s-md) var(--s-md) 0' }}>Leaderboard</h3>
        <ol>
          {ranked.map((e, n) => {
            const st = stats(e.key)
            return (
              <li key={e.key}>
                <span className="rank" aria-hidden="true">{n + 1}</span>
                <div className="board-row">
                  <Link to={`/events/${e.key}`} className="h3">{e.title}</Link>
                  <Progress raised={st.raised} goal={e.goal} label={`${e.title} progress`} />
                  <span className="caption">{money(st.raised)} · {compact(st.backed)} backers</span>
                </div>
                <button className="btn btn-donate btn-sm" onClick={() => onDonate(e)} aria-label={`Donate to ${e.title}`}>Donate</button>
              </li>
            )
          })}
        </ol>
      </aside>
    </div>
  )
}

/* C — photo-first mosaic; the first tile is double-size */
function VariantC({ list, onDonate }) {
  const { stats } = useStore()
  return (
    <div className="mosaic">
      {list.map((e, n) => (
        <article key={e.key} className={`tile ${n === 0 ? 'tile-big' : ''}`}>
          <img src={e.cover} alt="" loading="lazy" style={{ objectPosition: e.focus }} />
          <div className="tile-shade" />
          <div className="tile-body">
            <span className="chip chip-on-image"><CategoryIcon name={categoryByName[e.category]?.icon} size={14} /> {e.category}</span>
            <h3 className="tile-title"><Link to={`/events/${e.key}`}>{e.title}</Link></h3>
            <p className="tile-meta">{e.date} · {money(stats(e.key).raised)} raised</p>
            <button className="btn btn-donate btn-sm" onClick={() => onDonate(e)}>Donate</button>
          </div>
        </article>
      ))}
    </div>
  )
}

/* ---------------- Supporting sections ---------------- */
function HowItWorks() {
  const steps = [
    { icon: Megaphone, t: 'Discover', d: 'Find events run by community organizers, each tied to a verified nonprofit.' },
    { icon: HandCoins, t: 'Back & compete', d: 'Donate, join and cheer. Events climb the leaderboard as supporters give.' },
    { icon: ShieldCheck, t: 'Funds reach the cause', d: 'Every nonprofit is verified by EIN before an event can go live.' },
  ]
  return (
    <section id="how-it-works" className="section section-white" aria-labelledby="how-h">
      <div className="container">
        <p className="eyebrow">How it works</p>
        <h2 id="how-h" className="h1" style={{ marginBottom: 'var(--s-xl)' }}>Three steps to good</h2>
        <ol className="steps">
          {steps.map((s, n) => (
            <li key={s.t} className="card step">
              <span className="step-n" aria-hidden="true">{n + 1}</span>
              <s.icon size={28} color="var(--blue)" aria-hidden="true" />
              <h3 className="h3">{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Mission() {
  return (
    <section className="section mission" aria-label="Our mission">
      <blockquote>
        “Improve Competition For Good among mission-driven organizations through events, storytelling, relationships
        and engagement, driving awareness, participation and monetary acts of solidarity.”
      </blockquote>
    </section>
  )
}

function FeaturedNonprofits() {
  const withEvents = nonprofits.filter((n) => eventsForNonprofit(n.slug).length > 0)
  return (
    <section className="section" aria-labelledby="np-h">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Nonprofits</p>
            <h2 id="np-h" className="h1">Causes with events right now</h2>
          </div>
          <Link to="/nonprofits" className="btn btn-ghost">All {nonprofits.length} nonprofits</Link>
        </div>
        <div className="grid-3">
          {withEvents.map((n) => <NonprofitCard key={n.slug} np={n} eventCount={eventsForNonprofit(n.slug).length} />)}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const v = {}
    if (!name.trim()) v.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(email)) v.email = 'Enter a valid email address.'
    if (!msg.trim()) v.msg = 'Tell us a little about what you need.'
    setErrors(v)
    if (!Object.keys(v).length) setSent(true)
  }

  return (
    <section className="contact" aria-labelledby="contact-h">
      <div className="container contact-grid">
        <div>
          <h2 id="contact-h" className="display" style={{ fontSize: 'clamp(32px,5vw,48px)' }}>Ready to host an event?</h2>
          <p className="contact-lede">Tell us about your idea and we’ll help you pair it with a verified nonprofit.</p>
        </div>
        {sent ? (
          <p className="contact-sent" role="status">Thanks {name.split(' ')[0]}! (Prototype: nothing was sent.)</p>
        ) : (
          <form onSubmit={submit} noValidate className="contact-form">
            <div className="field">
              <label htmlFor="c-name" className="on-dark">Your name</label>
              <input id="c-name" className="input" placeholder="Your name" value={name} autoComplete="name"
                aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-e' : undefined}
                onChange={(e) => setName(e.target.value)} />
              {errors.name && <span id="c-name-e" className="error-text on-dark-err">{errors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="c-email" className="on-dark">Your email address</label>
              <input id="c-email" type="email" className="input" placeholder="Your email address" value={email} autoComplete="email"
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'c-email-e' : undefined}
                onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <span id="c-email-e" className="error-text on-dark-err">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="c-msg" className="on-dark">Message</label>
              <textarea id="c-msg" className="input" placeholder="Message" value={msg}
                aria-invalid={!!errors.msg} aria-describedby={errors.msg ? 'c-msg-e' : undefined}
                onChange={(e) => setMsg(e.target.value)} />
              {errors.msg && <span id="c-msg-e" className="error-text on-dark-err">{errors.msg}</span>}
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Send message</button>
          </form>
        )}
      </div>
    </section>
  )
}
