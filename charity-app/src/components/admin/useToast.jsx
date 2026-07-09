import { useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

/* Lightweight toast for prototype action feedback (no backend). */
export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((m) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2600);
  }, []);
  return { msg, show };
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="adm-toast" role="status">
      <CheckCircle2 size={16} className="adm-toast-ico" />
      {msg}
    </div>
  );
}
