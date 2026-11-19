// Shareable demo links: /se?as=u_mike signs in as that demo person, /?as=guest browses as anonymous,
// and &samples=1000 fills the signed-in organizer's list with sample events (see engine.demoGenerateEvents).
// A link on first load is applied when the engine is created, so route guards already see the signed-in person.

/** Remembers the link applied at start-up so the screen does not apply it a second time. */
export const boot = { search: null }

/** Applies the link's parameters to the engine. Returns the query string without them (for tidying the address bar). */
export function applyDemoLink(engine, search) {
  const params = new URLSearchParams(search)
  const as = params.get('as')
  const samples = Number(params.get('samples'))
  if (!as && !(samples > 0)) return null
  if (as === 'guest') engine.dispatch('signOut')
  else if (as) engine.dispatch('demoSignIn', { userId: as })
  if (samples > 0) engine.dispatch('demoGenerateEvents', { count: samples })
  params.delete('as'); params.delete('samples')
  const rest = params.toString()
  return rest ? `?${rest}` : ''
}
