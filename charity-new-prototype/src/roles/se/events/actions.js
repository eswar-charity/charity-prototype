// Every action on the events console goes through here: one name per action, from the button to the confirmation to the toast.
import { useNavigate } from 'react-router-dom'
import { useConfirm, useRun, useToast, plural } from '../../../ui/kit.jsx'
import { actionsFor, completeness } from './model.js'

const OUTCOME = {
  submitted: (t, np) => `${t} submitted for approval${np ? ` to ${np}` : ''}.`,
  auto_approved: (t) => `${t} was approved automatically and is live.`,
  live: (t) => `${t} is live.`,
}

export function useEventActions() {
  const run = useRun()
  const confirm = useConfirm()
  const nav = useNavigate()
  const toast = useToast()

  const submit = async (row) => {
    const { ev } = row
    const ok = await confirm({
      title: `Submit ${ev.title} for approval?`,
      body: `${row.np || 'The nonprofit'} will review it. You cannot edit the event while they decide, and nothing goes public until they approve.`,
      confirm: 'Submit for approval',
    })
    if (!ok) return false
    const r = run('submitEvent', { key: ev.key })
    if (r.ok) toast((OUTCOME[r.data.outcome] ?? OUTCOME.submitted)(ev.title, row.np), 'ok')
    return r.ok
  }

  const duplicate = (row, { open = true } = {}) =>
    run('cloneEvent', { key: row.key }, {
      success: `${row.ev.title} copied as a new draft.`,
      onOk: (copy) => { if (open) nav(`/se/create/${copy.key}/1`) },
    }).ok

  const archive = async (row) => {
    const ok = await confirm({
      title: `Archive ${row.ev.title}?`,
      body: 'It leaves your active lists and its public page becomes read-only. You can restore it from the Archived tab.',
      confirm: 'Archive',
    })
    return ok ? run('archiveEvent', { key: row.key }, { success: `${row.ev.title} archived.` }).ok : false
  }

  const restore = (row) => run('unarchiveEvent', { key: row.key }, { success: `${row.ev.title} restored to Closed.` }).ok

  const remove = async (row) => {
    const ok = await confirm({
      title: `Delete ${row.ev.title}?`,
      body: row.stage === 'rejected' ? 'This removes the event for good. You could also edit it and submit it again.' : 'This removes the draft for good. It cannot be undone.',
      confirm: row.stage === 'rejected' ? 'Delete event' : 'Delete draft',
      danger: true,
    })
    return ok ? run('deleteEvent', { key: row.key }, { success: `${row.ev.title} deleted.` }).ok : false
  }

  /** Bulk: tells you up front how many of the selection the action applies to, and why the rest are skipped. */
  const bulk = async (action, rows) => {
    const eligible = rows.filter((r) => {
      const a = actionsFor(r.stage, r.ev, completeness(r.ev).ready)
      return action === 'archive' ? a.archive : action === 'delete' ? a.remove : action === 'unarchive' ? a.restore : true
    })
    if (eligible.length === 0) {
      toast(`None of the ${plural(rows.length, 'selected event')} can be ${action === 'delete' ? 'deleted' : action === 'archive' ? 'archived' : action === 'unarchive' ? 'restored' : 'duplicated'}. ${action === 'delete' ? 'Only drafts and events that were not approved can be deleted.' : action === 'archive' ? 'Only closed events can be archived.' : ''}`.trim(), 'error')
      return false
    }
    const verb = { archive: 'Archive', delete: 'Delete', duplicate: 'Duplicate', unarchive: 'Restore' }[action]
    const skip = rows.length - eligible.length
    const ok = await confirm({
      title: `${verb} ${plural(eligible.length, 'event')}?`,
      body: `${skip ? `${plural(skip, 'selected event')} can’t be ${verb.toLowerCase()}d and will be skipped. ` : ''}${action === 'delete' ? 'This cannot be undone.' : action === 'archive' ? 'Archived events leave your active lists and become read-only.' : action === 'duplicate' ? 'Each copy is saved as a new draft.' : ''}`.trim(),
      confirm: `${verb} ${eligible.length}`,
      danger: action === 'delete',
    })
    if (!ok) return false
    const r = run('bulkEvents', { action, keys: eligible.map((x) => x.key) }, { quiet: false })
    if (r.ok) {
      const past = { archive: 'archived', delete: 'deleted', duplicate: 'duplicated', unarchive: 'restored' }[action]
      toast(`${plural(r.data.done, 'event')} ${past}.${r.data.skipped.length ? ` ${r.data.skipped.length} skipped: ${r.data.skipped[0].reason}` : ''}`, r.data.skipped.length ? 'error' : 'ok')
    }
    return r.ok
  }

  return { submit, duplicate, archive, restore, remove, bulk }
}
