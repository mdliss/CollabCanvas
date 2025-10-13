import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { writeCursor, watchCursors, clearCursor } from "../services/cursors";
import { generateUserColor } from "../services/presence";

/**
 * Hook to manage cursor positions
 * Uses direct stage event listeners for mouse tracking
 */
export default function useCursors(stageRef) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState({});
  const userColorRef = useRef(null);
  const userNameRef = useRef(null);

  // Initialize user info
  useEffect(() => {
    if (user?.uid) {
      userColorRef.current = generateUserColor(user.uid);
      userNameRef.current = user.displayName || user.email?.split('@')[0] || 'User';
      console.debug("[useCursors] init", user.uid);
    }
  }, [user]);

  // Mouse tracking + cursor subscription
  useEffect(() => {
    if (!user?.uid || !stageRef.current) return;

    const stage = stageRef.current;
    const uid = user.uid;
    
    // Mouse move handler with throttling and delta filtering
    const handleMouseMove = () => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert screen coordinates to canvas coordinates
      const x = (pointer.x - stage.position().x) / stage.scaleX();
      const y = (pointer.y - stage.position().y) / stage.scaleY();

      writeCursor(uid, x, y, userNameRef.current, userColorRef.current);
    };

    // Attach mouse listener
    stage.on('mousemove', handleMouseMove);

    // Watch all cursors
    const unsubscribe = watchCursors((all) => {
      // Filter out current user's cursor for rendering
      const remoteCursors = { ...all };
      delete remoteCursors[uid];
      setCursors(remoteCursors);
    });

    // Cleanup
    return () => {
      stage.off('mousemove', handleMouseMove);
      if (unsubscribe) unsubscribe();
      clearCursor(uid);
    };
  }, [user, stageRef]);

  return { cursors };
}

