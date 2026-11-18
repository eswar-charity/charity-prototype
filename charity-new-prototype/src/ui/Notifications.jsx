import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useAct, useDomain, useSession } from '../domain/store.jsx'
import { notificationsFor, unreadCount } from '../domain/selectors.js'
import { PageHeader, Empty, timeAgo } from './kit.jsx'

export function NotificationBell() {
  const s = useDomain()
  const { user, now } = useSession()
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
  const unread = unreadCount(s, user.id)
  const list = notificationsFor(s, user.id).slice(0, 6)
  const go = (n) => { act('markNotificationRead', { id: n.id }); setOpen(false); if (n.link) nav(n.link) }

  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className="bell__count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="popover bell__pop" role="dialog" aria-label="Notifications">
          <div className="popover__head">
            <strong>Notifications</strong>
            {unread > 0 && <button className="link-btn" onClick={() => act('markAllNotificationsRead')}><CheckCheck size={16} aria-hidden="true" /> Mark all read</button>}
          </div>
          {list.length === 0 ? <p className="ch-muted popover__empty">Nothing yet.</p> : (
            <ul className="notif-list">
              {list.map((n) => (
                <li key={n.id}>
                  <button className={`notif ${n.read ? '' : 'is-unread'}`} onClick={() => go(n)}>
                    <span className="notif__title">{n.title}</span>
                    <span className="notif__body">{n.body}</span>
                    <span className="notif__time">{timeAgo(n.createdAt, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to="/notifications" className="popover__foot" onClick={() => setOpen(false)}>See all notifications</Link>
        </div>
      )}
    </div>
  )
}

export function NotificationsPage() {
  const s = useDomain()
  const { user, now } = useSession()
  const act = useAct()
  const nav = useNavigate()
  if (!user) return null
  const list = notificationsFor(s, user.id)
  const unread = unreadCount(s, user.id)
  return (
    <div className="wrap wrap--narrow page-pad">
      <PageHeader eyebrow="Notifications" title="What’s new"
        actions={unread > 0 && <button className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => act('markAllNotificationsRead')}>Mark all read</button>} />
      {list.length === 0 ? <Empty title="Nothing yet">When something happens on your events, donations or approvals, it shows up here.</Empty> : (
        <ul className="notif-page">
          {list.map((n) => (
            <li key={n.id}>
              <button className={`notif notif--page ${n.read ? '' : 'is-unread'}`} onClick={() => { act('markNotificationRead', { id: n.id }); if (n.link) nav(n.link) }}>
                <span className="notif__title">{n.title}</span>
                <span className="notif__body">{n.body}</span>
                <span className="notif__time">{timeAgo(n.createdAt, now)}{n.read ? '' : ' · unread'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
