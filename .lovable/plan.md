
# Plan: Fill Feedback Button with Light Teal Background

## Change

Update the Feedback button to have the light teal shade (`#E6F6F5`) as the default background color instead of transparent.

## Technical Details

### File: `src/components/VideoPlayer.tsx`

**Line 661 - Change the button className:**

| Property | Current | New |
|----------|---------|-----|
| Background | `bg-transparent` | `bg-[#E6F6F5]` |
| Hover Background | `hover:bg-[#E6F6F5]` | `hover:bg-[#D0EDEB]` (slightly darker for hover feedback) |

The updated className will be:
```tsx
className={`absolute right-0 rounded-xl gap-2 border-[#5FBDB8] text-[#2E8F8A] bg-[#E6F6F5] hover:bg-[#D0EDEB] hover:border-[#5FBDB8] cursor-pointer ${isFullscreen ? 'text-base px-5 py-2.5' : ''}`}
```

## Result

- Button will have a soft light teal fill by default
- Hover state will darken slightly to provide visual feedback
- Border and text colors remain unchanged (`#5FBDB8` and `#2E8F8A`)
- Button still appears secondary/optional compared to primary solid CTAs

## File to Modify

| File | Change |
|------|--------|
| `src/components/VideoPlayer.tsx` | Update line 661: change `bg-transparent` to `bg-[#E6F6F5]` and adjust hover state |
