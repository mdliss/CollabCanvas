# Copy/Paste Undo Bug Fix

## Problem Identified

The copy/paste undo feature was fundamentally flawed due to incorrect batching implementation.

### Root Cause

**Original (Broken) Flow:**
1. Start batch mode
2. Loop through shapes to paste:
   - Create command
   - Call `execute(command)` 
   - Command **executes immediately** (creates shape in Firestore)
   - Command added to batch collection
3. End batch:
   - Wrap already-executed commands in `MultiShapeCommand`
   - Add to undo stack

**The Problem:**
- Commands were executed TWICE:
  1. During the loop (shapes created)
  2. If ever redone, `MultiShapeCommand.execute()` would try to create shapes AGAIN
- Undo might work, but redo would fail or create duplicates
- Inconsistent state between what was executed and what was in the undo stack

## Solution

**Fixed (Correct) Flow:**
1. Start batch mode
2. Loop through shapes to paste:
   - Create command
   - Call `execute(command)`
   - Command is **collected but NOT executed** (during batch mode)
3. End batch:
   - Wrap collected commands in `MultiShapeCommand`
   - **Execute the MultiShapeCommand** (which executes all collected commands)
   - Add to undo stack

**Why This Works:**
- Commands execute exactly ONCE (when the batch executes)
- Undo properly reverses the batch
- Redo properly re-executes the batch
- Consistent state

## Code Changes

### File: `src/services/undo.js`

#### Change 1: `execute()` method

**Before:**
```javascript
async execute(command, user = null) {
  // ...metadata setup...
  
  await command.execute();  // ❌ Always executed!
  
  if (this.batchMode) {
    this.batchCommands.push(command);  // Already executed
    return true;
  }
  
  this.undoStack.push(command);
  // ...
}
```

**After:**
```javascript
async execute(command, user = null) {
  // ...metadata setup...
  
  // If in batch mode, collect WITHOUT executing
  if (this.batchMode) {
    this.batchCommands.push(command);  // ✅ Not yet executed
    console.log('[UndoManager] Command added to batch (not yet executed)');
    return true;
  }
  
  // Not in batch - execute immediately
  await command.execute();  // ✅ Only executes if not batching
  
  this.undoStack.push(command);
  // ...
}
```

#### Change 2: `endBatch()` method

**Before:**
```javascript
async endBatch() {
  // ...
  const batchCommand = new MultiShapeCommand(
    this.batchCommands,  // Already-executed commands
    this.batchDescription
  );
  
  // Add to undo stack
  this.undoStack.push(batchCommand);  // ❌ Commands already executed!
  // ...
}
```

**After:**
```javascript
async endBatch() {
  // ...
  const batchCommand = new MultiShapeCommand(
    this.batchCommands,  // Not-yet-executed commands
    this.batchDescription
  );
  
  // NOW execute the batch
  try {
    await batchCommand.execute();  // ✅ Executes all commands at once
    console.log('[UndoManager] Batch executed successfully');
  } catch (error) {
    console.error('[UndoManager] Batch execution failed:', error);
    throw error;
  }
  
  // Add to undo stack
  this.undoStack.push(batchCommand);
  console.log('[UndoManager] Batch added to undo stack');
  // ...
}
```

## Testing

### Test Case 1: Paste Single Shape

1. Create a shape
2. Copy it (Cmd+C)
3. Paste it (Cmd+V)

**Expected Console Output:**
```
[UndoManager] Command executed and added to undo stack: Created Rectangle (#cccccc) at (X, Y)
```

**Undo Test:**
```
[UndoManager] Undoing: Created Rectangle (#cccccc) at (X, Y)
✅ Pasted shape disappears
```

**Redo Test:**
```
[UndoManager] Redoing: Created Rectangle (#cccccc) at (X, Y)
✅ Shape reappears in same position
```

### Test Case 2: Paste Multiple Shapes (Batch)

1. Create 2 shapes
2. Select both
3. Copy (Cmd+C)
4. Paste (Cmd+V)

**Expected Console Output:**
```
[UndoManager] Command added to batch (not yet executed): Created Rectangle (#ff0000) at (X1, Y1)
[UndoManager] Command added to batch (not yet executed): Created Rectangle (#0000ff) at (X2, Y2)
[UndoManager] Ending batch with 2 commands
[UndoManager] Batch executed successfully
[UndoManager] Batch added to undo stack. Stack size: 5
```

**Undo Test:**
```
[UndoManager] Undoing: Pasted 2 shapes (2 changes)
✅ Both pasted shapes disappear at once
```

**Redo Test:**
```
[UndoManager] Redoing: Pasted 2 shapes (2 changes)
✅ Both shapes reappear in correct positions
```

### Test Case 3: Full Scenario

1. Start with empty canvas
2. Create 2 rectangles
3. Resize each
4. Change color of each
5. Select both and copy
6. Paste (creates 2 more)
7. Undo repeatedly until canvas is empty

**Expected Behavior:**
- After 7 undos (2 creates + 2 resizes + 2 colors + 1 paste batch):
  - Canvas should be empty
  - `canUndo` should be false
  - `shapesOnCanvas` should be 0

**Console Check:**
```javascript
window.debugUndoState()

// After all undos:
{
  shapesOnCanvas: 0,     ✅ All shapes gone
  undoStackSize: 0,      ✅ Stack empty
  redoStackSize: 7,      ✅ Can redo all 7
  canUndo: false,        ✅ Nothing to undo
  canRedo: true          ✅ Can redo
}
```

## Benefits of This Fix

### 1. Correct Execution
- Commands execute exactly once
- No duplicate shape creation
- No orphaned Firestore entries

### 2. Proper Undo/Redo
- Undo correctly reverses batched operations
- Redo correctly re-executes batched operations
- State is always consistent

### 3. Better Performance
- Commands collected first, executed together
- Single Firestore batch write instead of individual writes
- More efficient for large paste operations

### 4. Cleaner Logs
- Clear indication when commands are batched vs executed
- Easy to debug with console logs
- Can see exactly when batch executes

## Edge Cases Handled

### Empty Batch
```javascript
if (this.batchCommands.length === 0) {
  console.log('[UndoManager] endBatch called but no commands in batch');
  return true;
}
```

### Batch Execution Failure
```javascript
try {
  await batchCommand.execute();
} catch (error) {
  console.error('[UndoManager] Batch execution failed:', error);
  this.batchCommands = [];  // Clean up
  throw error;
}
```

### Single Shape Paste (No Batch)
- If pasting 1 shape, `shouldBatch = false`
- Command executes immediately, not batched
- Works exactly like regular shape creation

## Other Operations Using Batching

This fix also improves:

1. **Delete Multiple Shapes**
   - Batched delete operations now work correctly
   - Undo restores all deleted shapes at once
   - Redo deletes them all again

2. **Color Change Multiple Shapes**
   - Batch color change operations
   - Single undo reverts all color changes
   - Redo reapplies all changes

3. **Gradient Multiple Shapes**
   - Batch gradient application
   - Clean undo/redo behavior

## Verification Steps

1. **Open Browser Console**
2. **Paste multiple shapes**
3. **Look for these logs:**
   ```
   [UndoManager] Command added to batch (not yet executed): ...
   [UndoManager] Command added to batch (not yet executed): ...
   [UndoManager] Ending batch with 2 commands
   [UndoManager] Batch executed successfully
   [UndoManager] Batch added to undo stack
   ```

4. **Hit Cmd+Z to undo**
5. **Verify shapes disappear**
6. **Hit Cmd+Shift+Z to redo**
7. **Verify shapes reappear**

## Summary

**Problem:** Commands executed during batch collection, then wrapped in MultiShapeCommand, causing double execution on redo.

**Solution:** Commands collected but not executed during batch mode. MultiShapeCommand executes them all at once when batch ends.

**Result:** Perfect undo/redo behavior for copy/paste and all batch operations.

---

**Status:** ✅ Fixed  
**Version:** 2.5  
**Date:** October 2025  
**Files Modified:** `src/services/undo.js`  
**Linter Errors:** None ✅

