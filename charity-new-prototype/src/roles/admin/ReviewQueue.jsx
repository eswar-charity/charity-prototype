import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, PageHeader, Section, StatusBadge, timeAgo } from '../../ui/kit.jsx'
import { useDomain, useSession } from '../../domain/store.jsx'
import { FilterBar, OPEN_REVIEW, PRIORITY_RANK, ResultCount, SelectField, roleName } from './common.jsx'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open (new or in review)' },
  { value: 'all', label: 'All statuses' },
  ...['New', 'In Review', 'Approved', 'Rejected', 'Closed'].map((v) => ({ value: v, label: v })),
]

export default function ReviewQueue() {
  const s = useDomain()
  const { now } = useSession()
  const [status, setStatus] = useState('open')
  const [type, setType] = useState('all')
  const [priority, setPriority] = useState('all')

  const types = useMemo(() => [...new Set(s.reviewItems.map((r) => r.type))].sort(), [s.reviewItems])
  const rows = s.reviewItems
    .filter((r) => (status === 'all' ? true : status === 'open' ? OPEN_REVIEW.includes(r.status) : r.status === status))
    .filter((r) => type === 'all' || r.type === type)
    .filter((r) => priority === 'all' || r.priority === priority)
    .sort((a, b) => Number(!OPEN_REVIEW.includes(a.status)) - Number(!OPEN_REVIEW.includes(b.status)) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || new Date(b.createdAt) - new Date(a.createdAt))
  const filtered = status !== 'open' || type !== 'all' || priority !== 'all'
  const clear = () => { setStatus('open'); setType('all'); setPriority('all') }

  return (
    <>
      <PageHeader eyebrow="Review queue" title="Review queue" lede="Nonprofit verifications, event reviews and content reports, most urgent first." />
      <Section>
        <FilterBar label="Filter review items">
          <SelectField id="rv-status" label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <SelectField id="rv-type" label="Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...types.map((t) => ({ value: t, label: t }))]} />
          <SelectField id="rv-priority" label="Priority" value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All priorities' }, 'High', 'Medium', 'Low']} />
        </FilterBar>
        <ResultCount>{rows.length === 1 ? '1 item' : `${rows.length} items`}</ResultCount>
        {rows.length === 0 ? (
          <Empty title="No review items match" action={filtered ? <button type="button" className="link-btn" onClick={clear}>Show open items</button> : undefined}>
            {filtered ? 'Try a different status, type or priority.' : 'The queue is clear. New items appear when a nonprofit finishes setup, an event needs review or someone reports content.'}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="ch-sr">Review items</caption>
              <thead>
                <tr><th scope="col">Item</th><th scope="col">Type</th><th scope="col">Submitted by</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col">Created</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="adm-mono">{r.code}</span> <Link to={`/admin/review/${r.id}`}>{r.title}</Link></td>
                    <td>{r.type}</td>
                    <td>{r.submittedBy}<span className="ch-muted"> ({roleName(r.submittedRole)})</span></td>
                    <td><StatusBadge status={r.priority} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="adm-nowrap">{timeAgo(r.createdAt, now)}</td>
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
