import { adaptEvent } from './event.js';

/** Map NonprofitRead API JSON → existing UI nonprofit field names. */
export function adaptNonprofit(apiNonprofit) {
  return {
    id: apiNonprofit.id,
    name: apiNonprofit.name,
    slug: apiNonprofit.slug,
    category: apiNonprofit.category,
    verified: apiNonprofit.verified,
    mission: apiNonprofit.mission ?? '',
    color: apiNonprofit.color ?? null,
    bg: apiNonprofit.color ?? null,
    initials: apiNonprofit.initials ?? '',
    ein: apiNonprofit.ein ?? null,
    status: apiNonprofit.status,
    settlementStatus: apiNonprofit.settlement_status,
  };
}

/** Map NonprofitProfileResponse → profile shape used by public NP screens. */
export function adaptNonprofitProfile(response) {
  const nonprofit = adaptNonprofit(response.nonprofit);
  return {
    ...nonprofit,
    stats: {
      eventsHosted: response.stats?.eventsHosted ?? 0,
      totalRaised: response.stats?.totalRaised ?? 0,
      totalBacked: response.stats?.totalBacked ?? 0,
    },
    events: (response.events ?? []).map(adaptEvent),
  };
}
