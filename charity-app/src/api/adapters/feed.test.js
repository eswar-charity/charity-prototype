import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptCommunityPosts,
  adaptChatMessage,
  galleryUrlsForEvent,
  synthesizeGalleryThread,
} from './feed.js';

const ev = {
  key: 'neon-night',
  organizer: 'Mike Rivera',
  initials: 'MR',
  photos: ['/events/neon-night/img1.jpg', '/events/neon-night/img2.jpg', '/events/neon-night/img3.jpg'],
};

describe('galleryUrlsForEvent', () => {
  it('prefers event photos when present', () => {
    const urls = galleryUrlsForEvent(ev);
    assert.ok(urls.length >= 2);
    assert.equal(urls[0], '/events/neon-night/img1.jpg');
  });

  it('falls back to catalog photos by key', () => {
    const urls = galleryUrlsForEvent({ key: 'neon-night', photos: [] });
    assert.ok(urls.length > 0);
    assert.match(urls[0], /\/events\/neon-night\//);
  });
});

describe('adaptCommunityPosts', () => {
  it('synthesizes gallery thread when items empty', () => {
    const gallery = ['/events/neon-night/img2.jpg', '/events/neon-night/img3.jpg'];
    const posts = adaptCommunityPosts([], gallery, ev);
    assert.ok(posts.length >= 4);
    assert.ok(posts.some((p) => p.text && !p.media), 'includes text-only posts');
    assert.ok(posts.some((p) => p.media), 'includes photo posts');
    assert.equal(posts.find((p) => p.media === gallery[0]).text, 'Setting up — the energy is already here.');
  });

  it('prefers media_url over gallery pool', () => {
    const gallery = ['/events/neon-night/img2.jpg', '/events/neon-night/img3.jpg'];
    const items = [{
      id: 1,
      phase: 'during',
      text: 'Live now!',
      media_url: 'https://cdn.example.com/live.jpg',
      author: { name: 'Mike Rivera', initials: 'MR', color: '#C62828' },
      host: true,
      verified: true,
      created_at: '2026-07-24T12:00:00Z',
      replies: [],
    }];
    const posts = adaptCommunityPosts(items, gallery, ev);
    assert.equal(posts[0].media, 'https://cdn.example.com/live.jpg');
  });

  it('fills gallery on every other post so some stay text-only', () => {
    const gallery = ['/events/neon-night/img2.jpg', '/events/neon-night/img3.jpg'];
    const items = [
      {
        id: 1,
        phase: 'before',
        text: 'No image post',
        media_url: null,
        author: { name: 'Mike Rivera', initials: 'MR', color: '#C62828' },
        host: true,
        created_at: '2026-07-24T11:00:00Z',
        replies: [],
      },
      {
        id: 2,
        phase: 'during',
        text: 'Second post stays text-only',
        media_url: null,
        author: { name: 'Guest', initials: 'G', color: '#1976D2' },
        created_at: '2026-07-24T12:00:00Z',
        replies: [],
      },
    ];
    const posts = adaptCommunityPosts(items, gallery, ev);
    assert.equal(posts[0].media, '/events/neon-night/img2.jpg');
    assert.equal(posts[1].media, null);
    assert.equal(posts[1].text, 'Second post stays text-only');
  });
});

describe('synthesizeGalleryThread', () => {
  it('mixes captioned photos with text-only posts', () => {
    const thread = synthesizeGalleryThread(['/a.jpg', '/b.jpg'], ev);
    assert.ok(thread.length >= 4);
    assert.ok(thread.every((p) => p.text), 'every post has text');
    assert.equal(thread.filter((p) => p.media).length, 2);
    assert.ok(thread.filter((p) => !p.media).length >= 2);
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
