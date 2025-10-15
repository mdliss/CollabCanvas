# Architecture Refactor Plan: Array → Subcollections

## Problem Statement

Currently, all shapes are stored in a single Firestore document as an array:
```
/canvas/global-canvas-v1
└── shapes: [shape1, shape2, shape3, ...]
```

**Issues:**
1. Concurrent writes cause `failed-precondition` errors
2. Checkpoint system cannot work reliably
3. Doesn't scale beyond ~100 shapes
4. Entire array must be read/written for any update

---

## Proposed Solution

**Migrate to subcollections:**
```
/canvas/global-canvas-v1/shapes/{shapeId}
```

**Benefits:**
✅ Each shape update is independent (no conflicts)  
✅ Checkpoints work perfectly  
✅ Scales to millions of shapes  
✅ Better Firestore query performance  
✅ Smaller network payloads (only changed shapes sync)

---

## Migration Plan

### Phase 1: Dual-Write Mode (Backward Compatible)

1. **Create new `canvas-v2.js` service**
   - Write to both array (old) and subcollection (new)
   - Read from array for now
   - No breaking changes

2. **Deploy and monitor**
   - All writes go to both locations
   - Verify data consistency

### Phase 2: Dual-Read Mode

1. **Update read logic**
   - Try subcollection first
   - Fall back to array if not found
   - Still writing to both

2. **Backfill existing data**
   - Run migration script to copy array → subcollections
   - One-time operation

### Phase 3: Subcollection-Only Mode

1. **Switch to subcollection-only**
   - Stop writing to array
   - Read from subcollections only

2. **Deprecate old structure**
   - Archive array data
   - Clean up old code

---

## Code Changes Required

### 1. `src/services/canvas.js`

**Before:**
```javascript
const canvasRef = doc(db, 'canvas', canvasId);
const canvasDoc = await getDoc(canvasRef);
const shapes = canvasDoc.data().shapes || [];
```

**After:**
```javascript
const shapesRef = collection(db, 'canvas', canvasId, 'shapes');
const shapesSnapshot = await getDocs(shapesRef);
const shapes = shapesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### 2. `updateShape()` function

**Before:**
```javascript
await runTransaction(db, canvasRef, (current) => {
  const shapes = current.data().shapes || [];
  const index = shapes.findIndex(s => s.id === shapeId);
  shapes[index] = { ...shapes[index], ...updates };
  return { shapes };
});
```

**After:**
```javascript
const shapeRef = doc(db, 'canvas', canvasId, 'shapes', shapeId);
await updateDoc(shapeRef, {
  ...updates,
  lastModifiedAt: serverTimestamp(),
  lastModifiedBy: userId
});
```

**No transaction needed!** Each shape is independent.

### 3. `subscribeToShapes()` listener

**Before:**
```javascript
onSnapshot(doc(db, 'canvas', canvasId), (snapshot) => {
  const shapes = snapshot.data()?.shapes || [];
  callback(shapes);
});
```

**After:**
```javascript
onSnapshot(collection(db, 'canvas', canvasId, 'shapes'), (snapshot) => {
  const shapes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  callback(shapes);
});
```

---

## Checkpoint System Re-Enable

Once migrated, re-enable checkpoints:

```javascript
// In ShapeRenderer.jsx - NO MORE CONFLICTS!
firestoreCheckpointInterval.current = setInterval(() => {
  const node = shapeRef.current;
  if (node && currentUser) {
    const shapeRef = doc(db, 'canvas', 'global-canvas-v1', 'shapes', shape.id);
    
    // Direct update - no transaction needed!
    updateDoc(shapeRef, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      checkpointedAt: serverTimestamp()
    }).catch(err => {
      console.debug('[Checkpoint] Failed:', err.message);
    });
  }
}, 500);
```

**Why it works now:**
- Each shape is a separate document
- Multiple checkpoints update different documents
- No conflicts!

---

## Firestore Rules Update

**Before:**
```javascript
match /canvas/{canvasId} {
  allow read, write: if request.auth != null;
}
```

**After:**
```javascript
match /canvas/{canvasId}/shapes/{shapeId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null 
    && request.resource.data.createdBy == request.auth.uid;
  allow update: if request.auth != null
    && (!resource.data.isLocked || resource.data.lockedBy == request.auth.uid);
  allow delete: if request.auth != null
    && (resource.data.createdBy == request.auth.uid 
        || request.auth.token.admin == true);
}
```

**Better security:**
- Per-shape access control
- Lock enforcement in rules
- Creator/admin-only deletion

---

## Performance Comparison

### Array-Based (Current)

| Operation | Document Reads | Document Writes | Conflicts |
|-----------|---------------|-----------------|-----------|
| Load 100 shapes | 1 | 0 | N/A |
| Update 1 shape | 1 (entire array) | 1 (entire array) | High |
| Checkpoint (500ms) | 1 | 1 | **Very High** |

### Subcollection-Based (Proposed)

| Operation | Document Reads | Document Writes | Conflicts |
|-----------|---------------|-----------------|-----------|
| Load 100 shapes | 1 (query) | 0 | N/A |
| Update 1 shape | 0 (optimistic) | 1 (single doc) | **Zero** |
| Checkpoint (500ms) | 0 | 1 (single doc) | **Zero** |

**Result:** Subcollections are faster, more reliable, and scale better.

---

## Migration Script Example

```javascript
// scripts/migrate-to-subcollections.js
import { getFirestore, doc, getDoc, collection, writeBatch } from 'firebase/firestore';

async function migrate(canvasId) {
  const db = getFirestore();
  const canvasRef = doc(db, 'canvas', canvasId);
  const canvasDoc = await getDoc(canvasRef);
  const shapes = canvasDoc.data()?.shapes || [];
  
  console.log(`Migrating ${shapes.length} shapes...`);
  
  // Use batched writes (max 500 per batch)
  const batch = writeBatch(db);
  
  shapes.forEach(shape => {
    const shapeRef = doc(db, 'canvas', canvasId, 'shapes', shape.id);
    batch.set(shapeRef, shape);
  });
  
  await batch.commit();
  console.log('Migration complete!');
}

// Run: node scripts/migrate-to-subcollections.js
migrate('global-canvas-v1');
```

---

## Rollback Plan

If something goes wrong:

1. **Switch reads back to array**
   ```javascript
   // Flip a feature flag
   const USE_SUBCOLLECTIONS = false;
   ```

2. **Data is safe**
   - Array is still there (dual-write mode)
   - No data loss

3. **Fix issues and retry**

---

## Timeline Estimate

- **Phase 1 (Dual-Write):** 2-3 hours
- **Phase 2 (Dual-Read + Backfill):** 1-2 hours
- **Phase 3 (Subcollection-Only):** 1 hour
- **Testing:** 2-3 hours

**Total:** ~8-10 hours for complete migration

---

## When to Do This

**Recommendation:** After completing core features in tasks2.md

**Triggers for doing it sooner:**
- Shape count exceeds 50
- Multiple users editing frequently causes conflicts
- Performance degradation
- Checkpoint feature is critical

**For now:** The array-based approach works fine for demos and small teams (< 5 concurrent users, < 100 shapes).

---

## Conclusion

The checkpoint error you saw is a **known limitation of array-based storage**, not a Firebase bug.

**Solution:** Migrate to subcollections (future task)  
**Workaround:** Checkpoints disabled (current state)  
**Impact:** Minimal - drag works perfectly

When you're ready for scale, the subcollection migration is straightforward and provides huge benefits.

