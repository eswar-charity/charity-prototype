import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, ClipboardList, BarChart3, Wallet, Settings, Search } from 'lucide-react';
import Logo from '../Logo';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../auth/AuthContext';
import { getNpLaunchpad } from '../../api/dashboards';
import { resetDraft } from '../../hooks/useCreateEventDraft';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const NAV = [
  { id: 'home', label: 'Home', icon: Home, path: '/np/home' },
  { id: 'events', label: 'Events', icon: Calendar, path: '/guest/feed' },
  { id: 'approvals', label: 'Approvals', icon: ClipboardList, path: '/np/approvals' },
  { id: 'activity', label: 'Activity', icon: BarChart3, path: '/np/activity' },
  { id: 'financials', label: 'Financials', icon: Wallet, path: '/np/financials' },
];

export default function DesktopNpSidebar({ active }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [org, setOrg] = useState(null);

  const cancelledRef = useRef(false);
  const refreshBadge = useCallback(({ silent = false } = {}) => {
    getNpLaunchpad()
      .then((data) => {
        if (cancelledRef.current) return;
        setOrg(data?.org ?? null);
        setPendingApprovals(Number(data?.stats?.pending_approvals) || 0);
      })
      .catch(() => {
        // Keep showing the last known count if a background refresh fails.
        if (!cancelledRef.current && !silent) {
          setOrg(null);
          setPendingApprovals(0);
        }
      });
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    refreshBadge();
    return () => { cancelledRef.current = true; };
  }, [active, refreshBadge]);

  // The "Approvals" badge must track new requests, not the count at page load.
  useAutoRefresh(() => refreshBadge({ silent: true }), { intervalMs: 20000 });

  const orgName = org?.name || 'Your organization';
  const orgInitials = org?.initials || (orgName.slice(0, 2).toUpperCase());
  const userName = user?.name || 'Admin';
  const userInitials = user?.initials || userName.slice(0, 2).toUpperCase();
  const userRole = user?.role === 'np_admin' ? 'Admin' : (user?.role || 'Admin');

  return (
    <aside className="dsk-np-sidebar">
      <div>
        <div className="dsk-np-brand">
          <Logo height={22} tone="dark" />
          <span className="dsk-np-brand-sub">Launchpad</span>
        </div>

        <div className="dsk-np-org-row">
          <div
            className="dsk-np-org-logo"
            style={org?.color ? { background: org.color } : undefined}
          >
            {orgInitials}
          </div>
          <div>
            <p className="dsk-np-org-name">{orgName}</p>
            <p className="dsk-np-org-verified">{org?.verified === false ? 'Unverified' : '✓ Verified'}</p>
          </div>
        </div>

        <nav className="dsk-np-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            const showBadge = item.id === 'approvals' && pendingApprovals != null && pendingApprovals > 0;
            return (
              <div
                key={item.id}
                className={`dsk-np-nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(item.path);
                  }
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {showBadge ? <span className="dsk-np-nav-badge">{pendingApprovals}</span> : null}
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
        <button
          type="button"
          className="dsk-np-new-event-btn"
          onClick={() => {
            resetDraft();
            navigate('/event/step-1');
          }}
        >
          New Event
        </button>
        <div className="dsk-np-user-row">
          <div className="dsk-np-user-avatar">{userInitials}</div>
          <div>
            <p className="dsk-np-user-name">{userName}</p>
            <p className="dsk-np-user-role">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function DesktopNpLayout({ active, title, children }) {
  return (
    <div className="dsk-page dsk-np-page">
      <div className="dsk-np-shell">
        <DesktopNpSidebar active={active} />
        <main className="dsk-np-main">
          <div className="dsk-np-topbar">
            <h1 className="dsk-np-title">{title}</h1>
            <div className="dsk-np-topbar-actions">
              <div className="dsk-search dsk-np-search"><Search size={15} /><input placeholder="Search events..." /></div>
              <NotificationBell
                bellSize={18}
                buttonClassName="dsk-np-bell"
                panelClassName="notify-panel--desktop"
              />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
