import { apiRequest } from './client.js';

export function getSeLiveDashboard(key) {
  return apiRequest(`/se/live-dashboard/${encodeURIComponent(key)}`);
}

export function getSePostEvent(key) {
  return apiRequest(`/se/post-event/${encodeURIComponent(key)}`);
}
