import { signUpload, createMediaAsset } from './media.js';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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

export async function uploadDeviceMedia(file, { folder = 'chat', eventId = null } = {}) {
  const resourceType = assertUploadableFile(file);
  const sign = await signUpload({ folder, resourceType });
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
    entity_type: 'chat',
    entity_id: eventId,
  });
}
