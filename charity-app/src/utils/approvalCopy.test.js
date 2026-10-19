import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { approvalCopy, reviewAction } from './approvalCopy.js';

describe('approvalCopy', () => {
  it('never promises a response time', () => {
    for (const status of ['Submitted', 'Draft', 'Changes Requested', 'Rejected']) {
      const { title, sub } = approvalCopy('review', status, 'Sierra Club Foundation');
      assert.doesNotMatch(`${title} ${sub}`, /hour|within|days?\b/i);
    }
  });

  it('says the right thing for each review status', () => {
    assert.equal(approvalCopy('review', 'Submitted', 'ASPCA').title, 'Submitted!');
    assert.match(approvalCopy('review', 'Submitted', 'ASPCA').sub, /ASPCA is reviewing/);
    assert.equal(approvalCopy('review', 'Changes Requested', 'ASPCA').title, 'Changes requested');
    assert.equal(approvalCopy('review', 'Rejected', 'ASPCA').title, 'Not approved');
    assert.equal(approvalCopy('review', 'Draft', 'ASPCA').title, 'Draft saved');
  });

  it('a rejected event is not described as being reviewed', () => {
    assert.doesNotMatch(approvalCopy('review', 'Rejected', 'ASPCA').sub, /reviewing/i);
  });

  it('covers the live and completed states', () => {
    assert.equal(approvalCopy('live', 'Live', 'x').title, 'You’re live!');
    assert.equal(approvalCopy('completed', 'Completed', 'x').title, 'Event complete');
  });

  it('falls back to a generic nonprofit name', () => {
    assert.match(approvalCopy('review', 'Submitted').sub, /The nonprofit is reviewing/);
  });
});

describe('reviewAction', () => {
  it('only offers editing where the server allows it', () => {
    assert.equal(reviewAction('Changes Requested'), 'update');
    assert.equal(reviewAction('Draft'), 'drafts');
  });

  it('offers no edit button for a Submitted event', () => {
    assert.equal(reviewAction('Submitted'), null);
  });

  it('offers a new event, not an edit, after a rejection', () => {
    assert.equal(reviewAction('Rejected'), 'new');
  });
});

import { decisionNode, heroBackground, liveNodeSub, NO_PHOTO_BACKGROUND, statusBadge } from './approvalCopy.js';
import { DEFAULT_EVENT_COVER } from './eventPhotos.js';

describe('timeline decision step', () => {
  it('shows a rejection as a rejection, not "Awaiting approval"', () => {
    assert.deepEqual(decisionNode('Rejected', 'ASPCA', false), { label: 'Not approved', sub: 'Declined by ASPCA' });
    assert.equal(liveNodeSub('Rejected'), 'Not published');
  });

  it('shows requested changes', () => {
    assert.equal(decisionNode('Changes Requested', 'ASPCA', false).label, 'Changes requested');
  });

  it('keeps the normal waiting and approved wording', () => {
    assert.equal(decisionNode('Submitted', 'ASPCA', false).sub, 'Awaiting nonprofit approval');
    assert.equal(decisionNode('Live', 'ASPCA', true).sub, 'Approved by ASPCA');
    assert.equal(liveNodeSub('Submitted'), 'Publish once approved');
  });
});

describe('heroBackground', () => {
  it('uses a gradient, never the cropped logo, when there is no photo', () => {
    assert.equal(heroBackground(null), NO_PHOTO_BACKGROUND);
    assert.equal(heroBackground(DEFAULT_EVENT_COVER), NO_PHOTO_BACKGROUND);
  });

  it('uses the real photo when there is one', () => {
    assert.equal(heroBackground('https://res.cloudinary.com/x/a.jpg'), 'url(https://res.cloudinary.com/x/a.jpg)');
    assert.match(heroBackground('https://res.cloudinary.com/x/a.jpg', { scrim: true }), /linear-gradient.*url\(https:/);
  });
});

describe('statusBadge', () => {
  it('matches the real status', () => {
    assert.equal(statusBadge('review', 'Submitted'), 'IN REVIEW');
    assert.equal(statusBadge('review', 'Rejected'), 'NOT APPROVED');
    assert.equal(statusBadge('review', 'Changes Requested'), 'CHANGES REQUESTED');
    assert.equal(statusBadge('review', 'Draft'), 'DRAFT');
    assert.equal(statusBadge('completed', 'Completed'), 'COMPLETED');
  });
});
