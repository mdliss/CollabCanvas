import { rtdb } from "./firebase";
import { ref, set, onValue, onDisconnect, remove } from "firebase/database";

const BASE = 'drags/global-canvas-v1';

// Store last broadcast state per shape for delta compression
const lastBroadcastState = new Map();

/**
 * CRITICAL FIX #2: Enhanced drag stream with dimension broadcasting
 * 
 * Streams complete transformation state with delta compression to reduce bandwidth.
 * Now includes width and height dimensions for real-time resize visibility.
 * 
 * This fix addresses BUG #2: "Resize Operations Not Visible to Remote Users"
 * Remote users now see smooth dimension changes at 100Hz during active resize operations.
 * 
 * @param {string} shapeId - Shape ID
 * @param {string} uid - User ID
 * @param {string} displayName - User display name
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} rotation - Rotation in degrees
 * @param {number} [width] - Optional width dimension (for resize operations)
 * @param {number} [height] - Optional height dimension (for resize operations)
 * 
 * @example
 * // During drag (position only)
 * streamDragPosition(shapeId, uid, name, 100, 200, 0);
 * 
 * @example
 * // During resize (position + dimensions)
 * streamDragPosition(shapeId, uid, name, 100, 200, 0, 250, 150);
 */
export const streamDragPosition = async (shapeId, uid, displayName, x, y, rotation = 0, width = null, height = null) => {
  if (!shapeId || !uid) return;
  
  const lastState = lastBroadcastState.get(shapeId);
  const currentState = {
    x: Math.round(x * 100) / 100, // Round to 2 decimal places
    y: Math.round(y * 100) / 100,
    rotation: Math.round(rotation * 100) / 100,
    // FIX #2: Include dimensions if provided (for transform operations)
    width: width !== null ? Math.round(width * 100) / 100 : null,
    height: height !== null ? Math.round(height * 100) / 100 : null
  };

  // Check if any property changed
  const hasChanges = !lastState || 
    currentState.x !== lastState.x ||
    currentState.y !== lastState.y ||
    currentState.rotation !== lastState.rotation ||
    currentState.width !== lastState.width ||
    currentState.height !== lastState.height;

  // Only broadcast if something actually changed
  if (hasChanges) {
    // LATENCY MEASUREMENT: Record send timestamp for measuring round-trip time
    const sendTimestamp = performance.now();
    
    // CRITICAL FIX #2: Always send ALL properties, including dimensions
    // This allows remote users to see dimension changes in real-time
    const dragData = {
      uid,
      displayName,
      timestamp: Date.now(),
      sendTimestamp, // For latency measurement
      x: currentState.x,
      y: currentState.y,
      rotation: currentState.rotation
    };
    
    // FIX #2: Include dimensions if provided (during resize/transform)
    // Remote users will receive these and update their local rendering
    if (currentState.width !== null) {
      dragData.width = currentState.width;
    }
    if (currentState.height !== null) {
      dragData.height = currentState.height;
    }
    
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

