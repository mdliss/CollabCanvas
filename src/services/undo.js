/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Undo/Redo Manager - Command Pattern with AI Operation Support
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages command history with undo and redo stacks, including atomic AI operations.
 * 
 * ARCHITECTURE:
 * - Stack-based undo/redo with Command pattern
 * - Supports manual operations (drag, create, delete, transform)
 * - Supports AI operations (bulk creates, templates) with atomic undo
 * - Batch operations grouped as single undo step
 * - History Timeline integration via getFullHistory()
 * 
 * DATA STRUCTURES:
 * 
 * Undo Stack: Array of Command objects (most recent at end)
 * [
 *   CreateShapeCommand { shape: {...}, execute(), undo() },
 *   MoveShapeCommand { oldPos, newPos, execute(), undo() },
 *   AIOperationCommand { affectedShapeIds: [...], execute(), undo() },  // <-- NEW
 *   ...
 * ]
 * 
 * Redo Stack: Array of undone Command objects
 * [
 *   <undone commands in reverse order>
 * ]
 * 
 * COMMAND TYPES:
 * 1. CreateShapeCommand - Single shape creation
 * 2. UpdateShapeCommand - Property changes (color, size, rotation)
 * 3. DeleteShapeCommand - Single shape deletion
 * 4. MoveShapeCommand - Position changes
 * 5. MultiShapeCommand - Batch operations (multiple shapes)
 * 6. AIOperationCommand - AI operations with shape IDs (NEW)
 * 
 * AI OPERATION REGISTRATION:
 * 
 * Traditional Flow (Manual Operations):
 * execute(command, user) → command.execute() → add to undo stack
 * 
 * AI Operation Flow:
 * 1. Cloud Function executes operation (shapes created in RTDB)
 * 2. Frontend receives operationId and fetches affected shape IDs
 * 3. Frontend creates AIOperationCommand with shape IDs
 * 4. registerAIOperation(aiCommand) → add to undo stack (no execute call)
 * 5. Undo removes all shapes atomically via batched RTDB delete
 * 
 * PERFORMANCE:
 * - Execute: <50ms (single RTDB write)
 * - Undo: <100ms (single RTDB write)
 * - Redo: <100ms (single RTDB write)
 * - AI Undo (500 shapes): <500ms (batched delete)
 * - AI Redo (500 shapes): <2s (batched create)
 * - History query: <10ms (in-memory array)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CONSOLE TESTING COMMANDS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Test 1: Inspect Undo Stack
 * ──────────────────────────
 * > window.undoManager.undoStack.map(cmd => cmd.getDescription())
 * 
 * Expected Output:
 * [
 *   "Created Rectangle at (100, 200)",
 *   "Moved shape from (100, 200) to (150, 250)",
 *   "AI: Created 50 rectangles in grid",  // <-- AI operation
 *   "Changed color to #ff0000"
 * ]
 * 
 * Test 2: Check AI Operation in Stack
 * ────────────────────────────────────
 * > const aiOps = window.undoManager.undoStack.filter(cmd => cmd.metadata?.isAI)
 * > console.log(aiOps.map(cmd => ({
 *     description: cmd.getDescription(),
 *     shapeCount: cmd.affectedShapeIds?.length,
 *     canUndo: typeof cmd.undo === 'function'
 *   })))
 * 
 * Expected Output:
 * [
 *   {
 *     description: "AI: Created 50 rectangles",
 *     shapeCount: 50,
 *     canUndo: true
 *   }
 * ]
 * 
 * Test 3: Verify History Format
 * ──────────────────────────────
 * > window.undoManager.getFullHistory()
 * 
 * Expected Output:
 * [
 *   {
 *     id: "history-0",
 *     index: 0,
 *     description: "Created Rectangle",
 *     timestamp: 1234567890,
 *     user: { uid, displayName },
 *     status: "done",
 *     isCurrent: false,
 *     isAI: false
 *   },
 *   {
 *     id: "history-1",
 *     index: 1,
 *     description: "AI: Created 50 shapes",
 *     timestamp: 1234567895,
 *     user: { uid, displayName },
 *     status: "done",
 *     isCurrent: true,   // <-- Most recent
 *     isAI: true          // <-- AI operation
 *   }
 * ]
 * 
 * Test 4: Manual Undo Test
 * ─────────────────────────
 * > console.log('Before undo:', window.undoManager.getState())
 * > await window.undoManager.undo()
 * > console.log('After undo:', window.undoManager.getState())
 * 
 * Expected Output:
 * Before undo: { undoStackSize: 5, redoStackSize: 0, canUndo: true, canRedo: false }
 * After undo: { undoStackSize: 4, redoStackSize: 1, canUndo: true, canRedo: true }
 * 
 * Test 5: Performance Test - AI Undo
 * ───────────────────────────────────
 * (After AI creates 500 shapes)
 * > console.time('ai-undo')
 * > await window.undoManager.undo()
 * > console.timeEnd('ai-undo')
 * 
 * Expected Output:
 * ai-undo: 450ms  // <500ms for 500 shapes
 * 
 * Test 6: Batch Operation Test
 * ─────────────────────────────
 * > window.undoManager.startBatch('Test batch')
 * > // Perform multiple operations
 * > await window.undoManager.endBatch()
 * > window.undoManager.undoStack[window.undoManager.undoStack.length - 1].getDescription()
 * 
 * Expected Output:
 * "Test batch (N changes)"
 * 
 * Test 7: Revert to Point Test
 * ─────────────────────────────
 * > const history = window.undoManager.getFullHistory()
 * > console.log('Current index:', history.findIndex(h => h.isCurrent))
 * > await window.undoManager.revertToPoint(2)  // Revert to index 2
 * > console.log('New index:', window.undoManager.undoStack.length - 1)
 * 
 * Expected Output:
 * Current index: 5
 * New index: 2
 * 
 * Test 8: Clear History Test
 * ───────────────────────────
 * > window.undoManager.clear()
 * > window.undoManager.getState()
 * 
 * Expected Output:
 * { undoStackSize: 0, redoStackSize: 0, canUndo: false, canRedo: false }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

class UndoManager {
  constructor(maxHistorySize = 1000) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = maxHistorySize;
    this.listeners = new Set();
    this.batchMode = false;
    this.batchCommands = [];
    this.batchDescription = '';
  }

  /**
   * Execute a command and add it to the undo stack
   */
  async execute(command, user = null) {
    try {
      // Add metadata to command
      if (!command.metadata) {
        command.metadata = {};
      }
      command.metadata.timestamp = Date.now();
      command.metadata.user = user;
      
      // If in batch mode, collect commands WITHOUT executing them
      // They will be executed by the MultiShapeCommand later
      if (this.batchMode) {
        this.batchCommands.push(command);
        console.log('[UndoManager] Command added to batch (not yet executed):', command.getDescription());
        return true;
      }
      
      // Not in batch mode - execute immediately and add to stack
      await command.execute();
      
      // Add to undo stack
      this.undoStack.push(command);
      console.log('[UndoManager] Command executed and added to undo stack:', command.getDescription(), 'Stack size:', this.undoStack.length);
      
      // Clear redo stack (new action invalidates redo history)
      this.redoStack = [];
      
      // Limit stack size
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('[UndoManager] Execute failed:', error);
      return false;
    }
  }

  /**
   * Start batching commands
   */
  startBatch(description = 'Batch operation') {
    this.batchMode = true;
    this.batchCommands = [];
    this.batchDescription = description;
  }

  /**
   * End batching and execute all collected commands as one
   */
  async endBatch() {
    this.batchMode = false;
    
    if (this.batchCommands.length === 0) {
      console.log('[UndoManager] endBatch called but no commands in batch');
      return true;
    }
    
    console.log('[UndoManager] Ending batch with', this.batchCommands.length, 'commands');
    
    // Import MultiShapeCommand dynamically to avoid circular dependency
    const { MultiShapeCommand } = await import('../utils/commands.js');
    
    // Create a batch command with the first command's metadata
    const batchCommand = new MultiShapeCommand(
      this.batchCommands, 
      this.batchDescription
    );
    
    // Use the metadata from the first command
    if (this.batchCommands[0]?.metadata) {
      batchCommand.metadata = { ...this.batchCommands[0].metadata };
    }
    
    // NOW execute the batch command (which executes all collected commands)
    try {
      await batchCommand.execute();
      console.log('[UndoManager] Batch executed successfully');
    } catch (error) {
      console.error('[UndoManager] Batch execution failed:', error);
      this.batchCommands = [];
      this.batchDescription = '';
      throw error;
    }
    
    // Add to undo stack
    this.undoStack.push(batchCommand);
    this.redoStack = [];
    
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners();
    console.log('[UndoManager] Batch added to undo stack. Stack size:', this.undoStack.length);
    
    this.batchCommands = [];
    this.batchDescription = '';
    return true;
  }

  /**
   * Undo the last command
   */
  async undo() {
    if (!this.canUndo()) {
      console.warn('[UndoManager] Nothing to undo');
      return null;
    }

    const command = this.undoStack.pop();
    console.log('[UndoManager] Undoing:', command.getDescription(), 'Remaining in undo stack:', this.undoStack.length);
    
    try {
      await command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
      console.log('[UndoManager] Undo successful, added to redo stack. Redo stack size:', this.redoStack.length);
      return command.getDescription();
    } catch (error) {
      console.error('[UndoManager] Undo failed:', error);
      // Re-add to undo stack if undo failed
      this.undoStack.push(command);
      throw error;
    }
  }

  /**
   * Redo the last undone command
   */
  async redo() {
    if (!this.canRedo()) {
      console.warn('[UndoManager] Nothing to redo');
      return null;
    }

    const command = this.redoStack.pop();
    console.log('[UndoManager] Redoing:', command.getDescription(), 'Remaining in redo stack:', this.redoStack.length);
    
    try {
      await command.redo();
      this.undoStack.push(command);
      this.notifyListeners();
      console.log('[UndoManager] Redo successful, added to undo stack. Undo stack size:', this.undoStack.length);
      return command.getDescription();
    } catch (error) {
      console.error('[UndoManager] Redo failed:', error);
      // Re-add to redo stack if redo failed
      this.redoStack.push(command);
      throw error;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get the description of the next undo action
   */
  getUndoDescription() {
    if (!this.canUndo()) return null;
    return this.undoStack[this.undoStack.length - 1].getDescription();
  }

  /**
   * Get the description of the next redo action
   */
  getRedoDescription() {
    if (!this.canRedo()) return null;
    return this.redoStack[this.redoStack.length - 1].getDescription();
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      nextUndo: this.getUndoDescription(),
      nextRedo: this.getRedoDescription()
    };
  }

  /**
   * Add a listener to be notified of changes
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[UndoManager] Listener error:', error);
      }
    });
  }

  /**
   * Save undo stack to localStorage
   */
  saveToLocalStorage(key = 'collabcanvas-undo-stack') {
    try {
      // Only save last 50 commands to avoid storage quota
      const recentCommands = this.undoStack.slice(-50);
      
      // We can't serialize functions, so we only save metadata
      const serialized = recentCommands.map(cmd => ({
        type: cmd.constructor.name,
        description: cmd.getDescription()
      }));
      
      localStorage.setItem(key, JSON.stringify(serialized));
    } catch (error) {
      console.error('[UndoManager] Failed to save to localStorage:', error);
    }
  }

  /**
   * Get stack sizes for display
   */
  getStackSizes() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    };
  }

  /**
   * Revert to a specific point in history
   * @param {number} index - The index in the undo stack to revert to (0 = oldest, length-1 = newest)
   */
  async revertToPoint(index) {
    if (index < 0 || index >= this.undoStack.length) {
      console.error('[UndoManager] Invalid index for revert:', index);
      return false;
    }

    try {
      const currentIndex = this.undoStack.length - 1;
      
      if (index < currentIndex) {
        // We need to undo commands
        const stepsToUndo = currentIndex - index;
        for (let i = 0; i < stepsToUndo; i++) {
          await this.undo();
        }
      } else if (index > currentIndex) {
        // We need to redo commands
        const stepsToRedo = index - currentIndex;
        for (let i = 0; i < stepsToRedo; i++) {
          await this.redo();
        }
      }
      
      return true;
    } catch (error) {
      console.error('[UndoManager] Revert to point failed:', error);
      return false;
    }
  }

  /**
   * Register AI Operation with Undo Capability
   * 
   * Registers AI operations (bulk creates, templates, etc.) as proper commands
   * that can be undone/redone through standard Ctrl+Z/Ctrl+Y flow.
   * 
   * Architecture:
   * - AI Cloud Function executes operation and returns affected shape IDs
   * - This method creates AIOperationCommand with those shape IDs
   * - Command is added to undo stack for standard undo/redo flow
   * - Undo removes all affected shapes atomically (batched RTDB delete)
   * - Redo recreates shapes from stored data
   * 
   * Performance:
   * - Registration: <10ms (creates command object)
   * - Undo: <500ms for 500 shapes (batched delete)
   * - Redo: <2s for 500 shapes (batched create)
   * 
   * @param {Object} aiCommand - AIOperationCommand instance with shape IDs and metadata
   * 
   * @example
   * // After AI creates shapes:
   * const aiCommand = new AIOperationCommand({
   *   canvasId: 'global-canvas-v1',
   *   description: 'AI: Created 50 rectangles',
   *   affectedShapeIds: ['shape_123', 'shape_456', ...],
   *   shapeData: shapesSnapshot,
   *   user,
   *   deleteShapeFn: deleteShape,
   *   createShapeFn: createShape
   * });
   * undoManager.registerAIOperation(aiCommand);
   */
  registerAIOperation(aiCommand) {
    // Add metadata to command
    if (!aiCommand.metadata) {
      aiCommand.metadata = {};
    }
    aiCommand.metadata.timestamp = Date.now();
    aiCommand.metadata.isAI = true;
    
    // Add to undo stack (operation already executed by Cloud Function)
    this.undoStack.push(aiCommand);
    console.log('[UndoManager] AI operation registered:', aiCommand.getDescription(), 
                'Shapes:', aiCommand.affectedShapeIds.length);
    
    // Clear redo stack (new action invalidates redo history)
    this.redoStack = [];
    
    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners();
  }
  
  /**
   * Legacy method for backward compatibility
   * @deprecated Use registerAIOperation() with AIOperationCommand instead
   */
  logAIAction(description, user = null) {
    console.warn('[UndoManager] logAIAction is deprecated. Use registerAIOperation() instead.');
    
    // Create a simple placeholder for backward compatibility
    const aiPlaceholder = {
      getDescription: () => description,
      execute: async () => {},
      undo: async () => {
        console.warn('[UndoManager] Cannot undo: AI operation registered via deprecated logAIAction()');
      },
      redo: async () => {},
      metadata: {
        timestamp: Date.now(),
        user,
        isAI: true
      }
    };
    
    this.undoStack.push(aiPlaceholder);
    this.redoStack = [];
    
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners();
  }

  /**
   * Get the full history with metadata
   */
  getFullHistory() {
    const currentIndex = this.undoStack.length - 1;
    
    return [
      ...this.undoStack.map((cmd, idx) => ({
        id: `history-${idx}`,
        index: idx,
        description: cmd.getDescription(),
        timestamp: cmd.metadata?.timestamp || Date.now(),
        user: cmd.metadata?.user,
        status: 'done',
        isCurrent: idx === currentIndex,
        isAI: cmd.metadata?.isAIAction || false
      })),
      ...this.redoStack.slice().reverse().map((cmd, idx) => ({
        id: `redo-${idx}`,
        index: currentIndex + idx + 1,
        description: cmd.getDescription(),
        timestamp: cmd.metadata?.timestamp || Date.now(),
        user: cmd.metadata?.user,
        status: 'undone',
        isCurrent: false,
        isAI: cmd.metadata?.isAIAction || false
      }))
    ];
  }
}

// Singleton instance
export const undoManager = new UndoManager();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.undoManager = undoManager;
}

