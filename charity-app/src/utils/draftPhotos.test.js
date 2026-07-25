import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appendDraftPhotos, removeDraftPhoto } from './draftPhotos.js';

describe('draftPhotos', () => {
  it('appends files with blob preview and File reference', () => {
    const file = new Blob(['x'], { type: 'image/jpeg' });
    Object.defineProperty(file, 'name', { value: 'a.jpg' });
    const next = appendDraftPhotos([], [file]);
    assert.equal(next.length, 1);
    assert.equal(next[0].type, 'image');
    assert.equal(next[0].file, file);
    assert.match(next[0].src, /^blob:/);
  });

  it('respects max photo count', () => {
    const files = Array.from({ length: 5 }, () => new Blob(['x'], { type: 'image/jpeg' }));
    const next = appendDraftPhotos(
      [{ id: 1, src: '/x.jpg' }, { id: 2, src: '/y.jpg' }],
      files,
      { max: 4 },
    );
    assert.equal(next.length, 4);
  });

  it('removes a photo by id', () => {
    const photos = [
      { id: 1, src: '/a.jpg' },
      { id: 2, src: '/b.jpg' },
    ];
    assert.deepEqual(removeDraftPhoto(photos, 1), [{ id: 2, src: '/b.jpg' }]);
  });
});
