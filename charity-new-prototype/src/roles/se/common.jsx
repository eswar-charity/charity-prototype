// Helpers shared by the SE screens, the wizard and the live dashboard.
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useDomain, useSession } from '../../domain/store.jsx'
import { ROLES, isNpStaffFor, isOrganizer } from '../../domain/engine.js'
import { Empty, PageHeader } from '../../ui/kit.jsx'

/* ------------------------------------------------------------------ date and time conversion
 * The engine stores "Dec 5, 2026" and "7:00 PM" (what eventStart() parses). Inputs speak ISO and 24 hour. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Dec 5, 2026" → "2026-12-05" (empty string when it cannot be read). */
export function toInputDate(text) {
  const m = /^([A-Za-z]{3})[a-z]* (\d{1,2}), (\d{4})$/.exec((text ?? '').trim())
  if (!m) return ''
  const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase())
  return mi < 0 ? '' : `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`
}
/** "2026-12-05" → "Dec 5, 2026". */
export function fromInputDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m && MONTHS[+m[2] - 1] ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : ''
}
/** "7:00 PM" → "19:00". */
export function toInputTime(text) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((text ?? '').trim())
  if (!m) return ''
  let h = +m[1] % 12
  if (m[3].toUpperCase() === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${m[2]}`
}
/** "19:00" → "7:00 PM". */
export function fromInputTime(value) {
  const m = /^(\d{2}):(\d{2})$/.exec(value ?? '')
  if (!m) return ''
  const h = +m[1]
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`
}
/** Today's date (from the prototype clock) in input format. */
export function todayInput(now) {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Sat, Dec 5 · 7:00 PM to 10:00 PM" style line for an event (engine format in, plain words out). */
export function whenText(ev) {
  if (!ev.date) return 'Date not set yet'
  const range = ev.start && ev.end ? `${ev.start} to ${ev.end}` : ev.start || ''
  const end = ev.endDate && ev.endDate !== ev.date ? ` (ends ${ev.endDate})` : ''
  return `${ev.date}${range ? ` · ${range}` : ''}${end}`
}

/* ------------------------------------------------------------------ routing helpers */
export const wizardPath = (base, key, step) => (base === '/se' ? `/se/create/${key}/${step}` : `${base}/${key}/${step}`)
export const wizardStart = (base) => (base === '/se' ? '/se/create' : `${base}/new`)

/** Where an SE manages an event, by status. */
export function manageLink(ev) {
  if (['Live', 'Blocked'].includes(ev.status)) return { to: `/se/live/${ev.key}`, label: 'Live dashboard' }
  if (['Completed', 'Archived'].includes(ev.status)) return { to: `/se/impact/${ev.key}`, label: 'Impact' }
  if (ev.status === 'Draft') return { to: `/se/create/${ev.key}/${Math.min(4, ev.wizardStep ?? 1)}`, label: 'Resume' }
  return { to: `/se/approval/${ev.key}`, label: 'View status' }
}

/** First wizard step a person may edit in fix mode, from the nonprofit's flagged areas. */
export const STEP_FIELDS = {
  1: ['photos', 'title', 'story', 'category'],
  2: ['nonprofitId'],
  3: ['date', 'start', 'end', 'endDate', 'location'],
}

/* ------------------------------------------------------------------ event lookup + permission */
/** 'missing' (no such event) | 'forbidden' (not the organizer) | 'ok'. */
export function useOwnedEvent(key) {
  const s = useDomain()
  const { user } = useSession()
  const ev = key ? s.events[key] : null
  if (!ev || ev.deletedAt) return { state: 'missing', ev: null, s, user }
  if (!isOrganizer(user, ev)) return { state: 'forbidden', ev, s, user }
  return { state: 'ok', ev, s, user }
}

/** Organizer, the beneficiary nonprofit's staff, or a platform admin. */
export const canManage = (user, ev) => !!user && (isOrganizer(user, ev) || isNpStaffFor(user, ev) || user.role === ROLES.ADMIN)

export function NotYours({ missing = false, home = '/se', homeLabel = 'Back to your home' }) {
  return (
    <>
      <PageHeader title={missing ? 'We could not find that event' : 'This is not your event'} />
      <Empty
        title={missing ? 'That event does not exist or was deleted.' : 'Only the organizer can open this page.'}
        action={<Link className="ch-btn ch-btn--secondary" to={home}>{homeLabel}</Link>}
      >
        {missing ? 'Check the link, or open one of your own events from your home page.' : 'If you expected to see it, sign in with the account that created the event.'}
      </Empty>
    </>
  )
}

export function LockedNote({ children }) {
  return <p className="se-locked"><Lock size={14} aria-hidden="true" /> <span>{children}</span></p>
}

/** The nonprofit name for an event, or a plain fallback. */
export const npNameOf = (s, ev) => s.nonprofits[ev.nonprofitId]?.name ?? 'No nonprofit chosen yet'
