import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AppProviders from '../../AppProviders.jsx'
import { EMAILS, makeEngine, renderApp } from '../../test-utils.jsx'
import { wizardRoutes } from './wizard/EventWizard.jsx'
import LiveDashboard from './live/LiveDashboard.jsx'

const PW = 'Passw0rd!'
const as = (engine, email) => engine.dispatch('signIn', { email, password: PW })
const asId = (engine, userId) => engine.dispatch('demoSignIn', { userId })
const ev = (engine, key) => engine.getState().events[key]
let user
beforeEach(() => { user = userEvent.setup() })
// jsdom has no canvas: the QR kit component draws into one
HTMLCanvasElement.prototype.getContext = () => null

/** The wizard and dashboard also mount under the NP prefixes; render them there without the NP build. */
function renderBare(route, engine, children) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders engine={engine}><Routes>{children}</Routes></AppProviders>
    </MemoryRouter>,
  )
}

const STORY = 'Join us for a relaxed morning walk along the water, with coffee and a short talk at the end.'
async function fillStep1({ title = 'TestRun', story = STORY, category = 'Community' } = {}) {
  await user.click(screen.getAllByRole('button', { name: /^Sample photo 1 from/ })[0])
  await user.type(screen.getByLabelText('Title'), title)
  await user.type(screen.getByLabelText('Story'), story)
  await user.selectOptions(screen.getByLabelText('Category'), category)
}
const next = () => user.click(screen.getByRole('button', { name: 'Continue' }))
function fillStep3({ date = '2026-12-20', start = '09:00', end = '12:00', location = 'Pier A Park, Hoboken NJ' } = {}) {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } })
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: end } })
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: location } })
}
const heading = (name) => screen.findByRole('heading', { name })

async function runWizardToStep4({ nonprofit = /^ASPCA/ } = {}) {
  await fillStep1()
  await next()
  await heading('Nonprofit')
  await user.click(screen.getByRole('radio', { name: nonprofit }))
  await next()
  await heading('Date and place')
  fillStep3()
  await next()
  await heading('Preview and submit')
}

describe('SE home', () => {
  it('shows the upcoming events (up to five), stats and the create button', async () => {
    renderApp('/se', { as: EMAILS.mike })
    expect(await screen.findByRole('heading', { name: 'Hi Mike' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create an event/ })).toHaveAttribute('href', '/se/create')
    const upcoming = screen.getByRole('region', { name: 'Upcoming events' })
    // at the fixed clock Mike has two events still to come; the ended ones drop off
    const dash = within(upcoming).getAllByRole('link', { name: 'Live dashboard' })
    expect(dash).toHaveLength(2)
    dash.forEach((a) => expect(a).toHaveAttribute('href', expect.stringMatching(/^\/se\/live\//)))
    expect(screen.getByRole('heading', { name: /^Draft \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Live \(5\)/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Needs your attention' })).not.toBeInTheDocument()
  })

  it('lists changes requested and rejected events as needing attention, plus notifications', async () => {
    const sam = renderApp('/se', { as: EMAILS.sam })
    const attention = await screen.findByRole('region', { name: 'Needs your attention' })
    expect(within(attention).getByText('#BookDriveBash')).toBeInTheDocument()
    expect(within(attention).getByText(/two clearer photos/)).toBeInTheDocument()
    expect(within(attention).getByRole('link', { name: 'See what to change' })).toHaveAttribute('href', '/se/approval/book-drive-bash')
    expect(within(screen.getByRole('region', { name: 'Recent notifications' })).getByText('Changes requested')).toBeInTheDocument()
    sam.unmount()
    renderApp('/se', { as: EMAILS.priya })
    expect(await screen.findByRole('link', { name: 'See why' })).toHaveAttribute('href', '/se/approval/karaoke-for-kids')
  })

  it('shows an empty state when nothing is running or coming up', async () => {
    renderApp('/se', { as: EMAILS.jordan })
    expect(await screen.findByText('No event is running or coming up.')).toBeInTheDocument()
  })

  it('caps the upcoming list at five, running events first', async () => {
    const engine = makeEngine()
    const st = engine.getState()
    for (let i = 1; i <= 7; i++) st.events[`more-${i}`] = { ...st.events['dog-dad'], key: `more-${i}`, title: `#More${i}`, joinedIds: [], tickets: {}, checkins: [] }
    engine.reset(st)
    renderApp('/se', { as: EMAILS.mike, engine })
    const upcoming = await screen.findByRole('region', { name: 'Upcoming events' })
    expect(within(upcoming).getAllByRole('link', { name: 'Live dashboard' })).toHaveLength(5)
  })
})

describe('wizard: create, submit, approve, run live', () => {
  it('goes from an empty form to a live event with an update and a check-in', async () => {
    const { engine } = renderApp('/se/create', { as: EMAILS.mike })
    await heading('Photos and story')

    // inline validation uses the engine's own wording
    await next()
    expect(await screen.findByText('Add at least one photo before submitting.')).toBeInTheDocument()
    expect(screen.getByText('Tell people what the event is about.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')

    await runWizardToStep4()
    // saved on every step change: the draft exists, resumed at step 4
    expect(ev(engine, 'testrun')).toMatchObject({ status: 'Draft', wizardStep: 4, nonprofitId: 'aspca', title: '#TestRun', date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM' })
    expect(ev(engine, 'testrun').photos).toHaveLength(1)

    // guidelines are required
    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(await screen.findByText('Accept the community guidelines to submit.')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /community guidelines/ }))
    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))

    // submitted → approval page
    expect(await screen.findByRole('heading', { name: '#TestRun' })).toBeInTheDocument()
    expect(ev(engine, 'testrun').status).toBe('Submitted')
    expect(screen.getByText(/Waiting for ASPCA to decide/)).toBeInTheDocument()
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Decision')
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument() // submitted events cannot be deleted

    // the nonprofit approves, the SE comes back
    act(() => {
      as(engine, EMAILS.aspca)
      expect(engine.dispatch('approveEvent', { key: 'testrun' }).ok).toBe(true)
      as(engine, EMAILS.mike)
    })
    expect(await screen.findByText(/ASPCA approved it/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View the public page' })).toHaveAttribute('href', '/events/testrun')
    await user.click(screen.getByRole('link', { name: 'Live dashboard' }))

    // live dashboard: five stats, post an update
    expect(await screen.findByRole('heading', { name: '#TestRun' })).toBeInTheDocument()
    const stats = screen.getByLabelText('Event totals')
    expect(within(stats).getAllByRole('term').map((t) => t.textContent)).toEqual(['Raised', 'Backers', 'Joined', 'Chat messages', 'Updates posted'])
    await user.click(screen.getByRole('button', { name: 'Post update' }))
    expect(await screen.findByText('Write an update first.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('What is happening?'), 'Doors are open, coffee is on.')
    await user.click(screen.getByRole('button', { name: 'Post update' }))
    expect(await screen.findByText('Doors are open, coffee is on.')).toBeInTheDocument()
    expect(engine.getState().posts.some((p) => p.eventKey === 'testrun' && p.host && p.text.startsWith('Doors'))).toBe(true)

    // a guest joins, then is checked in with the typed code
    act(() => { asId(engine, 'u_marcus'); engine.dispatch('joinEvent', { eventKey: 'testrun' }); asId(engine, 'u_mike') })
    const code = ev(engine, 'testrun').tickets.u_marcus
    expect(await screen.findByText(code)).toBeInTheDocument() // roster lists the ticket holder
    const input = screen.getByLabelText('Ticket code')
    await user.type(input, code.toLowerCase())
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(await screen.findByText(/Checked in: Marcus L\./)).toBeInTheDocument()
    expect(ev(engine, 'testrun').checkins).toHaveLength(1)
    // again: clear duplicate message
    await user.type(input, code)
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(await screen.findByText(/Already in: This ticket is already checked in\./)).toBeInTheDocument()
    expect(screen.getByText(/Marcus L\. checked in/)).toBeInTheDocument()
    // unknown code
    await user.type(input, 'CH-NOPE-0000')
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(await screen.findByText(/No match: That ticket code does not match this event\./)).toBeInTheDocument()
    // walk-in
    await user.click(screen.getByRole('button', { name: 'Add walk-in' }))
    expect(await screen.findByText('Enter the guest’s name.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Guest name'), 'Casey Walker')
    await user.click(screen.getByRole('button', { name: 'Add walk-in' }))
    expect(await screen.findByRole('row', { name: /Casey Walker/ })).toHaveTextContent('Checked in (walk-in)')
    expect(ev(engine, 'testrun').checkins.find((c) => c.walkIn).name).toBe('Casey Walker')
  })

  it('shows every nonprofit that cannot take events as disabled, with the reason', async () => {
    renderApp('/se/create', { as: EMAILS.mike })
    await fillStep1()
    await next()
    await heading('Nonprofit')
    expect(screen.getByRole('radio', { name: /^ASPCA/ })).toBeEnabled()
    const invited = screen.getByRole('radio', { name: /^Doctors Without Borders USA/ })
    expect(invited).toBeDisabled()
    expect(screen.getByText(/Not available: Has not accepted its invite yet\./)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^World Wildlife Fund/ })).toBeDisabled()
    expect(screen.getByText(/Not available: Still being verified by Charity Hub\./)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Habitat for Humanity/ })).toBeDisabled() // active but no Stripe yet
    expect(screen.getAllByText(/Not available: Still setting up payments/).length).toBeGreaterThan(0)
    // a nonprofit is required
    await next()
    expect(await screen.findByText('Choose the nonprofit this event supports.')).toBeInTheDocument()
    // search narrows the list
    await user.type(screen.getByLabelText('Search nonprofits'), 'sierra')
    expect(screen.getAllByRole('radio')).toHaveLength(1)
  })

  it('validates dates and times inline', async () => {
    renderApp('/se/create', { as: EMAILS.mike })
    await fillStep1()
    await next(); await heading('Nonprofit')
    await user.click(screen.getByRole('radio', { name: /^ASPCA/ }))
    await next(); await heading('Date and place')
    await next()
    expect(await screen.findByText('Choose the date.')).toBeInTheDocument()
    expect(screen.getByText('Set a start time.')).toBeInTheDocument()
    expect(screen.getByText('Add the location.')).toBeInTheDocument()
    fillStep3({ date: '2026-11-01', start: '10:00', end: '09:00' })
    await next()
    expect(await screen.findByText('Pick a date that has not passed.')).toBeInTheDocument()
    fillStep3({ date: '2026-12-01', start: '10:00', end: '09:00' })
    await next()
    expect(await screen.findByText('The end time must come after the start time.')).toBeInTheDocument()
  })

  it('manages photos: reorder, remove, upload through the file input, and needs at least one', async () => {
    const created = vi.fn(() => 'blob:uploaded-1')
    URL.createObjectURL = created
    renderApp('/se/create', { as: EMAILS.mike })
    await heading('Photos and story')
    await user.click(screen.getAllByRole('button', { name: /^Sample photo 1 from/ })[0])
    await user.click(screen.getAllByRole('button', { name: /^Sample photo 2 from/ })[0])
    const list = screen.getByRole('list', { name: 'Photos' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText('Cover')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Move photo 2 earlier' }))
    expect(within(list).getAllByRole('img')[0]).toHaveAttribute('src', expect.stringContaining('img2.jpg'))
    await user.click(screen.getByRole('button', { name: 'Remove photo 1' }))
    await user.click(screen.getByRole('button', { name: 'Remove photo 1' }))
    expect(screen.getByText('No photos yet.')).toBeInTheDocument()
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    await user.upload(screen.getByTestId('photo-upload'), file)
    expect(created).toHaveBeenCalled()
    expect(within(screen.getByRole('list', { name: 'Photos' })).getByRole('img')).toHaveAttribute('src', 'blob:uploaded-1')
    await userEvent.setup({ applyAccept: false }).upload(screen.getByTestId('photo-upload'), new File(['x'], 'notes.txt', { type: 'text/plain' }))
    expect(screen.getAllByText('Only image files can be added.').length).toBeGreaterThan(0)
  })

  it('resumes a draft at its saved step and blocks steps it has not reached', async () => {
    renderApp('/se/create/spring-sprint/2', { as: EMAILS.mike })
    expect(await heading('Nonprofit')).toBeInTheDocument()
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
  })
  it('sends a step past the saved one back to the saved step', async () => {
    renderApp('/se/create/spring-sprint/4', { as: EMAILS.mike })
    expect(await heading('Nonprofit')).toBeInTheDocument()
  })

  it('saves and exits to the drafts list', async () => {
    const { engine } = renderApp('/se/create', { as: EMAILS.mike })
    await heading('Photos and story')
    await user.type(screen.getByLabelText('Title'), 'Half Done')
    await user.click(screen.getByRole('button', { name: 'Save and exit' }))
    expect(await screen.findByRole('heading', { name: 'Drafts and events to fix' })).toBeInTheDocument()
    expect(ev(engine, 'halfdone')).toMatchObject({ status: 'Draft', title: '#HalfDone' })
    expect(screen.getByText('#HalfDone')).toBeInTheDocument()
  })

  it('goes live straight away through autopilot', async () => {
    const engine = makeEngine()
    as(engine, EMAILS.aspca)
    expect(engine.dispatch('npSetAutopilot', { enabled: true, trustedSeIds: ['u_mike'] }).ok).toBe(true)
    renderApp('/se/create', { as: EMAILS.mike, engine })
    await heading('Photos and story')
    await runWizardToStep4()
    await user.click(screen.getByRole('checkbox', { name: /community guidelines/ }))
    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(await screen.findByText('Approved automatically. Your event is live.')).toBeInTheDocument()
    expect(ev(engine, 'testrun')).toMatchObject({ status: 'Live' })
    expect(ev(engine, 'testrun').review.decision).toBe('auto_approved')
  })
})

describe('fix mode (changes requested)', () => {
  it('shows the feedback on the status page and leads to the flagged step', async () => {
    renderApp('/se/approval/book-drive-bash', { as: EMAILS.sam })
    expect(await screen.findByRole('region', { name: 'Feedback from the nonprofit' })).toHaveTextContent('two clearer photos')
    expect(screen.getByRole('region', { name: 'Feedback from the nonprofit' })).toHaveTextContent('Photos, Story')
    expect(screen.getByRole('link', { name: 'Edit and resubmit' })).toHaveAttribute('href', '/se/create/book-drive-bash/1')
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
  })

  it('edits only flagged steps, redirects locked ones to the preview and resubmits', async () => {
    const engine = makeEngine()
    as(engine, EMAILS.aspca)
    expect(engine.dispatch('requestChanges', { key: 'paws-in-the-park', areas: ['Date & place'], feedback: 'Please confirm the pier is booked.' }).ok).toBe(true)
    engine.getState().events['paws-in-the-park'].photos = ['/photos/dog-dad/img1.jpg'] // the seeded event shows its pictures through photoKey
    renderApp('/se/create/paws-in-the-park/1', { as: EMAILS.jordan, engine })

    // step 1 is not flagged: locked, so we land on the preview
    expect(await heading('Preview and submit')).toBeInTheDocument()
    const banner = screen.getByRole('region', { name: 'Changes requested' })
    expect(banner).toHaveTextContent('Please confirm the pier is booked.')
    expect(banner).toHaveTextContent('Date & place')
    const steps = within(screen.getByRole('navigation', { name: 'Wizard steps' }))
    expect(steps.getAllByText('Locked')).toHaveLength(2)
    expect(steps.getByRole('button', { name: /Date and place/ })).toBeInTheDocument()
    expect(steps.queryByRole('button', { name: /Photos and story/ })).not.toBeInTheDocument()

    // the engine agrees: locked fields cannot change
    const locked = engine.dispatch('saveDraft', { key: 'paws-in-the-park', patch: { story: 'sneaky' } })
    expect(locked).toMatchObject({ ok: false, error: { code: 'step_locked' } })

    // the flagged step is editable
    await user.click(steps.getByRole('button', { name: /Date and place/ }))
    await heading('Date and place')
    const where = screen.getByLabelText('Location')
    await user.clear(where)
    await user.type(where, 'Pier C Park, Hoboken NJ')
    await next()
    await heading('Preview and submit')
    expect(ev(engine, 'paws-in-the-park')).toMatchObject({ status: 'Changes Requested', location: 'Pier C Park, Hoboken NJ' })
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument() // back goes to the flagged step only
    await user.click(screen.getByRole('button', { name: 'Resubmit for approval' }))
    // a ticked guidelines box is not needed again: it was accepted the first time
    expect(await screen.findByText(/Waiting for ASPCA to decide/)).toBeInTheDocument()
    expect(ev(engine, 'paws-in-the-park').status).toBe('Submitted')
  })

  it('lets the SE fix flagged photos and story, then resubmits', async () => {
    const { engine } = renderApp('/se/create/book-drive-bash/1', { as: EMAILS.sam })
    await heading('Photos and story')
    expect(screen.getByRole('region', { name: 'Changes requested' })).toHaveTextContent('Photos, Story')
    // nonprofit and date steps are locked
    const steps = within(screen.getByRole('navigation', { name: 'Wizard steps' }))
    expect(steps.getAllByText('Locked')).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: /^Sample photo 3 from/ })[0])
    const story = screen.getByLabelText('Story')
    await user.clear(story)
    await user.type(story, 'Books travel from our shelves to classrooms through the school district, and we explain how.')
    await next()
    // skips the locked steps straight to the preview
    await heading('Preview and submit')
    expect(ev(engine, 'book-drive-bash').photos).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Resubmit for approval' }))
    expect(await screen.findByText(/Waiting for United Way to decide/)).toBeInTheDocument()
    expect(ev(engine, 'book-drive-bash').status).toBe('Submitted')
  })
})

describe('rejected edit', () => {
  it('shows the reason, returns to Draft on the first save and can be resubmitted', async () => {
    const { engine } = renderApp('/se/approval/karaoke-for-kids', { as: EMAILS.priya })
    expect(await screen.findByRole('region', { name: 'Why it was not approved' })).toHaveTextContent('The venue is not confirmed yet')
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument() // rejected events can be deleted
    await user.click(screen.getByRole('link', { name: 'Edit and resubmit' }))
    await heading('Photos and story')
    expect(screen.getByRole('region', { name: 'Rejected' })).toHaveTextContent('The venue is not confirmed yet')
    expect(ev(engine, 'karaoke-for-kids').status).toBe('Rejected')
    await user.click(screen.getAllByRole('button', { name: /^Sample photo 1 from/ })[0])
    await next()
    expect(ev(engine, 'karaoke-for-kids').status).toBe('Draft') // first save
    await heading('Nonprofit')
    expect(screen.getByRole('region', { name: 'Rejected' })).toHaveTextContent('Last time this event was not approved')
    await next(); await heading('Date and place')
    await next(); await heading('Preview and submit')
    await user.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(await screen.findByText(/Waiting for St\. Jude/)).toBeInTheDocument()
    expect(ev(engine, 'karaoke-for-kids').status).toBe('Submitted')
  })
})

describe('drafts', () => {
  it('lists drafts by default and every event with the toggle', async () => {
    renderApp('/se/drafts', { as: EMAILS.mike })
    expect(await screen.findByText('#SpringSprint')).toBeInTheDocument()
    expect(screen.queryByText('#NeonNight')).not.toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Show all my events/ }))
    expect(await screen.findByText('#NeonNight')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'All my events' })).toBeInTheDocument()
  })

  it('shows Resume, View status, Clone and Delete for a draft, and deletes after confirming', async () => {
    const { engine } = renderApp('/se/drafts', { as: EMAILS.mike })
    expect(await screen.findByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/se/create/spring-sprint/2')
    expect(screen.getByRole('link', { name: 'View status' })).toHaveAttribute('href', '/se/approval/spring-sprint')
    await user.click(screen.getByRole('button', { name: 'Delete #SpringSprint' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(ev(engine, 'spring-sprint').deletedAt).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Delete #SpringSprint' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(ev(engine, 'spring-sprint').deletedAt).toBeTruthy())
    expect(await screen.findByText('No drafts right now.')).toBeInTheDocument()
  })

  it('clones a draft and opens the copy in the wizard', async () => {
    const { engine } = renderApp('/se/drafts', { as: EMAILS.mike })
    await user.click(await screen.findByRole('button', { name: 'Clone #SpringSprint' }))
    expect(await heading('Photos and story')).toBeInTheDocument()
    expect(ev(engine, 'springsprint')).toMatchObject({ status: 'Draft', title: '#SpringSprint', organizerId: 'u_mike' })
  })

  it('does not offer Delete for events the nonprofit is reviewing or has asked to change, and the engine refuses it', async () => {
    const { engine } = renderApp('/se/drafts', { as: EMAILS.sam })
    expect(await screen.findByText('#BookDriveBash')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fix and resubmit' })).toHaveAttribute('href', '/se/create/book-drive-bash/1')
    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clone #BookDriveBash' })).toBeInTheDocument()
    expect(engine.dispatch('deleteEvent', { key: 'book-drive-bash' })).toMatchObject({ ok: false, error: { code: 'event_locked' } })
    // someone else's draft
    asId(engine, 'u_mike')
    expect(engine.dispatch('deleteEvent', { key: 'book-drive-bash' })).toMatchObject({ ok: false, error: { code: 'forbidden' } })
    expect(engine.dispatch('cloneEvent', { key: 'book-drive-bash' })).toMatchObject({ ok: false, error: { code: 'forbidden' } })
    // live events cannot be deleted by their owner either
    expect(engine.dispatch('deleteEvent', { key: 'neon-night' })).toMatchObject({ ok: false, error: { code: 'event_locked' } })
  })

  it('shows an empty state with nothing to resume', async () => {
    renderApp('/se/drafts', { as: EMAILS.jordan })
    expect(await screen.findByText('No drafts right now.')).toBeInTheDocument()
    expect(screen.getByText(/0 events shown/)).toBeInTheDocument()
  })
})

describe('permissions', () => {
  it('shows a not-yours state to anyone but the organizer', async () => {
    renderApp('/se/approval/book-drive-bash', { as: EMAILS.mike })
    expect(await screen.findByRole('heading', { name: 'This is not your event' })).toBeInTheDocument()
    expect(screen.queryByText('Why United Way asked')).not.toBeInTheDocument()
  })
  it('does not let another SE edit or run someone else’s event', async () => {
    const a = renderApp('/se/create/book-drive-bash/1', { as: EMAILS.mike })
    expect(await screen.findByRole('heading', { name: 'This is not your event' })).toBeInTheDocument()
    a.unmount()
    const b = renderApp('/se/live/neon-night', { as: EMAILS.sam })
    expect(await screen.findByRole('heading', { name: 'This is not your event' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument()
    b.unmount()
    renderApp('/se/impact/neon-night', { as: EMAILS.sam })
    expect(await screen.findByRole('heading', { name: 'This is not your event' })).toBeInTheDocument()
  })
  it('says so when the event does not exist', async () => {
    renderApp('/se/live/does-not-exist', { as: EMAILS.mike })
    expect(await screen.findByRole('heading', { name: 'We could not find that event' })).toBeInTheDocument()
  })
  it('lets beneficiary nonprofit staff use the shared dashboard but not another nonprofit', async () => {
    const engine = makeEngine()
    as(engine, EMAILS.sierra)
    const route = <Route path="/np/live/:key" element={<LiveDashboard base="/np" />} />
    const a = renderBare('/np/live/river-cleanup', engine, route)
    expect(await screen.findByRole('heading', { name: '#RiverCleanupDay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check in' })).toBeEnabled()
    await user.type(screen.getByLabelText('What is happening?'), 'We have gloves for everyone.')
    await user.click(screen.getByRole('button', { name: 'Post update' }))
    await waitFor(() => expect(engine.getState().posts.some((p) => p.text === 'We have gloves for everyone.')).toBe(true))
    a.unmount()
    as(engine, EMAILS.aspca)
    renderBare('/np/live/river-cleanup', engine, route)
    expect(await screen.findByRole('heading', { name: 'This is not your event' })).toBeInTheDocument()
  })
  it('shows the live dashboard read-only to a platform admin', async () => {
    const engine = makeEngine()
    as(engine, EMAILS.admin)
    renderBare('/se/live/neon-night', engine, <Route path="/se/live/:key" element={<LiveDashboard base="/se" />} />)
    expect(await screen.findByText(/viewing this as a Charity Hub admin/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check in' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Post update' })).toBeDisabled()
  })
  it('sends a guest lead and a nonprofit admin away from /se with a notice', async () => {
    const engine = makeEngine()
    asId(engine, 'u_marcus')
    const a = renderApp('/se', { engine })
    await waitFor(() => expect(engine.getState().session.notice).toMatch(/social entrepreneur accounts/))
    expect(screen.queryByRole('link', { name: /Create an event/ })).not.toBeInTheDocument()
    a.unmount()

    const { engine: np } = renderApp('/se/create', { as: EMAILS.aspca })
    await waitFor(() => expect(np.getState().session.notice).toMatch(/social entrepreneur accounts/))
    expect(screen.queryByRole('heading', { name: 'Photos and story' })).not.toBeInTheDocument()
  })
  it('asks a signed-out visitor to sign in', async () => {
    const { engine } = renderApp('/se/drafts')
    expect(engine.getState().session.userId).toBeNull()
    expect(screen.queryByRole('heading', { name: /Drafts/ })).not.toBeInTheDocument()
  })
})

describe('approval status page', () => {
  it('walks the timeline for a submitted event and offers Clone', async () => {
    const { engine } = renderApp('/se/approval/paws-in-the-park', { as: EMAILS.jordan })
    expect(await screen.findByText(/Waiting for ASPCA to decide/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/cannot edit it while it is being reviewed/)
    expect(screen.queryByRole('link', { name: 'Edit and resubmit' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Clone as a new draft/ }))
    expect(await heading('Photos and story')).toBeInTheDocument()
    expect(ev(engine, 'pawsinthepark')).toMatchObject({ status: 'Draft', organizerId: 'u_jordan' })
    expect(ev(engine, 'pawsinthepark').photos).toHaveLength(8) // seeded pictures come along
  })
  it('deletes a rejected event after confirming', async () => {
    const { engine } = renderApp('/se/approval/karaoke-for-kids', { as: EMAILS.priya })
    await user.click(await screen.findByRole('button', { name: /Delete/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('heading', { name: 'Drafts and events to fix' })).toBeInTheDocument()
    expect(ev(engine, 'karaoke-for-kids').deletedAt).toBeTruthy()
  })
  it('links to the public page for a live event', async () => {
    renderApp('/se/approval/neon-night', { as: EMAILS.mike })
    expect(await screen.findByRole('link', { name: 'View the public page' })).toHaveAttribute('href', '/events/neon-night')
    expect(screen.getByText(/Only drafts and rejected events can be deleted/)).toBeInTheDocument()
  })
})

describe('impact', () => {
  function finished({ archive = false } = {}) {
    const engine = makeEngine()
    as(engine, EMAILS.admin)
    engine.dispatch('advanceClock', { days: 60 })
    engine.dispatch('runLifecycle')
    if (archive) { engine.dispatch('advanceClock', { days: 40 }); engine.dispatch('runLifecycle') }
    return engine
  }

  it('says the impact opens after the event ends', async () => {
    renderApp('/se/impact/neon-night', { as: EMAILS.mike })
    expect(await screen.findByText('The impact summary opens once the event has ended.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the live dashboard' })).toHaveAttribute('href', '/se/live/neon-night')
  })

  it('lists finished events and shows the summary, thank-you post and run it again', async () => {
    const engine = finished()
    expect(ev(engine, 'neon-night').status).toBe('Completed')
    renderApp('/se/impact', { as: EMAILS.mike, engine })
    const links = await screen.findAllByRole('link', { name: 'See the impact' })
    expect(links.length).toBeGreaterThan(4) // all five of Mike's seeded events have ended
    await user.click(links[0])
    expect(await screen.findByLabelText('Impact totals')).toBeInTheDocument()
  })

  it('shows the five numbers, posts a thank-you and clones for a second run', async () => {
    const engine = finished()
    renderApp('/se/impact/neon-night', { as: EMAILS.mike, engine })
    const stats = await screen.findByLabelText('Impact totals')
    expect(within(stats).getAllByRole('term').map((t) => t.textContent)).toEqual(['Raised', 'Backers', 'Participants', 'Updates posted', 'Photos'])
    await user.type(screen.getByLabelText('Your thank-you'), 'Thank you all, see you next year.')
    await user.click(screen.getByRole('button', { name: 'Post thank-you' }))
    await waitFor(() => expect(engine.getState().posts.some((p) => p.text.startsWith('Thank you all') && p.host && p.phase === 'after')).toBe(true))
    expect(await screen.findByText('Thank you all, see you next year.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Run it again/ }))
    expect(await heading('Photos and story')).toBeInTheDocument()
    expect(ev(engine, 'neonnight')).toMatchObject({ status: 'Draft', title: '#NeonNight' })
  })

  it('works for archived events and closes the thank-you composer', async () => {
    const engine = finished({ archive: true })
    expect(ev(engine, 'neon-night').status).toBe('Archived')
    renderApp('/se/impact/neon-night', { as: EMAILS.mike, engine })
    expect(await screen.findByText(/This event is archived, so new posts are closed/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Your thank-you')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run it again/ })).toBeInTheDocument()
  })

  it('has an empty state before anything has finished', async () => {
    renderApp('/se/impact', { as: EMAILS.mike })
    expect(await screen.findByText('Nothing has finished yet.')).toBeInTheDocument()
  })
})

describe('profile', () => {
  it('saves name, bio, city and phone, and links to the public profile', async () => {
    const { engine } = renderApp('/se/profile', { as: EMAILS.mike })
    expect(await screen.findByRole('link', { name: 'View your public profile' })).toHaveAttribute('href', '/organizers/u_mike')
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'M')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
    await user.clear(name); await user.type(name, 'Michael Rivera')
    const city = screen.getByLabelText('City'); await user.clear(city); await user.type(city, 'Queens, NY')
    const phone = screen.getByLabelText('Phone (optional)')
    await user.type(phone, 'abc')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(await screen.findByText('That phone number does not look right.')).toBeInTheDocument()
    await user.clear(phone); await user.type(phone, '+1 555 010 2030')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    await waitFor(() => expect(engine.getState().users.u_mike).toMatchObject({ name: 'Michael Rivera', city: 'Queens, NY', phone: '+1 555 010 2030', initials: 'MR' }))
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument()
  })
})

describe('NP-led wizard (shared component)', () => {
  it('fixes the nonprofit and goes straight to Live on submit', async () => {
    const engine = makeEngine()
    as(engine, EMAILS.sierra)
    const routes = wizardRoutes('/np/events')
    expect(routes.map((r) => r.path)).toEqual(['events/new', 'events/:key/:step'])
    expect(wizardRoutes('/se').map((r) => r.path)).toEqual(['create', 'create/:key/:step'])
    renderBare('/np/events/new', engine, <Route path="np">{routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Route>)
    await heading('Photos and story')
    await fillStep1({ title: 'CleanupCrew' })
    await next()
    await heading('Nonprofit')
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByText(/is the nonprofit for this event/)).toBeInTheDocument()
    await next(); await heading('Date and place')
    fillStep3()
    await next(); await heading('Preview and submit')
    await user.click(screen.getByRole('checkbox', { name: /community guidelines/ }))
    await user.click(screen.getByRole('button', { name: 'Publish event' }))
    expect(await screen.findByText('Your event is live.')).toBeInTheDocument()
    expect(ev(engine, 'cleanupcrew')).toMatchObject({ status: 'Live', kind: 'NP-led', nonprofitId: 'sierra-club-foundation', organizerId: 'u_np_sierraclub' })
  })
})
