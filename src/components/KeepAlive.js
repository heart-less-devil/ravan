import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

// Lightweight heartbeat to keep backend warm while a user has the site open.
// Note: Browsers throttle background timers; this is best-effort only.
export default function KeepAlive() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const healthUrl = `${API_BASE_URL}/api/health`;

    const ping = async () => {
      try {
        // Use HEAD to minimize load; fall back to GET if HEAD not supported
        const headResponse = await fetch(healthUrl, { method: 'HEAD', cache: 'no-store', mode: 'cors' });
        if (!headResponse.ok) {
          await fetch(healthUrl, { method: 'GET', cache: 'no-store', mode: 'cors' });
        }
      } catch (_) {
        // Silently ignore network errors
      }
    };

    // Immediate ping on mount
    ping();

    // Regular ping while tab is open
    intervalRef.current = setInterval(ping, 4 * 60 * 1000); // 4 minutes

    // Extra pings on visibility/focus events
    const onFocus = () => ping();
    const onVisible = () => { if (!document.hidden) ping(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}


