
# Plan: Add Google Form Feedback Button Below "Up Next" Card

## Placement

Based on your preference, the feedback button will be placed in the **controls area below the "Up Next" card**, next to the "Previous" and "Next" buttons. This is the natural location since:
- It's in the same visual row as navigation controls
- It doesn't obstruct video content
- It's easily accessible after watching a video

## Visual Design

The button will:
- Match the existing "Previous" / "Next" button styling (`variant="outline"`, `rounded-xl`)
- Include an icon (`ExternalLink` or `MessageSquarePlus`) with "Feedback" text
- Open the Google Form in a new tab

## Technical Changes

### File: `src/components/VideoPlayer.tsx`

**1. Add new import:**
```tsx
import { ExternalLink } from 'lucide-react';
```

**2. Add Feedback button to the controls section (around line 632):**

The controls section will change from:
```tsx
<div className="flex items-center justify-center mt-4 gap-3 shrink-0 flex-wrap">
  <Button ... >Previous</Button>
  <Button ... >Next</Button>
</div>
```

To:
```tsx
<div className="flex items-center justify-center mt-4 gap-3 shrink-0 flex-wrap">
  <Button ... >Previous</Button>
  <Button ... >Next</Button>
  
  {/* Feedback button - opens Google Form */}
  <Button
    variant="outline"
    asChild
    className={`rounded-xl gap-2 ${isFullscreen ? 'text-base px-5 py-2.5' : ''}`}
  >
    <a 
      href="https://forms.gle/kpUYadq1GziygP8B7" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <ExternalLink className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className="hidden sm:inline">Feedback</span>
    </a>
  </Button>
</div>
```

## Result

The controls area will now show:
```
[ ← Previous ]  [ Next → ]  [ ↗ Feedback ]
```

All three buttons will have consistent styling and the feedback button will open your Google Form in a new tab when clicked.

## File to Modify

| File | Change |
|------|--------|
| `src/components/VideoPlayer.tsx` | Add `ExternalLink` import, add Feedback button in controls section |
