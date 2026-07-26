import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isStepComplete, isDraftReadyToSubmit } from './eventDraftValidation.js';

const empty = {
  photos: [],
  nonprofitId: null,
  startDate: '',
  location: '',
  guidelinesReviewed: false,
  fixMode: false,
  allowedSteps: null,
};

describe('isStepComplete', () => {
  it('step 1 requires photos', () => {
    assert.equal(isStepComplete(1, empty), false);
    assert.equal(isStepComplete(1, { ...empty, photos: [{ id: 1 }] }), true);
  });

  it('step 2 requires nonprofit', () => {
    assert.equal(isStepComplete(2, empty, null), false);
    assert.equal(isStepComplete(2, { ...empty, nonprofitId: 9 }, { id: 9 }), true);
  });

  it('step 3 requires startDate and location', () => {
    assert.equal(isStepComplete(3, { ...empty, startDate: 'Jul 26, 2026' }), false);
    assert.equal(
      isStepComplete(3, { ...empty, startDate: 'Jul 26, 2026', location: 'Park' }),
      true,
    );
  });
});

describe('isDraftReadyToSubmit', () => {
  const ready = {
    photos: [{ id: 1 }],
    nonprofitId: 1,
    startDate: 'Jul 26, 2026',
    location: 'Park',
    guidelinesReviewed: true,
    fixMode: false,
    allowedSteps: null,
  };

  it('requires all steps and guidelines', () => {
    assert.equal(isDraftReadyToSubmit(ready, { id: 1 }), true);
    assert.equal(isDraftReadyToSubmit({ ...ready, guidelinesReviewed: false }, { id: 1 }), false);
    assert.equal(isDraftReadyToSubmit({ ...ready, photos: [] }, { id: 1 }), false);
  });

  it('in fix mode only checks allowed steps + guidelines', () => {
    const draft = {
      ...ready,
      photos: [],
      fixMode: true,
      allowedSteps: [3, 4],
      guidelinesReviewed: true,
    };
    assert.equal(isDraftReadyToSubmit(draft, { id: 1 }), true);
  });
});
