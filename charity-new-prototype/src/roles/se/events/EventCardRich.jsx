import { Link } from 'react-router-dom'
import { Archive, ArchiveRestore, CalendarDays, Copy, Eye, ImageOff, MapPin, Pencil, Send, Trash2 } from 'lucide-react'
import { photoList } from '../../../domain/selectors.js'
import { CauseBadge } from '../../../components/Brand.jsx'
import { dollars, fmtDate, plural } from '../../../ui/kit.jsx'
import { whenText } from '../common.jsx'
import { editLink } from '../Drafts.jsx'
import ActionMenu from './ActionMenu.jsx'
import { STAGES, actionsFor, completeness } from './model.js'

const DAY = 864e5

/** "Starts in 3 days", "Started 2 days ago": read against the prototype clock, never the real one. */
export function startsIn(startMs, nowMs) {
  if (startMs == null) return ''
  const d = Math.round((startMs - nowMs) / DAY)
  if (d === 0) return startMs > nowMs ? 'Starts today' : 'Started today'
  if (d === 1) return 'Starts tomorrow'
  return d > 0 ? `Starts in ${d} days` : `Started ${-d} day${d === -1 ? '' : 's'} ago`
}

export function StageBadge({ stage }) {
  const { label, tone } = STAGES[stage]
  return (
    <span className={`badge badge--${tone}`}>
      {tone === 'live' && <span className="ch-pill__dot" aria-hidden="true" />}
      {label}
    </span>
  )
}

/** The part of the card that changes with the event's stage: what matters to the organizer right now. */
function StageBlock({ row, now }) {
  const { ev, stage } = row
  if (stage === 'draft') {
    const c = completeness(ev)
    return (
      <div className="ev-block">
        <div className="ev-block__row"><strong>Step {Math.min(4, ev.wizardStep ?? 1)} of 4</strong><span className="ch-muted">{c.done} of {c.total} ready</span></div>
        <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.done} aria-label={`${c.done} of ${c.total} things ready to submit`}><span style={{ width: `${(c.done / c.total) * 100}%` }} /></div>
        {c.ready ? <p className="ev-ok">Ready to submit for approval.</p> : (
          <ul className="ev-missing" aria-label="Still needed">
            {c.missing.slice(0, 3).map((m) => <li key={m.id}>{m.label}</li>)}
            {c.missing.length > 3 && <li className="ev-missing__more">+{c.missing.length - 3} more</li>}
          </ul>
        )}
      </div>
    )
  }
  if (stage === 'waiting') {
    const days = ev.submittedAt ? Math.max(0, Math.floor((now - new Date(ev.submittedAt).getTime()) / DAY)) : 0
    return <p className="ev-note"><strong>Waiting for {row.np || 'the nonprofit'}</strong> since {fmtDate(ev.submittedAt)} ({days === 0 ? 'today' : plural(days, 'day')}). You cannot edit it while they decide.</p>
  }
  if (stage === 'changes') {
    return (
      <div className="ev-note ev-note--warn">
        <p><strong>{row.np || 'The nonprofit'} asked for changes</strong></p>
        <p className="ev-quote">{ev.review?.feedback}</p>
        <ul className="ev-chips" aria-label="Areas to change">{(ev.review?.areas ?? []).map((a) => <li key={a}>{a}</li>)}</ul>
      </div>
    )
  }
  if (stage === 'rejected') return <div className="ev-note ev-note--danger"><p><strong>Not approved</strong></p><p className="ev-quote">{ev.review?.reason}</p></div>
  if (stage === 'paused') return <div className="ev-note ev-note--danger"><p><strong>Paused by Charity Hub</strong></p><p className="ev-quote">{ev.blocked?.reason}</p></div>
  return (
    <dl className="ev-stats">
      <div><dt>Raised</dt><dd>{dollars(row.raised)}</dd></div>
      <div><dt>Going</dt><dd>{row.going}</dd></div>
      <div><dt>{stage === 'live' ? 'Checked in' : 'Backers'}</dt><dd>{stage === 'live' ? row.checkedIn : row.backed}</dd></div>
    </dl>
  )
}

/**
 * The event card. One layout, but the middle block and the main button follow the stage:
 * drafts show what is missing, reviews show the nonprofit's answer, live and closed events show their numbers.
 */
export default function EventCardRich({ row, now, actions, selectable = false, selected = false, onToggle }) {
  const { ev, stage } = row
  const c = completeness(ev)
  const a = actionsFor(stage, ev, c.ready)
  const cover = photoList(ev)[0]
  const edit = editLink(ev)
  const rel = ['live', 'upcoming'].includes(stage) ? startsIn(row.startMs, now) : ''

  // The one main button: submit when a draft is complete, otherwise the next sensible step for that stage.
  let primary
  if (stage === 'draft' && c.ready) primary = <button type="button" className="ch-btn ch-btn--primary ch-btn--sm" onClick={() => actions.submit(row)}><Send size={16} aria-hidden="true" /> Submit for approval</button>
  else if (a.primary === 'resume' || a.primary === 'fix') primary = <Link className="ch-btn ch-btn--primary ch-btn--sm" to={edit.to}>{a.primary === 'resume' ? 'Continue editing' : edit.label}</Link>
  else if (a.primary === 'status') primary = <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/se/approval/${ev.key}`}>View status</Link>
  else if (a.primary === 'dashboard') primary = <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/se/live/${ev.key}`}>Live dashboard</Link>
  else primary = <Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/se/impact/${ev.key}`}>See impact</Link>

  const second = a.publicPage
    ? <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${ev.key}`}>Public page</Link>
    : a.preview ? <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${ev.key}`}><Eye size={16} aria-hidden="true" /> Preview</Link> : null

  const primaryIsEdit = (a.primary === 'resume' && !(stage === 'draft' && c.ready)) || a.primary === 'fix'
  const menu = [
    { id: 'edit', label: stage === 'draft' ? 'Edit details' : edit.label, icon: Pencil, to: edit.to, hidden: !a.edit || primaryIsEdit },
    { id: 'dup', label: 'Duplicate', icon: Copy, onSelect: () => actions.duplicate(row) },
    { id: 'archive', label: 'Archive', icon: Archive, onSelect: () => actions.archive(row), hidden: !a.archive },
    { id: 'restore', label: 'Restore from archive', icon: ArchiveRestore, onSelect: () => actions.restore(row), hidden: !a.restore },
    { id: 'delete', label: stage === 'rejected' ? 'Delete event' : 'Delete draft', icon: Trash2, onSelect: () => actions.remove(row), danger: true, hidden: !a.remove },
  ]

  return (
    <article className={`evc ${selected ? 'is-selected' : ''}`} aria-labelledby={`evc-${ev.key}`}>
      <div className="evc__media">
        {cover ? <img src={cover} alt="" loading="lazy" style={{ objectPosition: ev.focus }} /> : <span className="evc__nophoto"><ImageOff size={22} aria-hidden="true" /> No photo yet</span>}
        <span className="evc__badge"><StageBadge stage={stage} /></span>
        {selectable && (
          <label className="evc__select">
            <input type="checkbox" checked={selected} onChange={() => onToggle(row.key)} />
            <span className="sr-only">Select {ev.title}</span>
          </label>
        )}
      </div>
      <div className="evc__body">
        <div className="evc__head">
          <h3 className="evc__title" id={`evc-${ev.key}`}>{ev.title}</h3>
          {ev.sample && <span className="evc__sample" title="Made by the demo tools">Sample</span>}
        </div>
        {row.np ? <CauseBadge name={row.np} /> : <span className="ch-muted evc__nonp">No nonprofit chosen yet</span>}
        <p className="evc__meta"><CalendarDays size={16} aria-hidden="true" /> <span>{whenText(ev)}{rel && <em className="evc__rel"> · {rel}</em>}</span></p>
        <p className="evc__meta"><MapPin size={16} aria-hidden="true" /> <span>{ev.location || 'Location not set yet'}</span></p>
        {row.category && <p className="evc__cat ch-muted">{row.category}</p>}
        <StageBlock row={row} now={now} />
        <div className="evc__foot">
          {primary}
          {second}
          <ActionMenu label={`More actions for ${ev.title}`} items={menu} />
        </div>
      </div>
    </article>
  )
}
