// Test harness: the real App, real providers, a fresh engine with a fixed clock.
//   const { engine } = renderApp('/se', { as: 'mike.rivera@demo.charityhub.com' })
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import AppProviders from './AppProviders.jsx'
import { createEngine } from './domain/engine.js'
import { buildSeed } from './domain/seed.js'

export const FIXED_NOW = '2026-11-18T12:00:00.000Z'

export function makeEngine(now = FIXED_NOW) { return createEngine(buildSeed(now)) }

export function renderApp(route = '/', { as, engine = makeEngine() } = {}) {
  if (as) {
    const r = engine.dispatch('signIn', { email: as, password: 'Passw0rd!' })
    if (!r.ok) throw new Error(`test sign-in failed: ${r.error.message}`)
  }
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders engine={engine}><App /></AppProviders>
    </MemoryRouter>,
  )
  return { engine, ...utils }
}

export const EMAILS = {
  admin: 'alex.mercer@charityhub.com',
  mike: 'mike.rivera@demo.charityhub.com', jordan: 'jordan.blake@demo.charityhub.com', sam: 'sam.okonkwo@demo.charityhub.com', priya: 'priya.desai@demo.charityhub.com',
  aspca: 'aspca@charityhub.com', unitedway: 'unitedway@charityhub.com', stjude: 'stjude@charityhub.com', sierra: 'sierraclub@charityhub.com',
}
