import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Plus, X } from 'lucide-react';

const SAMPLE_IMGS = [
  { id: 1, src: '/events/neon-night/img1.jpg' },
  { id: 2, src: '/events/neon-night/img2.jpg' },
  { id: 3, src: '/events/neon-night/img3.jpg' },
];

const POOL = [
  '/events/neon-night/img1.jpg',
  '/events/neon-night/img2.jpg',
  '/events/neon-night/img3.jpg',
];

export default function EventStep1() {
  const navigate = useNavigate();
  const [story, setStory] = useState('');
  const [photos, setPhotos] = useState(SAMPLE_IMGS);

  const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));
  const addPhoto = () =>
    setPhotos((prev) =>
      prev.length >= 10
        ? prev
        : [...prev, { id: Date.now(), src: POOL[prev.length % POOL.length] }]
    );

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Step header */}
        <div className="step-bar">
          <button className="back-btn" onClick={() => navigate('/feed')}>
            <ChevronLeft size={18} />
          </button>
          <span className="step-text">1 of 4 — Add your story media</span>
          <div style={{ width: 38 }} />
        </div>

        <div className="screen-inner">
          <h1 className="screen-title" style={{ marginBottom: 20 }}>Create your event</h1>

          {/* Upload area */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Up to 10 items
            </div>
            <div className="upload-area">
              <Camera size={28} color="var(--primary)" />
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>
                Add photos or video
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Show people what this event is about.
              </p>
              <button
                className="btn-outline"
                onClick={addPhoto}
                style={{ width: 'auto', marginTop: 14, padding: '9px 24px', fontSize: 14 }}
              >
                Choose from library
              </button>
            </div>
          </div>

          {/* Photo strip */}
          <div className="photo-strip" style={{ marginBottom: 24 }}>
            {photos.map((p) => (
              <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  className="photo-thumb"
                  style={{ backgroundImage: `url(${p.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <button
                  onClick={() => removePhoto(p.id)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <div
              onClick={addPhoto}
              style={{
                width: 70,
                height: 70,
                border: '1.5px dashed var(--border)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                background: 'var(--white)',
              }}
            >
              <Plus size={20} color="var(--text-light)" />
            </div>
          </div>

          {/* Story textarea */}
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
            What's the story?
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              className="input-field"
              placeholder="Describe the event. What will people do? Why does it matter? Great stories are specific, warm, and real."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              style={{ minHeight: 130 }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 12,
                right: 14,
                fontSize: 12,
                color: 'var(--text-light)',
              }}
            >
              {story.length}/500
            </span>
          </div>

          {/* Next */}
          <div style={{ marginTop: 24 }}>
            <button className="btn-primary" onClick={() => navigate('/event/step-2')}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
