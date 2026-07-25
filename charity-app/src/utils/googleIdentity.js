const GIS_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-gsi-client';

export function getGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

function loadGoogleScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in requires a browser'));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  const existing = document.getElementById(GIS_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in'));
    document.head.appendChild(script);
  });
}

/**
 * Request a Google ID token via Identity Services.
 * Tries One Tap / FedCM prompt first; falls back to a temporary official button click target.
 * @returns {Promise<string>} JWT credential
 */
export async function requestGoogleIdToken() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google sign-in is not configured');
  }
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err, credential) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) reject(err);
      else resolve(credential);
    };

    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(host);

    const cleanup = () => {
      try {
        host.remove();
      } catch {
        /* ignore */
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) finish(null, response.credential);
        else finish(new Error('Google sign-in was cancelled'));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    window.google.accounts.id.prompt((notification) => {
      if (settled) return;
      const skipped =
        notification?.isNotDisplayed?.() ||
        notification?.isSkippedMoment?.() ||
        notification?.isDismissedMoment?.();
      if (!skipped) return;

      // Fallback: render official button and click it (user gesture already happened).
      window.google.accounts.id.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 280,
      });
      const btn = host.querySelector('div[role="button"]');
      if (btn) {
        btn.click();
        return;
      }
      finish(new Error('Google sign-in unavailable — check authorized origins for this site'));
    });

    setTimeout(() => {
      if (!settled) finish(new Error('Google sign-in timed out'));
    }, 120000);
  });
}
