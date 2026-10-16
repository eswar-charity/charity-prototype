import { apiRequest } from './client.js';

/** Public cause taxonomy: [{ id, name, icon, color, description }]. */
export function listCategories() {
  return apiRequest('/categories', { auth: false });
}

/** Categories that have public events, with counts and a featured event. */
export function listCauses() {
  return apiRequest('/causes', { auth: false });
}
