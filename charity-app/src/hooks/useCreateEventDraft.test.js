import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDefaultDraft } from './useCreateEventDraft.js';
import { formatDisplayDate } from '../utils/datePicker.js';

describe('buildDefaultDraft', () => {
  it('defaults start and end date to today', () => {
    const draft = buildDefaultDraft();
    const today = formatDisplayDate(new Date());
    assert.equal(draft.startDate, today);
    assert.equal(draft.endDate, today);
  });

  it('starts guidelinesReviewed false and wizardStep 1', () => {
    const draft = buildDefaultDraft();
    assert.equal(draft.guidelinesReviewed, false);
    assert.equal(draft.wizardStep, 1);
  });
});
