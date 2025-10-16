import { rtdb } from "./firebase";
import { ref, set, onValue, onDisconnect, remove } from "firebase/database";

const BASE = 'drags/global-canvas-v1';

// Store last broadcast state per shape for delta compression
const lastBroadcastState = new Map();

/**
 * Stream drag position with delta compression
 * Only sends properties that changed to reduce bandwidth
 * @param {string} shapeId - Shape ID
 * @param {string} uid - User ID
 * @param {string} displayName - User display name
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} rotation - Rotation in degrees
 */
export const streamDragPosition = async (shapeId, uid, displayName, x, y, rotation = 0) => {
  if (!shapeId || !uid) return;
  
  const lastState = lastBroadcastState.get(shapeId);
  const currentState = {
    x: Math.round(x * 100) / 100, // Round to 2 decimal places
    y: Math.round(y * 100) / 100,
    rotation: Math.round(rotation * 100) / 100
  };

  // Check if any coordinate changed
  const hasChanges = !lastState || 
    currentState.x !== lastState.x ||
    currentState.y !== lastState.y ||
    currentState.rotation !== lastState.rotation;

  // Only broadcast if something actually changed
  if (hasChanges) {
    // CRITICAL FIX: Always send ALL coordinates, never partial deltas
    // This prevents missing x/y/rotation causing shapes to jump
    const dragData = {
      uid,
      displayName,
      timestamp: Date.now(),
      x: currentState.x,
      y: currentState.y,
      rotation: currentState.rotation
    };
    
    const dragRef = ref(rtdb, `${BASE}/${shapeId}`);
    await set(dragRef, dragData);
    await onDisconnect(dragRef).remove();
    lastBroadcastState.set(shapeId, currentState);
  } else {
    // Track skipped update for performance metrics
    if (typeof window !== 'undefined' && window.performanceMonitor) {
      window.performanceMonitor.trackDragUpdateSkipped();
    }
  }
};

/**
 * Stop drag stream and clear cached state
 * @param {string} shapeId - Shape ID
 */
export const stopDragStream = async (shapeId) => {
  if (!shapeId) return;
  
  // Clear cached state for this shape
  lastBroadcastState.delete(shapeId);
  
  const dragRef = ref(rtdb, `${BASE}/${shapeId}`);
  await remove(dragRef);
  await onDisconnect(dragRef).cancel();
};

export const watchDragStreams = (callback) => {
  const dragsRef = ref(rtdb, BASE);
  return onValue(dragsRef, (snapshot) => {
    const drags = snapshot.val() || {};
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

