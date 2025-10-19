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

export class UndoManager {
  constructor(canvasId = null, maxHistorySize = 1000) {
    this.canvasId = canvasId;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = maxHistorySize;
    this.listeners = new Set();
    this.batchMode = false;
    this.batchCommands = [];
    this.batchDescription = '';
    this.rtdbUnsubscribe = null;
    
    // If canvas-specific, set up RTDB sync
    if (canvasId) {
      this.setupRTDBSync();
    }
    
    console.log('[UndoManager] Created', canvasId ? `canvas-specific manager for ${canvasId}` : 'global manager');
  }
  
  /**
   * Set up RTDB sync for shared canvas history
   * 
   * Subscribes to RTDB to display ALL users' commands in the timeline.
   * Undo/redo operations remain local-only.
   */
  async setupRTDBSync() {
    const { subscribeToHistory } = await import('./sharedHistory.js');
    
    console.log('🔵 [HISTORY] Setting up RTDB sync for canvas:', this.canvasId);
    
    // Subscribe to shared history for display purposes
    this.rtdbUnsubscribe = subscribeToHistory(this.canvasId, (historyData) => {
      console.log('🔵 [HISTORY] RTDB history updated:', historyData.commands.length, 'total commands from all users');
      this.rtdbHistory = historyData;
      this.notifyListeners(); // Update UI to show all users' commands
    });
  }
  
  /**
   * Cleanup RTDB subscription
   */
  destroy() {
    if (this.rtdbUnsubscribe) {
      this.rtdbUnsubscribe();
      this.rtdbUnsubscribe = null;
    }
    console.log('[UndoManager] Destroyed manager for canvas:', this.canvasId);
  }

  /**
   * Sync command to RTDB for shared history display
   */
  async syncCommandToRTDB(command, status = 'done') {
    if (!this.canvasId) {
      console.warn('🔵 [HISTORY] No canvasId - skipping RTDB sync');
      return;
    }
    
    try {
      const { addCommand } = await import('./sharedHistory.js');
      
      const commandData = {
        type: command.constructor.name,
        description: command.getDescription(),
        timestamp: command.metadata?.timestamp || Date.now(),
        userId: command.metadata?.user?.uid || 'unknown',
        userName: command.metadata?.user?.displayName || command.metadata?.user?.email?.split('@')[0] || 'User',
        status: status,
        isAI: command.metadata?.isAI || false
      };
      
      console.log('🔵 [HISTORY] Syncing to RTDB:', commandData);
      await addCommand(this.canvasId, commandData);
      console.log('🔵 [HISTORY] ✅ Synced to RTDB successfully:', commandData.description);
    } catch (error) {
      console.error('🔵 [HISTORY] ❌ RTDB sync failed:', error.message, error.stack);
    }
  }

  /**
   * Execute a command and add it to the undo stack
   * 
   * For canvas-specific managers, also syncs to RTDB for shared history.
   */
  async execute(command, user = null) {
    try {
      // Add metadata to command
      if (!command.metadata) {
        command.metadata = {};
      }
      command.metadata.timestamp = Date.now();
      command.metadata.user = user;
      command.metadata.canvasId = this.canvasId; // Track which canvas
      
      // If in batch mode, collect commands WITHOUT executing them
      // They will be executed by the MultiShapeCommand later
      if (this.batchMode) {
        this.batchCommands.push(command);
        console.log('[UndoManager] Command added to batch (not yet executed):', command.getDescription());
        return true;
      }
      
      // Not in batch mode - execute immediately and add to stack
      await command.execute();
      
      // Track change for leaderboard and daily activity (non-blocking, lazy import)
      if (user?.uid) {
        Promise.all([
          import('./userProfile').then(({ incrementChangesCount }) => incrementChangesCount(user.uid, 1)),
          import('./dailyActivity').then(({ incrementTodayActivity }) => incrementTodayActivity(user.uid))
        ]).catch(err => {
          console.warn('[UndoManager] Failed to track change:', err);
        });
      }
      
      // Add to undo stack
      this.undoStack.push(command);
      console.log('🔵 [HISTORY] Command executed:', command.getDescription(), 'Canvas:', this.canvasId || 'global', 'Stack size:', this.undoStack.length);
      
      // Clear redo stack (new action invalidates redo history)
      this.redoStack = [];
      
      // Limit stack size
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }
      
      // Sync to RTDB for shared history (canvas-specific only)
      if (this.canvasId) {
        this.syncCommandToRTDB(command, 'done').catch(err => {
          console.warn('🔵 [HISTORY] Failed to sync to RTDB:', err);
        });
      }
      
      console.log('🔵 [HISTORY] Notifying', this.listeners.size, 'listeners');
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
    
    console.log('🔵 [HISTORY] Ending batch with', this.batchCommands.length, 'commands');
    
    // Import MultiShapeCommand dynamically to avoid circular dependency
    const { MultiShapeCommand } = await import('../utils/commands.js');
    
    // Create a batch command with the first command's metadata
    const batchCommand = new MultiShapeCommand(
      this.batchCommands, 
      this.batchDescription
    );
    
    // Track changes for leaderboard and daily activity (BATCH = 1 CHANGE, not n changes)
    const firstCommand = this.batchCommands[0];
    if (firstCommand?.metadata?.user?.uid) {
      Promise.all([
        import('./userProfile').then(({ incrementChangesCount }) => incrementChangesCount(firstCommand.metadata.user.uid, 1)),
        import('./dailyActivity').then(({ incrementTodayActivity }) => incrementTodayActivity(firstCommand.metadata.user.uid))
      ]).catch(err => {
        console.warn('[UndoManager] Failed to track batch changes:', err);
      });
    }
    
    // Use the metadata from the first command
    if (this.batchCommands[0]?.metadata) {
      batchCommand.metadata = { 
        ...this.batchCommands[0].metadata,
        canvasId: this.canvasId
      };
    }
    
    // NOW execute the batch command (which executes all collected commands)
    try {
      await batchCommand.execute();
      console.log('🔵 [HISTORY] Batch executed successfully');
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
    
    // Sync to RTDB for shared history
    if (this.canvasId) {
      this.syncCommandToRTDB(batchCommand, 'done').catch(err => {
        console.warn('🔵 [HISTORY] Failed to sync batch to RTDB:', err);
      });
    }
    
    this.notifyListeners();
    console.log('🔵 [HISTORY] Batch added to undo stack. Stack size:', this.undoStack.length);
    
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
    console.log('🔵 [HISTORY] Undoing:', command.getDescription(), 'Remaining in undo stack:', this.undoStack.length);
    
    try {
      await command.undo();
      this.redoStack.push(command);
      
      // Note: RTDB sync disabled for undo/redo to avoid index mismatch issues
      // Each user manages their own undo/redo stack independently
      
      this.notifyListeners();
      console.log('🔵 [HISTORY] Undo successful, added to redo stack. Redo stack size:', this.redoStack.length);
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
    console.log('🔵 [HISTORY] Redo called. Redo stack size:', this.redoStack.length);
    
    if (!this.canRedo()) {
      console.warn('🔵 [HISTORY] Cannot redo: redo stack is empty');
      return null;
    }

    const command = this.redoStack.pop();
    console.log('🔵 [HISTORY] Redoing:', command.getDescription());
    
    try {
      await command.redo();
      this.undoStack.push(command);
      
      // Note: RTDB sync disabled for undo/redo to avoid index mismatch issues
      // Each user manages their own undo/redo stack independently
      
      this.notifyListeners();
      console.log('🔵 [HISTORY] Redo successful. Undo stack size:', this.undoStack.length);
      return command.getDescription();
    } catch (error) {
      console.error('🔵 [HISTORY] Redo failed:', error);
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
    console.log('🔵 [HISTORY] Clearing all history. Canvas:', this.canvasId || 'global');
    console.log('🔵 [HISTORY] Before clear - Undo stack:', this.undoStack.length, 'Redo stack:', this.redoStack.length);
    
    this.undoStack = [];
    this.redoStack = [];
    
    // Clear RTDB history for canvas-specific managers
    if (this.canvasId) {
      import('./sharedHistory.js').then(({ clearHistory }) => {
        clearHistory(this.canvasId).catch(err => {
          console.error('🔵 [HISTORY] Failed to clear RTDB history:', err);
        });
      });
    }
    
    this.notifyListeners();
    console.log('🔵 [HISTORY] History cleared successfully');
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
    console.log('🔵 [HISTORY] Listener added. Canvas:', this.canvasId || 'global', 'Total listeners:', this.listeners.size);
    return () => {
      this.listeners.delete(listener);
      console.log('🔵 [HISTORY] Listener removed. Canvas:', this.canvasId || 'global', 'Remaining listeners:', this.listeners.size);
    };
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
   * @param {number} index - The index in the history to revert to (0 = oldest, length-1 = newest)
   */
  async revertToPoint(index) {
    console.log('🔵 [HISTORY] Revert to point called. Target index:', index);
    console.log('🔵 [HISTORY] Current undo stack size:', this.undoStack.length);
    console.log('🔵 [HISTORY] Current index:', this.undoStack.length - 1);
    
    // Special case: index -1 means revert to empty state (undo everything)
    if (index === -1) {
      console.log('🔵 [HISTORY] Reverting to empty state (undoing all)');
      const undoCount = this.undoStack.length;
      for (let i = 0; i < undoCount; i++) {
        await this.undo();
      }
      console.log('🔵 [HISTORY] Reverted to empty state');
      return true;
    }
    
    // Validate index range
    const maxValidIndex = this.undoStack.length + this.redoStack.length - 1;
    if (index < 0 || index > maxValidIndex) {
      console.error('🔵 [HISTORY] Invalid index for revert:', index, 'Valid range: -1 to', maxValidIndex);
      return false;
    }

    try {
      const currentIndex = this.undoStack.length - 1;
      
      if (index < currentIndex) {
        // We need to undo commands
        const stepsToUndo = currentIndex - index;
        console.log(`🔵 [HISTORY] Need to UNDO ${stepsToUndo} steps to reach index ${index}`);
        for (let i = 0; i < stepsToUndo; i++) {
          await this.undo();
        }
      } else if (index > currentIndex) {
        // We need to redo commands
        const stepsToRedo = index - currentIndex;
        console.log(`🔵 [HISTORY] Need to REDO ${stepsToRedo} steps to reach index ${index}`);
        for (let i = 0; i < stepsToRedo; i++) {
          await this.redo();
        }
      } else {
        console.log('🔵 [HISTORY] Already at target index - no action needed');
      }
      
      console.log('🔵 [HISTORY] Revert complete - now at index', this.undoStack.length - 1);
      return true;
    } catch (error) {
      console.error('🔵 [HISTORY] Revert to point failed:', error);
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
    aiCommand.metadata.user = aiCommand.user; // Copy user from command for getUserName()
    aiCommand.metadata.canvasId = this.canvasId;
    
    // Track changes for leaderboard and daily activity (AI OPERATION = 1 CHANGE, not n shapes)
    if (aiCommand.user?.uid && aiCommand.affectedShapeIds) {
      Promise.all([
        import('./userProfile').then(({ incrementChangesCount }) => incrementChangesCount(aiCommand.user.uid, 1)),
        import('./dailyActivity').then(({ incrementTodayActivity }) => incrementTodayActivity(aiCommand.user.uid))
      ]).catch(err => {
        console.warn('[UndoManager] Failed to track AI changes:', err);
      });
    }
    
    // Add to undo stack (operation already executed by Cloud Function)
    this.undoStack.push(aiCommand);
    console.log('🔵 [HISTORY] AI operation registered:', aiCommand.getDescription(), 
                'Shapes:', aiCommand.affectedShapeIds?.length || 0,
                'User:', aiCommand.user?.displayName || aiCommand.user?.email || 'Unknown');
    
    // Clear redo stack (new action invalidates redo history)
    this.redoStack = [];
    
    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    // Sync to RTDB for shared history
    if (this.canvasId) {
      this.syncCommandToRTDB(aiCommand, 'done').catch(err => {
        console.warn('🔵 [HISTORY] Failed to sync AI operation to RTDB:', err);
      });
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
   * 
   * For canvas-specific managers: Returns RTDB history (all users' commands) for display
   * For global managers: Returns local history
   * 
   * Note: RTDB history shows all users' operations, but only local operations are undoable
   */
  getFullHistory() {
    // If we have RTDB history (canvas-specific), show ALL users' commands
    if (this.rtdbHistory && this.rtdbHistory.commands && this.rtdbHistory.commands.length > 0) {
      console.log('🔵 [HISTORY] Returning RTDB history:', this.rtdbHistory.commands.length, 'commands from all users');
      
      return this.rtdbHistory.commands.map((cmd, idx) => ({
        id: cmd.id || `history-${idx}`,
        index: idx,
        description: cmd.description,
        timestamp: cmd.timestamp,
        user: { uid: cmd.userId, displayName: cmd.userName },
        status: cmd.status,
        isCurrent: false, // Don't mark any as current in shared view
        isAI: cmd.isAI || cmd.description?.startsWith('AI:') || false,
        isLocal: false // Mark as non-local (from RTDB)
      }));
    }
    
    // Fallback to local history (for global manager or if RTDB not ready yet)
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
        isAI: cmd.metadata?.isAI || cmd.metadata?.isAIAction || false,
        isLocal: true
      })),
      ...this.redoStack.slice().reverse().map((cmd, idx) => ({
        id: `redo-${idx}`,
        index: currentIndex + idx + 1,
        description: cmd.getDescription(),
        timestamp: cmd.metadata?.timestamp || Date.now(),
        user: cmd.metadata?.user,
        status: 'undone',
        isCurrent: false,
        isAI: cmd.metadata?.isAI || cmd.metadata?.isAIAction || false,
        isLocal: true
      }))
    ];
  }
}

// Legacy global instance for backward compatibility (used outside Canvas)
const globalUndoManager = new UndoManager(null);
export const undoManager = globalUndoManager;

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.undoManager = globalUndoManager;
  window.UndoManager = UndoManager; // Expose class for debugging
}

