import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Search, MapPin, BadgeCheck, ExternalLink } from 'lucide-react'
import {
  nonprofits, categories, categoryByName, nonprofitBySlug, eventsForNonprofit, nonprofitStats,
} from '../data/index.js'
import { NonprofitCard, EventCard } from '../components/Cards.jsx'
import { CategoryIcon, Initials } from '../components/Brand.jsx'
import DonateDialog from '../components/DonateDialog.jsx'
import { money, compact } from '../lib/format.js'
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
    <section className="section">
      <div className="container">
        <p className="eyebrow">Directory</p>
        <h1 className="h1">Verified nonprofits</h1>
        <p className="lede">Every organization is checked against its EIN before it can host an event.</p>

        <div className="filters">
          <div className="field" style={{ flex: '1 1 280px' }}>
            <label htmlFor="np-q">Search nonprofits</label>
            <div className="search">
              <Search size={16} aria-hidden="true" />
              <input id="np-q" type="search" className="input" placeholder="Name, cause or city" value={q}
                onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="chips" role="group" aria-label="Filter by cause">
            {cats.map((c) => (
              <button key={c} className={`chip chip-btn ${c === cat ? 'is-on' : ''}`} aria-pressed={c === cat} onClick={() => setCat(c)}>
                {c !== 'All' && <CategoryIcon name={categoryByName[c]?.icon} size={14} />} {c}
              </button>
            ))}
          </div>
        </div>

        <p className="caption" role="status" aria-live="polite" style={{ margin: 'var(--s-md) 0' }}>
          {list.length} {list.length === 1 ? 'nonprofit' : 'nonprofits'}
        </p>
        {list.length === 0 ? (
          <p className="empty">No nonprofits match your search.</p>
        ) : (
          <div className="grid-3">
            {list.map((n) => <NonprofitCard key={n.slug} np={n} eventCount={eventsForNonprofit(n.slug).length} />)}
          </div>
        )}
      </div>
    </section>
  )
}

export function NonprofitPage() {
  const { slug } = useParams()
  const np = nonprofitBySlug[slug]
  const [donateFor, setDonateFor] = useState(null)
  if (!np) return <NotFound what="nonprofit" />
  const evs = eventsForNonprofit(np.slug)
  const st = nonprofitStats(np.slug)
  const cat = categoryByName[np.category]

  return (
    <>
      <section className="np-hero">
        <div className="container np-hero-inner">
          <Initials name={np.name} color={cat?.color} size={72} />
          <div>
            <p className="eyebrow eyebrow-light">{np.cause}</p>
            <h1 className="display" style={{ fontSize: 'clamp(32px,5vw,52px)' }}>{np.name}</h1>
            <p className="np-hero-meta">
              <span><BadgeCheck size={16} aria-hidden="true" /> Verified</span>
              <span><MapPin size={16} aria-hidden="true" /> {np.headquarters}</span>
              {np.founded && <span>Founded {np.founded}</span>}
            </p>
          </div>
        </div>
      </section>

      <div className="container section">
        <dl className="stat-row">
          <div className="card"><dt>Events hosted</dt><dd>{st.eventsHosted}</dd></div>
          <div className="card"><dt>Total raised</dt><dd>{money(st.totalRaised)}</dd></div>
          <div className="card"><dt>Backers</dt><dd>{compact(st.totalBacked)}</dd></div>
        </dl>

        <div className="np-cols">
          <div>
            <h2 className="h2">What they do</h2>
            <p style={{ marginBottom: 'var(--s-lg)' }}>{np.mission}</p>
            <h2 className="h2" style={{ marginBottom: 'var(--s-md)' }}>Events for {np.name}</h2>
            {evs.length === 0 ? (
              <p className="empty">No live events yet. <Link to="/create">Create one</Link>.</p>
            ) : (
              <div className="grid-2">{evs.map((e) => <EventCard key={e.key} event={e} onDonate={setDonateFor} />)}</div>
            )}
          </div>
          <aside className="card np-facts" aria-label="Organization details">
            <h2 className="h3">Organization details</h2>
            <dl>
              <dt>Legal name</dt><dd>{np.legalName}</dd>
              <dt>EIN</dt><dd>{np.ein}</dd>
              <dt>Headquarters</dt><dd>{np.headquarters}</dd>
              <dt>Primary cause</dt><dd>{np.cause}</dd>
            </dl>
            <a className="btn btn-ghost btn-sm" href={`https://projects.propublica.org/nonprofits/organizations/${np.ein.replace('-', '')}`}
              target="_blank" rel="noreferrer">
              View IRS filings <ExternalLink size={14} aria-hidden="true" />
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
    <section className="section">
      <div className="container">
        <p className="eyebrow">Causes</p>
        <h1 className="h1">Find a cause you care about</h1>
        <div className="grid-3" style={{ marginTop: 'var(--s-xl)' }}>
          {categories.map((c) => {
            const nps = nonprofits.filter((n) => n.category === c.name).length
            return (
              <Link key={c.name} to={`/nonprofits?cause=${encodeURIComponent(c.name)}`} className="card card-hover cause">
                <span className="cause-icon" style={{ background: c.color }}><CategoryIcon name={c.icon} size={22} /></span>
                <h2 className="h3">{c.name}</h2>
                <p className="caption">{c.description}</p>
                <p className="caption"><strong>{nps}</strong> {nps === 1 ? 'nonprofit' : 'nonprofits'}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
