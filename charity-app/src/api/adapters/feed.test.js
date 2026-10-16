import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adaptCommunityPosts, adaptChatMessage } from './feed.js';

describe('adaptCommunityPosts', () => {
  it('returns an empty thread when the API has no posts (nothing is fabricated)', () => {
    assert.deepEqual(adaptCommunityPosts([]), []);
    assert.deepEqual(adaptCommunityPosts(undefined), []);
  });

  it('maps API posts, authors, media and replies as-is', () => {
    const items = [{
      id: 1,
      phase: 'during',
      text: 'Live now!',
      highlight: 'Kickoff',
      media_url: 'https://res.cloudinary.com/demo/image/upload/v1/events/neon-night/img2.jpg',
      author: { name: 'Mike Rivera', initials: 'MR', color: '#C62828' },
      host: true,
      verified: true,
      created_at: '2026-07-24T12:00:00Z',
      replies: [{
        id: 5, text: 'So excited', created_at: '2026-07-24T12:05:00Z',
        author: { name: 'Sofia R.', initials: 'SR', color: '#7C3AED' },
      }],
    }];
    const [post] = adaptCommunityPosts(items);
    assert.equal(post.media, items[0].media_url);
    assert.equal(post.name, 'Mike Rivera');
    assert.equal(post.host, true);
    assert.equal(post.highlight, 'Kickoff');
    assert.equal(post.replies.length, 1);
    assert.equal(post.replies[0].name, 'Sofia R.');
    assert.equal(post.replies[0].media, null);
  });

  it('does not attach gallery photos to posts that have none', () => {
    const posts = adaptCommunityPosts([
      { id: 1, text: 'No image post', media_url: null, author: { name: 'A', initials: 'A' }, replies: [] },
      { id: 2, text: 'Also text only', media_url: null, author: { name: 'B', initials: 'B' }, replies: [] },
    ]);
    assert.equal(posts[0].media, null);
    assert.equal(posts[1].media, null);
    assert.equal(posts.length, 2);
  });

  it('falls back to safe labels for missing authors', () => {
    const [post] = adaptCommunityPosts([{ id: 3, text: 'hi', replies: [] }]);
    assert.equal(post.name, 'Member');
    assert.equal(post.initials, '?');
    assert.equal(post.phase, 'during');
  });
});

describe('adaptChatMessage', () => {
  it('marks current user messages as mine', () => {
    const ui = adaptChatMessage({
      id: 9,
      text: 'Hello',
      host: false,
      verified: false,
      author: { id: 42, name: 'You', initials: 'YO', color: '#7B1FA2' },
    }, 42);
    assert.equal(ui.mine, true);
    assert.equal(ui.initials, 'ME');
    assert.equal(ui.sent, 'Sent');
  });

  it('maps other authors without mine flag', () => {
    const ui = adaptChatMessage({
      id: 1,
      text: 'Hi',
      host: true,
      verified: true,
      reaction: 3,
      author: { id: 2, name: 'Mike Rivera', initials: 'MR', color: '#C62828' },
    }, 42);
    assert.equal(ui.mine, false);
    assert.equal(ui.initials, 'MR');
    assert.equal(ui.host, true);
    assert.equal(ui.reaction, 3);
  });

  it('maps media_url and media_resource_type', () => {
    const m = adaptChatMessage({
      id: 1,
      text: 'hi',
      media_url: 'https://cdn.example.com/a.jpg',
      media_resource_type: 'image',
      author: { id: 9, name: 'Ada', initials: 'A' },
    }, 9);
    assert.equal(m.media, 'https://cdn.example.com/a.jpg');
    assert.equal(m.mediaType, 'image');
    assert.equal(m.mine, true);
  });

  it('allows media-only messages', () => {
    const m = adaptChatMessage({
      id: 2,
      text: null,
      media_url: 'https://cdn.example.com/v.mp4',
      media_resource_type: 'video',
      author: { id: 1, name: 'Bob', initials: 'B' },
    }, 99);
    assert.equal(m.text, null);
    assert.equal(m.mediaType, 'video');
    assert.equal(m.mine, false);
  });
});
