import { apiRequest } from './client.js';

export function listEvents({ cause, discovery, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (cause && cause !== 'All') params.set('cause', cause);
  if (discovery && discovery !== 'All') params.set('discovery', discovery);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return apiRequest(`/events?${params}`, { auth: false });
}

export function getEvent(key) {
  return apiRequest(`/events/${encodeURIComponent(key)}`, { auth: false });
}

export function getBackers(key) {
  return apiRequest(`/events/${encodeURIComponent(key)}/backers`, { auth: false });
}

export function likeEvent(eventId) {
  return apiRequest(`/events/${eventId}/like`, { method: 'POST' });
}

export function saveEvent(eventId) {
  return apiRequest(`/events/${eventId}/save`, { method: 'POST' });
}

export function joinEvent(eventId) {
  return apiRequest(`/events/${eventId}/join`, { method: 'POST' });
}

export function createEvent(body) {
  return apiRequest('/events', { method: 'POST', body });
}

export function updateEvent(eventId, body) {
  return apiRequest(`/events/${eventId}`, { method: 'PATCH', body });
}

export function saveDraft(eventId, body) {
  return apiRequest(`/events/${eventId}/save-draft`, { method: 'POST', body });
}

export function submitEvent(eventId) {
  return apiRequest(`/events/${eventId}/submit`, { method: 'POST' });
}

export function goLive(eventId) {
  return apiRequest(`/events/${eventId}/go-live`, { method: 'POST' });
}

export function completeEvent(eventId) {
  return apiRequest(`/events/${eventId}/complete`, { method: 'POST' });
}

export function postEventUpdate(eventId, text) {
  return apiRequest(`/events/${eventId}/updates`, { method: 'POST', body: { text } });
}
