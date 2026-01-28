

# Plan: Enhanced Rating Tracking in Admin Dashboard

## Current Situation

Your database is correctly storing all individual ratings. Currently you have:
- 4 total ratings from 2 unique users
- Each rating is stored with the user fingerprint, rating value, and timestamp

The admin dashboard shows aggregated data (average rating, count) but doesn't display the breakdown showing each individual rating.

## What We'll Build

### 1. Rating Distribution Display

For each video, show a visual breakdown of how ratings are distributed:

```text
+--------------------------------------------------+
| Python_Byte_8                                    |
| ★★★★★ ████████████ 2 (100%)                      |
| ★★★★☆ ░░░░░░░░░░░░ 0 (0%)                        |
| ★★★☆☆ ░░░░░░░░░░░░ 0 (0%)                        |
| ★★☆☆☆ ░░░░░░░░░░░░ 0 (0%)                        |
| ★☆☆☆☆ ░░░░░░░░░░░░ 0 (0%)                        |
+--------------------------------------------------+
```

### 2. Expandable Rating Details

Add an expandable row in the main table that shows:
- Each individual rating with timestamp
- User fingerprint (anonymized like "User #1", "User #2")
- Date/time of rating
- Any comment left with the rating

### 3. All Ratings Section

Add a new "All Ratings" card that shows every rating (not just ones with comments):
- Video name
- Star rating (visual stars)
- User fingerprint
- Timestamp
- Comment (if any)

## Technical Changes

### File: `src/hooks/useAdminAnalytics.ts`

Update the `VideoFeedback` interface to include user fingerprints:

```typescript
interface VideoFeedback {
  byte_id: string;
  count: number;
  avgRating: number;
  ratingDistribution: { [key: number]: number }; // New: count per star
  comments: Array<{
    rating: number;
    comment: string | null;
    created_at: string;
    user_fingerprint: string;  // New: track who rated
  }>;
}
```

Update the aggregation logic to:
- Include `user_fingerprint` in the comments array
- Calculate rating distribution (count of 1-star, 2-star, etc.)

### File: `src/pages/Admin.tsx`

Add UI components:

1. **Collapsible row details** - Click a video row to expand and see all individual ratings

2. **Rating distribution bars** - Visual progress bars showing how many users gave each star rating

3. **"All Ratings" section** - Replace/enhance "Recent Comments" to show all ratings, not just those with text comments

## Summary of Changes

| File | Changes |
|------|---------|
| `src/hooks/useAdminAnalytics.ts` | Add user fingerprint to feedback data, add rating distribution calculation |
| `src/pages/Admin.tsx` | Add expandable row details, rating distribution visualization, all ratings section |

## Benefits

- See exactly how many users gave each star rating
- Track individual feedback with timestamps
- Identify patterns in user engagement
- Export includes all rating details

