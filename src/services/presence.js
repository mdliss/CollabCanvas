import { rtdb } from "./firebase";
import { ref, set, onValue, onDisconnect, serverTimestamp, remove } from "firebase/database";

/**
 * Get presence base path for a canvas
 */
const getPresencePath = (canvasId) => `sessions/${canvasId}`;

export const generateUserColor = (uid) => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
  ];
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const setUserOnline = async (canvasId, uid, name, color, photoURL = null) => {
  if (!uid) return;

  const userRef = ref(rtdb, `${getPresencePath(canvasId)}/${uid}`);
  
  const data = {
    displayName: name,
    cursorColor: color,
    online: true,
    lastSeen: serverTimestamp()
  };

  // Add photoURL if available
  if (photoURL) {
    data.photoURL = photoURL;
  }

  await set(userRef, data);

  // CRITICAL FIX: Remove user completely on disconnect (not just mark offline)
  await onDisconnect(userRef).remove();
};

export const setUserOffline = async (canvasId, uid) => {
  if (!uid) return;
  
  const userRef = ref(rtdb, `${getPresencePath(canvasId)}/${uid}`);
  await remove(userRef);
};

export const watchPresence = (canvasId, callback) => {
  return onValue(ref(rtdb, getPresencePath(canvasId)), (s) => {
    const v = s.val() || {};
    // Only include users who are actually online with valid data
    const arr = Object.entries(v)
      .filter(([, x]) => {
        // CRITICAL FIX: Only include entries that are explicitly online AND have valid displayName
        // This prevents "User" fallback for corrupted/partial entries
        return x && x.online === true && x.displayName && x.displayName.trim().length > 0;
      })
      .map(([uid, x]) => ({
        uid,
        displayName: x.displayName,
        color: x.cursorColor || '#666',
        photoURL: x.photoURL || null,
        online: true
      }));
    callback(arr);
  });
};

