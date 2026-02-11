

# Plan: Track Active Users and Integrate Portal Student IDs via postMessage

## Problem

1. **Unique user count only tracks engaged users** - Currently, unique users are counted only from `video_likes` and `video_feedback` tables. A student who watches videos but never likes or leaves feedback is invisible in analytics.
2. **Browser fingerprints are unreliable** - Different browsers/devices generate different fingerprints for the same student, and same-device students get the same fingerprint.
3. **No way to identify students from the parent portal** - The portal knows who the student is, but Concept Capsule doesn't receive that identity.

## Solution

### 1. Accept Student ID via postMessage from Parent Portal

When Concept Capsule loads inside an iframe on your portal, the portal can send the student's userId using the browser's `postMessage` API. Concept Capsule will listen for this message and use it as the user identifier instead of the browser fingerprint.

**Your portal just needs to add this code:**
```javascript
// After the iframe loads
iframe.contentWindow.postMessage({ type: 'SET_USER_ID', userId: 'student123' }, '*');
```

### 2. New Database Table: `user_sessions`

Track every visit so we can count all users, not just those who like/comment.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_identifier | text | userId from portal OR browser fingerprint |
| source | text | "portal" or "fingerprint" |
| last_active_at | timestamptz | Updated on each visit/interaction |
| created_at | timestamptz | First visit |

### 3. Updated Admin Dashboard

- **Total Unique Users** card will count from `user_sessions` (all visitors, not just engaged ones)
- New **Active Users** card showing users active in the last 30 minutes
- Source badge showing whether user came from portal or direct access

## Technical Changes

### Step 1: Create `user_sessions` table
- Database migration to create the table with RLS policies (public insert/select, no auth required)

### Step 2: Update `useFingerprint.ts`
- Add a `postMessage` listener for `{ type: 'SET_USER_ID', userId: string }`
- If received, store the portal userId in localStorage and use it as the identifier
- Fall back to browser fingerprint if no postMessage is received
- Record/update a session in `user_sessions` table whenever the identifier is set

### Step 3: Create `useSessionTracker.ts` hook
- On app load, upsert a row in `user_sessions` with the current user identifier
- Update `last_active_at` periodically (every 5 minutes) to track "active" status

### Step 4: Update `useAdminAnalytics.ts`
- Fetch from `user_sessions` to get total unique users and currently active users
- Replace the fingerprint-only count with session-based count

### Step 5: Update `Admin.tsx`
- Add "Active Now" stat card (users active in last 30 min)
- Update "Total Unique Users" to use session data
- Show source breakdown (portal vs direct)

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create `user_sessions` table |
| `src/hooks/useFingerprint.ts` | Add postMessage listener for portal userId |
| `src/hooks/useSessionTracker.ts` | New hook to record/update sessions |
| `src/hooks/useAdminAnalytics.ts` | Fetch session data for user counts |
| `src/pages/Admin.tsx` | Add Active Users card, update Unique Users card |
| `src/pages/Watch.tsx` | Use session tracker hook |

