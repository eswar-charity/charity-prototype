import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Server-driven paginated feed with an IntersectionObserver sentinel.
 *
 * Unlike `useInfiniteScroll`, items are fetched page-by-page from `fetcher`
 * and appended without cycling or duplicating a static source array.
 *
 * @param {({ page: number, limit: number }) => Promise<{ items: unknown[], total?: number, has_more: boolean }>} fetcher
 * @param {{ pageSize?: number, deps?: unknown[] }} [options]
 * @returns {{ items: unknown[], loading: boolean, error: unknown, hasMore: boolean, sentinelRef: import('react').RefObject<HTMLElement>, reload: () => void }}
 */
export default function usePagedFeed(fetcher, { pageSize = 10, deps = [] } = {}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const sentinelRef = useRef(null);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(loading);

  loadingRef.current = loading;

  // Reset feed when filter/deps change.
  useEffect(() => {
    requestIdRef.current += 1;
    setPage(1);
    setItems([]);
    setError(null);
    setHasMore(false);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => {
    requestIdRef.current += 1;
    setPage(1);
    setItems([]);
    setError(null);
    setHasMore(false);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher({ page, limit: pageSize });
        if (cancelled || requestId !== requestIdRef.current) return;

        const nextItems = res.items ?? [];
        setItems((prev) => (page === 1 ? nextItems : [...prev, ...nextItems]));
        setHasMore(Boolean(res.has_more));
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return;
        setError(err);
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetcher, page, pageSize, reloadToken, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '160px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, items.length]);

  return { items, loading, error, hasMore, sentinelRef, reload };
}
