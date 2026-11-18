import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, makeEngine, EMAILS } from '../../test-utils.jsx'

const PASSWORD = 'Passw0rd!'
const signIn = (engine, email) => { const r = engine.dispatch('signIn', { email, password: PASSWORD }); expect(r.ok, r.error?.message).toBe(true) }
const ok = (engine, type, payload) => { const r = engine.dispatch(type, payload); expect(r.ok, `${type}: ${r.error?.message}`).toBe(true); return r.data }
const ev = (engine, key) => engine.getState().events[key]
const np = (engine, id) => engine.getState().nonprofits[id]
const WWF = 'wwf@charityhub.com'

/** The invited nonprofit (Doctors Without Borders) accepts its invite so documents are all Missing. */
function invitedEngine() {
  const engine = makeEngine()
  ok(engine, 'acceptInvite', { token: 'invite-msf-demo', name: 'Dana Whit', password: 'longenough1' })
  return engine
}

/** A trusted SE submits a complete event to a nonprofit; returns the outcome. */
function seSubmits(engine, { email = EMAILS.mike, nonprofitId = 'aspca', title = '#TrustedWalk' } = {}) {
  signIn(engine, email)
  const d = ok(engine, 'createDraft', { title })
  ok(engine, 'saveDraft', { key: d.key, step: 4, patch: { story: 'A friendly walk through the park with a clear purpose and a long enough story.', photos: ['/photos/dog-dad/img1.jpg'], category: 'Animals', nonprofitId, date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM', location: 'Central Park, NY', guidelinesAccepted: true } })
  const out = ok(engine, 'submitEvent', { key: d.key })
  return { key: d.key, outcome: out.outcome }
}

/** A guest gives to an event of a nonprofit with payments ready. */
function gift(engine, { eventKey = 'dog-dad', amountCents = 5000, anonymous = false, name = '', email = 'giver@example.com' } = {}) {
  ok(engine, 'gateIdentify', { email, name })
  const d = ok(engine, 'createDonation', { eventKey, amountCents, anonymous, name })
  ok(engine, 'confirmDonation', { id: d.id })
  ok(engine, 'signOut')
  return d
}

describe('access', () => {
  it('sends a social entrepreneur away from /np with a notice', async () => {
    const { engine } = renderApp('/np', { as: EMAILS.mike })
    await waitFor(() => expect(engine.getState().session.notice).toMatch(/nonprofit admin/i))
    expect(screen.queryByRole('navigation', { name: /nonprofit admin navigation/i })).not.toBeInTheDocument()
  })

  it('sends a guest away from /np', async () => {
    const engine = makeEngine()
    ok(engine, 'gateIdentify', { email: 'guest@example.com' })
    renderApp('/np/approvals', { engine })
    await waitFor(() => expect(engine.getState().session.notice).toMatch(/nonprofit admin/i))
    expect(screen.queryByRole('heading', { name: /events waiting for you/i })).not.toBeInTheDocument()
  })

  it('sends a signed-out visitor to sign in', () => {
    renderApp('/np')
    expect(screen.queryByRole('navigation', { name: /nonprofit admin navigation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /hello/i })).not.toBeInTheDocument()
  })
})

describe('launchpad', () => {
  it('shows stats, the live event, action items and recent donations for a set-up nonprofit', async () => {
    const engine = makeEngine()
    gift(engine, { eventKey: 'dog-dad', amountCents: 4200, name: 'Pat Giver' })
    signIn(engine, EMAILS.aspca)
    renderApp('/np', { engine })
    expect(await screen.findByRole('heading', { name: /hello, aspca/i })).toBeInTheDocument()
    expect(screen.queryByText(/finish setup \(/i)).not.toBeInTheDocument()
    const needs = screen.getByRole('region', { name: /needs you/i })
    const link = within(needs).getByRole('link', { name: /review events/i })
    expect(link).toHaveAttribute('href', '/np/approvals')
    expect(within(needs).getByText(/1 event waiting for your approval/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /approvals 1 waiting/i })).toBeInTheDocument()
    expect(screen.getByText(/pat giver gave \$42\.00/i)).toBeInTheDocument()
  })

  it('shows the setup nudge and Stripe/document actions while setup is unfinished', async () => {
    const engine = makeEngine()
    signIn(engine, WWF)
    ok(engine, 'signOut')
    signIn(engine, EMAILS.admin)
    ok(engine, 'adminDocumentDecision', { npId: 'world-wildlife-fund-wwf-us', docId: 'w9', decision: 'reupload', note: 'The scan is cut off.' })
    ok(engine, 'signOut')
    signIn(engine, WWF)
    renderApp('/np', { engine })
    const nudge = await screen.findByRole('link', { name: /finish setup \(1 of 4\)/i })
    expect(nudge).toHaveAttribute('href', '/np/setup')
    const needs = screen.getByRole('region', { name: /needs you/i })
    expect(within(needs).getByText(/re-upload: form w-9/i)).toBeInTheDocument()
    expect(within(needs).getByText('The scan is cut off.')).toBeInTheDocument()
    expect(within(needs).getByText(/^connect stripe$/i)).toBeInTheDocument()
  })

  it('shows empty states when nothing is happening', async () => {
    renderApp('/np', { as: 'goodwill@charityhub.com' })
    expect(await screen.findByText(/no events are live/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing needs you right now/i)).toBeInTheDocument()
  })
})

describe('approvals queue', () => {
  it('lists waiting events with organizer, date, place, excerpt and age on the domain clock', async () => {
    renderApp('/np/approvals', { as: EMAILS.aspca })
    const item = (await screen.findByRole('heading', { name: '#PawsInThePark' })).closest('li')
    expect(within(item).getByText(/by jordan blake/i)).toBeInTheDocument()
    expect(within(item).getByText(/pier a park, hoboken nj/i)).toBeInTheDocument()
    expect(within(item).getByText(/bring your dog/i)).toBeInTheDocument()
    expect(within(item).getByText(/waiting 1 day/i)).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: /review #pawsinthepark/i })).toHaveAttribute('href', '/np/approvals/paws-in-the-park')
  })

  it('shows an empty state, and a Decided tab with past decisions', async () => {
    const user = userEvent.setup()
    renderApp('/np/approvals', { as: EMAILS.unitedway })
    expect(await screen.findByText(/nothing is waiting/i)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /decided \(1\)/i }))
    const item = screen.getByRole('heading', { name: '#BookDriveBash' }).closest('li')
    expect(within(item).getByText(/changes requested on/i)).toBeInTheDocument()
    expect(within(item).getByText(/two clearer photos/i)).toBeInTheDocument()
  })
})

describe('reviewing an event', () => {
  it('approves after confirming: the event goes live and the organizer is told', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/approvals/paws-in-the-park', { as: EMAILS.aspca })
    expect(await screen.findByRole('heading', { name: '#PawsInThePark' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view organizer profile/i })).toHaveAttribute('href', '/organizers/u_jordan')
    expect(screen.getByText(/a sunny walk for every wagging tail/i)).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /photo \d+ of \d+/i }).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(ev(engine, 'paws-in-the-park').status).toBe('Submitted') // nothing happens until confirmed
    await user.click(await screen.findByRole('button', { name: 'Approve event' }))
    expect(ev(engine, 'paws-in-the-park').status).toBe('Live')
    expect(engine.getState().notifications.some((n) => n.userId === 'u_jordan' && n.type === 'event_approved')).toBe(true)
    expect(await screen.findByText(/nothing is waiting/i)).toBeInTheDocument()
  })

  it('cancelling the confirm leaves the event waiting', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/approvals/paws-in-the-park', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('button', { name: 'Approve' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(ev(engine, 'paws-in-the-park').status).toBe('Submitted')
  })

  it('rejects only with a reason', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/approvals/paws-in-the-park', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('button', { name: 'Reject' }))
    await user.click(screen.getByRole('button', { name: 'Reject event' }))
    expect(await screen.findByText('Tell the organizer why.')).toBeInTheDocument()
    expect(ev(engine, 'paws-in-the-park').status).toBe('Submitted')
    await user.type(screen.getByLabelText('Reason'), 'The venue is not confirmed yet.')
    await user.click(screen.getByRole('button', { name: 'Reject event' }))
    expect(ev(engine, 'paws-in-the-park').status).toBe('Rejected')
    expect(ev(engine, 'paws-in-the-park').review.reason).toBe('The venue is not confirmed yet.')
    expect(await screen.findByText(/nothing is waiting/i)).toBeInTheDocument()
  })

  it('requests changes with areas and feedback, both required', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/approvals/paws-in-the-park', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('link', { name: 'Request changes' }))
    expect(await screen.findByRole('heading', { name: '#PawsInThePark' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send request' }))
    expect(screen.getByText('Pick at least one area to change.')).toBeInTheDocument()
    expect(screen.getByText('Tell the organizer what to fix.')).toBeInTheDocument()
    expect(ev(engine, 'paws-in-the-park').status).toBe('Submitted')
    for (const area of ['Photos', 'Story', 'Nonprofit', 'Date & place']) expect(screen.getByRole('checkbox', { name: new RegExp(`^${area}`) })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /^Photos/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Date & place/ }))
    await user.type(screen.getByLabelText(/feedback for the organizer/i), 'Please add a clearer start photo and confirm the pier.')
    await user.click(screen.getByRole('button', { name: 'Send request' }))
    const e = ev(engine, 'paws-in-the-park')
    expect(e.status).toBe('Changes Requested')
    expect(e.review.areas).toEqual(['Photos', 'Date & place'])
    expect(e.review.feedback).toMatch(/clearer start photo/)
    expect(await screen.findByText(/nothing is waiting/i)).toBeInTheDocument()
  })

  it('reports an event to Charity Hub with a reason', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/approvals/paws-in-the-park', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('button', { name: /report to charity hub/i }))
    await user.click(screen.getByRole('button', { name: 'Send report' }))
    expect(await screen.findByText('Tell Charity Hub what is wrong.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('What is wrong?'), 'The photos show a different venue.')
    await user.click(screen.getByRole('button', { name: 'Send report' }))
    const item = engine.getState().reviewItems.find((r) => r.type === 'Event report')
    expect(item).toMatchObject({ entityRef: 'paws-in-the-park', summary: 'The photos show a different venue.' })
    expect(ev(engine, 'paws-in-the-park').status).toBe('Submitted') // a report never decides the event
  })

  it('shows a decided event read-only', async () => {
    renderApp('/np/approvals/book-drive-bash', { as: EMAILS.unitedway })
    expect(await screen.findByRole('heading', { name: '#BookDriveBash' })).toBeInTheDocument()
    expect(screen.getByText(/changes requested/i, { selector: 'strong' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('refuses events that belong to another nonprofit, on every review screen', async () => {
    const first = renderApp('/np/approvals/paws-in-the-park', { as: EMAILS.sierra })
    expect(await screen.findByText(/not yours to review/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByText('#PawsInThePark')).not.toBeInTheDocument()
    first.unmount()
    renderApp('/np/approvals/paws-in-the-park/request-changes', { as: EMAILS.sierra })
    expect(await screen.findByText(/not yours to review/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send request' })).not.toBeInTheDocument()
  })

  it('says so when the event does not exist or is someone else’s private draft', async () => {
    const a = renderApp('/np/approvals/nope-nothing', { as: EMAILS.aspca })
    expect(await screen.findByText(/could not find that event/i)).toBeInTheDocument()
    a.unmount()
    renderApp('/np/approvals/spring-sprint', { as: EMAILS.aspca })
    expect(await screen.findByText(/could not find that event/i)).toBeInTheDocument()
  })

  it('flags a resubmitted event with the earlier feedback', async () => {
    const engine = makeEngine()
    signIn(engine, EMAILS.sam)
    ok(engine, 'saveDraft', { key: 'book-drive-bash', patch: { photos: ['/photos/give-now/img1.jpg'], story: 'Stack the shelves, win the night. Every book goes to a classroom in Newark within a week.' } })
    ok(engine, 'submitEvent', { key: 'book-drive-bash' })
    ok(engine, 'signOut')
    signIn(engine, EMAILS.unitedway)
    renderApp('/np/approvals/book-drive-bash', { engine })
    expect(await screen.findByText(/resubmitted/i)).toBeInTheDocument()
    expect(screen.getByText(/two clearer photos/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
  })
})

describe('setup', () => {
  it('walks the four steps: password done, documents, Stripe, waiting for verification', async () => {
    renderApp('/np/setup', { as: WWF })
    expect(await screen.findByRole('heading', { name: /finish setup/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/your password is set/i)).toBeInTheDocument()
    expect(screen.getByText(/3 of 3 uploaded/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create a stripe account in the app/i })).toBeInTheDocument()
    expect(screen.getByText(/reviews your documents once all three are uploaded and stripe is connected/i)).toBeInTheDocument()
  })

  it('uploads documents (pdf, png, jpg) and counts them', async () => {
    const user = userEvent.setup()
    const engine = invitedEngine()
    renderApp('/np/setup', { engine })
    expect(await screen.findByText(/0 of 3 uploaded/i)).toBeInTheDocument()
    const inputs = ['IRS determination letter', 'Form W-9', 'Authorization to act for the nonprofit'].map((l) => screen.getByLabelText(new RegExp(l, 'i')))
    inputs.forEach((i) => expect(i).toHaveAttribute('accept', expect.stringContaining('.pdf')))
    await user.upload(inputs[0], new File(['x'], 'irs-letter.pdf', { type: 'application/pdf' }))
    await user.upload(screen.getByLabelText(/form w-9/i), new File(['x'], 'w9.png', { type: 'image/png' }))
    expect(screen.getByText(/2 of 3 uploaded/i)).toBeInTheDocument()
    await user.upload(screen.getByLabelText(/authorization to act/i), new File(['x'], 'authority.jpg', { type: 'image/jpeg' }))
    expect(screen.getByText(/3 of 3 uploaded/i)).toBeInTheDocument()
    expect(np(engine, 'doctors-without-borders-usa').documents.map((d) => [d.type, d.name, d.status])).toEqual([['irs', 'irs-letter.pdf', 'Uploaded'], ['w9', 'w9.png', 'Uploaded'], ['authority', 'authority.jpg', 'Uploaded']])
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThanOrEqual(3)
  })

  it('refuses other file types with a plain message', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const engine = invitedEngine()
    renderApp('/np/setup', { engine })
    await user.upload(await screen.findByLabelText(/irs determination letter/i), new File(['x'], 'notes.docx', { type: 'application/msword' }))
    expect(await screen.findByText('Upload a PDF, PNG or JPG.')).toBeInTheDocument()
    expect(np(engine, 'doctors-without-borders-usa').documents[0].status).toBe('Missing')
  })

  it('shows the admin’s note on a Reupload document and lets the nonprofit upload again', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    signIn(engine, EMAILS.admin)
    ok(engine, 'adminDocumentDecision', { npId: 'world-wildlife-fund-wwf-us', docId: 'irs', decision: 'reupload', note: 'The letter is dated 2009. Send the current one.' })
    ok(engine, 'adminDocumentDecision', { npId: 'world-wildlife-fund-wwf-us', docId: 'w9', decision: 'approve' })
    ok(engine, 'signOut')
    signIn(engine, WWF)
    renderApp('/np/setup', { engine })
    expect(await screen.findByText(/the letter is dated 2009/i)).toBeInTheDocument()
    expect(screen.getByText('Reupload')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^upload form w-9/i)).not.toBeInTheDocument() // approved: nothing to replace
    await user.upload(screen.getByLabelText(/irs determination letter/i), new File(['x'], 'irs-2026.pdf', { type: 'application/pdf' }))
    expect(np(engine, 'world-wildlife-fund-wwf-us').documents[0]).toMatchObject({ name: 'irs-2026.pdf', status: 'Uploaded', note: '' })
    expect(screen.queryByText(/the letter is dated 2009/i)).not.toBeInTheDocument()
  })

  it('creates a Stripe account through the simulated hosted screen and returns connected', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/setup', { as: WWF })
    await user.click(await screen.findByRole('button', { name: /create a stripe account in the app/i }))
    expect(await screen.findByText(/simulated screen/i)).toBeInTheDocument()
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe.state).toBe('incomplete')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText(/connected \(account acct_/i)).toBeInTheDocument()
    expect(np(engine, 'world-wildlife-fund-wwf-us')).toMatchObject({ settlement: 'Pending' })
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe.state).toBe('connected')
    expect(screen.getByText(/waiting for charity hub\. a person reviews/i)).toBeInTheDocument() // documents + Stripe done, not yet verified
  })

  it('cancelling Stripe leaves setup incomplete and offers to resume', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/setup', { as: WWF })
    await user.click(await screen.findByRole('button', { name: /create a stripe account in the app/i }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText(/stripe setup was started but not finished/i)).toBeInTheDocument()
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe.state).toBe('incomplete')
    const resume = screen.getByRole('link', { name: /resume stripe setup/i })
    expect(resume).toHaveAttribute('href', '/np/stripe/hosted')
  })

  it('links an existing Stripe account, validating the id', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/setup', { as: WWF })
    await user.click(await screen.findByRole('button', { name: /link an existing stripe account/i }))
    await user.type(screen.getByLabelText(/stripe account id/i), 'not-an-id')
    await user.click(screen.getByRole('button', { name: 'Link account' }))
    expect(screen.getByText(/account ids look like acct_/i)).toBeInTheDocument()
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe.state).toBe('none')
    await user.clear(screen.getByLabelText(/stripe account id/i))
    await user.type(screen.getByLabelText(/stripe account id/i), 'acct_1A2B3C4D5E')
    await user.click(screen.getByRole('button', { name: 'Link account' }))
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe).toMatchObject({ state: 'connected', mode: 'link' })
    expect(await screen.findByText(/connected \(account acct_/i)).toBeInTheDocument()
  })

  it('handles the callback URL: success, cancel, direct visits and bad status', async () => {
    const engine = makeEngine()
    ok(engine, 'signIn', { email: WWF, password: PASSWORD })
    ok(engine, 'npConnectStripe', { mode: 'create' })
    const a = renderApp('/np/stripe/callback?status=cancel', { engine })
    expect(await screen.findByText(/stripe setup was started but not finished/i)).toBeInTheDocument()
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe.state).toBe('incomplete')
    a.unmount()
    const b = renderApp('/np/stripe/callback?status=success', { engine })
    expect(await screen.findByText(/connected \(account acct_/i)).toBeInTheDocument()
    b.unmount()
    renderApp('/np/stripe/callback?status=banana', { engine })
    expect(await screen.findByText(/that stripe link is not valid/i)).toBeInTheDocument()
  })

  it('does not connect Stripe when the callback is opened before setup started', async () => {
    const { engine } = renderApp('/np/stripe/callback?status=success', { as: WWF })
    expect(await screen.findByRole('heading', { name: /finish setup/i, level: 1 })).toBeInTheDocument()
    expect(np(engine, 'world-wildlife-fund-wwf-us').stripe.state).toBe('none')
  })

  it('shows the completion state once everything is verified and connected', async () => {
    renderApp('/np/setup', { as: EMAILS.aspca })
    expect(await screen.findByRole('heading', { name: /setup complete/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/you are verified and ready for gifts/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create an event' })).toHaveAttribute('href', '/np/events/new')
  })

  it('sends the hosted screen back to setup when Stripe has not been started', async () => {
    renderApp('/np/stripe/hosted', { as: WWF })
    expect(await screen.findByRole('heading', { name: /finish setup/i, level: 1 })).toBeInTheDocument()
  })
})

describe('organization profile', () => {
  it('edits mission, story and headquarters with validation; legal name and EIN are read-only', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/profile', { as: EMAILS.aspca })
    expect(await screen.findByRole('link', { name: /view public profile/i })).toHaveAttribute('href', '/nonprofits/aspca')
    expect(screen.getByLabelText('Legal name')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('EIN')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    await user.clear(screen.getByLabelText('Mission'))
    await user.type(screen.getByLabelText('Mission'), 'Too short')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('Describe the mission in a sentence or two.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Mission'))
    await user.type(screen.getByLabelText('Mission'), 'Providing effective means for the prevention of cruelty to animals.')
    await user.clear(screen.getByLabelText('Headquarters'))
    await user.type(screen.getByLabelText('Headquarters'), 'New York, NY')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(np(engine, 'aspca')).toMatchObject({ mission: 'Providing effective means for the prevention of cruelty to animals.', headquarters: 'New York, NY' })
    expect(await screen.findByText(/organization profile saved/i)).toBeInTheDocument()
  })

  it('saves account details for the signed-in admin', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/profile', { as: EMAILS.aspca })
    await user.clear(await screen.findByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Robin Hale')
    await user.click(screen.getByRole('button', { name: /save account details/i }))
    expect(engine.getState().users.u_np_aspca.name).toBe('Robin Hale')
  })
})

describe('autopilot', () => {
  it('saves settings, then a trusted SE’s event is approved automatically and listed', async () => {
    const user = userEvent.setup()
    const { engine, unmount } = renderApp('/np/settings/autopilot', { as: EMAILS.aspca })
    expect(await screen.findByRole('heading', { name: 'Autopilot', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/never enters your approval queue/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing auto-approved yet/i)).toBeInTheDocument()
    for (const name of ['Mike Rivera', 'Jordan Blake', 'Sam Okonkwo', 'Priya Desai']) expect(screen.getByRole('checkbox', { name: new RegExp(name) })).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: /enable autopilot/i }))
    await user.click(screen.getByRole('button', { name: /save autopilot settings/i }))
    expect(await screen.findByText('Pick at least one trusted organizer, or turn autopilot off.')).toBeInTheDocument()
    expect(np(engine, 'aspca').autopilot.enabled).toBe(false)
    await user.click(screen.getByRole('checkbox', { name: /Mike Rivera/ }))
    await user.click(screen.getByRole('button', { name: /save autopilot settings/i }))
    expect(np(engine, 'aspca').autopilot).toMatchObject({ enabled: true, trustedSeIds: ['u_mike'] })
    expect(np(engine, 'aspca').autopilot.checks).toHaveLength(3)
    unmount()

    ok(engine, 'signOut')
    const { key, outcome } = seSubmits(engine)
    expect(outcome).toBe('auto_approved')
    expect(ev(engine, key).status).toBe('Live')
    ok(engine, 'signOut')
    signIn(engine, EMAILS.aspca)
    renderApp('/np/settings/autopilot', { engine })
    const recent = await screen.findByRole('region', { name: /recently auto-approved/i })
    expect(within(recent).getByText('#TrustedWalk')).toBeInTheDocument()
    expect(within(recent).getByText(/by mike rivera/i)).toBeInTheDocument()
    expect(within(recent).getByRole('link', { name: 'Manage live' })).toHaveAttribute('href', `/np/live/${key}`)
    expect(screen.getByRole('switch', { name: /enable autopilot/i })).toBeChecked()
  })

  it('does not auto-approve a SE who is not trusted, or an event that fails a chosen check', async () => {
    const user = userEvent.setup()
    const { engine, unmount } = renderApp('/np/settings/autopilot', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('switch', { name: /enable autopilot/i }))
    await user.click(screen.getByRole('checkbox', { name: /Mike Rivera/ }))
    await user.click(screen.getByRole('button', { name: /save autopilot settings/i }))
    unmount()
    ok(engine, 'signOut')
    expect(seSubmits(engine, { email: EMAILS.jordan, title: '#NotTrusted' }).outcome).toBe('submitted')
    ok(engine, 'signOut')
    // Mike, but the cover photo check is required and his event has none
    signIn(engine, EMAILS.mike)
    const d = ok(engine, 'createDraft', { title: '#NoPhoto' })
    ok(engine, 'saveDraft', { key: d.key, step: 4, patch: { story: 'A friendly walk through the park with a clear purpose and a long enough story.', photos: ['/photos/dog-dad/img1.jpg'], category: 'Animals', nonprofitId: 'aspca', date: 'Jan 20, 2020', start: '9:00 AM', end: '12:00 PM', location: 'Central Park, NY', guidelinesAccepted: true } })
    expect(ok(engine, 'submitEvent', { key: d.key }).outcome).toBe('submitted') // date in the past fails the date check
  })

  it('respects unticked checks: a past date can pass when that check is off', async () => {
    const user = userEvent.setup()
    const { engine, unmount } = renderApp('/np/settings/autopilot', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('switch', { name: /enable autopilot/i }))
    await user.click(screen.getByRole('checkbox', { name: /Mike Rivera/ }))
    await user.click(screen.getByRole('checkbox', { name: /event date is in the future/i }))
    await user.click(screen.getByRole('button', { name: /save autopilot settings/i }))
    expect(np(engine, 'aspca').autopilot.checks).toEqual(['Has cover photo', 'Story is at least 40 characters'])
    unmount()
    ok(engine, 'signOut')
    signIn(engine, EMAILS.mike)
    const d = ok(engine, 'createDraft', { title: '#PastDate' })
    ok(engine, 'saveDraft', { key: d.key, step: 4, patch: { story: 'A friendly walk through the park with a clear purpose and a long enough story.', photos: ['/photos/dog-dad/img1.jpg'], category: 'Animals', nonprofitId: 'aspca', date: 'Jan 20, 2020', start: '9:00 AM', end: '12:00 PM', location: 'Central Park, NY', guidelinesAccepted: true } })
    expect(ok(engine, 'submitEvent', { key: d.key }).outcome).toBe('auto_approved')
  })

  it('requires at least one check while autopilot is on', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/settings/autopilot', { as: EMAILS.aspca })
    await user.click(await screen.findByRole('switch', { name: /enable autopilot/i }))
    await user.click(screen.getByRole('checkbox', { name: /Mike Rivera/ }))
    for (const c of [/has cover photo/i, /story is at least 40/i, /event date is in the future/i]) await user.click(screen.getByRole('checkbox', { name: c }))
    await user.click(screen.getByRole('button', { name: /save autopilot settings/i }))
    expect(screen.getByText(/choose at least one check/i)).toBeInTheDocument()
    expect(np(engine, 'aspca').autopilot.enabled).toBe(false)
  })
})

describe('financials and activity', () => {
  it('lists donations (anonymous stays anonymous), derives payouts, shows the Stripe balance', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    gift(engine, { amountCents: 5000, name: 'Pat Giver', email: 'pat@example.com' })
    gift(engine, { amountCents: 2500, anonymous: true, name: 'Secret Sam', email: 'sam2@example.com' })
    signIn(engine, EMAILS.aspca)
    renderApp('/np/financials', { engine })
    expect(await screen.findByRole('heading', { name: /gifts and payouts/i, level: 1 })).toBeInTheDocument()

    const stripe = screen.getByRole('region', { name: /^stripe$/i })
    expect(within(stripe).getByText('Connected')).toBeInTheDocument()
    expect(within(stripe).getByText(/paid out/i)).toBeInTheDocument()

    const table = screen.getByRole('region', { name: 'Donations' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.length).toBe(6) // four seeded + two new
    expect(within(table).getByText('Pat Giver')).toBeInTheDocument()
    expect(within(table).queryByText(/secret sam/i)).not.toBeInTheDocument()
    expect(within(table).getAllByText('Anonymous').length).toBeGreaterThanOrEqual(2)
    const patRow = within(table).getByText('Pat Giver').closest('tr')
    expect(within(patRow).getByText('$50.00')).toBeInTheDocument()
    expect(within(patRow).getByText('$1.75')).toBeInTheDocument() // 2.9% + 30c
    expect(within(patRow).getByText('Successful')).toBeInTheDocument()
    expect(within(patRow).getByText(/^CH-\d+$/)).toBeInTheDocument()

    // payouts: this week's gifts are in transit, older seeded gifts have been paid
    const payouts = screen.getByRole('region', { name: 'Payouts' })
    expect(within(payouts).getByText('In transit')).toBeInTheDocument()
    expect(within(payouts).getAllByText('Paid').length).toBeGreaterThanOrEqual(1)

    // the in-transit total is exactly this week's gifts: $50 + $25
    const week = within(payouts).getByText('In transit').closest('tr')
    expect(within(week).getByText('$75.00')).toBeInTheDocument()

    await user.click(within(stripe).getByRole('button', { name: /open stripe dashboard/i }))
    expect(await screen.findByText(/stripe dashboard \(simulated\)/i)).toBeInTheDocument()
  })

  it('filters donations by status and lists refunds with the reason', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    const d = gift(engine, { amountCents: 3000, name: 'Refund Me', email: 'r@example.com' })
    signIn(engine, EMAILS.admin)
    ok(engine, 'refundDonation', { id: d.id, reason: 'Duplicate gift' })
    ok(engine, 'signOut')
    signIn(engine, EMAILS.aspca)
    renderApp('/np/financials', { engine })
    const refunds = await screen.findByRole('region', { name: 'Refunds' })
    expect(within(refunds).getByText(/\$30\.00 to #DogDads/i)).toBeInTheDocument()
    expect(within(refunds).getByText(/duplicate gift/i)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'Refunded')
    const table = screen.getByRole('region', { name: 'Donations' })
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    await user.selectOptions(screen.getByLabelText('Status'), 'Failed')
    expect(screen.getByText(/no failed donations/i)).toBeInTheDocument()
  })

  it('shows none / incomplete Stripe states with a way to fix them, and no payouts', async () => {
    const a = renderApp('/np/financials', { as: WWF })
    const stripe = await screen.findByRole('region', { name: /^stripe$/i })
    expect(within(stripe).getByText('Not connected')).toBeInTheDocument()
    expect(within(stripe).getByRole('link', { name: /connect stripe/i })).toHaveAttribute('href', '/np/setup')
    expect(screen.getByText(/payouts start once stripe is connected/i)).toBeInTheDocument()
    a.engine.dispatch('npConnectStripe', { mode: 'create' })
    expect(await within(stripe).findByText('Setup incomplete')).toBeInTheDocument()
    expect(within(stripe).getByRole('link', { name: /finish stripe setup/i })).toBeInTheDocument()
  })

  it('shows totals per event and supporters on the activity page, respecting anonymity', async () => {
    const engine = makeEngine()
    gift(engine, { amountCents: 5000, name: 'Pat Giver', email: 'pat@example.com' })
    gift(engine, { amountCents: 2500, anonymous: true, name: 'Secret Sam', email: 'sam2@example.com' })
    signIn(engine, EMAILS.aspca)
    renderApp('/np/activity', { engine })
    const per = await screen.findByRole('region', { name: 'Totals by event' })
    const row = within(per).getByRole('link', { name: '#DogDads' }).closest('tr')
    expect(within(row).getByText('Live')).toBeInTheDocument()
    expect(within(row).getByText('$3,275')).toBeInTheDocument() // base $3,200 + $50 + $25
    const supporters = screen.getByRole('region', { name: /supporters/i })
    expect(within(supporters).getByText('Pat Giver')).toBeInTheDocument()
    expect(within(supporters).queryByText(/secret sam/i)).not.toBeInTheDocument()
    expect(within(supporters).getByText('Anonymous')).toBeInTheDocument()
  })
})

describe('events', () => {
  it('lists the nonprofit’s events with status badges and the right actions', async () => {
    renderApp('/np/events', { as: EMAILS.sierra })
    const li = (await screen.findByRole('heading', { name: '#RiverCleanupDay' })).closest('li')
    expect(within(li).getByText('Live')).toBeInTheDocument()
    expect(within(li).getByText(/run by your team/i)).toBeInTheDocument()
    expect(within(li).getByRole('link', { name: /manage #rivercleanupday live/i })).toHaveAttribute('href', '/np/live/river-cleanup')
    expect(screen.getAllByRole('link', { name: /create an event/i })[0]).toHaveAttribute('href', '/np/events/new')
  })

  it('offers Review for submitted events and View decision for sent-back ones, and filters by status', async () => {
    const user = userEvent.setup()
    const a = renderApp('/np/events', { as: EMAILS.aspca })
    const li = (await screen.findByRole('heading', { name: '#PawsInThePark' })).closest('li')
    expect(within(li).getByText('Submitted')).toBeInTheDocument()
    expect(within(li).getByRole('link', { name: /review #pawsinthepark/i })).toHaveAttribute('href', '/np/approvals/paws-in-the-park')
    await user.selectOptions(screen.getByLabelText('Status'), 'Live')
    expect(screen.queryByRole('heading', { name: '#PawsInThePark' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '#DogDads' })).toBeInTheDocument()
    a.unmount()
    renderApp('/np/events', { as: EMAILS.unitedway })
    const bd = (await screen.findByRole('heading', { name: '#BookDriveBash' })).closest('li')
    expect(within(bd).getByText('Changes Requested')).toBeInTheDocument()
    expect(within(bd).getByRole('link', { name: /view decision on #bookdrivebash/i })).toHaveAttribute('href', '/np/approvals/book-drive-bash')
  })

  it('never shows another organizer’s private drafts', async () => {
    renderApp('/np/events', { as: EMAILS.aspca })
    await screen.findByRole('heading', { name: '#DogDads' })
    expect(screen.queryByRole('heading', { name: '#SpringSprint' })).not.toBeInTheDocument()
  })

  it('shows the NP-led drafts the admin started, with a Continue link into the wizard', async () => {
    const engine = makeEngine()
    signIn(engine, EMAILS.aspca)
    const d = ok(engine, 'createDraft', { title: '#WalkTheDogs' })
    ok(engine, 'saveDraft', { key: d.key, step: 2, patch: { nonprofitId: 'aspca' } })
    renderApp('/np/events', { engine })
    const li = (await screen.findByRole('heading', { name: '#WalkTheDogs' })).closest('li')
    expect(within(li).getByRole('link', { name: /continue #walkthedogs/i })).toHaveAttribute('href', `/np/events/${d.key}/2`)
  })
})

describe('navigation badge', () => {
  it('keeps the approvals count live as decisions are made', async () => {
    const { engine } = renderApp('/np', { as: EMAILS.aspca })
    expect(await screen.findByRole('link', { name: /approvals 1 waiting/i })).toBeInTheDocument()
    ok(engine, 'rejectEvent', { key: 'paws-in-the-park', reason: 'Not this time.' })
    await waitFor(() => expect(screen.queryByRole('link', { name: /approvals 1 waiting/i })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: /^approvals$/i })).toBeInTheDocument()
  })
})

describe('shared SE components mounted under /np', () => {
  it('opens the event wizard at /np/events/new, framed for the nonprofit', async () => {
    renderApp('/np/events/new', { as: EMAILS.aspca })
    expect(await screen.findByRole('heading', { name: /create an event for your nonprofit/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /nonprofit admin navigation/i })).toBeInTheDocument()
  })

  it('publishes an NP-led event straight to Live from /np/events/:key/4', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    signIn(engine, EMAILS.aspca)
    const d = ok(engine, 'createDraft', { title: '#NpWalk' })
    ok(engine, 'saveDraft', { key: d.key, step: 4, patch: { story: 'A friendly walk for the shelter dogs, led by our own team this year.', photos: ['/photos/dog-dad/img1.jpg'], category: 'Animals', nonprofitId: 'aspca', date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM', location: 'Central Park, NY' } })
    renderApp(`/np/events/${d.key}/4`, { engine })
    await user.click(await screen.findByRole('checkbox', { name: /community guidelines/i }))
    await user.click(screen.getByRole('button', { name: 'Publish event' }))
    expect(ev(engine, d.key)).toMatchObject({ status: 'Live', kind: 'NP-led' })
  })

  it('does not open another organizer’s draft in the wizard', async () => {
    const { engine } = renderApp('/np/events/spring-sprint/1', { as: EMAILS.aspca })
    expect(await screen.findByText(/this is not your event/i)).toBeInTheDocument()
    expect(ev(engine, 'spring-sprint').status).toBe('Draft')
  })

  it('opens the live dashboard at /np/live/:key and posts an update', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/np/live/river-cleanup', { as: EMAILS.sierra })
    expect(await screen.findByRole('heading', { name: '#RiverCleanupDay', level: 1 })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/what is happening/i), 'Gloves are at the north gate.')
    await user.click(screen.getByRole('button', { name: 'Post update' }))
    expect(engine.getState().posts.some((p) => p.eventKey === 'river-cleanup' && p.text === 'Gloves are at the north gate.' && p.host)).toBe(true)
  })

  it('checks a ticket holder in from the NP live dashboard', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    ok(engine, 'gateIdentify', { email: 'walker@example.com', name: 'Wendy Walker' })
    const { ticket } = ok(engine, 'joinEvent', { eventKey: 'river-cleanup' })
    ok(engine, 'signOut')
    signIn(engine, EMAILS.sierra)
    renderApp('/np/live/river-cleanup', { engine })
    await user.type(await screen.findByLabelText('Ticket code'), ticket)
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(ev(engine, 'river-cleanup').checkins.map((c) => c.code)).toContain(ticket)
  })

  it('keeps another nonprofit out of a live dashboard that is not theirs', async () => {
    renderApp('/np/live/river-cleanup', { as: EMAILS.aspca })
    expect(await screen.findByText(/this is not your event/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Post update' })).not.toBeInTheDocument()
  })
})
