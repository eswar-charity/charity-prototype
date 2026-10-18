import { useCallback, useEffect, useMemo, useState } from 'react';
import { listMyEvents } from '../api/events';
import { getProfile } from '../api/users';
import { adaptEvent } from '../api/adapters/event';
import { useAuth } from '../auth/AuthContext';
import { resolveEventCover } from '../utils/eventPhotos';

function enrichProfileEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    cover: resolveEventCover(ev),
  };
}

/** Live SE profile + owned events from GET /me/profile and GET /events/mine. */
export function useSeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [hostedEvents, setHostedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prof, eventsRes] = await Promise.all([
        getProfile(),
        // Hosted = the organizer's own public events, regardless of how many other
        // events exist on the platform.
        listMyEvents({ statuses: ['Live', 'Completed'] }),
      ]);
      const owned = (eventsRes.items ?? []).map(enrichProfileEvent);
      setProfile(prof);
      setHostedEvents(owned);
    } catch (err) {
      setProfile(null);
      setHostedEvents([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      eventsHosted: hostedEvents.length,
      peopleReached: hostedEvents.reduce((sum, e) => sum + (e.joined ?? 0), 0),
      raised: hostedEvents.reduce((sum, e) => sum + (e.raised ?? 0), 0),
    }),
    [hostedEvents],
  );

  const display = profile ?? user;

  return { profile: display, hostedEvents, stats, loading, error, reload: load };
}
