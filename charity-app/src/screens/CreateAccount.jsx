import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { accountRoles } from '../data/mockData';

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
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <button className="back-btn" onClick={() => navigate('/')}>
              <ChevronLeft size={18} />
            </button>
            <div className="step-dots">
              <div className="step-dot active" />
              <div className="step-dot" />
              <div className="step-dot" />
            </div>
            <div style={{ width: 38 }} />
          </div>

          {/* Heading */}
          <h1 className="screen-title">{role.title}</h1>
          <p className="screen-subtitle">{role.subtitle}</p>

          {/* Role selector */}
          <div style={{ marginTop: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>
              I am a…
            </label>
            <select
              className="input-field"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {accountRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Form fields — only social entrepreneurs create an account here */}
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

          {/* CTA */}
          <div style={{ marginTop: 28 }}>
            <button className="btn-primary" onClick={() => navigate(role.route)}>
              Continue
            </button>
          </div>

          {/* Sign in link */}
          {roleId === 'se' && (
          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button className="btn-ghost" style={{ fontSize: 14 }} onClick={() => navigate('/feed')}>
              Sign in
            </button>
          </p>
          )}

          {/* Privacy note */}
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
