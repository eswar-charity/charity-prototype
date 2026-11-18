// In-memory prototype state: donations and joins live only for the session.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { eventByKey } from '../data/index.js'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [donations, setDonations] = useState([]) // { eventKey, amount, name, anonymous }
  const [joined, setJoined] = useState(() => new Set())

  const donate = useCallback((d) => setDonations((prev) => [...prev, d]), [])
  const toggleJoin = useCallback(
    (key) =>
      setJoined((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      }),
    [],
  )

  const value = useMemo(() => {
    const extra = (key) => donations.filter((d) => d.eventKey === key)
    return {
      donate,
      toggleJoin,
      isJoined: (key) => joined.has(key),
      donations,
      /** Live numbers = seeded data + this session's donations/joins. */
      stats(key) {
        const base = eventByKey[key]
        const mine = extra(key)
        return {
          raised: base.raised + mine.reduce((s, d) => s + d.amount, 0),
          backed: base.backed + mine.length,
          joined: base.joined + (joined.has(key) ? 1 : 0),
        }
      },
    }
  }, [donations, joined, donate, toggleJoin])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
