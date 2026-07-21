import { useState } from 'react';
import { Lock, Copy, Check } from 'lucide-react';
import Logo from '../components/Logo';
import useIsDesktop from '../hooks/useIsDesktop';
import useAccessGate from './useAccessGate';
import { generateAccessPassword } from './accessConfig';

const DURATIONS = [24, 48];

function formatExpiry(ms) {
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function LoginForm({ username, onUsernameChange, password, onPasswordChange, onSubmit, error }) {
  return (
    <form onSubmit={onSubmit} className="access-gate-form">
      <input
        className="access-gate-input"
        value={username}
        onChange={onUsernameChange}
        placeholder="Your name"
        autoFocus
        autoComplete="name"
        aria-label="Your name"
      />
      <input
        className="access-gate-input"
        value={password}
        onChange={onPasswordChange}
        placeholder="Access password"
        autoComplete="off"
        aria-label="Access password"
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <p className="access-gate-error" role="alert">{error}</p>}
      <button type="submit" className="btn-primary">Continue</button>
    </form>
  );
}

/** Founder-only: mint a password good for 24 or 48 hours and hand it to an investor. */
function PasswordGenerator() {
  const [hours, setHours] = useState(24);
  const [label, setLabel] = useState('');
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setGenerated({ ...generateAccessPassword(hours), label: label.trim() });
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="access-generator">
      <input
        className="access-generator-label-input"
        placeholder="Who's this for? (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        aria-label="Password recipient (optional)"
      />

      <div className="access-generator-row">
        <div className="access-generator-duration" role="group" aria-label="Expires in">
          {DURATIONS.map((h) => (
            <button
              key={h}
              type="button"
              className={`access-generator-duration-btn${hours === h ? ' active' : ''}`}
              aria-pressed={hours === h}
              onClick={() => setHours(h)}
            >
              {h}h
            </button>
          ))}
        </div>
        <button type="button" className="access-generator-generate-btn" onClick={handleGenerate}>
          Generate password
        </button>
      </div>

      {generated && (
        <div className="access-generator-result">
          <div className="access-generator-result-text">
            <span className="access-generator-password">{generated.password}</span>
            <span className="access-generator-meta">
              {generated.label && `For ${generated.label} · `}Expires {formatExpiry(generated.expiresAt)}
            </span>
          </div>
          <button type="button" className="access-generator-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

function MobileAccessGate(props) {
  return (
    <div className="access-gate">
      <div className="access-gate-card">
        <Logo height={32} linkToFeed={false} />
        <div className="access-gate-icon" aria-hidden="true"><Lock size={18} /></div>
        <h1 className="access-gate-title">Private preview</h1>
        <p className="access-gate-copy">
          This link is for invited reviewers only. Sign in with the name and password you were given.
        </p>
        <LoginForm {...props} />
        <p className="access-gate-footnote">Don&apos;t have a password? Ask whoever shared this link with you.</p>
      </div>
    </div>
  );
}

function DesktopAccessGate(props) {
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
          <h2 className="access-gate-desktop-card-title">Sign in to continue</h2>
          <p className="access-gate-desktop-card-copy">
            This link is for invited reviewers only — sign in with the name and password you were given.
          </p>
          <LoginForm {...props} />
          <p className="access-gate-desktop-card-foot">Don&apos;t have a password? Ask whoever shared this link with you.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps the whole app behind a username + password gate — see
 * useAccessGate.js and accessConfig.js for how passwords are validated,
 * generated, and made to expire.
 */
export default function AccessGate({ children }) {
  const isDesktop = useIsDesktop();
  const { unlocked, isAdmin, error, submit, lock } = useAccessGate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(true);

  if (unlocked) {
    return (
      <>
        {isAdmin && showAdminPanel && (
          <div className="access-admin-banner">
            <div className="access-admin-banner-head">
              <span>Signed in as founder — generate a password for an investor below.</span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={lock}>Lock this device</button>
                <button type="button" onClick={() => setShowAdminPanel(false)} aria-label="Dismiss">✕</button>
              </div>
            </div>
            <PasswordGenerator />
          </div>
        )}
        {children}
      </>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(username, password);
  };

  const formProps = {
    username,
    onUsernameChange: (e) => setUsername(e.target.value),
    password,
    onPasswordChange: (e) => setPassword(e.target.value),
    onSubmit: handleSubmit,
    error,
  };

  return isDesktop ? <DesktopAccessGate {...formProps} /> : <MobileAccessGate {...formProps} />;
}
