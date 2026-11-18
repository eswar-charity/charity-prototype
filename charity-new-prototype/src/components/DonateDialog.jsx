import { useEffect, useRef, useState } from 'react'
import { X, Check } from 'lucide-react'
import { money } from '../lib/format.js'
import { useStore } from '../lib/store.jsx'

export const PRESETS = [25, 50, 100, 250]

export function validate({ amount, name, email, anonymous }) {
  const errors = {}
  if (!Number.isFinite(amount) || amount < 5) errors.amount = 'Enter an amount of $5 or more.'
  if (amount > 10000) errors.amount = 'Prototype limit is $10,000.'
  if (!anonymous && !name.trim()) errors.name = 'Please enter your name.'
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.'
  return errors
}

/** Native <dialog>: focus trap, Esc to close and inert background come for free. */
export default function DonateDialog({ event, onClose }) {
  const ref = useRef(null)
  const { donate } = useStore()
  const [amount, setAmount] = useState(50)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  const effective = custom !== '' ? Number(custom) : amount

  const submit = (e) => {
    e.preventDefault()
    const v = validate({ amount: effective, name, email, anonymous })
    setErrors(v)
    if (Object.keys(v).length) return
    donate({ eventKey: event.key, amount: effective, name: anonymous ? 'Anonymous' : name.trim(), anonymous })
    setDone(effective)
  }

  return (
    <dialog ref={ref} className="dialog ch" aria-labelledby="donate-title" onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div className="dialog-inner">
        <button className="dialog-x" onClick={() => ref.current.close()} aria-label="Close donation dialog">
          <X size={20} aria-hidden="true" />
        </button>

        {done ? (
          <div className="dialog-done" role="status">
            <span className="wizard-done__icon"><Check size={32} aria-hidden="true" /></span>
            <h2 id="donate-title" className="h-heading">Thank you</h2>
            <p>
              Your {money(done)} donation to <strong>{event.title}</strong> will appear in the totals right away.
            </p>
            <p className="ch-muted">Prototype only. No payment was processed.</p>
            <button className="ch-btn ch-btn--primary" onClick={() => ref.current.close()}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="ch-eyebrow">Donate</p>
            <h2 id="donate-title" className="h-heading">{event.title}</h2>
            <p className="ch-muted">Your gift goes to {event.nonprofitName} through this event. Prototype: nothing is charged.</p>

            <fieldset className="amounts">
              <legend className="ch-field__label">Choose an amount</legend>
              <div className="amount-row">
                {PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`amount ${custom === '' && amount === p ? 'is-on' : ''}`}
                    aria-pressed={custom === '' && amount === p}
                    onClick={() => { setAmount(p); setCustom('') }}
                  >
                    {money(p)}
                  </button>
                ))}
              </div>
              <div className={`ch-field ${errors.amount ? 'ch-field--invalid' : ''}`}>
                <label className="ch-field__label" htmlFor="amt">Or enter your own ($)</label>
                <input id="amt" className="ch-field__input" inputMode="numeric" placeholder="e.g. 75" value={custom}
                  aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amt-err' : undefined}
                  onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ''))} />
                {errors.amount && <span id="amt-err" className="ch-field__hint">{errors.amount}</span>}
              </div>
            </fieldset>

            <div className={`ch-field ${errors.name ? 'ch-field--invalid' : ''}`}>
              <label className="ch-field__label" htmlFor="dn">Your name</label>
              <input id="dn" className="ch-field__input" autoComplete="name" placeholder="Jane Doe" value={name}
                disabled={anonymous} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'dn-err' : undefined}
                onChange={(e) => setName(e.target.value)} />
              {errors.name && <span id="dn-err" className="ch-field__hint">{errors.name}</span>}
            </div>
            <div className={`ch-field ${errors.email ? 'ch-field--invalid' : ''}`}>
              <label className="ch-field__label" htmlFor="de">Email for your receipt</label>
              <input id="de" type="email" className="ch-field__input" autoComplete="email" placeholder="you@example.com" value={email}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'de-err' : undefined}
                onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <span id="de-err" className="ch-field__hint">{errors.email}</span>}
            </div>
            <label className="check">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Give anonymously
            </label>

            <button type="submit" className="ch-btn ch-btn--primary ch-btn--block">
              Donate {Number.isFinite(effective) && effective > 0 ? money(effective) : ''}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
