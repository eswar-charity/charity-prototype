import { describe, it, expect, beforeEach } from 'vitest'
import { createEngine, eventTotals, quote } from './engine.js'
import { buildSeed } from './seed.js'
import { visibility, feed, timing, leaderboard, npSetupSteps, adminMetrics, currentUser } from './selectors.js'

const NOW = '2026-11-18T12:00:00.000Z'
let e
const run = (type, payload) => e.dispatch(type, payload)
const ok = (type, payload) => { const r = run(type, payload); expect(r.ok, `${type}: ${r.error?.code} ${r.error?.message}`).toBe(true); return r.data }
const bad = (type, payload, code) => { const r = run(type, payload); expect(r.ok, `${type} should fail`).toBe(false); if (code) expect(r.error.code).toBe(code); return r.error }
const as = (email) => ok('signIn', { email, password: 'Passw0rd!' })
const S = () => e.getState()
const ev = (k) => S().events[k]

// A complete, valid draft for an SE (photos, story, dates, nonprofit, guidelines)
function readyDraft(over = {}) {
  const d = ok('createDraft', { title: '#TestRun' })
  ok('saveDraft', { key: d.key, step: 4, patch: { story: 'A friendly 5K through the park for a good cause.', photos: ['/photos/dog-dad/img1.jpg'], category: 'Animals', nonprofitId: 'aspca', date: 'Dec 20, 2026', start: '9:00 AM', end: '12:00 PM', location: 'Central Park, NY', guidelinesAccepted: true, ...over } })
  return d.key
}

beforeEach(() => { e = createEngine(buildSeed(NOW)) })

describe('seed', () => {
  it('reuses the existing events, nonprofits and demo accounts', () => {
    const s = S()
    expect(Object.keys(s.nonprofits)).toHaveLength(20)
    for (const k of ['neon-night', 'give-now', 'golf-outing', 'dog-dad', 'breakneck-ridge-run']) expect(s.events[k].status).toBe('Live')
    expect(Object.values(s.users).filter((u) => u.role === 'np_admin')).toHaveLength(20)
    expect(Object.values(s.users).filter((u) => u.role === 'se').map((u) => u.name)).toEqual(['Mike Rivera', 'Jordan Blake', 'Sam Okonkwo', 'Priya Desai'])
    expect(s.users.u_admin.name).toBe('Alex Mercer')
  })
  it('covers every lifecycle state for demos', () => {
    const st = new Set(Object.values(S().events).map((x) => x.status))
    for (const x of ['Draft', 'Submitted', 'Changes Requested', 'Rejected', 'Live']) expect(st.has(x)).toBe(true)
  })
  it('has one event running right now', () => {
    expect(timing(S(), ev('river-cleanup'))).toBe('live')
    expect(feed(S())[0].key).toBe('river-cleanup')
  })
})

describe('identity (F01)', () => {
  it('SE signs up, is signed in, and cannot reuse the email', () => {
    const u = ok('signUpSE', { name: 'Riley Quinn', email: 'riley@example.com', password: 'longenough1' })
    expect(u.role).toBe('se'); expect(currentUser(S()).id).toBe(u.id)
    ok('signOut')
    bad('signUpSE', { name: 'Riley Q', email: 'RILEY@example.com', password: 'longenough1' }, 'email_taken')
  })
  it('refuses any role but SE at sign-up, and weak or invalid input', () => {
    bad('signUpSE', { name: 'X Y', email: 'x@y.co', password: 'longenough1', role: 'np_admin' }, 'role_not_allowed')
    bad('signUpSE', { name: 'X Y', email: 'x@y.co', password: 'short' }, 'weak_password')
    bad('signUpSE', { name: 'X Y', email: 'nope', password: 'longenough1' }, 'invalid_email')
  })
  it('routes each role home and rejects bad credentials', () => {
    expect(as('mike.rivera@demo.charityhub.com').home).toBe('/se')
    ok('signOut'); expect(as('unitedway@charityhub.com').home).toBe('/np')
    ok('signOut'); expect(as('alex.mercer@charityhub.com').home).toBe('/admin')
    ok('signOut')
    bad('signIn', { email: 'nobody@x.co', password: 'Passw0rd!' }, 'invalid_credentials')
    bad('signIn', { email: 'mike.rivera@demo.charityhub.com', password: 'short' }, 'invalid_credentials')
  })
  it('locks an account after five wrong passwords', () => {
    ok('signUpSE', { name: 'Lock Me', email: 'lock@example.com', password: 'rightpassword' }); ok('signOut')
    for (let i = 0; i < 5; i++) bad('signIn', { email: 'lock@example.com', password: 'wrongpassword' }, 'invalid_credentials')
    bad('signIn', { email: 'lock@example.com', password: 'rightpassword' }, 'account_locked')
  })
  it('Google: new → SE, passwordless guest/SE ok, NP admin / admin / password accounts refused', () => {
    expect(ok('googleSignIn', { email: 'new.person@gmail.com', name: 'New Person' }).created).toBe(true); ok('signOut')
    ok('googleSignIn', { email: 'mike.rivera@demo.charityhub.com', name: 'Mike' }); ok('signOut')
    bad('googleSignIn', { email: 'unitedway@charityhub.com', name: 'x' }, 'google_not_allowed')
    bad('googleSignIn', { email: 'alex.mercer@charityhub.com', name: 'x' }, 'google_not_allowed')
  })
  it('identity gate: email required, creates a guest lead, remembers the action; accounts must sign in', () => {
    bad('gateIdentify', { email: 'bad' }, 'invalid_email')
    const { user, pending } = ok('gateIdentify', { email: 'sofia@example.com', phone: '201-555-0100', pending: { type: 'join', eventKey: 'dog-dad' } })
    expect(user.role).toBe('guest_lead'); expect(pending.type).toBe('join')
    expect(ok('takePending')).toEqual({ type: 'join', eventKey: 'dog-dad' }); expect(ok('takePending')).toBeNull()
    ok('signOut')
    expect(ok('gateIdentify', { email: 'SOFIA@example.com' }).user.id).toBe(user.id) // reuse, no duplicate
    ok('signOut')
    bad('gateIdentify', { email: 'mike.rivera@demo.charityhub.com' }, 'email_belongs_to_account')
    bad('signIn', { email: 'sofia@example.com', password: 'Passw0rd!' }, 'guest_no_password')
  })
})

describe('event lifecycle: SE → nonprofit → live (F04–F06)', () => {
  it('walks the whole happy path across roles, with notifications and totals', () => {
    as('mike.rivera@demo.charityhub.com')
    const key = readyDraft()
    expect(ev(key).status).toBe('Draft')
    expect(ok('submitEvent', { key }).outcome).toBe('submitted')
    expect(ev(key).status).toBe('Submitted')
    ok('signOut')

    as('aspca@charityhub.com')
    expect(S().notifications.some((n) => n.userId === 'u_np_aspca' && n.type === 'approval_requested' && n.body.includes('#TestRun'))).toBe(true)
    ok('approveEvent', { key })
    expect(ev(key).status).toBe('Live')
    ok('signOut')

    as('mike.rivera@demo.charityhub.com')
    expect(S().notifications.some((n) => n.userId === 'u_mike' && n.type === 'event_approved')).toBe(true)
    ok('signOut')

    ok('gateIdentify', { email: 'donor@example.com' })
    const { ticket } = ok('joinEvent', { eventKey: key })
    expect(eventTotals(S(), key).joined).toBe(1)
    const d = ok('createDonation', { eventKey: key, amountCents: 5000 })
    ok('confirmDonation', { id: d.id, cardLast4: '4242' })
    expect(eventTotals(S(), key)).toMatchObject({ raised: 50, backed: 1, joined: 1 })
    ok('signOut')

    as('mike.rivera@demo.charityhub.com')
    expect(ok('checkIn', { eventKey: key, code: ticket }).backed).toBe(true)
    bad('checkIn', { eventKey: key, code: ticket }, 'already_checked_in')
    ok('postUpdate', { eventKey: key, text: 'Doors open at 8:30!' })
    expect(eventTotals(S(), key).updates).toBe(1)
  })

  it('NP-led events skip approval and go straight to Live', () => {
    as('sierraclub@charityhub.com')
    const d = ok('createDraft', { title: 'Tree Day' })
    expect(ev(d.key).kind).toBe('NP-led'); expect(ev(d.key).nonprofitId).toBe('sierra-club-foundation')
    ok('saveDraft', { key: d.key, patch: { story: 'We are planting two hundred trees along the river.', photos: ['/photos/breakneck-ridge-run/img1.jpg'], date: 'Dec 20, 2026', start: '9:00 AM', end: '1:00 PM', location: 'Piermont, NY', guidelinesAccepted: true } })
    expect(ok('submitEvent', { key: d.key }).outcome).toBe('live')
    expect(ev(d.key).status).toBe('Live')
  })

  it('submit validation: photos, guidelines, nonprofit, details, suspended nonprofit', () => {
    as('mike.rivera@demo.charityhub.com')
    const k = readyDraft({ photos: [] }); bad('submitEvent', { key: k }, 'photos_required')
    ok('saveDraft', { key: k, patch: { photos: ['/photos/dog-dad/img1.jpg'], guidelinesAccepted: false } }); bad('submitEvent', { key: k }, 'guidelines_required')
    ok('saveDraft', { key: k, patch: { guidelinesAccepted: true, nonprofitId: '' } }); bad('submitEvent', { key: k }, 'nonprofit_required')
    ok('saveDraft', { key: k, patch: { nonprofitId: 'aspca', location: '' } }); bad('submitEvent', { key: k }, 'details_required')
    ok('saveDraft', { key: k, patch: { location: 'Central Park' } })
    ok('signOut'); as('alex.mercer@charityhub.com'); ok('adminSuspendNonprofit', { npId: 'aspca' }); ok('signOut')
    as('mike.rivera@demo.charityhub.com'); bad('submitEvent', { key: k }, 'nonprofit_unavailable')
  })

  it('reject → edit & resubmit; request changes locks unflagged areas', () => {
    as('priya.desai@demo.charityhub.com')
    // seeded rejected event: editing moves it back to Draft, keeping the last rejection
    const rej = 'karaoke-for-kids'
    ok('saveDraft', { key: rej, patch: { story: 'Sing loud for a good cause. Doors open at 6:30 and every song earns a vote.' } })
    expect(ev(rej).status).toBe('Draft'); expect(ev(rej).review.decision).toBe('rejected')
    ok('saveDraft', { key: rej, patch: { photos: ['/photos/neon-night/img1.jpg'], guidelinesAccepted: true } })
    expect(ok('submitEvent', { key: rej }).outcome).toBe('submitted')
    ok('signOut')

    as('stjude@charityhub.com')
    ok('requestChanges', { key: rej, areas: ['Photos'], feedback: 'Please add a clearer venue photo.' })
    ok('signOut')
    as('priya.desai@demo.charityhub.com')
    bad('saveDraft', { key: rej, patch: { story: 'changed' } }, 'step_locked')
    ok('saveDraft', { key: rej, patch: { photos: ['/photos/neon-night/img2.jpg'] } })
    expect(ok('submitEvent', { key: rej }).outcome).toBe('submitted')
    expect(ev(rej).status).toBe('Submitted')
  })

  it('approval is limited to the beneficiary nonprofit; reasons and areas are required', () => {
    as('unitedway@charityhub.com')
    bad('approveEvent', { key: 'paws-in-the-park' }, 'forbidden') // ASPCA's event
    ok('signOut'); as('aspca@charityhub.com')
    bad('rejectEvent', { key: 'paws-in-the-park', reason: '  ' }, 'reason_required')
    bad('requestChanges', { key: 'paws-in-the-park', areas: ['Nope'], feedback: 'x' }, 'areas_required')
    bad('requestChanges', { key: 'paws-in-the-park', areas: ['Story'], feedback: '' }, 'feedback_required')
    ok('rejectEvent', { key: 'paws-in-the-park', reason: 'We cannot staff that date.' })
    expect(ev('paws-in-the-park').status).toBe('Rejected')
    bad('approveEvent', { key: 'paws-in-the-park' }, 'invalid_state')
    ok('signOut'); as('mike.rivera@demo.charityhub.com'); bad('approveEvent', { key: 'paws-in-the-park' }, 'forbidden')
  })

  it('reporting an event puts a high-priority item in the admin queue', () => {
    as('aspca@charityhub.com')
    ok('reportEvent', { key: 'paws-in-the-park', reason: 'Venue looks unsafe.' })
    ok('signOut'); as('alex.mercer@charityhub.com')
    expect(S().reviewItems[0]).toMatchObject({ type: 'Event report', priority: 'High', status: 'New' })
  })

  it('autopilot approves a trusted SE automatically; others still queue', () => {
    as('aspca@charityhub.com')
    ok('npSetAutopilot', { enabled: true, trustedSeIds: ['u_mike'] }); ok('signOut')
    as('mike.rivera@demo.charityhub.com')
    const k = readyDraft({ story: 'A long enough story so every autopilot check passes cleanly.' })
    expect(ok('submitEvent', { key: k }).outcome).toBe('auto_approved'); expect(ev(k).status).toBe('Live')
    ok('signOut'); as('jordan.blake@demo.charityhub.com')
    const k2 = readyDraft({ story: 'A long enough story so every autopilot check passes cleanly.' })
    expect(ok('submitEvent', { key: k2 }).outcome).toBe('submitted')
  })

  it('delete / clone / locked rules', () => {
    as('mike.rivera@demo.charityhub.com')
    bad('deleteEvent', { key: 'neon-night' }, 'event_locked') // Live
    ok('deleteEvent', { key: 'spring-sprint' })
    bad('cloneEvent', { key: 'spring-sprint' }, 'not_found')
    const copy = ok('cloneEvent', { key: 'neon-night' }); expect(copy.status).toBe('Draft'); expect(copy.key).toBe('neonnight')
    ok('signOut'); as('jordan.blake@demo.charityhub.com')
    bad('deleteEvent', { key: copy.key }, 'forbidden'); bad('cloneEvent', { key: 'neon-night' }, 'forbidden')
    bad('saveDraft', { key: 'neon-night', patch: { story: 'x' } }, 'forbidden')
    ok('signOut'); as('mike.rivera@demo.charityhub.com')
    bad('saveDraft', { key: 'neon-night', patch: { story: 'x' } }, 'event_locked')
  })
  it('keys stay unique, including against deleted events', () => {
    as('mike.rivera@demo.charityhub.com')
    const a = ok('createDraft', { title: '#Same' }), b = ok('createDraft', { title: '#Same' })
    ok('deleteEvent', { key: a.key })
    const c = ok('createDraft', { title: '#Same' })
    expect([a.key, b.key, c.key]).toEqual(['same', 'same-2', 'same-3'])
    expect(ok('createDraft', {}).title).toBe('#Event')
  })
})

describe('visibility (F02)', () => {
  const v = (key, email) => { ok('signOut'); if (email) as(email); return visibility(S(), ev(key), currentUser(S())) }
  it('hides private work and shows approval review to the right people', () => {
    expect(v('spring-sprint')).toBe('hidden') // draft, anonymous
    expect(v('spring-sprint', 'mike.rivera@demo.charityhub.com')).toBe('full')
    expect(v('paws-in-the-park', 'aspca@charityhub.com')).toBe('full') // submitted: beneficiary sees it
    expect(v('paws-in-the-park', 'unitedway@charityhub.com')).toBe('hidden')
    expect(v('paws-in-the-park')).toBe('hidden')
    expect(v('paws-in-the-park', 'alex.mercer@charityhub.com')).toBe('full')
  })
  it('blocked is unavailable to the public, full to the organizer; archived is readable but off the feed', () => {
    as('alex.mercer@charityhub.com'); ok('blockEvent', { key: 'neon-night', reason: 'Safety review', mode: 'hold' })
    expect(v('neon-night')).toBe('unavailable')
    expect(v('neon-night', 'mike.rivera@demo.charityhub.com')).toBe('full')
    expect(feed(S()).some((x) => x.key === 'neon-night')).toBe(false)
    ok('signOut'); as('alex.mercer@charityhub.com'); ok('restoreEvent', { key: 'neon-night' })
    S().events['golf-outing'].status = 'Archived'
    expect(v('golf-outing')).toBe('full'); expect(feed(S()).some((x) => x.key === 'golf-outing')).toBe(false)
  })
})

describe('participation (F07)', () => {
  it('join needs sign-in and a live event; joining twice keeps the count; leaving reverses', () => {
    bad('joinEvent', { eventKey: 'dog-dad' }, 'unauthenticated')
    ok('gateIdentify', { email: 'p@example.com' })
    bad('joinEvent', { eventKey: 'paws-in-the-park' }, 'event_not_live')
    const before = eventTotals(S(), 'dog-dad').joined
    ok('joinEvent', { eventKey: 'dog-dad' }); ok('joinEvent', { eventKey: 'dog-dad' })
    expect(eventTotals(S(), 'dog-dad').joined).toBe(before + 1)
    ok('leaveEvent', { eventKey: 'dog-dad' }); expect(eventTotals(S(), 'dog-dad').joined).toBe(before)
  })
  it('posts, replies, likes and chat enforce auth, empties and closed events', () => {
    bad('createPost', { eventKey: 'dog-dad', text: 'hi' }, 'unauthenticated')
    ok('gateIdentify', { email: 'c@example.com' })
    bad('createPost', { eventKey: 'dog-dad', text: '   ' }, 'empty_post')
    const p = ok('createPost', { eventKey: 'dog-dad', text: 'Cannot wait!' })
    ok('replyToPost', { postId: p.id, text: 'Same!' }); bad('replyToPost', { postId: 'nope', text: 'x' }, 'not_found')
    expect(ok('toggleLike', { postId: p.id }).liked).toBe(true); expect(ok('toggleLike', { postId: p.id }).liked).toBe(false)
    bad('sendChat', { eventKey: 'dog-dad', text: '' }, 'empty_message')
    expect(ok('sendChat', { eventKey: 'dog-dad', text: 'hello' }).text).toBe('hello')
    expect(ok('sendChat', { eventKey: 'dog-dad', text: ' ', mediaUrl: '/photos/dog-dad/img1.jpg' }).text).toBe('')
    ok('signOut'); as('alex.mercer@charityhub.com'); ok('blockEvent', { key: 'dog-dad', reason: 'x' }); ok('signOut')
    ok('gateIdentify', { email: 'c@example.com' })
    bad('sendChat', { eventKey: 'dog-dad', text: 'hi' }, 'event_blocked'); bad('createPost', { eventKey: 'dog-dad', text: 'hi' }, 'event_blocked')
  })
  it('only the organizer or beneficiary staff post updates', () => {
    as('jordan.blake@demo.charityhub.com'); bad('postUpdate', { eventKey: 'neon-night', text: 'x' }, 'forbidden'); ok('signOut')
    as('unitedway@charityhub.com'); ok('postUpdate', { eventKey: 'neon-night', text: 'Thank you all!' }) // beneficiary
    ok('signOut'); as('aspca@charityhub.com'); bad('postUpdate', { eventKey: 'neon-night', text: 'x' }, 'forbidden')
  })
  it('following a nonprofit and saving an event need an identity and toggle', () => {
    bad('toggleFollowNonprofit', { nonprofitId: 'aspca' }, 'unauthenticated')
    ok('gateIdentify', { email: 'f@example.com' })
    expect(ok('toggleFollowNonprofit', { nonprofitId: 'aspca' }).following).toBe(true)
    expect(ok('toggleFollowNonprofit', { nonprofitId: 'aspca' }).following).toBe(false)
    expect(ok('toggleSaveEvent', { eventKey: 'dog-dad' }).saved).toBe(true)
  })
})

describe('donations (F09)', () => {
  beforeEach(() => ok('gateIdentify', { email: 'donor@example.com', name: 'Dana Donor' }))
  it('quotes, validates the amount range and confirms with a receipt and notifications', () => {
    expect(quote(5000)).toMatchObject({ feeCents: 175, totalCents: 5175 })
    bad('createDonation', { eventKey: 'dog-dad', amountCents: 99 }, 'invalid_amount')
    bad('createDonation', { eventKey: 'dog-dad', amountCents: 1_000_100 }, 'invalid_amount')
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 })
    expect(d.status).toBe('Initiated')
    const c = ok('confirmDonation', { id: d.id }); expect(c.status).toBe('Successful'); expect(c.receiptNo).toMatch(/^CH-/)
    expect(S().notifications.some((n) => n.userId === 'u_np_aspca' && n.type === 'donation_received')).toBe(true)
    expect(S().notifications.some((n) => n.userId === 'u_mike' && n.type === 'donation_received')).toBe(true)
  })
  it('a declined card (…0002) keeps the donation open, and retrying reuses it', () => {
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 })
    bad('confirmDonation', { id: d.id, cardLast4: '0002' }, 'card_declined')
    expect(S().donations.find((x) => x.id === d.id).status).toBe('Initiated')
    expect(ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 }).id).toBe(d.id)
    expect(ok('createDonation', { eventKey: 'dog-dad', amountCents: 3000 }).id).not.toBe(d.id)
    expect(ok('confirmDonation', { id: d.id, cardLast4: '4242' }).status).toBe('Successful')
  })
  it('refuses closed, blocked, unsettled and unavailable beneficiaries; hides others’ donations', () => {
    bad('createDonation', { eventKey: 'paws-in-the-park', amountCents: 2500 }, 'event_not_live')
    expect(ok('createDonation', { eventKey: 'river-cleanup', amountCents: 2500 }).status).toBe('Initiated') // Sierra Club is settlement-ready
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 })
    ok('signOut'); ok('gateIdentify', { email: 'someone.else@example.com' })
    bad('confirmDonation', { id: d.id }, 'not_found')
    ok('signOut'); as('alex.mercer@charityhub.com')
    S().nonprofits.aspca.settlement = 'Not ready'; e.reset(S()) // simulate Stripe not finished
    ok('signOut'); ok('gateIdentify', { email: 'donor@example.com' })
    bad('createDonation', { eventKey: 'dog-dad', amountCents: 5000 }, 'settlement_unavailable')
  })
})

describe('admin controls (F05, F09, F12)', () => {
  it('block with refund returns donations, notifies, audits and can be restored', () => {
    ok('gateIdentify', { email: 'r@example.com' })
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 4000 }); ok('confirmDonation', { id: d.id })
    ok('signOut'); as('alex.mercer@charityhub.com')
    bad('blockEvent', { key: 'dog-dad', reason: '', mode: 'hold' }, 'reason_required')
    ok('blockEvent', { key: 'dog-dad', reason: 'Policy violation', mode: 'refund' })
    expect(S().donations.find((x) => x.id === d.id).status).toBe('Refunded')
    expect(S().notifications.some((n) => n.type === 'donation_refunded')).toBe(true)
    expect(S().audit[0]).toMatchObject({ category: 'Events', actor: 'Alex Mercer' })
    expect(eventTotals(S(), 'dog-dad').raised).toBe(S().events['dog-dad'].baseRaised) // refund reverses the total
    ok('restoreEvent', { key: 'dog-dad' }); expect(ev('dog-dad').status).toBe('Live')
    bad('restoreEvent', { key: 'dog-dad' }, 'invalid_state')
  })
  it('admin actions are admin-only', () => {
    as('mike.rivera@demo.charityhub.com')
    for (const [t, p] of [['blockEvent', { key: 'neon-night', reason: 'x' }], ['runLifecycle', {}], ['adminVerifyNonprofit', { npId: 'aspca' }], ['reviewDecision', { id: 'rv_2041', status: 'Approved' }]]) bad(t, p, 'forbidden')
    ok('signOut'); bad('runLifecycle', {}, 'unauthenticated')
  })
  it('lifecycle job completes ended events, archives after 30 days, fails stale payments', () => {
    ok('gateIdentify', { email: 'late@example.com' })
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 })
    ok('signOut'); as('alex.mercer@charityhub.com')
    ok('advanceClock', { days: 2 })
    const r1 = ok('runLifecycle'); expect(r1.completed).toBeGreaterThanOrEqual(3); expect(r1.failedPayments).toBe(1)
    expect(S().donations.find((x) => x.id === d.id).status).toBe('Failed')
    expect(ev('neon-night').status).toBe('Completed')
    ok('advanceClock', { days: 31 })
    expect(ok('runLifecycle').archived).toBeGreaterThanOrEqual(3); expect(ev('neon-night').status).toBe('Archived')
    bad('setClock', { iso: 'nope' }, 'invalid_date')
  })
  it('dispute raises an exception; exceptions move open → escalated → resolved → reopened', () => {
    ok('gateIdentify', { email: 'x@example.com' })
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 }); ok('confirmDonation', { id: d.id })
    ok('signOut'); as('alex.mercer@charityhub.com')
    ok('disputeDonation', { id: d.id })
    const x = S().exceptions[0]; expect(x.type).toBe('Dispute')
    ok('exceptionAction', { id: x.id, action: 'escalate' }); bad('exceptionAction', { id: x.id, action: 'escalate' }, 'invalid_state')
    ok('exceptionAction', { id: x.id, action: 'resolve' }); ok('exceptionAction', { id: x.id, action: 'reopen' })
    expect(S().exceptions.find((y) => y.id === x.id).status).toBe('Open')
  })
  it('review items cannot be re-decided once closed', () => {
    as('alex.mercer@charityhub.com')
    ok('reviewDecision', { id: 'rv_2042', status: 'Approved' }); bad('reviewDecision', { id: 'rv_2042', status: 'Rejected' }, 'invalid_state')
    expect(S().audit[0].category).toBe('Approval')
  })
  it('moderation: flag → hide / remove / dismiss, audited under Moderation', () => {
    ok('gateIdentify', { email: 'm@example.com' })
    const p = ok('createPost', { eventKey: 'dog-dad', text: 'Spammy post' })
    bad('flagContent', { kind: 'post', id: p.id, eventKey: 'dog-dad', reason: '' }, 'reason_required')
    ok('flagContent', { kind: 'post', id: p.id, eventKey: 'dog-dad', reason: 'Spam' }); bad('flagContent', { kind: 'post', id: p.id, eventKey: 'dog-dad', reason: 'Spam' }, 'already_flagged')
    ok('signOut'); as('alex.mercer@charityhub.com')
    expect(adminMetrics(S()).flaggedContent).toBe(1)
    ok('moderateContent', { kind: 'post', id: p.id, eventKey: 'dog-dad', decision: 'remove' })
    expect(S().posts.find((x) => x.id === p.id)).toMatchObject({ hidden: true, removed: true }); expect(adminMetrics(S()).flaggedContent).toBe(0)
    expect(S().audit[0].category).toBe('Moderation')
  })
  it('privacy deletion anonymizes the person but keeps financial records', () => {
    ok('gateIdentify', { email: 'gone@example.com', name: 'Gone Person' })
    const uid = currentUser(S()).id
    const d = ok('createDonation', { eventKey: 'dog-dad', amountCents: 2500 }); ok('confirmDonation', { id: d.id })
    ok('signOut'); as('alex.mercer@charityhub.com')
    bad('anonymizeUser', { userId: 'u_admin' }, 'forbidden')
    ok('anonymizeUser', { userId: uid })
    expect(S().users[uid]).toMatchObject({ name: 'Deleted user', status: 'anonymized' })
    expect(S().donations.find((x) => x.id === d.id).status).toBe('Successful')
    ok('signOut'); bad('signIn', { email: 'gone@example.com', password: 'Passw0rd!' }, 'invalid_credentials')
  })
})

describe('nonprofit onboarding and verification (F03)', () => {
  it('invite → accept → upload documents → connect Stripe → admin approves docs → verify', () => {
    // admin invites a brand new nonprofit
    as('alex.mercer@charityhub.com')
    bad('adminInviteNonprofit', { name: 'United Way', category: 'Community' }, 'duplicate_name')
    bad('adminInviteNonprofit', { name: 'Harbor Kids', category: 'Community', ein: '123' }, 'invalid_ein')
    const np = ok('adminInviteNonprofit', { name: 'Harbor Kids', category: 'Human Services', ein: '12-3456789', email: 'admin@harborkids.org' })
    const token = np.invite.token
    ok('signOut')

    bad('acceptInvite', { token: 'nope', name: 'Pat', password: 'longenough1' }, 'invite_not_found')
    bad('acceptInvite', { token, name: 'P', password: 'longenough1' }, 'invalid_name')
    bad('acceptInvite', { token, name: 'Pat Lee', password: 'short' }, 'weak_password')
    const { user } = ok('acceptInvite', { token, name: 'Pat Lee', password: 'longenough1' })
    expect(user.role).toBe('np_admin'); expect(S().reviewItems[0].type).toBe('Nonprofit Verification')
    ok('signOut'); bad('acceptInvite', { token, name: 'Pat Lee', password: 'longenough1' }, 'invite_expired') // single use

    ok('signIn', { email: 'admin@harborkids.org', password: 'longenough1' })
    bad('npUploadDocument', { type: 'irs', fileName: 'letter.exe' }, 'invalid_file')
    bad('npUploadDocument', { type: 'nope', fileName: 'a.pdf' }, 'invalid_document_type')
    expect(npSetupSteps(S().nonprofits['harbor-kids']).filter((s) => s.done)).toHaveLength(1) // password only
    ;['irs', 'w9', 'authority'].forEach((t) => ok('npUploadDocument', { type: t, fileName: `${t}.pdf` }))
    ok('npConnectStripe', { mode: 'create' }); expect(S().nonprofits['harbor-kids'].stripe.state).toBe('incomplete')
    ok('npStripeCallback', { success: true }); expect(S().nonprofits['harbor-kids'].stripe.state).toBe('connected')
    ok('signOut')

    as('alex.mercer@charityhub.com')
    bad('adminVerifyNonprofit', { npId: 'harbor-kids' }, 'documents_incomplete')
    ok('adminDocumentDecision', { npId: 'harbor-kids', docId: 'irs', decision: 'approve' })
    bad('adminDocumentDecision', { npId: 'harbor-kids', docId: 'w9', decision: 'reupload', note: '' }, 'note_required')
    ok('adminDocumentDecision', { npId: 'harbor-kids', docId: 'w9', decision: 'reupload', note: 'Page 2 is missing' })
    ok('adminDocumentDecision', { npId: 'harbor-kids', docId: 'authority', decision: 'approve' })
    ok('signOut'); ok('signIn', { email: 'admin@harborkids.org', password: 'longenough1' }); ok('npUploadDocument', { type: 'w9', fileName: 'w9-full.pdf' }); ok('signOut')
    as('alex.mercer@charityhub.com')
    ok('adminDocumentDecision', { npId: 'harbor-kids', docId: 'w9', decision: 'approve' })
    ok('adminRerunEin', { npId: 'harbor-kids' })
    ok('adminVerifyNonprofit', { npId: 'harbor-kids' })
    const done = S().nonprofits['harbor-kids']
    expect(done).toMatchObject({ status: 'Active', verified: true, settlement: 'Ready' })
    expect(S().audit.slice(0, 3).every((a) => a.category === 'Verification')).toBe(true)
  })
  it('the seeded invited nonprofit can accept its demo invite; the seeded pending one can be verified', () => {
    ok('acceptInvite', { token: 'invite-msf-demo', name: 'Marie Dupont', password: 'longenough1' })
    expect(S().nonprofits['doctors-without-borders-usa'].status).toBe('Pending'); ok('signOut')
    as('alex.mercer@charityhub.com')
    expect(S().nonprofits['world-wildlife-fund-wwf-us'].status).toBe('Pending')
    ;['irs', 'w9', 'authority'].forEach((id) => ok('adminDocumentDecision', { npId: 'world-wildlife-fund-wwf-us', docId: id, decision: 'approve' }))
    ok('adminVerifyNonprofit', { npId: 'world-wildlife-fund-wwf-us' })
    expect(S().reviewItems.find((r) => r.id === 'rv_2041').status).toBe('Approved')
  })
  it('suspend blocks live events with money held; reinstate restores them; reject is final-ish', () => {
    as('alex.mercer@charityhub.com')
    ok('adminSuspendNonprofit', { npId: 'aspca' })
    expect(ev('dog-dad')).toMatchObject({ status: 'Blocked' }); expect(S().nonprofits.aspca.settlement).toBe('Not ready')
    bad('adminSuspendNonprofit', { npId: 'aspca' }, 'invalid_state')
    ok('adminReinstateNonprofit', { npId: 'aspca' }); expect(ev('dog-dad').status).toBe('Live')
    ok('adminRejectNonprofit', { npId: 'goodwill', reason: 'EIN mismatch' }); expect(S().nonprofits.goodwill.status).toBe('Rejected')
  })
  it('invite re-issue replaces the link (old link is gone)', () => {
    as('alex.mercer@charityhub.com')
    const old = S().nonprofits['doctors-without-borders-usa'].invite.token
    const fresh = ok('adminIssueInvite', { npId: 'doctors-without-borders-usa', email: 'msf@charityhub.com' })
    ok('signOut'); bad('acceptInvite', { token: old, name: 'Marie D', password: 'longenough1' }, 'invite_expired')
    ok('acceptInvite', { token: fresh.token, name: 'Marie D', password: 'longenough1' })
  })
  it('NP admins can only touch their own nonprofit and edit its profile', () => {
    as('aspca@charityhub.com')
    bad('npUploadDocument', { type: 'irs', fileName: 'x' }, 'invalid_file')
    bad('npUpdateProfile', { mission: 'short' }, 'invalid_mission')
    ok('npUpdateProfile', { mission: 'We rescue animals and find them loving homes.', story: 'Since 1866.' })
    expect(S().nonprofits.aspca.mission).toContain('rescue animals')
    ok('signOut'); as('mike.rivera@demo.charityhub.com'); bad('npUpdateProfile', { mission: 'We rescue animals everywhere.' }, 'forbidden')
  })
})

describe('check-in (F14)', () => {
  it('scan, duplicate, unknown, walk-in, and access control', () => {
    ok('gateIdentify', { email: 'att@example.com', name: 'Alex Attendee' })
    const { ticket } = ok('joinEvent', { eventKey: 'dog-dad' }); ok('signOut')
    as('jordan.blake@demo.charityhub.com'); bad('checkIn', { eventKey: 'dog-dad', code: ticket }, 'forbidden'); ok('signOut')
    as('mike.rivera@demo.charityhub.com')
    bad('checkIn', { eventKey: 'dog-dad', code: '' }, 'code_required'); bad('checkIn', { eventKey: 'dog-dad', code: 'CH-NOPE-0000' }, 'ticket_not_found')
    expect(ok('checkIn', { eventKey: 'dog-dad', code: ticket.toLowerCase() }).name).toBe('Alex Attendee')
    bad('walkIn', { eventKey: 'dog-dad', name: ' ' }, 'name_required')
    ok('walkIn', { eventKey: 'dog-dad', name: 'Walk In', backed: true }); expect(ev('dog-dad').checkins).toHaveLength(2)
  })
})

describe('notifications (F15)', () => {
  it('lists own notifications, marks read, hides others', () => {
    as('aspca@charityhub.com')
    const n = S().notifications.find((x) => x.userId === 'u_np_aspca' && !x.read)
    ok('markNotificationRead', { id: n.id }); expect(S().notifications.find((x) => x.id === n.id).read).toBe(true)
    ok('signOut'); as('sam.okonkwo@demo.charityhub.com')
    bad('markNotificationRead', { id: n.id }, 'not_found')
    ok('markAllNotificationsRead'); expect(S().notifications.filter((x) => x.userId === 'u_sam').every((x) => x.read)).toBe(true)
  })
})

describe('derived views', () => {
  it('leaderboard ranks people going, not money; admin metrics are consistent', () => {
    const lb = leaderboard(S())
    expect(lb[0].event.key).toBe('neon-night')
    expect(lb.map((r) => r.going)).toEqual([...lb.map((r) => r.going)].sort((a, b) => b - a))
    const m = adminMetrics(S())
    expect(m.pendingReviews).toBe(2); expect(m.nonprofitsToVerify).toBe(1); expect(m.openExceptions).toBe(1)
  })
  it('persistence round-trips', () => {
    const copy = JSON.parse(JSON.stringify(S()))
    expect(createEngine(copy).getState().events['neon-night'].title).toBe('#NeonNight')
  })
})
