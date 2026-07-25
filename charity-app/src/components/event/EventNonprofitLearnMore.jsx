import { useNavigate } from 'react-router-dom';
import { NonprofitLearnMoreModal } from './EventModals';
import { useNonprofitProfile } from '../../hooks/useNonprofitProfile';

/**
 * Learn more for an event's nonprofit — loads live profile details by slug.
 */
export default function EventNonprofitLearnMore({
  open,
  onClose,
  event,
  fallbackName,
  fallbackInitials,
  fallbackBg,
  fallbackCategory,
  fallbackDescription,
}) {
  const navigate = useNavigate();
  const slug = event?.nonprofitSlug || event?.nonprofitBrief?.slug;
  const { profile, loading } = useNonprofitProfile(slug, open);

  const name = profile?.name || fallbackName || event?.nonprofit || 'Nonprofit';
  const initials = profile?.initials || fallbackInitials || event?.npInitials || 'NP';
  const bg = profile?.bg || profile?.color || fallbackBg || event?.npBg || 'var(--primary)';
  const category = profile?.category || fallbackCategory || event?.category;
  const description =
    profile?.mission
    || fallbackDescription
    || event?.nonprofitBrief?.mission
    || event?.mission
    || event?.subtitle;
  const ein = profile?.ein || undefined;
  const eventsHosted = profile?.stats?.eventsHosted ?? 0;
  const raisedTotal = profile?.stats?.totalRaised ?? 0;
  const profilePath = slug ? `/guest/np/${slug}` : null;

  return (
    <NonprofitLearnMoreModal
      open={open}
      onClose={onClose}
      loading={loading && !profile}
      name={name}
      initials={initials}
      avatarStyle={{ background: bg }}
      category={category}
      ein={ein}
      description={description}
      eventsHosted={eventsHosted}
      raisedTotal={raisedTotal}
      onViewProfile={profilePath ? () => {
        onClose();
        navigate(profilePath);
      } : undefined}
    />
  );
}
