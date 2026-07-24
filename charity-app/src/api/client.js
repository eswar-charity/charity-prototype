const ACCESS_KEY = 'ch_access_token';
const REFRESH_KEY = 'ch_refresh_token';

export class ApiError extends Error {
  constructor(code, message, details = null, status = 0) {
    super(message || code || 'request_failed');
    this.name = 'ApiError';
    this.code = code || 'request_failed';
    this.details = details;
    this.status = status;
  }
}

export function getApiBase() {
  try {
    const fromVite = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL;
    return fromVite || process.env.VITE_API_BASE_URL || 'http://localhost:8000';
  } catch {
    return process.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function parseError(res) {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }
  const err = payload && payload.error;
  throw new ApiError(
    err?.code || 'http_error',
    err?.message || res.statusText || 'Request failed',
    err?.details ?? null,
    res.status,
  );
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new ApiError('unauthorized', 'Not signed in', null, 401);
  const res = await fetch(`${getApiBase()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    clearTokens();
    await parseError(res);
  }
  const data = await res.json();
  setTokens(data);
  return data.access_token;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, auth = true, headers = {}, _retried = false } = options;
  const url = path.startsWith('http') ? path : `${getApiBase()}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const finalHeaders = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  if (res.status === 401 && auth && !_retried) {
    refreshPromise = refreshPromise || refreshAccessToken().finally(() => { refreshPromise = null; });
    await refreshPromise;
    return apiRequest(path, { ...options, _retried: true });
  }
  if (!res.ok) await parseError(res);
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}
