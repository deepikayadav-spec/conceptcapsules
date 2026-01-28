

# Plan: Align Navigation Buttons with Video Player

## Problem

Currently, the "Previous" and "Next" buttons are not centered relative to the video player. They're centered in the remaining space after the Feedback button takes its position on the right, causing a visual misalignment.

## Solution

Restructure the controls layout to:
1. Use absolute positioning for the Feedback button on the right
2. Center the Previous/Next buttons relative to the full container width

## Technical Changes

### File: `src/components/VideoPlayer.tsx`

**Modify the controls section (lines 632-672)**

Change from:
```tsx
<div className="flex items-center justify-between mt-4 shrink-0 flex-wrap">
  <div className="flex-1 flex items-center justify-center gap-3">
    <Button>Previous</Button>
    <Button>Next</Button>
  </div>
  <Button>Feedback</Button>  {/* Takes up space, shifts center */}
</div>
```

To:
```tsx
<div className="relative flex items-center justify-center mt-4 shrink-0">
  {/* Navigation buttons - truly centered */}
  <div className="flex items-center gap-3">
    <Button>Previous</Button>
    <Button>Next</Button>
  </div>
  
  {/* Feedback button - absolute positioned on right */}
  <Button className="absolute right-0">
    Feedback
  </Button>
</div>
```

## Result

- Previous and Next buttons will be centered relative to the container
- Feedback button stays on the right side, aligned below the "Up Next" card
- No changes to button styling or functionality

## File to Modify

| File | Changes |
|------|---------|
| `src/components/VideoPlayer.tsx` | Restructure controls section to use relative/absolute positioning |

