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

export function sendMessage(eventId, text) {
  return apiRequest(`/events/${eventId}/messages`, { method: 'POST', body: { text } });
}
