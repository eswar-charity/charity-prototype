import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { completeEvent, getEvent, goLive, listEvents } from '../api/events';
import { adaptEvent } from '../api/adapters/event';
import { useAuth } from '../auth/AuthContext';
import { mapEventStatusToUi } from '../utils/eventApprovalStatus';

function enrichApprovalEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    apiStatus: raw.status,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
  };
}

/**
 * Load SE approval event by ?key= or first owned event from listEvents.
 */
export function useApprovalEvent() {
  const [searchParams] = useSearchParams();
  const keyParam = searchParams.get('key');
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let raw;
      if (keyParam) {
        raw = await getEvent(keyParam);
      } else if (user?.id) {
        const res = await listEvents({ limit: 50 });
        const owned = (res.items ?? []).filter((e) => e.organizer?.id === user.id);
        const pick =
          owned.find((e) =>
            ['Submitted', 'Approved', 'Live', 'Changes Requested'].includes(e.status),
          ) ?? owned[0];
        if (!pick) throw new Error('No events found for your account');
        raw = pick;
      } else {
        throw new Error('Missing event key');
      }
      setEvent(enrichApprovalEvent(raw));
    } catch (err) {
      setEvent(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [keyParam, user?.id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const uiState = event ? mapEventStatusToUi(event.apiStatus, event.isLive) : 'review';

  const handleGoLive = useCallback(async () => {
    if (!event?.id || actionPending) return null;
    setActionPending(true);
    try {
      const updated = await goLive(event.id);
      setEvent(enrichApprovalEvent(updated));
      return updated;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, event?.id]);

  const handleComplete = useCallback(async () => {
    if (!event?.id || actionPending) return null;
    setActionPending(true);
    try {
      const updated = await completeEvent(event.id);
      setEvent(enrichApprovalEvent(updated));
      return updated;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, event?.id]);

  return {
    event,
    loading,
    error,
    uiState,
    actionPending,
    handleGoLive,
    handleComplete,
    refresh: loadEvent,
  };
}
