import { describe, it, expect, beforeEach } from 'vitest'
import { createEngine } from './engine.js'
import { buildSeed } from './seed.js'
import { feed, leaderboard, liveEvents, seEvents, npQueue, adminMetrics } from './selectors.js'

const NOW = '2026-11-18T12:00:00.000Z'
let e
const run = (t, p) => e.dispatch(t, p)
const ok = (t, p) => { const r = run(t, p); expect(r.ok, `${t}: ${r.error?.code} ${r.error?.message}`).toBe(true); return r.data }
const bad = (t, p, code) => { const r = run(t, p); expect(r.ok, `${t} should fail`).toBe(false); if (code) expect(r.error.code).toBe(code); return r.error }
const as = (email) => ok('signIn', { email, password: 'Passw0rd!' })
const S = () => e.getState()
beforeEach(() => { e = createEngine(buildSeed(NOW)) })

describe('archive and restore', () => {
  it('archives a closed event (live but past its end, or completed) and restores it', () => {
    as('mike.rivera@demo.charityhub.com')
    expect(S().events['neon-night'].status).toBe('Live') // Nov 14 ended, still marked Live
    ok('archiveEvent', { key: 'neon-night' })
    expect(S().events['neon-night']).toMatchObject({ status: 'Archived' })
    expect(S().events['neon-night'].archivedAt).toBeTruthy()
    ok('unarchiveEvent', { key: 'neon-night' })
    expect(S().events['neon-night']).toMatchObject({ status: 'Completed', archivedAt: null })
  })
  it('refuses events that have not closed, drafts, other people’s events and double archiving', () => {
    as('mike.rivera@demo.charityhub.com')
    bad('archiveEvent', { key: 'dog-dad' }, 'invalid_state')      // still to come
    bad('archiveEvent', { key: 'spring-sprint' }, 'invalid_state') // draft
    bad('unarchiveEvent', { key: 'neon-night' }, 'invalid_state')  // not archived
    ok('archiveEvent', { key: 'neon-night' }); bad('archiveEvent', { key: 'neon-night' }, 'invalid_state')
    ok('signOut'); as('jordan.blake@demo.charityhub.com')
    bad('archiveEvent', { key: 'golf-outing' }, 'forbidden')
    bad('unarchiveEvent', { key: 'neon-night' }, 'forbidden')
    ok('signOut'); bad('archiveEvent', { key: 'golf-outing' }, 'unauthenticated')
  })
  it('an archived event is read-only for posts but still readable', () => {
    as('mike.rivera@demo.charityhub.com'); ok('archiveEvent', { key: 'golf-outing' })
    bad('postUpdate', { eventKey: 'golf-outing', text: 'x' }, 'event_archived')
    expect(feed(S()).some((x) => x.key === 'golf-outing')).toBe(false)
  })
})

describe('bulk actions', () => {
  it('applies to every eligible event in one commit and reports the ones it skipped with the reason', () => {
    as('mike.rivera@demo.charityhub.com')
    const r = ok('bulkEvents', { action: 'archive', keys: ['neon-night', 'golf-outing', 'dog-dad', 'no-such-event'] })
    expect(r.done).toBe(2)
    expect(r.skipped.map((x) => x.key).sort()).toEqual(['dog-dad', 'no-such-event'])
    expect(r.skipped.find((x) => x.key === 'dog-dad').reason).toMatch(/closed/i)
    expect(S().events['neon-night'].status).toBe('Archived'); expect(S().events['dog-dad'].status).toBe('Live')
  })
  it('deletes only drafts and rejected events, and duplicates anything', () => {
    as('mike.rivera@demo.charityhub.com')
    const del = ok('bulkEvents', { action: 'delete', keys: ['spring-sprint', 'neon-night'] })
    expect(del.done).toBe(1); expect(del.skipped[0].key).toBe('neon-night')
    const dup = ok('bulkEvents', { action: 'duplicate', keys: ['neon-night', 'golf-outing'] })
    expect(dup.done).toBe(2)
    expect(seEvents(S(), 'u_mike').filter((x) => x.status === 'Draft').length).toBe(2)
  })
  it('refuses unknown actions and anonymous callers; an unauthorized event is skipped, not applied', () => {
    bad('bulkEvents', { action: 'archive', keys: [] }, 'unauthenticated')
    as('jordan.blake@demo.charityhub.com')
    bad('bulkEvents', { action: 'explode', keys: [] }, 'invalid_action')
    const r = ok('bulkEvents', { action: 'archive', keys: ['neon-night'] })
    expect(r.done).toBe(0); expect(r.skipped[0].reason).toMatch(/your own/i)
    expect(S().events['neon-night'].status).toBe('Live')
  })
})

describe('sample events (demo tools)', () => {
  it('generates the requested number across every status, all owned by the caller', () => {
    as('mike.rivera@demo.charityhub.com')
    expect(ok('demoGenerateEvents', { count: 1000 }).added).toBe(1000)
    const mine = seEvents(S(), 'u_mike')
    expect(mine.filter((x) => x.sample)).toHaveLength(1000)
    const statuses = new Set(mine.filter((x) => x.sample).map((x) => x.status))
    for (const st of ['Draft', 'Submitted', 'Changes Requested', 'Rejected', 'Live', 'Completed', 'Archived']) expect(statuses.has(st), st).toBe(true)
    // unique keys
    expect(new Set(mine.map((x) => x.key)).size).toBe(mine.length)
  })
  it('is deterministic for the same starting point', () => {
    as('mike.rivera@demo.charityhub.com'); ok('demoGenerateEvents', { count: 50 })
    const a = Object.values(S().events).filter((x) => x.sample).map((x) => `${x.title}|${x.status}|${x.date}`)
    const e2 = createEngine(buildSeed(NOW)); e2.dispatch('signIn', { email: 'mike.rivera@demo.charityhub.com', password: 'Passw0rd!' }); e2.dispatch('demoGenerateEvents', { count: 50 })
    const b = Object.values(e2.getState().events).filter((x) => x.sample).map((x) => `${x.title}|${x.status}|${x.date}`)
    expect(a).toEqual(b)
  })
  it('never leaks into public feeds, the leaderboard, other roles’ queues or admin lists, and sends no notifications', () => {
    as('mike.rivera@demo.charityhub.com')
    const feedBefore = feed(S()).length, nBefore = S().notifications.length
    ok('demoGenerateEvents', { count: 300 })
    expect(feed(S())).toHaveLength(feedBefore)
    expect(leaderboard(S())).toHaveLength(feedBefore)
    expect(liveEvents(S()).some((x) => x.sample)).toBe(false)
    expect(Object.keys(S().nonprofits).every((id) => npQueue(S(), id).every((x) => !x.sample))).toBe(true)
    const waiting = seEvents(S(), 'u_mike').find((x) => x.sample && x.status === 'Draft')
    expect(waiting).toBeTruthy()
    // submitting a complete sample draft does not notify a real nonprofit
    Object.assign(S().events[waiting.key], { photoKey: 'dog-dad', photos: ['/photos/dog-dad/img1.jpg'], story: 'A long enough story for the check.', date: 'Dec 20, 2026', start: '9:00 AM', end: '1:00 PM', location: 'Hoboken, NJ', nonprofitId: 'aspca', guidelinesAccepted: true })
    ok('submitEvent', { key: waiting.key })
    expect(S().notifications.length).toBe(nBefore)
    ok('signOut'); as('alex.mercer@charityhub.com')
    expect(adminMetrics(S()).liveEvents).toBe(6)
  })
  it('can be removed again without touching real events', () => {
    as('mike.rivera@demo.charityhub.com'); ok('demoGenerateEvents', { count: 40 })
    expect(ok('demoRemoveGenerated').removed).toBe(40)
    expect(Object.values(S().events).some((x) => x.sample)).toBe(false)
    expect(S().events['neon-night']).toBeTruthy()
  })
  it('only organizers can generate (a guest lead cannot)', () => {
    ok('gateIdentify', { email: 'g@example.com' })
    bad('demoGenerateEvents', { count: 10 }, 'forbidden')
  })
})
