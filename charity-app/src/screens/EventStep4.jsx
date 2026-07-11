import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Heart } from 'lucide-react';
import { useCreateEventDraft, resetDraft, updateDraft } from '../hooks/useCreateEventDraft';
import { nonprofits } from '../data/mockData';
import { previewHashtag } from '../utils/eventWizard';
import MobileAppHeader from '../components/MobileAppHeader';
import SubmitChecklist from '../components/SubmitChecklist';

export default function EventStep4() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const nonprofit = nonprofits.find((n) => n.id === draft.nonprofitId);
  const [saved, setSaved] = useState(false);

  const saveDraft = () => {
    setSaved(true);
    setTimeout(() => navigate('/feed'), 900);
  };

  const submit = () => {
    resetDraft();
    navigate('/approval');
  };

  const backingCount = draft.previewLiked ? 1 : 0;
  const joinedCount = 0;

  return (
    <div className="phone-shell">
      <div className="screen">
        <MobileAppHeader
          layout="bar"
          homePath="/feed"
          left={(
            <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate('/event/step-3')}>
              <ChevronLeft size={18} />
            </button>
          )}
          meta="Step 4 of 4"
          title="Preview & submit"
          subtitle="This is how your event will look to the world."
        />

        <div className="screen-inner">
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{
              height: 160,
              backgroundImage: `url(${draft.photos[0]?.src})`,
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
              <span className="badge badge-env" style={{ background: 'rgba(255,255,255,0.9)', color: nonprofit?.color || '#C62828', fontWeight: 700, position: 'relative' }}>
                {nonprofit?.category || 'Community'}
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>
                {previewHashtag(draft.story).replace('#', '')}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {(draft.story || 'Your event story will appear here…').slice(0, 64)}{(draft.story?.length > 64) ? '…' : ''}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: nonprofit?.bg || 'linear-gradient(135deg, var(--primary), var(--blue))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white',
                }}>
                  {nonprofit?.initials || 'YOU'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)' }}>
                    You <span style={{ color: 'var(--blue)' }}>✓</span>
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{nonprofit?.name || 'Nonprofit'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{backingCount} backed</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{joinedCount} joined</span>
                  <button
                    type="button"
                    aria-label={draft.previewLiked ? 'Unlike preview' : 'Like preview'}
                    aria-pressed={draft.previewLiked}
                    onClick={() => updateDraft({ previewLiked: !draft.previewLiked })}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
                  >
                    <Heart
                      size={18}
                      color={draft.previewLiked ? 'var(--primary)' : 'var(--text-light)'}
                      fill={draft.previewLiked ? 'var(--primary)' : 'none'}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>
            Before you submit
          </p>
          <SubmitChecklist draft={draft} nonprofit={nonprofit} />

          <div className="info-banner" style={{ marginTop: 14 }}>
            <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {nonprofit?.name || 'Your nonprofit'} will review and approve your event before it goes live. You&apos;ll be notified within 24-48 hours.
            </p>
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="btn-primary" onClick={submit}>
              Submit for approval
            </button>
            <button type="button" className="btn-outline" onClick={saveDraft}>
              {saved ? 'Draft saved ✓' : 'Save as draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
