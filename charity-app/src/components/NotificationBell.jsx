import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { listNotifications, markNotificationRead } from '../api/notifications';

export const SE_FEED_NOTIFICATIONS = [
  { id: 1, title: '#NeonNight is live', body: 'Doors are open — join the event', time: '2m ago', unread: true, route: '/event/live/neon-night' },
  { id: 2, title: '3 new backers', body: '#BreakneckRidgeRun gained support', time: '1h ago', unread: true, route: '/live-dashboard' },
  { id: 3, title: 'Event approved', body: 'Hoboken Homeless Home approved your submission', time: 'Yesterday', unread: false, route: '/approval' },
  { id: 4, title: 'New chat activity', body: 'Mike and 4 others are in the thread', time: '2d ago', unread: false, route: '/event/live/breakneck-ridge-run' },
];

export const NP_NOTIFICATIONS = [
  { id: 1, title: 'New event request', body: "Mike Rivera wants to run 'Coastal Cleanup Wave 2'", time: '2h ago', unread: true, route: '/np/approvals/review' },
  { id: 2, title: 'Content flagged', body: "Comment in 'Books for Bright Minds' needs review", time: '5h ago', unread: true, route: '/np/approvals' },
  { id: 3, title: 'Settlement ready', body: '$12,480 available for payout via Stripe', time: 'Yesterday', unread: false, route: '/np/activity' },
  { id: 4, title: '87 new supporters', body: 'Coastal Cleanup Drive gained backing this week', time: '2d ago', unread: false, route: '/guest/event/live/breakneck-ridge-run' },
];

function formatNotificationTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function inferRoute(type) {
  switch (type) {
    case 'event_approved':
    case 'event_rejected':
    case 'changes_requested':
      return '/approval';
    default:
      return undefined;
  }
}

function mapNotification(raw) {
  return {
    id: raw.id,
    title: raw.type ?? 'Notification',
    body: raw.text ?? '',
    unread: !raw.read,
    time: formatNotificationTime(raw.created_at),
    route: inferRoute(raw.type),
  };
}

export default function NotificationBell({
  items,
  bellSize = 22,
  buttonClassName = 'np-notify-btn',
  panelClassName = '',
  iconColor = 'var(--dark)',
}) {
  const navigate = useNavigate();
  const [liveItems, setLiveItems] = useState([]);
  const [hasAlerts, setHasAlerts] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const wrapRef = useRef(null);

  const displayItems = items ?? liveItems;
  const unreadCount = displayItems.filter((n) => n.unread).length;

  useEffect(() => {
    if (items) return undefined;
    let cancelled = false;
    listNotifications()
      .then((data) => {
        if (!cancelled) setLiveItems((data ?? []).map(mapNotification));
      })
      .catch(() => {
        if (!cancelled) setLiveItems([]);
      });
    return () => { cancelled = true; };
  }, [items]);

  const togglePanel = () => {
    setShowPanel((open) => {
      if (!open) setHasAlerts(false);
      return !open;
    });
  };

  const openItem = async (n) => {
    setShowPanel(false);
    if (n.unread) {
      try {
        await markNotificationRead(n.id);
        if (!items) {
          setLiveItems((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)),
          );
        }
      } catch {
        /* keep local state if mark-read fails */
      }
    }
    if (n.route) navigate(n.route);
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
            {displayItems.length === 0 ? (
              <li className="notify-item-empty">No notifications yet</li>
            ) : (
              displayItems.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notify-item${n.unread ? ' unread' : ''}`}
                    onClick={() => openItem(n)}
                  >
                    <span className="notify-item-dot" aria-hidden={!n.unread} />
                    <span className="notify-item-body">
                      <span className="notify-item-title">{n.title}</span>
                      <span className="notify-item-text">{n.body}</span>
                      <span className="notify-item-time">{n.time}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
