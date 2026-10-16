import { useEffect, useState } from 'react';
import { listEvents } from '../api/events';
import { adaptEvent } from '../api/adapters/event';
import { resolveEventCover } from '../utils/eventPhotos';

/**
 * The event to feature on marketing/auth surfaces and for bare `/event/live`
 * style links: the most prominent live event from the API. Null when none.
 */
export default function useSpotlightEvent() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listEvents({ limit: 5 })
      .then((res) => {
        if (cancelled) return;
        const items = (res?.items || []).map(adaptEvent);
        const pick = items.find((e) => e.isLive) || items[0] || null;
        setEvent(pick ? { ...pick, cover: resolveEventCover(pick) } : null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { event, loading };
}
