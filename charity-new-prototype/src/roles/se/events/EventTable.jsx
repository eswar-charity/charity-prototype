import { Link } from 'react-router-dom'
import { Archive, ArchiveRestore, Copy, Pencil, Send, Trash2 } from 'lucide-react'
import { photoList } from '../../../domain/selectors.js'
import { dollars } from '../../../ui/kit.jsx'
import { editLink } from '../Drafts.jsx'
import ActionMenu from './ActionMenu.jsx'
import { StageBadge, startsIn } from './EventCardRich.jsx'
import { actionsFor, completeness } from './model.js'

/** Sortable column: pairs of sort ids per column, so a second click reverses the direction. */
const COLUMNS = [
  { id: 'title', label: 'Event', asc: 'title', desc: 'title-desc' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Date', asc: 'date-asc', desc: 'date-desc' },
  { id: 'going', label: 'Going', asc: 'going-asc', desc: 'going-desc', num: true },
  { id: 'raised', label: 'Raised', asc: 'raised-asc', desc: 'raised-desc', num: true },
]

export default function EventTable({ rows, now, actions, selected, onToggle, onToggleAll, sort, onSort }) {
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.key))
  return (
    <div className="table-wrap">
      <table className="table evt">
        <caption className="sr-only">Your events</caption>
        <thead>
          <tr>
            <th scope="col" className="evt__check">
              <input type="checkbox" checked={allOn} onChange={onToggleAll} aria-label="Select all events on this page" />
            </th>
            {COLUMNS.map((c) => {
              const dir = c.asc && sort === c.asc ? 'ascending' : c.desc && sort === c.desc ? 'descending' : 'none'
              return (
                <th key={c.id} scope="col" className={c.num ? 'num' : ''} aria-sort={dir}>
                  {c.asc ? (
                    <button type="button" className="evt__sort" onClick={() => onSort(dir === 'ascending' ? c.desc : c.asc)}>
                      {c.label}<span aria-hidden="true">{dir === 'ascending' ? ' ↑' : dir === 'descending' ? ' ↓' : ''}</span>
                    </button>
                  ) : c.label}
                </th>
              )
            })}
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { ev, stage } = row
            const c = completeness(ev)
            const a = actionsFor(stage, ev, c.ready)
            const edit = editLink(ev)
            const cover = photoList(ev)[0]
            const primary = stage === 'draft' && c.ready ? null
              : a.primary === 'resume' || a.primary === 'fix' ? { to: edit.to, label: a.primary === 'resume' ? 'Continue' : edit.label }
                : a.primary === 'status' ? { to: `/se/approval/${ev.key}`, label: 'View status' }
                  : a.primary === 'dashboard' ? { to: `/se/live/${ev.key}`, label: 'Live dashboard' }
                    : { to: `/se/impact/${ev.key}`, label: 'Impact' }
            const rel = ['live', 'upcoming'].includes(stage) ? startsIn(row.startMs, now) : ''
            return (
              <tr key={row.key} className={selected.has(row.key) ? 'is-selected' : ''}>
                <td className="evt__check"><input type="checkbox" checked={selected.has(row.key)} onChange={() => onToggle(row.key)} aria-label={`Select ${ev.title}`} /></td>
                <td>
                  <div className="evt__event">
                    {cover ? <img src={cover} alt="" loading="lazy" /> : <span className="evt__nophoto" aria-hidden="true" />}
                    <span>
                      <strong>{ev.title}</strong>{ev.sample && <span className="evc__sample">Sample</span>}
                      <span className="ch-muted evt__sub">{row.np || 'No nonprofit yet'}{row.category ? ` · ${row.category}` : ''}</span>
                    </span>
                  </div>
                </td>
                <td><StageBadge stage={stage} />{stage === 'draft' && <span className="ch-muted evt__sub">{c.done} of {c.total} ready</span>}</td>
                <td>{ev.date || <span className="ch-muted">Not set</span>}<span className="ch-muted evt__sub">{rel || ev.location || ''}</span></td>
                <td className="num">{['draft', 'waiting', 'changes', 'rejected'].includes(stage) ? <span className="ch-muted">None yet</span> : row.going}</td>
                <td className="num">{['draft', 'waiting', 'changes', 'rejected'].includes(stage) ? <span className="ch-muted">None yet</span> : dollars(row.raised)}</td>
                <td>
                  <div className="table-actions">
                    {stage === 'draft' && c.ready
                      ? <button type="button" className="ch-btn ch-btn--primary ch-btn--sm" onClick={() => actions.submit(row)}><Send size={16} aria-hidden="true" /> Submit</button>
                      : <Link className="ch-btn ch-btn--primary ch-btn--sm" to={primary.to}>{primary.label}</Link>}
                    <ActionMenu label={`More actions for ${ev.title}`} items={[
                      { id: 'edit', label: 'Edit details', icon: Pencil, to: edit.to, hidden: !a.edit || (!(stage === 'draft' && c.ready) && (a.primary === 'resume' || a.primary === 'fix')) },
                      { id: 'preview', label: 'Preview', to: `/events/${ev.key}`, hidden: !a.preview && !a.publicPage },
                      { id: 'dup', label: 'Duplicate', icon: Copy, onSelect: () => actions.duplicate(row) },
                      { id: 'archive', label: 'Archive', icon: Archive, onSelect: () => actions.archive(row), hidden: !a.archive },
                      { id: 'restore', label: 'Restore from archive', icon: ArchiveRestore, onSelect: () => actions.restore(row), hidden: !a.restore },
                      { id: 'delete', label: 'Delete', icon: Trash2, onSelect: () => actions.remove(row), danger: true, hidden: !a.remove },
                    ]} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
