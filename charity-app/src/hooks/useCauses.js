import { useEffect, useState } from 'react';
import { listCauses } from '../api/meta';

/** Causes page data: categories that have events, with roll-ups, from the API. */
export default function useCauses() {
  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listCauses()
      .then((rows) => {
        if (cancelled) return;
        setCauses(
          (rows || []).map((c) => ({
            category: c.name,
            description: c.description,
            eventCount: c.event_count,
            totalRaised: c.total_raised,
            featured: c.featured
              ? {
                  key: c.featured.key,
                  title: c.featured.title,
                  cover: c.featured.cover,
                  coverFocus: c.featured.cover_focus,
                  backed: c.featured.backed,
                  isLive: c.featured.is_live,
                }
              : null,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { causes, loading, error };
}
