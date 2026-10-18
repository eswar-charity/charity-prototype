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
import { resolveEventCover } from '../utils/eventPhotos';
import useAutoRefresh from './useAutoRefresh';
import {
  mapDesktopApprovalRow,
  mapMobileApprovalRow,
} from '../utils/npApprovalAdapter';

const DEFAULT_REJECT_REASON = 'Rejected by nonprofit admin';
// The mobile "Requests" list is an inbox: only events still waiting on a decision.
const ACTIONABLE = ['Submitted', 'Changes Requested'];

function enrichReviewEvent(raw) {
  const ev = adaptEvent(raw);
  return {
    ...ev,
    apiStatus: raw.status,
    cover: resolveEventCover(ev),
  };
}

export function useNpApprovalsQueue(variant = 'mobile') {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autopilot, setAutopilot] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const mapRow = variant === 'desktop' ? mapDesktopApprovalRow : mapMobileApprovalRow;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [queue, ap] = await Promise.all([listApprovals(), getAutopilot()]);
      const rows = variant === 'mobile'
        ? (queue ?? []).filter((e) => ACTIONABLE.includes(e.status))
        : (queue ?? []);
      setEvents(rows.map(mapRow));
      setAutopilot(!!ap?.enabled);
      setError(null);
    } catch (err) {
      // A failed background refresh must not wipe what the admin is looking at.
      if (!silent) {
        setEvents([]);
        setError(err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [mapRow, variant]);

  useEffect(() => {
    load();
  }, [load]);

  // New requests appear without a manual reload.
  useAutoRefresh(() => load({ silent: true }), { intervalMs: 20000 });

  const approve = useCallback(async (ev) => {
    if (actionPending) return null;
    setActionPending(true);
    try {
      const raw = await approveEvent(ev.id);
      const mapped = mapRow({ ...raw, organizer: raw.organizer?.name ?? ev.organizer });
      setEvents((prev) => {
        const others = prev.filter((e) => e.id !== ev.id);
        if (variant === 'mobile') return others;
        return [mapped, ...others];
      });
      return mapped;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, mapRow, variant]);

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

  const requestChangesAction = useCallback(async (feedback, areas) => {
    if (!eventId || actionPending) return null;
    setActionPending(true);
    try {
      await requestChanges(eventId, feedback, areas);
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
