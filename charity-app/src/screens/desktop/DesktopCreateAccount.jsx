import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopAuthLayout from '../../components/desktop/DesktopAuthLayout';
import { accountRoles } from '../../data/mockData';
import RoleSelect from '../../components/RoleSelect';
import GoogleIcon from '../../components/GoogleIcon';

export default function DesktopCreateAccount() {
  const navigate = useNavigate();
  const [roleId, setRoleId] = useState('se');
  const role = accountRoles.find((r) => r.id === roleId);

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

      {roleId === 'se' ? (
        <>
          <button type="button" className="google-signin-btn google-signin-btn--desktop" onClick={() => navigate('/about-you')}>
            <GoogleIcon size={20} />
            Continue with Google
          </button>
          <button
            type="button"
            className="btn-outline"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/about-you')}
          >
            Sign up with email
          </button>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button type="button" className="btn-ghost" style={{ fontSize: 14 }} onClick={() => navigate('/feed')}>
              Sign in
            </button>
          </p>
        </>
      ) : (
        <button type="button" className="dsk-auth-submit" onClick={() => navigate(role.route)}>Continue</button>
      )}
    </DesktopAuthLayout>
  );
}
