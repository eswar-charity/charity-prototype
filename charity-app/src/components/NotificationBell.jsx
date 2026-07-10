import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

export const SE_FEED_NOTIFICATIONS = [
  { id: 1, title: 'Neon Night Run is live', body: 'Doors are open — 87 people joined', time: '2m ago', unread: true, route: '/guest/event/live' },
  { id: 2, title: '3 new backers', body: 'Your Coastal Cleanup event gained support', time: '1h ago', unread: true, route: '/live-dashboard' },
  { id: 3, title: 'Event approved', body: 'Ocean Conservancy approved your submission', time: 'Yesterday', unread: false, route: '/approval' },
  { id: 4, title: 'New chat activity', body: 'Maya and 4 others are in the thread', time: '2d ago', unread: false, route: '/guest/event/live' },
];

export const NP_NOTIFICATIONS = [
  { id: 1, title: 'New event request', body: "Maya R. wants to run 'Coastal Cleanup Wave 2'", time: '2h ago', unread: true, route: '/np/approvals/review' },
  { id: 2, title: 'Content flagged', body: "Comment in 'Books for Bright Minds' needs review", time: '5h ago', unread: true, route: '/np/approvals' },
  { id: 3, title: 'Settlement ready', body: '$12,480 available for payout via Stripe', time: 'Yesterday', unread: false, route: '/np/activity' },
  { id: 4, title: '87 new supporters', body: 'Coastal Cleanup Drive gained backing this week', time: '2d ago', unread: false, route: '/guest/event/live' },
];

export default function NotificationBell({
  items,
  bellSize = 22,
  buttonClassName = 'np-notify-btn',
  panelClassName = '',
  iconColor = 'var(--dark)',
}) {
  const navigate = useNavigate();
  const [hasAlerts, setHasAlerts] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const wrapRef = useRef(null);

  const unreadCount = items.filter((n) => n.unread).length;

  const togglePanel = () => {
    setShowPanel((open) => {
      if (!open) setHasAlerts(false);
      return !open;
    });
  };

  const openItem = (route) => {
    setShowPanel(false);
    navigate(route);
  };

  useEffect(() => {
    if (!showPanel) return undefined;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [showPanel]);

  return (
    <div className="notify-wrap" ref={wrapRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-label="Notifications"
        aria-expanded={showPanel}
        onClick={togglePanel}
      >
        <Bell size={bellSize} color={iconColor} />
        {hasAlerts && unreadCount > 0 && <span className="np-notify-dot" />}
      </button>

      {showPanel && (
        <div className={`notify-panel${panelClassName ? ` ${panelClassName}` : ''}`} role="menu" aria-label="Notifications">
          <div className="notify-panel-head">
            <p className="notify-panel-title">Notifications</p>
            {unreadCount > 0 && (
              <span className="notify-panel-count">{unreadCount} new</span>
            )}
          </div>
          <ul className="notify-list">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notify-item${n.unread ? ' unread' : ''}`}
                  onClick={() => openItem(n.route)}
                >
                  <span className="notify-item-dot" aria-hidden={!n.unread} />
                  <span className="notify-item-body">
                    <span className="notify-item-title">{n.title}</span>
                    <span className="notify-item-text">{n.body}</span>
                    <span className="notify-item-time">{n.time}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
