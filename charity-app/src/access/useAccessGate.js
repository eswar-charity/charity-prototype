import { useCallback, useEffect, useState } from 'react';
import { ACCESS_CODES, FOUNDER_KEY, decodeGeneratedPassword } from './accessConfig';

const STORAGE_KEY = 'ch_prototype_access';

function normalize(value) {
  return (value || '').trim().toUpperCase();
}

/**
 * Checks a raw password against the standing codes (accessConfig.js — no
 * expiry) and against the generated-password format (self-expiring, see
 * accessConfig.js). Returns null if the password is unrecognized, otherwise
 * { isAdmin, expiresAt } — expiresAt is null for standing codes.
 */
function checkPassword(rawPassword) {
  const value = normalize(rawPassword);
  if (!value) return null;

  if (value === normalize(FOUNDER_KEY)) return { isAdmin: true, expiresAt: null };

  const standing = ACCESS_CODES.find((entry) => normalize(entry.code) === value);
  if (standing) return { isAdmin: false, expiresAt: null };

  const generated = decodeGeneratedPassword(rawPassword);
  if (generated) return { isAdmin: false, expiresAt: generated.expiresAt };

  return null;
}

function isExpired(expiresAt) {
  return typeof expiresAt === 'number' && expiresAt <= Date.now();
}

function readStoredEntry() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored?.password) return null;
    const result = checkPassword(stored.password);
    if (!result || isExpired(result.expiresAt)) return null;
    return { ...result, username: stored.username || '' };
  } catch {
    return null;
  }
}

/**
 * Gates the app behind a username + password. A password is either a
 * standing code (accessConfig.js — no expiry, edit + redeploy to revoke) or
 * a generated password carrying its own 24h/48h expiry (see the founder
 * panel in AccessGate.jsx). Revalidated on every load, so a revoked standing
 * code or an elapsed generated password locks a stale session out the next
 * time that tab reloads — the "expires in N hours" promise holds even for
 * someone who already unlocked and left the tab open across the deadline.
 */
export default function useAccessGate() {
  const [state, setState] = useState(() => {
    const entry = readStoredEntry();
    return {
      unlocked: !!entry,
      isAdmin: !!entry?.isAdmin,
      username: entry?.username || '',
      error: '',
    };
  });

  useEffect(() => {
    if (state.unlocked) return;
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get('access');
    if (!fromLink) return;

    const result = checkPassword(fromLink);
    if (!result || isExpired(result.expiresAt)) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: 'Reviewer', password: fromLink }));
    params.delete('access');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
    setState({ unlocked: true, isAdmin: result.isAdmin, username: 'Reviewer', error: '' });
  }, [state.unlocked]);

  const submit = useCallback((username, password) => {
    if (!username.trim() || !password.trim()) {
      setState((s) => ({ ...s, error: 'Enter both your name and the access password.' }));
      return;
    }

    const result = checkPassword(password);
    if (!result) {
      setState((s) => ({ ...s, error: 'That password is not valid. Check for typos or ask for a fresh one.' }));
      return;
    }
    if (isExpired(result.expiresAt)) {
      setState((s) => ({ ...s, error: 'That password has expired. Ask whoever shared it for a new one.' }));
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: username.trim(), password }));
    setState({ unlocked: true, isAdmin: result.isAdmin, username: username.trim(), error: '' });
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ unlocked: false, isAdmin: false, username: '', error: '' });
  }, []);

  return { ...state, submit, lock };
}
