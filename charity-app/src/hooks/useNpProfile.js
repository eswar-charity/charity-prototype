import { useCallback, useEffect, useState } from 'react';
import { getNpProfile, updateNpProfile, getNonprofit } from '../api/nonprofits';
import { uploadDeviceMedia } from '../api/uploadDeviceMedia';

function enrichProfile(raw, stats) {
  const taglineParts = [];
  if (raw.founded_year) taglineParts.push(`Est. ${raw.founded_year}`);
  if (raw.headquarters) taglineParts.push(raw.headquarters);

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    initials: raw.initials || raw.name?.slice(0, 2).toUpperCase() || 'NP',
    color: raw.color || '#1A6EB5',
    mission: raw.mission ?? '',
    verified: raw.verified,
    tagline: taglineParts.join(' · ') || raw.category,
    // Real uploads only: null until the nonprofit adds a cover / logo.
    coverImage: raw.cover_url || null,
    logoImage: raw.logo_url || null,
    stats: stats || { eventsHosted: 0, totalRaised: 0, totalBacked: 0 },
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
      // Impact numbers are computed server-side from this nonprofit's real events.
      const pub = await getNonprofit(raw.slug).catch(() => null);
      setProfile(enrichProfile(raw, pub?.stats));
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

  const replaceMedia = useCallback(
    async (file, { entityType, field }) => {
      if (!profile || saving) return null;
      setSaving(true);
      try {
        const asset = await uploadDeviceMedia(file, {
          folder: 'nonprofits',
          eventId: profile.id,
          entityType,
        });
        const raw = await updateNpProfile({ [field]: asset.id });
        const next = enrichProfile(raw, profile.stats);
        setProfile(next);
        return next;
      } finally {
        setSaving(false);
      }
    },
    [profile, saving],
  );

  const uploadCover = useCallback(
    (file) => replaceMedia(file, { entityType: 'np_cover', field: 'cover_media_id' }),
    [replaceMedia],
  );
  const uploadLogo = useCallback(
    (file) => replaceMedia(file, { entityType: 'np_logo', field: 'logo_media_id' }),
    [replaceMedia],
  );

  return { profile, loading, error, saving, reload: load, uploadCover, uploadLogo };
}
