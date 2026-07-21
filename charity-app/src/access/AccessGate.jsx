import { useState } from 'react';
import { Lock } from 'lucide-react';
import Logo from '../components/Logo';
import useIsDesktop from '../hooks/useIsDesktop';
import useAccessGate from './useAccessGate';
import { getRotatingPassword } from './accessConfig';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function PasscodeForm({ value, onChange, onSubmit, error }) {
  return (
    <form onSubmit={onSubmit} className="access-gate-form">
      <input
        className="access-gate-input"
        value={value}
        onChange={onChange}
        placeholder="Access code"
        autoFocus
        autoComplete="off"
        aria-label="Access code"
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <p className="access-gate-error" role="alert">{error}</p>}
      <button type="submit" className="btn-primary">Continue</button>
    </form>
  );
}

function MobileAccessGate({ value, onChange, onSubmit, error }) {
  return (
    <div className="access-gate">
      <div className="access-gate-card">
        <Logo height={32} linkToFeed={false} />
        <div className="access-gate-icon" aria-hidden="true"><Lock size={18} /></div>
        <h1 className="access-gate-title">Private preview</h1>
        <p className="access-gate-copy">
          This link is for invited reviewers only. Enter the access code you were given to continue.
        </p>
        <PasscodeForm value={value} onChange={onChange} onSubmit={onSubmit} error={error} />
        <p className="access-gate-footnote">Don&apos;t have a code? Ask whoever shared this link with you.</p>
      </div>
    </div>
  );
}

function DesktopAccessGate({ value, onChange, onSubmit, error }) {
  return (
    <div className="dsk-page access-gate-desktop">
      <div className="access-gate-desktop-hero">
        <p className="access-gate-desktop-eyebrow">Private investor preview</p>
        <h1 className="access-gate-desktop-headline">Showing up, turned into a movement.</h1>
        <p className="access-gate-desktop-subhead">
          You&apos;re a step away from an early look at Charity Hub — verified nonprofits, organisers,
          and neighbors, connected around events that matter, live.
        </p>
      </div>
      <div className="access-gate-desktop-form-side">
        <div className="access-gate-desktop-card">
          <Logo height={34} linkToFeed={false} />
          <p className="access-gate-desktop-card-eyebrow">Private preview</p>
          <h2 className="access-gate-desktop-card-title">Enter your access code</h2>
          <p className="access-gate-desktop-card-copy">
            This link is for invited reviewers only — enter the code you were given to continue.
          </p>
          <PasscodeForm value={value} onChange={onChange} onSubmit={onSubmit} error={error} />
          <p className="access-gate-desktop-card-foot">Don&apos;t have a code? Ask whoever shared this link with you.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps the whole app behind a passcode gate — see useAccessGate.js and
 * accessConfig.js for how codes are validated, rotated, and revoked.
 */
export default function AccessGate({ children }) {
  const isDesktop = useIsDesktop();
  const { unlocked, isAdmin, error, submit, lock } = useAccessGate();
  const [value, setValue] = useState('');
  const [showAdminHint, setShowAdminHint] = useState(true);

  if (unlocked) {
    return (
      <>
        {isAdmin && showAdminHint && (
          <div className="access-admin-banner">
            <span>
              Today&apos;s passphrase: <strong>{getRotatingPassword()}</strong>
              {' · '}Tomorrow: <strong>{getRotatingPassword(new Date(Date.now() + ONE_DAY_MS))}</strong>
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button type="button" onClick={lock}>Lock this device</button>
              <button type="button" onClick={() => setShowAdminHint(false)} aria-label="Dismiss">✕</button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(value);
  };
  const handleChange = (e) => setValue(e.target.value);

  return isDesktop
    ? <DesktopAccessGate value={value} onChange={handleChange} onSubmit={handleSubmit} error={error} />
    : <MobileAccessGate value={value} onChange={handleChange} onSubmit={handleSubmit} error={error} />;
}
