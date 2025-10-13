import { rtdb } from "./firebase";
import { ref, onValue, set, remove, serverTimestamp } from "firebase/database";

const CANVAS_ID = "global-canvas-v1";
const RTDB_SELECT = `/selections/${CANVAS_ID}`;

/**
 * Set selection for a shape
 * @param {string} shapeId - Shape ID
 * @param {string} uid - User ID
 * @param {string} name - Display name
 * @param {string} color - User color
 */
export const setSelection = (shapeId, uid, name, color) => {
  const selectionRef = ref(rtdb, `${RTDB_SELECT}/${shapeId}`);
  set(selectionRef, {
    uid,
    name,
    color,
    ts: serverTimestamp()
  });
};

/**
 * Clear selection for a shape
 * @param {string} shapeId - Shape ID
 */
export const clearSelection = (shapeId) => {
  const selectionRef = ref(rtdb, `${RTDB_SELECT}/${shapeId}`);
  remove(selectionRef);
};

/**
 * Watch all selections
 * @param {Function} cb - Callback with selections object
 * @returns {Function} Unsubscribe function
 */
export const watchSelections = (cb) => {
  const selectionsRef = ref(rtdb, RTDB_SELECT);
  return onValue(selectionsRef, (snap) => {
    cb(snap.val() || {});
  });
};

