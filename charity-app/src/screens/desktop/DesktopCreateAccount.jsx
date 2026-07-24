import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopAuthLayout from '../../components/desktop/DesktopAuthLayout';
import { accountRoles } from '../../data/mockData';
import RoleSelect from '../../components/RoleSelect';
import GoogleIcon from '../../components/GoogleIcon';
import { useAuth } from '../../auth/AuthContext';
import { useAppToast, ToastHost } from '../../components/Toast';

function nameFromEmail(email) {
  const local = String(email || '').split('@')[0].trim();
  if (!local) return 'Social Entrepreneur';
  return local
    .replace(/[._+-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DesktopCreateAccount() {
  const navigate = useNavigate();
  const { register, login, googleMock } = useAuth();
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

  const handleGoogle = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      show('Enter an email to continue with Google', { variant: 'error' });
      return;
    }
    return run(async () => {
      await googleMock({ email: trimmed, name: nameFromEmail(trimmed) });
      navigate('/about-you');
    });
  };

  const handleEmailSignup = () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      show('Email and password are required', { variant: 'error' });
      return;
    }
    return run(async () => {
      await register({
        role: 'se',
        email: trimmed,
        password,
        name: nameFromEmail(trimmed),
      });
      navigate('/about-you');
    });
  };

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
    <DesktopAuthLayout
      eyebrow="Welcome to Charity Hub"
      headline="Where showing up becomes a movement."
      subhead="Verified nonprofits, organisers, and neighbors — connected around events that matter, live."
    >
      <h2 className="dsk-auth-title">{role.title}</h2>
      <p className="dsk-auth-subtitle">{role.subtitle}</p>

      <label className="dsk-auth-label">I am a…</label>
      <RoleSelect options={accountRoles} value={roleId} onChange={setRoleId} />

      {needsCreds && (
        <div className="dsk-auth-fields" style={{ marginTop: 16 }}>
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
            autoComplete={roleId === 'se' ? 'new-password' : 'current-password'}
            placeholder="Password"
            value={password}
            disabled={pending}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      {roleId === 'se' ? (
        <>
          <button
            type="button"
            className="google-signin-btn google-signin-btn--desktop"
            disabled={pending}
            onClick={handleGoogle}
          >
            <GoogleIcon size={20} />
            Continue with Google
          </button>
          <button
            type="button"
            className="btn-outline"
            style={{ marginTop: 12 }}
            disabled={pending}
            onClick={handleEmailSignup}
          >
            Sign up with email
          </button>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button type="button" className="btn-ghost" style={{ fontSize: 14 }} disabled={pending} onClick={handleSignIn}>
              Sign in
            </button>
          </p>
        </>
      ) : (
        <button type="button" className="dsk-auth-submit" disabled={pending} onClick={handleContinue}>
          Continue
        </button>
      )}
      <ToastHost toast={toast} />
    </DesktopAuthLayout>
  );
}
