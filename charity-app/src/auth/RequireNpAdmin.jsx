import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { stashGuestReturn } from '../utils/identityGateIntent';

/**
 * Blocks guests / non-NP roles from Launchpad routes.
 * Guests are sent to the guest feed; other signed-in roles go home.
 */
export default function RequireNpAdmin({ children }) {
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
    stashGuestReturn({
      returnTo: `${location.pathname}${location.search}`,
      intent: 'default',
    });
    return <Navigate to="/guest/feed" replace />;
  }

  if (user?.role !== 'np_admin') {
    return <Navigate to="/feed" replace />;
  }

  return children;
}
