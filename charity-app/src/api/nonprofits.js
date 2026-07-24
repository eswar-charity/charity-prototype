import { apiRequest } from './client.js';

export function listNonprofits({ q, category, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('search', q);
  if (category && category !== 'All') params.set('category', category);
  return apiRequest(`/nonprofits?${params}`, { auth: false });
}

export function getNonprofit(slug) {
  return apiRequest(`/nonprofits/${encodeURIComponent(slug)}`, { auth: false });
}

export function getNpProfile() {
  return apiRequest('/np/profile');
}

export function updateNpProfile(body) {
  return apiRequest('/np/profile', { method: 'PATCH', body });
}
