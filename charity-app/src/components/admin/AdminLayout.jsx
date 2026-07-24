import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Building2, CalendarRange,
  AlertTriangle, ScrollText, Search, Bell, Menu, LogOut, ExternalLink,
} from 'lucide-react';
import { getAdminDashboard, adaptAdminDashboard } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';
import Logo from '../Logo';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'review', label: 'Review Queue', icon: ClipboardCheck, path: '/admin/review', badgeKey: 'reviewQueue' },
  { id: 'nonprofits', label: 'Nonprofits', icon: Building2, path: '/admin/nonprofits' },
  { id: 'events', label: 'Events', icon: CalendarRange, path: '/admin/events' },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, path: '/admin/exceptions', badgeKey: 'openExceptions' },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, path: '/admin/audit' },
];

function formatRole(role) {
  if (!role) return '';
  if (role === 'platform_admin') return 'Platform Admin';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminLayout({ active, title, eyebrow = 'Charity Hub Admin', actions, children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const close = () => setNavOpen(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getAdminDashboard();
        if (!cancelled) setStats(adaptAdminDashboard(raw));
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayUser = {
    name: user?.name ?? 'Admin',
    role: formatRole(user?.role),
    initials: user?.initials ?? '?',
  };

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
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const badge = item.badgeKey && stats ? stats[item.badgeKey] : null;
                return (
                  <button
                    key={item.id}
                    className={`adm-nav-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => { navigate(item.path); close(); }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {badge ? <span className="adm-nav-badge">{badge}</span> : null}
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
              <div className="adm-user-avatar">{displayUser.initials}</div>
              <div>
                <p className="adm-user-name">{displayUser.name}</p>
                <p className="adm-user-role">{displayUser.role}</p>
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
