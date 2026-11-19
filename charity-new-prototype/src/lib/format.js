export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const compact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

/** Prototype-only fundraising goal: the existing data has `raised`, not a goal.
 *  Derived as raised * 1.35 rounded up to the next $1,000 so progress bars read realistically. */
export const goalFor = (raised) => Math.ceil((raised * 1.35) / 1000) * 1000

export const percent = (raised, goal) => (goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0)

/** Parse "Nov 14, 2026" + "7:00 PM" into a Date (local time). */
export function eventStart(date, start) {
  const d = new Date(`${date} ${start}`)
  return Number.isNaN(d.getTime()) ? new Date(date) : d
}

/** Offset in hours relative to the event start → human label for timeline posts. */
export function relativeHours(h) {
  if (h === 0 || (h > 0 && h < 1)) return 'During the event'
  const abs = Math.abs(h)
  if (h > 0) {
    if (abs < 24) return `${Math.round(abs)}h after`
    return `${Math.round(abs / 24)} days after`
  }
  if (abs < 24) return `${Math.round(abs)}h before`
  const days = Math.round(abs / 24)
  return days >= 14 ? `${Math.round(days / 7)} weeks before` : `${days} days before`
}

/** Dated state of an event relative to `now`. */
export function eventState(date, start, end, now = new Date()) {
  const s = eventStart(date, start)
  const e = eventStart(date, end)
  if (now < s) return 'upcoming'
  if (now <= e) return 'live'
  return 'past'
}

export const slugToTitle = (s) => s.replace(/-/g, ' ')

/** Honest date framing: "Closed Nov 14", "Sat, Dec 12 · 4:00 PM", "Coming 2027". */
export function whenLabel(date, start, end, now = new Date()) {
  const s = eventStart(date, start)
  const state = eventState(date, start, end, now)
  if (state === 'live') return 'Happening now'
  const short = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (state === 'past') return `Closed ${short}`
  if (s.getFullYear() > now.getFullYear()) return `Coming ${s.getFullYear()}`
  const day = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${day} · ${start}`
}

export const initialsOf = (name) =>
  name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
