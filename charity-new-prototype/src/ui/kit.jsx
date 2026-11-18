// Shared UI kit for every role. Built on the design system classes (ch-*) and tokens; see styles/shell.css.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCodeLib from 'qrcode'
import { X } from 'lucide-react'
import { useAct } from '../domain/store.jsx'

/* ---------------------------------------------------------------- formatting */
export const dollars = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
export const centsToDollars = (c) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c / 100)
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')
export function timeAgo(iso, now = new Date()) {
  const m = Math.round((new Date(now).getTime() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d < 30 ? `${d}d ago` : fmtDate(iso)
}
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/* ---------------------------------------------------------------- status badge */
const TONES = {
  Draft: 'neutral', Submitted: 'info', 'Changes Requested': 'warn', Rejected: 'danger', Live: 'live', Completed: 'neutral', Archived: 'neutral', Blocked: 'danger',
  Invited: 'neutral', Pending: 'info', Active: 'ok', Suspended: 'danger',
  New: 'info', 'In Review': 'warn', Approved: 'ok', Closed: 'neutral',
  Open: 'warn', Escalated: 'danger', Resolved: 'ok',
  Initiated: 'info', Successful: 'ok', Failed: 'danger', Refunded: 'neutral', 'Refund pending': 'warn', Disputed: 'danger',
  Missing: 'neutral', Uploaded: 'info', Reupload: 'warn', Ready: 'ok', 'Not ready': 'neutral', Verified: 'ok',
  High: 'danger', Medium: 'warn', Low: 'neutral',
}
/** Status is never carried by colour alone: the text is always there. */
export function StatusBadge({ status, children }) {
  const tone = TONES[status] ?? 'neutral'
  return (
    <span className={`badge badge--${tone}`}>
      {tone === 'live' && <span className="ch-pill__dot" aria-hidden="true" />}
      {children ?? status}
    </span>
  )
}

/* ---------------------------------------------------------------- layout bits */
export function PageHeader({ eyebrow, title, lede, actions, back }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {back && <Link to={back.to} className="back-link back-link--ink">← {back.label}</Link>}
        {eyebrow && <p className="ch-eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
export function Section({ title, aside, children, id, className = '' }) {
  return (
    <section className={`panel-section ${className}`} aria-labelledby={id ? `${id}-h` : undefined} id={id}>
      {(title || aside) && (
        <div className="panel-section__head">
          {title && <h2 className="h-heading-sm" id={id ? `${id}-h` : undefined}>{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty empty--kit" role="status">
      <p className="empty__title">{title}</p>
      {children && <p className="ch-muted">{children}</p>}
      {action && <p className="empty__action">{action}</p>}
    </div>
  )
}
export function Stat({ label, value, hint }) {
  return (
    <div className="stat-tile ch-accent">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="stat-tile__hint">{hint}</p>}
    </div>
  )
}
export const StatRow = ({ children, label }) => <dl className="stat-grid" aria-label={label}>{children}</dl>

export function Field({ id, label, hint, error, children }) {
  return (
    <div className={`ch-field ${error ? 'ch-field--invalid' : ''}`}>
      <label className="ch-field__label" htmlFor={id}>{label}</label>
      {children}
      {error ? <span className="ch-field__hint" id={`${id}-err`}>{error}</span> : hint ? <span className="ch-field__hint" id={`${id}-hint`}>{hint}</span> : null}
    </div>
  )
}
export const fieldProps = (id, error) => ({ id, className: 'ch-field__input', 'aria-invalid': !!error || undefined, 'aria-describedby': error ? `${id}-err` : undefined })

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="tabs">
      {tabs.map((t) => (
        <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={value === t.id} aria-controls={`panel-${t.id}`} tabIndex={value === t.id ? 0 : -1}
          className={`tab ${value === t.id ? 'is-on' : ''}`} onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x.id === value)
            const n = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i + tabs.length - 1) % tabs.length] : null
            if (n) { onChange(n.id); document.getElementById(`tab-${n.id}`)?.focus() }
          }}>
          {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- QR */
export function QR({ value, size = 192, label }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !value) return
    QRCodeLib.toCanvas(ref.current, value, { width: size, margin: 1, color: { dark: '#0e2b47', light: '#ffffff' } }).catch(() => {})
  }, [value, size])
  return <canvas ref={ref} width={size} height={size} role="img" aria-label={label ?? `QR code for ${value}`} className="qr" />
}

/* ---------------------------------------------------------------- toasts */
const ToastCtx = createContext(null)
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const show = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setItems((l) => [...l, { id, message, tone }])
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 4500)
  }, [])
  const dismiss = (id) => setItems((l) => l.filter((x) => x.id !== id))
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={16} aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => {
  const t = useContext(ToastCtx)
  if (!t) throw new Error('useToast needs <ToastProvider>')
  return t
}

/** run('approveEvent', {key}, { success: 'Approved', onOk }) → dispatches, toasts the outcome, returns the result.
 *  This is how every screen performs an action: errors always surface as plain-language toasts. */
export function useRun() {
  const act = useAct()
  const toast = useToast()
  return useCallback((type, payload, { success, onOk, quiet } = {}) => {
    const r = act(type, payload)
    if (r.ok) { if (success) toast(success, 'ok'); onOk?.(r.data) } else if (!quiet) toast(r.error.message, 'error')
    return r
  }, [act, toast])
}

/* ---------------------------------------------------------------- confirm dialog */
const ConfirmCtx = createContext(null)
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const ref = useRef(null)
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), [])
  useEffect(() => { if (state && ref.current && !ref.current.open) ref.current.showModal() }, [state])
  const closing = useRef(false) // dialog.close() fires 'close' synchronously in jsdom, which re-entered close() forever
  const close = (v) => {
    if (closing.current) return
    closing.current = true
    state?.resolve(v); setState(null); ref.current?.close()
    closing.current = false
  }
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <dialog ref={ref} className="dialog ch" aria-labelledby="confirm-t" onClose={() => state && close(false)}>
          <div className="dialog-inner">
            <h2 id="confirm-t" className="h-heading-sm">{state.title}</h2>
            {state.body && <p className="ch-muted">{state.body}</p>}
            <div className="dialog-actions">
              <button className="ch-btn ch-btn--secondary" onClick={() => close(false)}>{state.cancel ?? 'Cancel'}</button>
              <button className={`ch-btn ${state.danger ? 'ch-btn--danger' : 'ch-btn--primary'}`} onClick={() => close(true)}>{state.confirm ?? 'Confirm'}</button>
            </div>
          </div>
        </dialog>
      )}
    </ConfirmCtx.Provider>
  )
}
/** const confirm = useConfirm(); if (await confirm({title:'Delete draft?', body:'…', confirm:'Delete', danger:true})) … */
export const useConfirm = () => useContext(ConfirmCtx)

/** Native <dialog> wrapper: focus trap, Esc, backdrop click. Render it only while open. */
export function Modal({ title, onClose, children, wide = false, labelledBy = 'modal-t' }) {
  const ref = useRef(null)
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal() }, [])
  return (
    <dialog ref={ref} className={`dialog ch ${wide ? 'dialog--wide' : ''}`} aria-labelledby={labelledBy} onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div className="dialog-inner">
        <button className="dialog-x" onClick={() => ref.current.close()} aria-label="Close"><X size={20} aria-hidden="true" /></button>
        {title && <h2 id={labelledBy} className="h-heading-sm">{title}</h2>}
        {children}
      </div>
    </dialog>
  )
}
