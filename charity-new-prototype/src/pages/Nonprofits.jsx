import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Search, MapPin, BadgeCheck, ExternalLink, CalendarDays, Check, Plus, Settings } from 'lucide-react'
import { NonprofitCard, EventCard } from '../components/Cards.jsx'
import { CategoryIcon, Avatar, Reveal } from '../components/Brand.jsx'
import { Empty, StatusBadge, dollars, plural, useRun, useToast } from '../ui/kit.jsx'
import { useGate } from '../ui/Gate.jsx'
import { useDomain, useSession } from '../domain/store.jsx'
import { ROLES } from '../domain/engine.js'
import { feed, npStats } from '../domain/selectors.js'
import NotFound from './NotFound.jsx'

/** Search by name, cause, mission or city, and narrow by cause category. */
export function filterNonprofits(list, query, category) {
  const q = query.trim().toLowerCase()
  return list.filter(
    (n) =>
      (category === 'All' || n.category === category) &&
      (!q || [n.name, n.cause, n.mission, n.headquarters].some((f) => (f ?? '').toLowerCase().includes(q))),
  )
}

const publicNonprofits = (s) => Object.values(s.nonprofits).filter((n) => n.status === 'Active').sort((a, b) => a.name.localeCompare(b.name))
const publicEventCount = (s, npId) => feed(s).filter((e) => e.nonprofitId === npId).length

export function NonprofitsPage() {
  const s = useDomain()
  const [params] = useSearchParams()
  const all = publicNonprofits(s)
  const cats = useMemo(() => ['All', ...new Set(all.map((n) => n.category).filter(Boolean))], [all])
  const initial = params.get('cause')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(cats.includes(initial) ? initial : 'All')
  const list = filterNonprofits(all, q, cat)
  const filtered = q.trim() !== '' || cat !== 'All'

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="ch-eyebrow">Nonprofits</p>
          <h1 className="h-display-2">The verified partners behind every event.</h1>
          <p className="lede">Each organization is a verified 501(c)(3) and approves every event hosted in its name.</p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="filters">
            <div className="ch-field search">
              <label className="ch-field__label" htmlFor="np-q">Search nonprofits</label>
              <div className="search__box">
                <Search size={18} aria-hidden="true" />
                <input id="np-q" type="search" className="ch-field__input" placeholder="Name, cause or city" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="filter-row" role="group" aria-label="Filter by cause">
              {cats.map((c) => (
                <button key={c} className={`filter ${c === cat ? 'is-on' : ''}`} aria-pressed={c === cat} onClick={() => setCat(c)}>
                  {c !== 'All' && <CategoryIcon name={s.categories.find((x) => x.name === c)?.icon} size={16} />} {c}
                </button>
              ))}
            </div>
          </div>

          <p className="result-count" role="status" aria-live="polite">{plural(list.length, 'nonprofit')}</p>
          {list.length === 0 ? (
            <Empty title="No nonprofits match that search" action={filtered ? <button className="ch-btn ch-btn--secondary" onClick={() => { setQ(''); setCat('All') }}>Clear search and filters</button> : null}>
              Try a different name or clear the filter.
            </Empty>
          ) : (
            <div className="feed-grid feed-grid--np">
              {list.map((n) => <NonprofitCard key={n.slug} np={n} eventCount={publicEventCount(s, n.id)} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

/** Follow / unfollow a nonprofit. Anonymous visitors pass the identity gate first. */
export function FollowButton({ np, className = '' }) {
  const s = useDomain()
  const { user } = useSession()
  const { ensureIdentity } = useGate()
  const run = useRun()
  const toast = useToast()
  const following = !!user && s.follows.some((f) => f.userId === user.id && f.nonprofitId === np.id)
  const click = async () => {
    if (!(await ensureIdentity({ action: 'follow', nonprofit: np }))) return
    const r = run('toggleFollowNonprofit', { nonprofitId: np.id })
    if (r.ok) toast(r.data.following ? `You follow ${np.name}` : `You unfollowed ${np.name}`, 'ok')
  }
  return (
    <button type="button" className={`ch-btn ${following ? 'ch-btn--secondary' : 'ch-btn--primary'} ${className}`} aria-pressed={following} onClick={click}
      aria-label={following ? `Following ${np.name}. Unfollow` : `Follow ${np.name}`}>
      {following ? <><Check size={16} aria-hidden="true" /> Following</> : <><Plus size={16} aria-hidden="true" /> Follow</>}
    </button>
  )
}

export function NonprofitPage() {
  const { slug } = useParams()
  const s = useDomain()
  const { user } = useSession()
  const np = s.nonprofits[slug]
  const own = !!np && user?.role === ROLES.NP && user.nonprofitId === np.id
  const admin = user?.role === ROLES.ADMIN
  const isPublic = np?.status === 'Active'
  if (!np || (!isPublic && !own && !admin)) return <NotFound what="nonprofit" stage />

  const evs = feed(s).filter((e) => e.nonprofitId === np.id)
  const st = npStats(s, np.id)
  const followers = s.follows.filter((f) => f.nonprofitId === np.id).length

  return (
    <>
      <section className="np-hero ch-stage">
        <span className="np-hero__glow" aria-hidden="true" />
        <p className="hero__giant" aria-hidden="true" style={{ '--len': np.name.length }}>{np.name}</p>
        <div className="wrap np-hero__inner">
          <span className="np-hero__avatar"><Avatar name={np.name} size="lg" /></span>
          <p className="ch-eyebrow">{np.cause}</p>
          <h1 className="np-hero__h1">{np.name}</h1>
          <ul className="np-hero__facts">
            <li className="ch-pill ch-pill--presence"><BadgeCheck size={16} aria-hidden="true" /> {np.verified ? 'Verified 501(c)(3) partner' : 'Not verified yet'}</li>
            {np.headquarters && <li><MapPin size={16} aria-hidden="true" /> {np.headquarters}</li>}
            {np.founded && <li><CalendarDays size={16} aria-hidden="true" /> Founded {np.founded}</li>}
            <li>{plural(followers, 'follower')}</li>
          </ul>
          <div className="np-hero__actions">
            <FollowButton np={np} />
            {own && <Link to="/np" className="ch-btn ch-btn--secondary"><Settings size={16} aria-hidden="true" /> Manage this nonprofit</Link>}
          </div>
        </div>
      </section>

      <div className="wrap np-body">
        {!isPublic && (
          <p className="banner banner--info" role="status"><StatusBadge status={np.status} /> <span>This profile is not public yet. Only you and Charity Hub can see it.</span></p>
        )}
        <Reveal as="dl" className="tiles" aria-label="Demo figures">
          <div className="tile-stat ch-accent"><dt>Events</dt><dd>{st.events}</dd></div>
          <div className="tile-stat ch-accent"><dt>People going</dt><dd>{st.joined}</dd></div>
          <div className="tile-stat ch-accent"><dt>Raised</dt><dd>{dollars(st.raised)}</dd></div>
        </Reveal>
        <p className="demo-note">Figures are demo content.</p>

        <div className="np-cols">
          <div>
            <div className="np-about ch-accent">
              <h2 className="h-heading">What they do</h2>
              <p className="body">{np.mission || 'This nonprofit has not added its mission yet.'}</p>
              {np.story && np.story !== np.mission && <p className="body">{np.story}</p>}
            </div>
            <h2 className="h-heading np-events-h">Events for {np.name}</h2>
            {evs.length === 0 ? (
              <Empty title="No public events yet" action={<Link to="/#discover" className="ch-btn ch-btn--secondary">Browse all events</Link>}>
                Events hosted for {np.name} appear here once they are live.
              </Empty>
            ) : (
              <div className="feed-grid feed-grid--two">{evs.map((e) => <EventCard key={e.key} event={e} />)}</div>
            )}
          </div>
          <aside className="facts" aria-label="Organization details">
            <h2 className="h-heading-sm">Organization details</h2>
            <dl>
              <dt>Legal name</dt><dd>{np.legalName || np.name}</dd>
              {np.ein && <><dt>EIN</dt><dd>{np.ein}</dd></>}
              {np.headquarters && <><dt>Headquarters</dt><dd>{np.headquarters}</dd></>}
              <dt>Primary cause</dt><dd>{np.cause || np.category}</dd>
            </dl>
            {np.ein && (
              <a className="ch-btn ch-btn--secondary ch-btn--sm" href={`https://projects.propublica.org/nonprofits/organizations/${np.ein.replace('-', '')}`} target="_blank" rel="noreferrer">
                View IRS filings <ExternalLink size={16} aria-hidden="true" />
              </a>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}

export function CausesPage() {
  const s = useDomain()
  const nps = publicNonprofits(s)
  const live = feed(s)
  const rows = s.categories
    .map((c) => ({ c, nps: nps.filter((n) => n.category === c.name).length, events: live.filter((e) => e.category === c.name).length }))
    .filter((r) => r.nps > 0 || r.events > 0)

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="ch-eyebrow">Causes</p>
          <h1 className="h-display-2">Pick a cause. Find the events behind it.</h1>
          <p className="lede">Every event supports one of these causes through a verified nonprofit partner.</p>
        </div>
      </section>
      <section className="section section--tight">
        <div className="wrap">
          {rows.length === 0 ? <Empty title="No causes yet">Causes appear when nonprofits are verified.</Empty> : (
            <div className="feed-grid feed-grid--np">
              {rows.map(({ c, nps: n, events }) => (
                <Link key={c.name} to={n > 0 ? `/nonprofits?cause=${encodeURIComponent(c.name)}` : `/?cause=${encodeURIComponent(c.name)}#discover`} className="ch-card cause">
                  <span className="cause__icon"><CategoryIcon name={c.icon} size={24} /></span>
                  <h2 className="ch-card__title">{c.name}</h2>
                  <p className="cause__text">{c.description}</p>
                  <p className="cause__count"><strong>{n}</strong> {n === 1 ? 'nonprofit' : 'nonprofits'} · <strong>{events}</strong> {events === 1 ? 'event' : 'events'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
