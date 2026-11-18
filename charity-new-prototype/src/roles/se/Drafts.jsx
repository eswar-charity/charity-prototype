import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { useDomain, useSession } from '../../domain/store.jsx'
import { coverOf, seDrafts, seEvents } from '../../domain/selectors.js'
import { Empty, PageHeader, StatusBadge, plural, useConfirm, useRun, fmtDate } from '../../ui/kit.jsx'
import { manageLink, npNameOf, whenText } from './common.jsx'
import { openKeysFor, openSteps } from './wizard/helpers.js'

/** Where "Resume" goes: the saved step, the first flagged step in fix mode, or step 1 for a rejected event. */
export function editLink(ev) {
  if (ev.status === 'Rejected') return { to: `/se/create/${ev.key}/1`, label: 'Edit and resubmit' }
  if (ev.status === 'Changes Requested') return { to: `/se/create/${ev.key}/${openSteps(openKeysFor(ev))[0]}`, label: 'Fix and resubmit' }
  return { to: `/se/create/${ev.key}/${Math.min(4, ev.wizardStep ?? 1)}`, label: 'Resume' }
}

export default function Drafts() {
  const s = useDomain()
  const { user } = useSession()
  const run = useRun()
  const confirm = useConfirm()
  const nav = useNavigate()
  const [all, setAll] = useState(false)
  const list = (all ? seEvents(s, user.id) : seDrafts(s, user.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const remove = async (ev) => {
    const ok = await confirm({ title: `Delete ${ev.title}?`, body: 'This removes the draft for good. Events that were already live are never deleted this way.', confirm: 'Delete', danger: true })
    if (ok) run('deleteEvent', { key: ev.key }, { success: `${ev.title} deleted.` })
  }
  const clone = (ev) => run('cloneEvent', { key: ev.key }, { success: 'Copied as a new draft.', onOk: (copy) => nav(`/se/create/${copy.key}/1`) })

  return (
    <>
      <PageHeader
        eyebrow="Drafts"
        title={all ? 'All my events' : 'Drafts and events to fix'}
        lede={all ? 'Every event you have created, whatever its status.' : 'Drafts, events the nonprofit asked you to change, and events that were not approved.'}
        actions={<Link className="ch-btn ch-btn--primary" to="/se/create"><Plus size={18} aria-hidden="true" /> Create an event</Link>}
      />
      <label className="se-check se-toggle">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
        <span>Show all my events, not just drafts</span>
      </label>
      <p className="ch-muted" role="status">{plural(list.length, 'event')} shown.</p>

      {list.length === 0 ? (
        <Empty title={all ? 'You have not created an event yet.' : 'No drafts right now.'} action={<Link className="ch-btn ch-btn--primary" to="/se/create">Create an event</Link>}>
          {all ? 'Create one and it will show up here.' : 'Start a new event, or switch on “Show all my events” to see ones that are already live.'}
        </Empty>
      ) : (
        <ul className="se-cards">
          {list.map((ev) => {
            const editable = ['Draft', 'Changes Requested', 'Rejected'].includes(ev.status)
            const edit = editable ? editLink(ev) : manageLink(ev)
            return (
              <li key={ev.key} className="se-card">
                {coverOf(ev) ? <img className="se-card__img" src={coverOf(ev)} alt="" loading="lazy" /> : <div className="se-card__img se-card__img--none" aria-hidden="true" />}
                <div className="se-card__body">
                  <div className="row"><h2 className="se-card__title">{ev.title}</h2><StatusBadge status={ev.status} /></div>
                  <p className="ch-muted">{npNameOf(s, ev)} · {whenText(ev)}</p>
                  <p className="ch-muted">
                    {ev.status === 'Draft' ? `Saved at step ${Math.min(4, ev.wizardStep ?? 1)} of 4. Created ${fmtDate(ev.createdAt)}.`
                      : ev.status === 'Changes Requested' ? `Asked to change: ${(ev.review?.areas ?? []).join(', ')}.`
                        : ev.status === 'Rejected' ? ev.review?.reason : ''}
                  </p>
                  <div className="row se-card__actions">
                    <Link className="ch-btn ch-btn--primary ch-btn--sm" to={edit.to}>{edit.label}</Link>
                    <Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/se/approval/${ev.key}`}>View status</Link>
                    <button type="button" className="ch-btn ch-btn--text ch-btn--sm" onClick={() => clone(ev)} aria-label={`Clone ${ev.title}`}><Copy size={16} aria-hidden="true" /> Clone</button>
                    {['Draft', 'Rejected'].includes(ev.status) && (
                      <button type="button" className="ch-btn ch-btn--text ch-btn--sm se-danger" onClick={() => remove(ev)} aria-label={`Delete ${ev.title}`}><Trash2 size={16} aria-hidden="true" /> Delete</button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
