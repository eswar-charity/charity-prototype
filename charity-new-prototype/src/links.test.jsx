// Link integrity: every internal link a person can see must lead somewhere real (no dead ends, no 404s).
import { describe, it, expect } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { renderApp, makeEngine, EMAILS } from './test-utils.jsx'

const internal = (hrefs) => [...new Set(hrefs.filter((h) => h?.startsWith('/') && !h.startsWith('//')).map((h) => h.split('#')[0].split('?')[0] || '/'))]
const hrefsOnPage = () => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))

async function crawl(engine, starts) {
  const seen = new Set(), dead = []
  const visit = async (route) => {
    const view = renderApp(route, { engine })
    await new Promise((r) => setTimeout(r, 20))
    const text = document.body.textContent
    const is404 = /We couldn’t find that/.test(text)
    const links = internal(hrefsOnPage())
    view.unmount(); cleanup()
    return { is404, links }
  }
  for (const start of starts) {
    const first = await visit(start)
    if (first.is404) dead.push(`${start} (start page is a 404)`)
    for (const l of first.links) {
      if (seen.has(l)) continue
      seen.add(l)
      const r = await visit(l)
      if (r.is404) dead.push(`${l} (linked from ${start})`)
    }
  }
  return { dead, checked: seen.size }
}

const ROLES = {
  guest: { as: null, starts: ['/', '/nonprofits', '/nonprofits/aspca', '/causes', '/how-it-works', '/events/river-cleanup', '/events/neon-night', '/organizers/u_mike', '/signin', '/signup'] },
  'guest lead': { demo: 'u_marcus', starts: ['/', '/saved', '/about-you', '/notifications', '/events/dog-dad'] },
  se: { as: EMAILS.mike, starts: ['/se', '/se/drafts', '/se/impact', '/se/profile', '/se/create/spring-sprint/1', '/se/approval/spring-sprint', '/se/live/neon-night', '/se/impact/neon-night', '/events/dog-dad'] },
  'se with fixes': { as: EMAILS.sam, starts: ['/se', '/se/approval/book-drive-bash', '/se/create/book-drive-bash/1'] },
  np: { as: EMAILS.aspca, starts: ['/np', '/np/setup', '/np/profile', '/np/activity', '/np/financials', '/np/approvals', '/np/approvals/paws-in-the-park', '/np/approvals/paws-in-the-park/request-changes', '/np/settings/autopilot', '/np/events', '/np/events/new', '/np/live/dog-dad', '/notifications'] },
  'np awaiting verification': { demo: 'u_np_wwf', starts: ['/np', '/np/setup', '/np/financials'] },
  admin: { as: EMAILS.admin, starts: ['/admin', '/admin/review', '/admin/review/rv_2041', '/admin/nonprofits', '/admin/nonprofits/world-wildlife-fund-wwf-us', '/admin/nonprofits/aspca', '/admin/events', '/admin/exceptions', '/admin/audit', '/admin/moderation', '/admin/payments', '/admin/privacy'] },
}

describe('link integrity', () => {
  for (const [name, cfg] of Object.entries(ROLES)) {
    it(`${name}: no internal link leads to a 404`, async () => {
      const engine = makeEngine()
      if (cfg.as) engine.dispatch('signIn', { email: cfg.as, password: 'Passw0rd!' })
      if (cfg.demo) engine.dispatch('demoSignIn', { userId: cfg.demo })
      const { dead, checked } = await crawl(engine, cfg.starts)
      expect(checked, 'should find links to check').toBeGreaterThan(3)
      expect(dead).toEqual([])
    }, 120000)
  }
})
