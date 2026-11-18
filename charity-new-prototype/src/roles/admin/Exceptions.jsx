import { useState } from 'react'
import { Empty, PageHeader, Section, StatusBadge, dollars, fmtDate, plural, useRun } from '../../ui/kit.jsx'
import { useDomain } from '../../domain/store.jsx'
import { FilterBar, ResultCount, SelectField } from './common.jsx'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Not resolved (open or escalated)' },
  'Open', 'Escalated', 'Resolved',
]

export default function Exceptions() {
  const s = useDomain()
  const run = useRun()
  const [status, setStatus] = useState('all')
  const rows = s.exceptions
    .filter((x) => (status === 'all' ? true : status === 'active' ? x.status !== 'Resolved' : x.status === status))
    .sort((a, b) => Number(a.status === 'Resolved') - Number(b.status === 'Resolved') || new Date(b.createdAt) - new Date(a.createdAt))

  const act = (x, action, success) => run('exceptionAction', { id: x.id, action }, { success: `${x.code} ${success}` })

  return (
    <>
      <PageHeader eyebrow="Exceptions" title="Exceptions" lede="Disputes, payout holds and other money problems that need a person." />
      <Section>
        <FilterBar label="Filter exceptions">
          <SelectField id="ex-status" label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </FilterBar>
        <ResultCount>{plural(rows.length, 'exception')}</ResultCount>
        {rows.length === 0 ? (
          <Empty title="No exceptions match" action={status !== 'all' ? <button type="button" className="link-btn" onClick={() => setStatus('all')}>Show all</button> : undefined}>
            {status === 'all' ? 'Nothing has gone wrong yet. Disputes you mark in Payments show up here.' : 'Try a different status.'}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="ch-sr">Exceptions</caption>
              <thead><tr><th scope="col">Exception</th><th scope="col">Type</th><th scope="col">Related to</th><th scope="col" className="num">Amount</th><th scope="col">Severity</th><th scope="col">Status</th><th scope="col">Opened</th><th scope="col">Actions</th></tr></thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id}>
                    <td><span className="adm-mono">{x.code}</span> {x.title}</td>
                    <td>{x.type}</td>
                    <td>{x.entityRef}</td>
                    <td className="num">{x.amount ? dollars(x.amount) : 'None'}</td>
                    <td><StatusBadge status={x.severity} /></td>
                    <td><StatusBadge status={x.status} /></td>
                    <td className="adm-nowrap">{fmtDate(x.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        {x.status === 'Open' && <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" aria-label={`Escalate ${x.code}`} onClick={() => act(x, 'escalate', 'escalated')}>Escalate</button>}
                        {x.status !== 'Resolved' && <button type="button" className="ch-btn ch-btn--primary ch-btn--sm" aria-label={`Resolve ${x.code}`} onClick={() => act(x, 'resolve', 'resolved')}>Resolve</button>}
                        {x.status === 'Resolved' && <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" aria-label={`Reopen ${x.code}`} onClick={() => act(x, 'reopen', 'reopened')}>Reopen</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}
