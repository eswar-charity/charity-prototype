import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import DesktopAuthLayout from '../../components/desktop/DesktopAuthLayout';
import { causes } from '../../data/mockData';
import { updateProfile } from '../../api/users';
import { useAuth } from '../../auth/AuthContext';
import { useAppToast, ToastHost } from '../../components/Toast';

export default function DesktopTellAboutYou() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast, show } = useAppToast();
  const [selected, setSelected] = useState(['Environment', 'Education']);
  const [form, setForm] = useState({ name: 'Jane Doe', bio: '', city: '' });
  const [pending, setPending] = useState(false);

  const toggleCause = (c) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const initials = form.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const handleContinue = async () => {
    setPending(true);
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        city: form.city,
        causes: selected,
      });
      await refreshUser();
      navigate('/feed');
    } catch (err) {
      show(err?.message || 'Something went wrong', { variant: 'error' });
    } finally {
      setPending(false);
    }
  };

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
          disabled={pending}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          className="input-field input-soft"
          placeholder="What drives you to make a difference?"
          value={form.bio}
          disabled={pending}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <div className="loc-wrap">
          <MapPin size={16} className="loc-ico" />
          <input
            className="input-field"
            type="text"
            placeholder="Your city"
            value={form.city}
            disabled={pending}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
      </div>

      <p className="dsk-auth-label" style={{ marginTop: 20 }}>What causes do you care about?</p>
      <div className="dsk-auth-causes">
        {causes.map((c) => (
          <button
            key={c}
            type="button"
            className={`cause-chip ${selected.includes(c) ? 'selected' : ''}`}
            disabled={pending}
            onClick={() => toggleCause(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button type="button" className="dsk-auth-submit" disabled={pending} onClick={handleContinue}>
        Build my profile
      </button>
      <button
        type="button"
        className="dsk-wizard-back-link"
        style={{ marginTop: 12, display: 'block' }}
        disabled={pending}
        onClick={() => navigate('/')}
      >
        ← Back
      </button>
      <ToastHost toast={toast} />
    </DesktopAuthLayout>
  );
}
