/**
 * Append device files to the event draft photo list (blob preview + File for upload).
 */
export function appendDraftPhotos(existingPhotos, files, { max = 10 } = {}) {
  const current = Array.isArray(existingPhotos) ? existingPhotos : [];
  const remaining = max - current.length;
  if (remaining <= 0 || !files?.length) return current;

  let nextId = current.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
  const added = Array.from(files).slice(0, remaining).map((file) => {
    nextId += 1;
    const isVideo = String(file.type || '').startsWith('video/');
    return {
      id: nextId,
      src: URL.createObjectURL(file),
      type: isVideo ? 'video' : 'image',
      file,
    };
  });
  return [...current, ...added];
}

export function removeDraftPhoto(existingPhotos, id) {
  const current = Array.isArray(existingPhotos) ? existingPhotos : [];
  const target = current.find((p) => p.id === id);
  if (target?.src?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(target.src);
    } catch {
      /* ignore */
    }
  }
  return current.filter((p) => p.id !== id);
}
