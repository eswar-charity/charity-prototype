import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCardNumber,
  STRIPE_TEST_SUCCESS,
  STRIPE_TEST_FAIL,
} from '../utils/staticStripe.js';

describe('formatCardNumber', () => {
  it('groups digits in fours', () => {
    assert.equal(formatCardNumber(STRIPE_TEST_SUCCESS), '4242 4242 4242 4242');
  });

  it('strips non-digits and caps at 16', () => {
    assert.equal(formatCardNumber('4242-4242-4242-4242-999'), '4242 4242 4242 4242');
  });
});

describe('static stripe test cards', () => {
  it('fail card ends in 0002', () => {
    assert.ok(STRIPE_TEST_FAIL.endsWith('0002'));
  });
});
