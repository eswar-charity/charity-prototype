// Pieces shared by the auth screens: the page frame, the Google simulation and the "already signed in" card.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal, Field, fieldProps } from '../../ui/kit.jsx'
import { useAct } from '../../domain/store.jsx'
import { ROLE_LABEL, homeFor } from '../../domain/engine.js'

/** Navy header in the stage style with the form card overlapping it. */
export function AuthLayout({ eyebrow, title, lede, children, aside }) {
  return (
    <>
      <section className="auth-hero ch-stage">
        <span className="auth-hero__glow" aria-hidden="true" />
        <div className="wrap">
          <p className="ch-eyebrow">{eyebrow}</p>
          <h1 className="h-display-3">{title}</h1>
          {lede && <p className="lede">{lede}</p>}
        </div>
      </section>
      <div className="wrap auth-body">
        <div className="auth-card">{children}</div>
        {aside && <aside className="auth-aside">{aside}</aside>}
      </div>
    </>
  )
}

/** Plain-language hint that follows an engine error code. The message itself always comes from the engine. */
export function FormError({ error }) {
  if (!error) return null
  const hints = {
    invalid_credentials: <>Check the spelling, or <Link to="/signup">create an account</Link> if you are new.</>,
    account_locked: 'Locked accounts open again on their own. Wait the time shown, then try again.',
    guest_no_password: <>You do not need to sign in to join or give. <Link to="/#discover">Find an event</Link> and add your email there.</>,
    invite_pending: 'Open the invite link from your email to set a password. After that you can sign in here.',
    email_taken: <>Already have an account? <Link to="/signin">Sign in</Link>.</>,
    google_not_allowed: 'Use your email and password for this account.',
  }
  return (
    <div className="form-error" role="alert">
      <p><strong>{error.message}</strong></p>
      {hints[error.code] && <p className="form-error__hint">{hints[error.code]}</p>}
    </div>
  )
}

/** Google is simulated: pick an email and name, no real OAuth. Everything else goes through engine.googleSignIn. */
export function GoogleDialog({ onClose, onDone }) {
  const act = useAct()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const v = {}
    if (!email.trim()) v.email = 'Enter the Google email to use.'
    setErrors(v)
    if (Object.keys(v).length) return
    const r = act('googleSignIn', { email: email.trim(), name: name.trim() })
    if (!r.ok) { setError(r.error); return }
    onDone(r.data)
  }

  return (
    <Modal title="Continue with Google" onClose={onClose} labelledBy="google-t">
      <form onSubmit={submit} noValidate className="stack">
        <p className="ch-muted">Prototype: this stands in for the Google account chooser. Enter any email and nothing leaves this browser.</p>
        <FormError error={error} />
        <Field id="g-email" label="Google email" error={errors.email}>
          <input {...fieldProps('g-email', errors.email)} type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} autoFocus />
        </Field>
        <Field id="g-name" label="Name (optional)">
          <input {...fieldProps('g-name')} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="ch-btn ch-btn--primary">Continue</button>
        </div>
      </form>
    </Modal>
  )
}

export const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.9c-.5 2.8-2.1 5.1-4.5 6.7v5.5h7.3c4.3-3.9 6.4-9.7 6.4-16.2z" />
    <path fill="#34A853" d="M24 46c6.1 0 11.2-2 14.9-5.5l-7.3-5.5c-2 1.4-4.6 2.2-7.6 2.2-5.9 0-10.8-3.9-12.6-9.2H3.8v5.7C7.5 41.1 15.1 46 24 46z" />
    <path fill="#FBBC05" d="M11.4 28c-.5-1.4-.7-2.8-.7-4.3s.3-3 .7-4.3v-5.7H3.8C2.3 16.7 1.5 20.2 1.5 24s.8 7.3 2.3 10.3L11.4 28z" />
    <path fill="#EA4335" d="M24 10.6c3.3 0 6.3 1.1 8.7 3.4l6.5-6.5C35.2 3.9 30.1 1.5 24 1.5 15.1 1.5 7.500 6.400 3.800 13.700l7.600 5.700c1.800-5.300 6.700-8.800 12.600-8.800z" />
  </svg>
)

/** Shown instead of the form when a real account (not a guest lead) is already signed in. */
export function AlreadySignedIn({ user }) {
  const act = useAct()
  return (
    <div className="stack">
      <h2 className="h-heading-sm">You are already signed in</h2>
      <p>Signed in as <strong>{user.name}</strong> ({ROLE_LABEL[user.role].toLowerCase()}).</p>
      <div className="row">
        <Link to={homeFor(user.role)} className="ch-btn ch-btn--primary">Go to {user.role === 'guest_lead' ? 'the home page' : 'your dashboard'}</Link>
        <button type="button" className="ch-btn ch-btn--secondary" onClick={() => act('signOut')}>Sign out</button>
      </div>
    </div>
  )
}
