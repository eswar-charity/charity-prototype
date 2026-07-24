import { useCallback, useEffect, useMemo, useState } from 'react';
import { listEvents } from '../api/events';
import { getProfile } from '../api/users';
import { adaptEvent } from '../api/adapters/event';
import { useAuth } from '../auth/AuthContext';

function enrichProfileEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
  };
}

/** Live SE profile + owned events from GET /me/profile and listEvents. */
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
        listEvents({ limit: 50 }),
      ]);
      const owned = (eventsRes.items ?? [])
        .filter((e) => e.organizer?.id === prof.id)
        .map(enrichProfileEvent);
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
