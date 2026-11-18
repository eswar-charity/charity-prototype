import { Home, ClipboardCheck, CalendarDays, Wallet, Activity as ActivityIcon, Building2, Zap } from 'lucide-react'
import { npQueue } from '../../domain/selectors.js'
import { wizardRoutes } from '../se/wizard/EventWizard.jsx'
import { liveRoutes } from '../se/live/LiveDashboard.jsx'
import '../../styles/np.css'
import { NpGate } from './shared.jsx'
import Launchpad from './Launchpad.jsx'
import Setup from './Setup.jsx'
import { StripeCallback, StripeHosted } from './Stripe.jsx'
import Profile from './Profile.jsx'
import ActivityPage from './Activity.jsx'
import Financials from './Financials.jsx'
import Approvals from './Approvals.jsx'
import ApprovalReview from './ApprovalReview.jsx'
import RequestChanges from './RequestChanges.jsx'
import Autopilot from './Autopilot.jsx'
import Events from './Events.jsx'

export const roleLabel = 'Nonprofit admin'

/** `badge` is a function so the shell keeps the count live: events waiting for this admin's decision. */
const waiting = (s, user) => (user?.nonprofitId ? npQueue(s, user.nonprofitId).length : 0)

export const nav = [
  { to: '/np', label: 'Launchpad', icon: Home, end: true },
  { to: '/np/approvals', label: 'Approvals', icon: ClipboardCheck, badge: waiting },
  { to: '/np/events', label: 'Events', icon: CalendarDays },
  { to: '/np/activity', label: 'Activity', icon: ActivityIcon },
  { to: '/np/financials', label: 'Financials', icon: Wallet },
  { to: '/np/settings/autopilot', label: 'Autopilot', icon: Zap },
  { to: '/np/profile', label: 'Organization', icon: Building2 },
]

/** Paths are relative to /np. */
export const routes = [
  {
    element: <NpGate />,
    children: [
      { index: true, element: <Launchpad /> },
      { path: 'setup', element: <Setup /> },
      { path: 'stripe/hosted', element: <StripeHosted /> },
      { path: 'stripe/callback', element: <StripeCallback /> },
      { path: 'profile', element: <Profile /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'financials', element: <Financials /> },
      { path: 'approvals', element: <Approvals /> },
      { path: 'approvals/:key', element: <ApprovalReview /> },
      { path: 'approvals/:key/request-changes', element: <RequestChanges /> },
      { path: 'settings/autopilot', element: <Autopilot /> },
      { path: 'events', element: <Events /> },
      ...wizardRoutes('/np/events'), // events/new, events/:key/:step (shared with the SE build)
      ...liveRoutes('/np'), // live/:key
      { path: '*', element: <NpNotFound /> },
    ],
  },
]

function NpNotFound() {
  return (
    <div className="empty empty--kit" role="status">
      <p className="empty__title">That page does not exist</p>
      <p className="ch-muted">Use the menu to find what you need.</p>
    </div>
  )
}
