// Report-content and admin block dialogs used on the event page.
import { useState } from 'react'
import { Modal, Field, fieldProps, useToast } from '../../ui/kit.jsx'
import { useAct } from '../../domain/store.jsx'

/** Report a post, reply or chat message. The engine files it in the admin moderation queue. */
export function ReportDialog({ target, onClose }) {
  const act = useAct()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const r = act('flagContent', { kind: target.kind, id: target.id, eventKey: target.eventKey, reason })
    if (!r.ok) { setErr(r.error.message); return }
    toast('Thanks. The Charity Hub team will take a look.', 'ok')
    onClose()
  }

  return (
    <Modal title={`Report ${target.label}`} onClose={onClose} labelledBy="report-t">
      <form onSubmit={submit} noValidate className="stack">
        <p className="ch-muted">Tell us what is wrong. Reports go to the Charity Hub team and the author is not told who reported.</p>
        <Field id="report-reason" label="What is wrong?" error={err}>
          <textarea {...fieldProps('report-reason', err)} className="ch-field__input idea" rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setErr('') }} autoFocus />
        </Field>
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="ch-btn ch-btn--primary">Send report</button>
        </div>
      </form>
    </Modal>
  )
}

/** Platform admin pauses a live event: pick a reason and what happens to the money. */
export function BlockDialog({ event, onClose }) {
  const act = useAct()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState('hold')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const r = act('blockEvent', { key: event.key, reason, mode })
    if (!r.ok) { setErr(r.error.message); return }
    toast(`${event.title} is paused`, 'ok')
    onClose()
  }

  return (
    <Modal title={`Block ${event.title}`} onClose={onClose} labelledBy="block-t">
      <form onSubmit={submit} noValidate className="stack">
        <p className="ch-muted">The public page shows “Temporarily unavailable”. The organizer and the nonprofit are told why.</p>
        <Field id="block-reason" label="Reason" error={err}>
          <textarea {...fieldProps('block-reason', err)} className="ch-field__input idea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setErr('') }} autoFocus />
        </Field>
        <fieldset className="choice">
          <legend className="ch-field__label">What happens to gifts?</legend>
          <label className="check"><input type="radio" name="block-mode" checked={mode === 'hold'} onChange={() => setMode('hold')} /> Hold them while we look</label>
          <label className="check"><input type="radio" name="block-mode" checked={mode === 'refund'} onChange={() => setMode('refund')} /> Refund every gift now</label>
        </fieldset>
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="ch-btn ch-btn--danger">Block event</button>
        </div>
      </form>
    </Modal>
  )
}
