import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAct, useSession } from '../domain/store.jsx'
import { ROLE_LABEL, homeFor, ROLES } from '../domain/engine.js'

export const ALL_ROLES = [ROLES.GUEST, ROLES.SE, ROLES.NP, ROLES.ADMIN]

/** Signed out → /signin?next=…  ·  wrong role → that role's home, with a notice (F01 FR-IA-18). */
export function RequireRole({ roles, children }) {
  const { user } = useSession()
  const loc = useLocation()
  const act = useAct()
  const wrong = !!user && !roles.includes(user.role)
  useEffect(() => {
    if (wrong) act('setNotice', { notice: `That area is for ${roles.map((r) => ROLE_LABEL[r].toLowerCase()).join(' or ')} accounts. You are signed in as ${ROLE_LABEL[user.role].toLowerCase()}.` })
  }, [wrong]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (wrong) return <Navigate to={homeFor(user.role)} replace />
  return children
}

/** Banner for session notices (e.g. "that area is for nonprofit admins"). */
export function NoticeBar() {
  const { session } = useSession()
  const act = useAct()
  if (!session.notice) return null
  return (
    <div className="notice-bar" role="status">
      <span>{session.notice}</span>
      <button onClick={() => act('clearNotice')} aria-label="Dismiss notice"><X size={16} aria-hidden="true" /></button>
    </div>
  )
}
