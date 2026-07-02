import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';

export default function CreateAccount() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

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
          <h1 className="screen-title">Create your account</h1>
          <p className="screen-subtitle">You're one step from starting your first event.</p>

          {/* Form fields */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
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

          {/* CTA */}
          <div style={{ marginTop: 28 }}>
            <button className="btn-primary" onClick={() => navigate('/about-you')}>
              Continue
            </button>
          </div>

          {/* Sign in link */}
          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button className="btn-ghost" style={{ fontSize: 14 }} onClick={() => navigate('/feed')}>
              Sign in
            </button>
          </p>

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
