import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapEventStatusToUi } from './eventApprovalStatus.js';

describe('mapEventStatusToUi', () => {
  it('maps review states even if is_live is true', () => {
    assert.equal(mapEventStatusToUi('Submitted', false), 'review');
    assert.equal(mapEventStatusToUi('Submitted', true), 'review');
    assert.equal(mapEventStatusToUi('Changes Requested', false), 'review');
  });
  it('maps approved, live, completed', () => {
    assert.equal(mapEventStatusToUi('Approved', false), 'approved');
    assert.equal(mapEventStatusToUi('Approved', true), 'approved');
    assert.equal(mapEventStatusToUi('Live', true), 'live');
    assert.equal(mapEventStatusToUi('Live', false), 'live');
    assert.equal(mapEventStatusToUi('Completed', false), 'completed');
  });
});
