import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Building2, CalendarRange,
  AlertTriangle, ScrollText, Search, Bell, Menu, LogOut, ExternalLink,
} from 'lucide-react';
import { adminStats, adminUser } from '../../data/adminData';
import Logo from '../Logo';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'review', label: 'Review Queue', icon: ClipboardCheck, path: '/admin/review', badge: adminStats.reviewQueue },
  { id: 'nonprofits', label: 'Nonprofits', icon: Building2, path: '/admin/nonprofits' },
  { id: 'events', label: 'Events', icon: CalendarRange, path: '/admin/events' },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, path: '/admin/exceptions', badge: adminStats.openExceptions },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, path: '/admin/audit' },
];

export default function AdminLayout({ active, title, eyebrow = 'Charity Hub Admin', actions, children }) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const close = () => setNavOpen(false);

  return (
    <div className={`adm-root ${navOpen ? 'nav-open' : ''}`}>
      <div className="adm-shell">
        <div className="adm-scrim" onClick={close} />

        <aside className="adm-sidebar">
          <div>
            <div className="adm-brand">
              <Logo height={24} tone="light" />
            </div>
            <span className="adm-brand-sub">Admin Portal</span>

            <nav className="adm-nav">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`adm-nav-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => { navigate(item.path); close(); }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge ? <span className="adm-nav-badge">{item.badge}</span> : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="adm-sidebar-foot">
            <button className="adm-nav-item" onClick={() => navigate('/')}>
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
            <div className="adm-user">
              <div className="adm-user-avatar">{adminUser.initials}</div>
              <div>
                <p className="adm-user-name">{adminUser.name}</p>
                <p className="adm-user-role">{adminUser.role}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="adm-main">
          <div className="adm-utility">
            <span>Governance &amp; Operations · Human-in-the-loop</span>
            <div className="adm-utility-right">
              <button onClick={() => navigate('/guest/feed')}>
                View public site <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>

          <div className="adm-topbar">
            <div className="adm-topbar-brand-row">
              <button className="adm-icon-btn adm-menu-btn" aria-label="Open menu" onClick={() => setNavOpen(true)}>
                <Menu size={18} />
              </button>
              <Logo height={22} tone="light" className="adm-topbar-logo" />
              <button
                type="button"
                className="adm-icon-btn adm-topbar-bell-mobile"
                aria-label="Notifications"
                onClick={() => navigate('/admin/review')}
              >
                <Bell size={17} />
                <span className="adm-dot" />
              </button>
            </div>

            <div className="adm-topbar-titles">
              <span className="adm-eyebrow">{eyebrow}</span>
              <h1 className="adm-page-title">{title}</h1>
            </div>

            <div className="adm-topbar-actions">
              <div className="adm-search">
                <Search size={15} />
                <input placeholder="Search nonprofits, events, IDs…" aria-label="Search" />
              </div>
              <button
                type="button"
                className="adm-icon-btn adm-topbar-bell-desktop"
                aria-label="Notifications"
                onClick={() => navigate('/admin/review')}
              >
                <Bell size={17} />
                <span className="adm-dot" />
              </button>
              {actions}
            </div>
          </div>

          <div className="adm-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* Small shared presentational helpers reused across admin screens. */
export function Badge({ tone = 'muted', children, dot = false }) {
  return (
    <span className={`adm-badge ${tone}`}>
      {dot && <span className="adm-badge-dot" />}
      {children}
    </span>
  );
}
