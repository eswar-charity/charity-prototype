import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Mail, Phone, MapPin, ChevronDown } from 'lucide-react'
import { Logo } from './Brand.jsx'
import PrototypeSwitcher from './PrototypeSwitcher.jsx'

const NAV = [
  { to: '/', label: 'Discover', end: true },
  { to: '/nonprofits', label: 'Nonprofits' },
  { to: '/causes', label: 'Causes' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>

      <div className="utility-bar">
        <div className="container utility-inner">
          <span>Empowering Charity Events</span>
          <span className="utility-links">
            <a href="mailto:info@charityhub.com"><Mail size={12} aria-hidden="true" /> info@charityhub.com</a>
            <a href="tel:+12016943576" className="hide-sm"><Phone size={12} aria-hidden="true" /> (201) 694-3576</a>
          </span>
        </div>
      </div>

      <header className="nav-bar">
        <div className="container nav-inner">
          <Logo />
          <button
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
          <nav id="primary-nav" aria-label="Primary" className={`nav-links ${open ? 'is-open' : ''}`}>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">{n.label}</NavLink>
            ))}
            <Link to="/#how-it-works" className="nav-link">How it works <ChevronDown size={14} aria-hidden="true" /></Link>
            <Link to="/create" className="btn btn-primary btn-sm nav-cta">Create an event</Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
      <PrototypeSwitcher />
    </>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p className="footer-tag">Empowering Charity Events through Competition For Good®</p>
        </div>
        <div>
          <h2 className="footer-h">Explore</h2>
          <ul>
            <li><Link to="/">Discover events</Link></li>
            <li><Link to="/nonprofits">Nonprofits</Link></li>
            <li><Link to="/causes">Causes</Link></li>
            <li><Link to="/create">Create an event</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="footer-h">Contact</h2>
          <ul className="footer-contact">
            <li><MapPin size={14} aria-hidden="true" /> 60 Broad Street, 5th Floor, Manhattan, NY 10004</li>
            <li><Phone size={14} aria-hidden="true" /> (201) 694-3576</li>
            <li><Mail size={14} aria-hidden="true" /> info@charityhub.com</li>
          </ul>
        </div>
      </div>
      <div className="container footer-fine">
        UI prototype with static demo data. No payments are processed. © Charity Hub
      </div>
    </footer>
  )
}
