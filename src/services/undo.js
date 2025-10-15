/**
 * Undo/Redo Manager
 * Manages command history with undo and redo stacks
 */

class UndoManager {
  constructor(maxHistorySize = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistorySize = maxHistorySize;
    this.listeners = new Set();
  }

  /**
   * Execute a command and add it to the undo stack
   */
  async execute(command) {
    try {
      await command.execute();
      
      // Add to undo stack
      this.undoStack.push(command);
      
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
   * Undo the last command
   */
  async undo() {
    if (!this.canUndo()) {
      console.warn('[UndoManager] Nothing to undo');
      return null;
    }

    const command = this.undoStack.pop();
    
    try {
      await command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
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
    
    try {
      await command.redo();
      this.undoStack.push(command);
      this.notifyListeners();
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
}

// Singleton instance
export const undoManager = new UndoManager();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.undoManager = undoManager;
}

