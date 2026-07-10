import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Info, Users, MessageCircle, Heart } from 'lucide-react';
import DesktopCreateEventLayout from '../../components/desktop/DesktopCreateEventLayout';
import { useCreateEventDraft, resetDraft, updateDraft } from '../../hooks/useCreateEventDraft';
import { nonprofits } from '../../data/mockData';
import { previewHashtag } from '../../utils/eventWizard';

export default function DesktopEventStep4() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const nonprofit = nonprofits.find((n) => n.id === draft.nonprofitId);

  const [checklist, setChecklist] = useState([
    { id: 1, text: `Story media added (${draft.photos.length} items)`, done: draft.photos.length > 0 },
    { id: 2, text: `Nonprofit selected: ${nonprofit?.name || '—'}`, done: !!nonprofit },
    { id: 3, text: `Dates set: ${draft.startDate}`, done: true },
    { id: 4, text: 'Review Charity Hub content guidelines', done: false, isLink: true },
  ]);
  const [saved, setSaved] = useState(false);

  const toggle = (id) => setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  const submit = () => {
    resetDraft();
    navigate('/approval');
  };

  const saveDraft = () => {
    setSaved(true);
    setTimeout(() => navigate('/feed'), 900);
  };

  const backingCount = draft.previewLiked ? 1 : 0;

  return (
    <DesktopCreateEventLayout step={4} hidePreview>
      <h1 className="dsk-wizard-h1">Preview & submit</h1>
      <p className="dsk-wizard-sub">This is how your event will look</p>

      <div className="dsk-wizard-final-card">
        <div className="dsk-wizard-final-hero" style={{ backgroundImage: `url(${draft.photos[0]?.src})` }}>
          <span className="badge" style={{ background: nonprofit?.color ? `${nonprofit.color}22` : 'rgba(255,255,255,0.9)', color: nonprofit?.color || '#C62828', fontWeight: 700 }}>
            {nonprofit?.category || 'Community'}
          </span>
        </div>
        <div className="dsk-wizard-final-body">
          <p className="dsk-wizard-final-title">{previewHashtag(draft.story)}</p>
          <p className="dsk-wizard-final-desc">
            {draft.story || 'Join us in our mission to make a tangible impact on our local community.'}
          </p>
          <div className="dsk-wizard-final-meta">
            <span>for {nonprofit ? nonprofit.name : '[Nonprofit]'} · by You</span>
            <div className="dsk-wizard-final-stats">
              <span><Users size={13} /> {backingCount} backing</span>
              <span><MessageCircle size={13} /> 0 in chat</span>
              <button
                type="button"
                className="dsk-wizard-preview-like"
                aria-label={draft.previewLiked ? 'Unlike preview' : 'Like preview'}
                aria-pressed={draft.previewLiked}
                onClick={() => updateDraft({ previewLiked: !draft.previewLiked })}
              >
                <Heart
                  size={15}
                  color={draft.previewLiked ? 'var(--primary)' : 'var(--text-light)'}
                  fill={draft.previewLiked ? 'var(--primary)' : 'none'}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', margin: '24px 0 12px' }}>Before you submit</p>
      <div className="card">
        {checklist.map((item) => (
          <div key={item.id} className="check-item" style={{ cursor: 'pointer' }} onClick={() => toggle(item.id)}>
            <div className={`check-circle ${item.done ? 'checked' : ''}`}>
              {item.done && <Check size={12} strokeWidth={3} />}
            </div>
            <span style={{ color: item.isLink && !item.done ? 'var(--blue)' : 'var(--dark)', textDecoration: item.isLink && !item.done ? 'underline' : 'none' }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <div className="info-banner" style={{ marginTop: 14 }}>
        <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {nonprofit ? nonprofit.name : 'Your nonprofit'} will review and approve your event before it goes live. You'll hear back within 24–48 hours.
        </p>
      </div>

      <div className="dsk-wizard-footer">
        <button type="button" className="dsk-wizard-back-link" onClick={() => navigate('/event/step-3')}>← Back</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-outline" style={{ width: 'auto', padding: '12px 20px' }} onClick={saveDraft}>
            {saved ? 'Draft saved ✓' : 'Save as draft'}
          </button>
          <button type="button" className="dsk-cta-btn" onClick={submit}>Submit for approval →</button>
        </div>
      </div>
    </DesktopCreateEventLayout>
  );
}
