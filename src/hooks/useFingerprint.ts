import { useState, useEffect } from 'react';

// Generate a simple browser fingerprint for anonymous user identification
function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

interface UserIdentity {
  identifier: string;
  source: 'portal' | 'fingerprint';
}

export function useFingerprint(): string {
  const [identity, setIdentity] = useState<UserIdentity>({ identifier: '', source: 'fingerprint' });

  useEffect(() => {
    // Check if we already have a portal userId stored
    const storedPortalId = localStorage.getItem('portal_user_id');
    if (storedPortalId) {
      setIdentity({ identifier: storedPortalId, source: 'portal' });
    } else {
      // Fall back to fingerprint
      const stored = localStorage.getItem('user_fingerprint');
      if (stored) {
        setIdentity({ identifier: stored, source: 'fingerprint' });
      } else {
        const fp = generateFingerprint();
        localStorage.setItem('user_fingerprint', fp);
        setIdentity({ identifier: fp, source: 'fingerprint' });
      }
    }

    // Listen for postMessage from parent portal
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SET_USER_ID' && typeof event.data.userId === 'string') {
        const userId = event.data.userId;
        localStorage.setItem('portal_user_id', userId);
        setIdentity({ identifier: userId, source: 'portal' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return identity.identifier;
}

export function useUserIdentity(): UserIdentity {
  const [identity, setIdentity] = useState<UserIdentity>({ identifier: '', source: 'fingerprint' });

  useEffect(() => {
    const storedPortalId = localStorage.getItem('portal_user_id');
    if (storedPortalId) {
      setIdentity({ identifier: storedPortalId, source: 'portal' });
    } else {
      const stored = localStorage.getItem('user_fingerprint');
      if (stored) {
        setIdentity({ identifier: stored, source: 'fingerprint' });
      } else {
        const fp = generateFingerprint();
        localStorage.setItem('user_fingerprint', fp);
        setIdentity({ identifier: fp, source: 'fingerprint' });
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SET_USER_ID' && typeof event.data.userId === 'string') {
        const userId = event.data.userId;
        localStorage.setItem('portal_user_id', userId);
        setIdentity({ identifier: userId, source: 'portal' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return identity;
}
