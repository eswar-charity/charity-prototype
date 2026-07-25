import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getIdentityGateCopy,
  stashGuestReturn,
  peekGuestReturn,
  consumeGuestReturn,
} from './identityGateIntent.js';

describe('identityGateIntent', () => {
  beforeEach(() => {
    try {
      sessionStorage.clear();
    } catch {
      /* node may lack sessionStorage in some envs */
    }
  });

  it('returns contextual copy by intent', () => {
    assert.match(getIdentityGateCopy('donate').headline, /Back/i);
    assert.match(getIdentityGateCopy('follow').body, /follow/i);
    assert.match(getIdentityGateCopy('unknown').headline, /Join the movement/);
  });

  it('stashes and consumes return path', () => {
    if (typeof sessionStorage === 'undefined') return;
    stashGuestReturn({ returnTo: '/guest/event/live/hi', intent: 'donate' });
    assert.deepEqual(peekGuestReturn(), {
      returnTo: '/guest/event/live/hi',
      intent: 'donate',
    });
    assert.deepEqual(consumeGuestReturn(), {
      returnTo: '/guest/event/live/hi',
      intent: 'donate',
    });
    assert.deepEqual(peekGuestReturn(), { returnTo: null, intent: null });
  });
});
