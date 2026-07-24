import { useEffect, useState } from 'react';
import { listNonprofits } from '../api/nonprofits';
import { adaptNonprofit } from '../api/adapters/nonprofit';

export function useNonprofitList({ q = '', category = 'All', limit = 50 } = {}) {
  const [nonprofits, setNonprofits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listNonprofits({
          q: q.trim() || undefined,
          category: category !== 'All' ? category : undefined,
          limit,
        });
        if (cancelled) return;
        setNonprofits((res.items ?? []).map(adaptNonprofit));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [q, category, limit]);

  return { nonprofits, loading, error };
}

export function useSelectedNonprofit(nonprofitId) {
  const { nonprofits, loading } = useNonprofitList({ limit: 100 });
  const nonprofit = nonprofitId != null
    ? nonprofits.find((np) => np.id === nonprofitId) ?? null
    : null;
  return { nonprofit, loading };
}
