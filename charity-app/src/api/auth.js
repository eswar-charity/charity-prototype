import { apiRequest, setTokens, clearTokens, getRefreshToken } from './client.js';

export async function login(body) {
  const data = await apiRequest('/auth/login', { method: 'POST', body, auth: false });
  setTokens(data);
  return data;
}

export async function register(body) {
  return apiRequest('/auth/register', { method: 'POST', body, auth: false });
}

export async function refresh() {
  const data = await apiRequest('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: getRefreshToken() },
    auth: false,
  });
  setTokens(data);
  return data;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
  clearTokens();
}

export async function me() {
  return apiRequest('/auth/me');
}

export async function identityGate(body) {
  const data = await apiRequest('/auth/identity-gate', { method: 'POST', body, auth: false });
  setTokens(data);
  return data;
}

export async function googleLogin(body) {
  const data = await apiRequest('/auth/google', { method: 'POST', body, auth: false });
  setTokens(data);
  return data;
}
