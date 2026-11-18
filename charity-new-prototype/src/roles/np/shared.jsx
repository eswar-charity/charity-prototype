// Helpers shared by the nonprofit admin screens.
import { Link, Outlet } from 'react-router-dom'
import { useDomain, useSession } from '../../domain/store.jsx'
import { Empty } from '../../ui/kit.jsx'
import { coverOf } from '../../domain/selectors.js'

export const DAY = 864e5

/** The signed-in nonprofit admin, their nonprofit, the whole state and the domain clock. */
export function useNp() {
  const s = useDomain()
  const { user, now } = useSession()
  const np = user?.nonprofitId ? s.nonprofits[user.nonprofitId] ?? null : null
  return { s, user, now, np }
}

/** Layout route: every NP screen can assume `np` exists. */
export function NpGate() {
  const { np } = useNp()
  if (!np) return <Empty title="No nonprofit linked">This account is not linked to a nonprofit yet. Ask Charity Hub to re-send your invite.</Empty>
  return <Outlet />
}

export const whenOf = (ev) => [ev.date, ev.start && ev.end ? `${ev.start} to ${ev.end}` : ev.start].filter(Boolean).join(' · ')
export const daysSince = (iso, now) => (iso ? Math.max(0, Math.floor((new Date(now).getTime() - new Date(iso).getTime()) / DAY)) : 0)
export const ageLabel = (days) => (days === 0 ? 'Submitted today' : days === 1 ? 'Waiting 1 day' : `Waiting ${days} days`)

/** Cover photo (decorative: the title always sits next to it). */
export function Cover({ ev, className = 'np-cover' }) {
  const src = coverOf(ev)
  return src
    ? <img className={className} src={src} alt="" loading="lazy" />
    : <span className={`${className} np-cover--empty`} aria-hidden="true" />
}

export const eventLink = (ev) => (['Live', 'Completed', 'Archived'].includes(ev.status) ? `/events/${ev.key}` : null)

export function PublicLink({ ev, children = 'Public page' }) {
  const to = eventLink(ev)
  return to ? <Link to={to}>{children}</Link> : null
}

/** Support amounts that count as money received (disputed gifts are held, not paid out). */
export const isPaidStatus = (d) => d.status === 'Successful'
export const npDonations = (s, npId, filter = () => true) =>
  s.donations.filter((d) => d.nonprofitId === npId && filter(d)).sort((a, b) => new Date(b.paidAt ?? b.createdAt) - new Date(a.paidAt ?? a.createdAt))
