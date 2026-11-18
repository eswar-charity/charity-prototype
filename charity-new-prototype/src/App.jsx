import { useRoutes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RoleShell from './ui/RoleShell.jsx'
import DemoPanel from './ui/DemoPanel.jsx'
import { RequireRole, ALL_ROLES } from './ui/Guards.jsx'
import { NotificationsPage } from './ui/Notifications.jsx'
import { ROLES } from './domain/engine.js'
import * as guest from './roles/guest/index.jsx'
import * as auth from './roles/auth/index.jsx'
import * as se from './roles/se/index.jsx'
import * as np from './roles/np/index.jsx'
import * as admin from './roles/admin/index.jsx'

/** Public site and auth live in the public Layout; each signed-in role gets its own guarded shell. */
export default function App() {
  const element = useRoutes([
    {
      element: <Layout />,
      children: [
        ...auth.routes,
        { path: 'notifications', element: <RequireRole roles={ALL_ROLES}><NotificationsPage /></RequireRole> },
        ...guest.routes,
      ],
    },
    { path: 'se', element: <RequireRole roles={[ROLES.SE]}><RoleShell nav={se.nav} roleLabel={se.roleLabel} /></RequireRole>, children: se.routes },
    { path: 'np', element: <RequireRole roles={[ROLES.NP]}><RoleShell nav={np.nav} roleLabel={np.roleLabel} /></RequireRole>, children: np.routes },
    { path: 'admin', element: <RequireRole roles={[ROLES.ADMIN]}><RoleShell nav={admin.nav} roleLabel={admin.roleLabel} /></RequireRole>, children: admin.routes },
  ])
  return (
    <>
      {element}
      <DemoPanel />
    </>
  )
}
