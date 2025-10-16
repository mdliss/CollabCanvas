import { db } from "./firebase";
import { doc, onSnapshot, serverTimestamp, setDoc, runTransaction, getDoc, updateDoc } from "firebase/firestore";

const getCanvasDoc = (canvasId) => doc(db, "canvas", canvasId);

// Retry helper for handling Firestore transaction failures
// Increased retries and more aggressive backoff to handle collaborative editing conflicts
const retryTransaction = async (fn, maxRetries = 10) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error.code === 'failed-precondition' || error.code === 'aborted';
      if (isRetryable && attempt < maxRetries) {
        // More aggressive exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms...
        const baseDelay = Math.pow(2, attempt - 1) * 50;
        const jitter = Math.random() * 50; // Add 0-50ms random jitter
        const delay = Math.min(baseDelay + jitter, 2000); // Cap at 2 seconds
        console.log(`[Transaction] Retry ${attempt}/${maxRetries} after ${delay.toFixed(0)}ms due to ${error.code}`);
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
    
    console.log('[createShape] Creating shape with ID:', shapeId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      const currentShapes = docSnap.exists() ? (docSnap.data().shapes || []) : [];
      
      // Calculate z-index: either use provided value or set to max + 1
      const maxZIndex = currentShapes.reduce((max, s) => Math.max(max, s.zIndex || 0), 0);
      const zIndex = shapeData.zIndex !== undefined ? shapeData.zIndex : maxZIndex + 1;
      
      // Build the new shape, preserving gradient properties if present
      const newShape = {
        ...shapeData, // Spread all provided shape data first
        id: shapeId,  // Then ensure ID is set correctly
        type: shapeData.type || 'rectangle',
        x: shapeData.x !== undefined ? shapeData.x : 200,
        y: shapeData.y !== undefined ? shapeData.y : 200,
        width: shapeData.width || 100,
        height: shapeData.height || 100,
        zIndex: zIndex,
        createdBy: user?.uid || 'anonymous',
        createdAt: Date.now(),
        lastModifiedBy: user?.uid || 'anonymous',
        lastModifiedAt: Date.now(),
        isLocked: false,
        lockedBy: null,
        lockedAt: null
      };
      
      // Only set default fill if:
      // 1. No fill property exists in shapeData (not even undefined)
      // 2. AND no gradient exists
      const hasFillProperty = 'fill' in shapeData;
      const hasGradient = shapeData.fillLinearGradientColorStops && 
                          shapeData.fillLinearGradientColorStops.length > 0;
      
      if (!hasFillProperty && !hasGradient) {
        newShape.fill = '#cccccc';
      }
      
      if (!docSnap.exists()) {
        transaction.set(canvasRef, {
          canvasId,
          shapes: [newShape],
          lastUpdated: serverTimestamp()
        });
      } else {
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
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const data = docSnap.data();
    const shapes = data.shapes || [];
    const now = Date.now();
    let hasStale = false;
    
    const updatedShapes = shapes.map(shape => {
      if (shape.isLocked && shape.lockedAt) {
        // Handle BOTH types: Firestore Timestamp (old data) AND number (new data)
        let lockTimestamp;
        if (typeof shape.lockedAt === 'number') {
          // New format: plain number from Date.now()
          lockTimestamp = shape.lockedAt;
        } else if (shape.lockedAt && shape.lockedAt.toMillis) {
          // Old format: Firestore Timestamp object
          lockTimestamp = shape.lockedAt.toMillis();
        } else {
          // Unknown format - skip
          return shape;
        }
        
        const lockAge = now - lockTimestamp;
        
        if (lockAge > ttlMs) {
          hasStale = true;
          console.log(`[staleLockSweeper] Clearing stale lock on ${shape.id} (age: ${lockAge}ms)`);
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
    
    // Only write if there are stale locks to clear
    if (hasStale) {
      await updateDoc(docRef, {
        shapes: updatedShapes,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    // Non-critical operation - just log at debug level
    if (error.code === 'failed-precondition' || error.code === 'aborted') {
      console.debug('[staleLockSweeper] Transaction conflict (non-critical):', error.code);
    } else {
      console.debug('[staleLockSweeper] Failed (non-critical):', error.message);
    }
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

// Z-Index Management Functions

export const bringToFront = async (canvasId, shapeId, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const maxZIndex = shapes.reduce((max, s) => Math.max(max, s.zIndex || 0), 0);
      
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
          return {
            ...shape,
            zIndex: maxZIndex + 1,
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
  } catch (error) {
    console.error("[bringToFront] Failed:", error);
    throw error;
  }
};

export const sendToBack = async (canvasId, shapeId, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const minZIndex = shapes.reduce((min, s) => Math.min(min, s.zIndex || 0), 0);
      
      const updatedShapes = shapes.map(shape => {
        if (shape.id === shapeId) {
          return {
            ...shape,
            zIndex: minZIndex - 1,
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
  } catch (error) {
    console.error("[sendToBack] Failed:", error);
    throw error;
  }
};

export const bringForward = async (canvasId, shapeId, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const targetShape = shapes.find(s => s.id === shapeId);
      if (!targetShape) return;
      
      // Find the next higher z-index
      const currentZ = targetShape.zIndex || 0;
      const higherShapes = shapes.filter(s => (s.zIndex || 0) > currentZ).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      if (higherShapes.length > 0) {
        const nextZ = higherShapes[0].zIndex;
        const newZ = nextZ + 1;
        
        const updatedShapes = shapes.map(shape => {
          if (shape.id === shapeId) {
            return {
              ...shape,
              zIndex: newZ,
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
      }
    });
  } catch (error) {
    console.error("[bringForward] Failed:", error);
    throw error;
  }
};

export const sendBackward = async (canvasId, shapeId, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      if (!docSnap.exists()) return;
      
      const shapes = docSnap.data().shapes || [];
      const targetShape = shapes.find(s => s.id === shapeId);
      if (!targetShape) return;
      
      // Find the next lower z-index
      const currentZ = targetShape.zIndex || 0;
      const lowerShapes = shapes.filter(s => (s.zIndex || 0) < currentZ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      
      if (lowerShapes.length > 0) {
        const prevZ = lowerShapes[0].zIndex;
        const newZ = prevZ - 1;
        
        const updatedShapes = shapes.map(shape => {
          if (shape.id === shapeId) {
            return {
              ...shape,
              zIndex: newZ,
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
      }
    });
  } catch (error) {
    console.error("[sendBackward] Failed:", error);
    throw error;
  }
};
