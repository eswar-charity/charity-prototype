/** Areas NP can request → SE wizard steps (1–3). Step 4 (submit) is always allowed in fix mode. */

export const CHANGE_AREAS = [
  { id: 'media_story', label: 'Media & story', step: 1, path: '/event/step-1' },
  { id: 'nonprofit', label: 'Nonprofit selection', step: 2, path: '/event/step-2' },
  { id: 'date_location', label: 'Date & location', step: 3, path: '/event/step-3' },
];

const AREA_BY_ID = Object.fromEntries(CHANGE_AREAS.map((a) => [a.id, a]));

/** Infer areas from free-text feedback (legacy / suggestion chips). */
export function inferAreasFromFeedback(feedback) {
  const t = String(feedback || '').toLowerCase();
  const found = new Set();
  if (/photo|media|description|story|volunteer|clarify|image|caption/.test(t)) {
    found.add('media_story');
  }
  if (/nonprofit|organisation|organization|charity|partner/.test(t)) {
    found.add('nonprofit');
  }
  if (/location|date|time|when|where|venue|address/.test(t)) {
    found.add('date_location');
  }
  return CHANGE_AREAS.map((a) => a.id).filter((id) => found.has(id));
}

export function areasToAllowedSteps(areas) {
  const steps = new Set([4]);
  for (const id of areas || []) {
    const area = AREA_BY_ID[id];
    if (area) steps.add(area.step);
  }
  return [...steps].sort((a, b) => a - b);
}

export function isStepAllowed(allowedSteps, stepId) {
  if (!allowedSteps) return true;
  return allowedSteps.includes(stepId);
}

export function resolveChangeAreas(changeRequest) {
  const areas = changeRequest?.areas?.filter((id) => AREA_BY_ID[id]) ?? [];
  if (areas.length) return areas;
  const inferred = inferAreasFromFeedback(changeRequest?.feedback);
  if (inferred.length) return inferred;
  // Legacy change requests without structured areas: keep prior full-wizard access.
  return CHANGE_AREAS.map((a) => a.id);
}

export function wizardStepPath(step) {
  return `/event/step-${step}`;
}

/** Next destination after finishing a step (fix mode skips locked steps). */
export function nextWizardPath(fixMode, allowedSteps, currentStep) {
  if (!fixMode || !allowedSteps) {
    return currentStep >= 4 ? '/approval' : wizardStepPath(currentStep + 1);
  }
  const higher = allowedSteps.filter((s) => s > currentStep).sort((a, b) => a - b);
  return wizardStepPath(higher[0] ?? 4);
}

/** Back destination (fix mode returns to preview when leaving an edit step). */
export function backWizardPath(fixMode, allowedSteps, currentStep) {
  if (!fixMode || !allowedSteps) {
    if (currentStep <= 1) return '/feed';
    return wizardStepPath(currentStep - 1);
  }
  if (currentStep === 4) {
    const lower = allowedSteps.filter((s) => s < 4).sort((a, b) => b - a);
    return lower[0] ? wizardStepPath(lower[0]) : '/approval';
  }
  return '/event/step-4';
}
