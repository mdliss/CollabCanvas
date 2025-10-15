# Batching Guide for History Operations

## Overview

The CollabCanvas history system supports batching multiple operations into a single history entry. This is useful when you perform multiple related changes that should be treated as one atomic operation for undo/redo purposes.

## When to Use Batching

Use batching when you:
- Create or modify multiple shapes at once
- Apply the same property change to multiple selected shapes
- Perform complex multi-step operations that should be undone as a single unit
- Want to keep the history clean and prevent hundreds of individual entries

## How to Use Batching

### Method 1: Using the UndoContext Hook

```javascript
import { useUndo } from '../contexts/UndoContext';
import { UpdateShapeCommand } from '../utils/commands';

function YourComponent() {
  const { startBatch, endBatch, execute } = useUndo();
  const { user } = useAuth();

  const changeColorForMultipleShapes = async (shapeIds, newColor) => {
    // Start a batch operation
    startBatch(`Changed color to ${newColor} for ${shapeIds.length} shapes`);

    // Execute multiple commands - they will be collected
    for (const shapeId of shapeIds) {
      const shape = shapes.find(s => s.id === shapeId);
      const command = new UpdateShapeCommand(
        canvasId,
        shapeId,
        { fill: newColor },
        { fill: shape.fill },
        user,
        updateShapeInFirestore
      );
      await execute(command, user);
    }

    // End the batch - creates one history entry
    await endBatch();
  };
}
```

### Method 2: Using MultiShapeCommand Directly

```javascript
import { MultiShapeCommand, CreateShapeCommand } from '../utils/commands';
import { useUndo } from '../contexts/UndoContext';

function YourComponent() {
  const { execute } = useUndo();
  const { user } = useAuth();

  const createMultipleShapes = async (shapesData) => {
    // Create individual commands
    const commands = shapesData.map(shapeData => 
      new CreateShapeCommand(
        canvasId,
        shapeData,
        user,
        createShapeInFirestore,
        deleteShapeFromFirestore
      )
    );

    // Wrap them in a MultiShapeCommand
    const batchCommand = new MultiShapeCommand(
      commands,
      `Created ${commands.length} shapes`
    );

    // Execute the batch as a single operation
    await execute(batchCommand, user);
  };
}
```

## Example: Batch Operations in Canvas

Here's a real-world example of how to implement batch color changes:

```javascript
import { useUndo } from '../contexts/UndoContext';
import { useAuth } from '../contexts/AuthContext';
import { UpdateShapeCommand } from '../utils/commands';
import { updateShape } from '../services/canvas';

export function CanvasComponent({ canvasId, selectedShapes, shapes }) {
  const { startBatch, endBatch, execute } = useUndo();
  const { user } = useAuth();

  const handleBulkColorChange = async (newColor) => {
    if (selectedShapes.length === 0) return;

    // Start batching
    startBatch(`Changed color for ${selectedShapes.length} shapes`);

    try {
      // Apply color to each selected shape
      for (const shapeId of selectedShapes) {
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) continue;

        const command = new UpdateShapeCommand(
          canvasId,
          shapeId,
          { fill: newColor },
          { fill: shape.fill },
          user,
          updateShape
        );

        await execute(command, user);
      }

      // End batch - creates single history entry
      await endBatch();

      console.log(`Successfully batched ${selectedShapes.length} color changes`);
    } catch (error) {
      console.error('Batch operation failed:', error);
      // The batch will still be committed even if some operations fail
      await endBatch();
    }
  };

  return (
    <ColorPicker onColorChange={handleBulkColorChange} />
  );
}
```

## Benefits of Batching

1. **Cleaner History**: 500 shape color changes become 1 history entry instead of 500
2. **Better Performance**: Single undo operation instead of pressing undo 500 times
3. **User Experience**: More intuitive - "undo color change" vs "undo... undo... undo..."
4. **Memory Efficient**: Reduces the size of the history stack

## Important Notes

- Always call `endBatch()` even if operations fail (use try/finally)
- Batch descriptions should be descriptive: "Changed 5 shapes to red" not "Batch operation"
- The history limit is 1000 entries - batching helps you stay within this limit
- All commands in a batch should be related operations
- Commands in a batch execute sequentially, not in parallel
- If a batch is started but not ended, it will remain open until `endBatch()` is called

## Advanced: Nested Batching

The system does not currently support nested batching. If you start a new batch while one is already open, the first batch will be implicitly ended.

```javascript
// ❌ Don't do this
startBatch('Outer batch');
startBatch('Inner batch'); // This will end the outer batch
endBatch(); // Ends inner batch only

// ✅ Do this instead
startBatch('Complete operation');
// ... all operations ...
endBatch();
```

## Testing Your Batch Operations

You can verify batching is working by:

1. Opening the History Timeline (bottom-left of canvas)
2. Performing a batch operation
3. Checking that only 1 entry appears instead of multiple
4. Clicking undo - all changes should revert at once

## API Reference

### `startBatch(description: string)`
Begins collecting commands into a batch.

**Parameters:**
- `description`: A user-friendly description of what the batch does

### `endBatch(): Promise<boolean>`
Ends the current batch and creates a single history entry.

**Returns:** Promise that resolves to `true` if successful

### `MultiShapeCommand`
A command that wraps multiple commands into one.

**Constructor:**
- `commands`: Array of Command objects
- `description`: User-friendly description of the batch operation

## Questions?

For issues or questions about batching, please refer to:
- `src/services/undo.js` - UndoManager implementation
- `src/utils/commands.js` - Command classes including MultiShapeCommand
- `src/contexts/UndoContext.jsx` - React context for undo operations

