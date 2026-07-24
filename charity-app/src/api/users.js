import { apiRequest } from './client.js';

export function getProfile() {
  return apiRequest('/me/profile');
}

export function updateProfile(patch) {
  return apiRequest('/me/profile', { method: 'PATCH', body: patch });
}
