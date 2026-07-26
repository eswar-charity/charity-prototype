import { isStepAllowed } from './changeRequestAreas.js';

export function isStepComplete(step, draft, nonprofit) {
  if (step === 1) return (draft.photos?.length ?? 0) > 0;
  if (step === 2) return Boolean(nonprofit) || draft.nonprofitId != null;
  if (step === 3) {
    return Boolean(draft.startDate?.trim()) && Boolean(draft.location?.trim());
  }
  return true;
}

export function isDraftReadyToSubmit(draft, nonprofit, options = {}) {
  const fixMode = options.fixMode ?? !!draft.fixMode;
  const allowedSteps = options.allowedSteps ?? draft.allowedSteps;
  if (!draft.guidelinesReviewed) return false;

  const stepsToCheck = fixMode && allowedSteps
    ? [1, 2, 3].filter((s) => isStepAllowed(allowedSteps, s))
    : [1, 2, 3];

  return stepsToCheck.every((s) => isStepComplete(s, draft, nonprofit));
}
