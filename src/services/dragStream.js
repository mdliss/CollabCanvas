import { rtdb } from "./firebase";
import { ref, set, onValue, onDisconnect, remove } from "firebase/database";

const BASE = 'drags/global-canvas-v1';

export const streamDragPosition = async (shapeId, uid, displayName, x, y, rotation = 0) => {
  if (!shapeId || !uid) return;
  
  const dragRef = ref(rtdb, `${BASE}/${shapeId}`);
  await set(dragRef, {
    uid,
    displayName,
    x,
    y,
    rotation,
    timestamp: Date.now()
  });
  await onDisconnect(dragRef).remove();
};

export const stopDragStream = async (shapeId) => {
  if (!shapeId) return;
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

