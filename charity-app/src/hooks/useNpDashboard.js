import { useCallback, useEffect, useState } from 'react';
import { getNpLaunchpad, getNpActivity, getNpFinancials } from '../api/dashboards';
import { DEFAULT_EVENT_COVER } from '../utils/eventPhotos';
import useAutoRefresh from './useAutoRefresh';

const DEFAULT_EVENT_THUMB = DEFAULT_EVENT_COVER;

function enrichLaunchpadEvent(raw) {
  return {
    id: raw.id,
    key: raw.key,
    title: raw.title,
    isLive: raw.is_live ?? raw.isLive ?? false,
    joined: raw.joined ?? 0,
    backed: raw.backed ?? 0,
    raised: raw.raised ?? 0,
    category: raw.category,
    cover: raw.cover || DEFAULT_EVENT_THUMB,
  };
}

function enrichBackingRow(raw) {
  return {
    id: raw.id,
    title: raw.title,
    count: raw.count ?? 0,
    raised: raw.raised ?? 0,
    thumb: raw.cover || DEFAULT_EVENT_THUMB,
  };
}

function enrichRevenueRow(raw) {
  return {
    id: raw.id,
    title: raw.title,
    raised: raw.raised ?? 0,
    thumb: raw.cover || DEFAULT_EVENT_THUMB,
  };
}

function useNpFetch(fetcher) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      setData(await fetcher());
      setError(null);
    } catch (err) {
      if (!silent) {
        setData(null);
        setError(err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  useAutoRefresh(() => load({ silent: true }), { intervalMs: 30000 });

  return { data, loading, error, reload: load };
}

/** NP launchpad dashboard from GET /np/launchpad. */
export function useNpLaunchpad() {
  const { data: raw, loading, error, reload } = useNpFetch(getNpLaunchpad);

  const data = raw
    ? {
        org: raw.org,
        stats: raw.stats ?? {},
        liveEvents: (raw.live_events ?? []).map(enrichLaunchpadEvent),
        actionRequired: raw.action_required ?? [],
      }
    : null;

  return { data, loading, error, reload };
}

/** NP activity dashboard from GET /np/activity. */
export function useNpActivity() {
  const { data: raw, loading, error, reload } = useNpFetch(getNpActivity);

  const backing = (raw?.backing_by_event ?? []).map(enrichBackingRow);
  const data = raw
    ? {
        supporters: raw.supporters ?? 0,
        totalRaised: raw.total_raised ?? 0,
        eventsWithBacking: backing.filter((e) => e.count > 0).length,
        backingByEvent: backing,
        settlement: raw.settlement ?? {},
      }
    : null;

  return { data, loading, error, reload };
}

/** NP financials dashboard from GET /np/financials. */
export function useNpFinancials() {
  const { data: raw, loading, error, reload } = useNpFetch(getNpFinancials);

  const revenue = [...(raw?.revenue_by_event ?? [])]
    .map(enrichRevenueRow)
    .sort((a, b) => b.raised - a.raised);

  const data = raw
    ? {
        totalRaised: raw.total_raised ?? 0,
        supporters: raw.supporters ?? 0,
        eventsWithBacking: revenue.filter((e) => e.raised > 0).length,
        settlementStatus: raw.settlement_status ?? 'Pending',
        revenueByEvent: revenue,
      }
    : null;

  return { data, loading, error, reload };
}
