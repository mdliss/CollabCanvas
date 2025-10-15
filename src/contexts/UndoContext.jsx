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

  const execute = useCallback(async (command) => {
    return await undoManager.execute(command);
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

  const value = {
    ...state,
    execute,
    undo,
    redo,
    clear,
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

