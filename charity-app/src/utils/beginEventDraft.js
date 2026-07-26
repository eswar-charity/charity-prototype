import { updateDraft } from '../hooks/useCreateEventDraft.js';

/**
 * Map a server event into a create-event draft patch (non-fix / edit draft).
 */
export function mapEventToDraftPatch(rawEvent) {
  if (!rawEvent?.id) return null;

  const photos = (rawEvent.photos || []).map((src, i) => ({ id: i + 1, src }));
  const wizardStep = rawEvent.wizard_step >= 1 && rawEvent.wizard_step <= 4
    ? rawEvent.wizard_step
    : 1;

  return {
    serverEventId: rawEvent.id,
    serverKey: rawEvent.key,
    coverMediaId: rawEvent.cover_media_id ?? null,
    title: rawEvent.title || '',
    photos,
    story: rawEvent.story || '',
    nonprofitId: rawEvent.nonprofit?.id ?? null,
    category: rawEvent.category || rawEvent.nonprofit?.category || null,
    startDate: rawEvent.date || '',
    endDate: rawEvent.date || '',
    startTime: rawEvent.start_time || '',
    endTime: rawEvent.end_time || '',
    location: rawEvent.location || '',
    visibility: rawEvent.visibility || 'public',
    previewLiked: false,
    inviteSent: false,
    fixMode: false,
    allowedSteps: null,
    changeFeedback: '',
    guidelinesReviewed: false,
    wizardStep,
  };
}

/**
 * Load an event into the create-event draft for editing an existing Draft.
 */
export function beginEventDraft(rawEvent) {
  const patch = mapEventToDraftPatch(rawEvent);
  if (!patch) return null;
  updateDraft(patch);
  return { wizardStep: patch.wizardStep };
}
