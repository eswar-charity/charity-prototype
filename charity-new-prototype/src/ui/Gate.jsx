// Identity gate (F01 "key conversion flow"): Join, Donate, Comment, Like, Save, Follow need an email.
//   const { ensureIdentity } = useGate()
//   if (await ensureIdentity({ action: 'join', event })) run('joinEvent', …)
// Anonymous → gate (contextual copy, email, optional phone) → "About you" → the original action resumes.
// Anyone already signed in (guest lead, SE, NP admin, admin) passes straight through.
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Modal, Field, fieldProps } from './kit.jsx'
import { useAct, useEngineHandle } from '../domain/store.jsx'
import { currentUser } from '../domain/selectors.js'

const Ctx = createContext(null)

export const GATE_COPY = {
  join: (e) => ({ title: `Join ${e?.title ?? 'this event'}`, body: 'Add your email so we can send your ticket and any updates from the host.', cta: 'Join the event' }),
  donate: (e) => ({ title: `Give to ${e?.title ?? 'this event'}`, body: 'We need an email to send your receipt. No password and no account needed.', cta: 'Continue to payment' }),
  comment: () => ({ title: 'Join the conversation', body: 'Add your email to post and reply. Hosts and guests see your first name only.', cta: 'Continue' }),
  chat: () => ({ title: 'Join the room', body: 'Add your email to chat with everyone going.', cta: 'Continue' }),
  like: () => ({ title: 'Like this post', body: 'Add your email so we can keep your likes together.', cta: 'Continue' }),
  save: (e) => ({ title: `Save ${e?.title ?? 'this event'}`, body: 'Add your email and we will keep it in your saved events.', cta: 'Save event' }),
  follow: (_e, np) => ({ title: `Follow ${np?.name ?? 'this nonprofit'}`, body: 'Add your email to follow a nonprofit and hear when they host something new.', cta: 'Follow' }),
  default: () => ({ title: 'One quick thing', body: 'Add your email to continue.', cta: 'Continue' }),
}

export function GateProvider({ children }) {
  const engine = useEngineHandle()
  const [gate, setGate] = useState(null)
  const resolver = useRef(null)

  const ensureIdentity = useCallback(({ action = 'default', event, nonprofit } = {}) => {
    if (currentUser(engine.getState())) return Promise.resolve(true)
    const copy = (GATE_COPY[action] ?? GATE_COPY.default)(event, nonprofit)
    return new Promise((resolve) => {
      resolver.current = resolve
      setGate({ action, copy, event })
    })
  }, [engine])

  const finish = (ok) => { resolver.current?.(ok); resolver.current = null; setGate(null) }

  return (
    <Ctx.Provider value={{ ensureIdentity }}>
      {children}
      {gate && <GateDialog gate={gate} onDone={finish} />}
    </Ctx.Provider>
  )
}
export const useGate = () => useContext(Ctx)

function GateDialog({ gate, onDone }) {
  const act = useAct()
  const loc = useLocation()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [err, setErr] = useState({})
  const [signInHint, setSignInHint] = useState(false)

  const submitEmail = (e) => {
    e.preventDefault()
    const r = act('gateIdentify', { email, phone, pending: { type: gate.action, eventKey: gate.event?.key } })
    if (!r.ok) {
      setErr({ email: r.error.code === 'invalid_phone' ? undefined : r.error.message, phone: r.error.code === 'invalid_phone' ? r.error.message : undefined })
      setSignInHint(r.error.code === 'email_belongs_to_account')
      return
    }
    setName(r.data.user.name); setStep('about')
  }
  const submitAbout = (e) => {
    e.preventDefault()
    const r = act('updateProfile', { name, city })
    if (!r.ok) { setErr({ name: r.error.message }); return }
    act('takePending')
    onDone(true)
  }

  return (
    <Modal title={step === 'email' ? gate.copy.title : 'About you'} onClose={() => onDone(false)} labelledBy="gate-t">
      {step === 'email' ? (
        <form onSubmit={submitEmail} noValidate className="stack">
          <p className="ch-muted">{gate.copy.body}</p>
          <Field id="gate-email" label="Email" error={err.email}>
            <input {...fieldProps('gate-email', err.email)} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field id="gate-phone" label="Phone (optional)" hint="Only used if the host needs to reach you about the event." error={err.phone}>
            <input {...fieldProps('gate-phone', err.phone)} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          {signInHint && (
            <p className="ch-muted">That email belongs to an account. <Link to={`/signin?next=${encodeURIComponent(loc.pathname + loc.search)}`} onClick={() => onDone(false)}>Sign in instead</Link>.</p>
          )}
          <button className="ch-btn ch-btn--primary">{gate.copy.cta}</button>
          <p className="ch-muted gate-fine">Already have an account? <Link to={`/signin?next=${encodeURIComponent(loc.pathname + loc.search)}`} onClick={() => onDone(false)}>Sign in</Link></p>
        </form>
      ) : (
        <form onSubmit={submitAbout} noValidate className="stack">
          <p className="ch-muted">You are in. Tell us what to call you. Others see only your first name and last initial.</p>
          <Field id="gate-name" label="Your name" error={err.name}>
            <input {...fieldProps('gate-name', err.name)} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field id="gate-city" label="City (optional)">
            <input {...fieldProps('gate-city')} autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <button className="ch-btn ch-btn--primary">Continue</button>
        </form>
      )}
    </Modal>
  )
}
