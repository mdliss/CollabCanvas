import { rtdb } from "./firebase";
import { ref, onValue, set, remove, serverTimestamp } from "firebase/database";

/**
 * Get selections path for a canvas
 */
const getSelectionsPath = (canvasId) => `/selections/${canvasId}`;

/**
 * Set selection for a shape
 * @param {string} canvasId - Canvas ID
 * @param {string} shapeId - Shape ID
 * @param {string} uid - User ID
 * @param {string} name - Display name
 * @param {string} color - User color
 */
export const setSelection = (canvasId, shapeId, uid, name, color) => {
  const selectionRef = ref(rtdb, `${getSelectionsPath(canvasId)}/${shapeId}`);
  set(selectionRef, {
    uid,
    name,
    color,
    ts: serverTimestamp()
  });
};

/**
 * Clear selection for a shape
 * @param {string} canvasId - Canvas ID
 * @param {string} shapeId - Shape ID
 */
export const clearSelection = (canvasId, shapeId) => {
  const selectionRef = ref(rtdb, `${getSelectionsPath(canvasId)}/${shapeId}`);
  remove(selectionRef);
};

/**
 * Watch all selections for a canvas
 * @param {string} canvasId - Canvas ID
 * @param {Function} cb - Callback with selections object
 * @returns {Function} Unsubscribe function
 */
export const watchSelections = (canvasId, cb) => {
  const selectionsRef = ref(rtdb, getSelectionsPath(canvasId));
  return onValue(selectionsRef, (snap) => {
    cb(snap.val() || {});
  });
};

