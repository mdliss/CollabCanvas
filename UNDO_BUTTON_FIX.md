# Undo/Redo Button Icon Fix

## Issue
The undo/redo buttons in the toolbar are present (hover works, tooltips show), but the icons aren't rendering.

## Attempted Icons (in order)
1. ↶ / ↷ (curved arrows) - **Not rendering**
2. ⟲ / ⟳ (circular arrows) - **Not rendering**
3. ↩ / ↪ (return arrows) - **Current attempt**

## If current icons still don't work:

### Option 1: Use Emoji (Most reliable)
```javascript
icon: '⬅️'  // Undo
icon: '➡️'  // Redo
```

### Option 2: Use Text Labels
```javascript
icon: 'Undo'
icon: 'Redo'
```

### Option 3: Use Simple Characters
```javascript
icon: '<-'  // Undo
icon: '->'  // Redo
```

### Option 4: Use Different Unicode
```javascript
icon: '◄'  // Undo
icon: '►'  // Redo
```

### Option 5: Render SVG Icons (Most complex but guaranteed)
```javascript
// Instead of icon as string, render an SVG component
<svg width="20" height="20" viewBox="0 0 20 20">
  <path d="M10 5 L5 10 L10 15" stroke="currentColor" fill="none" strokeWidth="2"/>
</svg>
```

## To Apply Alternative Icons:
Edit `/Users/max/CollabCanvas/src/components/Canvas/ShapeToolbar.jsx` line 131 and 140 to change the `icon` property.

