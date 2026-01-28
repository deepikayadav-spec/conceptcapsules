

# Plan: Improve Video Action Button Text Visibility

## Problem

The text labels below the Like and Rate buttons (showing the count and "Rate"/"Sent" text) are hard to read because:
1. **Font size is too small** - Currently using `text-xs` (12px)
2. **Insufficient text shadow** - Only using `drop-shadow-md` which doesn't provide enough contrast against varying video backgrounds
3. **No background** - Text floats directly on video content without a backing

## Solution

Enhance the text visibility with these styling improvements:

### Changes to `src/components/VideoActions.tsx`

| Current | Improved |
|---------|----------|
| `text-xs` (12px) | `text-sm` (14px) |
| `drop-shadow-md` | Multi-layer text shadow for better contrast |
| No background | Add subtle semi-transparent pill background |

### Specific Updates

**Line 65-66 (Like count text):**
```jsx
// Before
<span className="text-xs font-semibold text-white drop-shadow-md">

// After  
<span className="text-sm font-bold text-white px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm"
  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
```

**Line 90-91 (Rate/Sent text):**
```jsx
// Before
<span className="text-xs font-semibold text-white drop-shadow-md">

// After
<span className="text-sm font-bold text-white px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm"
  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
```

## Visual Result

The text will have:
- **Larger font** (14px instead of 12px)
- **Bolder weight** for better readability
- **Semi-transparent dark pill background** that ensures contrast on any video
- **Multi-layer text shadow** for additional depth
- **Backdrop blur** for a modern glass effect

## File to Modify

| File | Changes |
|------|---------|
| `src/components/VideoActions.tsx` | Update text styling on lines 65 and 90 |

