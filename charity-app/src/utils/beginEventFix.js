import { updateDraft } from '../hooks/useCreateEventDraft';
import { areasToAllowedSteps, resolveChangeAreas } from './changeRequestAreas';

/**
 * Load an event into the create-event draft for SE "Update event" (Changes Requested).
 * Gates wizard steps to only the areas NP requested.
 */
export function beginEventFix(rawEvent) {
  if (!rawEvent?.id) return null;

  const areas = resolveChangeAreas(rawEvent.change_request);
  const allowedSteps = areasToAllowedSteps(areas);
  const photos = (rawEvent.photos || []).map((src, i) => ({ id: i + 1, src }));

  updateDraft({
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
    fixMode: true,
    allowedSteps,
    changeFeedback: rawEvent.change_request?.feedback || '',
  });

  return { allowedSteps, areas };
}
