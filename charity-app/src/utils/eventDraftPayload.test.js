import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapDraftToApiPayload } from './eventDraftPayload.js';

const baseDraft = {
  title: '',
  story: 'Neon night fundraiser for kids',
  nonprofitId: 5,
  category: 'Community',
  startDate: 'Oct 14, 2025',
  startTime: '9:00 AM',
  endTime: '9:00 PM',
  location: 'Central Park, New York NY',
  visibility: 'public',
  coverMediaId: null,
};

describe('mapDraftToApiPayload', () => {
  it('uses draft.title when set', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, title: 'My Custom Title' });
    assert.equal(payload.title, 'My Custom Title');
  });

  it('derives title from story hashtag when title is empty', () => {
    const payload = mapDraftToApiPayload(baseDraft);
    assert.equal(payload.title, 'Neonnightfundraiser');
  });

  it('falls back to Untitled event when title cannot be derived', () => {
    const payload = mapDraftToApiPayload({
      ...baseDraft,
      title: '',
      story: '',
    });
    assert.equal(payload.title, 'CharityBaby');
  });

  it('maps snake_case API fields', () => {
    const payload = mapDraftToApiPayload(baseDraft);
    assert.deepEqual(payload, {
      title: 'Neonnightfundraiser',
      story: baseDraft.story,
      nonprofit_id: 5,
      category: 'Community',
      date: 'Oct 14, 2025',
      start_time: '9:00 AM',
      end_time: '9:00 PM',
      location: 'Central Park, New York NY',
      visibility: 'public',
    });
  });

  it('defaults visibility to public', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, visibility: undefined });
    assert.equal(payload.visibility, 'public');
  });

  it('includes cover_media_id when coverMediaId is set', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, coverMediaId: 42 });
    assert.equal(payload.cover_media_id, 42);
  });

  it('includes wizard_step when wizardStep is set', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, wizardStep: 3 });
    assert.equal(payload.wizard_step, 3);
  });

  it('omits cover_media_id when coverMediaId is null', () => {
    const payload = mapDraftToApiPayload(baseDraft);
    assert.equal('cover_media_id' in payload, false);
  });

  it('maps nonprofit_id null when nonprofitId is null', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, nonprofitId: null });
    assert.equal(payload.nonprofit_id, null);
  });

  it('includes tags when present', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, tags: ['music', 'outdoor'] });
    assert.deepEqual(payload.tags, ['music', 'outdoor']);
  });
});
