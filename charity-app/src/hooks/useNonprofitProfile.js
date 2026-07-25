import { useEffect, useState } from 'react';
import { getNonprofit } from '../api/nonprofits';
import { adaptNonprofitProfile } from '../api/adapters/nonprofit';
import { resolveEventCover } from '../utils/eventPhotos';

/**
 * Load public nonprofit profile by slug (for Learn more + /guest/np/:slug).
 * @param {string|null|undefined} slug
 * @param {boolean} enabled — set false to skip fetch (e.g. modal closed)
 */
export function useNonprofitProfile(slug, enabled = true) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !slug) {
      setProfile(null);
      setLoading(false);
      setError(slug || !enabled ? null : new Error('Missing nonprofit slug'));
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNonprofit(slug)
      .then((raw) => {
        if (cancelled) return;
        const adapted = adaptNonprofitProfile(raw);
        setProfile({
          ...adapted,
          events: (adapted.events ?? []).map((ev) => ({
            ...ev,
            cover: resolveEventCover(ev),
          })),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setProfile(null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  return { profile, loading, error };
}
