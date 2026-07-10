import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopAuthLayout from '../../components/desktop/DesktopAuthLayout';
import { accountRoles } from '../../data/mockData';
import RoleSelect from '../../components/RoleSelect';

export default function DesktopCreateAccount() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [roleId, setRoleId] = useState('se');
  const role = accountRoles.find((r) => r.id === roleId);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

      {roleId === 'se' && (
        <div className="dsk-auth-fields">
          <input className="input-field" type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
          <input className="input-field" type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} />
          <input className="input-field" type="tel" name="phone" placeholder="Mobile number" value={form.phone} onChange={handleChange} />
        </div>
      )}

      <button className="dsk-auth-submit" onClick={() => navigate(role.route)}>Continue</button>

      <p className="dsk-auth-privacy">No Google/Apple/Facebook sign-in. Your privacy is protected.</p>
    </DesktopAuthLayout>
  );
}
