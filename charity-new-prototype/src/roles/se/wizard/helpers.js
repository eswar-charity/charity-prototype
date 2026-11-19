// Pure logic for the event wizard: form shape, validation, patches, fix-mode (locked steps).
import { CHANGE_AREAS } from '../../../domain/engine.js'
import { photoList } from '../../../domain/selectors.js'
import { fromInputDate, fromInputTime, toInputDate, toInputTime } from '../common.jsx'

export const MAX_PHOTOS = 8
export const STEPS = [
  { n: 1, label: 'Photos and story', fields: ['photos', 'title', 'story', 'category'] },
  { n: 2, label: 'Nonprofit', fields: ['nonprofitId'] },
  { n: 3, label: 'Date and place', fields: ['date', 'start', 'end', 'endDate', 'location'] },
  { n: 4, label: 'Preview and submit', fields: [] },
]

/** Fields a person may change. null = everything (normal drafts); a Set in fix mode (Changes Requested). */
export function openKeysFor(ev) {
  if (!ev || ev.status !== 'Changes Requested') return null
  return new Set((ev.review?.areas ?? []).flatMap((a) => CHANGE_AREAS[a] ?? []))
}
export const isOpen = (open, key) => !open || open.has(key)
export const stepIsOpen = (open, n) => n === 4 || !open || STEPS[n - 1].fields.some((f) => open.has(f))
export const openSteps = (open) => STEPS.map((s) => s.n).filter((n) => stepIsOpen(open, n))
export const nextStepFrom = (open, n) => openSteps(open).find((x) => x > n) ?? 4
export const prevStepFrom = (open, n) => [...openSteps(open)].reverse().find((x) => x < n) ?? null

/** Why a nonprofit cannot take a new event, or null when it can (Active and settlement Ready). */
export function npBlocker(np) {
  if (np.status === 'Active' && np.settlement === 'Ready') return null
  if (np.status === 'Invited') return 'Has not accepted its invite yet.'
  if (np.status === 'Pending') return 'Still being verified by Charity Hub.'
  if (np.status === 'Suspended') return 'Suspended by Charity Hub for now.'
  if (np.status === 'Rejected') return 'Not approved by Charity Hub.'
  return 'Still setting up payments, so it cannot receive donations yet.'
}

export const blankForm = (nonprofitId = '') => ({ photos: [], title: '', story: '', category: '', nonprofitId, date: '', start: '', end: '', endDate: '', location: '' })

export const formFromEvent = (ev) => ({
  photos: photoList(ev), // an uploaded list, or the seeded photo set the event was created with
  title: (ev.title ?? '').replace(/^#/, ''),
  story: ev.story ?? '',
  category: ev.category ?? '',
  nonprofitId: ev.nonprofitId ?? '',
  date: toInputDate(ev.date), start: toInputTime(ev.start), end: toInputTime(ev.end), endDate: toInputDate(ev.endDate),
  location: ev.location ?? '',
})

/** Build the saveDraft patch (engine formats) for the given field keys, skipping anything locked. */
export function patchFor(form, keys, open = null, { skipEmptyTitle = true } = {}) {
  const p = {}
  for (const k of keys) {
    if (!isOpen(open, k)) continue
    if (k === 'title') { if (skipEmptyTitle && !form.title.trim()) continue; p.title = form.title.trim() }
    else if (k === 'date' || k === 'endDate') p[k] = fromInputDate(form[k])
    else if (k === 'start' || k === 'end') p[k] = fromInputTime(form[k])
    else p[k] = form[k]
  }
  return p
}

/** Inline validation. Messages for photos, story, nonprofit and guidelines are the engine's own wording. */
export function validateStep(n, form, { open = null, today = '', nonprofits = {} } = {}) {
  const e = {}
  const need = (k) => isOpen(open, k)
  if (n === 1) {
    if (need('photos') && form.photos.length < 1) e.photos = 'Add at least one photo before submitting.'
    if (need('title') && !form.title.trim()) e.title = 'Give your event a title.'
    if (need('story') && !form.story.trim()) e.story = 'Tell people what the event is about.'
    if (need('category') && !form.category) e.category = 'Pick a category.'
  }
  if (n === 2 && need('nonprofitId')) {
    const np = nonprofits[form.nonprofitId]
    if (!form.nonprofitId || !np) e.nonprofitId = 'Choose the nonprofit this event supports.'
    else if (npBlocker(np)) e.nonprofitId = `${np.name} cannot take new events right now.`
  }
  if (n === 3) {
    if (need('date')) {
      if (!form.date) e.date = 'Choose the date.'
      else if (today && form.date < today) e.date = 'Pick a date that has not passed.'
    }
    if (need('start') && !form.start) e.start = 'Set a start time.'
    if (need('end') && !form.end) e.end = 'Set an end time.'
    if (need('endDate') && form.endDate && form.date && form.endDate < form.date) e.endDate = 'The end date cannot be before the start date.'
    const sameDay = !form.endDate || form.endDate === form.date
    if (!e.start && !e.end && form.start && form.end && sameDay && form.end <= form.start) e.end = 'The end time must come after the start time.'
    if (need('location') && !form.location.trim()) e.location = 'Add the location.'
  }
  return e
}

/** Which wizard step a submit error belongs to. */
export const STEP_FOR_ERROR = { photos_required: 1, story_required: 1, nonprofit_required: 2, nonprofit_unavailable: 2, details_required: 3 }

/** The first field with an error, in page order, for focus after a failed continue. */
export const firstErrorField = (errors) => ['photos', 'title', 'story', 'category', 'nonprofitId', 'date', 'start', 'end', 'endDate', 'location'].find((k) => errors[k])
