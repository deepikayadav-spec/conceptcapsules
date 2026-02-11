

# Add Active Users Over Time Graph

## Feasibility

Currently, the `user_sessions` table only stores the **most recent** activity timestamp per user (it gets overwritten every 5 minutes). This means there is no historical data to plot a graph from. To show "how many users were active at each point in time," we need to start recording activity snapshots.

**Key point**: The graph will start populating from the moment this is deployed. There will be no historical data before that.

## Approach

### 1. New Database Table: `activity_snapshots`

A lightweight table that logs a row every time a user's heartbeat fires (every 5 minutes). This gives us the raw data to count active users at any time window.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_identifier | text | The user (portal ID or fingerprint) |
| recorded_at | timestamptz | When this ping was recorded |

This table will grow over time. Each user generates ~12 rows/hour while active. For 100 concurrent users over a month, that is roughly 100 x 12 x 8 x 30 = ~288,000 rows -- very manageable.

### 2. Update `useSessionTracker.ts`

On each heartbeat (every 5 minutes), insert a row into `activity_snapshots` in addition to updating `user_sessions`.

### 3. Update `useAdminAnalytics.ts`

Add a new data field: `activityTimeline` -- an array of `{ time: string, activeUsers: number }` objects. This is computed by:
- Fetching recent snapshots (e.g., last 24 hours)
- Grouping them into time buckets (e.g., 30-minute intervals)
- Counting distinct `user_identifier` per bucket

### 4. Add Chart to `Admin.tsx`

Add an area/line chart (using Recharts, already installed) between the stats cards and the search bar. It will show active users on the Y-axis and time on the X-axis, with a toggle for time range (last 6h / 12h / 24h / 7d).

---

## Technical Details

### Database Migration

```sql
CREATE TABLE public.activity_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_snapshots_recorded_at ON public.activity_snapshots (recorded_at DESC);
CREATE INDEX idx_activity_snapshots_user ON public.activity_snapshots (user_identifier, recorded_at DESC);

ALTER TABLE public.activity_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert snapshots" ON public.activity_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view snapshots" ON public.activity_snapshots FOR SELECT USING (true);
```

### Files to Modify

| File | Change |
|------|--------|
| Database migration | Create `activity_snapshots` table |
| `src/hooks/useSessionTracker.ts` | Insert into `activity_snapshots` on each heartbeat |
| `src/hooks/useAdminAnalytics.ts` | Fetch snapshots, compute time-bucketed active user counts |
| `src/pages/Admin.tsx` | Add Recharts area chart with time range selector |

### Chart Design

- Area chart with a gradient fill under the line
- X-axis: time labels (e.g., "2:00 PM", "2:30 PM")
- Y-axis: number of unique active users
- Time range buttons: 6h, 12h, 24h, 7d
- Placed between the stats cards row and the search/filter bar
- Uses the existing Recharts library and chart UI components already in the project

