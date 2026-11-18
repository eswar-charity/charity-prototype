import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from './Brand.jsx'
import PrototypeSwitcher from './PrototypeSwitcher.jsx'

const NAV = [
  { to: '/#discover', label: 'Find events', match: '/' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/nonprofits', label: 'Nonprofits' },
  { to: '/causes', label: 'Causes' },
]

/** Routes whose first screen is a stage-navy hero: the nav starts clean over it. */
const isStageRoute = (p) => p === '/' || /^\/events\/[^/]+$/.test(p) || /^\/nonprofits\/[^/]+$/.test(p)

export default function Layout() {
  const { pathname, hash } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const stage = isStageRoute(pathname)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    setOpen(false)
    if (hash) {
      // let the page mount, then bring the anchor into view (the nav is sticky, so offset it)
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  const onStage = stage && !scrolled
  return (
    <div className="ch app">
      <a href="#main" className="skip-link">Skip to content</a>

      <header
        className={`ch-nav app-nav ${stage ? 'ch-stage' : 'ch-nav--light'} ${scrolled ? 'ch-nav--scrolled' : ''} ${
          stage ? 'app-nav--over' : ''
        }`}
      >
        <div className="ch-nav__inner">
          <Logo onStage={onStage || (stage && scrolled)} />
          <ul id="primary-nav" className={`ch-nav__links ${open ? 'is-open' : ''}`} aria-label="Primary">
            {NAV.map((n) => (
              <li key={n.label}>
                {n.to.startsWith('/#') ? (
                  <Link to={n.to}>{n.label}</Link>
                ) : (
                  <NavLink to={n.to}>{n.label}</NavLink>
                )}
              </li>
            ))}
            <li className="app-nav__cta-mobile">
              <Link to="/create">Host an event</Link>
            </li>
          </ul>
          <Link to="/create" className="ch-btn ch-btn--primary ch-btn--sm ch-nav__cta app-nav__cta">Host an event</Link>
          <button className="ch-nav__menu" aria-expanded={open} aria-controls="primary-nav"
            aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className={stage ? 'app-main--stage' : ''}>
        <Outlet />
      </main>

      <Footer />
      <PrototypeSwitcher />
    </div>
  )
}

function Footer() {
  return (
    <footer className="ch-footer">
      <div className="ch-footer__inner">
        <div className="ch-footer__brand">
          <Logo />
          <p>Creative events, real crowds, a cause that wins.</p>
        </div>
        <nav aria-label="Events">
          <h4>Events</h4>
          <ul>
            <li><Link to="/#discover">Find events</Link></li>
            <li><Link to="/#how-it-works">How it works</Link></li>
            <li><Link to="/#leaderboard">Leaderboard</Link></li>
          </ul>
        </nav>
        <nav aria-label="Hosts">
          <h4>Hosts</h4>
          <ul>
            <li><Link to="/create">Host an event</Link></li>
            <li><Link to="/#invite">Email us your idea</Link></li>
          </ul>
        </nav>
        <nav aria-label="Nonprofits">
          <h4>Nonprofits</h4>
          <ul>
            <li><Link to="/nonprofits">Verified partners</Link></li>
            <li><Link to="/causes">Causes</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <h4>Company</h4>
          <ul>
            <li><a href="mailto:peter.naughton@charityhub.com">Contact</a></li>
          </ul>
        </nav>
      </div>
      <div className="ch-footer__bottom">
        <span>© 2026 CharityHub, LLC. Competition for Good<sup>®</sup> is a registered mark.</span>
        <span>UI prototype. Counts, names and live states are demo content, and no payments are processed.</span>
      </div>
    </footer>
  )
}
