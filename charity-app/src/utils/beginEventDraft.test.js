import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapEventToDraftPatch } from './beginEventDraft.js';

describe('mapEventToDraftPatch', () => {
  it('maps fields and clears fix mode', () => {
    const patch = mapEventToDraftPatch({
      id: 10,
      key: 'park-day',
      title: 'Park Day',
      story: 'Hello',
      date: 'Jul 26, 2026',
      location: 'Park',
      start_time: '9:00 AM',
      end_time: '5:00 PM',
      visibility: 'public',
      wizard_step: 3,
      nonprofit: { id: 2, category: 'Environment' },
      photos: ['https://example.com/a.jpg'],
      cover_media_id: 7,
    });
    assert.equal(patch.serverEventId, 10);
    assert.equal(patch.fixMode, false);
    assert.equal(patch.guidelinesReviewed, false);
    assert.equal(patch.wizardStep, 3);
    assert.equal(patch.nonprofitId, 2);
    assert.equal(patch.photos.length, 1);
    assert.equal(patch.coverMediaId, 7);
  });

  it('defaults wizardStep to 1 when missing', () => {
    const patch = mapEventToDraftPatch({ id: 1, key: 'x', photos: [] });
    assert.equal(patch.wizardStep, 1);
  });
});
