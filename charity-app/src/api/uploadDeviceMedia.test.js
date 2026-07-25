import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  inferResourceType,
  assertUploadableFile,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from './uploadDeviceMedia.js';

describe('uploadDeviceMedia validation', () => {
  it('infers video vs image', () => {
    assert.equal(inferResourceType({ type: 'video/mp4' }), 'video');
    assert.equal(inferResourceType({ type: 'image/jpeg' }), 'image');
  });

  it('rejects oversized images', () => {
    assert.throws(
      () => assertUploadableFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1, name: 'x.png' }),
      /10MB/,
    );
  });

  it('rejects oversized videos', () => {
    assert.throws(
      () => assertUploadableFile({ type: 'video/mp4', size: MAX_VIDEO_BYTES + 1, name: 'x.mp4' }),
      /100MB/,
    );
  });

  it('rejects unsupported types', () => {
    assert.throws(
      () => assertUploadableFile({ type: 'application/pdf', size: 100, name: 'x.pdf' }),
      /Unsupported/,
    );
  });
});
