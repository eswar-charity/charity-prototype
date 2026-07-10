import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { accountRoles } from '../data/mockData';
import RoleSelect from '../components/RoleSelect';
import MobileAuthHeader from '../components/MobileAuthHeader';

export default function CreateAccount() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [roleId, setRoleId] = useState('se');
  const role = accountRoles.find((r) => r.id === roleId);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

          {roleId === 'se' && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="input-field"
                type="text"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
              />
              <input
                className="input-field"
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div
                  style={{
                    padding: '16px 14px',
                    background: 'var(--primary-soft)',
                    borderRadius: '16px 0 0 16px',
                    border: '1.5px solid transparent',
                    borderRight: 'none',
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--dark)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  +1
                </div>
                <input
                  className="input-field input-soft"
                  type="tel"
                  name="phone"
                  placeholder="Mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  style={{ borderRadius: '0 16px 16px 0' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: 28 }}>
            <button type="button" className="btn-primary" onClick={() => navigate(role.route)}>
              Continue
            </button>
          </div>

          {roleId === 'se' && (
            <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button type="button" className="btn-ghost" style={{ fontSize: 14 }} onClick={() => navigate('/feed')}>
                Sign in
              </button>
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            <Lock size={12} color="var(--text-light)" />
            <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center' }}>
              No Google/Apple/Facebook sign-in. Your privacy is protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
