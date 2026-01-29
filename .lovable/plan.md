
# Plan: Fix Feedback Button Visibility in Dark Mode

## Problem

The Feedback button uses hardcoded light teal colors that work in light mode but cause visibility issues in dark mode:
- Current background: `#E6F6F5` (light teal) - too bright in dark mode
- Current hover: `#D0EDEB` (light teal) - still too bright
- Current text: `#2E8F8A` (dark teal) - becomes invisible against light backgrounds in dark mode

## Solution

Replace hardcoded colors with theme-aware Tailwind CSS classes that adapt to light/dark mode, matching the left panel's styling approach.

## Technical Details

### File: `src/components/VideoPlayer.tsx`

**Line 661 - Update the button className:**

| Property | Current (Broken) | New (Theme-Aware) |
|----------|------------------|-------------------|
| Background | `bg-[#E6F6F5]` | `bg-accent` |
| Hover Background | `hover:bg-[#D0EDEB]` | `hover:bg-accent/80` |
| Border | `border-[#5FBDB8]` | `border-primary/50` |
| Hover Border | `hover:border-[#5FBDB8]` | `hover:border-primary` |
| Text | `text-[#2E8F8A]` | `text-primary` |

**Also update the anchor and icon classes (lines 667-669):**
- Change `className="text-[#2E8F8A]"` on anchor to `className="text-primary"`
- Change `text-[#2E8F8A]` on ExternalLink icon to `text-primary`

### CSS Variable Values

These Tailwind classes use the theme-aware CSS variables:

**Light Mode:**
- `accent`: `hsl(174 72% 90%)` - light teal background
- `primary`: `hsl(174 72% 40%)` - teal text/border

**Dark Mode:**
- `accent`: `hsl(174 72% 20%)` - dark teal background (readable)
- `primary`: `hsl(174 72% 50%)` - bright teal text/border (visible)

## Result

- Button automatically adapts to light and dark mode
- Text remains visible in both themes
- Styling matches the teal accent colors used elsewhere in the app
- Maintains the same visual hierarchy (secondary/optional button appearance)

## File to Modify

| File | Change |
|------|--------|
| `src/components/VideoPlayer.tsx` | Update lines 661-669: Replace hardcoded hex colors with theme-aware Tailwind classes |
