/**
 * Command Pattern for Undo/Redo System
 * Each command encapsulates an action and its inverse
 */

// Base Command class
export class Command {
  execute() {
    throw new Error('execute() must be implemented');
  }

  undo() {
    throw new Error('undo() must be implemented');
  }

  redo() {
    return this.execute();
  }

  getDescription() {
    return 'Unknown command';
  }

  getUserName() {
    return this.metadata?.user?.displayName || 'Unknown';
  }
}

// Create Shape Command
export class CreateShapeCommand extends Command {
  constructor(canvasId, shape, user, createShapeFn, deleteShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shape = shape;
    this.user = user;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute() {
    console.log('[CreateShapeCommand] EXECUTE: Creating shape', this.shape.id, this.shape.type);
    await this.createShapeFn(this.canvasId, this.shape, this.user);
    console.log('[CreateShapeCommand] EXECUTE: Shape created successfully');
  }

  async undo() {
    console.log('[CreateShapeCommand] UNDO: Deleting shape', this.shape.id, this.shape.type);
    await this.deleteShapeFn(this.canvasId, this.shape.id);
    console.log('[CreateShapeCommand] UNDO: Shape deleted successfully');
  }

  getDescription() {
    const typeName = this.shape.type.charAt(0).toUpperCase() + this.shape.type.slice(1);
    const colorInfo = this.shape.fill ? ` (${this.shape.fill})` : '';
    const position = ` at (${Math.round(this.shape.x)}, ${Math.round(this.shape.y)})`;
    return `Created ${typeName}${colorInfo}${position}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Update Shape Command
export class UpdateShapeCommand extends Command {
  constructor(canvasId, shapeId, newProps, oldProps, user, updateShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shapeId = shapeId;
    this.newProps = newProps;
    this.oldProps = oldProps;
    this.user = user;
    this.updateShapeFn = updateShapeFn;
  }

  async execute() {
    await this.updateShapeFn(this.canvasId, this.shapeId, this.newProps, this.user);
  }

  async undo() {
    await this.updateShapeFn(this.canvasId, this.shapeId, this.oldProps, this.user);
  }

  getDescription() {
    const props = Object.keys(this.newProps);
    
    // Check for gradient changes
    if (props.includes('fillLinearGradientColorStops') || 
        props.includes('fillLinearGradientStartPoint') ||
        props.includes('fillLinearGradientEndPoint')) {
      return 'Applied gradient';
    }
    
    // Check for solid color changes
    if (props.includes('fill') && this.newProps.fill !== undefined) {
      const color = this.newProps.fill;
      const opacityText = (props.includes('opacity') && this.newProps.opacity < 1) 
        ? ` (${Math.round(this.newProps.opacity * 100)}% opacity)` 
        : '';
      return `Changed color to ${color}${opacityText}`;
    }
    
    // Check for rotation
    if (props.includes('rotation')) {
      const degrees = Math.round(this.newProps.rotation || 0);
      return `Rotated to ${degrees}°`;
    }
    
    // Check for resize (width, height, or scale changes)
    if (props.some(p => ['width', 'height', 'scaleX', 'scaleY', 'radiusX', 'radiusY', 'radius'].includes(p))) {
      const sizeInfo = [];
      if (this.newProps.width !== undefined) sizeInfo.push(`W: ${Math.round(this.newProps.width)}`);
      if (this.newProps.height !== undefined) sizeInfo.push(`H: ${Math.round(this.newProps.height)}`);
      if (this.newProps.radius !== undefined) sizeInfo.push(`R: ${Math.round(this.newProps.radius)}`);
      if (this.newProps.radiusX !== undefined) sizeInfo.push(`RX: ${Math.round(this.newProps.radiusX)}`);
      if (this.newProps.radiusY !== undefined) sizeInfo.push(`RY: ${Math.round(this.newProps.radiusY)}`);
      
      if (sizeInfo.length > 0) {
        return `Resized shape (${sizeInfo.join(', ')})`;
      }
      return 'Resized shape';
    }
    
    // Check for opacity only
    if (props.includes('opacity') && props.length === 1) {
      const opacityPercent = Math.round(this.newProps.opacity * 100);
      return `Changed opacity to ${opacityPercent}%`;
    }
    
    // Check for z-index changes (layer ordering)
    if (props.includes('zIndex')) {
      const oldZ = this.oldProps.zIndex || 0;
      const newZ = this.newProps.zIndex;
      if (newZ > oldZ) {
        const diff = newZ - oldZ;
        if (diff > 10) {
          return 'Brought to front';
        } else {
          return 'Brought forward';
        }
      } else if (newZ < oldZ) {
        const diff = oldZ - newZ;
        if (diff > 10) {
          return 'Sent to back';
        } else {
          return 'Sent backward';
        }
      }
      return `Changed layer order (z: ${oldZ} → ${newZ})`;
    }
    
    // Check for position changes (shouldn't happen often, MoveShapeCommand handles this)
    if (props.includes('x') || props.includes('y')) {
      return 'Moved shape';
    }
    
    // Check for text changes
    if (props.includes('text')) {
      return 'Changed text';
    }
    
    // Check for text formatting
    if (props.some(p => ['fontSize', 'fontFamily', 'fontStyle', 'align', 'verticalAlign'].includes(p))) {
      return 'Changed text formatting';
    }
    
    // Check for stroke changes
    if (props.some(p => ['stroke', 'strokeWidth'].includes(p))) {
      return 'Changed stroke';
    }
    
    // Default fallback
    return `Updated ${props.join(', ')}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Delete Shape Command
export class DeleteShapeCommand extends Command {
  constructor(canvasId, shape, user, createShapeFn, deleteShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shape = shape;
    this.user = user;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute() {
    await this.deleteShapeFn(this.canvasId, this.shape.id, this.user);
  }

  async undo() {
    await this.createShapeFn(this.canvasId, this.shape, this.user);
  }

  getDescription() {
    const typeName = this.shape.type.charAt(0).toUpperCase() + this.shape.type.slice(1);
    const colorInfo = this.shape.fill ? ` (${this.shape.fill})` : '';
    return `Deleted ${typeName}${colorInfo}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Move Shape Command
export class MoveShapeCommand extends Command {
  constructor(canvasId, shapeId, newPosition, oldPosition, user, updateShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shapeId = shapeId;
    this.newPosition = newPosition;
    this.oldPosition = oldPosition;
    this.user = user;
    this.updateShapeFn = updateShapeFn;
    
    console.log('🏗️  [MoveShapeCommand] Constructor called', {
      canvasId,
      shapeId,
      from: oldPosition,
      to: newPosition,
      user: user?.displayName || user?.email
    });
  }

  async execute() {
    console.log('▶️  [MoveShapeCommand] execute() called');
    console.log('   Calling updateShapeFn (canvasRTDB.updateShape)');
    console.log('   New position:', this.newPosition);
    
    await this.updateShapeFn(this.canvasId, this.shapeId, this.newPosition, this.user);
    
    console.log('✅ [MoveShapeCommand] execute() completed');
  }

  async undo() {
    console.log('◀️  [MoveShapeCommand] undo() called');
    console.log('   Calling updateShapeFn to restore old position:', this.oldPosition);
    
    await this.updateShapeFn(this.canvasId, this.shapeId, this.oldPosition, this.user);
    
    console.log('✅ [MoveShapeCommand] undo() completed');
  }

  getDescription() {
    const fromPos = `(${Math.round(this.oldPosition.x)}, ${Math.round(this.oldPosition.y)})`;
    const toPos = `(${Math.round(this.newPosition.x)}, ${Math.round(this.newPosition.y)})`;
    return `Moved shape from ${fromPos} to ${toPos}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Multi-Shape Command (for batch operations)
export class MultiShapeCommand extends Command {
  constructor(commands, description = 'Multi-shape operation') {
    super();
    this.commands = commands;
    this.description = description;
  }

  async execute() {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  getDescription() {
    if (this.commands.length > 0) {
      return `${this.description} (${this.commands.length} changes)`;
    }
    return this.description;
  }

  getUserName() {
    // Use the first command's user
    if (this.commands.length > 0) {
      const firstCmd = this.commands[0];
      return firstCmd.metadata?.user?.displayName || firstCmd.user?.displayName || 'Unknown';
    }
    return this.metadata?.user?.displayName || 'Unknown';
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Operation Command - Atomic Undo/Redo for AI-Generated Shapes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This command handles AI operations (bulk creates, templates, etc.) as atomic
 * operations that can be undone/redone through the standard Ctrl+Z/Ctrl+Y flow.
 * 
 * Architecture:
 * - AI operations create shapes directly in RTDB via Cloud Function
 * - Frontend receives list of affected shape IDs in Cloud Function response
 * - This command wraps those shape IDs for atomic undo/redo
 * - Undo: Deletes all affected shapes in batched RTDB write (fast, atomic)
 * - Redo: Recreates shapes from stored shape data
 * 
 * Performance:
 * - Undo 500 shapes: <500ms (single batched RTDB delete)
 * - Redo 500 shapes: <2s (single batched RTDB create)
 * - No sequential operations - all atomic
 * 
 * Usage:
 * const aiCommand = new AIOperationCommand({
 *   canvasId: 'global-canvas-v1',
 *   description: 'AI: Created 50 rectangles in grid',
 *   affectedShapeIds: ['shape_123', 'shape_456', ...],
 *   shapeData: [{ id: 'shape_123', type: 'rectangle', ... }, ...],
 *   user,
 *   deleteShapeFn: deleteShape,
 *   createShapeFn: createShape
 * });
 * await undoManager.execute(aiCommand, user);
 * 
 * Integration:
 * - Called from AICanvas after Cloud Function returns shape IDs
 * - Registered with undo manager for standard Ctrl+Z/Ctrl+Y flow
 * - Appears in History Timeline with purple styling (isAI flag)
 * - Atomic undo removes all shapes from operation at once
 * 
 * @example
 * // After AI creates 100 shapes:
 * const aiCommand = new AIOperationCommand({
 *   canvasId: CANVAS_ID,
 *   description: 'AI: Created 100 circles',
 *   affectedShapeIds: responseData.shapeIds,
 *   shapeData: shapesSnapshot, // Current shape state for redo
 *   user,
 *   deleteShapeFn: deleteShape,
 *   createShapeFn: createShape
 * });
 * await execute(aiCommand, user);
 * // Now Ctrl+Z will remove all 100 shapes atomically
 */
export class AIOperationCommand extends Command {
  /**
   * @param {Object} config - Command configuration
   * @param {string} config.canvasId - Canvas identifier
   * @param {string} config.description - Human-readable description (e.g., "AI: Created 50 shapes")
   * @param {string[]} config.affectedShapeIds - IDs of shapes created/modified by AI
   * @param {Object[]} config.shapeData - Full shape data for redo (optional, for recreate capability)
   * @param {Object} config.user - User who invoked AI
   * @param {Function} config.deleteShapeFn - RTDB deleteShape function
   * @param {Function} config.createShapeFn - RTDB createShape function
   */
  constructor({ canvasId, description, affectedShapeIds, shapeData, user, deleteShapeFn, createShapeFn }) {
    super();
    this.canvasId = canvasId;
    this.description = description;
    this.affectedShapeIds = affectedShapeIds || [];
    this.shapeData = shapeData || []; // Store for redo
    this.user = user;
    this.deleteShapeFn = deleteShapeFn;
    this.createShapeFn = createShapeFn;
    
    console.log('[AIOperationCommand] Created for', this.affectedShapeIds.length, 'shapes:', description);
  }

  /**
   * Execute (no-op for AI operations - already executed by Cloud Function)
   * AI operations are executed by Cloud Function before this command is created.
   * This method exists for command pattern consistency.
   */
  async execute() {
    // No-op: AI operation already executed by Cloud Function
    console.log('[AIOperationCommand] Execute called (no-op, already executed by Cloud Function)');
  }

  /**
   * Undo AI Operation - Atomic Deletion of All Affected Shapes
   * 
   * Removes all shapes created by this AI operation in a single batched RTDB write.
   * This ensures atomic undo - either all shapes removed or none.
   * 
   * Performance: 500 shapes deleted in <500ms via batched write
   */
  async undo() {
    console.log(`[AIOperationCommand] UNDO: Removing ${this.affectedShapeIds.length} AI-created shapes`);
    
    const deleteStartTime = performance.now();
    
    try {
      // Use batched delete for atomic operation
      // Import dynamically to avoid circular dependency
      const { rtdb } = await import('../services/firebase');
      const { ref, update } = await import('firebase/database');
      
      // Build batched update object for atomic deletion
      const updates = {};
      for (const shapeId of this.affectedShapeIds) {
        updates[`canvas/${this.canvasId}/shapes/${shapeId}`] = null; // null = delete in RTDB
      }
      
      // Update metadata timestamp
      updates[`canvas/${this.canvasId}/metadata/lastUpdated`] = Date.now();
      
      // Single atomic RTDB write to delete all shapes
      await update(ref(rtdb), updates);
      
      const elapsed = performance.now() - deleteStartTime;
      console.log(`[AIOperationCommand] ✅ UNDO complete: Removed ${this.affectedShapeIds.length} shapes in ${elapsed.toFixed(0)}ms`);
      
    } catch (error) {
      console.error('[AIOperationCommand] ❌ UNDO failed:', error);
      throw new Error(`Failed to undo AI operation: ${error.message}`);
    }
  }

  /**
   * Redo AI Operation - Recreate All Shapes
   * 
   * Restores all shapes from stored shape data with original IDs and properties.
   * Uses batched RTDB write for atomic recreation.
   * 
   * Performance: 500 shapes created in <2s via batched write
   * 
   * Note: Requires shapeData to be stored during command creation.
   * If shape data unavailable, redo will fail gracefully.
   */
  async redo() {
    console.log(`[AIOperationCommand] REDO: Recreating ${this.affectedShapeIds.length} AI shapes`);
    
    if (!this.shapeData || this.shapeData.length === 0) {
      console.warn('[AIOperationCommand] Cannot redo: No shape data stored');
      throw new Error('Cannot redo AI operation: Shape data not available');
    }
    
    const redoStartTime = performance.now();
    
    try {
      // Use batched create for atomic operation
      const { rtdb } = await import('../services/firebase');
      const { ref, update } = await import('firebase/database');
      
      // Build batched update object for atomic recreation
      const updates = {};
      for (const shape of this.shapeData) {
        updates[`canvas/${this.canvasId}/shapes/${shape.id}`] = shape;
      }
      
      // Update metadata timestamp
      updates[`canvas/${this.canvasId}/metadata/lastUpdated`] = Date.now();
      
      // Single atomic RTDB write to recreate all shapes
      await update(ref(rtdb), updates);
      
      const elapsed = performance.now() - redoStartTime;
      console.log(`[AIOperationCommand] ✅ REDO complete: Recreated ${this.shapeData.length} shapes in ${elapsed.toFixed(0)}ms`);
      
    } catch (error) {
      console.error('[AIOperationCommand] ❌ REDO failed:', error);
      throw new Error(`Failed to redo AI operation: ${error.message}`);
    }
  }

  getDescription() {
    return this.description;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

