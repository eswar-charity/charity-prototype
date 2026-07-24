import { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Shared toast hook. Admin screens use `useToast` (re-exported) with the same
 * `{ msg, show }` shape; app screens can use `useAppToast` + `ToastHost`.
 */
export function useAppToast(durationMs = 2600) {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, { variant = 'success' } = {}) => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);
  return { toast, show };
}

/** Admin-compatible: `msg` is the message string. */
export function useToast(durationMs = 2600) {
  const { toast, show } = useAppToast(durationMs);
  return {
    msg: toast?.message ?? null,
    variant: toast?.variant ?? 'success',
    show,
  };
}

export function Toast({ msg, variant = 'success' }) {
  if (!msg) return null;
  const isError = variant === 'error';
  return (
    <div
      className={isError ? 'app-toast app-toast--error' : 'adm-toast app-toast'}
      role={isError ? 'alert' : 'status'}
    >
      {isError
        ? <AlertCircle size={16} className="app-toast-ico" aria-hidden="true" />
        : <CheckCircle2 size={16} className="adm-toast-ico" aria-hidden="true" />}
      {msg}
    </div>
  );
}

export function ToastHost({ toast }) {
  if (!toast) return null;
  return <Toast msg={toast.message} variant={toast.variant} />;
}
