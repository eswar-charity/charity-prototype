import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, PageHeader, Section, StatusBadge, useConfirm, useRun } from '../../ui/kit.jsx'
import { useDomain } from '../../domain/store.jsx'
import { ROLES } from '../../domain/engine.js'
import { ResultCount, SearchField, roleName } from './common.jsx'

const STATE = { active: ['Active', 'Active'], pending: ['Pending', 'Invite pending'], suspended: ['Suspended', 'Suspended'], anonymized: ['Closed', 'Anonymized'] }

export default function Privacy() {
  const s = useDomain()
  const run = useRun()
  const confirm = useConfirm()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const users = Object.values(s.users)
  const results = needle.length < 2 ? [] : users.filter((u) => [u.name, u.email].some((f) => (f ?? '').toLowerCase().includes(needle))).sort((a, b) => a.name.localeCompare(b.name))
  const anonymized = users.filter((u) => u.status === 'anonymized')

  const footprint = (u) => ({
    gifts: s.donations.filter((d) => d.donorId === u.id).length,
    events: Object.values(s.events).filter((e) => e.organizerId === u.id && !e.deletedAt).length,
    posts: s.posts.filter((p) => p.authorId === u.id).length + s.posts.reduce((n, p) => n + p.replies.filter((r) => r.authorId === u.id).length, 0) + Object.values(s.chat).reduce((n, l) => n + l.filter((m) => m.authorId === u.id).length, 0),
  })

  const anonymize = async (u) => {
    const f = footprint(u)
    const ok = await confirm({
      title: `Anonymize ${u.name}?`,
      body: `Their name, email, phone, bio and city are removed, they can no longer sign in, and this cannot be undone. Financial records stay (${f.gifts} ${f.gifts === 1 ? 'donation' : 'donations'} and receipts) and so does content they wrote (${f.posts} ${f.posts === 1 ? 'post, reply or message' : 'posts, replies and messages'}), shown under "Deleted user".`,
      confirm: 'Anonymize account',
      danger: true,
    })
    if (ok) run('anonymizeUser', { userId: u.id }, { success: `${u.name} anonymized. Financial records and content stay.` })
  }

  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy" lede="Handle a request to delete someone’s personal data. Search by name or email, then anonymize the account." />
      <Section title="Find a person" id="find">
        <SearchField id="privacy-q" label="Name or email" value={q} onChange={setQ} placeholder="At least two letters" />
        {needle.length < 2 ? (
          <p className="ch-muted">Type at least two letters to search accounts. Guests, social entrepreneurs, nonprofit admins and admins are all included.</p>
        ) : (
          <>
            <ResultCount>{results.length === 1 ? '1 person' : `${results.length} people`}</ResultCount>
            {results.length === 0 ? (
              <Empty title="No one matches">Check the spelling, or search by the email they used.</Empty>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <caption className="ch-sr">People</caption>
                  <thead><tr><th scope="col">Person</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Account</th><th scope="col">Action</th></tr></thead>
                  <tbody>
                    {results.map((u) => {
                      const [tone, text] = STATE[u.status] ?? ['Closed', u.status]
                      const np = u.nonprofitId && s.nonprofits[u.nonprofitId]
                      return (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td className="adm-wrap">{u.email}</td>
                          <td>{roleName(u.role)}{np && <> · <Link to={`/admin/nonprofits/${np.id}`}>{np.name}</Link></>}</td>
                          <td><StatusBadge status={tone}>{text}</StatusBadge></td>
                          <td>
                            {u.role === ROLES.ADMIN ? <span className="ch-muted">Admin accounts cannot be anonymized</span>
                              : u.status === 'anonymized' ? <span className="ch-muted">Already anonymized</span>
                              : <button type="button" className="ch-btn ch-btn--danger ch-btn--sm" aria-label={`Anonymize ${u.name}`} onClick={() => anonymize(u)}>Anonymize</button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <p className="adm-note">Anonymizing removes personal details only. Donations, receipts and the content a person wrote stay, because the nonprofit and the community still need those records.</p>
      </Section>

      <Section title="Anonymized accounts" id="anonymized">
        {anonymized.length === 0 ? (
          <p className="ch-muted">No accounts have been anonymized yet. Each one is recorded in the <Link to="/admin/audit">audit log</Link>.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="ch-sr">Anonymized accounts</caption>
              <thead><tr><th scope="col">Account</th><th scope="col">Was a</th><th scope="col">Status</th><th scope="col">Kept on record</th></tr></thead>
              <tbody>
                {anonymized.map((u) => {
                  const f = footprint(u)
                  return (
                    <tr key={u.id}>
                      <td>{u.name} <span className="adm-mono">({u.id})</span></td>
                      <td>{roleName(u.role)}</td>
                      <td><StatusBadge status="Closed">Anonymized</StatusBadge></td>
                      <td>{f.gifts} {f.gifts === 1 ? 'donation' : 'donations'}, {f.posts} {f.posts === 1 ? 'post or message' : 'posts and messages'}, {f.events} {f.events === 1 ? 'event' : 'events'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  )
}
