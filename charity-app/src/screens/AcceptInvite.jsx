import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { getInvite } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { useAppToast, ToastHost } from '../components/Toast';

const MIN_PASSWORD = 8;

/**
 * Landing page for the single-use link a Charity Hub admin sends a nonprofit.
 * Nonprofit accounts can't be created any other way.
 */
export default function AcceptInvite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { acceptInvite } = useAuth();
  const { toast, show } = useAppToast();
  const [invite, setInvite] = useState(null);
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setProblem('This invite link is missing its token. Ask your Charity Hub contact to resend it.');
      setLoading(false);
      return undefined;
    }
    getInvite(token)
      .then((data) => {
        if (!cancelled) setInvite(data);
      })
      .catch((err) => {
        if (!cancelled) setProblem(err?.message || 'This invite link is not valid.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return show('Enter your name', { variant: 'error' });
    if (password.length < MIN_PASSWORD) return show(`Password must be at least ${MIN_PASSWORD} characters`, { variant: 'error' });
    if (password !== confirm) return show('Passwords do not match', { variant: 'error' });
    setPending(true);
    try {
      await acceptInvite({ token, name: name.trim(), password });
      navigate('/np/home', { replace: true });
    } catch (err) {
      show(err?.message || 'Could not create your account', { variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg, #F4F7FB)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 8px 32px rgba(10,46,82,.12)' }}>
        <Logo height={34} tone="dark" style={{ marginBottom: 20 }} />
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Checking your invite…</p>
        ) : problem ? (
          <>
            <h1 className="screen-title" style={{ fontSize: 22 }}>Invite unavailable</h1>
            <p className="screen-subtitle" style={{ marginTop: 8 }}>{problem}</p>
            <button type="button" className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
              Go to sign in
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 className="screen-title" style={{ fontSize: 22 }}>Welcome to Charity Hub</h1>
            <p className="screen-subtitle" style={{ marginTop: 8 }}>
              Set up the admin account for <strong>{invite?.nonprofit?.name}</strong>.
            </p>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input-field" type="email" value={invite?.email || ''} disabled aria-label="Email" />
              <input
                className="input-field" type="text" autoComplete="name" placeholder="Your full name"
                value={name} disabled={pending} onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input-field" type="password" autoComplete="new-password"
                placeholder={`Password (min ${MIN_PASSWORD} characters)`}
                value={password} disabled={pending} onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="input-field" type="password" autoComplete="new-password" placeholder="Confirm password"
                value={confirm} disabled={pending} onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 22 }} disabled={pending}>
              {pending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
      <ToastHost toast={toast} />
    </div>
  );
}
