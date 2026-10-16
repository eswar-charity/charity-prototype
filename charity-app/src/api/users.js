import { apiRequest } from './client.js';

export function getProfile() {
  return apiRequest('/me/profile');
}

/** Public organizer profile (name, bio, city, causes). No auth needed. */
export function getOrganizer(userId) {
  return apiRequest(`/organizers/${userId}`, { auth: false });
}

export function updateProfile(patch) {
  return apiRequest('/me/profile', { method: 'PATCH', body: patch });
}
