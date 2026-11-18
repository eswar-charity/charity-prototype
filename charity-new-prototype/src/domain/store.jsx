// React bindings for the domain engine. State persists to localStorage so a journey carries across roles
// (an SE's submission shows up for the nonprofit, then for guests, then in the admin's audit log).
import { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from 'react'
import { createEngine } from './engine.js'
import { buildSeed, SCHEMA_VERSION } from './seed.js'
import { currentUser } from './selectors.js'

const KEY = 'charityhub.prototype.v3'
const Ctx = createContext(null)

function load() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    if (raw) {
      const s = JSON.parse(raw)
      if (s?.version === SCHEMA_VERSION) return s
    }
  } catch { /* corrupt or unavailable: start fresh */ }
  return buildSeed()
}

export function DomainProvider({ children, engine: injected }) {
  const ref = useRef(null)
  if (!ref.current) ref.current = injected ?? createEngine(load(), { storageKey: KEY })
  const engine = ref.current
  return <Ctx.Provider value={engine}>{children}</Ctx.Provider>
}

const useEngine = () => {
  const e = useContext(Ctx)
  if (!e) throw new Error('Domain hooks must be used inside <DomainProvider>')
  return e
}

/** Subscribe to the whole domain state. */
export function useDomain() {
  const e = useEngine()
  return useSyncExternalStore(e.subscribe, e.getState, e.getState)
}

/** The signed-in user (or null) plus session helpers. */
export function useSession() {
  const e = useEngine()
  const s = useSyncExternalStore(e.subscribe, e.getState, e.getState)
  return { user: currentUser(s), session: s.session, now: new Date(s.now) }
}

/** act(type, payload) → { ok, data } | { ok:false, error }. Stable identity. */
export function useAct() {
  const e = useEngine()
  return useCallback((type, payload) => e.dispatch(type, payload), [e])
}

export function useEngineHandle() { return useEngine() }

/** Convenience: select derived data from the state with a stable subscription. */
export function useSelector(fn) {
  const s = useDomain()
  return useMemo(() => fn(s), [s, fn]) // eslint-disable-line react-hooks/exhaustive-deps
}

export const resetDemo = (engine) => {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  engine.reset(buildSeed())
}
