import { Home, PlusCircle, FileText, Trophy, User } from 'lucide-react'
import '../../styles/se.css'
import SeHome from './Home.jsx'
import Drafts from './Drafts.jsx'
import Approval from './Approval.jsx'
import Impact, { ImpactList } from './Impact.jsx'
import Profile from './Profile.jsx'
import { wizardRoutes } from './wizard/EventWizard.jsx'
import { liveRoutes } from './live/LiveDashboard.jsx'

export const roleLabel = 'Social entrepreneur'
export const nav = [
  { to: '/se', label: 'Home', icon: Home, end: true },
  { to: '/se/create', label: 'Create event', icon: PlusCircle },
  { to: '/se/drafts', label: 'My drafts', icon: FileText },
  { to: '/se/impact', label: 'Impact', icon: Trophy },
  { to: '/se/profile', label: 'Profile', icon: User },
]

/** Relative to /se. The wizard and live dashboard come from the pieces the nonprofit build shares. */
export const routes = [
  { index: true, element: <SeHome /> },
  ...wizardRoutes('/se'),
  { path: 'drafts', element: <Drafts /> },
  { path: 'approval/:key', element: <Approval /> },
  ...liveRoutes('/se'),
  { path: 'impact', element: <ImpactList /> },
  { path: 'impact/:key', element: <Impact /> },
  { path: 'profile', element: <Profile /> },
]
