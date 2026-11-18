// Platform admin flows, driven through the real UI (renderApp mounts the real App, providers and engine).
import { describe, it, expect } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp, makeEngine, EMAILS, FIXED_NOW } from '../../test-utils.jsx'
import { adminMetrics } from '../../domain/selectors.js'
import { dollars } from '../../ui/kit.jsx'

const PW = 'Passw0rd!'
const S = (engine) => engine.getState()
const rowOf = (text) => screen.getByText(text).closest('tr')
const asAdmin = (engine) => engine.dispatch('signIn', { email: EMAILS.admin, password: PW })
const ok = (engine, type, payload) => {
  const r = engine.dispatch(type, payload)
  expect(r.ok, `${type}: ${r.error?.message}`).toBe(true)
  return r.data
}
/** Make a confirmed donation (as the signed-in user) on a live event whose nonprofit can take money. */
const give = (engine, amountCents, eventKey = 'river-cleanup') => {
  const d = ok(engine, 'createDonation', { eventKey, amountCents })
  return ok(engine, 'confirmDonation', { id: d.id })
}
const dialog = (name) => screen.getByRole('dialog', { name })

describe('admin dashboard', () => {
  it('shows the six metrics, action items, open exceptions and the clock card', () => {
    const { engine } = renderApp('/admin', { as: EMAILS.admin })
    const m = adminMetrics(S(engine))
    const tile = (label) => screen.getByText(label, { selector: 'dt' }).closest('div')

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(within(tile('Live events')).getByText(String(m.liveEvents))).toBeInTheDocument()
    expect(within(tile('Pending reviews')).getByText(String(m.pendingReviews))).toBeInTheDocument()
    expect(within(tile('Nonprofits to verify')).getByText(String(m.nonprofitsToVerify))).toBeInTheDocument()
    expect(within(tile('Open exceptions')).getByText(String(m.openExceptions))).toBeInTheDocument()
    expect(within(tile('Flagged content')).getByText(String(m.flaggedContent))).toBeInTheDocument()
    expect(within(tile('Demo GMV')).getByText(dollars(m.gmv))).toBeInTheDocument()
    expect(within(tile('Demo GMV')).getByText('Demo total, no date filter')).toBeInTheDocument()

    const actions = screen.getByRole('region', { name: 'Action items' })
    expect(within(actions).getByRole('link', { name: 'Verify World Wildlife Fund (WWF-US)' })).toHaveAttribute('href', '/admin/review/rv_2041')
    const exceptions = screen.getByRole('region', { name: 'Open exceptions' })
    expect(within(exceptions).getByText('Payout hold on golf outing')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Demo clock and lifecycle job' })).toBeInTheDocument()
  })

  it('moves the domain clock, validates a typed date and reports the lifecycle job', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin', { as: EMAILS.admin })
    const t0 = new Date(FIXED_NOW).getTime()
    const DAY = 864e5

    await user.click(screen.getByRole('button', { name: '+1 day' }))
    expect(new Date(S(engine).now).getTime()).toBe(t0 + DAY)
    await user.click(screen.getByRole('button', { name: '+7 days' }))
    expect(new Date(S(engine).now).getTime()).toBe(t0 + 8 * DAY)
    await user.click(screen.getByRole('button', { name: '+31 days' }))
    expect(new Date(S(engine).now).getTime()).toBe(t0 + 39 * DAY)

    // a cleared date is refused with the engine's message, shown inline
    const input = screen.getByLabelText('Set the clock to')
    fireEvent.change(input, { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Set date' }))
    expect(await screen.findByText('That date is not valid.')).toBeInTheDocument()
    expect(input).toBeInvalid()

    fireEvent.change(input, { target: { value: '2026-11-21T10:00' } })
    await user.click(screen.getByRole('button', { name: 'Set date' }))
    expect(S(engine).now).toBe(new Date('2026-11-21T10:00').toISOString())
    expect(screen.queryByText('That date is not valid.')).not.toBeInTheDocument()

    // the lifecycle job: the event running today has ended three days on
    const before = Object.fromEntries(Object.values(S(engine).events).map((e) => [e.key, e.status]))
    await user.click(screen.getByRole('button', { name: 'Run lifecycle job' }))
    const after = S(engine).events
    const completed = Object.keys(before).filter((k) => before[k] === 'Live' && after[k].status === 'Completed').length
    expect(completed).toBeGreaterThan(0)
    expect(after['river-cleanup'].status).toBe('Completed')
    const result = screen.getByRole('status', { name: 'Lifecycle job result' })
    expect(within(result).getByText('Events completed').nextElementSibling).toHaveTextContent(String(completed))
    expect(within(result).getByText('Blocks expired').nextElementSibling).toHaveTextContent('0')
    expect(S(engine).audit[0].action).toMatch(/^Ran lifecycle job/)
  })
})

describe('review queue', () => {
  it('filters by status, type and priority and shows an empty state', async () => {
    const user = userEvent.setup()
    renderApp('/admin/review', { as: EMAILS.admin })
    expect(screen.getByRole('link', { name: 'Verify World Wildlife Fund (WWF-US)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review #DogDads' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Priority'), 'High')
    expect(screen.getByRole('link', { name: 'Verify World Wildlife Fund (WWF-US)' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Review #DogDads' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Priority'), 'all')
    await user.selectOptions(screen.getByLabelText('Type'), 'SE Event')
    expect(screen.queryByRole('link', { name: /Verify World Wildlife/ })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Status'), 'Closed')
    expect(screen.getByText('No review items match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show open items' }))
    expect(screen.getByLabelText('Status')).toHaveValue('open')
  })

  it('starts a review, decides it, then refuses a second decision', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/review/rv_2041', { as: EMAILS.admin })

    // links to the entity and explains that approving only changes the status
    expect(screen.getByRole('link', { name: 'World Wildlife Fund (WWF-US)' })).toHaveAttribute('href', '/admin/nonprofits/world-wildlife-fund-wwf-us')
    expect(screen.getByText(/only changes its status/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the nonprofit to verify' })).toHaveAttribute('href', '/admin/nonprofits/world-wildlife-fund-wwf-us')
    // checks read as text, not colour alone
    expect(screen.getAllByText('Passed').length).toBe(2)
    expect(screen.getByText('Failed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start review' }))
    expect(S(engine).reviewItems.find((r) => r.id === 'rv_2041').status).toBe('In Review')
    expect(screen.queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    const item = S(engine).reviewItems.find((r) => r.id === 'rv_2041')
    expect(item.status).toBe('Approved')
    expect(item.decidedAt).toBe(FIXED_NOW)
    // read-only decided state, no more actions
    expect(screen.getByText(/Decided items are read-only/).closest('div')).toHaveTextContent(/Approved on/)
    for (const name of ['Approve', 'Reject', 'Close', 'Start review']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()

    // forced through the engine, the refusal is the engine's invalid_state
    let r
    act(() => { r = engine.dispatch('reviewDecision', { id: 'rv_2041', status: 'Rejected' }) })
    expect(r.ok).toBe(false)
    expect(r.error.code).toBe('invalid_state')
    expect(r.error.message).toBe('This item is already approved.')
    expect(S(engine).reviewItems.find((x) => x.id === 'rv_2041').status).toBe('Approved')
  })

  it('links event items to the public page and handles an unknown item', async () => {
    renderApp('/admin/review/rv_2042', { as: EMAILS.admin })
    expect(screen.getByRole('link', { name: '#DogDads' })).toHaveAttribute('href', '/events/dog-dad')
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  })

  it('shows a not-found state for an unknown review item', () => {
    renderApp('/admin/review/nope', { as: EMAILS.admin })
    expect(screen.getByText('We could not find that review item')).toBeInTheDocument()
  })
})

describe('nonprofits', () => {
  it('lists and filters nonprofits', async () => {
    const user = userEvent.setup()
    renderApp('/admin/nonprofits', { as: EMAILS.admin })
    expect(screen.getByRole('link', { name: 'ASPCA' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'Invited')
    expect(screen.getByRole('link', { name: 'Doctors Without Borders USA' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'ASPCA' })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'all')
    await user.type(screen.getByLabelText('Search'), 'zzzz-nothing')
    expect(screen.getByText('No nonprofits match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByRole('link', { name: 'ASPCA' })).toBeInTheDocument()
  })

  it('invites a nonprofit and shows the single-use link with a copy button and the 7-day expiry', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/nonprofits', { as: EMAILS.admin })
    await user.click(screen.getByRole('button', { name: 'Invite a nonprofit' }))
    const d = dialog('Invite a nonprofit')

    // the engine's own messages show inline
    await user.click(within(d).getByRole('button', { name: 'Create invite' }))
    expect(within(d).getByText('Enter the nonprofit name.')).toBeInTheDocument()
    await user.type(within(d).getByLabelText('Nonprofit name'), 'Harbor Light Foundation')
    await user.click(within(d).getByRole('button', { name: 'Create invite' }))
    expect(within(d).getByText('Choose a category.')).toBeInTheDocument()
    await user.selectOptions(within(d).getByLabelText('Category'), 'Community')
    await user.type(within(d).getByLabelText('EIN (optional)'), '123')
    await user.click(within(d).getByRole('button', { name: 'Create invite' }))
    expect(within(d).getByText('EINs look like 12-3456789.')).toBeInTheDocument()
    await user.clear(within(d).getByLabelText('EIN (optional)'))
    await user.type(within(d).getByLabelText('EIN (optional)'), '12-3456789')
    await user.type(within(d).getByLabelText('Admin email (optional)'), 'ops@harborlight.org')
    await user.click(within(d).getByRole('button', { name: 'Create invite' }))

    const done = dialog('Harbor Light Foundation added')
    const link = within(done).getByLabelText('Invite link')
    const np = S(engine).nonprofits['harbor-light-foundation']
    expect(np.status).toBe('Invited')
    expect(link).toHaveValue(`${window.location.origin}/accept-invite?token=${np.invite.token}`)
    expect(link.value).toMatch(/\/accept-invite\?token=invite-harbor-light-foundation-/)
    expect(within(done).getByText(/expires on/)).toHaveTextContent('7 days')
    await user.click(within(done).getByRole('button', { name: 'Copy link' }))
    expect(await navigator.clipboard.readText()).toBe(link.value)
    expect(within(done).getByRole('link', { name: 'Open nonprofit' })).toHaveAttribute('href', '/admin/nonprofits/harbor-light-foundation')

    await user.click(within(done).getByRole('button', { name: 'Done' }))
    expect(rowOf('Harbor Light Foundation')).toHaveTextContent('Invited')
    expect(S(engine).audit[0]).toMatchObject({ action: 'Invited nonprofit', category: 'Verification' })
  })

  it('invites without an email: no link yet', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/nonprofits', { as: EMAILS.admin })
    await user.click(screen.getByRole('button', { name: 'Invite a nonprofit' }))
    const d = dialog('Invite a nonprofit')
    await user.type(within(d).getByLabelText('Nonprofit name'), 'Quiet Streets')
    await user.selectOptions(within(d).getByLabelText('Category'), 'Community')
    await user.click(within(d).getByRole('button', { name: 'Create invite' }))
    expect(screen.getByText(/No invite link yet/)).toBeInTheDocument()
    expect(S(engine).nonprofits['quiet-streets'].invite).toBeNull()
  })

  it('blocks Verify until three documents are approved, then verifies', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    asAdmin(engine)
    const np = ok(engine, 'adminInviteNonprofit', { name: 'Harbor Light Foundation', category: 'Community', ein: '12-3456789', email: 'ops@harborlight.org' })
    // the nonprofit accepts its link and uploads three files (this switches the session to the nonprofit admin)
    ok(engine, 'acceptInvite', { token: np.invite.token, name: 'Jo Harbor', password: 'longenough1' })
    for (const type of ['irs', 'w9', 'authority']) ok(engine, 'npUploadDocument', { type, fileName: `${type}.pdf` })

    renderApp('/admin/nonprofits/harbor-light-foundation', { engine, as: EMAILS.admin })
    expect(screen.getByRole('heading', { level: 1, name: 'Harbor Light Foundation' })).toBeInTheDocument()
    expect(screen.getByText('Verify is unavailable. Approve all three documents first (0 of 3 approved).')).toBeInTheDocument()

    // forced anyway: the engine refuses with documents_incomplete
    await user.click(screen.getByRole('button', { name: 'Verify nonprofit' }))
    expect(await screen.findByText('Approve all three documents before verifying.')).toBeInTheDocument()
    expect(S(engine).nonprofits[np.id].status).toBe('Pending')

    // approve one by one; the reason follows the count
    await user.click(screen.getByRole('button', { name: 'Approve IRS determination letter' }))
    await user.click(screen.getByRole('button', { name: 'Approve Form W-9' }))
    expect(screen.getByText('Verify is unavailable. Approve all three documents first (2 of 3 approved).')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve Authorization to act for the nonprofit' }))
    expect(screen.queryByText(/Verify is unavailable/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Verify nonprofit' }))
    const done = S(engine).nonprofits[np.id]
    expect(done).toMatchObject({ status: 'Active', verified: true })
    expect(S(engine).reviewItems.find((r) => r.entityRef === np.id && r.type === 'Nonprofit Verification').status).toBe('Approved')
    expect(screen.getByText('Verified by Charity Hub')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verify nonprofit' })).not.toBeInTheDocument()
    expect(S(engine).audit[0]).toMatchObject({ action: 'Verified nonprofit', target: 'Harbor Light Foundation' })
  })

  it('requires a note to ask for a re-upload, and lets the admin view a document', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/nonprofits/world-wildlife-fund-wwf-us', { as: EMAILS.admin })

    await user.click(screen.getByRole('button', { name: 'View Form W-9' }))
    const viewer = dialog('Form W-9')
    expect(within(viewer).getByText('w9-document.pdf')).toBeInTheDocument()
    await user.click(within(viewer).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog', { name: 'Form W-9' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ask for re-upload of Form W-9' }))
    const d = dialog('Ask for a new Form W-9')
    await user.click(within(d).getByRole('button', { name: 'Ask for re-upload' }))
    expect(within(d).getByText('Say what to fix.')).toBeInTheDocument()
    expect(S(engine).nonprofits['world-wildlife-fund-wwf-us'].documents.find((x) => x.id === 'w9').status).toBe('Uploaded')

    await user.type(within(d).getByLabelText('What should they fix?'), 'The scan is cropped.')
    await user.click(within(d).getByRole('button', { name: 'Ask for re-upload' }))
    const w9 = S(engine).nonprofits['world-wildlife-fund-wwf-us'].documents.find((x) => x.id === 'w9')
    expect(w9).toMatchObject({ status: 'Reupload', note: 'The scan is cropped.' })
    expect(rowOf('Form W-9')).toHaveTextContent('Note to nonprofit: The scan is cropped.')
    expect(screen.getByRole('button', { name: 'Approve Form W-9' })).toBeDisabled()
    expect(S(engine).notifications.some((n) => n.type === 'document_reupload')).toBe(true)
  })

  it('re-runs the EIN check and rejects with a reason', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/nonprofits/world-wildlife-fund-wwf-us', { as: EMAILS.admin })
    await user.click(screen.getByRole('button', { name: 'Re-run EIN check' }))
    expect(S(engine).audit[0].action).toBe('Re-ran EIN check')

    await user.click(screen.getByRole('button', { name: 'Reject nonprofit' }))
    const d = dialog('Reject World Wildlife Fund (WWF-US)?')
    await user.click(within(d).getByRole('button', { name: 'Reject nonprofit' }))
    expect(within(d).getByText(/Add a reason/)).toBeInTheDocument()
    await user.type(within(d).getByLabelText('Reason'), 'Documents do not match the EIN.')
    await user.click(within(d).getByRole('button', { name: 'Reject nonprofit' }))
    expect(S(engine).nonprofits['world-wildlife-fund-wwf-us'].status).toBe('Rejected')
    expect(S(engine).audit[0].action).toBe('Rejected nonprofit: Documents do not match the EIN.')
    expect(S(engine).reviewItems.find((r) => r.id === 'rv_2041').status).toBe('Rejected')
  })

  it('suspends a nonprofit after a confirmation, then reinstates it', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/nonprofits/sierra-club-foundation', { as: EMAILS.admin })
    expect(S(engine).events['river-cleanup'].status).toBe('Live')

    await user.click(screen.getByRole('button', { name: 'Suspend nonprofit' }))
    const d = dialog('Suspend Sierra Club Foundation?')
    const liveCount = Object.values(S(engine).events).filter((e) => e.nonprofitId === 'sierra-club-foundation' && e.status === 'Live').length
    expect(liveCount).toBeGreaterThan(0)
    expect(d).toHaveTextContent(`${liveCount} live ${liveCount === 1 ? 'event' : 'events'} will be blocked`)
    expect(d).toHaveTextContent('Donations are held')
    await user.click(within(d).getByRole('button', { name: 'Suspend nonprofit' }))

    expect(S(engine).nonprofits['sierra-club-foundation'].status).toBe('Suspended')
    expect(S(engine).events['river-cleanup'].status).toBe('Blocked')
    expect(screen.getByRole('button', { name: 'Reinstate nonprofit' })).toBeInTheDocument()
    expect(rowOf('#RiverCleanupDay')).toHaveTextContent('Blocked')

    await user.click(screen.getByRole('button', { name: 'Reinstate nonprofit' }))
    expect(S(engine).nonprofits['sierra-club-foundation'].status).toBe('Active')
    expect(S(engine).events['river-cleanup'].status).toBe('Live')
    expect(S(engine).audit.map((a) => a.action)).toEqual(expect.arrayContaining(['Reinstated nonprofit']))
  })

  it('issues and re-issues an invite; the old link stops working', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/nonprofits/doctors-without-borders-usa', { as: EMAILS.admin })
    const old = S(engine).nonprofits['doctors-without-borders-usa'].invite.token
    expect(screen.getByLabelText('Invite link')).toHaveValue(`${window.location.origin}/accept-invite?token=${old}`)

    await user.type(screen.getByLabelText('Admin email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Re-issue invite' }))
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Admin email'))
    await user.type(screen.getByLabelText('Admin email'), 'new.admin@msf.org')
    await user.click(screen.getByRole('button', { name: 'Re-issue invite' }))
    const fresh = S(engine).nonprofits['doctors-without-borders-usa'].invite
    expect(fresh.token).not.toBe(old)
    expect(fresh.email).toBe('new.admin@msf.org')
    expect(screen.getByLabelText('Invite link')).toHaveValue(`${window.location.origin}/accept-invite?token=${fresh.token}`)
    let r
    act(() => { r = engine.dispatch('acceptInvite', { token: old, name: 'Someone', password: 'longenough1' }) })
    expect(r.error.code).toBe('invite_expired')
  })

  it('shows facts, events and the admin account, and a not-found state', () => {
    renderApp('/admin/nonprofits/aspca', { as: EMAILS.admin })
    expect(screen.getByRole('link', { name: 'View the public profile' })).toHaveAttribute('href', '/nonprofits/aspca')
    expect(screen.getByRole('link', { name: '#PawsInThePark' })).toHaveAttribute('href', '/events/paws-in-the-park')
    expect(within(screen.getByRole('region', { name: 'Admin account' })).getByText('aspca@charityhub.com')).toBeInTheDocument()
  })

  it('shows not found for an unknown nonprofit', () => {
    renderApp('/admin/nonprofits/not-real', { as: EMAILS.admin })
    expect(screen.getByText('We could not find that nonprofit')).toBeInTheDocument()
  })
})

describe('events', () => {
  it('lists every event including drafts and filters by status and search', async () => {
    const user = userEvent.setup()
    renderApp('/admin/events', { as: EMAILS.admin })
    expect(screen.getByRole('link', { name: '#SpringSprint, public page' })).toHaveAttribute('href', '/events/spring-sprint')
    await user.selectOptions(screen.getByLabelText('Status'), 'Draft')
    expect(screen.getByRole('link', { name: '#SpringSprint, public page' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '#RiverCleanupDay, public page' })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'all')
    await user.type(screen.getByLabelText('Search'), 'jordan')
    expect(screen.getByRole('link', { name: '#PawsInThePark, public page' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '#SpringSprint, public page' })).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Search'))
    await user.type(screen.getByLabelText('Search'), 'no such event')
    expect(screen.getByText('No events match')).toBeInTheDocument()
  })

  it('blocks a live event with a refund, counts days to expiry on the domain clock, then restores it', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    asAdmin(engine)
    const gift = give(engine, 5000)
    renderApp('/admin/events', { engine, as: EMAILS.admin })

    await user.click(screen.getByRole('button', { name: 'Block #RiverCleanupDay' }))
    const d = dialog('Block #RiverCleanupDay')
    expect(within(d).getByLabelText(/Refund now/)).toHaveAccessibleName(/1 donation \(\$50\.00\) will go back to donors/)
    await user.click(within(d).getByRole('button', { name: 'Block event' }))
    expect(within(d).getByText('Give a reason.')).toBeInTheDocument()
    expect(S(engine).events['river-cleanup'].status).toBe('Live')

    await user.type(within(d).getByLabelText('Reason'), 'Reports of an unsafe venue.')
    await user.click(within(d).getByLabelText(/Refund now/))
    await user.click(within(d).getByRole('button', { name: 'Block event' }))

    const ev = S(engine).events['river-cleanup']
    expect(ev.status).toBe('Blocked')
    expect(ev.blocked).toMatchObject({ reason: 'Reports of an unsafe venue.', mode: 'refund' })
    expect(S(engine).donations.find((x) => x.id === gift.id).status).toBe('Refunded')
    const row = rowOf('#RiverCleanupDay')
    expect(row).toHaveTextContent('Blocked')
    expect(row).toHaveTextContent('Donations were refunded.')
    expect(row).toHaveTextContent('14 days left until the block expires')

    act(() => { ok(engine, 'advanceClock', { days: 5 }) })
    expect(rowOf('#RiverCleanupDay')).toHaveTextContent('9 days left until the block expires')

    await user.click(screen.getByRole('button', { name: 'Restore #RiverCleanupDay' }))
    await user.click(within(dialog('Restore #RiverCleanupDay?')).getByRole('button', { name: 'Restore event' }))
    expect(S(engine).events['river-cleanup'].status).toBe('Live')
    expect(S(engine).events['river-cleanup'].blocked).toBeNull()
    expect(rowOf('#RiverCleanupDay')).toHaveTextContent('Live')
  })

  it('blocks and holds the money by default', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    asAdmin(engine)
    const gift = give(engine, 2500)
    renderApp('/admin/events', { engine, as: EMAILS.admin })
    await user.click(screen.getByRole('button', { name: 'Block #RiverCleanupDay' }))
    const d = dialog('Block #RiverCleanupDay')
    await user.type(within(d).getByLabelText('Reason'), 'Paused while we check a report.')
    await user.click(within(d).getByRole('button', { name: 'Block event' }))
    expect(S(engine).events['river-cleanup'].blocked.mode).toBe('hold')
    expect(S(engine).donations.find((x) => x.id === gift.id).status).toBe('Successful')
    expect(rowOf('#RiverCleanupDay')).toHaveTextContent('Money is held.')
  })
})

describe('exceptions', () => {
  it('escalates, resolves and reopens, and filters by status', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/exceptions', { as: EMAILS.admin })
    const status = () => S(engine).exceptions.find((x) => x.id === 'ex_118').status

    expect(rowOf('Payout hold on golf outing')).toHaveTextContent('Open')
    await user.click(screen.getByRole('button', { name: 'Escalate EX-118' }))
    expect(status()).toBe('Escalated')
    expect(rowOf('Payout hold on golf outing')).toHaveTextContent('Escalated')
    expect(screen.queryByRole('button', { name: 'Escalate EX-118' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resolve EX-118' }))
    expect(status()).toBe('Resolved')
    expect(screen.getByRole('button', { name: 'Reopen EX-118' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Status'), 'active')
    expect(screen.getByText('No exceptions match')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'Resolved')
    await user.click(screen.getByRole('button', { name: 'Reopen EX-118' }))
    expect(status()).toBe('Open')
    expect(S(engine).audit.slice(0, 3).map((a) => a.action)).toEqual(['Reopened exception EX-118', 'Resolved exception EX-118', 'Escalated exception EX-118'])
  })
})

describe('audit log', () => {
  const CATEGORIES = ['Approval', 'Verification', 'Events', 'Exception', 'Payments', 'Privacy', 'Moderation']

  /** One entry for each of the seven categories (Verification is in the seed). */
  const seedAudit = () => {
    const engine = makeEngine()
    asAdmin(engine)
    ok(engine, 'reviewDecision', { id: 'rv_2042', status: 'In Review' })                                       // Approval
    ok(engine, 'blockEvent', { key: 'river-cleanup', reason: 'Checking a report', mode: 'hold' })           // Events
    ok(engine, 'exceptionAction', { id: 'ex_118', action: 'escalate' })                                       // Exception
    const gift = give(engine, 5000, 'dog-dad')
    ok(engine, 'refundDonation', { id: gift.id, reason: 'Duplicate gift' })                                   // Payments
    ok(engine, 'anonymizeUser', { userId: 'u_marcus' })                                                       // Privacy
    const post = ok(engine, 'createPost', { eventKey: 'dog-dad', text: 'Totally not spam' })
    ok(engine, 'flagContent', { kind: 'post', id: post.id, eventKey: 'dog-dad', reason: 'Spam' })
    ok(engine, 'moderateContent', { kind: 'post', id: post.id, eventKey: 'dog-dad', decision: 'dismiss' })    // Moderation
    return engine
  }

  it('filters by every one of the seven categories', async () => {
    const user = userEvent.setup()
    const engine = seedAudit()
    renderApp('/admin/audit', { engine, as: EMAILS.admin })
    const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const categoryOf = (row) => row.lastElementChild.textContent

    expect(screen.getByRole('group', { name: 'Filter by category' }).querySelectorAll('button')).toHaveLength(8)
    const total = S(engine).audit.length
    expect(bodyRows()).toHaveLength(total)
    // newest first
    const times = bodyRows().map((r) => r.querySelector('time').getAttribute('datetime'))
    expect([...times].sort().reverse()).toEqual(times)

    for (const c of CATEGORIES) {
      await user.click(screen.getByRole('button', { name: c }))
      expect(screen.getByRole('button', { name: c })).toHaveAttribute('aria-pressed', 'true')
      const rows = bodyRows()
      expect(rows.length, c).toBe(S(engine).audit.filter((a) => a.category === c).length)
      expect(rows.length, c).toBeGreaterThan(0)
      rows.forEach((r) => expect(categoryOf(r)).toBe(c))
    }
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(bodyRows()).toHaveLength(total)
  })

  it('searches actor, action and target, with an empty state', async () => {
    const user = userEvent.setup()
    renderApp('/admin/audit', { engine: seedAudit(), as: EMAILS.admin })
    await user.type(screen.getByLabelText('Search the log'), 'anonymized')
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Marcus L.')
    expect(rows[0]).toHaveTextContent('Charity Hub admin')
    await user.clear(screen.getByLabelText('Search the log'))
    await user.type(screen.getByLabelText('Search the log'), 'zzz-no-match')
    expect(screen.getByText('No entries match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show everything' }))
    expect(within(screen.getByRole('table')).getAllByRole('row').length).toBeGreaterThan(5)
  })

  it('says so when a category has no entries yet', async () => {
    const user = userEvent.setup()
    renderApp('/admin/audit', { as: EMAILS.admin })
    await user.click(screen.getByRole('button', { name: 'Privacy' }))
    expect(screen.getByText('No privacy entries')).toBeInTheDocument()
  })
})

describe('moderation', () => {
  /** A post, a reply and a chat message, each reported. */
  const flagged = () => {
    const engine = makeEngine()
    asAdmin(engine)
    const post = ok(engine, 'createPost', { eventKey: 'dog-dad', text: 'Buy cheap followers now' })
    const reply = ok(engine, 'replyToPost', { postId: post.id, text: 'You are all fools' })
    ok(engine, 'flagContent', { kind: 'post', id: post.id, eventKey: 'dog-dad', reason: 'Spam' })
    ok(engine, 'flagContent', { kind: 'reply', id: reply.id, eventKey: 'dog-dad', reason: 'Rude to others' })
    ok(engine, 'flagContent', { kind: 'chat', id: 'c_dog-dad_1', eventKey: 'dog-dad', reason: 'Off topic' })
    return { engine, post, reply }
  }

  it('previews reported content, and hides, removes and dismisses', async () => {
    const user = userEvent.setup()
    const { engine, post, reply } = flagged()
    renderApp('/admin/moderation', { engine, as: EMAILS.admin })
    const title = S(engine).events['dog-dad'].title
    const card = (text) => screen.getByText(text).closest('li')

    // nav badge counts the reports
    expect(screen.getByRole('link', { name: /Moderation.*3 waiting/ })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').filter((li) => li.classList.contains('adm-card'))).toHaveLength(3)

    // preview: content, author, event, reason
    const postCard = card('Buy cheap followers now')
    expect(within(postCard).getByText(/^Alex Mercer · /)).toBeInTheDocument()
    expect(within(postCard).getByRole('link', { name: title })).toHaveAttribute('href', '/events/dog-dad')
    expect(within(postCard).getByText(/“Spam”/)).toBeInTheDocument()
    expect(within(card('Counting down the days. Who else is coming?')).getByText(/^Marcus L\. · /)).toBeInTheDocument()

    // hide the post
    await user.click(within(postCard).getByRole('button', { name: 'Hide' }))
    expect(S(engine).posts.find((p) => p.id === post.id)).toMatchObject({ hidden: true, removed: false })
    expect(screen.queryByText('Buy cheap followers now')).not.toBeInTheDocument() // decided reports leave the queue

    // remove the reply
    await user.click(within(card('You are all fools')).getByRole('button', { name: 'Remove' }))
    const gone = S(engine).posts.find((p) => p.id === post.id).replies.find((r) => r.id === reply.id)
    expect(gone).toMatchObject({ hidden: true })
    expect(S(engine).reviewItems.filter((r) => r.type === 'Content report' && r.entityRef.startsWith('reply:')).every((r) => r.status === 'Approved')).toBe(true)

    // dismiss the chat report: the message stays visible, the item closes
    await user.click(within(card('Counting down the days. Who else is coming?')).getByRole('button', { name: 'Dismiss' }))
    const msg = S(engine).chat['dog-dad'].find((m) => m.id === 'c_dog-dad_1')
    expect(msg).toMatchObject({ hidden: false, flags: [] })
    expect(S(engine).reviewItems.find((r) => r.entityRef === 'chat:c_dog-dad_1:dog-dad').status).toBe('Closed')

    expect(screen.getByText('Nothing to moderate')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Moderation.*waiting/ })).not.toBeInTheDocument()
    expect(adminMetrics(S(engine)).flaggedContent).toBe(0)
    expect(S(engine).audit.slice(0, 3).map((a) => a.category)).toEqual(['Moderation', 'Moderation', 'Moderation'])

    // decided reports stay readable under "All reports"
    await user.selectOptions(screen.getByLabelText('Show'), 'all')
    const decided = card('Buy cheap followers now')
    expect(within(decided).getByText('Hidden')).toBeInTheDocument()
    expect(within(decided).queryByRole('button', { name: 'Hide' })).not.toBeInTheDocument()
    expect(within(card('You are all fools')).getByText('Removed')).toBeInTheDocument()
  })

  it('shows an empty state when nothing is reported', () => {
    renderApp('/admin/moderation', { as: EMAILS.admin })
    expect(screen.getByText('Nothing to moderate')).toBeInTheDocument()
  })

  it('links a content-report review item to moderation', () => {
    const { engine } = flagged()
    const item = S(engine).reviewItems.find((r) => r.entityRef.startsWith('post:'))
    renderApp(`/admin/review/${item.id}`, { engine, as: EMAILS.admin })
    expect(screen.getByRole('link', { name: 'Review the content in Moderation' })).toHaveAttribute('href', '/admin/moderation')
    expect(screen.getByRole('link', { name: /post in/ })).toHaveAttribute('href', '/admin/moderation')
  })
})

describe('payments', () => {
  it('refunds with a reason and marks another donation disputed', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    asAdmin(engine)
    const a = give(engine, 5000)
    const b = give(engine, 2500)
    renderApp('/admin/payments', { engine, as: EMAILS.admin })

    expect(rowOf(a.receiptNo)).toHaveTextContent('$50.00')
    expect(rowOf(a.receiptNo)).toHaveTextContent('Successful')

    // refund: confirm dialog with a reason
    await user.click(screen.getByRole('button', { name: `Refund ${a.receiptNo}` }))
    const d = dialog(`Refund ${a.receiptNo}?`)
    expect(d).toHaveTextContent('cannot be undone')
    const reason = within(d).getByLabelText('Reason')
    await user.clear(reason)
    await user.type(reason, 'Donor asked for it')
    await user.click(within(d).getByRole('button', { name: 'Refund donation' }))
    expect(S(engine).donations.find((x) => x.id === a.id)).toMatchObject({ status: 'Refunded', refundReason: 'Donor asked for it' })
    expect(rowOf(a.receiptNo)).toHaveTextContent('Refunded')
    expect(rowOf(a.receiptNo)).toHaveTextContent('Donor asked for it')
    expect(screen.queryByRole('button', { name: `Refund ${a.receiptNo}` })).not.toBeInTheDocument()

    // dispute: confirm, then an exception opens
    await user.click(screen.getByRole('button', { name: `Mark ${b.receiptNo} as disputed` }))
    await user.click(within(dialog(`Mark ${b.receiptNo} as disputed?`)).getByRole('button', { name: 'Mark as disputed' }))
    expect(S(engine).donations.find((x) => x.id === b.id).status).toBe('Disputed')
    expect(rowOf(b.receiptNo)).toHaveTextContent('Disputed')
    expect(S(engine).exceptions.some((x) => x.type === 'Dispute' && x.title === `Dispute on ${b.receiptNo}`)).toBe(true)
    expect(S(engine).audit.slice(0, 2).map((x) => x.category)).toEqual(['Payments', 'Payments'])
  })

  it('filters by status and event, and the settlement overview is read-only', async () => {
    const user = userEvent.setup()
    const engine = makeEngine()
    asAdmin(engine)
    const a = give(engine, 5000)
    ok(engine, 'refundDonation', { id: a.id })
    renderApp('/admin/payments', { engine, as: EMAILS.admin })

    await user.selectOptions(screen.getByLabelText('Status'), 'Refunded')
    const table = screen.getAllByRole('table')[0]
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent(a.receiptNo)

    await user.selectOptions(screen.getByLabelText('Status'), 'all')
    await user.selectOptions(screen.getByLabelText('Event'), S(engine).events['dog-dad'].title)
    const dogRows = within(screen.getAllByRole('table')[0]).getAllByRole('row').slice(1)
    expect(dogRows.length).toBe(4) // the four seeded gifts
    await user.selectOptions(screen.getByLabelText('Status'), 'Failed')
    expect(screen.getByText('No donations match')).toBeInTheDocument()

    const settlement = screen.getByRole('region', { name: 'Nonprofit settlement' })
    expect(within(settlement).getByText(/Read-only/)).toBeInTheDocument()
    expect(within(settlement).queryByRole('button')).not.toBeInTheDocument()
    expect(within(rowOfIn(settlement, 'Sierra Club Foundation')).getByText('Connected')).toBeInTheDocument()
    expect(within(rowOfIn(settlement, 'Doctors Without Borders USA')).getByText('Not connected')).toBeInTheDocument()
    expect(rowOfIn(settlement, 'Sierra Club Foundation')).toHaveTextContent('$50.00') // refunded column
  })
})

const rowOfIn = (scope, text) => within(scope).getByText(text).closest('tr')

describe('privacy', () => {
  it('finds a person, anonymizes after a confirmation, and keeps financial records and content', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/privacy', { as: EMAILS.admin })
    expect(screen.getByText(/Type at least two letters/)).toBeInTheDocument()
    const giftsBefore = S(engine).donations.filter((d) => d.donorId === 'u_marcus').length
    const chatBefore = S(engine).chat['dog-dad'].find((m) => m.authorId === 'u_marcus')
    expect(giftsBefore).toBeGreaterThan(0)

    await user.type(screen.getByLabelText('Name or email'), 'marcus')
    expect(rowOf('Marcus L.')).toHaveTextContent('Guest')
    await user.click(screen.getByRole('button', { name: 'Anonymize Marcus L.' }))
    const d = dialog('Anonymize Marcus L.?')
    expect(d).toHaveTextContent('Financial records stay')
    expect(d).toHaveTextContent('content they wrote')
    expect(d).toHaveTextContent('cannot be undone')
    // cancelling changes nothing
    await user.click(within(d).getByRole('button', { name: 'Cancel' }))
    expect(S(engine).users.u_marcus.status).toBe('active')

    await user.click(screen.getByRole('button', { name: 'Anonymize Marcus L.' }))
    await user.click(within(dialog('Anonymize Marcus L.?')).getByRole('button', { name: 'Anonymize account' }))

    const u = S(engine).users.u_marcus
    expect(u).toMatchObject({ status: 'anonymized', name: 'Deleted user', phone: '' })
    expect(u.email).toMatch(/anonymized\.invalid$/)
    expect(S(engine).donations.filter((x) => x.donorId === 'u_marcus')).toHaveLength(giftsBefore)
    expect(S(engine).chat['dog-dad'].find((m) => m.id === chatBefore.id).text).toBe(chatBefore.text)
    expect(S(engine).audit[0]).toMatchObject({ category: 'Privacy', target: 'Marcus L.' })

    // shown as anonymized, listed with what was kept
    const section = screen.getByRole('region', { name: 'Anonymized accounts' })
    expect(within(section).getByText(/Deleted user/)).toBeInTheDocument()
    expect(within(section).getByText('Anonymized')).toBeInTheDocument()
    expect(section).toHaveTextContent(`${giftsBefore} donations`)

    await user.clear(screen.getByLabelText('Name or email'))
    await user.type(screen.getByLabelText('Name or email'), 'deleted')
    expect(within(screen.getByRole('region', { name: 'Find a person' })).getByText('Deleted user').closest('tr')).toHaveTextContent('Already anonymized')
    expect(screen.queryByRole('button', { name: /Anonymize Deleted user/ })).not.toBeInTheDocument()
  })

  it('does not offer to anonymize an admin and handles no results', async () => {
    const user = userEvent.setup()
    const { engine } = renderApp('/admin/privacy', { as: EMAILS.admin })
    await user.type(screen.getByLabelText('Name or email'), 'alex.mercer')
    expect(rowOf('Alex Mercer')).toHaveTextContent('Admin accounts cannot be anonymized')
    expect(screen.queryByRole('button', { name: /Anonymize Alex/ })).not.toBeInTheDocument()
    // the engine refuses too
    let r
    act(() => { r = engine.dispatch('anonymizeUser', { userId: 'u_admin' }) })
    expect(r.error.code).toBe('forbidden')

    await user.clear(screen.getByLabelText('Name or email'))
    await user.type(screen.getByLabelText('Name or email'), 'zzqq')
    expect(screen.getByText('No one matches')).toBeInTheDocument()
  })

  it('finds nonprofit admins by email and links to their nonprofit', async () => {
    const user = userEvent.setup()
    renderApp('/admin/privacy', { as: EMAILS.admin })
    await user.type(screen.getByLabelText('Name or email'), 'aspca@')
    expect(within(rowOf('ASPCA Admin')).getByRole('link', { name: 'ASPCA' })).toHaveAttribute('href', '/admin/nonprofits/aspca')
  })
})

describe('navigation and access', () => {
  it('has every section in the menu and counts what is waiting', () => {
    renderApp('/admin', { as: EMAILS.admin })
    const nav = screen.getByRole('navigation', { name: 'Charity Hub admin navigation' })
    for (const name of ['Dashboard', 'Review queue', 'Moderation', 'Nonprofits', 'Events', 'Exceptions', 'Payments', 'Privacy', 'Audit log']) {
      expect(within(nav).getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument()
    }
    expect(within(nav).getByRole('link', { name: /Review queue.*2 waiting/ })).toHaveAttribute('href', '/admin/review')
    expect(within(nav).getByRole('link', { name: 'Payments' })).toHaveAttribute('href', '/admin/payments')
    expect(within(nav).queryByRole('link', { name: /Moderation.*waiting/ })).not.toBeInTheDocument()
  })

  it('shows a not-found page for an unknown admin path', () => {
    renderApp('/admin/nothing-here', { as: EMAILS.admin })
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('sends a social entrepreneur away from /admin with a notice', async () => {
    const { engine } = renderApp('/admin/payments', { as: EMAILS.mike })
    expect(await screen.findByText(/That area is for charity hub admin accounts/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Payments' })).not.toBeInTheDocument()
    expect(S(engine).session.notice).toMatch(/signed in as social entrepreneur/)
  })

  it('sends a nonprofit admin away from /admin with a notice', async () => {
    renderApp('/admin', { as: EMAILS.aspca })
    expect(await screen.findByText(/That area is for charity hub admin accounts/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('sends a guest away from /admin with a notice', async () => {
    const engine = makeEngine()
    ok(engine, 'demoSignIn', { userId: 'u_marcus' })
    renderApp('/admin/privacy', { engine })
    await waitFor(() => expect(S(engine).session.notice).toMatch(/That area is for charity hub admin accounts. You are signed in as guest/))
    expect(screen.queryByRole('heading', { name: 'Privacy' })).not.toBeInTheDocument()
  })

  it('sends a signed-out visitor to sign in', () => {
    renderApp('/admin')
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('refuses admin actions from other roles at the engine too', () => {
    const engine = makeEngine()
    ok(engine, 'signIn', { email: EMAILS.mike, password: PW })
    for (const [type, payload] of [['reviewDecision', { id: 'rv_2041', status: 'Approved' }], ['anonymizeUser', { userId: 'u_marcus' }], ['runLifecycle', {}]]) {
      const r = engine.dispatch(type, payload)
      expect(r.ok, type).toBe(false)
      expect(r.error.code).toBe('forbidden')
    }
  })
})
