import { createMediaAsset } from '../api/media.js';
import { uploadDeviceMedia } from '../api/uploadDeviceMedia.js';

/**
 * Persist draft photos onto the event:
 * - Device File picks → Cloudinary (or local data-URL fallback) + media row
 * - Already-hosted / stock URLs → media metadata row
 * Returns { coverMediaId, photos } with blob previews replaced by persisted URLs.
 */
export async function syncEventDraftPhotos(eventId, photos) {
  if (!eventId || !Array.isArray(photos) || !photos.length) {
    return { coverMediaId: null, photos: Array.isArray(photos) ? photos : [] };
  }

  const next = [];
  let coverMediaId = null;
  let index = 0;

  for (const photo of photos) {
    if (photo?.mediaId && photo?.src && !String(photo.src).startsWith('blob:')) {
      if (coverMediaId == null) coverMediaId = photo.mediaId;
      next.push({
        id: photo.id,
        src: photo.src,
        type: photo.type || 'image',
        mediaId: photo.mediaId,
        bytes: photo.bytes,
      });
      continue;
    }

    if (photo?.file) {
      const asset = await uploadDeviceMedia(photo.file, {
        folder: 'events',
        eventId,
        entityType: 'event_photo',
      });
      if (photo.src?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(photo.src);
        } catch {
          /* ignore */
        }
      }
      if (coverMediaId == null && asset?.id) coverMediaId = asset.id;
      next.push({
        id: photo.id,
        src: asset.secure_url,
        type: photo.type || (asset.resource_type === 'video' ? 'video' : 'image'),
        mediaId: asset.id,
        bytes: asset.bytes,
      });
      continue;
    }

    const src = photo?.src;
    if (!src || typeof src !== 'string') continue;
    if (src.startsWith('blob:')) continue;
    // data: URLs without mediaId still need a media row for feed/detail.
    index += 1;
    const match = src.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    let format = (match?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    if (src.startsWith('data:image/')) {
      const mime = src.slice(5, src.indexOf(';'));
      format = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    }
    const publicId = `event-${eventId}-photo-${index}-${Date.now()}`;

    try {
      const asset = await createMediaAsset({
        public_id: publicId,
        secure_url: src,
        resource_type: photo.type === 'video' ? 'video' : 'image',
        format,
        bytes: Math.max(1, Number(photo.bytes) || 1),
        width: photo.width || null,
        height: photo.height || null,
        entity_type: 'event_photo',
        entity_id: eventId,
      });
      if (coverMediaId == null && asset?.id) coverMediaId = asset.id;
      next.push({
        id: photo.id,
        src: asset.secure_url || src,
        type: photo.type || 'image',
        mediaId: asset.id,
        bytes: asset.bytes,
      });
    } catch {
      next.push({
        id: photo.id,
        src,
        type: photo.type || 'image',
        mediaId: photo.mediaId,
        bytes: photo.bytes,
      });
      if (coverMediaId == null && photo.mediaId) coverMediaId = photo.mediaId;
    }
  }

  return { coverMediaId, photos: next };
}
