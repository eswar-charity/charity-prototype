import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { completeEvent, getEvent, goLive, listMyEvents } from '../api/events';
import { adaptEvent } from '../api/adapters/event';
import { useAuth } from '../auth/AuthContext';
import { mapEventStatusToUi } from '../utils/eventApprovalStatus';
import { resolveEventCover } from '../utils/eventPhotos';

const OWN_EVENT_STATUSES = [
  'Draft', 'Submitted', 'Changes Requested', 'Live', 'Completed', 'Rejected',
];

function enrichApprovalEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    apiStatus: raw.status,
    cover: resolveEventCover(ev),
    raw,
    changeRequest: ev.changeRequest,
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
        // The public feed never contains Draft / Submitted / Changes Requested events,
        // so ask for the user's own events explicitly.
        const res = await listMyEvents({ statuses: OWN_EVENT_STATUSES });
        const owned = res.items ?? [];
        const pick =
          owned.find((e) => ['Submitted', 'Changes Requested'].includes(e.status)) ??
          owned.find((e) => ['Live', 'Rejected'].includes(e.status)) ??
          owned[0];
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
