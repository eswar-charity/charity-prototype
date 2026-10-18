import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getEvent, listMyEvents, postEventUpdate } from '../api/events';
import { getSeLiveDashboard, getSePostEvent } from '../api/dashboards';
import { adaptEvent } from '../api/adapters/event';
import { useAuth } from '../auth/AuthContext';
import { resolveEventCover } from '../utils/eventPhotos';

const OWN_EVENT_STATUSES = [
  'Draft', 'Submitted', 'Changes Requested', 'Live', 'Completed', 'Rejected',
];

function initialsFrom(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function mapRecentUpdates(updates, organizer) {
  return (updates ?? []).map((u) => ({
    id: u.id,
    type: 'update',
    user: organizer?.name ?? 'Organizer',
    initials: organizer?.initials ?? initialsFrom(organizer?.name),
    color: organizer?.color ?? '#C62828',
    text: u.text ?? '',
    time: u.created_at
      ? new Date(u.created_at).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '',
    isOrganizer: true,
  }));
}

function enrichEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    cover: resolveEventCover(ev),
  };
}

/**
 * Resolve SE dashboard event key from ?key= or first owned event.
 */
export function useSeDashboardKey({ preferLive = false, preferCompleted = false } = {}) {
  const [searchParams] = useSearchParams();
  const keyParam = searchParams.get('key');
  const { user } = useAuth();
  const [key, setKey] = useState(keyParam);
  const [loading, setLoading] = useState(!keyParam);
  const [error, setError] = useState(null);

  const resolveKey = useCallback(async () => {
    if (keyParam) {
      setKey(keyParam);
      setLoading(false);
      setError(null);
      return keyParam;
    }
    if (!user?.id) {
      setError(new Error('Missing event key'));
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      // The organizer's own events (any status) — not the public feed, which hides
      // Submitted / Changes Requested events and caps at the newest 50 of everyone.
      const res = await listMyEvents({ statuses: OWN_EVENT_STATUSES });
      const owned = res.items ?? [];
      let pick;
      if (preferCompleted) {
        pick =
          owned.find((e) => e.status === 'Completed') ??
          owned.find((e) => e.status === 'Live' || e.is_live) ??
          owned[0];
      } else if (preferLive) {
        pick =
          owned.find((e) => e.status === 'Live' || e.is_live) ??
          owned.find((e) => ['Submitted', 'Changes Requested'].includes(e.status)) ??
          owned[0];
      } else {
        pick = owned[0];
      }
      if (!pick) throw new Error('No events found for your account');
      setKey(pick.key);
      return pick.key;
    } catch (err) {
      setKey(null);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [keyParam, preferCompleted, preferLive, user?.id]);

  useEffect(() => {
    resolveKey();
  }, [resolveKey]);

  return { key, loading, error };
}

export function useSeLiveDashboard() {
  const { key, loading: keyLoading, error: keyError } = useSeDashboardKey({ preferLive: true });
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postPending, setPostPending] = useState(false);

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, eventRaw] = await Promise.all([getSeLiveDashboard(key), getEvent(key)]);
      const event = enrichEvent(eventRaw);
      setData({
        event,
        eventId: dash.event?.id ?? eventRaw.id,
        stats: dash.stats ?? {},
        activities: mapRecentUpdates(dash.recent_updates, eventRaw.organizer ?? user),
      });
    } catch (err) {
      setData(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, user]);

  useEffect(() => {
    if (keyLoading) return;
    if (keyError) {
      setError(keyError);
      setLoading(false);
      return;
    }
    if (key) load();
    else setLoading(false);
  }, [key, keyError, keyLoading, load]);

  const submitUpdate = useCallback(
    async (text) => {
      if (!data?.eventId || !text?.trim() || postPending) return;
      setPostPending(true);
      try {
        await postEventUpdate(data.eventId, text.trim());
        await load();
      } finally {
        setPostPending(false);
      }
    },
    [data?.eventId, load, postPending],
  );

  return {
    data,
    loading: keyLoading || loading,
    error,
    postPending,
    submitUpdate,
    refresh: load,
  };
}

export function useSePostEvent() {
  const { key, loading: keyLoading, error: keyError } = useSeDashboardKey({ preferCompleted: true });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, eventRaw] = await Promise.all([getSePostEvent(key), getEvent(key)]);
      setData({
        event: enrichEvent(eventRaw),
        impact: dash.impact ?? {},
      });
    } catch (err) {
      setData(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (keyLoading) return;
    if (keyError) {
      setError(keyError);
      setLoading(false);
      return;
    }
    if (key) load();
    else setLoading(false);
  }, [key, keyError, keyLoading, load]);

  return { data, loading: keyLoading || loading, error, refresh: load };
}
