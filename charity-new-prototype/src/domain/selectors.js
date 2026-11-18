// Read-side of the domain: who can see what (F02), feeds, dashboards, admin metrics.
import { ROLES, endsAt, startsAt, eventTotals, isOrganizer, isNpStaffFor, npAdminsOf } from './engine.js'

export const currentUser = (s) => (s.session.userId ? s.users[s.session.userId] ?? null : null)
export const liveEvents = (s) => Object.values(s.events).filter((e) => !e.deletedAt)

/** 'full' | 'unavailable' (blocked, public) | 'hidden' (404, existence not revealed). Mirrors F02 edge cases. */
export function visibility(s, ev, viewer) {
  if (!ev || ev.deletedAt) return 'hidden'
  if (viewer?.role === ROLES.ADMIN) return 'full'
  switch (ev.status) {
    case 'Live': case 'Completed': case 'Archived': return 'full'
    case 'Blocked': return isOrganizer(viewer, ev) || isNpStaffFor(viewer, ev) ? 'full' : 'unavailable'
    case 'Submitted': return isOrganizer(viewer, ev) || isNpStaffFor(viewer, ev) ? 'full' : 'hidden'
    default: return isOrganizer(viewer, ev) ? 'full' : 'hidden' // Draft, Changes Requested, Rejected: the author's private work
  }
}

/** 'upcoming' | 'live' | 'ended' relative to the prototype clock (only meaningful for Live/Completed). */
export function timing(s, ev) {
  const now = new Date(s.now), st = startsAt(ev), en = endsAt(ev)
  if (st && now < st) return 'upcoming'
  if (en && now > en) return 'ended'
  return 'live'
}

/** Public feed: Live (running or upcoming) and Completed events; Archived stays out of the feed. */
export function feed(s, { category = 'All', query = '' } = {}) {
  const q = query.trim().toLowerCase()
  return liveEvents(s)
    .filter((e) => ['Live', 'Completed'].includes(e.status))
    .filter((e) => category === 'All' || e.category === category)
    .filter((e) => !q || [e.title, e.mission, e.location, s.nonprofits[e.nonprofitId]?.name ?? ''].some((f) => (f ?? '').toLowerCase().includes(q)))
    .sort((a, b) => {
      // running first, then upcoming by date, then ended by recency
      const rank = { live: 0, upcoming: 1, ended: 2 }
      const ta = rank[timing(s, a)], tb = rank[timing(s, b)]
      return ta - tb || (startsAt(a) ?? 0) - (startsAt(b) ?? 0)
    })
}

export const photoList = (ev) => (ev.photos?.length ? ev.photos : ev.photoKey ? Array.from({ length: 8 }, (_, i) => `/photos/${ev.photoKey}/img${i + 1}.jpg`) : [])
export const coverOf = (ev) => photoList(ev)[0] ?? ''

export const postsFor = (s, key, { includeHidden = false } = {}) =>
  s.posts.filter((p) => p.eventKey === key && !p.removed && (includeHidden || !p.hidden)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
export const chatFor = (s, key, { includeHidden = false } = {}) => (s.chat[key] ?? []).filter((m) => includeHidden || !m.hidden)
export const authorName = (s, id, fallback = 'Someone') => (id?.startsWith('v_') ? id.slice(2) : s.users[id]?.name ?? fallback)

/** Leaderboard: events ranked by people going (Competition for Good), never by money. */
export function leaderboard(s) {
  return feed(s).map((e) => ({ event: e, going: eventTotals(s, e.key).joined })).sort((a, b) => b.going - a.going)
}

/* ------------------------------------------------------------ SE */
export const seEvents = (s, userId) => liveEvents(s).filter((e) => e.organizerId === userId)
export const seDrafts = (s, userId, statuses = ['Draft', 'Changes Requested', 'Rejected']) => seEvents(s, userId).filter((e) => statuses.includes(e.status))
export function seDashboardEvent(s, userId) {
  const mine = seEvents(s, userId).filter((e) => e.status === 'Live')
  return mine.sort((a, b) => (startsAt(a) ?? 0) - (startsAt(b) ?? 0))[0] ?? null
}

/* ------------------------------------------------------------ NP */
export const npEvents = (s, npId) => liveEvents(s).filter((e) => e.nonprofitId === npId)
export const npQueue = (s, npId) => npEvents(s, npId).filter((e) => e.status === 'Submitted').sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
export function npSetupSteps(np) {
  const uploaded = np.documents.filter((d) => ['Uploaded', 'Approved'].includes(d.status)).length
  return [
    { id: 'password', label: 'Set your password', done: !!np.passwordSet },
    { id: 'documents', label: 'Upload your three documents', done: uploaded === 3, detail: `${uploaded} of 3 uploaded` },
    { id: 'stripe', label: 'Connect Stripe', done: np.stripe.state === 'connected' },
    { id: 'verified', label: 'Verified by Charity Hub', done: np.verified },
  ]
}
export function npStats(s, npId) {
  const events = npEvents(s, npId).filter((e) => ['Live', 'Completed', 'Archived'].includes(e.status))
  let raised = 0, backed = 0, joined = 0
  events.forEach((e) => { const t = eventTotals(s, e.key); raised += t.raised; backed += t.backed; joined += t.joined })
  return { events: events.length, raised, backed, joined, pending: npQueue(s, npId).length }
}
export const donationsFor = (s, filter) => s.donations.filter(filter).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

/* ------------------------------------------------------------ Admin */
export function adminMetrics(s) {
  const all = liveEvents(s)
  const sumRaised = all.filter((e) => ['Live', 'Completed', 'Archived'].includes(e.status)).reduce((t, e) => t + eventTotals(s, e.key).raised, 0)
  return {
    liveEvents: all.filter((e) => e.status === 'Live').length,
    pendingReviews: s.reviewItems.filter((r) => ['New', 'In Review'].includes(r.status)).length,
    nonprofitsToVerify: Object.values(s.nonprofits).filter((n) => n.status === 'Pending').length,
    openExceptions: s.exceptions.filter((x) => x.status !== 'Resolved').length,
    flaggedContent: s.reviewItems.filter((r) => r.type === 'Content report' && ['New', 'In Review'].includes(r.status)).length,
    gmv: sumRaised, // all-time demo total (F12 G-AD-03: no date filter)
    activeNonprofits: Object.values(s.nonprofits).filter((n) => n.status === 'Active').length,
  }
}
export const unreadCount = (s, userId) => s.notifications.filter((n) => n.userId === userId && !n.read).length
export const notificationsFor = (s, userId) => s.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
export { npAdminsOf }
