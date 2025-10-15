import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { setUserOnline, setUserOffline, watchPresence, generateUserColor } from "../services/presence";
import { doc, onSnapshot } from "firebase/firestore";
import { db, rtdb } from "../services/firebase";
import { ref, update } from "firebase/database";

/**
 * Hook to manage user presence
 * Returns onlineUsers WITHOUT filtering self
 * Syncs photoURL and displayName from Firestore to RTDB automatically
 */
export default function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Main presence effect
  useEffect(() => {
    if (!user?.uid) return;

    const uid = user.uid;
    const name = user.displayName || user.email?.split('@')[0] || 'User';
    const color = generateUserColor(uid) || '#1e88e5';
    const photoURL = user.photoURL || null;

    console.log('[usePresence] Setting user online:', uid, name, photoURL ? '(with photo)' : '(no photo)');

    setUserOnline(uid, name, color, photoURL);

    const unsub = watchPresence(setOnlineUsers);

    return () => {
      console.log('[usePresence] CLEANUP: Removing user from presence:', uid);
      if (unsub) unsub();
      setUserOffline(uid);
    };
  }, [user]);

  // Watch Firestore profile for photoURL AND displayName changes and sync to RTDB
  useEffect(() => {
    if (!user?.uid) return;

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
        const sessionRef = ref(rtdb, `sessions/global-canvas-v1/${user.uid}`);
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
  }, [user?.uid, user?.displayName, user?.email]);

  return { onlineUsers };
}