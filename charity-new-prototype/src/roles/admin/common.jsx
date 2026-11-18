// Small building blocks shared by the admin screens: filters, a reason dialog, the invite-link field.
import { useId, useRef, useState } from 'react'
import { Copy, Search } from 'lucide-react'
import { Field, Modal, fieldProps, useToast } from '../../ui/kit.jsx'
import { ROLE_LABEL } from '../../domain/engine.js'

export const DAY = 864e5
export const OPEN_REVIEW = ['New', 'In Review']
export const DECIDED_REVIEW = ['Approved', 'Rejected', 'Closed']
export const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 }

export const roleName = (role) => (role === 'system' ? 'System' : ROLE_LABEL[role] ?? role)
export const inviteUrl = (token) => `${window.location.origin}/accept-invite?token=${token}`
export const approvedDocs = (np) => np.documents.filter((d) => d.status === 'Approved').length

/** "kind:id:eventKey" → parts. The id never contains a colon in the prototype data, the event key is the last segment. */
export function parseContentRef(ref = '') {
  const first = ref.indexOf(':')
  const last = ref.lastIndexOf(':')
  if (first < 0 || last === first) return { kind: '', id: '', eventKey: '' }
  return { kind: ref.slice(0, first), id: ref.slice(first + 1, last), eventKey: ref.slice(last + 1) }
}

/** Value for <input type="datetime-local"> in the viewer's local time. */
export function toLocalInput(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

/* ---------------------------------------------------------------- filters */
export function SelectField({ id, label, value, onChange, options }) {
  return (
    <div className="ch-field">
      <label className="ch-field__label" htmlFor={id}>{label}</label>
      <select id={id} className="ch-field__input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
    </div>
  )
}

export function SearchField({ id, label, value, onChange, placeholder }) {
  return (
    <div className="ch-field adm-search">
      <label className="ch-field__label" htmlFor={id}>{label}</label>
      <div className="search__box">
        <Search size={18} aria-hidden="true" />
        <input id={id} type="search" className="ch-field__input" value={value} placeholder={placeholder} autoComplete="off" onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  )
}

export const FilterBar = ({ children, label = 'Filters' }) => <div className="adm-filters" role="group" aria-label={label}>{children}</div>

export function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className="adm-chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" className="adm-chip" aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

export const ResultCount = ({ children }) => <p className="adm-count" role="status" aria-live="polite">{children}</p>

export const Mono = ({ children }) => <span className="adm-mono">{children}</span>

/* ---------------------------------------------------------------- dialogs */
const FIELD_ERRORS = new Set(['reason_required', 'note_required'])

/**
 * One text box + confirm. `onSubmit(text)` must return the engine result: on success the dialog closes,
 * on failure the engine's own message shows under the box (field errors) or above the buttons.
 */
export function ReasonModal({ title, intro, label, hint, initial = '', required = false, requiredMessage = 'Add a reason.', submitLabel, danger = false, success, onSubmit, onClose, children }) {
  const id = useId()
  const toast = useToast()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    setFormError('')
    if (required && !value.trim()) { setError(requiredMessage); return }
    const r = onSubmit(value.trim())
    if (r.ok) { if (success) toast(success); onClose(); return }
    if (FIELD_ERRORS.has(r.error.code)) { setError(r.error.message); setFormError('') } else { setFormError(r.error.message); setError('') }
  }
  const fid = `${id}-reason`
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {intro && <p className="ch-muted">{intro}</p>}
        {children}
        <Field id={fid} label={label} hint={hint} error={error}>
          <textarea {...fieldProps(fid, error)} className="ch-field__input adm-textarea" rows={3} value={value} onChange={(e) => { setValue(e.target.value); setError('') }} />
        </Field>
        {formError && <p className="adm-form-error" role="alert">{formError}</p>}
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className={`ch-btn ${danger ? 'ch-btn--danger' : 'ch-btn--primary'}`}>{submitLabel}</button>
        </div>
      </form>
    </Modal>
  )
}

/** A read-only text box holding a link, with a copy button that degrades to "select it yourself". */
export function CopyField({ id, label, value }) {
  const ref = useRef(null)
  const toast = useToast()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast('Invite link copied')
    } catch {
      ref.current?.select()
      toast('The link is selected. Press Ctrl+C or Cmd+C to copy it.')
    }
  }
  return (
    <div className="ch-field">
      <label className="ch-field__label" htmlFor={id}>{label}</label>
      <div className="adm-copy">
        <input id={id} ref={ref} className="ch-field__input" readOnly value={value} onFocus={(e) => e.target.select()} />
        <button type="button" className="ch-btn ch-btn--secondary" onClick={copy}><Copy size={16} aria-hidden="true" /> Copy link</button>
      </div>
    </div>
  )
}
