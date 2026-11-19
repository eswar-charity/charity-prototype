// Pure logic behind the SE events console: stages, rows, filters, search, sorting, pagination, URL state.
// No React here, so it can be tested alone and stays fast at 1,000+ events (everything is one pass over the list).
import { eventTotals, startsAt } from '../../../domain/engine.js'
import { timing, photoList, seEvents } from '../../../domain/selectors.js'

/* ------------------------------------------------------------------ stages */
/** Where an event is in its life, in the words an organizer uses. Derived from status plus the prototype clock. */
export const STAGES = {
  draft: { label: 'Draft', tone: 'neutral' },
  changes: { label: 'Needs changes', tone: 'warn' },
  rejected: { label: 'Not approved', tone: 'danger' },
  waiting: { label: 'Waiting for approval', tone: 'info' },
  live: { label: 'Live now', tone: 'live' },
  paused: { label: 'Paused', tone: 'danger' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  closed: { label: 'Closed', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
}
export const STAGE_IDS = Object.keys(STAGES)

export function stageOf(s, ev) {
  switch (ev.status) {
    case 'Draft': return 'draft'
    case 'Changes Requested': return 'changes'
    case 'Rejected': return 'rejected'
    case 'Submitted': return 'waiting'
    case 'Blocked': return 'paused'
    case 'Completed': return 'closed'
    case 'Archived': return 'archived'
    default: { // Live
      const t = timing(s, ev)
      return t === 'live' ? 'live' : t === 'upcoming' ? 'upcoming' : 'closed'
    }
  }
}

/** The tabs: each owns a set of stages. */
export const TABS = [
  { id: 'overview', label: 'Overview', stages: STAGE_IDS },
  { id: 'drafts', label: 'Drafts', stages: ['draft', 'changes', 'rejected', 'waiting'] },
  { id: 'live', label: 'Live now', stages: ['live', 'paused'] },
  { id: 'upcoming', label: 'Upcoming', stages: ['upcoming'] },
  { id: 'closed', label: 'Closed', stages: ['closed'] },
  { id: 'archived', label: 'Archived', stages: ['archived'] },
  { id: 'all', label: 'All events', stages: STAGE_IDS },
]
export const tabById = (id) => TABS.find((t) => t.id === id) ?? TABS[0]

/** The pipeline bar: one segment per step of an event's life; clicking one filters to it. */
export const PIPELINE = [
  { id: 'draft', label: 'Drafts', stages: ['draft'], tab: 'drafts', status: 'draft' },
  { id: 'changes', label: 'Needs changes', stages: ['changes', 'rejected'], tab: 'drafts', status: 'attention' },
  { id: 'waiting', label: 'Waiting for approval', stages: ['waiting'], tab: 'drafts', status: 'waiting' },
  { id: 'live', label: 'Live now', stages: ['live', 'paused'], tab: 'live', status: '' },
  { id: 'upcoming', label: 'Upcoming', stages: ['upcoming'], tab: 'upcoming', status: '' },
  { id: 'closed', label: 'Closed', stages: ['closed'], tab: 'closed', status: '' },
  { id: 'archived', label: 'Archived', stages: ['archived'], tab: 'archived', status: '' },
]

/** Status refinements inside a tab. 'attention' groups the two stages that need the organizer to act. */
export const STATUS_FILTERS = {
  draft: ['draft'], attention: ['changes', 'rejected'], changes: ['changes'], rejected: ['rejected'], waiting: ['waiting'], paused: ['paused'], live: ['live'],
}

/* ------------------------------------------------------------------ draft completeness */
const CHECKS = [
  ['photo', 'Add a photo', (ev) => photoList(ev).length > 0],
  ['story', 'Tell the story', (ev) => !!ev.story?.trim()],
  ['nonprofit', 'Choose a nonprofit', (ev) => !!ev.nonprofitId],
  ['when', 'Set the date and times', (ev) => !!(ev.date && ev.start && ev.end)],
  ['where', 'Add a location', (ev) => !!ev.location?.trim()],
  ['guidelines', 'Accept the guidelines', (ev) => !!ev.guidelinesAccepted],
]
/** What a draft still needs before it can be submitted (the same rules the engine enforces on submit). */
export function completeness(ev) {
  const missing = CHECKS.filter(([, , ok]) => !ok(ev)).map(([id, label]) => ({ id, label }))
  return { done: CHECKS.length - missing.length, total: CHECKS.length, missing, ready: missing.length === 0 }
}

/* ------------------------------------------------------------------ rows */
/** One flat, pre-computed row per event: filter and sort never touch the domain state again. */
export function buildRows(s, userId) {
  return seEvents(s, userId).map((ev) => {
    const stage = stageOf(s, ev)
    const t = eventTotals(s, ev.key)
    const np = s.nonprofits[ev.nonprofitId]?.name ?? ''
    const st = startsAt(ev)
    return {
      key: ev.key, ev, stage, np, npId: ev.nonprofitId || '', category: ev.category || '',
      startMs: st ? st.getTime() : null, createdMs: new Date(ev.createdAt).getTime(),
      going: t.joined, raised: t.raised, backed: t.backed, checkedIn: ev.checkins.length,
      title: ev.title,
      hay: `${ev.title} ${ev.key} ${ev.location ?? ''} ${np} ${ev.category ?? ''} ${STAGES[stage].label} ${ev.date ?? ''}`.toLowerCase(),
    }
  })
}

export function countBy(rows) {
  const stages = Object.fromEntries(STAGE_IDS.map((id) => [id, 0]))
  for (const r of rows) stages[r.stage]++
  const tabs = Object.fromEntries(TABS.map((t) => [t.id, t.id === 'overview' ? 0 : rows.filter((r) => t.stages.includes(r.stage)).length]))
  return { stages, tabs, total: rows.length }
}

/* ------------------------------------------------------------------ filters */
export const RANGES = [
  { id: 'any', label: 'Any date' },
  { id: 'next7', label: 'Next 7 days' },
  { id: 'next30', label: 'Next 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'past30', label: 'Past 30 days' },
  { id: 'custom', label: 'Choose dates' },
]
export const SORTS = [
  { id: 'date-asc', label: 'Date: soonest first' },
  { id: 'date-desc', label: 'Date: latest first' },
  { id: 'created-desc', label: 'Recently created' },
  { id: 'title', label: 'Title: A to Z' },
  { id: 'title-desc', label: 'Title: Z to A' },
  { id: 'going-desc', label: 'Most people going' },
  { id: 'raised-desc', label: 'Most raised' },
]
export const PAGE_SIZES = [12, 24, 48, 96]
const SORT_IDS = new Set([...SORTS.map((x) => x.id), 'going-asc', 'raised-asc'])

export const defaultSort = (tab) => ({ drafts: 'created-desc', live: 'date-asc', upcoming: 'date-asc', closed: 'date-desc', archived: 'date-desc', all: 'created-desc' }[tab] ?? 'date-asc')
export const DEFAULT_FILTERS = { tab: 'overview', status: '', q: '', cat: '', np: '', range: 'any', from: '', to: '', sort: '', view: '', page: 1, size: 24 }

/** URL → filters, with every value checked so a hand-edited link can never break the page. */
export function parseFilters(params) {
  const g = (k) => params.get(k) ?? ''
  const tab = tabById(g('tab')).id
  const range = RANGES.some((r) => r.id === g('range')) ? g('range') : 'any'
  const size = PAGE_SIZES.includes(Number(g('size'))) ? Number(g('size')) : DEFAULT_FILTERS.size
  const page = Math.max(1, Math.floor(Number(g('page'))) || 1)
  const iso = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')
  return {
    tab, status: STATUS_FILTERS[g('status')] ? g('status') : '', q: g('q').slice(0, 80), cat: g('cat'), np: g('np'),
    range, from: iso(g('from')), to: iso(g('to')), sort: SORT_IDS.has(g('sort')) ? g('sort') : '', view: ['cards', 'table'].includes(g('view')) ? g('view') : '', page, size,
  }
}
/** Filters → URL (defaults are omitted so shared links stay short). */
export function filtersToParams(f) {
  const p = new URLSearchParams()
  const put = (k, v, d = '') => { if (v !== d && v !== '' && v != null) p.set(k, String(v)) }
  put('tab', f.tab, 'overview'); put('status', f.status); put('q', f.q.trim()); put('cat', f.cat); put('np', f.np)
  put('range', f.range, 'any'); if (f.range === 'custom') { put('from', f.from); put('to', f.to) }
  put('sort', f.sort); put('view', f.view); put('page', f.page, 1); put('size', f.size, DEFAULT_FILTERS.size)
  return p
}
/** Is anything narrowing the list (beyond which tab we are on)? */
export const isFiltered = (f) => !!(f.q.trim() || f.cat || f.np || f.status || f.range !== 'any')
/** The overview shows structured sections; any narrowing or other tab shows the paginated results. */
export const showsOverview = (f) => f.tab === 'overview' && !isFiltered(f)

const DAY = 864e5
function rangeBounds(f, nowMs) {
  const d = new Date(nowMs)
  switch (f.range) {
    case 'next7': return [nowMs, nowMs + 7 * DAY]
    case 'next30': return [nowMs, nowMs + 30 * DAY]
    case 'past30': return [nowMs - 30 * DAY, nowMs]
    case 'month': return [new Date(d.getFullYear(), d.getMonth(), 1).getTime(), new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1]
    case 'custom': {
      const a = f.from ? new Date(`${f.from}T00:00:00`).getTime() : -Infinity
      const b = f.to ? new Date(`${f.to}T23:59:59`).getTime() : Infinity
      return [a, b]
    }
    default: return null
  }
}

export function filterRows(rows, f, nowMs) {
  const stages = new Set(tabById(f.tab).stages)
  const only = f.status ? new Set(STATUS_FILTERS[f.status]) : null
  const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean)
  const bounds = rangeBounds(f, nowMs)
  return rows.filter((r) => {
    if (!stages.has(r.stage)) return false
    if (only && !only.has(r.stage)) return false
    if (f.cat && r.category !== f.cat) return false
    if (f.np && r.npId !== f.np) return false
    if (bounds && (r.startMs == null || r.startMs < bounds[0] || r.startMs > bounds[1])) return false // undated drafts never match a date range
    for (const t of tokens) if (!r.hay.includes(t)) return false
    return true
  })
}

const byTitle = (a, b) => a.title.localeCompare(b.title) || a.key.localeCompare(b.key)
export function sortRows(rows, sort) {
  const dated = (dir) => (a, b) => {
    // undated drafts always sink to the bottom, whichever way we sort
    if (a.startMs == null && b.startMs == null) return byTitle(a, b)
    if (a.startMs == null) return 1
    if (b.startMs == null) return -1
    return (a.startMs - b.startMs) * dir || byTitle(a, b)
  }
  const cmp = {
    'date-asc': dated(1), 'date-desc': dated(-1),
    'created-desc': (a, b) => b.createdMs - a.createdMs || byTitle(a, b),
    title: byTitle, 'title-desc': (a, b) => -byTitle(a, b),
    'going-desc': (a, b) => b.going - a.going || byTitle(a, b), 'going-asc': (a, b) => a.going - b.going || byTitle(a, b),
    'raised-desc': (a, b) => b.raised - a.raised || byTitle(a, b), 'raised-asc': (a, b) => a.raised - b.raised || byTitle(a, b),
  }[sort] ?? dated(1)
  return [...rows].sort(cmp)
}

export function paginate(rows, page, size) {
  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / size))
  const p = Math.min(Math.max(1, page), pages)
  const from = total === 0 ? 0 : (p - 1) * size + 1
  const to = Math.min(total, p * size)
  return { items: rows.slice((p - 1) * size, p * size), total, pages, page: p, from, to }
}
/** Page numbers to show: first, last, and a window around the current one, with gaps as null. */
export function pageWindow(page, pages) {
  const keep = new Set([1, pages, page - 1, page, page + 1])
  const list = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out = []
  list.forEach((n, i) => { if (i && n - list[i - 1] > 1) out.push(null); out.push(n) })
  return out
}

/** Distinct values in the list, for the filter dropdowns. */
export function facets(rows) {
  const cats = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort()
  const nps = new Map()
  rows.forEach((r) => { if (r.npId) nps.set(r.npId, r.np) })
  return { cats, nps: [...nps].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)) }
}

/** Which actions make sense for an event in this stage (the engine still has the final say). */
export function actionsFor(stage, ev, ready) {
  const a = { primary: null, edit: false, preview: false, publicPage: false, submit: false, duplicate: true, archive: false, restore: false, remove: false }
  if (stage === 'draft') { a.primary = 'resume'; a.edit = true; a.preview = true; a.submit = ready; a.remove = true }
  else if (stage === 'changes') { a.primary = 'fix'; a.edit = true; a.preview = true }
  else if (stage === 'rejected') { a.primary = 'fix'; a.edit = true; a.preview = true; a.remove = true }
  else if (stage === 'waiting') { a.primary = 'status'; a.preview = true }
  else if (stage === 'live' || stage === 'paused') { a.primary = 'dashboard'; a.publicPage = stage === 'live' }
  else if (stage === 'upcoming') { a.primary = 'dashboard'; a.publicPage = true }
  else if (stage === 'closed') { a.primary = 'impact'; a.publicPage = true; a.archive = true }
  else if (stage === 'archived') { a.primary = 'impact'; a.publicPage = true; a.restore = true }
  return a
}
