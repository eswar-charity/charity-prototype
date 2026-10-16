import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { listNotifications, markNotificationRead } from '../api/notifications';

const TITLES = {
  event_approved: 'Event approved',
  event_rejected: 'Event rejected',
  changes_requested: 'Changes requested',
  approval_requested: 'Approval needed',
  donation_received: 'New donation',
};

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
    case 'approval_requested':
      return '/np/approvals';
    default:
      return undefined;
  }
}

function mapNotification(raw) {
  return {
    id: raw.id,
    title: TITLES[raw.type] ?? 'Notification',
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
