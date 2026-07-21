import { useCallback, useEffect, useState } from 'react';
import { ACCESS_CODES, FOUNDER_KEY, getRotatingPassword } from './accessConfig';

const STORAGE_KEY = 'ch_prototype_access';

function normalize(value) {
  return (value || '').trim().toUpperCase();
}

function findValidEntry(rawCode) {
  const code = normalize(rawCode);
  if (!code) return null;
  if (code === normalize(getRotatingPassword())) return { code, isAdmin: false };
  if (code === normalize(FOUNDER_KEY)) return { code, isAdmin: true };
  const match = ACCESS_CODES.find((entry) => normalize(entry.code) === code);
  return match ? { code, isAdmin: false } : null;
}

function readStoredEntry() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return stored?.code ? findValidEntry(stored.code) : null;
  } catch {
    return null;
  }
}

/**
 * Gates the app behind a rotating passphrase, a founder key, and a list of
 * named reviewer codes (see accessConfig.js). Revalidated on every load, so
 * revoking a code or letting the passphrase roll over locks out a stale
 * session the next time that tab reloads.
 */
export default function useAccessGate() {
  const [state, setState] = useState(() => {
    const entry = readStoredEntry();
    return { unlocked: !!entry, isAdmin: !!entry?.isAdmin, error: '' };
  });

  useEffect(() => {
    if (state.unlocked) return;
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get('access');
    if (!fromLink) return;

    const entry = findValidEntry(fromLink);
    if (!entry) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: entry.code }));
    params.delete('access');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
    setState({ unlocked: true, isAdmin: entry.isAdmin, error: '' });
  }, [state.unlocked]);

  const submit = useCallback((rawCode) => {
    const entry = findValidEntry(rawCode);
    if (!entry) {
      setState((s) => ({ ...s, error: 'That code is not valid. Check for typos or ask for a fresh link.' }));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: entry.code }));
    setState({ unlocked: true, isAdmin: entry.isAdmin, error: '' });
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ unlocked: false, isAdmin: false, error: '' });
  }, []);

  return { ...state, submit, lock };
}
