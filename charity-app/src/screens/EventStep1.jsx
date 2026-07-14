import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Plus, X } from 'lucide-react';
import { useCreateEventDraft, updateDraft } from '../hooks/useCreateEventDraft';
import MobileAppHeader from '../components/MobileAppHeader';

export default function EventStep1() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const fileInputRef = useRef(null);

  const removePhoto = (id) => updateDraft({ photos: draft.photos.filter((p) => p.id !== id) });

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const remaining = 10 - draft.photos.length;
    if (remaining <= 0) return;
    let nextId = draft.photos.reduce((m, p) => Math.max(m, p.id), 0);
    const newPhotos = files.slice(0, remaining).map((file) => {
      nextId += 1;
      return { id: nextId, src: URL.createObjectURL(file), type: file.type.startsWith('video') ? 'video' : 'image' };
    });
    updateDraft({ photos: [...draft.photos, ...newPhotos] });
  };

  return (
    <div className="phone-shell">
      <div className="screen">
        <MobileAppHeader
          layout="bar"
          homePath="/feed"
          left={(
            <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate('/feed')}>
              <ChevronLeft size={18} />
            </button>
          )}
          meta="Step 1 of 4"
          title="Create your event"
          subtitle="Add photos and tell your story to inspire people to join."
        />

        <div className="screen-inner">
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Up to 10 items
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              className="upload-area"
              role="button"
              tabIndex={0}
              aria-label="Add photos or video"
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <Camera size={28} color="var(--primary)" />
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>
                Add photos or video
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Show people what this event is about.
              </p>
              <button
                type="button"
                className="btn-outline"
                onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
                style={{ width: 'auto', marginTop: 14, padding: '9px 24px', fontSize: 14 }}
              >
                Choose from library
              </button>
            </div>
          </div>

          <div className="photo-strip" style={{ marginBottom: 24 }}>
            {draft.photos.map((p) => (
              <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                {p.type === 'video' ? (
                  <video className="photo-thumb" src={p.src} muted playsInline style={{ objectFit: 'cover' }} />
                ) : (
                  <div
                    className="photo-thumb"
                    style={{ backgroundImage: `url(${p.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removePhoto(p.id)}
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--primary)', border: 'none', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <button
              type="button"
              aria-label="Add photo"
              onClick={openFilePicker}
              style={{
                width: 70, height: 70, border: '1.5px dashed var(--border)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                flexShrink: 0, background: 'var(--white)',
              }}
            >
              <Plus size={20} color="var(--text-light)" />
            </button>
          </div>

          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
            What&apos;s the story?
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              className="input-field"
              placeholder="Describe the event. What will people do? Why does it matter? Great stories are specific, warm, and real."
              value={draft.story}
              onChange={(e) => updateDraft({ story: e.target.value.slice(0, 500) })}
              style={{ minHeight: 130 }}
            />
            <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 12, color: 'var(--text-light)' }}>
              {draft.story.length}/500
            </span>
          </div>

          <div style={{ marginTop: 24 }}>
            <button type="button" className="btn-primary" onClick={() => navigate('/event/step-2')}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
