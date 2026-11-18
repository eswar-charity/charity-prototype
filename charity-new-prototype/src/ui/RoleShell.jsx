import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, UserRound, Globe, Menu, X } from 'lucide-react'
import { Logo, Avatar } from '../components/Brand.jsx'
import { NotificationBell } from './Notifications.jsx'
import { NoticeBar } from './Guards.jsx'
import { useAct, useDomain, useSession } from '../domain/store.jsx'
import { ROLE_LABEL, ROLES } from '../domain/engine.js'

/** Account menu shared by the public header and every role shell. */
export function AccountMenu({ onStage = false }) {
  const { user } = useSession()
  const act = useAct()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  if (!user) return null
  const profile = user.role === ROLES.SE ? '/se/profile' : user.role === ROLES.NP ? '/np/profile' : user.role === ROLES.GUEST ? '/about-you' : null
  const home = { guest_lead: '/', se: '/se', np_admin: '/np', platform_admin: '/admin' }[user.role]
  const out = () => { act('signOut'); setOpen(false); nav('/') }
  return (
    <div className="acct" ref={ref}>
      <button className={`acct__btn ${onStage ? 'acct__btn--stage' : ''}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <Avatar name={user.name} />
        <span className="acct__name">{user.name.split(' ')[0]}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="popover acct__pop" role="menu">
          <div className="popover__head acct__who"><strong>{user.name}</strong><span className="ch-muted">{ROLE_LABEL[user.role]}</span></div>
          <Link role="menuitem" to={home} onClick={() => setOpen(false)}><Globe size={16} aria-hidden="true" /> {user.role === ROLES.GUEST ? 'Home' : 'My dashboard'}</Link>
          {profile && <Link role="menuitem" to={profile} onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" /> {user.role === ROLES.GUEST ? 'About you' : 'Profile'}</Link>}
          <Link role="menuitem" to="/" onClick={() => setOpen(false)}><Globe size={16} aria-hidden="true" /> Public site</Link>
          <button role="menuitem" onClick={out}><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </div>
      )}
    </div>
  )
}

/**
 * Signed-in shell for SE, nonprofit and admin areas: header (logo, role, bell, account) plus a left nav
 * (a scrolling tab bar on mobile). `nav` items: { to, label, icon?, end?, badge? }.
 */
export default function RoleShell({ nav, roleLabel }) {
  const [open, setOpen] = useState(false)
  const s = useDomain()
  const { user } = useSession()
  // `badge` may be a number or a function (state, user) => number, so counts stay live.
  const badgeOf = (n) => (typeof n.badge === 'function' ? n.badge(s, user) : n.badge)
  return (
    <div className="ch app shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="shell__bar">
        <div className="shell__bar-in">
          <Logo />
          <span className="shell__role">{roleLabel}</span>
          <div className="shell__spacer" />
          <NotificationBell />
          <AccountMenu />
          <button className="icon-btn shell__menu" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="shell-nav" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </header>
      <NoticeBar />
      <div className="shell__body">
        <nav id="shell-nav" className={`shell__nav ${open ? 'is-open' : ''}`} aria-label={`${roleLabel} navigation`}>
          <ul>
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} onClick={() => setOpen(false)} className="shell__link">
                  {n.icon && <n.icon size={18} aria-hidden="true" />}
                  <span>{n.label}</span>
                  {badgeOf(n) ? <span className="shell__badge" aria-label={`${badgeOf(n)} waiting`}>{badgeOf(n)}</span> : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" tabIndex={-1} className="shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
