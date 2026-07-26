import { previewHashtag } from './eventWizard.js';

export function mapDraftToApiPayload(draft) {
  const derivedTitle = previewHashtag(draft.story || '').replace(/^#/, '');
  const title = draft.title?.trim()
    ? draft.title.trim()
    : (derivedTitle || 'Untitled event');

  const payload = {
    title,
    story: draft.story ?? null,
    nonprofit_id: draft.nonprofitId != null ? Number(draft.nonprofitId) : null,
    category: draft.category ?? null,
    date: draft.startDate ?? null,
    start_time: draft.startTime ?? null,
    end_time: draft.endTime ?? null,
    location: draft.location ?? null,
    visibility: draft.visibility || 'public',
  };

  if (draft.coverMediaId != null) {
    payload.cover_media_id = Number(draft.coverMediaId);
  }

  if (draft.wizardStep != null) {
    payload.wizard_step = Number(draft.wizardStep);
  }

  if (draft.tags?.length) {
    payload.tags = draft.tags;
  }

  return payload;
}
