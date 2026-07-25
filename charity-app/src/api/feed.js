import { apiRequest } from './client.js';

export function listPosts(key, { page = 1, limit = 50 } = {}) {
  return apiRequest(
    `/events/${encodeURIComponent(key)}/posts?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function listMessages(key, { page = 1, limit = 50 } = {}) {
  return apiRequest(
    `/events/${encodeURIComponent(key)}/messages?page=${page}&limit=${limit}`,
  );
}

export function sendMessage(eventId, textOrOpts) {
  const opts = typeof textOrOpts === 'string'
    ? { text: textOrOpts }
    : (textOrOpts || {});
  const body = {};
  const trimmed = typeof opts.text === 'string' ? opts.text.trim() : '';
  if (trimmed) body.text = trimmed;
  if (opts.mediaId != null) body.media_id = opts.mediaId;
  return apiRequest(`/events/${eventId}/messages`, { method: 'POST', body });
}
