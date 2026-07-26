import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createEvent,
  saveDraft as saveDraftApi,
  submitEvent,
} from '../api/events';
import { mapDraftToApiPayload } from '../utils/eventDraftPayload';
import { syncEventDraftPhotos } from '../utils/syncEventDraftPhotos';
import { useCreateEventDraft, updateDraft, resetDraft, getDraft } from './useCreateEventDraft';

const EVENT_CREATOR_ROLES = new Set(['se', 'np_admin']);

const SE_HINT =
  'Sign in as mike.rivera@demo.charityhub.com / Passw0rd! (or jordan.blake@ / sam.okonkwo@ / priya.desai@ demo.charityhub.com), or create an SE account.';

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
    const current = getDraft();
    const payload = mapDraftToApiPayload(current);
    let eventId;
    let key;
    if (!current.serverEventId) {
      const created = await createEvent(payload);
      eventId = created.id;
      key = created.key;
      updateDraft({ serverEventId: created.id, serverKey: created.key });
    } else {
      const updated = await saveDraftApi(current.serverEventId, payload);
      eventId = current.serverEventId;
      key = updated.key ?? current.serverKey;
    }

    const synced = await syncEventDraftPhotos(eventId, current.photos);
    const photoPatch = { photos: synced.photos };
    if (synced.coverMediaId != null) {
      photoPatch.coverMediaId = synced.coverMediaId;
      if (synced.coverMediaId !== current.coverMediaId) {
        await saveDraftApi(eventId, {
          ...mapDraftToApiPayload({ ...getDraft(), coverMediaId: synced.coverMediaId }),
          cover_media_id: synced.coverMediaId,
        });
      }
    }
    updateDraft(photoPatch);
    return { eventId, key };
  }, []);

  const handleSaveDraft = useCallback(async (stepOverride) => {
    if (!requireEventCreator() || pending) return;
    if (stepOverride != null) updateDraft({ wizardStep: stepOverride });
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
      const submitted = await submitEvent(eventId);
      const submittedKey = submitted?.key || key;
      // Own-org NP events auto-publish; SE / partner-NP events wait for approval.
      if (submitted?.status === 'Live' || submitted?.is_live) {
        resetDraft();
        show('Event is live');
        navigate(`/live-dashboard?key=${encodeURIComponent(submittedKey)}`);
      } else {
        resetDraft();
        show('Event submitted for approval');
        navigate(`/approval?key=${encodeURIComponent(submittedKey)}`);
      }
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
