# Z-Index and Layer Ordering System

## Overview
This document describes the z-index and layer ordering system implemented in CollabCanvas. The system allows users to control the stacking order of shapes on the canvas through both the Layers Panel and programmatically.

## Features Implemented

### 1. Lock Functionality Fix
**Problem:** Lock button in Layers Panel wasn't working because the entire `user` object was being passed instead of just `user.uid`.

**Solution:** 
```javascript
// Before (broken):
await unlockShape(CANVAS_ID, shapeId, user);
await tryLockShape(CANVAS_ID, shapeId, user, LOCK_TTL_MS);

// After (fixed):
await unlockShape(CANVAS_ID, shapeId, user.uid);
await tryLockShape(CANVAS_ID, shapeId, user.uid, LOCK_TTL_MS);
```

**Location:** `src/components/Canvas/Canvas.jsx` - `handleToggleLock` function

### 2. Automatic Z-Index Assignment
Every shape now automatically receives a z-index when created. The z-index is calculated as `maxZIndex + 1`, ensuring new shapes appear on top of existing ones.

**Implementation:** `src/services/canvas.js` - `createShape` function
```javascript
// Calculate z-index: either use provided value or set to max + 1
const maxZIndex = currentShapes.reduce((max, s) => Math.max(max, s.zIndex || 0), 0);
const zIndex = shapeData.zIndex !== undefined ? shapeData.zIndex : maxZIndex + 1;
```

### 3. Z-Index Management Functions
Four new functions added to `src/services/canvas.js`:

#### `bringToFront(canvasId, shapeId, user)`
Brings the shape to the very top layer by setting its z-index to `maxZIndex + 1`.

#### `sendToBack(canvasId, shapeId, user)`
Sends the shape to the very bottom layer by setting its z-index to `minZIndex - 1`.

#### `bringForward(canvasId, shapeId, user)`
Moves the shape one layer up by finding the next higher z-index and setting the shape's z-index above it.

#### `sendBackward(canvasId, shapeId, user)`
Moves the shape one layer down by finding the next lower z-index and setting the shape's z-index below it.

### 4. Layer Ordering in Layers Panel
The Layers Panel now includes a comprehensive layer ordering control system:

#### UI Components:
- **Layer Order Button (⬍):** Opens a dropdown menu with layer ordering options
- **Dropdown Menu:** Contains four ordering options:
  - ⬆️ Bring to Front
  - 🔼 Bring Forward
  - 🔽 Send Backward
  - ⬇️ Send to Back
- **Z-Index Display:** Shows the current z-index value of each shape

#### Features:
- Click-outside-to-close functionality
- Hover states for better UX
- Visual feedback for each action
- Real-time z-index display

**Location:** `src/components/UI/LayersPanel.jsx`

### 5. Shape Rendering Order
Shapes are rendered in the correct z-index order on the canvas. Lower z-index values appear behind higher values.

**Implementation:** `src/components/Canvas/Canvas.jsx`
```javascript
{shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(shape => {
  // ... render shape
})}
```

## How to Use

### Via Layers Panel (Shift + L)
1. Press `Shift + L` to open the Layers Panel
2. Find the shape you want to reorder
3. Click the layer order button (⬍) next to the shape
4. Select the desired ordering action from the dropdown menu:
   - **Bring to Front:** Move to the topmost layer
   - **Bring Forward:** Move up one layer
   - **Send Backward:** Move down one layer
   - **Send to Back:** Move to the bottommost layer
5. The z-index value is displayed at the bottom of the dropdown

### Via Lock Button (Now Fixed!)
1. Press `Shift + L` to open the Layers Panel
2. Click the lock icon (🔒/🔓) to lock/unlock a shape
3. Locked shapes cannot be edited by other users
4. Only the user who locked the shape can unlock it

## Technical Details

### Data Structure
Each shape now includes a `zIndex` property:
```javascript
{
  id: "shape_123",
  type: "rectangle",
  x: 100,
  y: 100,
  zIndex: 5,
  // ... other properties
}
```

### Z-Index Behavior
- **New Shapes:** Automatically get `maxZIndex + 1`
- **Copied Shapes:** Maintain relative z-index order, placed above existing shapes
- **Layer Operations:** Update z-index in Firestore with proper transaction handling
- **Rendering:** Shapes are sorted by z-index before rendering

### Firestore Integration
All z-index changes are:
- ✅ Saved to Firestore
- ✅ Synchronized across all users in real-time
- ✅ Handled with transactions to prevent conflicts
- ✅ Include `lastModifiedBy` and `lastModifiedAt` metadata

## Files Modified

1. **src/services/canvas.js**
   - Updated `createShape` to auto-assign z-index
   - Added `bringToFront`, `sendToBack`, `bringForward`, `sendBackward` functions

2. **src/components/Canvas/Canvas.jsx**
   - Fixed `handleToggleLock` to pass `user.uid` instead of `user`
   - Added handlers: `handleBringToFront`, `handleSendToBack`, `handleBringForward`, `handleSendBackward`
   - Updated LayersPanel props to include z-index handlers

3. **src/components/UI/LayersPanel.jsx**
   - Added z-index menu dropdown with all ordering options
   - Added click-outside-to-close functionality
   - Added z-index display
   - Added proper hover states and visual feedback

## Testing Checklist

- [x] Create multiple shapes and verify auto z-index assignment
- [x] Test "Bring to Front" - shape appears on top
- [x] Test "Send to Back" - shape appears behind all others
- [x] Test "Bring Forward" - shape moves up one layer
- [x] Test "Send Backward" - shape moves down one layer
- [x] Verify z-index persists after page reload
- [x] Verify z-index syncs across multiple users
- [x] Test lock/unlock functionality works correctly
- [x] Verify locked shapes cannot be edited by other users
- [x] Check that z-index menu closes when clicking outside
- [x] Verify visual feedback (hover states, current z-index display)

## Known Limitations

None at this time. All requested features have been implemented and tested.

## Future Enhancements (Optional)

1. **Keyboard Shortcuts:** Add shortcuts like `Ctrl+]` for bring forward, `Ctrl+[` for send backward
2. **Batch Operations:** Allow reordering multiple selected shapes at once
3. **Drag-to-Reorder:** Drag shapes in the Layers Panel to change their order
4. **Z-Index Normalization:** Periodically normalize z-index values to prevent overflow with thousands of operations

## Support

For questions or issues related to layer ordering, please refer to:
- This documentation
- `src/services/canvas.js` for z-index function implementations
- `src/components/UI/LayersPanel.jsx` for UI implementation

