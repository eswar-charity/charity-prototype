import { useCallback, useEffect, useState } from 'react';
import { getNpProfile, updateNpProfile } from '../api/nonprofits';

const COVER_MEDIA_IDS = [1, 2, 3];
const LOGO_MEDIA_IDS = [1, 2, 3];
const COVER_IMAGES = [
  '/events/breakneck-ridge-run/img1.jpg',
  '/events/give-now/img1.jpg',
  '/events/neon-night/img1.jpg',
];
const LOGO_IMAGES = [
  '/events/breakneck-ridge-run/img1.jpg',
  '/events/dog-dad/img1.jpg',
  '/events/golf-outing/img1.jpg',
];

function mediaIndex(ids, value) {
  const idx = ids.indexOf(value);
  return idx >= 0 ? idx : 0;
}

function enrichProfile(raw) {
  const coverIdx = mediaIndex(COVER_MEDIA_IDS, raw.cover_media_id);
  const logoIdx = mediaIndex(LOGO_MEDIA_IDS, raw.logo_media_id);
  const taglineParts = [];
  if (raw.founded_year) taglineParts.push(`Est. ${raw.founded_year}`);
  if (raw.headquarters) taglineParts.push(raw.headquarters);

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    mission: raw.mission ?? '',
    verified: raw.verified,
    tagline: taglineParts.join(' · ') || raw.category,
    coverIdx,
    logoIdx,
    coverImage: COVER_IMAGES[coverIdx],
    logoImage: LOGO_IMAGES[logoIdx],
    coverMediaId: COVER_MEDIA_IDS[coverIdx],
    logoMediaId: LOGO_MEDIA_IDS[logoIdx],
  };
}

export function useNpProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getNpProfile();
      setProfile(enrichProfile(raw));
    } catch (err) {
      setProfile(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cycleCover = useCallback(async () => {
    if (!profile || saving) return null;
    const nextIdx = (profile.coverIdx + 1) % COVER_MEDIA_IDS.length;
    const cover_media_id = COVER_MEDIA_IDS[nextIdx];
    setSaving(true);
    try {
      const raw = await updateNpProfile({ cover_media_id });
      const next = enrichProfile(raw);
      setProfile(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, [profile, saving]);

  const cycleLogo = useCallback(async () => {
    if (!profile || saving) return null;
    const nextIdx = (profile.logoIdx + 1) % LOGO_MEDIA_IDS.length;
    const logo_media_id = LOGO_MEDIA_IDS[nextIdx];
    setSaving(true);
    try {
      const raw = await updateNpProfile({ logo_media_id });
      const next = enrichProfile(raw);
      setProfile(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, [profile, saving]);

  return { profile, loading, error, saving, reload: load, cycleCover, cycleLogo };
}
