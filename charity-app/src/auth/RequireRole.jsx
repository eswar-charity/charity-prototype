import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { roleDeniedNotice, roleHome } from '../utils/roleHome';

/**
 * Only lets the listed roles through. Signed-out visitors go to sign-in; someone
 * signed in as the wrong kind of account is sent to their own area with a
 * notice (instead of seeing an empty screen full of 403s).
 */
export default function RequireRole({ roles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user?.role)) {
    return (
      <Navigate
        to={roleHome(user?.role)}
        replace
        state={{ notice: roleDeniedNotice(user?.role) }}
      />
    );
  }

  return children;
}
