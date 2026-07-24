import { apiRequest } from './client.js';

export function signUpload({ folder = 'events', resourceType = 'image' } = {}) {
  return apiRequest('/media/sign', {
    method: 'POST',
    body: { folder, resource_type: resourceType },
  });
}

export function createMediaAsset(payload) {
  return apiRequest('/media', { method: 'POST', body: payload });
}
