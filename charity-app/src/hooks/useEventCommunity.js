import { useCallback, useEffect, useState } from 'react';
import { listPosts } from '../api/feed';
import { adaptCommunityPosts, galleryUrlsForEvent } from '../api/adapters/feed';

/**
 * Load and adapt community posts for a live event detail screen.
 * @param {object|null|undefined} ev — enriched event from useEventDetail
 */
export function useEventCommunity(ev) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    if (!ev?.key) return;
    setReloadToken((t) => t + 1);
  }, [ev?.key]);

  useEffect(() => {
    if (!ev?.key) {
      setPosts([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listPosts(ev.key)
      .then((data) => {
        if (cancelled) return;
        const gallery = galleryUrlsForEvent(ev);
        setPosts(adaptCommunityPosts(data.items || [], gallery, ev));
      })
      .catch((err) => {
        if (!cancelled) {
          setPosts([]);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ev, ev?.key, reloadToken]);

  return { posts, loading, error, reload };
}
