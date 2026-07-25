import { signUpload, createMediaAsset } from './media.js';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
/** Local data-URL fallback when Cloudinary is not configured (prototype). */
export const MAX_LOCAL_FALLBACK_BYTES = 1.5 * 1024 * 1024;

const IMAGE_MIME = /^image\/(jpeg|jpg|png|webp|gif|heic)$/i;
const VIDEO_MIME = /^video\/(mp4|quicktime|webm)$/i;

export function inferResourceType(file) {
  return String(file?.type || '').startsWith('video/') ? 'video' : 'image';
}

export function assertUploadableFile(file) {
  if (!file) throw new Error('No file selected');
  const type = file.type || '';
  const isVideo = VIDEO_MIME.test(type) || type === 'video/mov';
  if (isVideo) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error('Video exceeds 100MB limit');
    return 'video';
  }
  const isImage = IMAGE_MIME.test(type) || /^image\//i.test(type);
  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image exceeds 10MB limit');
    return 'image';
  }
  throw new Error('Unsupported file type');
}

function formatFromFile(file, resourceType) {
  const name = String(file.name || '');
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    const ext = match[1].toLowerCase().replace('jpeg', 'jpg');
    if (ext === 'mov') return 'mov';
    return ext;
  }
  if (resourceType === 'video') return 'mp4';
  const mime = String(file.type || '');
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

async function persistLocalAsset(file, { eventId, entityType, resourceType }) {
  if (resourceType !== 'image') {
    throw new Error('Video upload requires Cloudinary. Configure CLOUDINARY_* or use an image.');
  }
  if (file.size > MAX_LOCAL_FALLBACK_BYTES) {
    throw new Error('Image is too large for local upload (max 1.5MB without Cloudinary)');
  }
  const dataUrl = await readFileAsDataUrl(file);
  const fmt = formatFromFile(file, resourceType);
  const publicId = `local-${entityType || 'media'}-${eventId || 'x'}-${Date.now()}`;
  return createMediaAsset({
    public_id: publicId,
    secure_url: dataUrl,
    resource_type: resourceType,
    format: fmt,
    bytes: file.size,
    width: null,
    height: null,
    entity_type: entityType,
    entity_id: eventId,
  });
}

/**
 * Upload a device file to Cloudinary (or local data-URL fallback) and register media.
 */
export async function uploadDeviceMedia(
  file,
  { folder = 'chat', eventId = null, entityType = 'chat' } = {},
) {
  const resourceType = assertUploadableFile(file);

  let sign;
  try {
    sign = await signUpload({ folder, resourceType });
  } catch (err) {
    return persistLocalAsset(file, { eventId, entityType, resourceType });
  }

  if (!sign?.cloud_name || !sign?.api_key || !sign?.signature) {
    return persistLocalAsset(file, { eventId, entityType, resourceType });
  }

  try {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sign.api_key);
    form.append('timestamp', String(sign.timestamp));
    form.append('signature', sign.signature);
    form.append('folder', sign.folder);

    const cloudUrl = `https://api.cloudinary.com/v1_1/${sign.cloud_name}/${resourceType}/upload`;
    const cloudRes = await fetch(cloudUrl, { method: 'POST', body: form });
    if (!cloudRes.ok) {
      const detail = await cloudRes.text().catch(() => '');
      throw new Error(detail || 'Cloudinary upload failed');
    }
    const uploaded = await cloudRes.json();

    return createMediaAsset({
      public_id: uploaded.public_id,
      secure_url: uploaded.secure_url,
      resource_type: uploaded.resource_type || resourceType,
      format: uploaded.format,
      bytes: uploaded.bytes,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      entity_type: entityType,
      entity_id: eventId,
    });
  } catch (err) {
    // Prototype fallback when Cloudinary credentials are missing/invalid.
    return persistLocalAsset(file, { eventId, entityType, resourceType });
  }
}
