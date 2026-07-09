import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Info } from 'lucide-react';

const CHECKLIST = [
  { id: 1, text: 'Story media added', done: true },
  { id: 2, text: 'Nonprofit selected: Youth Health Fund', done: true },
  { id: 3, text: 'Dates set: Nov 8, 2025', done: true },
  { id: 4, text: 'Review Charity Hub content guidelines', done: false, isLink: true },
];

export default function EventStep4() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [toast, setToast] = useState('');

  const saveDraft = () => {
    setToast('Draft saved');
    setTimeout(() => navigate('/feed'), 900);
  };

  const toggle = (id) =>
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Step header */}
        <div className="step-bar">
          <button className="back-btn" onClick={() => navigate('/event/step-3')}>
            <ChevronLeft size={18} />
          </button>
          <span className="step-text">STEP 4 OF 4</span>
          <div style={{ width: 38 }} />
        </div>

        <div className="screen-inner">
          <h1 className="screen-title" style={{ marginBottom: 6 }}>Preview & submit</h1>
          <p className="screen-subtitle" style={{ marginBottom: 18 }}>
            This is how your event will look to the world.
          </p>

          {/* Event preview card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            {/* Hero image */}
            <div style={{
              height: 160,
              backgroundImage: 'url(/events/neon-night/img1.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              padding: 12,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
              }} />
              <span className="badge badge-env" style={{ background: 'rgba(255,255,255,0.9)', color: '#C62828', fontWeight: 700, position: 'relative' }}>
                Health
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>
                Neon Night Run
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Light up the night for a great cause. A glowing 5K...
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #FF8A65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'white',
                }}>
                  SJ
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)' }}>
                    Sarah Jenkins{' '}
                    <span style={{ color: 'var(--blue)' }}>✓</span>
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Youth Health Fund</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>0 backed</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>0 joined</span>
                </div>
              </div>
            </div>
          </div>

          {/* Before you submit */}
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>
            Before you submit
          </p>
          <div className="card">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="check-item"
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(item.id)}
              >
                <div className={`check-circle ${item.done ? 'checked' : ''}`}>
                  {item.done && <Check size={12} strokeWidth={3} />}
                </div>
                <span style={{ color: item.isLink && !item.done ? 'var(--blue)' : 'var(--dark)', textDecoration: item.isLink && !item.done ? 'underline' : 'none' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="info-banner" style={{ marginTop: 14 }}>
            <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Youth Health Fund will review and approve your event before it goes live. You'll be notified within 24-48 hours.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" onClick={() => navigate('/approval')}>
              Submit for approval
            </button>
            <button className="btn-outline" onClick={saveDraft}>
              Save as draft
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 90,
            transform: 'translateX(-50%)',
            background: 'var(--dark)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
