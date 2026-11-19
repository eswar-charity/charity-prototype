// Prototype-only chrome: switch between demo people, move the clock, run the lifecycle job, reset the data.
// It exists so every role's journey can be walked end to end. Set VITE_HIDE_DEMO=1 to remove it.
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical, X } from 'lucide-react'
import { useDomain, useEngineHandle, useSession, resetDemo } from '../domain/store.jsx'
import { homeFor, ROLE_LABEL } from '../domain/engine.js'
import { applyDemoLink, boot } from '../domain/demoLink.js'
import { useToast } from './kit.jsx'

const QUICK_NP = ['u_np_aspca', 'u_np_unitedway', 'u_np_sierraclub', 'u_np_stjude']

export default function DemoPanel() {
  const s = useDomain()
  const { user, now } = useSession()
  const engine = useEngineHandle()
  const nav = useNavigate()
  const toast = useToast()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const handled = useRef('')
  const hidden = import.meta.env.VITE_HIDE_DEMO === '1'

  // Shareable demo links. The one on first load was applied at start-up (domain/demoLink.js); here we only tidy
  // the address bar for it, and apply any link followed later inside the app.
  useEffect(() => {
    if (hidden) return
    if (handled.current === loc.search) return
    handled.current = loc.search
    const fromBoot = boot.search !== null && boot.search === loc.search
    const cleaned = fromBoot ? (() => { const p = new URLSearchParams(loc.search); p.delete('as'); p.delete('samples'); const r = p.toString(); return r ? `?${r}` : '' })() : applyDemoLink(engine, loc.search)
    if (cleaned === null) return
    nav(`${loc.pathname}${cleaned}${loc.hash}`, { replace: true })
  }, [loc.search]) // eslint-disable-line react-hooks/exhaustive-deps
  if (hidden) return null

  const users = Object.values(s.users)
  const by = (role) => users.filter((u) => u.role === role)
  const signInAs = (id) => {
    const r = engine.dispatch('demoSignIn', { userId: id })
    if (r.ok) { toast(`Signed in as ${r.data.user.name}`); nav(homeFor(r.data.user.role)) }
  }
  const asAdmin = (fn, msg) => {
    const prev = user?.id
    engine.dispatch('demoSignIn', { userId: 'u_admin' })
    const r = fn()
    prev ? engine.dispatch('demoSignIn', { userId: prev }) : engine.dispatch('signOut')
    toast(r.ok ? msg(r.data) : r.error.message, r.ok ? 'ok' : 'error')
  }
  const advance = (days) => asAdmin(() => engine.dispatch('advanceClock', { days }), () => `Clock moved forward ${days} day${days > 1 ? 's' : ''}`)
  const lifecycle = () => asAdmin(() => engine.dispatch('runLifecycle'), (d) => `Lifecycle job: ${d.completed} completed, ${d.archived} archived, ${d.failedPayments} payments expired`)
  const msf = Object.values(s.nonprofits).find((n) => n.invite)

  return (
    <div className="demo">
      <button className="demo__btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}><FlaskConical size={16} aria-hidden="true" /> Demo tools</button>
      {open && (
        <div className="demo__panel" role="dialog" aria-label="Demo tools">
          <div className="demo__head">
            <strong>Demo tools</strong>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close demo tools"><X size={18} aria-hidden="true" /></button>
          </div>
          <p className="demo__who">{user ? <>Signed in as <strong>{user.name}</strong> ({ROLE_LABEL[user.role]})</> : 'Browsing as an anonymous guest'}</p>

          <fieldset>
            <legend>Sign in as</legend>
            <div className="demo__row">
              <button onClick={() => { engine.dispatch('signOut'); nav('/') }}>Anonymous guest</button>
              {by('guest_lead').map((u) => <button key={u.id} onClick={() => signInAs(u.id)}>Guest: {u.name}</button>)}
            </div>
            <div className="demo__row">{by('se').map((u) => <button key={u.id} onClick={() => signInAs(u.id)}>SE: {u.name}</button>)}</div>
            <div className="demo__row">
              {QUICK_NP.map((id) => <button key={id} onClick={() => signInAs(id)}>NP: {s.nonprofits[s.users[id].nonprofitId].name.replace(/ Children's Research Hospital| Foundation/, '')}</button>)}
              <select aria-label="Any nonprofit admin" value="" onChange={(e) => e.target.value && signInAs(e.target.value)}>
                <option value="">Other nonprofit…</option>
                {by('np_admin').filter((u) => u.status === 'active').map((u) => <option key={u.id} value={u.id}>{s.nonprofits[u.nonprofitId]?.name}</option>)}
              </select>
            </div>
            <div className="demo__row"><button onClick={() => signInAs('u_admin')}>Admin: Alex Mercer</button></div>
            {msf?.invite && <p className="demo__hint">Invited nonprofit link: <a href={`/accept-invite?token=${msf.invite.token}`}>{msf.name}</a></p>}
          </fieldset>

          <fieldset>
            <legend>Clock · {now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</legend>
            <div className="demo__row">
              <button onClick={() => advance(1)}>+1 day</button>
              <button onClick={() => advance(7)}>+1 week</button>
              <button onClick={() => advance(31)}>+31 days</button>
              <button onClick={lifecycle}>Run lifecycle job</button>
            </div>
          </fieldset>

          {user && (user.role === 'se' || user.role === 'np_admin') && (
            <fieldset>
              <legend>Sample events</legend>
              <div className="demo__row">
                <button onClick={() => { const r = engine.dispatch('demoGenerateEvents', { count: 1000 }); toast(r.ok ? `Added ${r.data.added.toLocaleString()} sample events to your list` : r.error.message, r.ok ? 'ok' : 'error') }}>Add 1,000 sample events</button>
                <button onClick={() => { const r = engine.dispatch('demoRemoveGenerated'); toast(r.ok ? `Removed ${r.data.removed.toLocaleString()} sample events` : r.error.message, r.ok ? 'ok' : 'error') }}>Remove sample events</button>
              </div>
              <p className="demo__hint">Sample events fill your own list so you can try search, filters and pagination. They never show in public feeds or on other roles' screens.</p>
            </fieldset>
          )}

          <div className="demo__row">
            <button className="demo__reset" onClick={() => { resetDemo(engine); nav('/'); toast('Demo data reset') }}>Reset all demo data</button>
          </div>
          <p className="demo__hint">Data is saved in this browser so a journey carries across roles. Demo accounts accept any password of 8+ characters.</p>
        </div>
      )}
    </div>
  )
}
