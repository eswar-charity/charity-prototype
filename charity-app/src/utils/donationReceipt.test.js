import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcDonationReceipt } from './donationReceipt.js';

describe('calcDonationReceipt', () => {
  it('uses $3 tip when donation >= 25', () => {
    const r = calcDonationReceipt(25);
    assert.equal(r.donation, 25);
    assert.equal(r.tip, 3);
    assert.equal(r.processingFee, 1.11); // round(28 * 0.03964, 2)
    assert.equal(r.total, 29.11);
  });

  it('uses 12% tip (min $1) when donation < 25', () => {
    const r = calcDonationReceipt(10);
    assert.equal(r.tip, 1.2);
  });
});
