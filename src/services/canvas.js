import { db } from "./firebase";
import { doc, onSnapshot, serverTimestamp, setDoc, runTransaction, getDoc } from "firebase/firestore";

const getCanvasDoc = (canvasId) => doc(db, "canvas", canvasId);

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
  } catch (error) {
    console.error("[createShape] Failed:", error);
    throw error;
  }
};

export const updateShape = async (canvasId, shapeId, updates, user) => {
  try {
    const canvasRef = getCanvasDoc(canvasId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(canvasRef);
      
      if (!docSnap.exists()) return;
      
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
  } catch (error) {
    console.error("[updateShape] Failed:", error);
    throw error;
  }
};

export const deleteShape = async (canvasId, shapeId) => {
  try {
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
  } catch (error) {
    console.error("[deleteShape] Failed:", error);
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
      }
    });
  } catch (error) {
    console.error("[staleLockSweeper] Failed:", error);
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
