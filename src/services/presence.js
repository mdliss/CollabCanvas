import { rtdb } from "./firebase";
import { ref, set, update, onValue, onDisconnect, serverTimestamp } from "firebase/database";

const BASE = 'sessions/global-canvas-v1';

// Generate a stable color for user
export const generateUserColor = (uid) => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
  ];
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

/**
 * Set user online with presence data
 * @param {string} uid - User ID
 * @param {string} name - Display name
 * @param {string} color - User color
 */
export const setUserOnline = async (uid, name, color) => {
  if (!uid) return;

  const userRef = ref(rtdb, `${BASE}/${uid}`);
  
  const data = {
    displayName: name,
    cursorColor: color,
    online: true,
    lastSeen: serverTimestamp()
  };

  await set(userRef, data);

  // Configure disconnect behavior
  await onDisconnect(userRef).update({
    online: false,
    cursorX: null,
    cursorY: null,
    lastSeen: serverTimestamp()
  });
};

/**
 * Set user offline
 * @param {string} uid - User ID
 */
export const setUserOffline = async (uid) => {
  if (!uid) return;
  
  const userRef = ref(rtdb, `${BASE}/${uid}`);
  await update(userRef, {
    online: false,
    lastSeen: serverTimestamp()
  });
};

/**
 * Watch presence updates for all users
 * @param {Function} callback - Called with array of {uid, displayName, color, online}
 * @returns {Function} Unsubscribe function
 */
export const watchPresence = (callback) => {
  return onValue(ref(rtdb, BASE), (s) => {
    const v = s.val() || {};
    const arr = Object.entries(v).map(([uid, x]) => ({
      uid,
      displayName: x.displayName || 'User',
      color: x.cursorColor || '#666',
      online: !!x.online
    }));
    console.debug('[presence] emit size:', Object.keys(v).length);
    callback(arr);
  });
};

