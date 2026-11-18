// The strip for people who have extra rights on this event: its organizer, the beneficiary nonprofit's staff, and admins.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ClipboardCheck, FileClock, PenLine, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { useConfirm, useRun } from '../../ui/kit.jsx'
import { ROLES, isNpStaffFor, isOrganizer } from '../../domain/engine.js'
import { BlockDialog } from './Dialogs.jsx'

const EDITABLE = ['Draft', 'Changes Requested', 'Rejected']

export default function Affordances({ ev, user }) {
  const run = useRun()
  const confirm = useConfirm()
  const [blocking, setBlocking] = useState(false)
  if (!user) return null
  const organizer = isOrganizer(user, ev)
  const staff = isNpStaffFor(user, ev)
  const admin = user.role === ROLES.ADMIN
  if (!organizer && !staff && !admin) return null

  const running = ['Live', 'Completed'].includes(ev.status)
  const step = Math.min(4, Math.max(1, ev.wizardStep ?? 1))
  const links = []

  if (organizer) {
    const np = user.role === ROLES.NP
    if (running) links.push({ to: np ? `/np/live/${ev.key}` : `/se/live/${ev.key}`, icon: Activity, label: 'Live dashboard' })
    if (!np && ev.status === 'Completed') links.push({ to: `/se/impact/${ev.key}`, icon: Sparkles, label: 'Impact summary' })
    if (!np) links.push({ to: `/se/approval/${ev.key}`, icon: FileClock, label: 'Approval status' })
    if (EDITABLE.includes(ev.status)) links.push({ to: np ? `/np/events/${ev.key}/${step}` : `/se/create/${ev.key}/${step}`, icon: PenLine, label: 'Edit event' })
  } else if (staff) {
    links.push({ to: `/np/approvals/${ev.key}`, icon: ClipboardCheck, label: 'Review' })
    if (running) links.push({ to: `/np/live/${ev.key}`, icon: Activity, label: 'Live dashboard' })
  }

  const who = organizer ? 'You are the organizer of this event.' : staff ? 'You manage the nonprofit this event supports.' : 'You are viewing this event as a Charity Hub admin.'

  const restore = async () => {
    const ok = await confirm({ title: `Restore ${ev.title}?`, body: 'The page goes back to live and people can join and give again.', confirm: 'Restore event' })
    if (ok) run('restoreEvent', { key: ev.key }, { success: `${ev.title} is live again` })
  }

  return (
    <section className="affordance" aria-label="Your options for this event">
      <p className="affordance__who"><ShieldCheck size={18} aria-hidden="true" /> {who}</p>
      <div className="affordance__links">
        {links.map((l) => (
          <Link key={l.label} to={l.to} className="ch-btn ch-btn--secondary ch-btn--sm"><l.icon size={16} aria-hidden="true" /> {l.label}</Link>
        ))}
        {admin && ev.status === 'Live' && <button type="button" className="ch-btn ch-btn--danger ch-btn--sm" onClick={() => setBlocking(true)}><ShieldAlert size={16} aria-hidden="true" /> Block event</button>}
        {admin && ev.status === 'Blocked' && <button type="button" className="ch-btn ch-btn--primary ch-btn--sm" onClick={restore}>Restore event</button>}
        {admin && <Link to="/admin/events" className="ch-btn ch-btn--secondary ch-btn--sm">All events in admin</Link>}
      </div>
      {blocking && <BlockDialog event={ev} onClose={() => setBlocking(false)} />}
    </section>
  )
}
