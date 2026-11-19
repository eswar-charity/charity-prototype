// Guest + auth flows, driven through the real UI (real App, real providers, a fresh engine with a fixed clock).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, makeEngine, EMAILS } from '../../test-utils.jsx'
import { quote } from '../../domain/engine.js'

const PW = 'Passw0rd!'
const NATURE_ADMIN = 'nature@charityhub.com'
const MSF_ADMIN = 'msf@charityhub.com' // invited, never accepted: status pending

beforeEach(() => {
  // jsdom has no canvas: the QR component swallows the failure, this just keeps the log quiet
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

const asAdmin = (engine, steps) => {
  const r = engine.dispatch('signIn', { email: EMAILS.admin, password: PW })
  if (!r.ok) throw new Error(r.error.message)
  steps(engine)
  engine.dispatch('signOut')
}
const S = (engine) => engine.getState()
const session = (engine) => S(engine).users[S(engine).session.userId] ?? null

/** Anonymous visitor gets through the identity gate: email, then "About you". */
async function passGate(user, { email = 'fan.person@example.com', name = '', title } = {}) {
  const dlg = await screen.findByRole('dialog', { name: title ?? /./ })
  await user.type(within(dlg).getByLabelText('Email'), `${email}{enter}`)
  const nameBox = await within(dlg).findByLabelText('Your name')
  if (name) { await user.clear(nameBox); await user.type(nameBox, name) }
  await user.type(nameBox, '{enter}')
  await waitFor(() => expect(screen.queryByRole('dialog', { name: /About you/ })).not.toBeInTheDocument())
}

/** A guest lead who already passed the gate, for tests that are not about the gate itself. */
function withGuest(engine = makeEngine(), name = 'Fan Person') {
  engine.dispatch('gateIdentify', { email: 'fan.person@example.com' })
  engine.dispatch('updateProfile', { name })
  return engine
}

const field = async (user, label, value, root = screen) => {
  const el = root.getByLabelText(label)
  await user.clear(el)
  await user.type(el, value)
}

describe('anonymous browse', () => {
  it('shows the home page on the domain: hero, discover, journey, leaderboard, cause layer, invite form', async () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: /Throw an event/ })).toBeInTheDocument()
    const discover = screen.getByRole('region', { name: 'Find something good to do.' })
    for (const t of ['#NeonNight', '#DogDads', '#GiveNowApre\'Later']) expect(within(discover).getAllByText(t).length).toBeGreaterThan(0)
    expect(screen.getByRole('list', { name: 'Events ranked by people going' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'And yes, it does good.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Conversations, not comments.' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Send us your idea' })).toBeInTheDocument()
    // the primary call to action for a visitor is to host
    expect(screen.getAllByRole('link', { name: 'Host an event' })[0]).toHaveAttribute('href', '/signup')
  })

  it('ranks the leaderboard by people going, from the engine', () => {
    const engine = makeEngine()
    renderApp('/', { engine })
    const board = screen.getByRole('list', { name: 'Events ranked by people going' })
    const first = within(board).getAllByRole('listitem')[0]
    expect(within(first).getByText('Leading')).toBeInTheDocument()
    // the running river clean-up has 41 people and the top seeded event has 87
    expect(within(first).getByText('#NeonNight')).toBeInTheDocument()
    expect(within(first).getByText('87')).toBeInTheDocument()
  })

  it('searches, filters by cause, shows an empty state and clears it', async () => {
    const user = userEvent.setup()
    renderApp('/')
    const discover = screen.getByRole('region', { name: 'Find something good to do.' })
    await user.type(within(discover).getByLabelText('Search events'), 'zzzz')
    expect(within(discover).getByText('No events match that search')).toBeInTheDocument()
    await user.click(within(discover).getByRole('button', { name: 'Clear search and filters' }))
    expect(within(discover).queryByText('No events match that search')).not.toBeInTheDocument()

    await user.click(within(discover).getByRole('button', { name: /Animals/ }))
    expect(within(discover).getAllByText('#DogDads').length).toBeGreaterThan(0)
    expect(within(discover).queryByText('#NeonNight')).not.toBeInTheDocument()
    expect(within(discover).getByRole('status')).toHaveTextContent('1 event match')
  })

  it('renders the three discover variants', () => {
    renderApp('/?variant=B')
    expect(screen.getByText('Most people going')).toBeInTheDocument()
    cleanup()
    renderApp('/?variant=C')
    expect(screen.getByRole('button', { name: /Pause motion/ })).toBeInTheDocument()
  })

  it('opens the cause filter from a causes-page link', () => {
    renderApp('/?cause=Animals')
    const discover = screen.getByRole('region', { name: 'Find something good to do.' })
    expect(within(discover).getByRole('button', { name: /Animals/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows an event page: tabs, host, cause and recent supporters', async () => {
    const user = userEvent.setup()
    renderApp('/events/dog-dad')
    expect(screen.getByRole('heading', { level: 1, name: '#DogDads' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('link', { name: /^Mike Rivera/ })).toHaveAttribute('href', '/organizers/u_mike')
    expect(screen.getByRole('link', { name: 'ASPCA' })).toHaveAttribute('href', '/nonprofits/aspca')
    expect(screen.getByText('Recent supporters')).toBeInTheDocument()
    expect(screen.queryByText('Anonymous')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /The room/ }))
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('frames events by the domain clock: upcoming, ended', () => {
    renderApp('/events/neon-night') // Nov 14, clock is Nov 18
    expect(screen.getByText('This event is closed.', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Closed' })).toBeDisabled()
    cleanup()
    renderApp('/events/give-now')
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Join #GiveNow/ })).toBeEnabled()
  })

  it('shows the room by stage with host badges, then the photo lightbox with keyboard control', async () => {
    const user = userEvent.setup()
    renderApp('/events/neon-night')
    await user.click(screen.getByRole('tab', { name: /The room/ }))
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'Before the event' })).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { name: 'During the event' })).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { name: 'After the event' })).toBeInTheDocument()
    expect(panel.querySelectorAll('.ch-badge-host').length).toBeGreaterThan(0)
    await user.click(within(panel).getByRole('button', { name: 'During' }))
    expect(within(panel).queryByRole('heading', { name: 'Before the event' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Photos/ }))
    await user.click(screen.getByRole('button', { name: 'Open photo 2 of 8' }))
    const viewer = screen.getByRole('dialog', { name: /photo viewer/ })
    expect(within(viewer).getByText('Photo 2 of 8')).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(within(viewer).getByText('Photo 3 of 8')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /photo viewer/ })).not.toBeInTheDocument()
  })

  it('shows chat messages in the side panel', () => {
    renderApp('/events/neon-night')
    const chat = screen.getByRole('region', { name: 'Chat' })
    expect(within(chat).getByText('Counting down the days. Who else is coming?')).toBeInTheDocument()
    expect(within(chat).getByText('Marcus L.')).toBeInTheDocument()
  })
})

describe('gate, join and ticket', () => {
  it('asks for an email, then About you, then resumes the join and shows a ticket with a QR code', async () => {
    const user = userEvent.setup()
    const { engine, unmount } = renderApp('/events/give-now')
    await user.click(screen.getByRole('button', { name: /^Join #GiveNow/ }))
    const gate = await screen.findByRole('dialog', { name: /Join #GiveNow/ })
    expect(within(gate).getByText(/send your ticket/)).toBeInTheDocument() // contextual copy for join
    await user.type(within(gate).getByLabelText('Email'), 'fan.person@example.com{enter}')
    const nameBox = await within(gate).findByLabelText('Your name')
    expect(nameBox).toHaveValue('Fan Person')
    await user.clear(nameBox)
    await user.type(nameBox, 'Fan Person{enter}')

    const ticket = await screen.findByRole('dialog', { name: 'Your ticket' })
    const code = S(engine).events['give-now'].tickets[session(engine).id]
    expect(code).toMatch(/^CH-GIV-\d{4}$/)
    expect(within(ticket).getByLabelText(`Ticket code ${code}`)).toHaveTextContent(code)
    expect(within(ticket).getByRole('img', { name: `QR code for ticket ${code}` })).toBeInTheDocument()
    expect(S(engine).events['give-now'].joinedIds).toContain(session(engine).id)
    await user.click(within(ticket).getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('button', { name: /You are going to #GiveNow.* View your ticket/ })).toBeInTheDocument()

    // the ticket lives under Saved
    unmount()
    renderApp('/saved', { engine })
    const tickets = screen.getByRole('region', { name: 'My tickets' })
    expect(within(tickets).getByText(code)).toBeInTheDocument()
    await user.click(within(tickets).getByRole('button', { name: 'View ticket for #GiveNowApre\'Later' }))
    expect(await screen.findByRole('dialog', { name: 'Your ticket' })).toBeInTheDocument()
  })

  it('lets a joined person give up their spot after confirming', async () => {
    const user = userEvent.setup()
    const engine = withGuest()
    engine.dispatch('joinEvent', { eventKey: 'give-now' })
    renderApp('/events/give-now', { engine })
    await user.click(screen.getByRole('button', { name: /You are going to #GiveNow/ }))
    const ticket = await screen.findByRole('dialog', { name: 'Your ticket' })
    await user.click(within(ticket).getByRole('button', { name: 'Give up my spot' }))
    const confirm = await screen.findByRole('dialog', { name: 'Give up your spot?' })
    await user.click(within(confirm).getByRole('button', { name: 'Give up my spot' }))
    await waitFor(() => expect(S(engine).events['give-now'].joinedIds).toHaveLength(0))
  })

  it('refuses to gate an email that already belongs to an account and points to sign in', async () => {
    const user = userEvent.setup()
    renderApp('/events/give-now')
    await user.click(screen.getByRole('button', { name: /^Join #GiveNow/ }))
    const gate = await screen.findByRole('dialog', { name: /Join/ })
    await user.type(within(gate).getByLabelText('Email'), `${EMAILS.mike}{enter}`)
    expect(await within(gate).findByText('That email belongs to an account. Sign in to continue.')).toBeInTheDocument()
    expect(within(gate).getAllByRole('link', { name: /Sign in/ })[0].getAttribute('href')).toMatch(/^\/signin\?next=/)
  })
})

describe('donating', () => {
  const openGift = async (user) => {
    await user.click(screen.getByRole('button', { name: /^Donate to The Nature Conservancy/ }))
  }
  const payDetails = async (user, dlg, card) => {
    await field(user, 'Card number', card, within(dlg))
    await field(user, 'Expiry', '1230', within(dlg))
    await field(user, 'Security code', '123', within(dlg))
  }

  it('gates, quotes the fee, declines 0002 with a retry, then succeeds with 4242 and shows a printable receipt', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/events/give-now')
    await openGift(user)
    await passGate(user, { title: /Give to #GiveNow/ })

    const dlg = await screen.findByRole('dialog', { name: /Give to #GiveNow/ })
    const q = quote(5000)
    const breakdown = within(dlg).getByLabelText('Cost breakdown')
    expect(breakdown).toHaveTextContent('$50.00')
    expect(breakdown).toHaveTextContent(`$${(q.feeCents / 100).toFixed(2)}`)
    expect(breakdown).toHaveTextContent(`$${(q.totalCents / 100).toFixed(2)}`)

    await user.click(within(dlg).getByRole('button', { name: '$100' }))
    expect(within(dlg).getByLabelText('Cost breakdown')).toHaveTextContent(`$${(quote(10000).totalCents / 100).toFixed(2)}`)

    // validation first
    await user.click(within(dlg).getByRole('button', { name: /^Pay/ }))
    expect(within(dlg).getByText('Enter your card number.')).toBeInTheDocument()

    // declined card: inline error, nothing charged, the dialog stays open for a retry
    await payDetails(user, dlg, '4000000000000002')
    await user.click(within(dlg).getByRole('button', { name: /^Pay/ }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent('Your card was declined. Try another card.')
    expect(S(engine).donations.filter((d) => !d.seeded)).toHaveLength(1)
    expect(S(engine).donations.at(-1).status).toBe('Initiated')

    // retry with a good card: same payment, now successful, and we land on the receipt
    await field(user, 'Card number', '4242424242424242', within(dlg))
    await user.click(within(dlg).getByRole('button', { name: /^Pay/ }))
    expect(await screen.findByRole('heading', { level: 1, name: /Thank you, Fan/ })).toBeInTheDocument()
    const donations = S(engine).donations.filter((d) => !d.seeded)
    expect(donations).toHaveLength(1)
    expect(donations[0]).toMatchObject({ status: 'Successful', amountCents: 10000 })
    const receipt = screen.getByRole('article', { name: donations[0].receiptNo })
    expect(receipt).toHaveTextContent('The Nature Conservancy')
    expect(receipt).toHaveTextContent('$100.00')
    expect(receipt).toHaveTextContent(`$${(donations[0].totalCents / 100).toFixed(2)}`)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: /Print receipt/ }))
    expect(print).toHaveBeenCalled()
    expect(screen.getByText(/people are backing|person is backing/)).toBeInTheDocument()
  })

  it('validates custom amounts between $1 and $10,000 and supports anonymous giving', async () => {
    const user = userEvent.setup()
    const engine = withGuest()
    renderApp('/events/give-now', { engine })
    await openGift(user)
    const dlg = await screen.findByRole('dialog', { name: /Give to #GiveNow/ })
    await field(user, 'Or enter your own amount (USD)', '20000', within(dlg))
    await payDetails(user, dlg, '4242424242424242')
    await user.click(within(dlg).getByRole('button', { name: /^Pay/ }))
    expect(within(dlg).getByText('Amounts run from $1 to $10,000.')).toBeInTheDocument()
    expect(S(engine).donations.filter((d) => !d.seeded)).toHaveLength(0)

    await field(user, 'Or enter your own amount (USD)', '12.50', within(dlg))
    await user.click(within(dlg).getByRole('checkbox', { name: 'Give anonymously' }))
    await user.click(within(dlg).getByRole('button', { name: /^Pay/ }))
    await screen.findByRole('heading', { level: 1, name: /Thank you/ })
    const d = S(engine).donations.find((x) => !x.seeded)
    expect(d).toMatchObject({ amountCents: 1250, anonymous: true, publicName: 'Anonymous' })
    expect(screen.getAllByText('Anonymous').length).toBeGreaterThan(0)
  })

  it('does not offer a gift when the event is blocked, and a receipt is private to its donor', async () => {
    const engine = makeEngine()
    engine.dispatch('gateIdentify', { email: 'donor@example.com' })
    const made = engine.dispatch('createDonation', { eventKey: 'give-now', amountCents: 2500 })
    engine.dispatch('confirmDonation', { id: made.data.id })
    engine.dispatch('signOut')
    renderApp(`/donate/success/${made.data.id}`, { engine })
    expect(screen.getByText(/We couldn’t find that receipt/)).toBeInTheDocument()
  })

  it('shows a not-completed page for an unpaid gift', () => {
    const engine = makeEngine()
    engine.dispatch('gateIdentify', { email: 'donor@example.com' })
    const made = engine.dispatch('createDonation', { eventKey: 'give-now', amountCents: 2500 })
    engine.dispatch('confirmDonation', { id: made.data.id, cardLast4: '0002' })
    renderApp(`/donate/success/${made.data.id}`, { engine })
    expect(screen.getByRole('heading', { name: 'This gift did not go through' })).toBeInTheDocument()
    expect(screen.getByText(/nothing was charged/)).toBeInTheDocument()
  })

  it('explains when a nonprofit is still setting up payments instead of offering a form', () => {
    // WWF is pending: attach a live event to it
    const engine = makeEngine()
    engine.getState().events['give-now'].nonprofitId = 'world-wildlife-fund-wwf-us'
    renderApp('/events/give-now', { engine })
    expect(screen.queryByRole('button', { name: /^Donate to/ })).not.toBeInTheDocument()
    expect(screen.getByText(/still setting up payments/)).toBeInTheDocument()
  })
})

describe('share sheet', () => {
  it('copies the link, shows a QR, and needs no sign-in', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    delete navigator.share
    renderApp('/events/dog-dad')
    await user.click(screen.getByRole('button', { name: /Share/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Share #DogDads' })
    const url = within(sheet).getByLabelText('Link')
    expect(url.value).toMatch(/\/events\/dog-dad$/)
    expect(within(sheet).getByRole('img', { name: 'QR code for #DogDads' })).toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: /Share with your apps/ })).not.toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: /Copy link/ }))
    expect(writeText).toHaveBeenCalledWith(url.value)
    expect(await within(sheet).findByRole('button', { name: /Copied/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /About you|Join/ })).not.toBeInTheDocument()
  })

  it('offers the native share menu when the browser has one', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true })
    renderApp('/events/dog-dad')
    await user.click(screen.getByRole('button', { name: /Share/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Share #DogDads' })
    await user.click(within(sheet).getByRole('button', { name: /Share with your apps/ }))
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: '#DogDads', url: expect.stringMatching(/\/events\/dog-dad$/) }))
    delete navigator.share
  })
})

describe('event states', () => {
  it('hides drafts and submitted events from everyone but their people', () => {
    renderApp('/events/spring-sprint') // Mike's draft
    expect(screen.getByText(/We couldn’t find that event/)).toBeInTheDocument()
    cleanup()
    renderApp('/events/paws-in-the-park') // submitted
    expect(screen.getByText(/We couldn’t find that event/)).toBeInTheDocument()
    cleanup()
    renderApp('/events/does-not-exist')
    expect(screen.getByText(/We couldn’t find that event/)).toBeInTheDocument()
  })

  it('shows the organizer a preview banner and an Edit link for their draft', () => {
    renderApp('/events/spring-sprint', { as: EMAILS.mike })
    expect(screen.getByText(/This event is draft/)).toBeInTheDocument()
    const strip = screen.getByRole('region', { name: 'Your options for this event' })
    expect(within(strip).getByRole('link', { name: 'Edit event' })).toHaveAttribute('href', '/se/create/spring-sprint/2')
    expect(within(strip).getByRole('link', { name: 'Approval status' })).toHaveAttribute('href', '/se/approval/spring-sprint')
    expect(screen.queryByRole('button', { name: /Join/ })).not.toBeInTheDocument()
  })

  describe('blocked', () => {
    let engine
    beforeEach(() => {
      engine = makeEngine()
      asAdmin(engine, (e) => e.dispatch('blockEvent', { key: 'give-now', reason: 'Safety review', mode: 'hold' }))
    })

    it('is "Temporarily unavailable" for the public', () => {
      renderApp('/events/give-now', { engine })
      expect(screen.getByRole('heading', { name: 'Temporarily unavailable' })).toBeInTheDocument()
      expect(screen.queryByText('Safety review')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Join/ })).not.toBeInTheDocument()
    })

    it('shows the organizer the reason and closes joining, giving, posting and chat', () => {
      renderApp('/events/give-now', { engine, as: EMAILS.mike })
      expect(screen.getByText(/Paused by Charity Hub/)).toBeInTheDocument()
      expect(screen.getByText(/Safety review/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Closed' })).toBeDisabled()
      expect(screen.queryByRole('button', { name: /^Donate to/ })).not.toBeInTheDocument()
      expect(screen.getByText(/Chat is closed while this event is paused/)).toBeInTheDocument()
    })

    it('lets an admin restore it from the event page', async () => {
      const user = userEvent.setup()
      renderApp('/events/give-now', { engine, as: EMAILS.admin })
      await user.click(screen.getByRole('button', { name: 'Restore event' }))
      const confirm = await screen.findByRole('dialog', { name: /^Restore #GiveNow/ })
      await user.click(within(confirm).getByRole('button', { name: 'Restore event' }))
      await waitFor(() => expect(S(engine).events['give-now'].status).toBe('Live'))
    })
  })

  it('lets an admin block a live event from the page with a reason', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/events/give-now', { as: EMAILS.admin })
    await user.click(screen.getByRole('button', { name: 'Block event' }))
    const dlg = await screen.findByRole('dialog', { name: 'Block #GiveNowApre\'Later' })
    await user.click(within(dlg).getByRole('button', { name: 'Block event' }))
    expect(within(dlg).getByText('Give a reason.')).toBeInTheDocument()
    await user.type(within(dlg).getByLabelText('Reason'), 'Unsafe venue')
    await user.click(within(dlg).getByRole('button', { name: 'Block event' }))
    await waitFor(() => expect(S(engine).events['give-now'].status).toBe('Blocked'))
    expect(S(engine).events['give-now'].blocked.reason).toBe('Unsafe venue')
    expect(await screen.findByText(/Paused by Charity Hub/)).toBeInTheDocument()
  })

  it('shows an ended banner and closes giving once an event is Completed', () => {
    const engine = makeEngine()
    asAdmin(engine, (e) => e.dispatch('runLifecycle'))
    expect(S(engine).events['golf-outing'].status).toBe('Completed')
    renderApp('/events/golf-outing', { engine })
    expect(screen.getByText('This event is closed.', { exact: false })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Donate to/ })).not.toBeInTheDocument()
    expect(screen.getByText('Giving closed when this event completed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Closed' })).toBeDisabled()
  })

  it('shows an archived event read-only', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    asAdmin(engine, (e) => { e.dispatch('runLifecycle'); e.dispatch('advanceClock', { days: 31 }); e.dispatch('runLifecycle') })
    expect(S(engine).events['golf-outing'].status).toBe('Archived')
    renderApp('/events/golf-outing', { engine })
    expect(screen.getByText(/This event is archived\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Closed' })).toBeDisabled()
    expect(screen.getByText(/Chat is read-only|chat is read-only/)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /The room/ }))
    expect(screen.getByText('This event is archived, so the room is read-only.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Like post/ })).not.toBeInTheDocument()
  })

  it('shows the strip for organizers, beneficiary nonprofit staff and admins', () => {
    renderApp('/events/give-now', { as: EMAILS.mike })
    let strip = screen.getByRole('region', { name: 'Your options for this event' })
    expect(within(strip).getByRole('link', { name: 'Live dashboard' })).toHaveAttribute('href', '/se/live/give-now')
    expect(within(strip).getByRole('link', { name: 'Approval status' })).toHaveAttribute('href', '/se/approval/give-now')
    cleanup()

    renderApp('/events/give-now', { as: NATURE_ADMIN })
    strip = screen.getByRole('region', { name: 'Your options for this event' })
    expect(within(strip).getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/np/approvals/give-now')
    expect(within(strip).getByRole('link', { name: 'Live dashboard' })).toHaveAttribute('href', '/np/live/give-now')
    cleanup()

    renderApp('/events/give-now', { as: EMAILS.aspca }) // a different nonprofit: nothing extra
    expect(screen.queryByRole('region', { name: 'Your options for this event' })).not.toBeInTheDocument()
    cleanup()

    renderApp('/events/river-cleanup', { as: EMAILS.sierra }) // NP-led: its own organizer
    strip = screen.getByRole('region', { name: 'Your options for this event' })
    expect(within(strip).getByRole('link', { name: 'Live dashboard' })).toHaveAttribute('href', '/np/live/river-cleanup')
    cleanup()

    renderApp('/events/give-now', { as: EMAILS.admin })
    strip = screen.getByRole('region', { name: 'Your options for this event' })
    expect(within(strip).getByRole('button', { name: 'Block event' })).toBeInTheDocument()
  })
})

describe('follow and save are gated and resume', () => {
  it('follows a nonprofit after the gate', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/nonprofits/aspca')
    await user.click(screen.getByRole('button', { name: 'Follow ASPCA' }))
    await passGate(user, { title: /Follow ASPCA/ })
    expect(await screen.findByRole('button', { name: 'Following ASPCA. Unfollow' })).toHaveAttribute('aria-pressed', 'true')
    expect(S(engine).follows).toEqual([{ userId: session(engine).id, nonprofitId: 'aspca' }])
    await user.click(screen.getByRole('button', { name: 'Following ASPCA. Unfollow' }))
    expect(S(engine).follows).toHaveLength(0)
  })

  it('saves an event after the gate and lists it under Saved', async () => {
    const user = userEvent.setup()
    const { engine, unmount } = renderApp('/events/dog-dad')
    await user.click(screen.getByRole('button', { name: 'Save #DogDads' }))
    await passGate(user, { title: /Save #DogDads/ })
    expect(await screen.findByRole('button', { name: 'Remove #DogDads from saved' })).toHaveAttribute('aria-pressed', 'true')
    expect(S(engine).events['dog-dad'].savedIds).toContain(session(engine).id)
    unmount()
    renderApp('/saved', { engine })
    const saved = screen.getByRole('region', { name: 'Saved events' })
    expect(within(saved).getAllByText('#DogDads').length).toBeGreaterThan(0)
  })

  it('shows empty states on /saved for a visitor with nothing', () => {
    renderApp('/saved')
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin?next=%2Fsaved')
    cleanup()
    renderApp('/saved', { engine: withGuest() })
    expect(screen.getByText('No tickets yet')).toBeInTheDocument()
    expect(screen.getByText('No saved events')).toBeInTheDocument()
    expect(screen.getByText('You are not following anyone yet')).toBeInTheDocument()
  })
})

describe('the room: post, reply, like, chat, report', () => {
  it('gates a post, then posts it once the person is in', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/events/neon-night')
    await user.click(screen.getByRole('tab', { name: /The room/ }))
    await user.click(screen.getByRole('button', { name: 'Post' }))
    expect(screen.getByText('Write something first.')).toBeInTheDocument() // nothing to gate yet
    await user.type(screen.getByLabelText('Share with the room'), 'See you at the park!')
    await user.click(screen.getByRole('button', { name: 'Post' }))
    await passGate(user, { title: /Join the conversation/ })
    expect(await screen.findByText('See you at the park!')).toBeInTheDocument()
    const post = S(engine).posts.find((p) => p.text === 'See you at the park!')
    expect(post).toMatchObject({ host: false, eventKey: 'neon-night' })
    expect(screen.getAllByText('Fan P.').length).toBeGreaterThan(0) // first name + last initial only
  })

  it('replies, likes and unlikes', async () => {
    const user = userEvent.setup()
    const engine = withGuest()
    renderApp('/events/neon-night', { engine })
    await user.click(screen.getByRole('tab', { name: /The room/ }))
    const first = S(engine).posts.find((p) => p.eventKey === 'neon-night' && p.phase === 'before')
    const li = document.getElementById(`post-${first.id}`)
    const item = within(li)

    const like = item.getByRole('button', { name: /^Like post by/ })
    expect(like).toHaveAttribute('aria-pressed', 'false')
    await user.click(like)
    expect(S(engine).posts.find((p) => p.id === first.id).likes).toHaveLength(1)
    expect(item.getByRole('button', { name: /^Like post by/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(item.getByRole('button', { name: /^Like post by/ }))
    expect(S(engine).posts.find((p) => p.id === first.id).likes).toHaveLength(0)

    await user.click(item.getByRole('button', { name: /^Reply to post by/ }))
    await user.click(item.getByRole('button', { name: 'Send reply' }))
    expect(item.getByText('Write a reply first.')).toBeInTheDocument()
    await user.type(item.getByLabelText(/^Your reply to/), 'Count me in{enter}')
    expect(await item.findByText('Count me in')).toBeInTheDocument()
    expect(S(engine).posts.find((p) => p.id === first.id).replies).toHaveLength(1)
  })

  it('lets the organizer post as host with a Host badge', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/events/neon-night', { as: EMAILS.mike })
    await user.click(screen.getByRole('tab', { name: /The room/ }))
    await user.type(screen.getByLabelText('Post an update as host'), 'Doors at 7')
    await user.click(screen.getByRole('button', { name: 'Post update' }))
    expect(await screen.findByText('Doors at 7')).toBeInTheDocument()
    expect(S(engine).posts.find((p) => p.text === 'Doors at 7').host).toBe(true)
  })

  it('chats, gated for visitors', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/events/neon-night')
    const chat = screen.getByRole('region', { name: 'Chat' })
    await user.click(within(chat).getByRole('button', { name: 'Send message' }))
    expect(within(chat).getByText('Write a message first.')).toBeInTheDocument()
    await user.type(within(chat).getByLabelText('Message'), 'Hello everyone')
    await user.click(within(chat).getByRole('button', { name: 'Send message' }))
    await passGate(user, { title: /Join the room/ })
    expect(await within(screen.getByRole('region', { name: 'Chat' })).findByText('Hello everyone')).toBeInTheDocument()
    expect(S(engine).chat['neon-night'].at(-1).text).toBe('Hello everyone')
  })

  it('reports a post (needs a reason) and a chat message, which land in the moderation queue', async () => {
    const user = userEvent.setup()
    const engine = withGuest()
    renderApp('/events/neon-night', { engine })
    const chat = screen.getByRole('region', { name: 'Chat' })
    await user.click(within(chat).getByRole('button', { name: /^Report message from Marcus L\./ }))
    let dlg = await screen.findByRole('dialog', { name: /Report message from/ })
    await user.click(within(dlg).getByRole('button', { name: 'Send report' }))
    expect(within(dlg).getByText('Tell us what is wrong.')).toBeInTheDocument()
    await user.type(within(dlg).getByLabelText('What is wrong?'), 'Spam')
    await user.click(within(dlg).getByRole('button', { name: 'Send report' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Report message/ })).not.toBeInTheDocument())
    expect(S(engine).reviewItems.some((r) => r.type === 'Content report' && r.entityRef.startsWith('chat:'))).toBe(true)
    expect(within(chat).getByRole('button', { name: /You reported the message from Marcus L\./ })).toBeDisabled()

    await user.click(screen.getByRole('tab', { name: /The room/ }))
    await user.click(screen.getAllByRole('button', { name: /^Report post by/ })[0])
    dlg = await screen.findByRole('dialog', { name: /Report post by/ })
    await user.type(within(dlg).getByLabelText('What is wrong?'), 'Not true')
    await user.click(within(dlg).getByRole('button', { name: 'Send report' }))
    await waitFor(() => expect(S(engine).reviewItems.filter((r) => r.type === 'Content report')).toHaveLength(2))
    expect(screen.getAllByRole('button', { name: /^You reported the post by/ })[0]).toBeDisabled()
  })

  it('gates reporting with its own copy', async () => {
    const user = userEvent.setup()
    renderApp('/events/neon-night')
    const chat = screen.getByRole('region', { name: 'Chat' })
    await user.click(within(chat).getByRole('button', { name: /^Report message from Marcus L\./ }))
    const gate = await screen.findByRole('dialog', { name: 'Report this content' })
    expect(within(gate).getByText(/follow up if they need more detail/)).toBeInTheDocument()
  })
})

describe('sign in', () => {
  it('shows each engine error in plain language', async () => {
    const user = userEvent.setup()
    renderApp('/signin')
    const form = screen.getByRole('form', { name: 'Sign in' })
    const submit = async (email, password) => {
      await field(user, 'Email', email, within(form))
      await field(user, 'Password', password, within(form))
      await user.click(within(form).getByRole('button', { name: 'Sign in' }))
    }

    await user.click(within(form).getByRole('button', { name: 'Sign in' }))
    expect(within(form).getByText('Enter your email.')).toBeInTheDocument()
    expect(within(form).getByText('Enter your password.')).toBeInTheDocument()

    await submit('nobody@example.com', 'whatever123')
    expect(await within(form).findByRole('alert')).toHaveTextContent('That email and password do not match.')

    await submit('marcus.l@demo.charityhub.com', 'whatever123')
    expect(await within(form).findByRole('alert')).toHaveTextContent('Guests do not have a password')

    await submit(MSF_ADMIN, 'whatever123')
    expect(await within(form).findByRole('alert')).toHaveTextContent('Accept your invite link to finish setting up this account.')
  })

  it('locks the account after repeated wrong passwords', async () => {
    const user = userEvent.setup()
    renderApp('/signin')
    const form = screen.getByRole('form', { name: 'Sign in' })
    for (let i = 0; i < 5; i++) {
      await field(user, 'Email', EMAILS.mike, within(form))
      await field(user, 'Password', 'short', within(form))
      await user.click(within(form).getByRole('button', { name: 'Sign in' }))
    }
    await field(user, 'Password', 'LongEnough123', within(form))
    await user.click(within(form).getByRole('button', { name: 'Sign in' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent('Too many attempts. Try again in 15 minutes.')
  })

  it('simulates Google sign-in and surfaces its errors', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signin')
    await user.click(screen.getByRole('button', { name: /Continue with Google/ }))
    const dlg = await screen.findByRole('dialog', { name: 'Continue with Google' })
    await user.click(within(dlg).getByRole('button', { name: 'Continue' }))
    expect(within(dlg).getByText('Enter the Google email to use.')).toBeInTheDocument()
    await user.type(within(dlg).getByLabelText('Google email'), 'not-an-email')
    await user.click(within(dlg).getByRole('button', { name: 'Continue' }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent('Google did not return a verified email.')

    await field(user, 'Google email', EMAILS.unitedway, within(dlg))
    await user.click(within(dlg).getByRole('button', { name: 'Continue' }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent('This account signs in with its password.')

    await field(user, 'Google email', 'newhost@gmail.com', within(dlg))
    await field(user, 'Name (optional)', 'New Host', within(dlg))
    await user.click(within(dlg).getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(session(engine)).toMatchObject({ role: 'se', name: 'New Host', email: 'newhost@gmail.com' }))
  })

  it('honours ?next when that role may open it', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signin?next=%2Fsaved')
    await field(user, 'Email', EMAILS.mike)
    await field(user, 'Password', PW)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('heading', { name: 'Your saved events and tickets' })).toBeInTheDocument()
    expect(session(engine).role).toBe('se')
    expect(S(engine).session.notice).toBeNull()
  })

  it('goes to the role home with a notice when ?next is not for that role', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signin?next=%2Fadmin%2Fevents')
    await field(user, 'Email', EMAILS.mike)
    await field(user, 'Password', PW)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument())
    expect(S(engine).session.notice).toMatch(/That page is for Charity Hub admin accounts\. You are signed in as social entrepreneur/)
  })

  it('goes to the role home when there is no ?next, and ignores outside or auth targets', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signin?next=%2F%2Fevil.example')
    await field(user, 'Email', EMAILS.unitedway)
    await field(user, 'Password', PW)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument())
    expect(session(engine).role).toBe('np_admin')
    expect(S(engine).session.notice).toBeNull()
  })

  it('shows who is signed in instead of the form', () => {
    renderApp('/signin', { as: EMAILS.mike })
    expect(screen.getByText('You are already signed in')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Go to your dashboard/ })).toHaveAttribute('href', '/se')
  })

  it('fills the demo accounts', async () => {
    const user = userEvent.setup()
    renderApp('/signin')
    await user.click(screen.getByRole('button', { name: 'Nonprofit admin' }))
    expect(screen.getByLabelText('Email')).toHaveValue('unitedway@charityhub.com')
  })
})

describe('sign up (social entrepreneurs only)', () => {
  it('creates an SE account and signs in', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signup')
    await field(user, 'Your name', 'Riley Quinn')
    await field(user, 'Email', 'riley@example.com')
    await field(user, 'Password', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(session(engine)).toMatchObject({ role: 'se', name: 'Riley Quinn' }))
    expect(screen.queryByRole('heading', { name: 'Create your host account.' })).not.toBeInTheDocument()
  })

  it('shows field errors inline and the taken-email message with a way to sign in', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signup')
    await field(user, 'Your name', 'R')
    await field(user, 'Email', 'riley@example.com')
    await field(user, 'Password', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
    await field(user, 'Your name', 'Riley Quinn')
    await field(user, 'Password', 'short')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
    await field(user, 'Email', EMAILS.mike)
    await field(user, 'Password', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with that email already exists. Sign in instead.')
    expect(S(engine).session.userId).toBeNull()
  })

  it('signs up with Google', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/signup')
    await user.click(screen.getByRole('button', { name: /Sign up with Google/ }))
    const dlg = await screen.findByRole('dialog', { name: 'Continue with Google' })
    await field(user, 'Google email', 'g.host@gmail.com', within(dlg))
    await user.click(within(dlg).getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(session(engine)).toMatchObject({ role: 'se', email: 'g.host@gmail.com' }))
  })
})

describe('about you', () => {
  it('sends a signed-out visitor to sign in and back', () => {
    renderApp('/about-you')
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
  })

  it('edits the profile of any signed-in person', async () => {
    const user = userEvent.setup()
    const engine = withGuest()
    renderApp('/about-you', { engine })
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    await field(user, 'Name', 'Fan Q. Person')
    await field(user, 'City (optional)', 'Newark, NJ')
    await field(user, 'Phone (optional)', 'abc')
    await user.click(screen.getByRole('button', { name: 'Save details' }))
    expect(screen.getByText('That phone number does not look right.')).toBeInTheDocument()
    await field(user, 'Phone (optional)', '555 010 2030')
    await field(user, 'Short bio (optional)', 'Here for the crowd.')
    await user.click(screen.getByRole('button', { name: 'Save details' }))
    await waitFor(() => expect(session(engine)).toMatchObject({ name: 'Fan Q. Person', city: 'Newark, NJ', phone: '555 010 2030', bio: 'Here for the crowd.' }))
  })

  it('reports an invalid name from the engine inline', async () => {
    const user = userEvent.setup()
    renderApp('/about-you', { as: EMAILS.mike })
    await field(user, 'Name', 'X')
    await user.click(screen.getByRole('button', { name: 'Save details' }))
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
  })
})

describe('accept invite', () => {
  const invite = () => {
    const engine = makeEngine()
    asAdmin(engine, (e) => { e.dispatch('adminInviteNonprofit', { name: 'Harbor Foundation', category: 'Community', ein: '12-3456789', email: 'harbor@example.org' }) })
    return { engine, token: S(engine).nonprofits['harbor-foundation'].invite.token }
  }

  it('shows the nonprofit, takes a name and password and signs the new admin in', async () => {
    const user = userEvent.setup()
    const { engine, token } = invite()
    renderApp(`/accept-invite?token=${token}`, { engine })
    expect(screen.getByRole('heading', { name: 'Set up Harbor Foundation on Charity Hub.' })).toBeInTheDocument()
    expect(screen.getByText('harbor@example.org')).toBeInTheDocument()
    await field(user, 'Your name', 'Hana Harbor')
    await field(user, 'Choose a password', 'longenough1')
    await field(user, 'Confirm password', 'different123')
    await user.click(screen.getByRole('button', { name: 'Accept invite and continue' }))
    expect(screen.getByText('The two passwords do not match.')).toBeInTheDocument()

    await field(user, 'Confirm password', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Accept invite and continue' }))
    await waitFor(() => expect(session(engine)).toMatchObject({ role: 'np_admin', name: 'Hana Harbor' }))
    expect(S(engine).nonprofits['harbor-foundation'].invite).toBeNull()
    expect(screen.queryByRole('heading', { name: /Set up Harbor Foundation/ })).not.toBeInTheDocument()
  })

  it('reports a weak password from the engine inline', async () => {
    const user = userEvent.setup()
    const { engine, token } = invite()
    renderApp(`/accept-invite?token=${token}`, { engine })
    await field(user, 'Your name', 'Hana Harbor')
    await field(user, 'Choose a password', 'short')
    await field(user, 'Confirm password', 'short')
    await user.click(screen.getByRole('button', { name: 'Accept invite and continue' }))
    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(S(engine).session.userId).toBeNull()
  })

  it('handles a link that was already used (410), an expired one (410), an unknown one and a missing token (404)', () => {
    const { engine, token } = invite()
    engine.dispatch('acceptInvite', { token, name: 'Hana Harbor', password: 'longenough1' })
    engine.dispatch('signOut')
    renderApp(`/accept-invite?token=${token}`, { engine })
    expect(screen.getByRole('heading', { name: 'This invite link was already used or has expired' })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    cleanup()

    const fresh = makeEngine()
    asAdmin(fresh, (e) => e.dispatch('advanceClock', { days: 8 }))
    renderApp('/accept-invite?token=invite-msf-demo', { engine: fresh })
    expect(screen.getByRole('heading', { name: 'This invite link was already used or has expired' })).toBeInTheDocument()
    cleanup()

    renderApp('/accept-invite?token=nope')
    expect(screen.getByRole('heading', { name: 'We could not find that invite' })).toBeInTheDocument()
    cleanup()

    renderApp('/accept-invite')
    expect(screen.getByRole('heading', { name: 'We could not find that invite' })).toBeInTheDocument()
  })

  it('accepts the seeded invite for the invited nonprofit', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/accept-invite?token=invite-msf-demo')
    expect(screen.getByRole('heading', { name: /Set up Doctors Without Borders USA/ })).toBeInTheDocument()
    await field(user, 'Your name', 'Mira Field')
    await field(user, 'Choose a password', 'longenough1')
    await field(user, 'Confirm password', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Accept invite and continue' }))
    await waitFor(() => expect(session(engine)).toMatchObject({ role: 'np_admin', nonprofitId: 'doctors-without-borders-usa' }))
  })
})

describe('nonprofits, causes, organizers, how it works', () => {
  it('lists verified nonprofits with search and a cause filter, and an empty state', async () => {
    const user = userEvent.setup()
    renderApp('/nonprofits')
    expect(screen.getByRole('link', { name: 'ASPCA' })).toBeInTheDocument()
    expect(screen.queryByText('World Wildlife Fund (WWF-US)')).not.toBeInTheDocument() // pending
    expect(screen.queryByText('Doctors Without Borders USA')).not.toBeInTheDocument() // invited
    await user.type(screen.getByLabelText('Search nonprofits'), 'aspca')
    expect(screen.getByRole('status')).toHaveTextContent('1 nonprofit')
    await user.clear(screen.getByLabelText('Search nonprofits'))
    await user.type(screen.getByLabelText('Search nonprofits'), 'zzzz')
    expect(screen.getByText('No nonprofits match that search')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))
    await user.click(screen.getByRole('button', { name: /Animals/ }))
    expect(screen.getByRole('status')).toHaveTextContent('1 nonprofit')
  })

  it('shows a profile with story, mission, stats and its public events', () => {
    renderApp('/nonprofits/aspca')
    expect(screen.getByRole('heading', { level: 1, name: 'ASPCA' })).toBeInTheDocument()
    expect(screen.getByText('What they do')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Events for ASPCA' })).toBeInTheDocument()
    expect(screen.getAllByText('#DogDads').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Demo figures')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Manage this nonprofit/ })).not.toBeInTheDocument()
  })

  it('shows its own admin a Manage link, and hides non-public profiles', () => {
    renderApp('/nonprofits/aspca', { as: EMAILS.aspca })
    expect(screen.getByRole('link', { name: /Manage this nonprofit/ })).toHaveAttribute('href', '/np')
    cleanup()
    renderApp('/nonprofits/world-wildlife-fund-wwf-us')
    expect(screen.getByText(/We couldn’t find that nonprofit/)).toBeInTheDocument()
    cleanup()
    renderApp('/nonprofits/world-wildlife-fund-wwf-us', { as: EMAILS.admin })
    expect(screen.getByText(/not public yet/)).toBeInTheDocument()
  })

  it('lists causes with links into the directory or the event feed', () => {
    renderApp('/causes')
    expect(screen.getByRole('link', { name: /Animals/ })).toHaveAttribute('href', '/nonprofits?cause=Animals')
    expect(screen.getByRole('link', { name: /Sports/ })).toHaveAttribute('href', '/?cause=Sports#discover')
  })

  it('explains how it works', () => {
    renderApp('/how-it-works')
    expect(screen.getByRole('heading', { level: 1, name: /From a good idea to a full room/ })).toBeInTheDocument()
    expect(screen.getByText('Common questions')).toBeInTheDocument()
  })

  it('shows an organizer profile with their events, and not found for anyone else', () => {
    renderApp('/organizers/u_mike')
    expect(screen.getByRole('heading', { level: 1, name: 'Mike Rivera' })).toBeInTheDocument()
    expect(screen.getAllByText('#NeonNight').length).toBeGreaterThan(0)
    cleanup()
    renderApp('/organizers/u_admin')
    expect(screen.getByText(/We couldn’t find that organizer/)).toBeInTheDocument()
    cleanup()
    renderApp('/organizers/nobody')
    expect(screen.getByText(/We couldn’t find that organizer/)).toBeInTheDocument()
  })

  it('shows 404 for unknown routes', () => {
    renderApp('/definitely-not-a-page')
    expect(screen.getByText(/We couldn’t find that page/)).toBeInTheDocument()
  })
})

describe('no dead links', () => {
  const CONTRACT = [
    /^\/$/, /^\/events\/[^/]+$/, /^\/nonprofits$/, /^\/nonprofits\/[^/]+$/, /^\/causes$/, /^\/how-it-works$/, /^\/organizers\/[^/]+$/,
    /^\/donate\/success\/[^/]+$/, /^\/saved$/, /^\/signin$/, /^\/signup$/, /^\/about-you$/, /^\/accept-invite$/, /^\/notifications$/,
    /^\/se(\/.*)?$/, /^\/np(\/.*)?$/, /^\/admin(\/.*)?$/,
  ]
  const internal = (container) => [...container.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/'))
    .map((h) => new URL(h, 'http://x.test').pathname)

  const pages = [
    ['/', {}], ['/?variant=B', {}], ['/?variant=C', {}], ['/events/neon-night', {}], ['/events/neon-night', { as: EMAILS.mike }],
    ['/events/give-now', { as: NATURE_ADMIN }], ['/events/give-now', { as: EMAILS.admin }], ['/events/spring-sprint', { as: EMAILS.mike }],
    ['/nonprofits', {}], ['/nonprofits/aspca', { as: EMAILS.aspca }], ['/causes', {}], ['/how-it-works', {}],
    ['/organizers/u_mike', {}], ['/saved', {}], ['/signin', {}], ['/signup', {}], ['/about-you', { as: EMAILS.mike }],
    ['/accept-invite?token=nope', {}], ['/events/nope', {}],
  ]
  it.each(pages)('every internal link on %s %j resolves to the route contract', (route, opts) => {
    const { container } = renderApp(route, opts)
    const bad = internal(container).filter((p) => !CONTRACT.some((re) => re.test(p)))
    expect(bad).toEqual([])
    expect(internal(container).length).toBeGreaterThan(0)
  })
})
