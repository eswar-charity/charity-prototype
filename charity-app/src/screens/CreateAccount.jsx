import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountRoles } from '../data/mockData';
import RoleSelect from '../components/RoleSelect';
import MobileAuthHeader from '../components/MobileAuthHeader';
import GoogleIcon from '../components/GoogleIcon';

export default function CreateAccount() {
  const navigate = useNavigate();
  const [roleId, setRoleId] = useState('se');
  const role = accountRoles.find((r) => r.id === roleId);

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

          {roleId === 'se' ? (
            <div style={{ marginTop: 28 }}>
              <button type="button" className="google-signin-btn" onClick={() => navigate('/about-you')}>
                <GoogleIcon size={20} />
                Continue with Google
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 28 }}>
              <button type="button" className="btn-primary" onClick={() => navigate(role.route)}>
                Continue
              </button>
            </div>
          )}

          {roleId === 'se' && (
            <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button type="button" className="btn-ghost" style={{ fontSize: 14 }} onClick={() => navigate('/feed')}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
