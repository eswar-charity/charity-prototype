import { apiRequest } from './client.js';

export function listNotifications() {
  return apiRequest('/me/notifications');
}

export function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
}
