import { useEffect, useState, useRef } from 'react';
import { getEvent, getBackers, likeEvent, saveEvent, joinEvent } from '../api/events';
import { adaptEvent } from '../api/adapters/event';

/** UI fields the detail screens expect beyond adaptEvent. */
export function enrichDetailEvent(ev) {
  if (!ev) return null;
  const np = ev.nonprofitBrief;
  const org = ev.organizerBrief;
  const orgInitials =
    org?.initials ||
    (ev.organizer
      ? ev.organizer
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'SE');
  return {
    ...ev,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
    subtitle: ev.mission || '',
    story: ev.mission || '',
    chatCount: ev.chat ?? 0,
    npInitials: np?.initials || (ev.nonprofit ? ev.nonprofit.slice(0, 2).toUpperCase() : 'NP'),
    npBg: np?.color || '#1A6EB5',
    initials: orgInitials,
  };
}

/**
 * Load event by route key from live API.
 * @param {string|undefined} eventKey
 */
export function useEventDetail(eventKey) {
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventKey) {
      setEv(null);
      setLoading(false);
      setError(new Error('Missing event key'));
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvent(eventKey)
      .then((raw) => {
        if (!cancelled) setEv(enrichDetailEvent(adaptEvent(raw)));
      })
      .catch((err) => {
        if (!cancelled) {
          setEv(null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventKey]);

  return { ev, loading, error };
}

/** Map API backers → EventBackersModal row shape. */
export function adaptBackers(list) {
  const colors = ['var(--primary)', '#0D7377', '#7B1FA2', '#1976D2', '#1A6EB5', '#388E3C'];
  return (list || []).map((b, i) => {
    const name = b.public_name || b.name || 'Supporter';
    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      name,
      initials,
      color: colors[i % colors.length],
      amount: typeof b.amount === 'number' ? b.amount : Number(b.amount) || 0,
    };
  });
}

export function useEventBackers(eventKey, enabled, showToast) {
  const [backers, setBackers] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    if (!enabled || !eventKey) {
      setBackers(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setBackers(null);
    setLoading(true);
    getBackers(eventKey)
      .then((list) => {
        if (!cancelled) setBackers(adaptBackers(list));
      })
      .catch((err) => {
        if (!cancelled) {
          setBackers([]);
          showToastRef.current?.(err?.message || 'Could not load backers');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventKey, enabled]);

  const pending = Boolean(enabled && eventKey && (loading || backers === null));
  return { backers, loading: pending };
}

/**
 * Like / save / join with auth gate.
 * - Authenticated → live API + toast
 * - SE `loggedIn` prop without token → local UI only (prototype routes)
 * - Guest → call onNeedAuth (join modal / identity gate)
 */
export function useEventActions({ ev, loggedIn = false, isAuthenticated = false, onNeedAuth, showToast }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  const gateOrLocal = (localFn) => {
    if (isAuthenticated) return 'api';
    if (loggedIn) {
      localFn();
      return 'local';
    }
    onNeedAuth?.();
    return 'gate';
  };

  const handleLike = async () => {
    const mode = gateOrLocal(() => {
      setLiked((v) => !v);
      showToast?.(liked ? 'Removed like' : 'Liked');
    });
    if (mode !== 'api' || !ev?.id || busy) return;
    setBusy(true);
    try {
      await likeEvent(ev.id);
      setLiked((v) => !v);
      showToast?.(liked ? 'Removed like' : 'Liked');
    } catch (err) {
      showToast?.(err.message || 'Could not like event');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    const mode = gateOrLocal(() => {
      setSaved((v) => !v);
      showToast?.(saved ? 'Removed from saved' : 'Saved');
    });
    if (mode !== 'api' || !ev?.id || busy) return;
    setBusy(true);
    try {
      await saveEvent(ev.id);
      setSaved((v) => !v);
      showToast?.(saved ? 'Removed from saved' : 'Saved');
    } catch (err) {
      showToast?.(err.message || 'Could not save event');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (joined) return;
    const mode = gateOrLocal(() => {
      setJoined(true);
      showToast?.("You're in! See you there.");
    });
    if (mode !== 'api' || !ev?.id || busy) return;
    setBusy(true);
    try {
      await joinEvent(ev.id);
      setJoined(true);
      showToast?.("You're in! See you there.");
    } catch (err) {
      showToast?.(err.message || 'Could not join event');
    } finally {
      setBusy(false);
    }
  };

  return { liked, saved, joined, handleLike, handleSave, handleJoin, setJoined };
}
