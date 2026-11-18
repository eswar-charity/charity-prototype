import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Lock } from 'lucide-react'
import { Modal, Field, fieldProps, centsToDollars, dollars } from '../ui/kit.jsx'
import { useGate } from '../ui/Gate.jsx'
import { useAct, useDomain, useSession } from '../domain/store.jsx'
import { quote } from '../domain/engine.js'
import { donateBlock } from '../roles/guest/lib.js'

export const PRESETS = [25, 50, 100, 250]
const AMOUNT_ERROR = 'Amounts run from $1 to $10,000.'

/** Dollars typed by a person → whole cents, or null when it is not a usable amount. */
export function toCents(text) {
  if (!/^\d{1,5}(\.\d{0,2})?$/.test(text.trim())) return null
  return Math.round(parseFloat(text) * 100)
}
const groupCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
const groupExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d }

/** Start a gift from anywhere: `const { start, dialog } = useDonate()`; render `dialog`, call `start(event)`.
 *  Anonymous visitors pass the identity gate (their email is the receipt address) before the form opens. */
export function useDonate() {
  const { ensureIdentity } = useGate()
  const [event, setEvent] = useState(null)
  const start = useCallback(async (ev) => {
    if (await ensureIdentity({ action: 'donate', event: ev })) setEvent(ev)
  }, [ensureIdentity])
  const dialog = event ? <DonateDialog event={event} onClose={() => setEvent(null)} /> : null
  return { start, dialog }
}

/** Gift form: amount, who it shows as, card. 4242… succeeds; …0002 is declined and can be retried. */
export default function DonateDialog({ event, onClose }) {
  const act = useAct()
  const nav = useNavigate()
  const s = useDomain()
  const { user, now } = useSession()
  const ev = s.events[event.key] ?? event
  const np = s.nonprofits[ev.nonprofitId]
  const block = donateBlock(s, ev)

  const [preset, setPreset] = useState(50)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState(user?.name ?? '')
  const [anonymous, setAnonymous] = useState(false)
  const [card, setCard] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [zip, setZip] = useState('')
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  const amountCents = custom !== '' ? toCents(custom) : preset * 100
  let q = null
  try { q = amountCents === null ? null : quote(amountCents) } catch { q = null }

  const validate = () => {
    const e = {}
    if (!q) e.amount = AMOUNT_ERROR
    if (!anonymous && name.trim().length < 2) e.name = 'Enter the name to show with your gift.'
    const digits = card.replace(/\D/g, '')
    if (digits.length < 12) e.card = 'Enter your card number.'
    const m = exp.match(/^(\d{2}) ?\/? ?(\d{2})$/)
    if (!m || +m[1] < 1 || +m[1] > 12) e.exp = 'Use MM / YY.'
    else if (2000 + +m[2] < now.getFullYear() || (2000 + +m[2] === now.getFullYear() && +m[1] < now.getMonth() + 1)) e.exp = 'That card has expired.'
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = 'Enter the 3 or 4 digit code.'
    return e
  }

  const submit = (e) => {
    e.preventDefault()
    setFailure('')
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true)
    const made = act('createDonation', { eventKey: ev.key, amountCents, anonymous, name })
    if (!made.ok) { setFailure(made.error.message); setBusy(false); return }
    const paid = act('confirmDonation', { id: made.data.id, cardLast4: card.replace(/\D/g, '').slice(-4) })
    setBusy(false)
    if (!paid.ok) { setFailure(paid.error.message); return }
    onClose()
    nav(`/donate/success/${made.data.id}`)
  }

  return (
    <Modal title={`Give to ${ev.title}`} onClose={onClose} labelledBy="donate-t" wide>
      {block ? (
        <div className="stack">
          <p role="status">{block}</p>
          <div className="dialog-actions"><button type="button" className="ch-btn ch-btn--primary" onClick={onClose}>Close</button></div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="gift">
          <p className="ch-muted">Your gift goes to {np?.name} through this event. Prototype: the card is simulated and nothing is charged.</p>

          <fieldset className="amounts">
            <legend className="ch-field__label">Amount</legend>
            <div className="amount-row">
              {PRESETS.map((p) => (
                <button type="button" key={p} className={`amount ${custom === '' && preset === p ? 'is-on' : ''}`} aria-pressed={custom === '' && preset === p}
                  onClick={() => { setPreset(p); setCustom(''); setErrors((x) => ({ ...x, amount: undefined })) }}>
                  {dollars(p)}
                </button>
              ))}
            </div>
            <Field id="gift-custom" label="Or enter your own amount (USD)" error={errors.amount} hint="From $1 to $10,000.">
              <input {...fieldProps('gift-custom', errors.amount)} inputMode="decimal" autoComplete="off" placeholder="75" value={custom}
                onChange={(e) => { setCustom(e.target.value.replace(/[^\d.]/g, '')); setErrors((x) => ({ ...x, amount: undefined })) }} />
            </Field>
          </fieldset>

          {q && (
            <dl className="quote" aria-label="Cost breakdown" aria-live="polite">
              <div><dt>Your gift</dt><dd>{centsToDollars(q.amountCents)}</dd></div>
              <div><dt>Card processing fee</dt><dd>{centsToDollars(q.feeCents)}</dd></div>
              <div className="quote__total"><dt>Total today</dt><dd>{centsToDollars(q.totalCents)}</dd></div>
            </dl>
          )}

          <Field id="gift-name" label="Name to show" error={errors.name} hint={anonymous ? 'Your gift will show as Anonymous.' : 'Shown as first name and last initial.'}>
            <input {...fieldProps('gift-name', errors.name)} autoComplete="name" value={name} disabled={anonymous} onChange={(e) => setName(e.target.value)} />
          </Field>
          <label className="check"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Give anonymously</label>

          <fieldset className="card-box">
            <legend className="card-box__legend"><CreditCard size={16} aria-hidden="true" /> Card details</legend>
            {failure && <p className="form-error" role="alert">{failure}</p>}
            <Field id="gift-card" label="Card number" error={errors.card}>
              <input {...fieldProps('gift-card', errors.card)} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={card}
                onChange={(e) => { setCard(groupCard(e.target.value)); setFailure('') }} />
            </Field>
            <div className="card-box__row">
              <Field id="gift-exp" label="Expiry" error={errors.exp}>
                <input {...fieldProps('gift-exp', errors.exp)} inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" value={exp} onChange={(e) => setExp(groupExpiry(e.target.value))} />
              </Field>
              <Field id="gift-cvc" label="Security code" error={errors.cvc}>
                <input {...fieldProps('gift-cvc', errors.cvc)} inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </Field>
              <Field id="gift-zip" label="ZIP (optional)">
                <input {...fieldProps('gift-zip')} inputMode="numeric" autoComplete="postal-code" value={zip} onChange={(e) => setZip(e.target.value.slice(0, 10))} />
              </Field>
            </div>
            <p className="ch-muted gate-fine">Demo cards: 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined.</p>
          </fieldset>

          <button className="ch-btn ch-btn--primary ch-btn--block" disabled={busy}>
            <Lock size={16} aria-hidden="true" /> {q ? `Pay ${centsToDollars(q.totalCents)}` : 'Pay'}
          </button>
        </form>
      )}
    </Modal>
  )
}
