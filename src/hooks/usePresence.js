import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { setUserOnline, setUserOffline, watchPresence, generateUserColor } from "../services/presence";

/**
 * Hook to manage user presence
 * Returns onlineUsers WITHOUT filtering self
 */
export default function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

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

  return { onlineUsers };
}

