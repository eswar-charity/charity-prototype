import { useEffect, useRef } from 'react';

/**
 * Re-run `refresh` while the tab is visible: every `intervalMs`, and whenever
 * the user comes back to the tab. Queues like "events waiting for approval"
 * would otherwise stay stale until a manual reload.
 */
export default function useAutoRefresh(refresh, { intervalMs = 30000, enabled = true } = {}) {
  const refreshRef = useRef(refresh);
  const lastRun = useRef(0);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRun.current < 2000) return; // focus + visibilitychange fire together
      lastRun.current = now;
      refreshRef.current?.();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [enabled, intervalMs]);
}
