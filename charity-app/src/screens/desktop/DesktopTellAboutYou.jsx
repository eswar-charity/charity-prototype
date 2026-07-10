import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import DesktopAuthLayout from '../../components/desktop/DesktopAuthLayout';
import { causes } from '../../data/mockData';

export default function DesktopTellAboutYou() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(['Environment', 'Education']);
  const [form, setForm] = useState({ name: 'Jane Doe', bio: '', city: '' });

  const toggleCause = (c) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const initials = form.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <DesktopAuthLayout
      eyebrow="Step 2 of 2"
      headline="Almost there — make it yours."
      subhead="This becomes your public creator profile, visible to everyone you host events for."
    >
      <div className="dsk-auth-profile-preview">
        <div className="dsk-auth-profile-avatar">{initials}</div>
        <div>
          <p className="dsk-auth-profile-name">{form.name || 'Your name'}</p>
          <p className="dsk-auth-profile-city">{form.city || 'Add your city'}</p>
        </div>
      </div>

      <h2 className="dsk-auth-title">Tell us about you</h2>
      <p className="dsk-auth-subtitle">This is your public creator profile. Make it yours.</p>

      <div className="dsk-auth-fields">
        <input
          className="input-field"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          className="input-field input-soft"
          placeholder="What drives you to make a difference?"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <div className="loc-wrap">
          <MapPin size={16} className="loc-ico" />
          <input
            className="input-field"
            type="text"
            placeholder="Your city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
      </div>

      <p className="dsk-auth-label" style={{ marginTop: 20 }}>What causes do you care about?</p>
      <div className="dsk-auth-causes">
        {causes.map((c) => (
          <button key={c} className={`cause-chip ${selected.includes(c) ? 'selected' : ''}`} onClick={() => toggleCause(c)}>
            {c}
          </button>
        ))}
      </div>

      <button className="dsk-auth-submit" onClick={() => navigate('/feed')}>Build my profile</button>
      <button
        className="dsk-wizard-back-link"
        style={{ marginTop: 12, display: 'block' }}
        onClick={() => navigate('/')}
      >
        ← Back
      </button>
    </DesktopAuthLayout>
  );
}
