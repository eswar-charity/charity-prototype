// Payouts are derived, not stored: successful gifts are grouped into Monday-to-Sunday weeks and paid out
// on the Wednesday after the week closes (a prototype rule, labelled as such in the UI).
import { DAY } from './shared.jsx'

const weekStart = (iso) => {
  const x = new Date(iso)
  x.setUTCHours(0, 0, 0, 0)
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7))
  return x
}

/** donations: the nonprofit's donations. Returns newest first: { id, weekStart, weekEnd, payoutDate, amountCents, count, status } */
export function derivePayouts(donations, now) {
  const weeks = new Map()
  donations.filter((d) => d.status === 'Successful').forEach((d) => {
    const start = weekStart(d.paidAt ?? d.createdAt)
    const id = start.toISOString().slice(0, 10)
    const w = weeks.get(id) ?? { id, weekStart: start, amountCents: 0, count: 0 }
    w.amountCents += d.amountCents
    w.count += 1
    weeks.set(id, w)
  })
  return [...weeks.values()]
    .map((w) => {
      const payoutDate = new Date(w.weekStart.getTime() + 9 * DAY)
      return { ...w, weekEnd: new Date(w.weekStart.getTime() + 6 * DAY), payoutDate, status: payoutDate <= new Date(now) ? 'Paid' : 'In transit' }
    })
    .sort((a, b) => b.weekStart - a.weekStart)
}
