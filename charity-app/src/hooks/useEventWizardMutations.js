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

const EVENT_CREATOR_ROLES = new Set(['se', 'np_admin']);

const SE_HINT =
  'Sign in as mike.rivera@demo.charityhub.com / Passw0rd! (Social Entrepreneur), or create an SE account.';

export function useEventWizardMutations(show) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const draft = useCreateEventDraft();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const requireEventCreator = useCallback(() => {
    if (!isAuthenticated) {
      show('Sign in as a Social Entrepreneur to save or submit your event', { variant: 'error' });
      navigate('/');
      return false;
    }
    if (!EVENT_CREATOR_ROLES.has(user?.role)) {
      show(
        `Only Social Entrepreneurs can create events. Your account role is “${user?.role || 'unknown'}”. ${SE_HINT}`,
        { variant: 'error' },
      );
      navigate('/');
      return false;
    }
    return true;
  }, [isAuthenticated, navigate, show, user?.role]);

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
    if (!requireEventCreator() || pending) return;
    setPending(true);
    try {
      await ensurePersisted();
      setSaved(true);
      show('Draft saved');
      setTimeout(() => navigate('/feed'), 900);
    } catch (err) {
      const msg = err?.status === 403
        ? `Insufficient permissions. ${SE_HINT}`
        : (err?.message || 'Could not save draft');
      show(msg, { variant: 'error' });
    } finally {
      setPending(false);
    }
  }, [ensurePersisted, navigate, pending, requireEventCreator, show]);

  const handleSubmit = useCallback(async () => {
    if (!requireEventCreator() || pending) return;
    setPending(true);
    try {
      const { eventId, key } = await ensurePersisted();
      await submitEvent(eventId);
      show('Event submitted for approval');
      navigate(`/approval?key=${encodeURIComponent(key)}`);
    } catch (err) {
      const msg = err?.status === 403
        ? `Insufficient permissions. ${SE_HINT}`
        : (err?.message || 'Could not submit event');
      show(msg, { variant: 'error' });
    } finally {
      setPending(false);
    }
  }, [ensurePersisted, navigate, pending, requireEventCreator, show]);

  return { handleSaveDraft, handleSubmit, pending, saved };
}
