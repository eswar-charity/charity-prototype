import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin } from 'lucide-react';
import useCategories from '../hooks/useCategories';
import MobileAuthHeader from '../components/MobileAuthHeader';
import { updateProfile } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { useAppToast, ToastHost } from '../components/Toast';
import { consumeGuestReturn } from '../utils/identityGateIntent';


export default function TellAboutYou() {
  const { names: CAUSES } = useCategories();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { toast, show } = useAppToast();
  const [selected, setSelected] = useState(['Environment', 'Education']);
  const [form, setForm] = useState({ name: 'Jane Doe', bio: '', city: '' });
  const [photo, setPhoto] = useState(null);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef(null);

  const toggleCause = (c) =>
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

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
      const { returnTo } = consumeGuestReturn();
      navigate(returnTo || '/feed');
    } catch (err) {
      show(err?.message || 'Something went wrong', { variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '52px 18px 0' }}>
          <MobileAuthHeader onBack={() => navigate('/')} activeStep={1} />

          {/* Heading */}
          <h1 className="screen-title">Tell us about you</h1>
          <p className="screen-subtitle">This is your public creator profile. Make it yours.</p>

          {/* Photo upload */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 20px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: 'none' }}
            />
            <div
              className="photo-circle"
              role="button"
              tabIndex={0}
              aria-label="Add profile photo"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current && fileInputRef.current.click();
                }
              }}
              style={{ cursor: 'pointer', overflow: 'hidden' }}
            >
              {photo ? (
                <img src={photo} alt="Your profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Camera size={22} color="var(--primary)" />
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Add photo</span>
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

          {/* Causes */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 12 }}>
              What causes do you care about?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CAUSES.map((c) => (
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
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32 }}>
            <button type="button" className="btn-primary" disabled={pending} onClick={handleContinue}>
              Build my profile
            </button>
          </div>
        </div>
        <ToastHost toast={toast} />
      </div>
    </div>
  );
}
