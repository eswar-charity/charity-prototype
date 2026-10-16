import { useState } from 'react';
import { Copy, X } from 'lucide-react';
import { inviteNonprofit, inviteNonprofitAdmin } from '../../api/admin';
import useCategories from '../../hooks/useCategories';

const fieldStyle = {
  padding: '9px 12px', border: '1px solid var(--a-border, #D5DFEA)', borderRadius: 8,
  fontSize: 14, width: '100%', boxSizing: 'border-box',
};

/**
 * Invite-only onboarding. Platform admins either create a nonprofit and invite
 * its first admin, or (with `nonprofit`) issue a fresh single-use link for an
 * existing one. Until an email provider is connected the link is shared by hand.
 */
export default function InvitePanel({ nonprofit = null, onClose, onDone, notify }) {
  const { names: categories } = useCategories();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Community');
  const [ein, setEin] = useState('');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [link, setLink] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!nonprofit && !name.trim()) return notify('Nonprofit name is required', { variant: 'error' });
    if (nonprofit && !email.trim()) return notify('Admin email is required', { variant: 'error' });
    setPending(true);
    try {
      const res = nonprofit
        ? await inviteNonprofitAdmin(nonprofit.id, email.trim())
        : await inviteNonprofit({
            name: name.trim(),
            category,
            ein: ein.trim() || undefined,
            admin_email: email.trim() || undefined,
          });
      const invite = nonprofit ? res : res.invite;
      if (invite?.invite_url) setLink(invite.invite_url);
      else notify('Nonprofit created — add an admin invite when ready');
      onDone?.();
    } catch (err) {
      notify(err?.message || 'Invite failed', { variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify('Invite link copied');
    } catch {
      notify('Copy failed — select the link manually', { variant: 'error' });
    }
  };

  return (
    <div className="adm-panel" style={{ marginBottom: 16 }}>
      <div className="adm-panel-head">
        <span className="adm-panel-title">
          {nonprofit ? `Invite an admin for ${nonprofit.name}` : 'Invite a nonprofit'}
        </span>
        <button type="button" className="adm-link" onClick={onClose} aria-label="Close"><X size={16} /></button>
      </div>
      <div className="adm-panel-body">
        {link ? (
          <>
            <p className="adm-item-meta" style={{ marginBottom: 8 }}>
              Single-use link (valid 7 days). Send it to the nonprofit admin — it can't be shown again.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={link} style={fieldStyle} onFocus={(e) => e.target.select()} />
              <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={copy}>
                <Copy size={14} /> Copy
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
            {!nonprofit && (
              <>
                <input style={fieldStyle} placeholder="Nonprofit name" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
                <select style={fieldStyle} value={category} onChange={(e) => setCategory(e.target.value)} disabled={pending}>
                  {(categories.length ? categories : ['Community']).map((c) => <option key={c}>{c}</option>)}
                </select>
                <input style={fieldStyle} placeholder="EIN (optional, e.g. 12-3456789)" value={ein} onChange={(e) => setEin(e.target.value)} disabled={pending} />
              </>
            )}
            <input
              style={fieldStyle} type="email"
              placeholder={nonprofit ? 'Admin email' : 'Admin email (optional — creates an invite link)'}
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending}
            />
            <div>
              <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={pending}>
                {pending ? 'Working…' : nonprofit ? 'Create invite link' : 'Create nonprofit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
