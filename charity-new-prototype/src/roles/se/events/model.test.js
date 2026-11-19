import { describe, it, expect, beforeAll } from 'vitest'
import { createEngine } from '../../../domain/engine.js'
import { buildSeed } from '../../../domain/seed.js'
import {
  PAGE_SIZES, buildRows, completeness, countBy, defaultSort, facets, filterRows, filtersToParams, pageWindow, paginate, parseFilters, showsOverview, sortRows, stageOf, DEFAULT_FILTERS, actionsFor,
} from './model.js'

const NOW = '2026-11-18T12:00:00.000Z'
const nowMs = new Date(NOW).getTime()
const f = (over = {}) => ({ ...DEFAULT_FILTERS, ...over })
let state, rows
beforeAll(() => {
  const e = createEngine(buildSeed(NOW))
  e.dispatch('signIn', { email: 'mike.rivera@demo.charityhub.com', password: 'Passw0rd!' })
  e.dispatch('demoGenerateEvents', { count: 1000 })
  state = e.getState()
  rows = buildRows(state, 'u_mike')
})

describe('stages', () => {
  it('maps status and the clock to the organizer’s words', () => {
    const real = buildRows(buildSeed(NOW), 'u_mike')
    const by = Object.fromEntries(real.map((r) => [r.key, r.stage]))
    expect(by).toMatchObject({ 'neon-night': 'closed', 'golf-outing': 'closed', 'dog-dad': 'upcoming', 'give-now': 'upcoming', 'spring-sprint': 'draft' })
    const s = buildSeed(NOW)
    expect(stageOf(s, { ...s.events['dog-dad'], status: 'Blocked' })).toBe('paused')
    expect(stageOf(s, s.events['river-cleanup'])).toBe('live')
    expect(stageOf(s, { ...s.events['neon-night'], status: 'Completed' })).toBe('closed')
    expect(stageOf(s, { ...s.events['neon-night'], status: 'Archived' })).toBe('archived')
    expect(stageOf(s, s.events['paws-in-the-park'])).toBe('waiting')
    expect(stageOf(s, s.events['book-drive-bash'])).toBe('changes')
    expect(stageOf(s, s.events['karaoke-for-kids'])).toBe('rejected')
  })
  it('counts every stage, and the per-tab totals add up', () => {
    const c = countBy(rows)
    expect(c.total).toBe(1006)
    expect(Object.values(c.stages).reduce((a, b) => a + b, 0)).toBe(1006)
    expect(c.tabs.all).toBe(1006)
    expect(c.tabs.drafts + c.tabs.live + c.tabs.upcoming + c.tabs.closed + c.tabs.archived).toBe(1006)
  })
})

describe('draft completeness', () => {
  it('lists exactly what the engine will insist on at submit', () => {
    const blank = { photoKey: '', photos: [], story: '', nonprofitId: '', date: '', start: '', end: '', location: '', guidelinesAccepted: false }
    const c = completeness(blank)
    expect(c).toMatchObject({ done: 0, total: 6, ready: false })
    expect(c.missing.map((m) => m.label)).toEqual(['Add a photo', 'Tell the story', 'Choose a nonprofit', 'Set the date and times', 'Add a location', 'Accept the guidelines'])
    expect(completeness({ ...blank, photos: ['/x.jpg'], story: 'Hi', nonprofitId: 'aspca', date: 'Dec 1, 2026', start: '9:00 AM', end: '1:00 PM', location: 'Here', guidelinesAccepted: true })).toMatchObject({ done: 6, ready: true })
  })
})

describe('URL state', () => {
  it('round-trips, drops defaults, and never trusts the address bar', () => {
    const full = f({ tab: 'upcoming', q: 'harbor', cat: 'Health', np: 'aspca', range: 'custom', from: '2026-12-01', to: '2026-12-31', sort: 'title', view: 'table', page: 3, size: 48, status: '' })
    expect(parseFilters(filtersToParams(full))).toMatchObject({ tab: 'upcoming', q: 'harbor', cat: 'Health', np: 'aspca', range: 'custom', from: '2026-12-01', to: '2026-12-31', sort: 'title', view: 'table', page: 3, size: 48 })
    expect(filtersToParams(f()).toString()).toBe('')
    const junk = parseFilters(new URLSearchParams('tab=nope&status=wow&range=bad&sort=zzz&view=grid&page=-4&size=7&from=tomorrow&q=' + 'x'.repeat(500)))
    expect(junk).toMatchObject({ tab: 'overview', status: '', range: 'any', sort: '', view: '', page: 1, size: 24, from: '' })
    expect(junk.q.length).toBe(80)
    expect(PAGE_SIZES).toContain(junk.size)
  })
  it('shows the overview only when nothing narrows the list', () => {
    expect(showsOverview(f())).toBe(true)
    expect(showsOverview(f({ tab: 'live' }))).toBe(false)
    expect(showsOverview(f({ q: 'x' }))).toBe(false)
    expect(showsOverview(f({ range: 'next7' }))).toBe(false)
  })
})

describe('filtering', () => {
  const run = (over) => filterRows(rows, f(over), nowMs)
  it('keeps each tab to its own stages', () => {
    expect(run({ tab: 'upcoming' }).every((r) => r.stage === 'upcoming')).toBe(true)
    expect(run({ tab: 'drafts' }).every((r) => ['draft', 'changes', 'rejected', 'waiting'].includes(r.stage))).toBe(true)
    expect(run({ tab: 'live' }).every((r) => ['live', 'paused'].includes(r.stage))).toBe(true)
    expect(run({ tab: 'all' })).toHaveLength(1006)
  })
  it('narrows by status inside a tab', () => {
    const attention = run({ tab: 'drafts', status: 'attention' })
    expect(attention.length).toBeGreaterThan(0)
    expect(attention.every((r) => ['changes', 'rejected'].includes(r.stage))).toBe(true)
    expect(run({ tab: 'drafts', status: 'waiting' }).every((r) => r.stage === 'waiting')).toBe(true)
  })
  it('searches by title, place, nonprofit, cause and status; every word must match; case does not matter', () => {
    const first = rows.find((r) => r.np)
    expect(run({ tab: 'all', q: first.title.toUpperCase() }).some((r) => r.key === first.key)).toBe(true)
    const both = run({ tab: 'all', q: `${first.title} ${first.np}` })
    expect(both.length).toBeGreaterThan(0)
    expect(both.every((r) => r.hay.includes(first.title.toLowerCase()) && r.hay.includes(first.np.toLowerCase()))).toBe(true)
    expect(run({ tab: 'all', q: 'zzzz-no-such-thing' })).toHaveLength(0)
    expect(run({ tab: 'all', q: 'closed' }).every((r) => r.stage === 'closed' || r.hay.includes('closed'))).toBe(true)
  })
  it('filters by cause and nonprofit, and the dropdown choices come from the list', () => {
    const fa = facets(rows)
    expect(fa.cats.length).toBeGreaterThan(5)
    const cat = fa.cats[0], np = fa.nps[0]
    expect(run({ tab: 'all', cat }).every((r) => r.category === cat)).toBe(true)
    expect(run({ tab: 'all', np: np.id }).every((r) => r.npId === np.id)).toBe(true)
    expect(run({ tab: 'all', cat, np: np.id }).length).toBeLessThanOrEqual(Math.min(run({ tab: 'all', cat }).length, run({ tab: 'all', np: np.id }).length))
  })
  it('filters by date range on the prototype clock; undated drafts never match a date range', () => {
    const next7 = run({ tab: 'all', range: 'next7' })
    expect(next7.length).toBeGreaterThan(0)
    expect(next7.every((r) => r.startMs >= nowMs && r.startMs <= nowMs + 7 * 864e5)).toBe(true)
    expect(run({ tab: 'all', range: 'past30' }).every((r) => r.startMs >= nowMs - 30 * 864e5 && r.startMs <= nowMs)).toBe(true)
    const month = run({ tab: 'all', range: 'month' })
    expect(month.every((r) => new Date(r.startMs).getMonth() === 10 && new Date(r.startMs).getFullYear() === 2026)).toBe(true)
    const custom = run({ tab: 'all', range: 'custom', from: '2026-12-01', to: '2026-12-31' })
    expect(custom.every((r) => r.startMs >= new Date('2026-12-01T00:00:00').getTime() && r.startMs <= new Date('2026-12-31T23:59:59').getTime())).toBe(true)
    expect(run({ tab: 'all', range: 'custom', from: '2026-12-01' }).every((r) => r.startMs >= new Date('2026-12-01T00:00:00').getTime())).toBe(true) // open-ended
    expect(run({ tab: 'all', range: 'next30' }).some((r) => r.startMs == null)).toBe(false)
    expect(rows.some((r) => r.startMs == null)).toBe(true) // the sample set really has undated drafts
  })
})

describe('sorting', () => {
  it('sorts by every key, with ties broken the same way every time', () => {
    const by = (sort) => sortRows(rows, sort)
    const titles = by('title').map((r) => r.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)).map((t) => t)) // alphabetical
    expect(by('title-desc')[0].title.localeCompare(by('title')[0].title)).toBeGreaterThanOrEqual(0)
    const going = by('going-desc').map((r) => r.going)
    expect(going).toEqual([...going].sort((a, b) => b - a))
    const raised = by('raised-desc').map((r) => r.raised)
    expect(raised).toEqual([...raised].sort((a, b) => b - a))
    const created = by('created-desc').map((r) => r.createdMs)
    expect(created).toEqual([...created].sort((a, b) => b - a))
    expect(by('going-desc').map((r) => r.key)).toEqual(by('going-desc').map((r) => r.key)) // stable
  })
  it('sorts by date both ways, with undated drafts always last', () => {
    for (const dir of ['date-asc', 'date-desc']) {
      const out = sortRows(rows, dir)
      const firstUndated = out.findIndex((r) => r.startMs == null)
      expect(firstUndated).toBeGreaterThan(0)
      expect(out.slice(firstUndated).every((r) => r.startMs == null)).toBe(true)
      const dated = out.slice(0, firstUndated).map((r) => r.startMs)
      expect(dated).toEqual([...dated].sort((a, b) => (dir === 'date-asc' ? a - b : b - a)))
    }
    expect(defaultSort('closed')).toBe('date-desc'); expect(defaultSort('upcoming')).toBe('date-asc'); expect(defaultSort('drafts')).toBe('created-desc')
  })
})

describe('pagination', () => {
  it('slices exactly, clamps wild page numbers and reports the visible range', () => {
    const all = rows
    const p1 = paginate(all, 1, 24)
    expect(p1).toMatchObject({ total: 1006, pages: 42, page: 1, from: 1, to: 24 }); expect(p1.items).toHaveLength(24)
    const last = paginate(all, 999, 24)
    expect(last).toMatchObject({ page: 42, from: 985, to: 1006 })
    expect(last.items).toHaveLength(1006 - 41 * 24)
    expect(paginate(all, -5, 24).page).toBe(1)
    expect(paginate([], 1, 24)).toMatchObject({ total: 0, pages: 1, from: 0, to: 0, items: [] })
    // every row appears on exactly one page
    const seen = new Set()
    for (let n = 1; n <= p1.pages; n++) paginate(all, n, 24).items.forEach((r) => seen.add(r.key))
    expect(seen.size).toBe(1006)
  })
  it('shows a compact page window with gaps', () => {
    expect(pageWindow(1, 42)).toEqual([1, 2, null, 42])
    expect(pageWindow(21, 42)).toEqual([1, null, 20, 21, 22, null, 42])
    expect(pageWindow(42, 42)).toEqual([1, null, 41, 42])
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(2, 3)).toEqual([1, 2, 3])
  })
})

describe('what each stage can do', () => {
  it('offers only the actions that make sense', () => {
    expect(actionsFor('draft', {}, true)).toMatchObject({ submit: true, remove: true, archive: false, primary: 'resume' })
    expect(actionsFor('draft', {}, false)).toMatchObject({ submit: false })
    expect(actionsFor('changes', {}, false)).toMatchObject({ remove: false, edit: true, primary: 'fix' })
    expect(actionsFor('rejected', {}, false)).toMatchObject({ remove: true, edit: true })
    expect(actionsFor('waiting', {}, false)).toMatchObject({ edit: false, remove: false, primary: 'status' })
    expect(actionsFor('upcoming', {}, false)).toMatchObject({ primary: 'dashboard', archive: false, publicPage: true })
    expect(actionsFor('closed', {}, false)).toMatchObject({ archive: true, primary: 'impact' })
    expect(actionsFor('archived', {}, false)).toMatchObject({ restore: true, archive: false })
    for (const st of ['draft', 'changes', 'waiting', 'live', 'closed', 'archived']) expect(actionsFor(st, {}, false).duplicate).toBe(true)
  })
})

describe('speed at 1,000+ events', () => {
  it('builds the rows and filters, sorts and pages a 1,000-event list well inside a frame budget', () => {
    const t0 = performance.now()
    const r = buildRows(state, 'u_mike')
    const t1 = performance.now()
    const out = paginate(sortRows(filterRows(r, f({ tab: 'all', q: 'a', cat: '', range: 'any' }), nowMs), 'going-desc'), 3, 24)
    const t2 = performance.now()
    expect(out.items.length).toBe(24)
    expect(t1 - t0).toBeLessThan(500) // building every row once per change to the data
    expect(t2 - t1).toBeLessThan(100) // each keystroke / filter change
  })
})
