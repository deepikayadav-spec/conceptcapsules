

# Plan: Move Feedback Button Below "Up Next" Card

## Current State

Currently, the layout is:
```
+----------------------------------+
|           Video Player           |
|                                  |
|                    [Up Next Card]|  <- bottom-right corner INSIDE video
+----------------------------------+
   [ Previous ]  [ Next ]  [ Feedback ]  <- centered controls below video
```

## Proposed Layout

The new layout will place the Feedback button on the right side, directly below the "Up Next" card:

```
+----------------------------------+
|           Video Player           |
|                                  |
|                    [Up Next Card]|  <- stays at bottom-right INSIDE video
+----------------------------------+
   [ Previous ]  [ Next ]          [Feedback]  <- Feedback moves to right side
```

## Technical Changes

### File: `src/components/VideoPlayer.tsx`

**1. Restructure the controls section (lines 632-669)**

Change from a single centered flex container to a flex container with space-between:

```tsx
// Before (lines 632-669):
<div className="flex items-center justify-center mt-4 gap-3 shrink-0 flex-wrap">
  <Button ... >Previous</Button>
  <Button ... >Next</Button>
  <Button ... >Feedback</Button>  {/* Currently inline with nav buttons */}
</div>

// After:
<div className="flex items-center justify-between mt-4 shrink-0 flex-wrap">
  {/* Left side: Navigation buttons (centered in their space) */}
  <div className="flex-1 flex items-center justify-center gap-3">
    <Button ... >Previous</Button>
    <Button ... >Next</Button>
  </div>
  
  {/* Right side: Feedback button (aligned to right edge) */}
  <Button
    variant="outline"
    asChild
    className={`rounded-xl gap-2 ${isFullscreen ? 'text-base px-5 py-2.5' : ''}`}
  >
    <a href="https://forms.gle/kpUYadq1GziygP8B7" target="_blank" rel="noopener noreferrer">
      <ExternalLink className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className="hidden sm:inline">Feedback</span>
    </a>
  </Button>
</div>
```

## Visual Alignment

This approach ensures:
- The "Previous" and "Next" buttons remain centered in the available space
- The "Feedback" button aligns to the right edge, directly below where the "Up Next" card appears
- Consistent spacing and responsive behavior

## File to Modify

| File | Changes |
|------|---------|
| `src/components/VideoPlayer.tsx` | Restructure controls section to use `justify-between` with nested flex containers |

