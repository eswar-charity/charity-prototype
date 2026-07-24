import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from './client.js';

describe('ApiError', () => {
  it('exposes code message status', () => {
    const err = new ApiError('unauthorized', 'Nope', null, 401);
    assert.equal(err.code, 'unauthorized');
    assert.equal(err.message, 'Nope');
    assert.equal(err.status, 401);
    assert.equal(err.name, 'ApiError');
  });
});
