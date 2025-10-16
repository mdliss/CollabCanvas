import { db } from "./firebase";
import { doc, onSnapshot, serverTimestamp, setDoc, runTransaction, getDoc } from "firebase/firestore";

const getCanvasDoc = (canvasId) => doc(db, "canvas", canvasId);

// Retry helper for handling Firestore transaction failures
const retryTransaction = async (fn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'failed-precondition' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms
        console.log(`[Transaction] Retry ${attempt}/${maxRetries} after ${delay}ms due to failed-precondition`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Re-throw if not retryable or max retries reached
    }
  }
};

const ensureCanvasDoc = async (canvasId) => {
  const canvasRef = getCanvasDoc(canvasId);
  const docSnap = await getDoc(canvasRef);
  if (!docSnap.exists()) {
    await setDoc(canvasRef, {
      canvasId,
      shapes: [],
      lastUpdated: serverTimestamp()
    });
  }
};

export const subscribeToShapes = async (canvasId, callback) => {
  await ensureCanvasDoc(canvasId);
  
  return onSnapshot(getCanvasDoc(canvasId), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const shapes = data.shapes || [];
      callback(shapes);
    } else {
      console.warn("[subscribe]", canvasId, "doc missing, re-initializing");
      setDoc(getCanvasDoc(canvasId), {
        canvasId,
        shapes: [],
        lastUpdated: serverTimestamp()
      }).then(() => callback([]));
    }
  });
};

export const createShape = async (canvasId, shapeData, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    // Use provided ID or generate new one
    const shapeId = shapeData.id || `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newShape = {
      ...shapeData, // Spread all provided shape data first
      id: shapeId,  // Then ensure ID is set correctly
      type: shapeData.type || 'rectangle',
      x: shapeData.x !== undefined ? shapeData.x : 200,
      y: shapeData.y !== undefined ? shapeData.y : 200,
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

    console.log('[createShape] Creating shape with ID:', shapeId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) {
        transaction.set(canvasRef, {
          canvasId,
          shapes: [newShape],
          lastUpdated: serverTimestamp()
        });
      } else {
        const currentShapes = docSnap.data().shapes || [];
        transaction.update(canvasRef, {
          shapes: [...currentShapes, newShape],
          lastUpdated: serverTimestamp()
        });
      }
    });
    
    console.log('[createShape] Shape created successfully with ID:', shapeId);
  } catch (error) {
    console.error("[createShape] Failed:", error);
    throw error;
  }
};

export const updateShape = async (canvasId, shapeId, updates, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    // Wrap in retry logic to handle concurrent update conflicts
    await retryTransaction(async () => {
      return runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(canvasRef);
        
        // Check if document exists
        if (!docSnap.exists()) {
          console.warn('[updateShape] Document does not exist, creating it first');
          transaction.set(canvasRef, {
            canvasId,
            shapes: [],
            lastUpdated: serverTimestamp()
          });
          return; // Exit early - can't update shapes that don't exist
        }
        
        const shapes = docSnap.data().shapes || [];
        const updatedShapes = shapes.map(shape => {
          if (shape.id === shapeId) {
            if (shape.isLocked && shape.lockedBy !== user?.uid) {
              console.warn("[updateShape] Shape locked by another user", shapeId);
              return shape;
            }
            
            // Start with existing shape
            const updatedShape = {
              ...shape,
              lastModifiedBy: user?.uid || 'anonymous',
              lastModifiedAt: Date.now()
            };
            
            // Apply updates, explicitly delete properties set to undefined
            Object.keys(updates).forEach(key => {
              if (updates[key] === undefined) {
                // Delete the property
                delete updatedShape[key];
              } else {
                // Update the property
                updatedShape[key] = updates[key];
              }
            });
            
            return updatedShape;
          }
          return shape;
        });
        
        transaction.update(canvasRef, {
          shapes: updatedShapes,
          lastUpdated: serverTimestamp()
        });
      });
    });
  } catch (error) {
    console.error("[updateShape] Failed after retries:", error);
    console.error("[updateShape] Error details:", {
      code: error.code,
      message: error.message,
      shapeId,
      updates
    });
    throw error;
  }
};

export const deleteShape = async (canvasId, shapeId) => {
  console.log('[deleteShape] Starting deletion for shape:', shapeId);
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) {
        console.warn('[deleteShape] Document does not exist');
        return;
      }
      
      const shapes = docSnap.data().shapes || [];
      console.log('[deleteShape] Current shapes count:', shapes.length);
      console.log('[deleteShape] Looking for shape to delete:', shapeId);
      
      const shapeExists = shapes.find(s => s.id === shapeId);
      if (!shapeExists) {
        console.warn('[deleteShape] Shape not found in Firestore:', shapeId);
      } else {
        console.log('[deleteShape] Found shape to delete:', shapeExists.type);
      }
      
      const filteredShapes = shapes.filter(shape => shape.id !== shapeId);
      console.log('[deleteShape] Shapes after filtering:', filteredShapes.length, '(removed:', shapes.length - filteredShapes.length, ')');
      
      transaction.update(canvasRef, {
        shapes: filteredShapes,
        lastUpdated: serverTimestamp()
      });
      
      console.log('[deleteShape] Transaction committed - shape should be deleted');
    });
    console.log('[deleteShape] Deletion completed successfully for:', shapeId);
  } catch (error) {
    console.error("[deleteShape] Failed:", error);
    console.error("[deleteShape] Error details:", {
      code: error.code,
      message: error.message,
      shapeId
    });
    throw error;
  }
};

export const tryLockShape = async (canvasId, shapeId, userId, ttlMs = 4000) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    let lockAcquired = false;
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const now = Date.now();
      
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
          const lockExpired = shape.lockedAt && (now - shape.lockedAt > ttlMs);
          
          if (!shape.isLocked || lockExpired || shape.lockedBy === userId) {
            lockAcquired = true;
            return {
              ...shape,
              isLocked: true,
              lockedBy: userId,
              lockedAt: now
            };
          } else {
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
    
    return lockAcquired;
  } catch (error) {
    console.error("[tryLockShape] Error:", error);
    return false;
  }
};

export const unlockShape = async (canvasId, shapeId, userId) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
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
  } catch (error) {
    console.error("[unlockShape] Failed:", error);
    throw error;
  }
};

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
          // Handle BOTH types: Firestore Timestamp (old data) AND number (new data)
          let lockTimestamp;
          if (typeof shape.lockedAt === 'number') {
            // New format: plain number from Date.now()
            lockTimestamp = shape.lockedAt;
          } else if (shape.lockedAt.toMillis) {
            // Old format: Firestore Timestamp object
            lockTimestamp = shape.lockedAt.toMillis();
          } else {
            // Unknown format - skip
            console.warn(`[staleLockSweeper] Unknown lockedAt format for ${shape.id}:`, typeof shape.lockedAt);
            return shape;
          }
          
          const lockAge = now - lockTimestamp;
          
          if (lockAge > ttlMs) {
            cleaned++;
            console.log(`[staleLockSweeper] Cleaning stale lock on ${shape.id}, age: ${lockAge}ms`);
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
        console.log(`[staleLockSweeper] Cleaned ${cleaned} stale lock(s)`);
        transaction.update(docRef, { shapes: updatedShapes });
      }
    });
  } catch (error) {
    console.error("[staleLockSweeper] Failed:", error);
    console.error("[staleLockSweeper] Error details:", {
      code: error.code,
      message: error.message
    });
  }
};

export const duplicateShapes = async (canvasId, shapeIds, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    let duplicatedCount = 0;
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const now = Date.now();
      const maxZIndex = shapes.reduce((max, s) => Math.max(max, s.zIndex || 0), 0);
      
      const duplicates = [];
      shapeIds.forEach((shapeId, index) => {
        const original = shapes.find(s => s.id === shapeId);
        if (!original) return;
        
        const duplicate = {
          ...original,
          id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          x: original.x + 8,
          y: original.y + 8,
          zIndex: maxZIndex + index + 1,
          createdBy: user?.uid || 'anonymous',
          createdAt: now,
          lastModifiedBy: user?.uid || 'anonymous',
          lastModifiedAt: now,
          isLocked: false,
          lockedBy: null,
          lockedAt: null
        };
        
        duplicates.push(duplicate);
        duplicatedCount++;
      });
      
      if (duplicates.length > 0) {
        transaction.update(canvasRef, {
          shapes: [...shapes, ...duplicates],
          lastUpdated: serverTimestamp()
        });
      }
    });
    
    return duplicatedCount;
  } catch (error) {
    console.error("[duplicateShapes] Failed:", error);
    throw error;
  }
};
