// The SE home: everything an organizer is running, fixing and planning, built to stay usable at 1,000+ events.
// All view state (tab, search, filters, sort, page, view) lives in the URL, so any view can be shared or bookmarked.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Archive, Copy, Plus, Trash2 } from 'lucide-react'
import { useDomain, useSession } from '../../../domain/store.jsx'
import { Empty, PageHeader, Section, plural } from '../../../ui/kit.jsx'
import { editLink } from '../Drafts.jsx'
import EventCardRich from './EventCardRich.jsx'
import EventTable from './EventTable.jsx'
import Pagination from './Pagination.jsx'
import Pipeline from './Pipeline.jsx'
import Toolbar from './Toolbar.jsx'
import { useEventActions } from './actions.js'
import {
  DEFAULT_FILTERS, PIPELINE, buildRows, countBy, defaultSort, facets, filterRows, filtersToParams, isFiltered, paginate, parseFilters, showsOverview, sortRows,
} from './model.js'

const PREVIEW = 6 // events per section on the overview; "See all" opens the full paginated list

export default function EventsConsole() {
  const s = useDomain()
  const { user, now } = useSession()
  const nowMs = now.getTime()
  const [sp, setSp] = useSearchParams()
  const actions = useEventActions()
  const results = useRef(null)
  const [selected, setSelected] = useState(() => new Set())

  const key = sp.toString()
  const f = useMemo(() => parseFilters(sp), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => buildRows(s, user.id), [s, user.id])
  const counts = useMemo(() => countBy(rows), [rows])
  const facet = useMemo(() => facets(rows), [rows])
  const sort = f.sort || defaultSort(f.tab)
  const matched = useMemo(() => sortRows(filterRows(rows, f, nowMs), sort), [rows, f, nowMs, sort])
  const pg = useMemo(() => paginate(matched, f.page, f.size), [matched, f.page, f.size])
  const overview = showsOverview(f)
  const samples = useMemo(() => rows.filter((r) => r.ev.sample).length, [rows])

  useEffect(() => setSelected(new Set()), [key]) // a new view starts with nothing selected

  const change = (patch) => {
    const next = { ...f, ...patch }
    if (!('page' in patch)) next.page = 1
    setSp(filtersToParams(next), { replace: true })
  }
  const clear = () => setSp(filtersToParams({ ...DEFAULT_FILTERS, tab: f.tab, view: f.view, size: f.size }), { replace: true })
  const goPage = (n) => { change({ page: n }); results.current?.scrollIntoView?.({ block: 'start' }) }
  const activeSeg = f.tab === 'overview' ? null : PIPELINE.find((g) => g.tab === f.tab && g.status === f.status)?.id ?? null

  const toggle = (k) => setSelected((cur) => { const n = new Set(cur); n.has(k) ? n.delete(k) : n.add(k); return n })
  const toggleAll = () => setSelected((cur) => (pg.items.every((r) => cur.has(r.key)) ? new Set() : new Set(pg.items.map((r) => r.key))))
  const picked = useMemo(() => rows.filter((r) => selected.has(r.key)), [rows, selected])
  const bulk = async (action) => { if (await actions.bulk(action, picked)) setSelected(new Set()) }

  const card = (row, extra = {}) => <li key={row.key}><EventCardRich row={row} now={nowMs} actions={actions} {...extra} /></li>
  const byStages = (ids, order) => sortRows(rows.filter((r) => ids.includes(r.stage)), order)
  const attention = byStages(['changes', 'rejected'], 'created-desc')

  return (
    <>
      <PageHeader
        eyebrow="Social entrepreneur"
        title="Your events"
        lede="Everything you are running, fixing and planning, in one place."
        actions={<Link className="ch-btn ch-btn--primary" to="/se/create"><Plus size={18} aria-hidden="true" /> Create event</Link>}
      />

      {rows.length === 0 ? (
        <Empty title="You have not created an event yet." action={<Link className="ch-btn ch-btn--primary" to="/se/create">Create your first event</Link>}>
          Start with the photos and the story. Your draft saves as you go, and you can come back to it here.
        </Empty>
      ) : (
        <>
          <Pipeline counts={counts} active={activeSeg} onPick={(seg) => (seg ? change({ tab: seg.tab, status: seg.status }) : change({ tab: 'overview', status: '' }))} />
          {samples > 0 && <p className="demo-note evs-sample">This list includes {samples.toLocaleString()} sample events from Demo tools. They never appear in public feeds or on other people’s screens.</p>}

          {overview && attention.length > 0 && (
            <Section title="Needs your attention" id="se-attention" aside={<Link className="link-btn" to="/se?tab=drafts&status=attention">See all {attention.length}</Link>}>
              <ul className="evs-attn">
                {attention.slice(0, 3).map((r) => {
                  const e = editLink(r.ev)
                  return (
                    <li key={r.key}>
                      <div className="stack">
                        <strong>{r.ev.title}</strong>
                        <p className="ch-muted">{r.stage === 'rejected' ? r.ev.review?.reason : r.ev.review?.feedback}</p>
                      </div>
                      <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={e.to}>{e.label}</Link>
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}

          <Toolbar f={f} counts={counts} facets={facet} onChange={change} onClear={clear} resultCount={matched.length} />

          {overview ? (
            <Overview rows={rows} byStages={byStages} counts={counts} card={card} />
          ) : (
            <section id="results" ref={results} aria-label="Results" className="evs-results">
              {matched.length === 0 ? (
                isFiltered(f) ? (
                  <Empty title="No events match." action={<button type="button" className="ch-btn ch-btn--secondary" onClick={clear}>Clear all filters</button>}>
                    Try a shorter search or remove a filter. {counts.total.toLocaleString()} events are in your list.
                  </Empty>
                ) : (
                  <Empty title="Nothing here yet." action={<Link className="ch-btn ch-btn--primary" to="/se/create">Create event</Link>}>
                    Events show up in this view as they move through their life. {counts.total.toLocaleString()} are in your list.
                  </Empty>
                )
              ) : (
                <>
                  {f.view !== 'table' && (
                    <label className="evs-all">
                      <input type="checkbox" checked={pg.items.every((r) => selected.has(r.key))} onChange={toggleAll} />
                      <span>Select all {pg.items.length} on this page</span>
                    </label>
                  )}
                  {f.view === 'table' ? (
                    <EventTable rows={pg.items} now={nowMs} actions={actions} selected={selected} onToggle={toggle} onToggleAll={toggleAll} sort={sort} onSort={(v) => change({ sort: v })} />
                  ) : (
                    <ul className="evs-grid">{pg.items.map((r) => card(r, { selectable: true, selected: selected.has(r.key), onToggle: toggle }))}</ul>
                  )}
                  <Pagination page={pg} onPage={goPage} size={f.size} onSize={(n) => change({ size: n })} />
                </>
              )}
            </section>
          )}

          {selected.size > 0 && (
            <div className="bulk" role="region" aria-label="Bulk actions">
              <p><strong>{plural(selected.size, 'event')}</strong> selected</p>
              <div className="bulk__btns">
                <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => bulk('duplicate')}><Copy size={16} aria-hidden="true" /> Duplicate</button>
                <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => bulk('archive')}><Archive size={16} aria-hidden="true" /> Archive</button>
                <button type="button" className="ch-btn ch-btn--danger ch-btn--sm" onClick={() => bulk('delete')}><Trash2 size={16} aria-hidden="true" /> Delete</button>
                <button type="button" className="link-btn" onClick={() => setSelected(new Set())}>Clear selection</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

/** The structured overview: Live now, Upcoming, Drafts, and what is waiting. Each shows a few events and links to the rest. */
function Overview({ byStages, counts, card }) {
  const live = byStages(['live', 'paused'], 'date-asc')
  const upcoming = byStages(['upcoming'], 'date-asc')
  const drafts = byStages(['draft'], 'created-desc')
  const waiting = byStages(['waiting'], 'created-desc')
  const block = (id, title, list, total, href, empty) => (
    <Section key={id} id={id} title={title} aside={total > PREVIEW ? <Link className="link-btn" to={href}>See all {total.toLocaleString()}</Link> : total > 0 ? <span className="ch-muted">{plural(total, 'event')}</span> : null}>
      {list.length === 0 ? empty : <ul className="evs-grid">{list.slice(0, PREVIEW).map((r) => card(r))}</ul>}
    </Section>
  )
  const create = <Link className="ch-btn ch-btn--primary" to="/se/create">Create event</Link>
  return (
    <div className="evs-sections">
      {block('se-live', 'Live now', live, counts.stages.live + counts.stages.paused, '/se?tab=live',
        <Empty title="Nothing is running right now.">When an event starts, its numbers and check-in tools show up here.</Empty>)}
      {block('se-upcoming', 'Upcoming', upcoming, counts.stages.upcoming, '/se?tab=upcoming',
        <Empty title="No upcoming events." action={create}>Plan the next one and it will wait here until it starts.</Empty>)}
      {block('se-drafts', 'Drafts', drafts, counts.stages.draft, '/se?tab=drafts&status=draft',
        <Empty title="No drafts right now." action={create}>Drafts save as you go, so you can leave and pick them up here.</Empty>)}
      {waiting.length > 0 && block('se-waiting', 'Waiting for approval', waiting, counts.stages.waiting, '/se?tab=drafts&status=waiting', null)}
    </div>
  )
}
