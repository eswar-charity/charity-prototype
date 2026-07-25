import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleChatMediaAttach } from './chatMediaAttach.js';

describe('handleChatMediaAttach', () => {
  it('shows coming-soon toast when already authenticated (e.g. SE)', () => {
    const calls = [];
    const result = handleChatMediaAttach({
      isAuthed: true,
      onNeedAuth: () => calls.push('gate'),
      showToast: (msg) => calls.push(msg),
    });
    assert.equal(result, 'toast');
    assert.deepEqual(calls, ['Photo sharing is coming soon']);
  });

  it('opens identity gate when not authenticated', () => {
    const calls = [];
    const result = handleChatMediaAttach({
      isAuthed: false,
      onNeedAuth: () => calls.push('gate'),
      showToast: (msg) => calls.push(msg),
    });
    assert.equal(result, 'gate');
    assert.deepEqual(calls, ['gate']);
  });
});
