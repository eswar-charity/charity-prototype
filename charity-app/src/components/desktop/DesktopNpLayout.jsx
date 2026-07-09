import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, ClipboardList, BarChart3, Wallet, Settings, Search, Bell } from 'lucide-react';
import Logo from '../Logo';

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

const NAV = [
  { id: 'home', label: 'Home', icon: Home, path: '/np/home' },
  { id: 'events', label: 'Events', icon: Calendar, path: '/guest/feed' },
  { id: 'approvals', label: 'Approvals', icon: ClipboardList, path: '/np/approvals', badge: 2 },
  { id: 'activity', label: 'Activity', icon: BarChart3, path: '/np/activity' },
  { id: 'financials', label: 'Financials', icon: Wallet, path: '/np/activity' },
];

export default function DesktopNpSidebar({ active }) {
  const navigate = useNavigate();

  return (
    <aside className="dsk-np-sidebar">
      <div>
        <div className="dsk-np-brand">
          <Logo height={22} tone="dark" />
          <span className="dsk-np-brand-sub">Launchpad</span>
        </div>

        <div className="dsk-np-org-row">
          <div className="dsk-np-org-logo">OC</div>
          <div>
            <p className="dsk-np-org-name">Ocean Conservancy</p>
            <p className="dsk-np-org-verified">✓ Verified</p>
          </div>
        </div>

        <nav className="dsk-np-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`dsk-np-nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.badge ? <span className="dsk-np-nav-badge">{item.badge}</span> : null}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="dsk-np-sidebar-footer">
        <div className="dsk-np-nav-item" onClick={() => navigate('/np/settings/autopilot')}>
          <Settings size={17} />
          <span>Settings</span>
        </div>
        <button className="dsk-np-new-event-btn" onClick={() => navigate('/event/step-1')}>New Event</button>
        <div className="dsk-np-user-row">
          <div className="dsk-np-user-avatar">AM</div>
          <div>
            <p className="dsk-np-user-name">Alex Mercer</p>
            <p className="dsk-np-user-role">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function DesktopNpLayout({ active, title, children }) {
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  return (
    <div className="dsk-page dsk-np-page">
      <div className="dsk-np-shell">
        <DesktopNpSidebar active={active} />
        <main className="dsk-np-main">
          <div className="dsk-np-topbar">
            <h1 className="dsk-np-title">{title}</h1>
            <div className="dsk-np-topbar-actions">
              <div className="dsk-search dsk-np-search"><Search size={15} /><input placeholder="Search events..." /></div>
              <button
                type="button"
                className="dsk-np-bell"
                aria-label="Notifications"
                onClick={() => notify('You’re all caught up — no new alerts')}
              >
                <Bell size={18} />
              </button>
            </div>
          </div>
          {children}
        </main>
      </div>
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </div>
  );
}
