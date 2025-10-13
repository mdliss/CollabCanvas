import { db } from "./firebase";
import { doc, onSnapshot, serverTimestamp, setDoc, runTransaction, getDoc } from "firebase/firestore";

// Single document path: canvas/global-canvas-v1
const getCanvasDoc = (canvasId) => doc(db, "canvas", canvasId);

/**
 * Ensure canvas document exists, create if missing
 */
const ensureCanvasDoc = async (canvasId) => {
  const canvasRef = getCanvasDoc(canvasId);
  const docSnap = await getDoc(canvasRef);
  if (!docSnap.exists()) {
    console.info("[ensureCanvasDoc] Creating", canvasId);
    await setDoc(canvasRef, {
      canvasId,
      shapes: [],
      lastUpdated: serverTimestamp()
    });
  }
};

/**
 * Subscribe to shape changes for a canvas
 * @param {string} canvasId - Canvas document ID (e.g., "global-canvas-v1")
 * @param {Function} callback - Called with shapes array on each update
 * @returns {Function} Unsubscribe function
 */
export const subscribeToShapes = async (canvasId, callback) => {
  await ensureCanvasDoc(canvasId);
  
  return onSnapshot(getCanvasDoc(canvasId), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const shapes = data.shapes || [];
      console.info("[subscribe]", canvasId, "count:", shapes.length);
      callback(shapes);
    } else {
      console.warn("[subscribe]", canvasId, "doc missing, re-initializing");
      // Initialize empty canvas document if it doesn't exist
      setDoc(getCanvasDoc(canvasId), {
        canvasId,
        shapes: [],
        lastUpdated: serverTimestamp()
      }).then(() => callback([]));
    }
  });
};

/**
 * Create a new shape on the canvas
 * Uses transaction to avoid race conditions when multiple users create shapes simultaneously
 * @param {string} canvasId - Canvas document ID
 * @param {Object} shapeData - Shape properties (x, y, width, height, etc.)
 * @param {Object} user - User object with uid and displayName
 */
export const createShape = async (canvasId, shapeData, user) => {
  try {
    console.info("[createShape] Starting...", canvasId);
    const canvasRef = getCanvasDoc(canvasId);
    
    const newShape = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: shapeData.type || 'rectangle',
      x: shapeData.x || 200,
      y: shapeData.y || 200,
      width: shapeData.width || 100,
      height: shapeData.height || 100,
      fill: shapeData.fill || '#cccccc',
      createdBy: user?.uid || 'anonymous',
      createdAt: Date.now(),
      lastModifiedBy: user?.uid || 'anonymous',
      lastModifiedAt: Date.now(),
      isLocked: false,
      lockedBy: null,
      lockedAt: null
    };

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) {
        // Initialize document if it doesn't exist
        transaction.set(canvasRef, {
          canvasId,
          shapes: [newShape],
          lastUpdated: serverTimestamp()
        });
      } else {
        // Append to existing shapes array
        const currentShapes = docSnap.data().shapes || [];
        transaction.update(canvasRef, {
          shapes: [...currentShapes, newShape],
          lastUpdated: serverTimestamp()
        });
      }
    });
    
    console.info("[createShape] Success", newShape.id);
  } catch (error) {
    console.error("[createShape] Failed:", error);
    throw error;
  }
};

/**
 * Update an existing shape
 * Uses transaction to avoid race conditions when multiple users update shapes
 * Respects locks - only allows update if shape is unlocked or locked by the requesting user
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to update
 * @param {Object} updates - Properties to update
 * @param {Object} user - User object with uid
 */
export const updateShape = async (canvasId, shapeId, updates, user) => {
  try {
    console.info("[updateShape] Starting...", shapeId);
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
          // Respect locks: only update if not locked or locked by current user
          if (shape.isLocked && shape.lockedBy !== user?.uid) {
            console.warn("[updateShape] Shape locked by another user", shapeId);
            return shape; // Skip update
          }
          return {
            ...shape,
            ...updates,
            lastModifiedBy: user?.uid || 'anonymous',
            lastModifiedAt: Date.now()
          };
        }
        return shape;
      });
      
      transaction.update(canvasRef, {
        shapes: updatedShapes,
        lastUpdated: serverTimestamp()
      });
    });
    
    console.info("[updateShape] Success", shapeId);
  } catch (error) {
    console.error("[updateShape] Failed:", error);
    throw error;
  }
};

/**
 * Delete a shape from the canvas
 * Uses transaction to avoid race conditions
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to delete
 */
export const deleteShape = async (canvasId, shapeId) => {
  try {
    console.info("[deleteShape] Starting...", shapeId);
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const filteredShapes = shapes.filter(shape => shape.id !== shapeId);
      
      transaction.update(canvasRef, {
        shapes: filteredShapes,
        lastUpdated: serverTimestamp()
      });
    });
    
    console.info("[deleteShape] Success", shapeId);
  } catch (error) {
    console.error("[deleteShape] Failed:", error);
    throw error;
  }
};

/**
 * Try to acquire a lock on a shape
 * First-touch wins with TTL expiration
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to lock
 * @param {string} userId - User ID attempting to lock
 * @param {number} ttlMs - Lock TTL in milliseconds (default 4000ms)
 * @returns {Promise<boolean>} True if lock acquired, false if already locked by another user
 */
export const tryLockShape = async (canvasId, shapeId, userId, ttlMs = 4000) => {
  try {
    console.info("[tryLockShape] Starting...", shapeId, userId);
    const canvasRef = getCanvasDoc(canvasId);
    let lockAcquired = false;
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const now = Date.now();
      
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
          // Check if shape is unlocked or lock has expired
          const lockExpired = shape.lockedAt && (now - shape.lockedAt > ttlMs);
          
          if (!shape.isLocked || lockExpired || shape.lockedBy === userId) {
            // Acquire lock
            lockAcquired = true;
            return {
              ...shape,
              isLocked: true,
              lockedBy: userId,
              lockedAt: now
            };
          } else {
            // Lock held by another user
            console.warn("[tryLockShape] Already locked by", shape.lockedBy);
            return shape;
          }
        }
        return shape;
      });
      
      transaction.update(canvasRef, {
        shapes: updatedShapes,
        lastUpdated: serverTimestamp()
      });
    });
    
    console.info("[tryLockShape]", lockAcquired ? "Success" : "Failed", shapeId);
    return lockAcquired;
  } catch (error) {
    console.error("[tryLockShape] Error:", error);
    return false;
  }
};

/**
 * Release a lock on a shape
 * Only the user who locked it can unlock
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to unlock
 * @param {string} userId - User ID attempting to unlock
 */
export const unlockShape = async (canvasId, shapeId, userId) => {
  try {
    console.info("[unlockShape] Starting...", shapeId, userId);
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
          // Only unlock if locked by this user
          if (shape.lockedBy === userId) {
            return {
              ...shape,
              isLocked: false,
              lockedBy: null,
              lockedAt: null
            };
          }
        }
        return shape;
      });
      
      transaction.update(canvasRef, {
        shapes: updatedShapes,
        lastUpdated: serverTimestamp()
      });
    });
    
    console.info("[unlockShape] Success", shapeId);
  } catch (error) {
    console.error("[unlockShape] Failed:", error);
    throw error;
  }
};

/**
 * Clean up stale locks (older than TTL)
 * @param {string} canvasId - Canvas ID
 * @param {number} ttlMs - Lock TTL in milliseconds (default 5000ms)
 */
export const staleLockSweeper = async (canvasId, ttlMs = 5000) => {
  try {
    const docRef = doc(db, 'canvas', canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const shapes = data.shapes || [];
      const now = Date.now();
      let cleaned = 0;
      
      const updatedShapes = shapes.map(shape => {
        if (shape.isLocked && shape.lockedAt) {
          const lockAge = now - shape.lockedAt.toMillis();
          if (lockAge > ttlMs) {
            cleaned++;
            return {
              ...shape,
              isLocked: false,
              lockedBy: null,
              lockedAt: null
            };
          }
        }
        return shape;
      });
      
      if (cleaned > 0) {
        transaction.update(docRef, { shapes: updatedShapes });
        console.info("[staleLockSweeper] Cleaned", cleaned, "stale locks");
      }
    });
  } catch (error) {
    console.error("[staleLockSweeper] Failed:", error);
  }
};
