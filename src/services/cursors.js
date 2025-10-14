import { rtdb } from "./firebase";
import { ref, update, onValue, serverTimestamp, onDisconnect } from "firebase/database";

const BASE = 'sessions/global-canvas-v1';
const THROTTLE_MS = 33;

let lastUpdateTime = 0;
let pendingUpdate = null;
let updateTimer = null;
let lastX = null;
let lastY = null;
let disconnectSet = new Set();

export const writeCursor = (uid, x, y, name, color) => {
  if (!uid) return;

  if (lastX !== null && lastY !== null) {
    const dx = Math.abs(x - lastX);
    const dy = Math.abs(y - lastY);
    if (dx < 2 && dy < 2) return;
  }

  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;

  pendingUpdate = { uid, x, y, name, color };

  if (timeSinceLastUpdate >= THROTTLE_MS) {
    flushCursorUpdate();
  } else if (!updateTimer) {
    const delay = THROTTLE_MS - timeSinceLastUpdate;
    updateTimer = setTimeout(() => {
      flushCursorUpdate();
    }, delay);
  }
};

const flushCursorUpdate = () => {
  if (!pendingUpdate) return;

  const { uid, x, y, name, color } = pendingUpdate;
  const userRef = ref(rtdb, `${BASE}/${uid}`);
  
  update(userRef, {
    cursorX: Math.round(x),
    cursorY: Math.round(y),
    displayName: name,
    cursorColor: color,
    online: true,
    lastSeen: serverTimestamp()
  });

  // Set up onDisconnect once per user
  if (!disconnectSet.has(uid)) {
    onDisconnect(userRef).update({
      cursorX: null,
      cursorY: null
    });
    disconnectSet.add(uid);
  }

  lastX = x;
  lastY = y;
  lastUpdateTime = Date.now();
  pendingUpdate = null;
  updateTimer = null;
};

/**
 * Watch cursor updates for all users
 * @param {Function} callback - Called with object keyed by uid: {x, y, name, color}
 * @returns {Function} Unsubscribe function
 */
export const watchCursors = (callback) => {
  return onValue(ref(rtdb, BASE), (snapshot) => {
    const val = snapshot.val() || {};
    const out = {};
    
    for (const [uid, x] of Object.entries(val)) {
      if (typeof x.cursorX === 'number' && typeof x.cursorY === 'number') {
        out[uid] = {
          x: x.cursorX,
          y: x.cursorY,
          name: x.displayName || 'User',
          color: x.cursorColor || '#666'
        };
      }
    }

    console.debug('[cursor] emit size:', Object.keys(out).length);
    callback(out);
  });
};

/**
 * Clear cursor for user
 * @param {string} uid - User ID
 */
export const clearCursor = (uid) => {
  if (!uid) return;
  
  const userRef = ref(rtdb, `${BASE}/${uid}`);
  update(userRef, {
    cursorX: null,
    cursorY: null,
    lastSeen: serverTimestamp()
  });
};

