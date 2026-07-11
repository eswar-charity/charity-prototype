import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin } from 'lucide-react';
import { causes } from '../data/mockData';
import MobileAuthHeader from '../components/MobileAuthHeader';

const CAUSES = causes;

export default function TellAboutYou() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(['Environment', 'Education']);
  const [form, setForm] = useState({ name: 'Jane Doe', bio: '', city: '' });
  const [photo, setPhoto] = useState(null);
  const fileInputRef = useRef(null);

  const toggleCause = (c) =>
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
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

          {/* Causes */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 12 }}>
              What causes do you care about?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CAUSES.map((c) => (
                <button
                  key={c}
                  className={`cause-chip ${selected.includes(c) ? 'selected' : ''}`}
                  onClick={() => toggleCause(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32 }}>
            <button className="btn-primary" onClick={() => navigate('/feed')}>
              Build my profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
