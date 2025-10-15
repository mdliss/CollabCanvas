# Offline Mode & State Persistence

## Overview
CollabCanvas implements offline functionality with Firestore offline persistence, connection status monitoring, and IndexedDB-based operation queuing.

## Features Implemented

### 1. Connection Status Banner
**Component:** `src/components/UI/ConnectionStatus.jsx`

Visual banner at the top of the screen showing real-time connection state:

- **🟢 Connected** - Firebase RTDB is connected (auto-dismisses after 2s)
- **🟡 Reconnecting...** - Network is back online, Firebase reconnecting
- **🔴 Offline** - No network connection, shows pending operation count

**Connection Monitoring:**
- Firebase RTDB `.info/connected` path (authoritative Firebase connection)
- Browser `navigator.onLine` status
- Offline operation queue count

**User Experience:**
- Smooth slide-down animation
- Auto-dismissal for "Connected" state (2s delay)
- Manual dismiss button for "Connected" state
- Always visible when offline or reconnecting
- Shows count of pending changes when offline

---

### 2. Firestore Offline Persistence
**File:** `src/services/firebase.js`

**Configuration:**
```javascript
enableIndexedDbPersistence(db, {
  cacheSizeBytes: 40 * 1024 * 1024 // 40MB cache
})
```

**Benefits:**
- Shapes load instantly from cache
- Writes queued automatically when offline
- Seamless reconnection when back online
- Works in single-tab mode (Firebase limitation)

**Multi-Tab Behavior:**
- First tab gets persistence
- Other tabs show warning but continue to work online-only

---

### 3. IndexedDB Offline Queue
**Service:** `src/services/offline.js`

Custom operation queue for tracking pending offline operations:

**Features:**
- Max 500 operations stored
- Persistent across page reloads
- Real-time listener system for UI updates
- Automatic queue count reporting

**API:**
```javascript
import { offlineQueue } from './services/offline';

// Enqueue an operation
await offlineQueue.enqueue('update_shape', { shapeId, data });

// Get pending count
const count = await offlineQueue.count();

// Listen for changes
const removeListener = offlineQueue.addListener(() => {
  console.log('Queue updated');
});

// Clear all operations
await offlineQueue.clear();
```

**Storage Schema:**
```javascript
{
  id: 'op_1634567890_abc123',
  type: 'update_shape',
  data: { /* operation data */ },
  timestamp: 1634567890,
  status: 'pending'
}
```

---

### 4. Mid-Drag Refresh Persistence
**File:** `src/components/Canvas/ShapeRenderer.jsx`

**Problem:** When a user drags a shape and then refreshes the page, other users would see the shape revert to its initial position because:
1. RTDB drag stream disconnects on refresh
2. Firestore only had the pre-drag position

**Solution:** Periodic Firestore checkpoints during drag and transform operations.

**Implementation:**

**During Drag:**
- Every 500ms, save current position to Firestore
- Checkpoints include: `x`, `y`, `rotation`
- Non-blocking (errors are logged but don't interrupt drag)

**During Transform:**
- Every 500ms, save current transform to Firestore
- Checkpoints include: `x`, `y`, `width`, `height`, `rotation`
- Applies scale to dimensions before saving

**Cleanup:**
- Intervals are cleared on drag/transform end
- Intervals are cleared on component unmount
- Final position is still saved at the end (existing behavior)

**Code Example:**
```javascript
// In handleDragStart
firestoreCheckpointInterval.current = setInterval(() => {
  const node = shapeRef.current;
  if (node && currentUser) {
    const checkpointData = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation()
    };
    
    updateShape('global-canvas-v1', shape.id, checkpointData, currentUser)
      .catch(err => {
        console.debug('[Shape] Checkpoint save failed (non-critical):', err.message);
      });
  }
}, 500);

// In handleDragEnd
if (firestoreCheckpointInterval.current) {
  clearInterval(firestoreCheckpointInterval.current);
  firestoreCheckpointInterval.current = null;
}
```

**Result:** If a user refreshes mid-drag, other users see the shape at its last checkpoint position (max 500ms stale), not the original position.

---

## Integration Guide

### Add ConnectionStatus to a Component

```javascript
import ConnectionStatus from '../UI/ConnectionStatus';

function MyComponent() {
  return (
    <>
      <ConnectionStatus />
      {/* rest of component */}
    </>
  );
}
```

### Use Offline Queue

```javascript
import { offlineQueue } from '../services/offline';

// Track an operation
async function saveShape(data) {
  try {
    await updateFirestore(data);
  } catch (error) {
    if (!navigator.onLine) {
      await offlineQueue.enqueue('update_shape', data);
    }
  }
}

// Monitor queue in UI
function MyComponent() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const count = await offlineQueue.count();
      setPendingCount(count);
    };

    updateCount();
    const removeListener = offlineQueue.addListener(updateCount);
    
    return () => removeListener();
  }, []);

  return <div>Pending: {pendingCount}</div>;
}
```

---

## Testing Scenarios

### Test 1: Offline Mode
1. Open the app (should show "Connected" briefly)
2. Turn off network (Airplane mode or DevTools)
3. Banner should show "Offline"
4. Try to drag/create shapes
5. Operations should queue (banner shows count)
6. Turn network back on
7. Banner shows "Reconnecting..." then "Connected"
8. Operations should sync automatically

### Test 2: Multi-Tab Persistence
1. Open CollabCanvas in Tab 1
2. Console should show "[Firestore] Offline persistence enabled"
3. Open CollabCanvas in Tab 2
4. Console should show "Multiple tabs open" warning
5. Both tabs should work (Tab 2 just doesn't have offline cache)

### Test 3: Mid-Drag Refresh
1. Open CollabCanvas in Browser A
2. Open CollabCanvas in Browser B (same canvas)
3. In Browser A: Start dragging a shape and hold it
4. While holding, in Browser A: Refresh the page
5. **Expected:** Browser B sees shape at last drag position (not original)
6. **Before Fix:** Shape would revert to original position
7. **After Fix:** Shape stays at last checkpoint (max 500ms stale)

### Test 4: Mid-Transform Refresh
1. Open CollabCanvas in Browser A and B
2. In Browser A: Start resizing a shape
3. While resizing, in Browser A: Refresh the page
4. **Expected:** Browser B sees shape at last transform size/position
5. Checkpoints save size changes every 500ms

### Test 5: Cache Performance
1. Open CollabCanvas (should load from network)
2. Create several shapes
3. Refresh the page
4. Shapes should load instantly from cache (no loading spinner)
5. Check Network tab: Should see cached Firestore reads

---

## Performance Considerations

### Firestore Checkpoint Interval (500ms)
**Why 500ms?**
- Balances freshness vs. Firestore write volume
- 2 writes/second during active drag
- Max 0.5s staleness on refresh
- Non-critical (failures don't break drag)

**Alternative Intervals:**
- 100ms: More accurate, but 10x write volume
- 1000ms: Fewer writes, but 1s staleness
- Current 500ms is good middle ground

### Cache Size (40MB)
**Why 40MB?**
- Firestore default is 40MB
- Enough for ~10,000 shapes with metadata
- Automatically evicts oldest data if exceeded

**Monitoring Cache:**
```javascript
// Check cache size (browser DevTools)
navigator.storage.estimate().then(estimate => {
  console.log('Used:', estimate.usage);
  console.log('Quota:', estimate.quota);
});
```

### Queue Size Limit (500 ops)
**Why 500?**
- Prevents unbounded memory growth
- ~500 KB of IndexedDB storage
- Enough for extended offline sessions
- Oldest operations dropped if exceeded

---

## Future Enhancements

### 1. Conflict Resolution
When two users edit the same shape offline:
- Implement Last-Write-Wins with server timestamps
- Show conflict warnings to users
- Option to view and merge conflicting changes

### 2. Sync Status Per Shape
Visual indicators on shapes:
- 🟢 Synced
- 🟡 Syncing...
- 🔴 Failed to sync (retry button)

### 3. Offline Operation Queue UI
Dedicated panel showing:
- List of pending operations
- Manual retry failed operations
- Clear queue button
- Operation timestamps

### 4. Optimistic Updates
Apply changes locally immediately:
- Instant feedback (no latency)
- Rollback if server rejects
- Show pending state

### 5. Background Sync API
Use browser Background Sync:
- Retry operations even after app is closed
- Better battery efficiency
- Works with Service Workers

---

## Debugging

### Check Firestore Persistence Status
```javascript
// In browser console
import { getFirestore } from 'firebase/firestore';
const db = getFirestore();
// Check IndexedDB in DevTools → Application → IndexedDB
// Look for: firestore/[PROJECT_ID]/main
```

### Monitor Connection State
```javascript
// In browser console
import { getDatabase, ref, onValue } from 'firebase/database';
const db = getDatabase();
const connectedRef = ref(db, '.info/connected');
onValue(connectedRef, (snap) => {
  console.log('Connected:', snap.val());
});
```

### Check Offline Queue
```javascript
// In browser console
import { offlineQueue } from './services/offline';
offlineQueue.count().then(count => console.log('Pending:', count));
```

### Checkpoint Debugging
Look for console logs during drag:
```
[Shape] Checkpoint save failed (non-critical): <error>
```

If you see these frequently, check:
1. Firestore rules allow write
2. User is authenticated
3. Network is stable

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Actions                        │
│         (Drag, Transform, Create, Delete)               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │   Online Check (navigator.onLine) │
         └─────────────────────────────────┘
                    │                │
            Online  │                │  Offline
                    ▼                ▼
    ┌─────────────────────┐   ┌──────────────────┐
    │   Firestore Write   │   │  Offline Queue   │
    │   (with checkpoints)│   │  (IndexedDB)     │
    └─────────────────────┘   └──────────────────┘
                │                      │
                │                      │ (when back online)
                ▼                      ▼
         ┌─────────────────────────────────────┐
         │   Firestore Offline Persistence     │
         │   (40MB IndexedDB Cache)            │
         └─────────────────────────────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │  Real-Time Listeners  │
              │  (subscribeToShapes)  │
              └───────────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │   UI Updates    │
                 └─────────────────┘
```

---

## Files Modified/Created

### Created
1. `src/services/offline.js` - IndexedDB queue service
2. `src/components/UI/ConnectionStatus.jsx` - Connection banner
3. `docs/OFFLINE_MODE.md` - This documentation

### Modified
1. `src/services/firebase.js` - Added offline persistence
2. `src/components/Canvas/Canvas.jsx` - Added ConnectionStatus component
3. `src/components/Canvas/ShapeRenderer.jsx` - Added checkpoint intervals

---

## Known Limitations

1. **Multi-Tab Persistence:** Only first tab gets offline cache (Firebase limitation)
2. **Checkpoint Staleness:** Max 500ms staleness on refresh during drag
3. **Queue Size:** Limited to 500 operations
4. **No Conflict Resolution:** Last write wins (future enhancement)
5. **Browser Support:** Requires IndexedDB support (all modern browsers)

---

## Conclusion

The offline mode implementation provides:
- ✅ Seamless offline operation
- ✅ Visual connection status feedback
- ✅ Persistent state across refreshes
- ✅ Mid-drag position preservation
- ✅ Automatic sync when back online
- ✅ 40MB Firestore cache
- ✅ IndexedDB operation queue

Users can now work offline and their changes will sync automatically when the connection is restored. The mid-drag checkpoint feature ensures shapes appear at their last known position even if a user refreshes during an active drag.

