import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Calendar, Clock, MapPin, Globe, Lock, Check } from 'lucide-react';

export default function EventStep3() {
  const navigate = useNavigate();
  const [visibility, setVisibility] = useState('public');

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Step header */}
        <div className="step-bar">
          <button className="back-btn" onClick={() => navigate('/event/step-2')}>
            <ChevronLeft size={18} />
          </button>
          <span className="step-text">STEP 3 OF 4</span>
          <button className="close-btn" onClick={() => navigate('/feed')} style={{ background: 'var(--white)', border: '1.5px solid var(--border)' }}>
            <X size={16} color="var(--dark)" />
          </button>
        </div>

        <div className="screen-inner">
          <h1 className="screen-title" style={{ marginBottom: 6 }}>When and where?</h1>
          <p className="screen-subtitle" style={{ marginBottom: 24 }}>
            Set the logistics so your supporters know exactly how to join.
          </p>

          {/* Date/time grid */}
          <div className="dt-grid" style={{ marginBottom: 10 }}>
            <div className="dt-box">
              <div className="dt-label">
                <Calendar size={11} color="var(--primary)" />
                Start date
              </div>
              <div className="dt-value">Oct 14, 2025</div>
            </div>
            <div className="dt-box">
              <div className="dt-label">
                <Calendar size={11} color="var(--primary)" />
                End date
              </div>
              <div className="dt-value">Oct 14, 2025</div>
            </div>
          </div>
          <div className="dt-grid" style={{ marginBottom: 24 }}>
            <div className="dt-box">
              <div className="dt-label">
                <Clock size={11} color="var(--text-secondary)" />
                Start
              </div>
              <div className="dt-value">9:00 AM</div>
            </div>
            <div className="dt-box">
              <div className="dt-label">
                <Clock size={11} color="var(--text-secondary)" />
                End
              </div>
              <div className="dt-value">9:00 PM</div>
            </div>
          </div>

          {/* Location */}
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>Location</p>
          <div className="loc-wrap" style={{ marginBottom: 8 }}>
            <MapPin size={16} className="loc-ico" />
            <input
              className="input-field"
              type="text"
              placeholder="Event location or virtual link"
            />
          </div>
          <button
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, marginBottom: 24 }}
          >
            <MapPin size={13} color="var(--blue)" />
            <span style={{ color: 'var(--blue)' }}>Use my current location</span>
          </button>

          {/* Visibility */}
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Visibility</p>

          <div
            className={`vis-option ${visibility === 'public' ? 'selected-vis' : ''}`}
            onClick={() => setVisibility('public')}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: visibility === 'public' ? 'var(--blue-soft)' : 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Globe size={18} color={visibility === 'public' ? 'var(--blue)' : 'var(--primary)'} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Public event</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Anyone can discover this</p>
            </div>
            <div className={`vis-check ${visibility === 'public' ? 'checked' : ''}`}>
              {visibility === 'public' && <Check size={12} strokeWidth={3} />}
            </div>
          </div>

          <div
            className={`vis-option ${visibility === 'private' ? 'selected-vis' : ''}`}
            onClick={() => setVisibility('private')}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Lock size={18} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Private / invite only</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Only invited people can join</p>
            </div>
            <div className={`vis-check ${visibility === 'private' ? 'checked' : ''}`}>
              {visibility === 'private' && <Check size={12} strokeWidth={3} />}
            </div>
          </div>

          {/* Next */}
          <div style={{ marginTop: 24 }}>
            <button className="btn-primary" onClick={() => navigate('/event/step-4')}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
