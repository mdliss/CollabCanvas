import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UndoManager } from '../services/undo';

const UndoContext = createContext();

// Global canvas-specific managers (keyed by canvasId)
const canvasManagers = new Map();

/**
 * Get or create a canvas-specific undo manager
 */
function getCanvasManager(canvasId) {
  if (!canvasId) {
    // Legacy: use a default manager for non-canvas contexts
    if (!canvasManagers.has('__global__')) {
      canvasManagers.set('__global__', new UndoManager(canvasId));
    }
    return canvasManagers.get('__global__');
  }
  
  if (!canvasManagers.has(canvasId)) {
    console.log('[UndoContext] Creating new canvas-specific manager for:', canvasId);
    canvasManagers.set(canvasId, new UndoManager(canvasId));
  }
  
  return canvasManagers.get(canvasId);
}

/**
 * UndoProvider - Provides canvas-specific undo/redo functionality
 * 
 * Each canvas now has its own independent history that is shared among all editors.
 * 
 * @param {string} canvasId - Optional canvas ID for canvas-specific history
 */
export function UndoProvider({ children, canvasId = null }) {
  const [currentManager] = useState(() => {
    const manager = getCanvasManager(canvasId);
    console.log('[UndoProvider] Initializing with manager for canvas:', canvasId || 'global');
    return manager;
  });
  const [state, setState] = useState(() => currentManager.getState());

  useEffect(() => {
    // Expose canvas-specific manager to window for debugging
    if (typeof window !== 'undefined' && canvasId) {
      window.undoManager = currentManager;
      window.canvasManagers = canvasManagers; // Expose all managers
      console.log('🔵 [UndoContext] Exposed manager to window.undoManager for canvas:', canvasId);
    }
  }, [currentManager, canvasId]);

  useEffect(() => {
    // Subscribe to manager changes
    console.log('🔵 [UndoContext] Setting up listener for canvas:', canvasId || 'global');
    const removeListener = currentManager.addListener((newState) => {
      console.log('🔵 [UndoContext] State update received:', newState);
      setState(newState);
    });

    return () => {
      console.log('🔵 [UndoContext] Cleaning up listener for canvas:', canvasId || 'global');
      removeListener();
    };
  }, [currentManager, canvasId]);

  const execute = useCallback(async (command, user = null) => {
    return await currentManager.execute(command, user);
  }, [currentManager]);

  const undo = useCallback(async () => {
    return await currentManager.undo();
  }, [currentManager]);

  const redo = useCallback(async () => {
    return await currentManager.redo();
  }, [currentManager]);

  const clear = useCallback(() => {
    currentManager.clear();
  }, [currentManager]);

  const revertToPoint = useCallback(async (index) => {
    return await currentManager.revertToPoint(index);
  }, [currentManager]);

  const startBatch = useCallback((description) => {
    currentManager.startBatch(description);
  }, [currentManager]);

  const endBatch = useCallback(async () => {
    return await currentManager.endBatch();
  }, [currentManager]);

  const getFullHistory = useCallback(() => {
    return currentManager.getFullHistory();
  }, [currentManager]);

  const logAIAction = useCallback((description, user = null) => {
    currentManager.logAIAction(description, user);
  }, [currentManager]);
  
  const registerAIOperation = useCallback((aiCommand) => {
    currentManager.registerAIOperation(aiCommand);
  }, [currentManager]);

  const value = {
    ...state,
    execute,
    undo,
    redo,
    clear,
    revertToPoint,
    startBatch,
    endBatch,
    getFullHistory,
    logAIAction,
    registerAIOperation,
    getStackSizes: () => currentManager.getStackSizes()
  };

  return (
    <UndoContext.Provider value={value}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within UndoProvider');
  }
  return context;
}

