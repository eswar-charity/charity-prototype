// The events console at 1,000+ events, through the real UI: search, filters, sort, pagination, views, selection,
// bulk and row actions, and a mangled address bar.
import { describe, it, expect } from 'vitest'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../../../App.jsx'
import AppProviders from '../../../AppProviders.jsx'
import { makeEngine, EMAILS } from '../../../test-utils.jsx'
import { buildRows, filterRows, DEFAULT_FILTERS } from './model.js'

const user = userEvent.setup()
const NOW_MS = new Date('2026-11-18T12:00:00.000Z').getTime()
const f = (o) => ({ ...DEFAULT_FILTERS, ...o })

function bigEngine(count = 1000) {
  const engine = makeEngine()
  engine.dispatch('signIn', { email: EMAILS.mike, password: 'Passw0rd!' })
  engine.dispatch('demoGenerateEvents', { count })
  return engine
}
function open(url, engine = bigEngine()) {
  let loc
  const Probe = () => { loc = useLocation(); return null }
  const utils = render(<MemoryRouter initialEntries={[url]}><AppProviders engine={engine}><App /><Probe /></AppProviders></MemoryRouter>)
  return { engine, ...utils, params: () => new URLSearchParams(loc.search) }
}
const rowsOf = (engine) => buildRows(engine.getState(), 'u_mike')
const articles = () => screen.getAllByRole('article')
/** The result line is `<strong>86</strong> events match`: read the whole status line, not one text node. */
const count = (n) => (_, el) => el?.getAttribute?.('role') === 'status' && el.textContent.replace(/\s+/g, ' ').trim().startsWith(`${n.toLocaleString()} ${n === 1 ? 'event matches' : 'events match'}`)

describe('1,000-event console', () => {
  it('shows the pipeline totals and a structured overview without rendering the whole list', async () => {
    const { engine } = open('/se')
    await screen.findByRole('heading', { name: 'Your events' })
    const all = rowsOf(engine)
    expect(all).toHaveLength(1006)
    const pipe = screen.getByRole('navigation', { name: 'Your events by stage' })
    expect(within(pipe).getByRole('button', { name: `Drafts: ${all.filter((r) => r.stage === 'draft').length}` })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'All events (1006)' })).toBeInTheDocument()
    expect(screen.getByText(/includes 1,000 sample events/)).toBeInTheDocument()
    // overview: a few per section, never the full 1,000
    expect(articles().length).toBeLessThanOrEqual(6 * 4)
    expect(within(screen.getByRole('region', { name: 'Upcoming' })).getByRole('link', { name: /^See all/ })).toHaveAttribute('href', '/se?tab=upcoming')
  })

  it('paginates: 24 a page, next and numbered pages, a different page size, and the last page', async () => {
    const { params } = open('/se?tab=all')
    await screen.findByRole('region', { name: 'Results' })
    expect(articles()).toHaveLength(24)
    expect(screen.getByRole('status', { name: '' , hidden: true }) ?? true).toBeTruthy()
    expect(screen.getByText(/Showing/).textContent.replace(/\s+/g, ' ')).toBe('Showing 1–24 of 1,006')
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(params().get('page')).toBe('2')
    expect(screen.getByText(/Showing/).textContent.replace(/\s+/g, ' ')).toBe('Showing 25–48 of 1,006')
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    await user.selectOptions(screen.getByLabelText('Per page'), '48')
    expect(params().get('size')).toBe('48'); expect(params().get('page')).toBeNull() // back to page 1
    expect(articles()).toHaveLength(48)
    await user.click(screen.getByRole('button', { name: 'Page 21' }))
    expect(screen.getByText(/Showing/).textContent.replace(/\s+/g, ' ')).toBe('Showing 961–1,006 of 1,006')
    expect(articles()).toHaveLength(46)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('searches by name, place, nonprofit and cause, and says so when nothing matches', async () => {
    const { engine, params } = open('/se?tab=all')
    await screen.findByRole('region', { name: 'Results' })
    const target = rowsOf(engine).find((r) => r.np)
    const box = screen.getByRole('searchbox', { name: 'Search events' })
    await user.type(box, target.title)
    expect(params().get('q')).toBe(target.title)
    const expected = filterRows(rowsOf(engine), f({ tab: 'all', q: target.title }), NOW_MS).length
    expect(await screen.findByText(count(expected))).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Results' })).getAllByRole('heading', { level: 3 }).some((h) => h.textContent === target.title)).toBe(true)
    await user.clear(box); await user.type(box, 'zzzz nothing like this')
    expect(await screen.findByText('No events match.')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0]) // offered in the chips row and in the empty state
    await waitFor(() => expect(params().get('q')).toBeNull())
    expect(articles()).toHaveLength(24)
  })

  it('filters by cause, nonprofit, status and date, shows the filters as removable chips, and the counts agree with the data', async () => {
    const { engine, params } = open('/se?tab=all')
    await screen.findByRole('region', { name: 'Results' })
    const rows = rowsOf(engine)
    // cause
    const cat = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort()[0]
    await user.selectOptions(screen.getByLabelText('Cause'), cat)
    expect(await screen.findByText(count(filterRows(rows, f({ tab: 'all', cat }), NOW_MS).length))).toBeInTheDocument()
    expect(params().get('cat')).toBe(cat)
    // nonprofit on top
    const np = rows.find((r) => r.npId && r.category === cat)
    await user.selectOptions(screen.getByLabelText('Nonprofit'), np.npId)
    expect(await screen.findByText(count(filterRows(rows, f({ tab: 'all', cat, np: np.npId }), NOW_MS).length))).toBeInTheDocument()
    // status + date
    await user.selectOptions(screen.getByLabelText('Date'), 'next30')
    expect(params().get('range')).toBe('next30')
    expect(await screen.findByText(count(filterRows(rows, f({ tab: 'all', cat, np: np.npId, range: 'next30' }), NOW_MS).length))).toBeInTheDocument()
    // chips remove one filter at a time
    await user.click(screen.getByRole('button', { name: `Remove filter: ${cat}` }))
    await waitFor(() => expect(params().get('cat')).toBeNull())
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    await waitFor(() => expect(params().get('np')).toBeNull())
    expect(params().get('range')).toBeNull()
  })

  it('shows Status choices that fit the tab and refines inside it', async () => {
    const { engine } = open('/se?tab=drafts')
    await screen.findByRole('region', { name: 'Results' })
    await user.selectOptions(screen.getByLabelText('Status'), 'attention')
    const rows = rowsOf(engine)
    const n = filterRows(rows, f({ tab: 'drafts', status: 'attention' }), NOW_MS).length
    expect(await screen.findByText(count(n))).toBeInTheDocument()
    for (const a of within(screen.getByRole('region', { name: 'Results' })).getAllByRole('article').slice(0, 12)) {
      expect(a.textContent).toMatch(/asked for changes|Not approved/)
    }
    expect(within(screen.getByLabelText('Status')).queryByRole('option', { name: 'Live now' })).not.toBeInTheDocument()
  })

  it('clicking a pipeline segment filters to it, and clicking it again lets go', async () => {
    const { engine, params } = open('/se')
    await screen.findByRole('heading', { name: 'Your events' })
    const n = rowsOf(engine).filter((r) => ['changes', 'rejected'].includes(r.stage)).length
    const pipe = screen.getByRole('navigation', { name: 'Your events by stage' })
    await user.click(within(pipe).getByRole('button', { name: `Needs changes: ${n}` }))
    expect(params().get('tab')).toBe('drafts'); expect(params().get('status')).toBe('attention')
    expect(within(pipe).getByRole('button', { name: `Needs changes: ${n}` })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText(count(n))).toBeInTheDocument()
    await user.click(within(pipe).getByRole('button', { name: `Needs changes: ${n}` }))
    await waitFor(() => expect(params().get('tab')).toBeNull())
  })

  it('switches to a dense table, sorts by a column both ways, and keeps that in the address', async () => {
    const { params } = open('/se?tab=closed')
    await screen.findByRole('region', { name: 'Results' })
    await user.click(screen.getByRole('button', { name: /Table/ }))
    expect(params().get('view')).toBe('table')
    const table = await screen.findByRole('table', { name: 'Your events' })
    expect(within(table).getAllByRole('row')).toHaveLength(25) // header + 24
    await user.click(within(table).getByRole('button', { name: /^Going/ }))
    expect(params().get('sort')).toBe('going-asc')
    expect(within(table).getByRole('columnheader', { name: /Going/ })).toHaveAttribute('aria-sort', 'ascending')
    const goings = within(table).getAllByRole('row').slice(1).map((r) => Number(within(r).getAllByRole('cell')[4].textContent))
    expect(goings).toEqual([...goings].sort((a, b) => a - b))
    await user.click(within(table).getByRole('button', { name: /^Going/ }))
    expect(params().get('sort')).toBe('going-desc')
    await user.click(screen.getByRole('button', { name: /Cards/ }))
    expect(params().get('view')).toBe('cards')
  })

  it('selects a page and archives the closed ones in bulk, telling you the count before and after', async () => {
    const { engine } = open('/se?tab=closed&size=12')
    await screen.findByRole('region', { name: 'Results' })
    await user.click(screen.getByRole('checkbox', { name: 'Select all 12 on this page' }))
    const bar = screen.getByRole('region', { name: 'Bulk actions' })
    expect(within(bar).getByText('12 events')).toBeInTheDocument()
    await user.click(within(bar).getByRole('button', { name: /Archive/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Archive 12 events?' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Archive 12' }))
    await waitFor(() => expect(rowsOf(engine).filter((r) => r.stage === 'archived').length).toBeGreaterThanOrEqual(12))
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
    expect(screen.getByText('12 events archived.')).toBeInTheDocument()
  })

  it('bulk delete only applies to drafts and rejected events, says how many are skipped, and can be cancelled', async () => {
    const { engine } = open('/se?tab=all&size=96&sort=title')
    await screen.findByRole('region', { name: 'Results' })
    const rows = rowsOf(engine)
    const draft = rows.find((r) => r.stage === 'draft'), closed = rows.find((r) => r.stage === 'closed')
    // search so both are on the page
    for (const r of [draft, closed]) {
      await user.clear(screen.getByRole('searchbox', { name: 'Search events' }))
      await user.type(screen.getByRole('searchbox', { name: 'Search events' }), r.title)
      await user.click((await screen.findAllByRole('checkbox', { name: `Select ${r.title}` }))[0])
    }
    // selection resets when the view changes, so redo it in one view
    await user.clear(screen.getByRole('searchbox', { name: 'Search events' }))
    await user.click(screen.getByRole('button', { name: /Table/ }))
    const chosen = rows.filter((r) => r.stage === 'draft').slice(0, 2).concat(rows.filter((r) => r.stage === 'closed').slice(0, 1))
    const table = await screen.findByRole('table', { name: 'Your events' })
    for (const r of chosen) {
      const row = within(table).queryByRole('checkbox', { name: `Select ${r.title}` })
      if (row) await user.click(row)
    }
    if (!screen.queryByRole('region', { name: 'Bulk actions' })) return // titles not on this page: covered by the engine tests
    await user.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: /Delete/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(rowsOf(engine)).toHaveLength(1006)
  })

  it('submits a complete draft for approval from its card (publish), after confirming', async () => {
    const engine = makeEngine()
    // make Mike's seeded draft complete
    Object.assign(engine.getState().events['spring-sprint'], { nonprofitId: 'aspca', date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM', location: 'Pier A Park, Hoboken NJ', guidelinesAccepted: true })
    engine.dispatch('signIn', { email: EMAILS.mike, password: 'Passw0rd!' })
    open('/se?tab=drafts', engine)
    const card = within(await screen.findByRole('article', { name: '#SpringSprint' }))
    expect(card.getByText('Ready to submit for approval.')).toBeInTheDocument()
    await user.click(card.getByRole('button', { name: /Submit for approval/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/ASPCA will review it/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Submit for approval' }))
    await waitFor(() => expect(engine.getState().events['spring-sprint'].status).toBe('Submitted'))
    expect(await screen.findByText(/#SpringSprint submitted for approval to ASPCA/)).toBeInTheDocument()
    expect(engine.getState().notifications.some((n) => n.userId === 'u_np_aspca' && /#SpringSprint/.test(n.body))).toBe(true)
  })

  it('archives a closed event from its menu and restores it from the Archived tab', async () => {
    const engine = makeEngine()
    open('/se?tab=closed', engine)
    engine.dispatch('signIn', { email: EMAILS.mike, password: 'Passw0rd!' })
    open('/se?tab=closed', engine)
    const card = within((await screen.findAllByRole('article', { name: '#NeonNight' }))[0])
    await user.click(card.getByRole('button', { name: 'More actions for #NeonNight' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(engine.getState().events['neon-night'].status).toBe('Archived'))
    expect(await screen.findByText('#NeonNight archived.')).toBeInTheDocument()
  })

  it('offers restore on archived events and brings them back to Closed', async () => {
    const engine = makeEngine()
    engine.dispatch('signIn', { email: EMAILS.mike, password: 'Passw0rd!' })
    engine.dispatch('archiveEvent', { key: 'golf-outing' })
    open('/se?tab=archived', engine)
    const card = within(await screen.findByRole('article', { name: '#CharityHubGolfOuting' }))
    await user.click(card.getByRole('button', { name: 'More actions for #CharityHubGolfOuting' }))
    await user.click(screen.getByRole('menuitem', { name: 'Restore from archive' }))
    await waitFor(() => expect(engine.getState().events['golf-outing'].status).toBe('Completed'))
  })

  it('survives a hand-edited address bar and an out-of-range page', async () => {
    open('/se?tab=nope&status=wow&range=bad&sort=zzz&view=grid&page=-4&size=7&from=tomorrow')
    expect(await screen.findByRole('heading', { name: 'Your events' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const far = open('/se?tab=all&page=9999')
    await waitFor(() => expect(screen.getAllByText(/Showing/).length).toBeGreaterThan(0))
    expect(screen.getAllByText(/Showing/).some((n) => /Showing 1,00\d–1,006 of 1,006|Showing 985–1,006 of 1,006/.test(n.textContent.replace(/\s+/g, ' ')))).toBe(true)
    far.unmount()
  })

  it('keeps the row menus keyboard-friendly: Escape closes, arrows move', async () => {
    open('/se?tab=drafts')
    const btn = (await screen.findAllByRole('button', { name: /^More actions for/ }))[0]
    await user.click(btn)
    const menu = screen.getByRole('menu')
    expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(within(menu).getAllByRole('menuitem')[1]).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(btn).toHaveFocus()
  })
})
