import { useCallback, useEffect, useState } from 'react';
import {
  addTrustedSe,
  getApproval,
  getAutopilot,
  listApprovals,
  removeTrustedSe,
  updateAutopilot,
} from '../api/approvals';

const DEFAULT_CHECKS = [
  'SE must be verified and in good standing',
  'Event must have media and story text',
  'No policy-sensitive keywords flagged',
  'Date range must be valid (future)',
];

const DEFAULT_AVATAR = '/events/breakneck-ridge-run/img4.jpg';

function mapTrusted(raw) {
  return {
    id: raw.se_user_id,
    seUserId: raw.se_user_id,
    name: raw.name ?? 'Unknown',
    events: 0,
    avatar: DEFAULT_AVATAR,
    initials: raw.initials,
  };
}

export function useNpAutopilot() {
  const [enabled, setEnabled] = useState(false);
  const [checks, setChecks] = useState(DEFAULT_CHECKS);
  const [trusted, setTrusted] = useState([]);
  const [candidateSeId, setCandidateSeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  const applyAutopilot = useCallback((ap) => {
    setEnabled(!!ap?.enabled);
    setChecks(ap?.checks?.length ? ap.checks : DEFAULT_CHECKS);
    setTrusted((ap?.trusted_ses ?? []).map(mapTrusted));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ap = await getAutopilot();
      applyAutopilot(ap);
      try {
        const queue = await listApprovals();
        if (queue?.[0]?.id) {
          const detail = await getApproval(queue[0].id);
          if (detail?.organizer?.id) setCandidateSeId(detail.organizer.id);
        }
      } catch {
        /* optional candidate lookup */
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applyAutopilot]);

  useEffect(() => {
    load();
  }, [load]);

  const setAutopilotEnabled = useCallback(async (nextEnabled) => {
    if (actionPending) return null;
    setActionPending(true);
    try {
      const ap = await updateAutopilot({ enabled: nextEnabled });
      applyAutopilot(ap);
      return ap;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, applyAutopilot]);

  const toggleEnabled = useCallback(async () => {
    return setAutopilotEnabled(!enabled);
  }, [enabled, setAutopilotEnabled]);

  const removeTrusted = useCallback(async (seUserId) => {
    if (actionPending) return null;
    setActionPending(true);
    try {
      const ap = await removeTrustedSe(seUserId);
      applyAutopilot(ap);
      return ap;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, applyAutopilot]);

  const addTrusted = useCallback(async (seUserId) => {
    const id = seUserId ?? candidateSeId;
    if (!id || actionPending) return null;
    setActionPending(true);
    try {
      const ap = await addTrustedSe(id);
      applyAutopilot(ap);
      return ap;
    } finally {
      setActionPending(false);
    }
  }, [actionPending, applyAutopilot, candidateSeId]);

  return {
    enabled,
    checks,
    trusted,
    candidateSeId,
    loading,
    error,
    actionPending,
    reload: load,
    toggleEnabled,
    setAutopilotEnabled,
    removeTrusted,
    addTrusted,
  };
}
