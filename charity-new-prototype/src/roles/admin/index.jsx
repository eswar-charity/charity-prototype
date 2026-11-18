import { LayoutDashboard, ClipboardList, Flag, Building2, CalendarDays, AlertTriangle, CreditCard, ShieldCheck, ScrollText } from 'lucide-react'
import { useDomain } from '../../domain/store.jsx'
import { adminMetrics } from '../../domain/selectors.js'
import '../../styles/admin.css'
import Dashboard from './Dashboard.jsx'
import ReviewQueue from './ReviewQueue.jsx'
import ReviewDetail from './ReviewDetail.jsx'
import Nonprofits from './Nonprofits.jsx'
import NonprofitDetail from './NonprofitDetail.jsx'
import Events from './Events.jsx'
import Exceptions from './Exceptions.jsx'
import Audit from './Audit.jsx'
import Moderation from './Moderation.jsx'
import Payments from './Payments.jsx'
import Privacy from './Privacy.jsx'

/** A nav label with a live count. The role shell renders `label` as-is, so the count lives here. */
function Counted({ text, pick }) {
  const n = pick(adminMetrics(useDomain()))
  return (
    <>
      {text}
      {n > 0 && (
        <>
          <span className="adm-navcount" aria-hidden="true">{n}</span>
          <span className="ch-sr">, {n} waiting</span>
        </>
      )}
    </>
  )
}

export const roleLabel = 'Charity Hub admin'
export const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/review', label: <Counted text="Review queue" pick={(m) => m.pendingReviews} />, icon: ClipboardList },
  { to: '/admin/moderation', label: <Counted text="Moderation" pick={(m) => m.flaggedContent} />, icon: Flag },
  { to: '/admin/nonprofits', label: 'Nonprofits', icon: Building2 },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/exceptions', label: 'Exceptions', icon: AlertTriangle },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/privacy', label: 'Privacy', icon: ShieldCheck },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
]

/** Relative to /admin. */
export const routes = [
  { index: true, element: <Dashboard /> },
  { path: 'review', element: <ReviewQueue /> },
  { path: 'review/:id', element: <ReviewDetail /> },
  { path: 'nonprofits', element: <Nonprofits /> },
  { path: 'nonprofits/:id', element: <NonprofitDetail /> },
  { path: 'events', element: <Events /> },
  { path: 'exceptions', element: <Exceptions /> },
  { path: 'audit', element: <Audit /> },
  { path: 'moderation', element: <Moderation /> },
  { path: 'payments', element: <Payments /> },
  { path: 'privacy', element: <Privacy /> },
  { path: '*', element: <NotFound /> },
]

function NotFound() {
  return (
    <section className="panel-section">
      <h1 className="page-header__title">Page not found</h1>
      <p className="ch-muted">That admin page does not exist. Use the menu to pick a section.</p>
    </section>
  )
}
