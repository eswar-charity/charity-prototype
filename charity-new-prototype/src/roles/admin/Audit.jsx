import { useState } from 'react'
import { Empty, PageHeader, Section, StatusBadge, fmtDateTime } from '../../ui/kit.jsx'
import { useDomain } from '../../domain/store.jsx'
import { ChipGroup, ResultCount, SearchField, roleName } from './common.jsx'

export const AUDIT_CATEGORIES = ['Approval', 'Verification', 'Events', 'Exception', 'Payments', 'Privacy', 'Moderation']

export default function Audit() {
  const s = useDomain()
  const [category, setCategory] = useState('All')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const all = [...s.audit].sort((a, b) => new Date(b.at) - new Date(a.at))
  const rows = all
    .filter((a) => category === 'All' || a.category === category)
    .filter((a) => !needle || [a.actor, a.action, a.target, a.category, roleName(a.role)].some((f) => (f ?? '').toLowerCase().includes(needle)))

  return (
    <>
      <PageHeader eyebrow="Audit log" title="Audit log" lede="Every admin decision and system job, newest first." />
      <Section>
        <ChipGroup label="Filter by category" options={['All', ...AUDIT_CATEGORIES]} value={category} onChange={setCategory} />
        <SearchField id="audit-q" label="Search the log" value={q} onChange={setQ} placeholder="Actor, action or target" />
        <ResultCount>Showing {rows.length} of {all.length} {all.length === 1 ? 'entry' : 'entries'}</ResultCount>
        {rows.length === 0 ? (
          <Empty title={category === 'All' ? 'No entries match' : `No ${category.toLowerCase()} entries`} action={category !== 'All' || needle ? <button type="button" className="link-btn" onClick={() => { setCategory('All'); setQ('') }}>Show everything</button> : undefined}>
            {all.length === 0 ? 'Nothing has been recorded yet.' : 'Try another category or a different search.'}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="ch-sr">Audit log</caption>
              <thead><tr><th scope="col">When</th><th scope="col">Actor</th><th scope="col">Role</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Category</th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="adm-nowrap"><time dateTime={a.at}>{fmtDateTime(a.at)}</time></td>
                    <td>{a.actor}</td>
                    <td>{roleName(a.role)}</td>
                    <td className="adm-wrap">{a.action}</td>
                    <td className="adm-wrap">{a.target}</td>
                    <td><StatusBadge status="Info">{a.category}</StatusBadge></td>
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
