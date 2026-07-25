import { useCallback, useEffect, useState } from 'react';
import { listMessages, sendMessage } from '../api/feed';
import { adaptChatMessage } from '../api/adapters/feed';

/**
 * Poll event chat while enabled; send via POST with optimistic append.
 */
export function useEventChat({
  eventKey,
  eventId,
  enabled = false,
  currentUserId,
  showToast,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!enabled || !eventKey) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const tick = async () => {
      if (document.hidden) return;
      try {
        const data = await listMessages(eventKey);
        if (!cancelled) {
          setMessages((data.items || []).map((m) => adaptChatMessage(m, currentUserId)));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, 2500);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled, eventKey, currentUserId]);

  const send = useCallback(async ({ text, mediaId, localPreviewUrl, mediaType } = {}) => {
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!eventId || pending) return;
    if (!trimmed && mediaId == null && !localPreviewUrl) return;

    const optimisticId = `pending-${Date.now()}`;
    setPending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        mine: true,
        initials: 'ME',
        avatar: 'linear-gradient(135deg,#7B1FA2,#AB47BC)',
        text: trimmed || null,
        media: localPreviewUrl || null,
        mediaType: mediaType || null,
        sent: 'Sending…',
      },
    ]);

    try {
      await sendMessage(eventId, {
        text: trimmed || undefined,
        mediaId: mediaId ?? undefined,
      });
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      showToast?.(err?.message || 'Could not send message');
      throw err;
    } finally {
      setPending(false);
    }
  }, [eventId, pending, showToast]);

  return { messages, loading, error, send, pending };
}
