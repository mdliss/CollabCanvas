import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { undoManager } from '../services/undo';

const UndoContext = createContext();

export function UndoProvider({ children }) {
  const [state, setState] = useState(undoManager.getState());

  useEffect(() => {
    // Subscribe to undo manager changes
    const removeListener = undoManager.addListener((newState) => {
      setState(newState);
    });

    return removeListener;
  }, []);

  const execute = useCallback(async (command, user = null) => {
    return await undoManager.execute(command, user);
  }, []);

  const undo = useCallback(async () => {
    return await undoManager.undo();
  }, []);

  const redo = useCallback(async () => {
    return await undoManager.redo();
  }, []);

  const clear = useCallback(() => {
    undoManager.clear();
  }, []);

  const revertToPoint = useCallback(async (index) => {
    return await undoManager.revertToPoint(index);
  }, []);

  const startBatch = useCallback((description) => {
    undoManager.startBatch(description);
  }, []);

  const endBatch = useCallback(async () => {
    return await undoManager.endBatch();
  }, []);

  const getFullHistory = useCallback(() => {
    return undoManager.getFullHistory();
  }, []);

  const logAIAction = useCallback((description, user = null) => {
    undoManager.logAIAction(description, user);
  }, []);
  
  const registerAIOperation = useCallback((aiCommand) => {
    undoManager.registerAIOperation(aiCommand);
  }, []);

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
    getStackSizes: () => undoManager.getStackSizes()
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

