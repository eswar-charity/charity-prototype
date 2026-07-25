import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountRoles } from '../data/mockData';
import RoleSelect from '../components/RoleSelect';
import MobileAuthHeader from '../components/MobileAuthHeader';
import GoogleIcon from '../components/GoogleIcon';
import { useAuth } from '../auth/AuthContext';
import { useAppToast, ToastHost } from '../components/Toast';
import { requestGoogleIdToken } from '../utils/googleIdentity';

export default function CreateAccount() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const { toast, show } = useAppToast();
  const [roleId, setRoleId] = useState('se');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const role = accountRoles.find((r) => r.id === roleId);
  const needsCreds = roleId === 'se' || roleId === 'np' || roleId === 'admin';

  async function run(action) {
    setPending(true);
    try {
      await action();
    } catch (err) {
      show(err?.message || 'Something went wrong', { variant: 'error' });
    } finally {
      setPending(false);
    }
  }

  const handleGoogle = () =>
    run(async () => {
      const idToken = await requestGoogleIdToken();
      await googleLogin({ id_token: idToken });
      navigate('/about-you');
    });

  const handleSignIn = () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      show('Email and password are required', { variant: 'error' });
      return;
    }
    return run(async () => {
      await login({ email: trimmed, password });
      navigate('/feed');
    });
  };

  const handleContinue = () => {
    if (roleId === 'guest') {
      navigate(role.route);
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !password) {
      show('Email and password are required', { variant: 'error' });
      return;
    }
    return run(async () => {
      await login({ email: trimmed, password });
      navigate(role.route);
    });
  };

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '52px 18px 0' }}>
          <MobileAuthHeader onBack={() => navigate('/')} activeStep={0} />

          <h1 className="screen-title">{role.title}</h1>
          <p className="screen-subtitle">{role.subtitle}</p>

          <div style={{ marginTop: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>
              I am a…
            </label>
            <RoleSelect options={accountRoles} value={roleId} onChange={setRoleId} />
          </div>

          {needsCreds && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="input-field"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                disabled={pending}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="input-field"
                type="password"
                autoComplete={roleId === 'se' ? 'current-password' : 'current-password'}
                placeholder="Password"
                value={password}
                disabled={pending}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {roleId === 'se' ? (
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button type="button" className="google-signin-btn" disabled={pending} onClick={handleGoogle}>
                <GoogleIcon size={20} />
                Continue with Google
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 28 }}>
              <button type="button" className="btn-primary" disabled={pending} onClick={handleContinue}>
                Continue
              </button>
            </div>
          )}

          {roleId === 'se' && (
            <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button type="button" className="btn-ghost" style={{ fontSize: 14 }} disabled={pending} onClick={handleSignIn}>
                Sign in
              </button>
            </p>
          )}
        </div>
        <ToastHost toast={toast} />
      </div>
    </div>
  );
}
