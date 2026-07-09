import { useNavigate } from 'react-router-dom';
import { Camera, Plus, X } from 'lucide-react';
import DesktopCreateEventLayout from '../../components/desktop/DesktopCreateEventLayout';
import { useCreateEventDraft, updateDraft } from '../../hooks/useCreateEventDraft';

export default function DesktopEventStep1() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();

  const removePhoto = (id) => updateDraft({ photos: draft.photos.filter((p) => p.id !== id) });

  const STOCK = ['/events/neon-night/img1.jpg', '/events/neon-night/img2.jpg', '/events/neon-night/img3.jpg'];
  const addPhoto = () => {
    if (draft.photos.length >= 10) return;
    const nextId = draft.photos.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const src = STOCK[draft.photos.length % STOCK.length];
    updateDraft({ photos: [...draft.photos, { id: nextId, src }] });
  };

  return (
    <DesktopCreateEventLayout step={1}>
      <h1 className="dsk-wizard-h1">Add your story media</h1>
      <p className="dsk-wizard-sub">Show people what this event is about</p>

      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
        Up to 10 items
      </div>
      <div className="upload-area">
        <Camera size={26} color="var(--primary)" />
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>
          Drag photos or video here, or browse
        </p>
        <button className="btn-outline" style={{ width: 'auto', marginTop: 14, padding: '9px 24px', fontSize: 14 }} onClick={addPhoto}>
          Choose files
        </button>
      </div>

      <div className="photo-strip" style={{ margin: '20px 0 28px' }}>
        {draft.photos.map((p) => (
          <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
            <div className="photo-thumb" style={{ backgroundImage: `url(${p.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <button
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
        <div
          onClick={addPhoto}
          style={{
            width: 70, height: 70, border: '1.5px dashed var(--border)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: 'var(--white)',
          }}
        >
          <Plus size={20} color="var(--text-light)" />
        </div>
      </div>

      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>What's the story?</p>
      <div style={{ position: 'relative' }}>
        <textarea
          className="input-field"
          placeholder="Describe the event. What will people do? Why does it matter?"
          value={draft.story}
          onChange={(e) => updateDraft({ story: e.target.value })}
          style={{ minHeight: 140 }}
        />
        <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 12, color: 'var(--text-light)' }}>
          {draft.story.length}/500
        </span>
      </div>

      <div className="dsk-wizard-footer">
        <span />
        <button className="dsk-cta-btn" onClick={() => navigate('/event/step-2')}>Next: choose nonprofit →</button>
      </div>
    </DesktopCreateEventLayout>
  );
}
