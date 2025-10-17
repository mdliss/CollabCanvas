/**
 * Undo/Redo Manager
 * Manages command history with undo and redo stacks
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
   * Log AI Action for History Display
   * 
   * Adds AI operations to history timeline without undo capability.
   * Creates a placeholder command that appears in history but cannot be undone
   * (AI shapes are created directly in RTDB, not through command pattern).
   * 
   * @param {string} description - Action description (e.g., "AI: Created 400 rectangles")
   * @param {Object} user - User object for metadata
   */
  logAIAction(description, user = null) {
    // Create a simple placeholder command for history display
    const aiPlaceholder = {
      getDescription: () => description,
      execute: async () => {}, // No-op (already executed by AI)
      undo: async () => {
        console.warn('[UndoManager] AI actions cannot be undone through history system');
      },
      redo: async () => {},
      metadata: {
        timestamp: Date.now(),
        user,
        isAIAction: true
      }
    };
    
    this.undoStack.push(aiPlaceholder);
    this.redoStack = []; // Clear redo stack
    
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners();
    console.log('[UndoManager] AI action logged in history:', description);
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

