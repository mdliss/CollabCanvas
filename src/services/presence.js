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

/**
 * Global presence - Set user as online globally (for friends to see)
 */
export const setGlobalUserOnline = async (uid) => {
  if (!uid) return;

  const userRef = ref(rtdb, `globalPresence/${uid}`);
  
  await set(userRef, {
    online: true,
    lastSeen: serverTimestamp()
  });

  // Remove on disconnect
  await onDisconnect(userRef).remove();
};

/**
 * Check if a specific user is online
 */
export const isUserOnline = async (uid) => {
  try {
    const userRef = ref(rtdb, `globalPresence/${uid}`);
    const snapshot = await new Promise((resolve) => {
      onValue(userRef, (s) => resolve(s), { onlyOnce: true });
    });
    
    const data = snapshot.val();
    return data?.online === true;
  } catch (error) {
    console.error('[Presence] Failed to check online status:', error);
    return false;
  }
};

/**
 * Watch online status for multiple users (for friends list)
 */
export const watchMultipleUsersPresence = (userIds, callback) => {
  if (!userIds || userIds.length === 0) {
    callback({});
    return () => {};
  }

  const statuses = {};
  const unsubscribers = [];

  const updateCallback = () => {
    callback({ ...statuses });
  };

  userIds.forEach(uid => {
    const userRef = ref(rtdb, `globalPresence/${uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      statuses[uid] = data?.online === true;
      updateCallback();
    });
    unsubscribers.push(unsubscribe);
  });

  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

