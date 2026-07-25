import assert from 'node:assert/strict';
import {
  areasToAllowedSteps,
  inferAreasFromFeedback,
  isStepAllowed,
  nextWizardPath,
  resolveChangeAreas,
} from './changeRequestAreas.js';

assert.deepEqual(inferAreasFromFeedback('Please clarify description'), ['media_story']);
assert.deepEqual(inferAreasFromFeedback('Check location and photo'), ['media_story', 'date_location']);
assert.deepEqual(areasToAllowedSteps(['media_story']), [1, 4]);
assert.equal(isStepAllowed([1, 4], 2), false);
assert.equal(isStepAllowed([1, 4], 1), true);
assert.equal(nextWizardPath(true, [1, 4], 1), '/event/step-4');
assert.deepEqual(
  resolveChangeAreas({ feedback: 'x', areas: ['date_location'] }),
  ['date_location'],
);

console.log('changeRequestAreas.test.js: ok');
