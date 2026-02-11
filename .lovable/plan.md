

# Fix: Active Users and Total Unique Users Showing 0

## Root Cause

Two issues are causing the numbers to drop to 0:

1. **Session table is empty**: The `useSessionTracker` hook only runs on the `/watch` page. Since the table was just created, no one has visited `/watch` yet, so there are 0 session records.

2. **Broken fallback logic**: When the session query succeeds but returns an empty array, the code uses `sessionsData.length = 0` instead of falling back to the old method of counting unique users from likes and feedback data. The fallback only triggers on a database error, not on empty results.

## Changes

### 1. Fix fallback in `useAdminAnalytics.ts`

Update the condition so that when `sessionsData` is empty, it falls back to counting unique users from likes + feedback (the old working method). Also combine both data sources: use session data when available, but always include users from engagement data too.

**Current (broken):**
```typescript
if (!sessionsError && sessionsData) {
  totalUniqueUsers = sessionsData.length;  // 0 when empty
  ...
} else {
  // Only runs on error, never on empty results
  const allUniqueUsers = new Set([...uniqueUsersFromLikes, ...uniqueUsersFromFeedback]);
  totalUniqueUsers = allUniqueUsers.size;
}
```

**Fixed:**
```typescript
if (!sessionsError && sessionsData && sessionsData.length > 0) {
  // Use session data, but also merge in engagement-only users
  const sessionIdentifiers = new Set(sessionsData.map(s => s.user_identifier));
  const engagementUsers = new Set([...uniqueUsersFromLikes, ...uniqueUsersFromFeedback]);
  const allUsers = new Set([...sessionIdentifiers, ...engagementUsers]);
  totalUniqueUsers = allUsers.size;
  // ... active/portal/direct counts from sessions
} else {
  // Fallback: count from engagement data
  const allUniqueUsers = new Set([...uniqueUsersFromLikes, ...uniqueUsersFromFeedback]);
  totalUniqueUsers = allUniqueUsers.size;
}
```

### 2. Add session tracking to more pages

Currently `useSessionTracker()` only runs on the Watch page. Add it to the main app entry point so every visitor is tracked regardless of which page they land on.

| File | Change |
|------|--------|
| `src/hooks/useAdminAnalytics.ts` | Fix fallback logic to handle empty session data and merge engagement users |
| `src/App.tsx` | Add `useSessionTracker()` at app level so all visitors are tracked |

