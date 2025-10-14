import { rtdb } from "./firebase";
import { ref, set, onValue, onDisconnect, serverTimestamp, remove } from "firebase/database";

const BASE = 'sessions/global-canvas-v1';

export const generateUserColor = (uid) => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
  ];
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

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

  // CRITICAL FIX: Remove user completely on disconnect (not just mark offline)
  await onDisconnect(userRef).remove();
  
  console.log('[Presence] User set online with auto-disconnect:', uid);
};

export const setUserOffline = async (uid) => {
  if (!uid) return;
  
  const userRef = ref(rtdb, `${BASE}/${uid}`);
  await remove(userRef);
  
  console.log('[Presence] User removed from presence:', uid);
};

export const watchPresence = (callback) => {
  return onValue(ref(rtdb, BASE), (s) => {
    const v = s.val() || {};
    // Only include users who are actually online (they exist in the tree)
    const arr = Object.entries(v)
      .filter(([, x]) => x.online !== false)
      .map(([uid, x]) => ({
        uid,
        displayName: x.displayName || 'User',
        color: x.cursorColor || '#666',
        online: true
      }));
    console.log('[Presence] Online users count:', arr.length);
    callback(arr);
  });
};

