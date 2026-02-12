import { useState, useEffect } from 'react';

// Safe localStorage helpers for cross-origin iframe contexts
let memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStore[key] ?? null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage blocked (cross-origin iframe), use memory fallback
  }
  memoryStore[key] = value;
}

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
    const storedPortalId = safeGetItem('portal_user_id');
    if (storedPortalId) {
      setIdentity({ identifier: storedPortalId, source: 'portal' });
    } else {
      // Fall back to fingerprint
      const stored = safeGetItem('user_fingerprint');
      if (stored) {
        setIdentity({ identifier: stored, source: 'fingerprint' });
      } else {
        const fp = generateFingerprint();
        safeSetItem('user_fingerprint', fp);
        setIdentity({ identifier: fp, source: 'fingerprint' });
      }
    }

    // Listen for postMessage from parent portal
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SET_USER_ID' && typeof event.data.userId === 'string') {
        const userId = event.data.userId;
        safeSetItem('portal_user_id', userId);
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
    const storedPortalId = safeGetItem('portal_user_id');
    if (storedPortalId) {
      setIdentity({ identifier: storedPortalId, source: 'portal' });
    } else {
      const stored = safeGetItem('user_fingerprint');
      if (stored) {
        setIdentity({ identifier: stored, source: 'fingerprint' });
      } else {
        const fp = generateFingerprint();
        safeSetItem('user_fingerprint', fp);
        setIdentity({ identifier: fp, source: 'fingerprint' });
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SET_USER_ID' && typeof event.data.userId === 'string') {
        const userId = event.data.userId;
        safeSetItem('portal_user_id', userId);
        setIdentity({ identifier: userId, source: 'portal' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return identity;
}
