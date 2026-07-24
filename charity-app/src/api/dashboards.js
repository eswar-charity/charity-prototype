import { apiRequest } from './client.js';

export function getSeLiveDashboard(key) {
  return apiRequest(`/se/live-dashboard/${encodeURIComponent(key)}`);
}

export function getSePostEvent(key) {
  return apiRequest(`/se/post-event/${encodeURIComponent(key)}`);
}

export function getNpLaunchpad() {
  return apiRequest('/np/launchpad');
}

export function getNpActivity() {
  return apiRequest('/np/activity');
}

export function getNpFinancials() {
  return apiRequest('/np/financials');
}
