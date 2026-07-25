import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEventDraft } from './useCreateEventDraft';
import { isStepAllowed } from '../utils/changeRequestAreas';

/** Redirect away from wizard steps that are locked in fix mode. */
export function useWizardStepAccess(stepId) {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const allowed = isStepAllowed(draft.fixMode ? draft.allowedSteps : null, stepId);

  useEffect(() => {
    if (draft.fixMode && !allowed) {
      navigate('/event/step-4', { replace: true });
    }
  }, [allowed, draft.fixMode, navigate]);

  return {
    fixMode: !!draft.fixMode,
    allowedSteps: draft.fixMode ? draft.allowedSteps : null,
    changeFeedback: draft.changeFeedback || '',
    canAccessStep: (id) => isStepAllowed(draft.fixMode ? draft.allowedSteps : null, id),
  };
}
