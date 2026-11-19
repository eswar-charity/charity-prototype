import { LayoutGrid, Rows3, Search, X } from 'lucide-react'
import { Tabs } from '../../../ui/kit.jsx'
import { RANGES, SORTS, TABS, defaultSort, isFiltered, tabById } from './model.js'

const STATUS_LABEL = { draft: 'Draft', attention: 'Needs your attention', waiting: 'Waiting for approval', live: 'Live now', paused: 'Paused' }
const statusOptions = (tab) => ({ drafts: ['draft', 'attention', 'waiting'], live: ['live', 'paused'], all: ['draft', 'attention', 'waiting', 'live', 'paused'], overview: ['draft', 'attention', 'waiting', 'live', 'paused'] }[tab] ?? [])

/** Tabs, search, filters and sort. Everything writes to the URL through onChange, so any view can be shared. */
export default function Toolbar({ f, counts, facets, onChange, onClear, resultCount }) {
  const sort = f.sort || defaultSort(f.tab)
  const statuses = statusOptions(f.tab)
  const chips = [
    f.q.trim() && { id: 'q', label: `Search: ${f.q.trim()}`, clear: { q: '' } },
    f.status && { id: 'status', label: STATUS_LABEL[f.status], clear: { status: '' } },
    f.cat && { id: 'cat', label: f.cat, clear: { cat: '' } },
    f.np && { id: 'np', label: facets.nps.find((n) => n.id === f.np)?.name ?? f.np, clear: { np: '' } },
    f.range !== 'any' && { id: 'range', label: f.range === 'custom' ? `${f.from || 'Any'} to ${f.to || 'any'}` : RANGES.find((r) => r.id === f.range).label, clear: { range: 'any', from: '', to: '' } },
  ].filter(Boolean)

  return (
    <div className="tbar">
      <Tabs
        label="Event views"
        value={f.tab}
        onChange={(tab) => onChange({ tab, status: '' })}
        tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: t.id === 'overview' ? undefined : counts.tabs[t.id] }))}
      />

      <div className="tbar__row" role="search" aria-label="Search and filter events">
        <label className="tbar__search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search events</span>
          <input type="search" placeholder="Search by name, place, nonprofit or cause" value={f.q} onChange={(e) => onChange({ q: e.target.value })} />
        </label>

        <details className="tbar__filters" open>
          <summary>Filters{chips.length > 0 && <span className="tbar__n">{chips.length}</span>}</summary>
          <div className="tbar__grid">
            {statuses.length > 0 && (
              <label>Status
                <select value={f.status} onChange={(e) => onChange({ status: e.target.value })}>
                  <option value="">All statuses</option>
                  {statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
            )}
            <label>Cause
              <select value={f.cat} onChange={(e) => onChange({ cat: e.target.value })}>
                <option value="">All causes</option>
                {facets.cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Nonprofit
              <select value={f.np} onChange={(e) => onChange({ np: e.target.value })}>
                <option value="">All nonprofits</option>
                {facets.nps.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
            <label>Date
              <select value={f.range} onChange={(e) => onChange({ range: e.target.value })}>
                {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            {f.range === 'custom' && (
              <>
                <label>From<input type="date" value={f.from} onChange={(e) => onChange({ from: e.target.value })} /></label>
                <label>To<input type="date" value={f.to} onChange={(e) => onChange({ to: e.target.value })} /></label>
              </>
            )}
            <label>Sort by
              <select value={sort} onChange={(e) => onChange({ sort: e.target.value })}>
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>
        </details>

        <div className="tbar__view" role="group" aria-label="View">
          <button type="button" aria-pressed={f.view !== 'table'} onClick={() => onChange({ view: 'cards' })}><LayoutGrid size={16} aria-hidden="true" /> Cards</button>
          <button type="button" aria-pressed={f.view === 'table'} onClick={() => onChange({ view: 'table' })}><Rows3 size={16} aria-hidden="true" /> Table</button>
        </div>
      </div>

      {(chips.length > 0 || isFiltered(f)) && (
        <div className="tbar__chips">
          <p role="status" aria-live="polite" className="tbar__result"><strong>{resultCount.toLocaleString()}</strong> {resultCount === 1 ? 'event matches' : 'events match'}{f.tab !== 'overview' && f.tab !== 'all' ? ` in ${tabById(f.tab).label}` : ''}</p>
          <ul>
            {chips.map((c) => (
              <li key={c.id}><button type="button" onClick={() => onChange(c.clear)} aria-label={`Remove filter: ${c.label}`}>{c.label} <X size={14} aria-hidden="true" /></button></li>
            ))}
          </ul>
          <button type="button" className="link-btn" onClick={onClear}>Clear all filters</button>
        </div>
      )}
    </div>
  )
}
