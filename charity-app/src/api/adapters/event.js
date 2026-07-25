/** Map EventRead API JSON → existing UI event field names. */
export function adaptEvent(apiEvent) {
  return {
    id: apiEvent.id,
    key: apiEvent.key,
    title: apiEvent.title,
    mission: apiEvent.story ?? apiEvent.subtitle ?? '',
    category: apiEvent.category || apiEvent.nonprofit?.category || null,
    isLive: !!apiEvent.is_live,
    date: apiEvent.date,
    startTime: apiEvent.start_time,
    endTime: apiEvent.end_time,
    location: apiEvent.location,
    backed: apiEvent.backed,
    joined: apiEvent.joined,
    updates: apiEvent.updates,
    chat: apiEvent.chat_count,
    raised: apiEvent.raised,
    nonprofit: apiEvent.nonprofit?.name ?? '',
    nonprofitSlug: apiEvent.nonprofit?.slug ?? '',
    organizer: apiEvent.organizer?.name ?? '',
    organizerId: apiEvent.organizer?.id,
    tags: apiEvent.tags ?? [],
    photos: apiEvent.photos ?? [],
    nonprofitBrief: apiEvent.nonprofit,
    organizerBrief: apiEvent.organizer,
    viewerJoined: !!apiEvent.viewer_joined,
    viewerLiked: !!apiEvent.viewer_liked,
    viewerSaved: !!apiEvent.viewer_saved,
    changeRequest: apiEvent.change_request
      ? {
          feedback: apiEvent.change_request.feedback || '',
          areas: apiEvent.change_request.areas || [],
        }
      : null,
  };
}
