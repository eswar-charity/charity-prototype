import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Crown, Pause, Play, ShieldCheck, BadgeCheck, HandHeart, MapPin, Search } from 'lucide-react'
import { EventCard, NonprofitCard, JoinButton, SaveButton } from '../components/Cards.jsx'
import { Attendance, Avatar, CategoryIcon, CauseBadge, LivePill, Reveal } from '../components/Brand.jsx'
import { useDonate } from '../components/DonateDialog.jsx'
import { useVariant } from '../components/PrototypeSwitcher.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { eventTotals } from '../domain/engine.js'
import { feed, leaderboard, postsFor, coverOf } from '../domain/selectors.js'
import { Empty } from '../ui/kit.jsx'
import { donateBlock, hostTarget, phaseOf, whenFor } from '../roles/guest/lib.js'

export default function Home() {
  const { start, dialog } = useDonate()
  return (
    <>
      <Hero />
      <Discover onDonate={start} />
      <Journey />
      <Leaderboard />
      <CauseLayer />
      <Invite />
      {dialog}
    </>
  )
}

const iconOf = (s, name) => s.categories.find((c) => c.name === name)?.icon

/* ================= Hero: stage navy, full-bleed photography, the hashtag as type ================= */
function Hero() {
  const s = useDomain()
  const { user } = useSession()
  const featured = useMemo(() => feed(s).slice(0, 5), [s])
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const host = hostTarget(user)

  useEffect(() => {
    if (paused || reduced || featured.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % featured.length), 7000)
    return () => clearInterval(t)
  }, [paused, reduced, featured.length])

  const ev = featured[i % Math.max(featured.length, 1)]
  const np = ev && s.nonprofits[ev.nonprofitId]

  return (
    <section className="hero ch-stage" aria-label="Welcome">
      <div className="hero__media" aria-hidden="true">
        {featured.map((e, n) => (
          <img key={e.key} src={coverOf(e)} alt="" className={n === i % featured.length ? 'is-on' : ''}
            loading={n === 0 ? 'eager' : 'lazy'} style={{ objectPosition: e.focus }} />
        ))}
        <span className="hero__overlay" />
      </div>
      {ev && <p className="hero__giant" aria-hidden="true" key={ev.key} style={{ '--len': ev.title.length }}>{ev.title}</p>}

      <div className="hero__inner">
        <div className="hero__copy">
          <p className="ch-eyebrow">Competition for Good<sup>®</sup></p>
          <h1 className="hero__h1">Throw an event<br />people remember.</h1>
          <p className="hero__lede">
            Hosts dream up the idea. People show up, join the room and come back. Every event supports a verified cause.
          </p>
          <div className="hero__cta">
            {host && <Link to={host} className="ch-btn ch-btn--primary">Host an event</Link>}
            <a href="#discover" className="ch-btn ch-btn--secondary">Find events</a>
          </div>
        </div>

        {ev && (
          <aside className="hero__feature ch-glass" aria-label="Featured event">
            <div className="hero__feature-top">
              {phaseOf(s, ev) === 'live' ? <LivePill glass /> : <span className="ch-pill ch-pill--presence">{whenFor(s, ev)}</span>}
            </div>
            <h2 className="hero__feature-title">
              <Link to={`/events/${ev.key}`} className="plain-link">{ev.title}</Link>
            </h2>
            <p className="hero__feature-where"><MapPin size={16} aria-hidden="true" /> {ev.location}</p>
            <Attendance eventKey={ev.key} count={eventTotals(s, ev.key).joined} />
            {np && <CauseBadge name={np.name} glass />}
            {featured.length > 1 && (
              <div className="hero__pager">
                <div role="group" aria-label="Choose featured event" className="dots">
                  {featured.map((e, n) => (
                    <button key={e.key} className={`dot ${n === i % featured.length ? 'is-on' : ''}`} aria-label={`Show ${e.title}`}
                      aria-current={n === i % featured.length} onClick={() => setI(n)} />
                  ))}
                </div>
                {!reduced && (
                  <button className="hero__pause" onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? 'Resume featured event rotation' : 'Pause featured event rotation'}>
                    {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  )
}

/* ================= Discover: search, cause filter, three structurally different forms ================= */
function Discover({ onDonate }) {
  const s = useDomain()
  const variant = useVariant()
  const [params] = useSearchParams()
  const everything = feed(s)
  const cats = useMemo(() => ['All', ...new Set(everything.map((e) => e.category).filter(Boolean))], [everything])
  const fromUrl = params.get('cause')
  const [cat, setCat] = useState(fromUrl && cats.includes(fromUrl) ? fromUrl : 'All')
  const [q, setQ] = useState('')
  const list = feed(s, { category: cat, query: q })
  const filtered = cat !== 'All' || q.trim() !== ''

  return (
    <section id="discover" className="section" aria-labelledby="discover-h">
      <div className="wrap">
        <Reveal className="section__head">
          <div>
            <p className="ch-eyebrow">Find events</p>
            <h2 id="discover-h" className="h-display-2">Find something good to do.</h2>
          </div>
        </Reveal>

        <div className="filters">
          <div className="ch-field search">
            <label className="ch-field__label" htmlFor="ev-q">Search events</label>
            <div className="search__box">
              <Search size={18} aria-hidden="true" />
              <input id="ev-q" type="search" className="ch-field__input" placeholder="Event, place or nonprofit" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="filter-row" role="group" aria-label="Filter by cause">
            {cats.map((c) => (
              <button key={c} className={`filter ${c === cat ? 'is-on' : ''}`} aria-pressed={c === cat} onClick={() => setCat(c)}>
                {c !== 'All' && <CategoryIcon name={iconOf(s, c)} size={16} />} {c}
              </button>
            ))}
          </div>
        </div>
        <p className="result-count" role="status" aria-live="polite">{list.length} {list.length === 1 ? 'event' : 'events'}{filtered ? ' match' : ''}</p>

        {list.length === 0 ? (
          <Empty title={everything.length === 0 ? 'No events are live yet' : 'No events match that search'}
            action={filtered ? <button className="ch-btn ch-btn--secondary" onClick={() => { setQ(''); setCat('All') }}>Clear search and filters</button> : <Link to="/signup" className="ch-btn ch-btn--secondary">Host the first one</Link>}>
            {everything.length === 0 ? 'Check back soon, or host one yourself.' : 'Try a different word or pick another cause.'}
          </Empty>
        ) : (
          <>
            {variant === 'A' && <VariantA list={list} onDonate={onDonate} />}
            {variant === 'B' && <VariantB list={list} onDonate={onDonate} />}
            {variant === 'C' && <VariantC list={list} />}
          </>
        )}
        <p className="demo-note">Counts, names and the events themselves are demo content.</p>
      </div>
    </section>
  )
}

/* A: a feed of the brand's event cards */
function VariantA({ list, onDonate }) {
  return (
    <div className="feed-grid">
      {list.map((e) => <EventCard key={e.key} event={e} onDonate={onDonate} />)}
    </div>
  )
}

/* B: one event on stage, the rest as a tight list beside it */
function VariantB({ list, onDonate }) {
  const s = useDomain()
  const { user } = useSession()
  const host = hostTarget(user)
  const ranked = [...list].sort((a, b) => eventTotals(s, b.key).joined - eventTotals(s, a.key).joined)
  const [top, ...rest] = ranked
  const canGive = !donateBlock(s, top)
  return (
    <div className="spot">
      <article className="spot__main ch-stage">
        <img src={coverOf(top)} alt="" style={{ objectPosition: top.focus }} />
        <span className="spot__shade" aria-hidden="true" />
        <div className="spot__body">
          <span className="ch-crown"><Crown aria-hidden="true" /> Most people going</span>
          <h3 className="spot__title"><Link to={`/events/${top.key}`} className="plain-link">{top.title}</Link></h3>
          <p className="spot__text">{top.mission}</p>
          <p className="spot__meta">{whenFor(s, top)} · {top.location}</p>
          <Attendance eventKey={top.key} count={eventTotals(s, top.key).joined} />
          <div className="spot__actions">
            <JoinButton event={top} size="md" />
            {canGive && <button className="ch-btn ch-btn--secondary" onClick={() => onDonate(top)} aria-label={`Donate to ${top.title}`}>Donate</button>}
            <SaveButton event={top} label />
          </div>
        </div>
      </article>

      <aside className="spot__list" aria-label="More events">
        {rest.map((e) => (
          <Link key={e.key} to={`/events/${e.key}`} className="mini">
            <img src={coverOf(e)} alt="" loading="lazy" style={{ objectPosition: e.focus }} />
            <span className="mini__text">
              <strong>{e.title}</strong>
              <span>{whenFor(s, e)}</span>
              <span className="ch-muted">{eventTotals(s, e.key).joined} going</span>
            </span>
          </Link>
        ))}
        {host && (
          <Link to={host} className="ch-tile ch-tile--cta spot__cta">
            <span className="ch-tile__text">
              <p className="ch-tile__tag">Your idea <ArrowRight size={22} aria-hidden="true" /></p>
              <p className="ch-tile__desc">Any idea can be an event.</p>
            </span>
          </Link>
        )}
      </aside>
    </div>
  )
}

/* C: a drifting mosaic that pauses on hover, focus and via a visible control */
function VariantC({ list }) {
  const s = useDomain()
  const { user } = useSession()
  const host = hostTarget(user)
  const [paused, setPaused] = useState(false)
  const sizes = ['ch-tile--tall', '', 'ch-tile--wide', 'ch-tile--sm', 'ch-tile--tall']
  const set = (hidden) => [
    ...list.map((e, n) => (
      <Link key={`${hidden ? 'd' : 'o'}-${e.key}`} to={`/events/${e.key}`} className={`ch-tile ${sizes[n % sizes.length]}`}
        tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
        <span className="tile__img"><img src={coverOf(e)} alt="" loading="lazy" style={{ objectPosition: e.focus }} /></span>
        <span className="ch-photo__overlay" aria-hidden="true" />
        <span className="ch-tile__text">
          <p className="ch-tile__tag">{e.title}</p>
          <p className="ch-tile__desc">{whenFor(s, e)} · {eventTotals(s, e.key).joined} going</p>
        </span>
      </Link>
    )),
    host && (
      <Link key={`${hidden ? 'd' : 'o'}-cta`} to={host} className="ch-tile ch-tile--cta ch-tile--sm"
        tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
        <span className="ch-tile__text">
          <p className="ch-tile__tag">Your idea <ArrowRight size={20} aria-hidden="true" /></p>
          <p className="ch-tile__desc">Host an event</p>
        </span>
      </Link>
    ),
  ]
  return (
    <div className="mosaic">
      <div className="mosaic__bar">
        <button className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />} {paused ? 'Play' : 'Pause'} motion
        </button>
      </div>
      <div className={`mosaic__viewport ${paused ? 'is-paused' : ''}`}>
        <div className="mosaic__track">
          {set(false)}
          {set(true)}
        </div>
      </div>
    </div>
  )
}

/* ================= Journey: a real sequence: before, during, after ================= */
const STAGES = [
  { phase: 'before', title: 'Before: build the buzz', text: 'Publish your page and the room opens. Announce it, share the plan and let people join.' },
  { phase: 'during', title: 'During: run the room', text: 'Post, share photos and answer replies while it happens. The crowd talks back in real time.' },
  { phase: 'after', title: 'After: keep the story going', text: 'The room stays open for photos and thank-yous, so the event keeps working for the next one.' },
]
function Journey() {
  const s = useDomain()
  // sample the event whose room has the most messages, so every stage has something real to show
  const sample = useMemo(() => {
    const best = Object.values(s.events).filter((e) => ['Live', 'Completed'].includes(e.status))
      .map((e) => ({ e, posts: postsFor(s, e.key) })).sort((a, b) => b.posts.length - a.posts.length)[0]
    return best ?? null
  }, [s])
  return (
    <section id="how-it-works" className="section section--alt" aria-labelledby="how-h">
      <div className="wrap">
        <Reveal className="section__head section__head--stack">
          <p className="ch-eyebrow">How it works</p>
          <h2 id="how-h" className="h-display-2">Conversations, not comments.</h2>
          <p className="lede">Every event gets its own room. Hosts post, people reply and the whole story stays in one place.</p>
        </Reveal>
        <Reveal as="ol" className="journey">
          {STAGES.map((st, n) => {
            const post = sample?.posts.find((p) => p.phase === st.phase)
            const np = sample && s.nonprofits[sample.e.nonprofitId]
            const author = post ? (post.host ? post.authorName ?? np?.name ?? 'Host' : post.authorName) : null
            return (
              <li key={st.phase} className="stage">
                <span className="stage__n" aria-hidden="true">{n + 1}</span>
                <h3 className="h-heading">{st.title}</h3>
                <p className="stage__text">{st.text}</p>
                {post && (
                  <div className={`ch-msg ${post.host ? 'ch-msg--host' : ''}`}>
                    <Avatar name={author} />
                    <div className="ch-msg__body">
                      <div className="ch-msg__meta">
                        <strong>{author}</strong>
                        {post.host && <span className="ch-badge-host"><BadgeCheck aria-hidden="true" /> Host</span>}
                      </div>
                      <p className="ch-msg__bubble clamp-3">{post.text}</p>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </Reveal>
        <p className="demo-note">{sample ? `Sample messages from ${sample.e.title} (demo content). ` : ''}<Link to="/how-it-works">Read the full guide</Link>.</p>
      </div>
    </section>
  )
}

/* ================= Leaderboard: ranked by people going, never money ================= */
function Leaderboard() {
  const s = useDomain()
  const ranked = leaderboard(s)
  const max = Math.max(1, ranked[0]?.going ?? 1)
  return (
    <section id="leaderboard" className="section" aria-labelledby="lb-h">
      <div className="wrap lb">
        <Reveal className="lb__intro">
          <p className="ch-eyebrow">Competition for Good<sup>®</sup></p>
          <h2 id="lb-h" className="h-display-2">Who’s drawing the biggest crowd?</h2>
          <p className="lede">Hosts compete to throw events people show up for. Rankings count people going, nothing else.</p>
        </Reveal>
        {ranked.length === 0 ? (
          <Empty title="The board opens with the first live event">Check back once hosts publish their events.</Empty>
        ) : (
          <Reveal as="ol" className="ch-board lb__board" aria-label="Events ranked by people going">
            {ranked.map(({ event: e, going }, n) => (
              <li key={e.key} className={`ch-row ${n === 0 ? 'ch-row--leader' : ''}`}>
                <span className="ch-row__rank" aria-label={`Rank ${n + 1}`}>{n + 1}</span>
                <Avatar name={e.title.replace('#', '')} size="lg" />
                <div className="ch-row__main">
                  <div className="ch-row__head">
                    <Link to={`/events/${e.key}`} className="ch-row__tag plain-link">{e.title}</Link>
                    {n === 0 && <span className="ch-crown"><Crown aria-hidden="true" /> Leading</span>}
                    <span className="ch-row__host">Powering {s.nonprofits[e.nonprofitId]?.name}</span>
                  </div>
                  <div className="ch-row__track"><div className="ch-row__bar" style={{ '--w': `${Math.round((going / max) * 100)}%`, '--d': `${n * 120}ms` }} /></div>
                </div>
                <span className="ch-row__count">{going}<small>going</small></span>
              </li>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  )
}

/* ================= Cause layer: small, plain, three proof statements ================= */
const PROOF = [
  { icon: BadgeCheck, text: 'Every event is hosted for a verified 501(c)(3) partner.' },
  { icon: ShieldCheck, text: 'Nonprofits approve every event in their name.' },
  { icon: HandHeart, text: 'Support goes straight to the cause via Stripe.' },
]
function CauseLayer() {
  const s = useDomain()
  const active = Object.values(s.nonprofits).filter((n) => n.status === 'Active')
  const withEvents = active
    .map((n) => ({ n, count: feed(s).filter((e) => e.nonprofitId === n.id).length }))
    .filter((x) => x.count > 0)
  return (
    <section className="section section--alt" aria-labelledby="cause-h">
      <div className="wrap">
        <Reveal className="section__head section__head--stack">
          <h2 id="cause-h" className="h-display-3">And yes, it does good.</h2>
          <p className="lede">Every event is hosted for a verified nonprofit, so the fun funds something real.</p>
        </Reveal>
        <Reveal as="ul" className="proof">
          {PROOF.map((p) => (
            <li key={p.text} className="proof__item ch-accent">
              <p.icon size={22} aria-hidden="true" />
              <span>{p.text}</span>
            </li>
          ))}
        </Reveal>
        {withEvents.length > 0 && (
          <div className="feed-grid feed-grid--np">
            {withEvents.map(({ n, count }) => <NonprofitCard key={n.slug} np={n} eventCount={count} />)}
          </div>
        )}
        <p className="section__more"><Link to="/nonprofits" className="ch-btn ch-btn--secondary">All {active.length} verified partners</Link></p>
      </div>
    </section>
  )
}

/* ================= Final invitation on stage navy ================= */
function Invite() {
  const { user } = useSession()
  const host = hostTarget(user)
  const [f, setF] = useState({ name: '', email: '', idea: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const v = {}
    if (!f.name.trim()) v.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) v.email = 'Enter a valid email address.'
    if (!f.idea.trim()) v.idea = 'Tell us your idea in a sentence or two.'
    setErrors(v)
    if (!Object.keys(v).length) setSent(true)
  }
  const field = (id, label, node) => (
    <div className={`ch-field ${errors[id] ? 'ch-field--invalid' : ''}`}>
      <label className="ch-field__label" htmlFor={`i-${id}`}>{label}</label>
      {node}
      {errors[id] && <span className="ch-field__hint" id={`i-${id}-e`}>{errors[id]}</span>}
    </div>
  )

  return (
    <section id="invite" className="section invite ch-stage" aria-labelledby="invite-h">
      <div className="wrap invite__grid">
        <Reveal>
          <p className="ch-eyebrow">Host an event</p>
          <h2 id="invite-h" className="h-display-2">Got an idea? Make it an event.</h2>
          <p className="lede">Tell us what you want to throw. We’ll help you find a verified nonprofit to host it for.</p>
          {host && <p className="invite__cta"><Link to={host} className="ch-btn ch-btn--primary">Start your event</Link></p>}
        </Reveal>
        {sent ? (
          <p className="invite__sent ch-glass" role="status">Thanks, {f.name.trim().split(' ')[0]}. We got your idea. (Prototype: nothing was sent.)</p>
        ) : (
          <form className="invite__form ch-glass" onSubmit={submit} noValidate aria-label="Send us your idea">
            {field('name', 'Your name',
              <input id="i-name" className="ch-field__input" autoComplete="name" value={f.name} onChange={set('name')}
                aria-invalid={!!errors.name} aria-describedby={errors.name ? 'i-name-e' : undefined} />)}
            {field('email', 'Email',
              <input id="i-email" type="email" className="ch-field__input" autoComplete="email" value={f.email} onChange={set('email')}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'i-email-e' : undefined} />)}
            {field('idea', 'Your idea',
              <textarea id="i-idea" className="ch-field__input idea" rows={4} value={f.idea} onChange={set('idea')}
                aria-invalid={!!errors.idea} aria-describedby={errors.idea ? 'i-idea-e' : undefined} />)}
            <button className="ch-btn ch-btn--primary">Email us your idea</button>
          </form>
        )}
      </div>
    </section>
  )
}
