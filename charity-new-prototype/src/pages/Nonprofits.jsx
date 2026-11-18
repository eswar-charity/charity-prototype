import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Search, MapPin, BadgeCheck, ExternalLink, CalendarDays } from 'lucide-react'
import {
  nonprofits, categories, categoryByName, nonprofitBySlug, eventsForNonprofit, nonprofitStats,
} from '../data/index.js'
import { NonprofitCard, EventCard } from '../components/Cards.jsx'
import { CategoryIcon, Avatar, Reveal } from '../components/Brand.jsx'
import DonateDialog from '../components/DonateDialog.jsx'
import { money } from '../lib/format.js'
import NotFound from './NotFound.jsx'

export function filterNonprofits(list, query, category) {
  const q = query.trim().toLowerCase()
  return list.filter(
    (n) =>
      (category === 'All' || n.category === category) &&
      (!q || [n.name, n.cause, n.mission, n.headquarters].some((f) => f.toLowerCase().includes(q))),
  )
}

export function NonprofitsPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const initial = params.get('cause')
  const [cat, setCat] = useState(categoryByName[initial] ? initial : 'All')
  const cats = useMemo(() => ['All', ...new Set(nonprofits.map((n) => n.category))], [])
  const list = filterNonprofits(nonprofits, q, cat)

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
                <input id="np-q" type="search" className="ch-field__input" placeholder="Name, cause or city" value={q}
                  onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="filter-row" role="group" aria-label="Filter by cause">
              {cats.map((c) => (
                <button key={c} className={`filter ${c === cat ? 'is-on' : ''}`} aria-pressed={c === cat} onClick={() => setCat(c)}>
                  {c !== 'All' && <CategoryIcon name={categoryByName[c]?.icon} size={16} />} {c}
                </button>
              ))}
            </div>
          </div>

          <p className="result-count" role="status" aria-live="polite">
            {list.length} {list.length === 1 ? 'nonprofit' : 'nonprofits'}
          </p>
          {list.length === 0 ? (
            <p className="empty">No nonprofits match that search. Try a different name or clear the filter.</p>
          ) : (
            <div className="feed-grid feed-grid--np">
              {list.map((n) => <NonprofitCard key={n.slug} np={n} eventCount={eventsForNonprofit(n.slug).length} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export function NonprofitPage() {
  const { slug } = useParams()
  const np = nonprofitBySlug[slug]
  const [donateFor, setDonateFor] = useState(null)
  if (!np) return <NotFound what="nonprofit" />
  const evs = eventsForNonprofit(np.slug)
  const st = nonprofitStats(np.slug)

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
            <li className="ch-pill ch-pill--presence"><BadgeCheck size={16} aria-hidden="true" /> Verified 501(c)(3) partner</li>
            <li><MapPin size={16} aria-hidden="true" /> {np.headquarters}</li>
            {np.founded && <li><CalendarDays size={16} aria-hidden="true" /> Founded {np.founded}</li>}
          </ul>
        </div>
      </section>

      <div className="wrap np-body">
        <Reveal as="dl" className="tiles" aria-label="Demo figures">
          <div className="tile-stat ch-accent"><dt>Events</dt><dd>{st.eventsHosted}</dd></div>
          <div className="tile-stat ch-accent"><dt>People going</dt><dd>{st.totalBacked}</dd></div>
          <div className="tile-stat ch-accent"><dt>Raised</dt><dd>{money(st.totalRaised)}</dd></div>
        </Reveal>
        <p className="demo-note">Figures are demo content.</p>

        <div className="np-cols">
          <div>
            <div className="np-about ch-accent">
              <h2 className="h-heading">What they do</h2>
              <p className="body">{np.mission}</p>
            </div>
            <h2 className="h-heading np-events-h">Events for {np.name}</h2>
            {evs.length === 0 ? (
              <p className="empty">No events yet. <Link to="/create">Host the first one.</Link></p>
            ) : (
              <div className="feed-grid feed-grid--two">{evs.map((e) => <EventCard key={e.key} event={e} onDonate={setDonateFor} />)}</div>
            )}
          </div>
          <aside className="facts" aria-label="Organization details">
            <h2 className="h-heading-sm">Organization details</h2>
            <dl>
              <dt>Legal name</dt><dd>{np.legalName}</dd>
              <dt>EIN</dt><dd>{np.ein}</dd>
              <dt>Headquarters</dt><dd>{np.headquarters}</dd>
              <dt>Primary cause</dt><dd>{np.cause}</dd>
            </dl>
            <a className="ch-btn ch-btn--secondary ch-btn--sm" href={`https://projects.propublica.org/nonprofits/organizations/${np.ein.replace('-', '')}`}
              target="_blank" rel="noreferrer">
              View IRS filings <ExternalLink size={16} aria-hidden="true" />
            </a>
          </aside>
        </div>
      </div>
      {donateFor && <DonateDialog event={donateFor} onClose={() => setDonateFor(null)} />}
    </>
  )
}

export function CausesPage() {
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
          <div className="feed-grid feed-grid--np">
            {categories.map((c) => {
              const nps = nonprofits.filter((n) => n.category === c.name).length
              return (
                <Link key={c.name} to={`/nonprofits?cause=${encodeURIComponent(c.name)}`} className="ch-card cause">
                  <span className="cause__icon"><CategoryIcon name={c.icon} size={24} /></span>
                  <h2 className="ch-card__title">{c.name}</h2>
                  <p className="cause__text">{c.description}</p>
                  <p className="cause__count"><strong>{nps}</strong> {nps === 1 ? 'nonprofit' : 'nonprofits'}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
