

# Fix: Analytics Not Tracking Iframe Visitors

## Problem

Your site is embedded as an iframe on `learning.ccbp.in` and `learning-beta.earlywave.in`. Modern browsers (Chrome, Safari, Firefox) block `localStorage` access inside cross-origin iframes. Since the fingerprint system depends entirely on `localStorage`, it silently fails and returns an empty string. The session tracker then skips all tracking because it checks `if (!identity.identifier) return`.

This is why your external analytics tool shows 155 visitors but your admin dashboard shows only 2.

## Solution

Make the fingerprint system work without `localStorage` by falling back to in-memory storage when `localStorage` is unavailable.

### Changes

**File: `src/hooks/useFingerprint.ts`**

1. Add a helper function to safely read/write `localStorage` with a try-catch (it throws in blocked iframe contexts)
2. When `localStorage` is not available, generate the fingerprint in-memory on every page load -- it will still be consistent for the same browser session since `generateFingerprint()` uses deterministic browser properties (user agent, screen size, etc.)
3. The portal `SET_USER_ID` message will also store the ID in memory as a fallback

**Specific logic:**
```
function safeGetItem(key) {
  try { return localStorage.getItem(key); } 
  catch { return null; }
}

function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); } 
  catch { /* silently ignore */ }
}
```

Then replace all `localStorage.getItem(...)` and `localStorage.setItem(...)` calls with these safe versions. When localStorage is blocked, the fingerprint will still be generated from browser properties (which are deterministic per device), so tracking still works -- it just won't persist across full page reloads in the iframe.

### No other files need changes

The `useSessionTracker.ts` and `useAdminAnalytics.ts` already work correctly -- they just never received data because the fingerprint was empty.

### Technical Note

| Aspect | Before | After |
|--------|--------|-------|
| Direct visitors | Tracked | Tracked |
| Iframe visitors (localStorage blocked) | **Not tracked** (empty fingerprint) | **Tracked** (in-memory fingerprint) |
| Portal-identified users | Works if localStorage available | Works always |
| Fingerprint persistence | Across sessions via localStorage | Best-effort (in-memory fallback) |

