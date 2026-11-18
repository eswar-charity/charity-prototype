import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { StoreProvider } from './lib/store.jsx'
import { events, nonprofits, categories, timelines, eventByKey, nonprofitBySlug } from './data/index.js'
import { goalFor, percent, relativeHours, eventState, money } from './lib/format.js'
import { cycle } from './components/PrototypeSwitcher.jsx'
import { validate } from './components/DonateDialog.jsx'
import { filterNonprofits } from './pages/Nonprofits.jsx'
import { validateStep } from './pages/Create.jsx'

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  )

describe('reused data', () => {
  it('has the 5 seeded events and 20 XLSX nonprofits', () => {
    expect(events).toHaveLength(5)
    expect(nonprofits).toHaveLength(20)
    expect(categories).toHaveLength(15)
  })
  it('keeps event → nonprofit relationships intact', () => {
    for (const e of events) {
      expect(nonprofitBySlug[e.nonprofit], e.key).toBeTruthy()
      expect(e.nonprofitName).toBe(nonprofitBySlug[e.nonprofit].name)
    }
    expect(eventByKey['neon-night'].nonprofitName).toBe('United Way')
    expect(eventByKey['dog-dad'].nonprofitName).toBe('ASPCA')
  })
  it('has a timeline and local photos for every event', () => {
    for (const e of events) {
      expect(timelines[e.key]?.length, e.key).toBeGreaterThan(0)
      for (const p of e.photos) expect(existsSync(`public${p}`), p).toBe(true)
    }
  })
  it('timelines no longer mention the replaced fictional nonprofits', () => {
    const all = JSON.stringify(timelines)
    expect(all).not.toContain('Hoboken Homeless Home')
    expect(all).not.toContain('Windham Mountain Conservatory')
  })
})

describe('format helpers', () => {
  it('derives a goal above raised, rounded to $1,000', () => {
    expect(goalFor(14280)).toBe(20000)
    for (const e of events) expect(e.goal).toBeGreaterThan(e.raised)
  })
  it('clamps percent', () => {
    expect(percent(50, 100)).toBe(50)
    expect(percent(500, 100)).toBe(100)
    expect(percent(5, 0)).toBe(0)
  })
  it('labels relative timeline offsets', () => {
    expect(relativeHours(0)).toBe('During the event')
    expect(relativeHours(-48)).toBe('2 days before')
    expect(relativeHours(-432)).toBe('3 weeks before')
    expect(relativeHours(5)).toBe('5h after')
  })
  it('computes event state', () => {
    const now = new Date('2026-11-18T12:00:00')
    expect(eventState('Nov 14, 2026', '7:00 PM', '10:00 PM', now)).toBe('past')
    expect(eventState('Dec 12, 2026', '4:00 PM', '8:00 PM', now)).toBe('upcoming')
  })
  it('formats money', () => expect(money(14280)).toBe('$14,280'))
})

describe('prototype switcher', () => {
  it('wraps around in both directions', () => {
    expect(cycle('A', 1)).toBe('B')
    expect(cycle('C', 1)).toBe('A')
    expect(cycle('A', -1)).toBe('C')
  })
})

describe('validation', () => {
  it('donation rules', () => {
    expect(validate({ amount: 2, name: 'A', email: 'a@b.co', anonymous: false }).amount).toBeTruthy()
    expect(validate({ amount: 50, name: '', email: 'a@b.co', anonymous: false }).name).toBeTruthy()
    expect(validate({ amount: 50, name: '', email: 'a@b.co', anonymous: true })).toEqual({})
    expect(validate({ amount: 50, name: 'A', email: 'nope', anonymous: false }).email).toBeTruthy()
  })
  it('wizard steps', () => {
    expect(Object.keys(validateStep(0, { title: '', date: '', location: '' }))).toHaveLength(3)
    expect(validateStep(1, { category: 'Health', nonprofit: 'aspca', goal: '' })).toEqual({})
    expect(validateStep(1, { category: 'Health', nonprofit: 'aspca', goal: '50' }).goal).toBeTruthy()
  })
  it('nonprofit search + filter', () => {
    expect(filterNonprofits(nonprofits, 'aspca', 'All')).toHaveLength(1)
    expect(filterNonprofits(nonprofits, '', 'Animals').map((n) => n.name)).toEqual(['ASPCA'])
    expect(filterNonprofits(nonprofits, 'zzzz', 'All')).toHaveLength(0)
  })
})

describe('screens', () => {
  it('Discover renders all events in variant A and switches via ?variant=', () => {
    const { unmount } = renderAt('/')
    const grid = screen.getByRole('heading', { name: /events making a difference/i }).closest('section')
    expect(within(grid).getAllByRole('article')).toHaveLength(5)
    expect(screen.getByRole('group', { name: /prototype variant/i })).toHaveTextContent('A · Card grid')
    unmount()

    renderAt('/?variant=B')
    expect(screen.getByRole('group', { name: /prototype variant/i })).toHaveTextContent('B · Spotlight')
    expect(screen.getByRole('complementary', { name: /leaderboard/i })).toBeInTheDocument()
  })

  it('filters events by cause', async () => {
    renderAt('/')
    const section = screen.getByRole('heading', { name: /events making a difference/i }).closest('section')
    await userEvent.click(within(section).getByRole('button', { name: /animals/i }))
    expect(within(section).getAllByRole('article')).toHaveLength(1)
    expect(within(section).getByText('#DogDads')).toBeInTheDocument()
  })

  it('donating updates the totals and is announced', async () => {
    renderAt('/events/dog-dad')
    const side = screen.getByRole('complementary', { name: /donate/i })
    expect(within(side).getByText('$3,200')).toBeInTheDocument()
    await userEvent.click(within(side).getByRole('button', { name: 'Donate' }))
    const dialog = screen.getByRole('dialog', { hidden: true })
    await userEvent.click(within(dialog).getByRole('button', { name: /donate/i, hidden: true }))
    expect(within(dialog).getByText(/enter a valid email/i)).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText(/your name/i), 'Jane Doe')
    await userEvent.type(within(dialog).getByLabelText(/email/i), 'jane@example.com')
    await userEvent.click(within(dialog).getByRole('button', { name: /^donate \$50$/i, hidden: true }))
    expect(within(dialog).getByRole('status')).toHaveTextContent('$50')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done', hidden: true }))
    expect(within(side).getByText('$3,250')).toBeInTheDocument()
  })

  it('shows 404 for unknown event and nonprofit', () => {
    const a = renderAt('/events/nope')
    expect(screen.getByText(/couldn’t find that event/i)).toBeInTheDocument()
    a.unmount()
    renderAt('/nonprofits/nope')
    expect(screen.getByText(/couldn’t find that nonprofit/i)).toBeInTheDocument()
  })

  it('nonprofit profile aggregates its events', () => {
    renderAt('/nonprofits/united-way')
    expect(screen.getByRole('heading', { level: 1, name: 'United Way' })).toBeInTheDocument()
    // total raised appears in the stat tile and again on the event card
    expect(screen.getAllByText('$14,280').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('#NeonNight')).toBeInTheDocument()
  })

  it('create wizard blocks on invalid step then advances', async () => {
    renderAt('/create')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText(/give your event a title/i)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/event title/i), '#TestRun')
    await userEvent.type(screen.getByLabelText(/^date$/i), '2026-12-20')
    await userEvent.type(screen.getByLabelText(/location/i), 'Newark, NJ')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByLabelText(/^cause$/i)).toBeInTheDocument()
  })
})
