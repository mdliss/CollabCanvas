import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { setUserOnline, setUserOffline, watchPresence, generateUserColor } from "../services/presence";
import { doc, onSnapshot } from "firebase/firestore";
import { db, rtdb } from "../services/firebase";
import { ref, update } from "firebase/database";

/**
 * Hook to manage user presence for a specific canvas
 * Returns onlineUsers WITHOUT filtering self
 * Syncs photoURL and displayName from Firestore to RTDB automatically
 * 
 * @param {string} canvasId - Canvas ID for presence tracking
 */
export default function usePresence(canvasId = 'global-canvas-v1') {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Main presence effect
  useEffect(() => {
    if (!user?.uid || !canvasId) {
      console.log('[usePresence] Skipping - no user or canvasId');
      return;
    }

    const uid = user.uid;
    const name = user.displayName || user.email?.split('@')[0] || 'User';
    const color = generateUserColor(uid) || '#1e88e5';
    const photoURL = user.photoURL || null;

    console.log('[usePresence] Setting user online:', uid, name, photoURL ? '(with photo)' : '(no photo)', 'Canvas:', canvasId);

    // Set user online
    setUserOnline(canvasId, uid, name, color, photoURL).then(() => {
      console.log('[usePresence] ✅ User marked online in RTDB');
    }).catch(err => {
      console.error('[usePresence] ❌ Failed to mark user online:', err);
    });

    // Watch all online users
    console.log('[usePresence] Starting to watch presence for canvas:', canvasId);
    const unsub = watchPresence(canvasId, (users) => {
      console.log('[usePresence] 👥 Online users updated:', users.length, 'users');
      setOnlineUsers(users);
    });

    return () => {
      console.log('[usePresence] CLEANUP: Removing user from presence:', uid, 'Canvas:', canvasId);
      if (unsub) unsub();
      setUserOffline(canvasId, uid);
    };
  }, [user?.uid, canvasId]);

  // Watch Firestore profile for photoURL AND displayName changes and sync to RTDB
  useEffect(() => {
    if (!user?.uid || !canvasId) return;

    console.log('[usePresence] Setting up Firestore profile watcher for user:', user.uid);

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data();
        const newPhotoURL = profile.photoURL || null;
        const newDisplayName = profile.displayName || user.displayName || user.email?.split('@')[0] || 'User';
        
        console.log('[usePresence] Firestore profile changed:');
        console.log('[usePresence] - photoURL:', newPhotoURL);
        console.log('[usePresence] - displayName:', newDisplayName);

        // Update RTDB with new photoURL AND displayName
        const sessionRef = ref(rtdb, `sessions/${canvasId}/${user.uid}`);
        update(sessionRef, { 
          photoURL: newPhotoURL,
          displayName: newDisplayName
        })
          .then(() => {
            console.log('[usePresence] ✅ RTDB profile updated successfully');
          })
          .catch((err) => {
            console.error('[usePresence] ❌ Failed to update RTDB profile:', err);
          });
      }
    }, (error) => {
      console.error('[usePresence] Firestore snapshot error:', error);
    });

    return unsubscribe;
  }, [user?.uid, user?.displayName, user?.email, canvasId]);

  return { onlineUsers };
}