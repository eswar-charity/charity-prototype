import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAppToast } from '../components/Toast';

/** Format local digits with the fixed +1 dial shown on gate UIs. */
export function formatGatePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits ? `+1${digits}` : '';
}

/**
 * Shared phone/email identity-gate submit for join/donate screens + modals.
 * Preserves existing next route (`/about-you` by default).
 */
export function useIdentityGateFlow({ nextPath = '/about-you', onSuccess } = {}) {
  const navigate = useNavigate();
  const { identityGate } = useAuth();
  const { toast, show } = useAppToast();
  const [mode, setMode] = useState('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);

  async function handleContinue() {
    if (pending) return;

    let payload;
    if (mode === 'phone') {
      const formatted = formatGatePhone(phone);
      if (!formatted) {
        show('Enter a mobile number to continue', { variant: 'error' });
        return;
      }
      payload = { phone: formatted };
    } else {
      const trimmed = email.trim();
      if (!trimmed) {
        show('Enter an email to continue', { variant: 'error' });
        return;
      }
      payload = { email: trimmed };
    }

    setPending(true);
    try {
      await identityGate(payload);
      if (onSuccess) onSuccess();
      navigate(nextPath);
    } catch (err) {
      show(err?.message || 'Something went wrong', { variant: 'error' });
    } finally {
      setPending(false);
    }
  }

  return {
    mode,
    setMode,
    phone,
    setPhone,
    email,
    setEmail,
    pending,
    toast,
    handleContinue,
    switchToEmail: () => setMode('email'),
    switchToPhone: () => setMode('phone'),
  };
}
