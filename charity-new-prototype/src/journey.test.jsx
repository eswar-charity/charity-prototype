// One story across all four roles, through the real UI and the one shared engine.
// Role-specific behaviour is tested in src/roles/*; this proves the seams between roles.
import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp, makeEngine, EMAILS } from './test-utils.jsx'
import { eventTotals } from './domain/engine.js'

function stage(engine) {
  const run = (type, payload) => {
    const r = engine.dispatch(type, payload)
    if (!r.ok) throw new Error(`${type}: ${r.error.code} ${r.error.message}`)
    return r.data
  }
  const as = (email) => { engine.dispatch('signOut'); run('signIn', { email, password: 'Passw0rd!' }) }
  const anon = () => engine.dispatch('signOut')
  return { run, as, anon }
}

describe('one event, four roles', () => {
  it('SE drafts → nonprofit approves → guest joins and gives → SE checks in → NP sees money → admin blocks and refunds', async () => {
    const engine = makeEngine()
    const { run, as, anon } = stage(engine)
    const render = (route, email) => {
      if (email) { as(email) } else anon()
      return renderApp(route, { engine })
    }

    /* 1 — SE: a complete draft, submitted for ASPCA */
    as(EMAILS.priya)
    const { key } = run('createDraft', { title: '#HarborHustle' })
    run('saveDraft', { key, step: 4, patch: { story: 'A harbor-side 5K and pancake brunch for every dog who needs a home.', photos: ['/photos/dog-dad/img2.jpg'], category: 'Animals', nonprofitId: 'aspca', date: 'Dec 19, 2026', start: '9:00 AM', end: '1:00 PM', location: 'Liberty State Park, NJ', guidelinesAccepted: true } })
    expect(run('submitEvent', { key }).outcome).toBe('submitted')

    let view = render(`/se/approval/${key}`, EMAILS.priya)
    expect((await screen.findAllByText(/#HarborHustle/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Submitted/i).length).toBeGreaterThan(0)
    view.unmount()

    /* 2 — the public cannot see it yet; ASPCA sees it in its queue and an unrelated nonprofit does not */
    view = render(`/events/${key}`)
    expect(await screen.findByText(/couldn’t find that event/i)).toBeInTheDocument()
    view.unmount()
    view = render('/np/approvals', EMAILS.aspca)
    expect((await screen.findAllByText(/#HarborHustle/)).length).toBeGreaterThan(0)
    view.unmount()
    view = render('/np/approvals', EMAILS.unitedway)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText(/#HarborHustle/)).not.toBeInTheDocument()
    view.unmount()

    /* 3 — ASPCA approves: it goes live for everyone and the SE is told */
    as(EMAILS.aspca); run('approveEvent', { key })
    view = render(`/events/${key}`)
    expect((await screen.findAllByText(/#HarborHustle/)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/couldn’t find/i)).not.toBeInTheDocument()
    view.unmount()
    view = render('/notifications', EMAILS.priya)
    expect(await screen.findByText(/Your event is live/i)).toBeInTheDocument()
    view.unmount()

    /* 4 — a guest passes the gate, joins and gives */
    anon()
    run('gateIdentify', { email: 'harbor.guest@example.com', name: 'Harper Guest' })
    const { ticket } = run('joinEvent', { eventKey: key })
    const donation = run('createDonation', { eventKey: key, amountCents: 5000, name: 'Harper Guest' })
    run('confirmDonation', { id: donation.id, cardLast4: '4242' })
    expect(eventTotals(engine.getState(), key)).toMatchObject({ raised: 50, backed: 1, joined: 1 })
    view = render('/saved', null)
    // the guest session is gone after render(null); sign the guest back in through the demo path
    view.unmount()
    engine.dispatch('demoSignIn', { userId: Object.values(engine.getState().users).find((u) => u.email === 'harbor.guest@example.com').id })
    view = renderApp('/saved', { engine })
    expect((await screen.findAllByText(/#HarborHustle/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(new RegExp(ticket)).length).toBeGreaterThan(0)
    view.unmount()

    /* 5 — the SE sees the gift and checks the guest in; a different SE is turned away */
    view = render(`/se/live/${key}`, EMAILS.priya)
    expect((await screen.findAllByText(/Harper Guest/)).length).toBeGreaterThan(0)
    view.unmount()
    as(EMAILS.priya)
    expect(run('checkIn', { eventKey: key, code: ticket }).backed).toBe(true)
    view = render(`/se/live/${key}`, EMAILS.priya)
    expect((await screen.findAllByText(/1 checked in/i)).length).toBeGreaterThan(0)
    view.unmount()
    view = render(`/se/live/${key}`, EMAILS.jordan)
    expect(await screen.findByText(/not yours|isn’t yours|not your event/i)).toBeInTheDocument()
    view.unmount()

    /* 6 — the nonprofit sees the money */
    view = render('/np/financials', EMAILS.aspca)
    expect((await screen.findAllByText(/\$50/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Harper Guest/).length).toBeGreaterThan(0)
    view.unmount()

    /* 7 — the admin blocks the event with refunds; the public sees it paused, the guest is refunded, the audit log records it */
    as(EMAILS.admin)
    run('blockEvent', { key, reason: 'Venue permit missing', mode: 'refund' })
    expect(engine.getState().donations.find((d) => d.id === donation.id).status).toBe('Refunded')
    view = render(`/events/${key}`)
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument()
    view.unmount()
    view = render('/admin/audit', EMAILS.admin)
    expect(await screen.findByText(/Blocked event and refunded 1 donation/i)).toBeInTheDocument()
    view.unmount()
    view = render('/admin/payments', EMAILS.admin)
    expect((await screen.findAllByText(/Refunded/)).length).toBeGreaterThan(0)
    view.unmount()
    engine.dispatch('demoSignIn', { userId: engine.getState().donations.find((d) => d.id === donation.id).donorId })
    view = renderApp('/notifications', { engine })
    expect(await screen.findByText(/Your donation was refunded/i)).toBeInTheDocument()
    view.unmount()
  })

  it('every role area refuses the other roles and sends them home with a notice', async () => {
    const engine = makeEngine()
    const { as, anon } = stage(engine)
    const cases = [
      ['/se', null, /sign in|welcome back/i, '/signin'],
      ['/np', EMAILS.mike, /nonprofit admin/i],
      ['/admin', EMAILS.aspca, /charity hub admin/i],
      ['/se', EMAILS.admin, /social entrepreneur/i],
      ['/np', EMAILS.admin, /nonprofit admin/i],
    ]
    for (const [route, email, expected] of cases) {
      email ? as(email) : anon()
      const view = renderApp(route, { engine })
      expect((await screen.findAllByText(expected)).length).toBeGreaterThan(0)
      view.unmount()
    }
    // a guest lead cannot open any signed-in area
    anon()
    engine.dispatch('gateIdentify', { email: 'plain.guest@example.com' })
    for (const route of ['/se', '/np', '/admin']) {
      const view = renderApp(route, { engine })
      const notices = await screen.findAllByRole('status')
      expect(notices.some((n) => /is for .* accounts/i.test(n.textContent))).toBe(true)
      expect(within(document.body).queryByRole('heading', { name: /dashboard|launchpad|hi /i })).not.toBeInTheDocument()
      view.unmount()
    }
  })
})
