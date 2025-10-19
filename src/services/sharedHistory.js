/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared History Service - Canvas-Specific Undo/Redo
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages canvas-specific undo/redo history shared among all editors.
 * 
 * ARCHITECTURE:
 * - Each canvas has its own independent history stack in RTDB
 * - History is shared among all users with edit access
 * - Commands are serialized to RTDB and reconstructed on load
 * - Real-time sync ensures all users see the same undo/redo state
 * 
 * DATABASE STRUCTURE:
 * /history/{canvasId}/
 *   commands/
 *     {commandId}: {
 *       id: "cmd_123",
 *       type: "create" | "update" | "delete" | "move" | "batch",
 *       description: "Created rectangle",
 *       timestamp: 1234567890,
 *       userId: "user_123",
 *       userName: "John Doe",
 *       data: { ... }, // Command-specific data for reconstruction
 *       status: "done" | "undone"
 *     }
 *   currentIndex: 5  // Points to the current command in history
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { rtdb } from "./firebase";
import { ref, set, update, remove, onValue, get, push, runTransaction } from "firebase/database";

/**
 * Subscribe to canvas history changes
 * 
 * @param {string} canvasId - Canvas ID
 * @param {Function} callback - Called with {commands: [], currentIndex: number}
 * @returns {Function} Unsubscribe function
 */
export const subscribeToHistory = (canvasId, callback) => {
  const historyRef = ref(rtdb, `history/${canvasId}`);
  
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val() || {};
    const commands = data.commands || {};
    const currentIndex = data.currentIndex ?? -1;
    
    // Convert to array and sort by timestamp
    const commandArray = Object.values(commands).sort((a, b) => a.timestamp - b.timestamp);
    
    callback({
      commands: commandArray,
      currentIndex
    });
  });
};

/**
 * Add a command to the history stack
 * 
 * @param {string} canvasId - Canvas ID
 * @param {Object} commandData - Serialized command data
 * @returns {Promise<string>} Command ID
 */
export const addCommand = async (canvasId, commandData) => {
  const commandsRef = ref(rtdb, `history/${canvasId}/commands`);
  const newCommandRef = push(commandsRef);
  const commandId = newCommandRef.key;
  
  const command = {
    id: commandId,
    ...commandData,
    timestamp: commandData.timestamp || Date.now(),
    status: 'done'
  };
  
  await set(newCommandRef, command);
  
  // Update current index to point to this new command
  const historyRef = ref(rtdb, `history/${canvasId}`);
  await runTransaction(historyRef, (current) => {
    if (!current) {
      return {
        commands: { [commandId]: command },
        currentIndex: 0
      };
    }
    
    const commandsArray = Object.values(current.commands || {}).sort((a, b) => a.timestamp - b.timestamp);
    const newIndex = commandsArray.length; // New command will be at the end
    
    return {
      ...current,
      currentIndex: newIndex
    };
  });
  
  console.log('[SharedHistory] Command added:', commandId, commandData.description);
  return commandId;
};

/**
 * Undo the last command
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Object>} The undone command data
 */
export const undoCommand = async (canvasId) => {
  const historyRef = ref(rtdb, `history/${canvasId}`);
  
  return await runTransaction(historyRef, (current) => {
    if (!current || current.currentIndex === undefined || current.currentIndex < 0) {
      return current; // Nothing to undo
    }
    
    const commandsArray = Object.values(current.commands || {}).sort((a, b) => a.timestamp - b.timestamp);
    const currentCommand = commandsArray[current.currentIndex];
    
    if (!currentCommand) {
      return current;
    }
    
    // Mark current command as undone
    const updatedCommands = { ...current.commands };
    updatedCommands[currentCommand.id] = {
      ...currentCommand,
      status: 'undone'
    };
    
    return {
      ...current,
      commands: updatedCommands,
      currentIndex: current.currentIndex - 1
    };
  }).then(result => {
    const commandsArray = Object.values(result.snapshot.val()?.commands || {}).sort((a, b) => a.timestamp - b.timestamp);
    const undoneCommand = commandsArray[result.snapshot.val().currentIndex + 1];
    console.log('[SharedHistory] Undo performed:', undoneCommand?.description);
    return undoneCommand;
  });
};

/**
 * Redo the last undone command
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Object>} The redone command data
 */
export const redoCommand = async (canvasId) => {
  const historyRef = ref(rtdb, `history/${canvasId}`);
  
  return await runTransaction(historyRef, (current) => {
    if (!current || current.commands === undefined) {
      return current; // Nothing to redo
    }
    
    const commandsArray = Object.values(current.commands || {}).sort((a, b) => a.timestamp - b.timestamp);
    const nextIndex = (current.currentIndex ?? -1) + 1;
    
    if (nextIndex >= commandsArray.length) {
      return current; // Nothing to redo
    }
    
    const nextCommand = commandsArray[nextIndex];
    
    // Mark next command as done
    const updatedCommands = { ...current.commands };
    updatedCommands[nextCommand.id] = {
      ...nextCommand,
      status: 'done'
    };
    
    return {
      ...current,
      commands: updatedCommands,
      currentIndex: nextIndex
    };
  }).then(result => {
    const commandsArray = Object.values(result.snapshot.val()?.commands || {}).sort((a, b) => a.timestamp - b.timestamp);
    const redoneCommand = commandsArray[result.snapshot.val().currentIndex];
    console.log('[SharedHistory] Redo performed:', redoneCommand?.description);
    return redoneCommand;
  });
};

/**
 * Clear all history for a canvas
 * 
 * @param {string} canvasId - Canvas ID
 */
export const clearHistory = async (canvasId) => {
  const historyRef = ref(rtdb, `history/${canvasId}`);
  await remove(historyRef);
  console.log('[SharedHistory] History cleared for canvas:', canvasId);
};

/**
 * Get current history state
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Object>} {commands: [], currentIndex: number}
 */
export const getHistoryState = async (canvasId) => {
  const historyRef = ref(rtdb, `history/${canvasId}`);
  const snapshot = await get(historyRef);
  
  if (!snapshot.exists()) {
    return { commands: [], currentIndex: -1 };
  }
  
  const data = snapshot.val();
  const commands = data.commands || {};
  const currentIndex = data.currentIndex ?? -1;
  
  const commandArray = Object.values(commands).sort((a, b) => a.timestamp - b.timestamp);
  
  return {
    commands: commandArray,
    currentIndex
  };
};

