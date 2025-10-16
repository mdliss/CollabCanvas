# Layer Ordering Enhancements

## Overview
This document describes the comprehensive layer ordering and locking enhancements implemented in CollabCanvas, including bug fixes, batch operations, keyboard shortcuts, and toolbar integration.

## Issues Fixed

### 1. Lock Functionality Bug 🔒
**Problem:** The lock button in the Layers Panel (Shift+L) wasn't working at all.

**Root Cause:** Two issues were identified:
1. The `handleToggleLock` function was passing the entire `user` object to `tryLockShape` and `unlockShape`, but these functions expect only `user.uid` (a string).
2. The `staleLockSweeper` was being called with a default TTL of 5000ms, but locks were being set with an 8000ms TTL, causing locks to be swept away prematurely.

**Solution:**
- Fixed `handleToggleLock` to pass `user.uid` instead of `user`
- Updated `staleLockSweeper` calls to use `LOCK_TTL_MS` (8000ms) instead of the default 5000ms

**Files Modified:**
- `src/components/Canvas/Canvas.jsx` - Lines 941, 943, 1157, 1162

**Lock Behavior:**
- Locks now last for 8 seconds
- Only the user who locked a shape can unlock it
- Other users see a 🔒 icon and cannot modify locked shapes
- Locks automatically expire after 8 seconds or when the user leaves

## New Features

### 2. Batch Z-Index Operations 📦
**Feature:** Select multiple shapes and apply layer ordering operations to all of them at once.

**Implementation:**
All four z-index handlers now support batch operations:
- `handleBringToFront()` - Brings all selected shapes to the front
- `handleSendToBack()` - Sends all selected shapes to the back
- `handleBringForward()` - Moves all selected shapes forward one layer
- `handleSendBackward()` - Moves all selected shapes backward one layer

**Usage:**
1. Select multiple shapes (Shift+click or drag-select)
2. Use any of the following methods:
   - Click the layer order button (⬍) in the Layers Panel
   - Press keyboard shortcuts (Shift+[ or Shift+])
   - Click buttons in the right toolbar

**Feedback:**
- Single shape: "Brought to front"
- Multiple shapes: "Brought 3 shapes to front"

**Files Modified:**
- `src/components/Canvas/Canvas.jsx` - Lines 951-1037

### 3. Keyboard Shortcuts ⌨️
**Feature:** Quick keyboard shortcuts for common layer ordering operations.

**New Shortcuts:**
- **Shift + ]** - Bring selected shape(s) forward one layer
- **Shift + [** - Send selected shape(s) backward one layer

**Requirements:**
- At least one shape must be selected
- Works with both single and multiple shape selections
- Provides visual feedback via notification

**Implementation Details:**
```javascript
// Z-Index shortcuts (Shift + [ and Shift + ])
if (e.shiftKey && selectedIds.length > 0) {
  if (e.key === '[') {
    e.preventDefault();
    await handleSendBackward();
    return;
  } else if (e.key === ']') {
    e.preventDefault();
    await handleBringForward();
    return;
  }
}
```

**Files Modified:**
- `src/components/Canvas/Canvas.jsx` - Lines 329-340
- `src/components/UI/HelpMenu.jsx` - Lines 213-221

### 4. Toolbar Buttons 🎨
**Feature:** Visual buttons in the right-side toolbar for layer ordering operations.

**New Buttons Added:**
1. **⬆️ Bring to Front** - Moves shape(s) to topmost layer
2. **🔼 Bring Forward** - Moves shape(s) up one layer (Shift+])
3. **🔽 Send Backward** - Moves shape(s) down one layer (Shift+[)
4. **⬇️ Send to Back** - Moves shape(s) to bottommost layer

**Button Behavior:**
- Disabled (grayed out) when no shapes are selected
- Enabled when one or more shapes are selected
- Shows tooltip on hover with description and keyboard shortcut
- Visual feedback on click (scale animation)

**Visual Design:**
- Icons use emoji for clarity and consistency
- Positioned between Undo/Redo and Shape Tools
- Separated by dividers for organization
- Same styling as other toolbar buttons

**Files Modified:**
- `src/components/Canvas/ShapeToolbar.jsx` - Lines 6-17, 158-193
- `src/components/Canvas/Canvas.jsx` - Lines 1396-1400

## Technical Implementation

### Function Signatures

#### Z-Index Handlers (with batch support)
```javascript
const handleBringToFront = async (shapeId) => {
  // If shapeId is provided, use it; otherwise use selected shapes
  const shapeIds = shapeId ? [shapeId] : selectedIds;
  if (shapeIds.length === 0) return;
  
  // Process all shapes
  for (const id of shapeIds) {
    await bringToFront(CANVAS_ID, id, user);
  }
  // ... feedback
}
```

#### Backend Functions (unchanged)
```javascript
export const bringToFront = async (canvasId, shapeId, user) => {
  // Sets shape's zIndex to maxZIndex + 1
}

export const sendToBack = async (canvasId, shapeId, user) => {
  // Sets shape's zIndex to minZIndex - 1
}

export const bringForward = async (canvasId, shapeId, user) => {
  // Finds next higher zIndex and places shape above it
}

export const sendBackward = async (canvasId, shapeId, user) => {
  // Finds next lower zIndex and places shape below it
}
```

### Integration Points

1. **Layers Panel** - Already had layer ordering dropdown menu
2. **Keyboard Handler** - Added new shortcuts before shape creation keys
3. **Toolbar** - Added new buttons with proper state management
4. **Help Menu** - Added documentation for new shortcuts

## Usage Examples

### Example 1: Reorder Multiple Shapes via Keyboard
```
1. Create 5 rectangles
2. Shift+click to select rectangles 1, 3, and 5
3. Press Shift+] to bring them all forward
4. Result: All 3 shapes move up one layer
```

### Example 2: Send Group to Back via Toolbar
```
1. Select multiple shapes
2. Click the ⬇️ button in the right toolbar
3. All selected shapes move to the back
4. Feedback: "Sent 4 shapes to back"
```

### Example 3: Lock and Unlock Shapes
```
1. Press Shift+L to open Layers Panel
2. Click 🔓 next to a shape to lock it
3. Lock persists for 8 seconds
4. Click 🔒 to manually unlock
5. Other users cannot edit locked shapes
```

### Example 4: Layer Order in Layers Panel
```
1. Press Shift+L to open Layers Panel
2. Click ⬍ button next to any shape
3. Dropdown shows:
   - ⬆️ Bring to Front
   - 🔼 Bring Forward
   - 🔽 Send Backward
   - ⬇️ Send to Back
   - Z-Index: 42
4. Click any option to reorder
```

## Files Modified Summary

1. **src/components/Canvas/Canvas.jsx**
   - Fixed lock functionality (user.uid vs user object)
   - Fixed staleLockSweeper TTL mismatch
   - Enhanced z-index handlers to support batch operations
   - Added keyboard shortcuts for Shift+[ and Shift+]
   - Added toolbar prop passing for z-index handlers

2. **src/components/Canvas/ShapeToolbar.jsx**
   - Added four new z-index buttons
   - Added props for z-index handlers
   - Added hasSelection prop for button state
   - Added proper keyboard shortcut labels in tooltips

3. **src/components/UI/HelpMenu.jsx**
   - Added documentation for Shift+[ and Shift+] shortcuts

4. **src/services/canvas.js**
   - No changes (z-index functions already existed)

## Testing Checklist

- [x] Lock button works in Layers Panel
- [x] Locks persist for 8 seconds
- [x] Only lock owner can unlock
- [x] Batch z-index operations work with multiple shapes
- [x] Shift+] brings shapes forward
- [x] Shift+[ sends shapes backward
- [x] Toolbar buttons enabled/disabled based on selection
- [x] Toolbar buttons work correctly
- [x] All operations provide visual feedback
- [x] Help menu shows new shortcuts
- [x] No linting errors
- [x] All changes sync across users in real-time

## Known Behavior

### Lock Purpose
Locks serve two purposes:
1. **Automatic Locking**: When you grab/edit a shape, it's automatically locked for 8 seconds to prevent edit conflicts
2. **Manual Locking**: You can manually lock shapes via the Layers Panel to prevent others from editing them

### Batch Operation Order
When applying z-index operations to multiple shapes, they are processed sequentially in the order they were selected. This means the relative order between selected shapes is preserved.

### Z-Index Range
Z-index values can be negative or positive. The system automatically handles the full range without overflow concerns.

## Future Enhancements (Optional)

1. **Cmd/Ctrl Modifiers**: Add `Cmd+Shift+]` for "bring to front" and `Cmd+Shift+[` for "send to back"
2. **Context Menu**: Right-click on shapes to access layer ordering options
3. **Lock Duration Control**: Allow users to set custom lock durations
4. **Bulk Lock**: Lock multiple shapes at once
5. **Z-Index Compaction**: Periodically normalize z-index values to prevent extreme values

## Support

For questions or issues:
- Refer to the Help Menu (press H)
- Check `ZINDEX_LAYER_ORDERING.md` for z-index system details
- Review `src/components/Canvas/Canvas.jsx` for implementation details

