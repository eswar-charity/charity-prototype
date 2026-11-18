import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { Field, fieldProps, useToast } from '../../ui/kit.jsx'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { ROLES, ROLE_LABEL } from '../../domain/engine.js'
import { areaLabel, redirectFor } from '../guest/lib.js'
import { AlreadySignedIn, AuthLayout, FormError, GoogleDialog, GoogleMark } from './parts.jsx'

/** Role-aware landing after any successful sign-in: honour ?next only when that role may open it. */
function useLanding(next) {
  const act = useAct()
  const nav = useNavigate()
  return (role) => {
    const { to, denied } = redirectFor(role, next)
    if (denied) act('setNotice', { notice: `That page is for ${areaLabel(next)} accounts. You are signed in as ${ROLE_LABEL[role].toLowerCase()}, so we took you to your home.` })
    nav(to, { replace: true })
  }
}

const DEMO = [
  ['Social entrepreneur', 'mike.rivera@demo.charityhub.com'],
  ['Nonprofit admin', 'unitedway@charityhub.com'],
  ['Charity Hub admin', 'alex.mercer@charityhub.com'],
]

/* ------------------------------------------------------------------ /signin */
export function SignIn() {
  const [params] = useSearchParams()
  const next = params.get('next')
  const { user } = useSession()
  const act = useAct()
  const landing = useLanding(next)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [google, setGoogle] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setError(null)
    const v = {}
    if (!email.trim()) v.email = 'Enter your email.'
    if (!password) v.password = 'Enter your password.'
    setErrors(v)
    if (Object.keys(v).length) return
    const r = act('signIn', { email, password })
    if (!r.ok) { setError(r.error); return }
    landing(r.data.user.role)
  }

  return (
    <AuthLayout eyebrow="Sign in" title="Welcome back." lede="For hosts, nonprofit admins and the Charity Hub team. Guests do not need an account: just add your email when you join an event."
      aside={<DemoAccounts onPick={(em) => { setEmail(em); setPassword('Passw0rd!'); setError(null) }} />}>
      {user && user.role !== ROLES.GUEST ? <AlreadySignedIn user={user} /> : (
        <form onSubmit={submit} noValidate className="stack" aria-label="Sign in">
          <FormError error={error} />
          <Field id="si-email" label="Email" error={errors.email}>
            <input {...fieldProps('si-email', errors.email)} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field id="si-password" label="Password" error={errors.password}>
            <input {...fieldProps('si-password', errors.password)} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button className="ch-btn ch-btn--primary ch-btn--block">Sign in</button>
          <p className="or"><span>or</span></p>
          <button type="button" className="ch-btn ch-btn--secondary ch-btn--block" onClick={() => setGoogle(true)}><GoogleMark /> Continue with Google</button>
          <p className="ch-muted auth-switch">New host? <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link></p>
        </form>
      )}
      {google && <GoogleDialog onClose={() => setGoogle(false)} onDone={(d) => { setGoogle(false); landing(d.user.role) }} />}
    </AuthLayout>
  )
}

function DemoAccounts({ onPick }) {
  return (
    <div className="demo-accounts">
      <p className="demo-accounts__h"><ShieldCheck size={16} aria-hidden="true" /> Prototype demo accounts</p>
      <p className="ch-muted">Any password of 8 or more characters works for these. Pick one to fill the form.</p>
      <ul>
        {DEMO.map(([label, em]) => (
          <li key={em}><button type="button" className="link-btn" onClick={() => onPick(em)}>{label}</button><span className="ch-muted">{em}</span></li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ /signup (social entrepreneurs only) */
const SIGNUP_FIELD = { invalid_name: 'name', invalid_email: 'email', email_taken: 'email', weak_password: 'password' }

export function SignUp() {
  const [params] = useSearchParams()
  const next = params.get('next')
  const { user } = useSession()
  const act = useAct()
  const landing = useLanding(next)
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [google, setGoogle] = useState(false)
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); setError(null) }

  const submit = (e) => {
    e.preventDefault()
    setError(null)
    const r = act('signUpSE', f)
    if (!r.ok) {
      const field = SIGNUP_FIELD[r.error.code]
      if (field && r.error.code !== 'email_taken') setErrors({ [field]: r.error.message }); else setError(r.error)
      return
    }
    landing(r.data.role)
  }

  return (
    <AuthLayout eyebrow="Host an event" title="Create your host account." lede="Social entrepreneurs host events for a verified nonprofit. Guests can join and give without an account, and nonprofits join by invitation."
      aside={<div className="demo-accounts"><p className="demo-accounts__h"><BadgeCheck size={16} aria-hidden="true" /> What happens next</p><ol className="plain-list plain-list--num"><li>Pick a verified nonprofit and tell your story.</li><li>The nonprofit approves your event.</li><li>You run the room and check people in.</li></ol></div>}>
      {user && user.role !== ROLES.GUEST ? <AlreadySignedIn user={user} /> : (
        <form onSubmit={submit} noValidate className="stack" aria-label="Create your host account">
          <FormError error={error} />
          <Field id="su-name" label="Your name" error={errors.name}>
            <input {...fieldProps('su-name', errors.name)} autoComplete="name" value={f.name} onChange={set('name')} autoFocus />
          </Field>
          <Field id="su-email" label="Email" error={errors.email}>
            <input {...fieldProps('su-email', errors.email)} type="email" autoComplete="email" value={f.email} onChange={set('email')} />
          </Field>
          <Field id="su-password" label="Password" hint="At least 8 characters." error={errors.password}>
            <input {...fieldProps('su-password', errors.password)} type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
          </Field>
          <button className="ch-btn ch-btn--primary ch-btn--block">Create account</button>
          <p className="or"><span>or</span></p>
          <button type="button" className="ch-btn ch-btn--secondary ch-btn--block" onClick={() => setGoogle(true)}><GoogleMark /> Sign up with Google</button>
          <p className="ch-muted auth-switch">Already have an account? <Link to={`/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Sign in</Link></p>
        </form>
      )}
      {google && <GoogleDialog onClose={() => setGoogle(false)} onDone={(d) => { setGoogle(false); landing(d.user.role) }} />}
    </AuthLayout>
  )
}

/* ------------------------------------------------------------------ /about-you */
export function AboutYou() {
  const { user } = useSession()
  const act = useAct()
  const toast = useToast()
  const loc = useLocation()
  const [f, setF] = useState(() => ({ name: user?.name ?? '', phone: user?.phone ?? '', city: user?.city ?? '', bio: user?.bio ?? '' }))
  const [errors, setErrors] = useState({})
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(loc.pathname)}`} replace />
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }

  const submit = (e) => {
    e.preventDefault()
    if (f.phone && !/^[\d\s()+.-]{7,20}$/.test(f.phone)) { setErrors({ phone: 'That phone number does not look right.' }); return }
    const r = act('updateProfile', f)
    if (!r.ok) { setErrors({ name: r.error.message }); return }
    setErrors({})
    toast('Profile saved', 'ok')
  }

  return (
    <AuthLayout eyebrow="About you" title="Your details." lede="Other people see your first name and last initial. Hosts and nonprofits only see what you share here."
      aside={(
        <div className="demo-accounts">
          <p className="demo-accounts__h">Your account</p>
          <p><strong>{user.email}</strong></p>
          <p className="ch-muted">{ROLE_LABEL[user.role]}</p>
          <p><Link to="/saved">Saved events and tickets</Link></p>
          {user.role === ROLES.SE && <p><Link to={`/organizers/${user.id}`}>Your public host profile</Link></p>}
        </div>
      )}>
      <form onSubmit={submit} noValidate className="stack" aria-label="Edit your details">
        <Field id="ay-name" label="Name" error={errors.name}>
          <input {...fieldProps('ay-name', errors.name)} autoComplete="name" value={f.name} onChange={set('name')} />
        </Field>
        <Field id="ay-email" label="Email" hint="Your email is how we send tickets and receipts, so it cannot be changed here.">
          <input {...fieldProps('ay-email')} type="email" value={user.email} readOnly />
        </Field>
        <Field id="ay-phone" label="Phone (optional)" hint="Only used if a host needs to reach you about an event." error={errors.phone}>
          <input {...fieldProps('ay-phone', errors.phone)} type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
        </Field>
        <Field id="ay-city" label="City (optional)">
          <input {...fieldProps('ay-city')} autoComplete="address-level2" value={f.city} onChange={set('city')} />
        </Field>
        <Field id="ay-bio" label="Short bio (optional)" hint={`${f.bio.length} of 280 characters`}>
          <textarea {...fieldProps('ay-bio')} className="ch-field__input idea" rows={4} maxLength={280} value={f.bio} onChange={set('bio')} />
        </Field>
        <button className="ch-btn ch-btn--primary">Save details</button>
      </form>
    </AuthLayout>
  )
}

/* ------------------------------------------------------------------ /accept-invite?token= */
export function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const s = useDomain()
  const { now } = useSession()
  const act = useAct()
  const nav = useNavigate()
  const toast = useToast()
  const [f, setF] = useState({ name: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [problem, setProblem] = useState(null) // 404 | 410, from the engine when the form is submitted
  const [done, setDone] = useState(false)

  const np = token ? Object.values(s.nonprofits).find((n) => n.invite?.token === token) : null
  let status = null
  if (!token) status = 404
  else if (!np) status = Object.values(s.nonprofits).some((n) => n.inviteHistory?.includes(token)) ? 410 : 404
  else if (np.invite.usedAt || new Date(np.invite.expiresAt) < now) status = 410
  status = problem ?? status

  if (done) return null
  if (status) return <InviteProblem status={status} />

  const admin = Object.values(s.users).find((u) => u.role === ROLES.NP && u.nonprofitId === np?.id)
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }

  const submit = (e) => {
    e.preventDefault()
    if (f.password && f.password !== f.confirm) { setErrors({ confirm: 'The two passwords do not match.' }); return }
    const r = act('acceptInvite', { token, name: f.name, password: f.password })
    if (!r.ok) {
      const { code, message } = r.error
      if (code === 'invite_not_found') setProblem(404)
      else if (code === 'invite_expired') setProblem(410)
      else if (code === 'invalid_name') setErrors({ name: message })
      else if (code === 'weak_password') setErrors({ password: message })
      else toast(message, 'error')
      return
    }
    setDone(true)
    toast(`Welcome to Charity Hub, ${r.data.user.name.split(' ')[0]}`, 'ok')
    nav('/np', { replace: true })
  }

  return (
    <AuthLayout eyebrow="Nonprofit invite" title={`Set up ${np.name} on Charity Hub.`} lede="You were invited to run this nonprofit’s page. Choose a password to finish. After that you can add your documents and connect Stripe."
      aside={(
        <div className="demo-accounts">
          <p className="demo-accounts__h"><BadgeCheck size={16} aria-hidden="true" /> {np.name}</p>
          <p className="ch-muted">{np.cause || np.category}</p>
          {np.ein && <p>EIN {np.ein}</p>}
          {(np.invite.email || admin?.email) && <p>Invite sent to <strong>{np.invite.email ?? admin.email}</strong></p>}
          <p className="ch-muted">This link works once and expires {new Date(np.invite.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.</p>
        </div>
      )}>
      <form onSubmit={submit} noValidate className="stack" aria-label="Accept invite">
        <Field id="ai-name" label="Your name" error={errors.name}>
          <input {...fieldProps('ai-name', errors.name)} autoComplete="name" value={f.name} onChange={set('name')} autoFocus />
        </Field>
        <Field id="ai-password" label="Choose a password" hint="At least 8 characters." error={errors.password}>
          <input {...fieldProps('ai-password', errors.password)} type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
        </Field>
        <Field id="ai-confirm" label="Confirm password" error={errors.confirm}>
          <input {...fieldProps('ai-confirm', errors.confirm)} type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} />
        </Field>
        <button className="ch-btn ch-btn--primary ch-btn--block">Accept invite and continue</button>
      </form>
    </AuthLayout>
  )
}

function InviteProblem({ status }) {
  const gone = status === 410
  return (
    <section className="page-head page-head--center">
      <div className="wrap">
        <p className="ch-eyebrow">{gone ? 'Invite expired' : 'Invite not found'}</p>
        <h1 className="h-display-3">{gone ? 'This invite link was already used or has expired' : 'We could not find that invite'}</h1>
        <p className="lede">{gone ? 'Invite links work once. If you already set your password, sign in. Otherwise ask your Charity Hub contact to send a new link.' : 'Check that you opened the full link from your email, or ask your Charity Hub contact for a new one.'}</p>
        <p className="page-head__cta">
          <Link to="/signin" className="ch-btn ch-btn--primary">Sign in</Link>{' '}
          <Link to="/" className="ch-btn ch-btn--secondary">Back to home</Link>
        </p>
      </div>
    </section>
  )
}
