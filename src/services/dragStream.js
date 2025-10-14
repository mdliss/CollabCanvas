import { rtdb } from "./firebase";
import { ref, set, onValue, onDisconnect, remove, serverTimestamp } from "firebase/database";

const BASE = 'drags/global-canvas-v1';

/**
 * Start streaming drag position to RTDB
 * @param {string} shapeId - Shape being dragged
 * @param {string} uid - User ID
 * @param {string} displayName - User's display name
 * @param {number} x - Canvas X position
 * @param {number} y - Canvas Y position
 * @param {number} rotation - Shape rotation
 */
export const streamDragPosition = async (shapeId, uid, displayName, x, y, rotation = 0) => {
  if (!shapeId || !uid) return;
  
  const dragRef = ref(rtdb, `${BASE}/${shapeId}`);
  
  const data = {
    uid,
    displayName,
    x,
    y,
    rotation,
    timestamp: Date.now()
  };
  
  await set(dragRef, data);
  
  // Setup auto-cleanup on disconnect
  await onDisconnect(dragRef).remove();
};

/**
 * Stop streaming drag (on dragend)
 * @param {string} shapeId - Shape ID
 */
export const stopDragStream = async (shapeId) => {
  if (!shapeId) return;
  
  const dragRef = ref(rtdb, `${BASE}/${shapeId}`);
  await remove(dragRef);
  
  // Cancel onDisconnect since we're explicitly removing
  await onDisconnect(dragRef).cancel();
};

/**
 * Watch all active drag streams
 * @param {Function} callback - Called with {shapeId: {uid, displayName, x, y, rotation, timestamp}}
 * @returns {Function} Unsubscribe function
 */
export const watchDragStreams = (callback) => {
  const dragsRef = ref(rtdb, BASE);
  
  return onValue(dragsRef, (snapshot) => {
    const drags = snapshot.val() || {};
    
    // Filter out stale drags (>300ms old)
    const now = Date.now();
    const activeDrags = {};
    
    Object.entries(drags).forEach(([shapeId, dragData]) => {
      if (dragData.timestamp && (now - dragData.timestamp) < 300) {
        activeDrags[shapeId] = dragData;
      }
    });
    
    callback(activeDrags);
  });
};

/**
 * Clean up stale drag sessions
 * Called periodically to remove abandoned streams
 */
export const cleanStaleDrags = async () => {
  // This is handled by the watchDragStreams filter and onDisconnect
  // No explicit cleanup needed as RTDB handles it
};

