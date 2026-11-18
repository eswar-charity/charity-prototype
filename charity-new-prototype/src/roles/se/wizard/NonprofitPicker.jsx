import { useId, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { npBlocker } from './helpers.js'

/**
 * Step 2: choose the beneficiary. Only Active + settlement Ready nonprofits are selectable; every other
 * nonprofit is shown disabled with the reason, in words (never colour alone).
 */
export default function NonprofitPicker({ nonprofits, value, onChange, disabled = false, error }) {
  const uid = useId()
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return Object.values(nonprofits)
      .map((np) => ({ np, blocker: npBlocker(np) }))
      .filter(({ np }) => !needle || `${np.name} ${np.category}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(!!a.blocker) - Number(!!b.blocker) || a.np.name.localeCompare(b.np.name))
  }, [nonprofits, q])
  const available = rows.filter((r) => !r.blocker).length

  return (
    <fieldset className={`se-npfield ${error ? 'is-invalid' : ''}`} id="se-w-nonprofitId" tabIndex={-1} disabled={disabled} aria-describedby={error ? `${uid}-err` : `${uid}-hint`}>
      <legend className="ch-field__label">Nonprofit this event supports</legend>
      <p className="ch-field__hint" id={`${uid}-hint`}>Donations go straight to the nonprofit you choose. Only verified nonprofits that can receive payments can be picked.</p>
      <div className="ch-field se-npsearch">
        <label className="ch-field__label" htmlFor={`${uid}-q`}>Search nonprofits</label>
        <div className="se-hash">
          <Search size={18} aria-hidden="true" className="se-hash__icon" />
          <input id={`${uid}-q`} type="search" className="ch-field__input se-hash__input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or category" autoComplete="off" />
        </div>
      </div>
      <p className="ch-field__hint" role="status">{rows.length === 0 ? 'No nonprofits match that search.' : `${available} of ${rows.length} can take new events.`}</p>
      <ul className="se-nps">
        {rows.map(({ np, blocker }) => {
          const id = `${uid}-${np.id}`
          const on = value === np.id
          return (
            <li key={np.id}>
              <label className={`se-np ${on ? 'is-on' : ''} ${blocker ? 'is-off' : ''}`} htmlFor={id}>
                <input id={id} type="radio" name={`${uid}-np`} value={np.id} checked={on} disabled={!!blocker || disabled} onChange={() => onChange(np.id)} aria-describedby={blocker ? `${id}-why` : undefined} />
                <span className="se-np__text">
                  <strong>{np.name}</strong>
                  <span className="ch-muted">{np.category}</span>
                  {blocker && <span className="se-np__why" id={`${id}-why`}>Not available: {blocker}</span>}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {error && <span className="ch-field__hint se-err" id={`${uid}-err`}>{error}</span>}
    </fieldset>
  )
}
