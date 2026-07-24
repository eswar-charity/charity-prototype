import { apiRequest } from './client.js';

export function listApprovals() {
  return apiRequest('/np/approvals');
}

export function getApproval(eventId) {
  return apiRequest(`/np/approvals/${eventId}`);
}

export function approveEvent(eventId) {
  return apiRequest(`/np/approvals/${eventId}/approve`, { method: 'POST' });
}

export function rejectEvent(eventId, reason) {
  return apiRequest(`/np/approvals/${eventId}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

export function requestChanges(eventId, feedback) {
  return apiRequest(`/np/approvals/${eventId}/request-changes`, {
    method: 'POST',
    body: { feedback },
  });
}

export function getAutopilot() {
  return apiRequest('/np/autopilot');
}

export function updateAutopilot({ enabled, checks }) {
  return apiRequest('/np/autopilot', { method: 'PATCH', body: { enabled, checks } });
}

export function addTrustedSe(seUserId) {
  return apiRequest('/np/autopilot/trusted-ses', {
    method: 'POST',
    body: { se_user_id: seUserId },
  });
}

export function removeTrustedSe(seUserId) {
  return apiRequest(`/np/autopilot/trusted-ses/${seUserId}`, { method: 'DELETE' });
}
