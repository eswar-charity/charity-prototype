// Small, pure helpers shared by the public pages. State-dependent framing always uses the domain clock.
import { ROLES, startsAt, endsAt, homeFor } from '../../domain/engine.js'
import { timing } from '../../domain/selectors.js'
import { whenLabel } from '../../lib/format.js'
import { GATE_COPY } from '../../ui/Gate.jsx'

// Contextual gate copy for reporting content (the shared gate has no entry for it).
GATE_COPY.report ??= () => ({ title: 'Report this content', body: 'Add your email so the Charity Hub team can follow up if they need more detail. Your name is not shown to the author.', cta: 'Continue' })

/** "Marcus Lopez" → "Marcus L." (guests and fans show first name + last initial; hosts show in full). */
export function publicName(name = '') {
  const n = name.trim()
  if (!n || n === 'Deleted user') return n || 'Someone'
  const parts = n.split(/\s+/)
  if (parts.length < 2) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

export const eventStatusIsPublic = (ev) => ['Live', 'Completed', 'Archived'].includes(ev.status)

/** Honest date framing against the domain clock: "Happening now", "Ended Nov 14", "Sat, Dec 12 · 4:00 PM". */
export function whenFor(s, ev) {
  const now = new Date(s.now)
  const st = startsAt(ev)
  if (!st) return 'Date to be announced'
  if (!ev.endDate) return whenLabel(ev.date, ev.start, ev.end, now)
  const en = endsAt(ev)
  if (en && now > en) return `Ended ${en.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  if (now >= st) return 'Happening now'
  return `${st.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${ev.start}`
}

/** 'upcoming' | 'live' | 'ended' for any event (Completed is always ended). */
export const phaseOf = (s, ev) => (ev.status === 'Completed' || ev.status === 'Archived' ? 'ended' : timing(s, ev))

/** Why a person cannot join right now (null when they can). */
export function joinBlock(s, ev) {
  if (ev.status === 'Blocked') return 'Joining is paused for this event.'
  if (ev.status === 'Archived') return 'This event is archived.'
  if (ev.status !== 'Live') return ev.status === 'Completed' ? 'This event has ended.' : 'You can join once the event is live.'
  if (phaseOf(s, ev) === 'ended') return 'This event has ended.'
  return null
}

/** Why a person cannot give right now (null when they can). Mirrors createDonation's checks. */
export function donateBlock(s, ev) {
  if (ev.status === 'Blocked') return 'Giving is paused for this event.'
  if (ev.status === 'Archived') return 'This event is archived, so giving is closed.'
  if (ev.status !== 'Live') return ev.status === 'Completed' ? 'Giving closed when this event completed.' : 'You can give once the event is live.'
  const np = s.nonprofits[ev.nonprofitId]
  if (!np) return 'This event has no nonprofit to receive gifts yet.'
  if (['Suspended', 'Rejected'].includes(np.status)) return `${np.name} cannot take gifts right now.`
  if (np.settlement !== 'Ready') return `${np.name} is still setting up payments, so gifts are not open yet.`
  return null
}

export const eventUrl = (key) => `${window.location.origin}/events/${key}`

/** Where "Host an event" goes for each kind of visitor (null: admins do not host). */
export const hostTarget = (user) => (!user || user.role === ROLES.GUEST ? '/signup' : user.role === ROLES.SE ? '/se/create' : user.role === ROLES.NP ? '/np/events/new' : null)

/** Which top-level areas a role may open. Everything public is open to everyone. */
export function canOpen(role, path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false
  const area = path.split(/[/?#]/)[1]
  if (area === 'se') return role === ROLES.SE
  if (area === 'np') return role === ROLES.NP
  if (area === 'admin') return role === ROLES.ADMIN
  return true
}

/** Resolve a sign-in redirect: honour ?next only when that role may open it; otherwise the role's home
 *  (with `denied` set when the person asked for somewhere else, so the caller can explain why). */
export function redirectFor(role, next) {
  const home = homeFor(role)
  if (!next || typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return { to: home, denied: false }
  if (['signin', 'signup', 'accept-invite'].includes(next.split(/[/?#]/)[1])) return { to: home, denied: false } // pointless after signing in
  return canOpen(role, next) ? { to: next, denied: false } : { to: home, denied: true }
}

/** Plain-language owner of a protected area, for "that page is for …" notices. */
export const areaLabel = (path) => ({ se: 'social entrepreneur', np: 'nonprofit admin', admin: 'Charity Hub admin' }[String(path).split(/[/?#]/)[1]] ?? 'different')
