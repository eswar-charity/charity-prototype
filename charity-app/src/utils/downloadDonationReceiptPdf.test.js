import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { receiptFileSlug } from './downloadDonationReceiptPdf.js';

describe('receiptFileSlug', () => {
  it('slugifies event titles for filenames', () => {
    assert.equal(receiptFileSlug('#Neon Night'), 'neon-night');
    assert.equal(receiptFileSlug('Coastal Cleanup!!!'), 'coastal-cleanup');
  });

  it('falls back for empty titles', () => {
    assert.equal(receiptFileSlug(''), 'event');
    assert.equal(receiptFileSlug('@@@'), 'event');
  });
});
