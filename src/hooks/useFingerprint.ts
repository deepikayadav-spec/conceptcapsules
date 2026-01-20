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

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string>('');

  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem('user_fingerprint');
    if (stored) {
      setFingerprint(stored);
    } else {
      const fp = generateFingerprint();
      localStorage.setItem('user_fingerprint', fp);
      setFingerprint(fp);
    }
  }, []);

  return fingerprint;
}
