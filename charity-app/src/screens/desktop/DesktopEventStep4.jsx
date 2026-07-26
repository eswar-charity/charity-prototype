import { useNavigate } from 'react-router-dom';
import { Info, Users, MessageCircle, Heart } from 'lucide-react';
import DesktopCreateEventLayout from '../../components/desktop/DesktopCreateEventLayout';
import SubmitChecklist from '../../components/SubmitChecklist';
import { useCreateEventDraft, updateDraft } from '../../hooks/useCreateEventDraft';
import { useSelectedNonprofit } from '../../hooks/useNonprofitList';
import { useEventWizardMutations } from '../../hooks/useEventWizardMutations';
import { useWizardStepAccess } from '../../hooks/useWizardStepAccess';
import { useAppToast, ToastHost } from '../../components/Toast';
import { previewHashtag } from '../../utils/eventWizard';
import { backWizardPath } from '../../utils/changeRequestAreas';
import { isDraftReadyToSubmit } from '../../utils/eventDraftValidation';

export default function DesktopEventStep4() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const { fixMode, allowedSteps } = useWizardStepAccess(4);
  const { nonprofit } = useSelectedNonprofit(draft.nonprofitId);
  const { toast, show } = useAppToast();
  const { handleSaveDraft, handleSubmit, pending, saved } = useEventWizardMutations(show);
  const canSubmit = isDraftReadyToSubmit(draft, nonprofit);

  const backingCount = draft.previewLiked ? 1 : 0;

  return (
    <DesktopCreateEventLayout step={4} hidePreview>
      <h1 className="dsk-wizard-h1">{fixMode ? 'Fix requested changes' : 'Preview & submit'}</h1>
      <p className="dsk-wizard-sub">
        {fixMode ? 'Update only the items the nonprofit asked for, then resubmit.' : 'This is how your event will look'}
      </p>

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
              <span><Users size={13} /> {backingCount} joined</span>
              <span><MessageCircle size={13} /> 6 in chat</span>
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
      <SubmitChecklist draft={draft} nonprofit={nonprofit} />

      <div className="info-banner" style={{ marginTop: 14 }}>
        <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {nonprofit ? nonprofit.name : 'Your nonprofit'} will review and approve your event before it goes live. You'll hear back within 24–48 hours.
        </p>
      </div>

      <div className="dsk-wizard-footer">
        <button type="button" className="dsk-wizard-back-link" onClick={() => navigate(backWizardPath(fixMode, allowedSteps, 4))}>← Back</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-outline" style={{ width: 'auto', padding: '12px 20px' }} onClick={handleSaveDraft} disabled={pending}>
            {saved ? 'Draft saved ✓' : 'Save as draft'}
          </button>
          <button type="button" className="dsk-cta-btn" onClick={handleSubmit} disabled={pending || !canSubmit}>
            {fixMode ? 'Resubmit for approval →' : 'Submit for approval →'}
          </button>
        </div>
      </div>
      <ToastHost toast={toast} />
    </DesktopCreateEventLayout>
  );
}
