import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { watchDragStreams } from "../services/dragStream";

/**
 * Hook to watch real-time drag streams from other users
 * Measures object sync latency for performance monitoring
 * @returns {Object} activeDrags - Map of {shapeId: {uid, displayName, x, y, rotation, timestamp}}
 */
export default function useDragStreams() {
  const { user } = useAuth();
  const [activeDrags, setActiveDrags] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = watchDragStreams((drags) => {
      const receiveTime = performance.now();
      
      // Filter out current user's drags (we see our own locally)
      const remoteDrags = {};
      Object.entries(drags).forEach(([shapeId, dragData]) => {
        if (dragData.uid !== user.uid) {
          // LATENCY MEASUREMENT: Calculate object sync latency
          if (dragData.sendTimestamp && typeof window !== 'undefined' && window.performanceMonitor) {
            const latency = receiveTime - dragData.sendTimestamp;
            window.performanceMonitor.trackObjectSyncLatency(latency);
          }
          
          remoteDrags[shapeId] = dragData;
        }
      });
      
      setActiveDrags(remoteDrags);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { activeDrags };
}

