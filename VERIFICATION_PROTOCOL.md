# PR #5 Verification Protocol
**Branch:** feature/realtime-sync  
**Date:** 2025-01-14  
**Status:** READY FOR MANUAL TESTING

---

## Pre-Flight Checks ✅

- [x] Build passes: `npm run build` → Exit 0
- [x] Lint passes: `npm run lint` → Exit 0
- [x] Lock guards in place:
  - `tryLockShape` checks existing locks + TTL
  - `updateShape` blocks non-owners
  - `deleteShape` blocks non-owners (NEW FIX)
- [x] Stale lock sweeper:
  - Runs every 2s via `setInterval`
  - Runs on `visibilitychange`
  - Clears locks older than 5s
- [x] UI badges:
  - Show "🔒 {name}" for locked shapes
  - Visible to all users (not just local selection)
- [x] Cleanup:
  - `onDisconnect` in presence.js
  - `clearCursor` on unmount
  - `setUserOffline` on unmount

---

## Manual Two-Browser Tests

### Setup
1. Open two browsers (or incognito windows)
2. Login as different users:
   - Window A: user-a@test.com
   - Window B: user-b@test.com
3. Ensure both see presence count = 2

---

### Test A: Lock Enforcement During Drag

**Steps:**
1. Window A: Click "Add Rectangle"
2. Window A: Start dragging rectangle (mousedown + move)
3. **Expected in Window A:**
   - Shape moves smoothly
   - Console: `[tryLockShape] Success {shapeId}`
   - No badge (self-lock doesn't show)
4. **Expected in Window B:**
   - Shape has red border
   - Badge shows "🔒 User A" above shape
   - Console: `[cursor] emit size: 1` (A's cursor visible)
   - Attempting to drag fails (draggable=false)
5. Window A: Release drag
6. **Expected in Window B:**
   - Red border disappears
   - Badge disappears
   - Console: `[unlockShape] Success {shapeId}`
   - Shape is now draggable

**Result:** ☐ PASS / ☐ FAIL  
**Evidence:** _________________________________________

---

### Test B: Lock Blocks Delete Key

**Steps:**
1. Window A: Start dragging rectangle (lock acquired)
2. Window B: Select the same rectangle
3. Window B: Press Delete key
4. **Expected in Window B:**
   - Console: `[deleteShape] Cannot delete - shape locked by another user`
   - Error overlay shows: "Shape is locked by another user"
   - Shape remains on canvas
5. Window A: Release drag (unlock)
6. Window B: Press Delete key again
7. **Expected in Window B:**
   - Console: `[deleteShape] Success {shapeId}`
   - Shape removed from both windows

**Result:** ☐ PASS / ☐ FAIL  
**Evidence:** _________________________________________

---

### Test C: Stale Lock Cleanup (Disconnect)

**Steps:**
1. Window A: Start dragging rectangle (lock acquired)
2. Window A: Close browser immediately (DO NOT release drag)
3. Window B: Wait 3 seconds
4. **Expected in Window B:**
   - Console: `[presence] emit size: 1` (A disconnected)
   - Badge disappears (within 3s due to onDisconnect)
   - Cursor disappears
5. Window B: Wait 5 more seconds
6. **Expected in Window B:**
   - Console: `[staleLockSweeper] Cleaned 1 stale locks`
   - Shape becomes draggable
   - Red border gone

**Result:** ☐ PASS / ☐ FAIL  
**Evidence:** _________________________________________

---

### Test D: Stale Lock Cleanup (Timeout)

**Steps:**
1. Window A: Start dragging rectangle
2. Window A: **Minimize browser** (tab still open, but inactive)
3. Window B: Wait exactly 6 seconds
4. **Expected in Window B:**
   - Console: `[staleLockSweeper] Cleaned 1 stale locks` (runs every 2s)
   - Badge disappears
   - Shape becomes draggable (even though A is still connected)

**Result:** ☐ PASS / ☐ FAIL  
**Evidence:** _________________________________________

---

### Test E: Cursor Sync Performance

**Steps:**
1. Window A & B side-by-side
2. Window A: Move mouse continuously in circles
3. **Expected in Window B:**
   - Cursor follows with <50ms latency
   - Name label shows "User A"
   - Color matches A's assigned color
   - Console: `[cursor] emit size: 1` (throttled to 33ms)
4. Window A: Move mouse outside canvas area
5. **Expected in Window B:**
   - Cursor disappears OR stays at last position
   - Console: No spam (throttled + delta filter)

**Result:** ☐ PASS / ☐ FAIL  
**Evidence:** _________________________________________

---

### Test F: Presence Count Accuracy

**Steps:**
1. Start with Window A only
2. **Expected:** Presence count shows "1"
3. Open Window B (different user)
4. **Expected in A & B:** Presence count shows "2"
5. Open Window C (third user)
6. **Expected in A, B, C:** Presence count shows "3"
7. Close Window B
8. **Expected in A & C:** Presence count shows "2" within 3 seconds
9. Refresh Window A
10. **Expected in A:** Presence count still shows "2"

**Result:** ☐ PASS / ☐ FAIL  
**Evidence:** _________________________________________

---

## State Verification (Firebase Console)

### During Active Lock (Test A, Step 3):
```
Firestore: canvas/global-canvas-v1
{
  shapes: [
    {
      id: "...",
      isLocked: true,
      lockedBy: "{user-a-uid}",
      lockedAt: {timestamp},
      x: ..., y: ..., width: ..., height: ...
    }
  ]
}
```

### After Lock Release (Test A, Step 5):
```
Firestore: canvas/global-canvas-v1
{
  shapes: [
    {
      id: "...",
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      ...
    }
  ]
}
```

### RTDB Sessions (During Test):
```
/sessions/global-canvas-v1/
  {user-a-uid}/
    displayName: "User A"
    cursorColor: "#1e88e5"
    cursorX: 1234
    cursorY: 567
    online: true
    lastSeen: {timestamp}
  {user-b-uid}/
    ...
```

### After Disconnect (Test C, Step 3):
```
/sessions/global-canvas-v1/
  {user-a-uid}/
    displayName: "User A"
    cursorColor: "#1e88e5"
    cursorX: null           ← cleared by onDisconnect
    cursorY: null           ← cleared by onDisconnect
    online: false           ← set by onDisconnect
    lastSeen: {timestamp}
```

---

## Performance Checks

### Cursor Throttle Test:
1. Open DevTools → Network tab → Filter: `firebaseio.com`
2. Move mouse rapidly in canvas
3. **Expected:** Write requests throttled to ~30 FPS (33ms intervals)
4. **Expected:** No writes when delta <2px

### Lock Sweeper Load Test:
1. Create 50 rectangles
2. Open DevTools → Console
3. **Expected:** `[staleLockSweeper]` log every 2 seconds
4. **Expected:** If no stale locks: no Firestore write
5. Lock 5 shapes, wait 6s
6. **Expected:** Console shows "Cleaned 5 stale locks"

---

## Diagnostic Logs Reference

### Success Patterns:
```
[tryLockShape] Starting... {shapeId} {uid}
[tryLockShape] Success {shapeId}

[unlockShape] Starting... {shapeId} {uid}
[unlockShape] Success {shapeId}

[staleLockSweeper] Cleaned N stale locks

[presence] start {uid}
[presence] emit size: N

[cursor] emit size: N
```

### Error Patterns:
```
[tryLockShape] Already locked by {other-uid}
[deleteShape] Cannot delete - shape locked by another user
[Shape] Drag cancelled - shape locked by another user
```

---

## Acceptance Criteria

All tests must PASS before marking tasks.md items complete.

- [ ] Test A: Lock enforcement during drag
- [ ] Test B: Lock blocks delete key
- [ ] Test C: Stale lock cleanup (disconnect)
- [ ] Test D: Stale lock cleanup (timeout)
- [ ] Test E: Cursor sync <50ms
- [ ] Test F: Presence count accurate

**If ANY test fails:** Revert commits and report the failing check.

---

## Evidence Format for tasks.md

After all tests pass, add to tasks.md:

```markdown
- [x] 5.5: Implement Object Locking
  → evidence: Two-browser tests A-D pass; deleteShape guards locks; 
     staleLockSweeper clears locks ≤5s; badges show to all users
     | 2025-01-14 | feature/realtime-sync@{commit} | VERIFICATION_PROTOCOL.md

- [x] Cannot delete shapes locked by other users
  → evidence: Test B passes; deleteShape checks isLocked && lockedBy
     | 2025-01-14 | feature/realtime-sync@{commit} | canvas.js:178-181
```

---

## Next Steps After Verification

1. Commit changes: `git add -A && git commit -m "fix(locking): guard deleteShape against locked shapes"`
2. Run all tests and record evidence
3. Update tasks.md with checkmarks + evidence lines
4. Push branch: `git push -u origin feature/realtime-sync`
5. Create PR with test results in body
6. Quick audit PR #6-#7 (already complete)
7. Prepare PR #8 skeleton

