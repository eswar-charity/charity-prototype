import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adaptEvent } from './event.js';

describe('adaptEvent', () => {
  it('maps snake_case and nested briefs', () => {
    const ui = adaptEvent({
      id: 1, key: 'neon-night', title: '#NeonNight', story: 'Party',
      category: 'Community', kind: 'SE-led', status: 'Live', visibility: 'public',
      is_live: true, date: 'Nov 14, 2026', start_time: '7:00 PM', end_time: '10:00 PM',
      location: 'Brooklyn', backed: 213, joined: 87, updates: 38, chat_count: 212, raised: 14280,
      nonprofit: { id: 1, name: 'United Way', slug: 'united-way', verified: true },
      organizer: { id: 2, name: 'Mike Rivera', initials: 'MR', color: '#C62828' },
      tags: [], photos: [],
    });
    assert.equal(ui.isLive, true);
    assert.equal(ui.mission, 'Party');
    assert.equal(ui.nonprofit, 'United Way');
    assert.equal(ui.chat, 212);
    assert.equal(ui.startTime, '7:00 PM');
  });
});
