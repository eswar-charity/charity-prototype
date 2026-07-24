import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  approveEvent,
  getApproval,
  getAutopilot,
  listApprovals,
  rejectEvent,
  requestChanges,
  updateAutopilot,
} from '../api/approvals';
import { adaptEvent } from '../api/adapters/event';
import {
  mapDesktopApprovalRow,
  mapMobileApprovalRow,
} from '../utils/npApprovalAdapter';

const DEFAULT_REJECT_REASON = 'Rejected by nonprofit admin';

function enrichReviewEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    apiStatus: raw.status,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
  };
}

export function useNpApprovalsQueue(variant = 'mobile') {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autopilot, setAutopilot] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const mapRow = variant === 'desktop' ? mapDesktopApprovalRow : mapMobileApprovalRow;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [queue, ap] = await Promise.all([listApprovals(), getAutopilot()]);
      setEvents((queue ?? []).map(mapRow));
      setAutopilot(!!ap?.enabled);
    } catch (err) {
      setEvents([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mapRow]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = useCallback(async (ev) => {
    if (actionPending) return null;
    setActionPending(true);
    try {
      await approveEvent(ev.id);
      setEvents((prev) =>
        variant === 'desktop'
          ? prev.map((e) => (e.id === ev.id ? { ...e, status: 'Approved' } : e))
          : prev.filter((e) => e.id !== ev.id),
      );
      return ev;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, variant]);

  const reject = useCallback(async (ev, reason = DEFAULT_REJECT_REASON) => {
    if (actionPending) return null;
    setActionPending(true);
    try {
      await rejectEvent(ev.id, reason);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
      return ev;
    } finally {
      setActionPending(false);
    }
  }, [actionPending]);

  const toggleAutopilot = useCallback(async () => {
    if (actionPending) return null;
    const next = !autopilot;
    setActionPending(true);
    try {
      const ap = await updateAutopilot({ enabled: next });
      setAutopilot(!!ap?.enabled);
      return ap;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, autopilot]);

  return {
    events,
    loading,
    error,
    autopilot,
    actionPending,
    reload: load,
    approve,
    reject,
    toggleAutopilot,
  };
}

export function useNpReviewDetail() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) {
      setEvent(null);
      setError(new Error('Missing event id'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getApproval(eventId);
      setEvent(enrichReviewEvent(raw));
    } catch (err) {
      setEvent(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = useCallback(async () => {
    if (!eventId || actionPending) return null;
    setActionPending(true);
    try {
      const raw = await approveEvent(eventId);
      return enrichReviewEvent(raw);
    } finally {
      setActionPending(false);
    }
  }, [actionPending, eventId]);

  const reject = useCallback(async (reason = DEFAULT_REJECT_REASON) => {
    if (!eventId || actionPending) return null;
    setActionPending(true);
    try {
      await rejectEvent(eventId, reason);
      return true;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, eventId]);

  const requestChangesAction = useCallback(async (feedback) => {
    if (!eventId || actionPending) return null;
    setActionPending(true);
    try {
      await requestChanges(eventId, feedback);
      return true;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, eventId]);

  return {
    event,
    eventId,
    loading,
    error,
    actionPending,
    reload: load,
    approve,
    reject,
    requestChanges: requestChangesAction,
  };
}
