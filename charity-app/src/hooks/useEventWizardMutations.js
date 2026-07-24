import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createEvent,
  saveDraft as saveDraftApi,
  submitEvent,
} from '../api/events';
import { mapDraftToApiPayload } from '../utils/eventDraftPayload';
import { useCreateEventDraft, updateDraft } from './useCreateEventDraft';

export function useEventWizardMutations(show) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const draft = useCreateEventDraft();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    show('Sign in to save or submit your event', { variant: 'error' });
    navigate('/');
    return false;
  }, [isAuthenticated, navigate, show]);

  const ensurePersisted = useCallback(async () => {
    const payload = mapDraftToApiPayload(draft);
    if (!draft.serverEventId) {
      const created = await createEvent(payload);
      updateDraft({ serverEventId: created.id, serverKey: created.key });
      return { eventId: created.id, key: created.key };
    }
    const updated = await saveDraftApi(draft.serverEventId, payload);
    return {
      eventId: draft.serverEventId,
      key: updated.key ?? draft.serverKey,
    };
  }, [draft]);

  const handleSaveDraft = useCallback(async () => {
    if (!requireAuth() || pending) return;
    setPending(true);
    try {
      await ensurePersisted();
      setSaved(true);
      show('Draft saved');
      setTimeout(() => navigate('/feed'), 900);
    } catch (err) {
      show(err?.message || 'Could not save draft', { variant: 'error' });
    } finally {
      setPending(false);
    }
  }, [ensurePersisted, navigate, pending, requireAuth, show]);

  const handleSubmit = useCallback(async () => {
    if (!requireAuth() || pending) return;
    setPending(true);
    try {
      const { eventId, key } = await ensurePersisted();
      await submitEvent(eventId);
      show('Event submitted for approval');
      navigate(`/approval?key=${encodeURIComponent(key)}`);
    } catch (err) {
      show(err?.message || 'Could not submit event', { variant: 'error' });
    } finally {
      setPending(false);
    }
  }, [ensurePersisted, navigate, pending, requireAuth, show]);

  return { handleSaveDraft, handleSubmit, pending, saved };
}
