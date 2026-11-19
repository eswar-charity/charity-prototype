import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'

/** "More actions" menu. Items: { id, label, icon, onSelect | to, danger, hidden }. Keyboard: Esc closes, arrows move. */
export default function ActionMenu({ label, items }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const list = items.filter((i) => !i.hidden)

  useEffect(() => {
    if (!open) return
    const off = (e) => { if (!root.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', off)
    root.current?.querySelector('[role=menuitem]')?.focus()
    return () => document.removeEventListener('mousedown', off)
  }, [open])

  if (list.length === 0) return null
  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus() }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const nodes = [...root.current.querySelectorAll('[role=menuitem]')]
      const i = nodes.indexOf(document.activeElement)
      nodes[(i + (e.key === 'ArrowDown' ? 1 : nodes.length - 1)) % nodes.length]?.focus()
    }
  }

  return (
    <div className="amenu" ref={root} onKeyDown={onKey}>
      <button type="button" className="icon-btn amenu__btn" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="popover amenu__pop" role="menu" aria-label={label}>
          {list.map((i) => {
            const Icon = i.icon
            const inner = <>{Icon && <Icon size={16} aria-hidden="true" />} {i.label}</>
            return i.to ? (
              <Link key={i.id} role="menuitem" to={i.to} className={i.danger ? 'is-danger' : ''} onClick={() => setOpen(false)}>{inner}</Link>
            ) : (
              <button key={i.id} type="button" role="menuitem" className={i.danger ? 'is-danger' : ''} onClick={() => { setOpen(false); i.onSelect() }}>{inner}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}
