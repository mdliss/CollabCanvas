# CollabCanvas Production - Complete Task List (Rubric Aligned)

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx (existing - enhance)
│   │   │   ├── ShapeRenderer.jsx (existing - enhance)
│   │   │   ├── Transformer.jsx (NEW)
│   │   │   ├── Grid.jsx (existing)
│   │   │   ├── MarqueeSelect.jsx (NEW)
│   │   │   ├── MultiSelectToolbar.jsx (NEW)
│   │   │   └── SelectionBounds.jsx (NEW)
│   │   ├── UI/
│   │   │   ├── Toolbar.jsx (existing - enhance)
│   │   │   ├── LayersPanel.jsx (NEW)
│   │   │   ├── TextFormattingToolbar.jsx (NEW)
│   │   │   ├── AlignmentTools.jsx (NEW)
│   │   │   ├── TransformPanel.jsx (NEW)
│   │   │   ├── CommentPin.jsx (NEW)
│   │   │   ├── CommentModal.jsx (NEW)
│   │   │   ├── KeyboardShortcutsModal.jsx (NEW)
│   │   │   ├── ConnectionStatus.jsx (NEW)
│   │   │   ├── PerformanceMonitor.jsx (NEW)
│   │   │   └── Toast.jsx (NEW)
│   │   ├── AI/
│   │   │   ├── AICommandInput.jsx (NEW)
│   │   │   ├── AICommandHistory.jsx (NEW)
│   │   │   ├── AIFeedback.jsx (NEW)
│   │   │   └── AIRateLimitIndicator.jsx (NEW)
│   │   ├── Auth/
│   │   │   ├── AuthBar.jsx (existing - enhance)
│   │   │   ├── Login.jsx (existing)
│   │   │   ├── Signup.jsx (existing)
│   │   │   ├── ForgotPassword.jsx (NEW)
│   │   │   ├── ResetPassword.jsx (NEW)
│   │   │   ├── EmailVerification.jsx (NEW)
│   │   │   ├── ProfileSettings.jsx (NEW)
│   │   │   └── ActiveSessions.jsx (NEW)
│   │   └── Collaboration/
│   │       ├── PresenceList.jsx (existing)
│   │       ├── Cursor.jsx (existing)
│   │       └── LockIndicator.jsx (existing)
│   ├── services/
│   │   ├── firebase.js (existing)
│   │   ├── canvas.js (existing - enhance)
│   │   ├── realtime.js (NEW)
│   │   ├── ai.js (NEW)
│   │   ├── comments.js (NEW)
│   │   ├── undo.js (NEW)
│   │   ├── offline.js (NEW)
│   │   ├── performance.js (NEW)
│   │   └── auth.js (existing - enhance)
│   ├── hooks/
│   │   ├── useCanvas.js (existing - enhance)
│   │   ├── useRealtime.js (NEW)
│   │   ├── useAI.js (NEW)
│   │   ├── useUndo.js (NEW)
│   │   ├── useKeyboard.js (NEW)
│   │   ├── useOffline.js (NEW)
│   │   └── usePerformance.js (NEW)
│   ├── utils/
│   │   ├── geometry.js (NEW)
│   │   ├── performance.js (NEW)
│   │   ├── offline.js (NEW)
│   │   ├── commands.js (NEW)
│   │   └── constants.js (existing - enhance)
│   ├── contexts/
│   │   ├── CanvasContext.jsx (existing - enhance)
│   │   ├── AIContext.jsx (NEW)
│   │   ├── UndoContext.jsx (NEW)
│   │   └── OfflineContext.jsx (NEW)
│   ├── App.jsx (existing - enhance)
│   ├── main.jsx (existing)
│   └── index.css (existing - enhance)
├── tests/
│   ├── unit/
│   │   ├── geometry.test.js (NEW)
│   │   ├── commands.test.js (NEW)
│   │   ├── undo.test.js (NEW)
│   │   ├── offline.test.js (NEW)
│   │   └── ai.test.js (NEW)
│   ├── integration/
│   │   ├── collaboration.test.js (NEW)
│   │   ├── conflict-resolution.test.js (NEW)
│   │   ├── persistence.test.js (NEW)
│   │   └── ai-commands.test.js (NEW)
│   └── e2e/
│       ├── multi-user.spec.js (NEW)
│       ├── performance.spec.js (NEW)
│       └── ai-agent.spec.js (NEW)
├── docs/
│   ├── ARCHITECTURE.md (NEW)
│   ├── CONFLICT_RESOLUTION.md (NEW)
│   ├── AI_AGENT.md (NEW)
│   ├── PERFORMANCE.md (NEW)
│   ├── API.md (NEW)
│   ├── TESTING.md (NEW)
│   └── AI_DEVELOPMENT_LOG.md (NEW)
├── .github/
│   └── workflows/
│       ├── deploy.yml (NEW)
│       └── test.yml (NEW)
├── firestore.rules (existing - enhance)
├── database.rules.json (existing - enhance)
├── storage.rules (NEW)
├── .env.example (existing - update)
├── package.json (existing - update)
└── README.md (existing - rewrite)
```

---

## Section 1: Core Collaborative Infrastructure (30 points)

### PR #1: Real-Time Synchronization Enhancement

**Branch:** `feature/realtime-optimization`  
**Goal:** Achieve sub-100ms object sync, sub-50ms cursor sync, zero lag during multi-user edits  
**Rubric Points:** 11-12 points

#### Tasks:

- [ ] **1.1: Performance Monitoring Infrastructure**
  - Files to create: `src/services/performance.js`, `src/hooks/usePerformance.js`
  - Implement client-side latency tracking:
    - Measure sync latency (operation sent → remote update received)
    - Track cursor update frequency
    - Monitor FPS during edits
  - Store metrics in array, calculate p50, p95, p99
  - Send metrics to Firebase Analytics every 60 seconds
  - Create performance dashboard component (`src/components/UI/PerformanceMonitor.jsx`)

- [ ] **1.2: Optimize RTDB Streaming**
  - Files to update: `src/services/realtime.js` (create if not exists)
  - Reduce drag stream interval from 16ms to 10ms for smoother updates
  - Implement delta compression: Only send changed properties
  - Add message batching: Group multiple updates within 10ms window
  - Optimize cursor updates: Skip if delta < 2px

- [ ] **1.3: Network Quality Detection**
  - Files to update: `src/components/UI/ConnectionStatus.jsx` (NEW)
  - Use Navigator API to detect connection type (4G, 3G, 2G)
  - Adjust sync frequency based on network:
    - 4G: 10ms drag interval
    - 3G: 20ms drag interval
    - 2G: 50ms drag interval
  - Show connection indicator in top-right corner

- [ ] **1.4: Testing & Validation**
  - Create test file: `tests/integration/sync-performance.test.js`
  - Test scenarios:
    - Three users drag different objects → measure sync latency < 100ms
    - Five users move cursors → measure cursor sync < 50ms
    - Network throttled to 3G → verify graceful degradation
    - Rapid zigzag drag → verify smooth motion for remote users
  - Document results in `docs/PERFORMANCE.md`

**PR Checklist:**
- [ ] Performance monitoring dashboard functional
- [ ] Sub-100ms object sync achieved (p95)
- [ ] Sub-50ms cursor sync achieved (p95)
- [ ] Network quality detection working
- [ ] All test scenarios pass
- [ ] Performance documentation complete

---

### PR #2: Conflict Resolution & State Management

**Branch:** `feature/conflict-resolution`  
**Goal:** Document and enhance conflict resolution strategy, eliminate ghost objects  
**Rubric Points:** 8-9 points

#### Tasks:

- [ ] **2.1: Implement Last-Write-Wins with Transactions**
  - Files to update: `src/services/canvas.js`
  - Wrap all shape updates in `runTransaction()`
  - Add server timestamp to every write
  - Client-side: Use local timestamp for optimistic UI
  - Server timestamp becomes authoritative on sync
  - Example:
    ```javascript
    await runTransaction(db, shapeRef, (current) => {
      if (!current.exists()) return null;
      return {
        ...current.data(),
        ...updates,
        updatedAt: serverTimestamp(),
        lastEditedBy: userId
      };
    });
    ```

- [ ] **2.2: Ghost Object Prevention**
  - Files to update: `src/services/canvas.js`, `src/hooks/useCanvas.js`
  - Add duplicate detection logic:
    - Check if shape with same `userId + timestamp` exists within 50ms
    - If duplicate found, discard client-side
  - Implement stale object sweep:
    - Every 5 seconds, query shapes with no activity > 2 min and no lock
    - Remove shapes that meet criteria
  - Add `isGhost` flag for shapes being deleted

- [ ] **2.3: Delete vs Edit Handling**
  - Files to update: `src/services/canvas.js`
  - Change delete behavior: Set `deleted: true` flag instead of removing document
  - When user attempts to edit deleted shape:
    - Show toast: "Object deleted by User X"
    - Cancel edit operation silently
  - Background job: Hard delete after 5 seconds of no active editors

- [ ] **2.4: Visual Feedback for Conflicts**
  - Files to create: `src/components/Canvas/EditIndicator.jsx`
  - Show last editor badge: Small avatar at top-right of shape (1s fade)
  - Orange glow on recently edited shapes (500ms fade)
  - Yellow flash when operation rejected due to conflict
  - Tooltip on locked shapes: "Another user is editing"

- [ ] **2.5: Comprehensive Testing**
  - Create test file: `tests/integration/conflict-resolution.test.js`
  - Test scenarios from rubric:
    - Simultaneous drag test
    - Rapid edit storm (3 users, 3 different operations)
    - Delete vs edit test
    - Create collision test
  - Document strategy in `docs/CONFLICT_RESOLUTION.md`:
    - Architecture diagram
    - Transaction flow
    - Failure modes and recovery

**PR Checklist:**
- [ ] All shape updates use transactions
- [ ] Duplicate detection prevents ghost objects
- [ ] Delete vs edit handled correctly
- [ ] Visual feedback implemented
- [ ] All rubric test scenarios pass
- [ ] Conflict resolution documented

---

### PR #3: Persistence & Reconnection

**Branch:** `feature/offline-persistence`  
**Goal:** Perfect state preservation, automatic reconnection with queue replay  
**Rubric Points:** 8-9 points

#### Tasks:

- [ ] **3.1: Offline Operation Queue**
  - Files to create: `src/utils/offline.js`, `src/services/offline.js`, `src/contexts/OfflineContext.jsx`
  - Use IndexedDB to store pending operations (max 500 ops or 5MB)
  - Queue structure:
    ```javascript
    {
      id: uuid(),
      type: 'createShape' | 'updateShape' | 'deleteShape',
      data: { ... },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending' | 'failed'
    }
    ```
  - Implement queue manager with enqueue/dequeue/replay methods

- [ ] **3.2: Optimistic UI with Rollback**
  - Files to update: `src/hooks/useCanvas.js`
  - Apply operations immediately to local state
  - On network failure: Keep operation in local state + add to queue
  - On reconnect: Replay queue, resolve conflicts
  - On permanent failure (3 retries): Rollback local state + show error

- [ ] **3.3: Connection Status UI**
  - Files to create: `src/components/UI/ConnectionStatus.jsx`
  - Top banner with connection states:
    - Green "Connected" → Auto-dismiss after 2s
    - Yellow "Reconnecting..." → Show indefinitely
    - Red "Offline - X pending changes" → Show queue count
  - Implement with Firebase's `onDisconnect()` listeners

- [ ] **3.4: Firestore Offline Persistence**
  - Files to update: `src/services/firebase.js`
  - Enable Firestore offline persistence:
    ```javascript
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
      }
    });
    ```
  - Configure cache size: 40MB

- [ ] **3.5: Comprehensive Testing**
  - Create test file: `tests/integration/persistence.test.js`
  - Test scenarios from rubric:
    - Mid-drag refresh test
    - Total disconnect test (2 min wait)
    - Network drop recovery (30s offline)
    - Rapid edits + immediate close
  - Test with Firebase Emulator
  - Document results in `docs/PERFORMANCE.md`

**PR Checklist:**
- [ ] IndexedDB queue functional
- [ ] Optimistic UI with rollback working
- [ ] Connection status banner shows correctly
- [ ] Firestore offline persistence enabled
- [ ] All rubric test scenarios pass
- [ ] Mid-operation refresh preserves state
- [ ] Network drop recovery successful

---

## Section 2: Canvas Features & Performance (20 points)

### PR #4: Canvas Functionality Enhancements

**Branch:** `feature/canvas-enhancements`  
**Goal:** Complete all canvas features for 7-8 point "Excellent" rating  
**Rubric Points:** 7-8 points

#### Tasks:

- [ ] **4.1: Text Formatting Toolbar**
  - Files to create: `src/components/UI/TextFormattingToolbar.jsx`
  - Contextual toolbar (appears below selected text)
  - Features:
    - Font family dropdown: Inter, Roboto, Merriweather, Courier, Comic Sans
    - Font size slider: 8px - 144px
    - Bold, Italic, Underline toggle buttons
    - Text alignment: Left, Center, Right buttons
    - Line height slider: 1.0 - 3.0
  - Update `ShapeRenderer.jsx` to apply text properties
  - Store properties in Firestore: `fontFamily`, `fontSize`, `fontStyle`, `align`, `lineHeight`

- [ ] **4.2: Multi-Select Enhancements**
  - Files to create: `src/components/Canvas/MarqueeSelect.jsx`, `src/components/Canvas/SelectionBounds.jsx`
  - Current: Shift + click ✅
  - Add: Drag empty area → Draw marquee rectangle
  - Add: Ctrl + click to add/remove from selection
  - Add: Select all (Cmd/Ctrl + A)
  - Multi-select transformer: Unified bounding box around all selected
  - Update `Canvas.jsx` to handle multi-select state

- [ ] **4.3: Layers Panel**
  - Files to create: `src/components/UI/LayersPanel.jsx`
  - Right sidebar (300px width, resizable via drag handle)
  - Tree view showing shape hierarchy:
    - Use `react-sortable-tree` or build custom
    - Each item: Icon, name, eye icon, lock icon
  - Drag to reorder (updates z-index in Firestore)
  - Double-click to rename layer
  - Right-click context menu: Delete, Duplicate, Group
  - Search/filter input at top
  - Color-code by type: Rectangle=blue, Circle=red, etc.

- [ ] **4.4: Transform Operations**
  - Files to create: `src/components/UI/TransformPanel.jsx`
  - Current: Konva Transformer for resize/rotate ✅
  - Ensure: Aspect ratio lock (Shift + drag)
  - Ensure: 15° rotation increments (Shift + rotate)
  - Add: Flip horizontal/vertical buttons
  - Add: Reset rotation button (sets to 0°)
  - Add: Numeric inputs for X, Y, W, H, rotation
  - Panel appears when shape selected (below toolbar)

- [ ] **4.5: Advanced Copy/Paste/Duplicate**
  - Files to update: `src/hooks/useKeyboard.js` (NEW)
  - Implement keyboard shortcuts:
    - Cmd/Ctrl + D: Duplicate selected (offset by 20px)
    - Cmd/Ctrl + C: Copy selected to clipboard
    - Cmd/Ctrl + X: Cut selected (copy + delete)
    - Cmd/Ctrl + V: Paste from clipboard
  - Use localStorage for clipboard (fallback if Clipboard API unavailable)
  - Paste at cursor position or center of viewport

**PR Checklist:**
- [ ] Text formatting toolbar functional with 5 fonts
- [ ] Multi-select works with marquee, Ctrl+click, Cmd+A
- [ ] Layers panel with drag-to-reorder operational
- [ ] Transform operations complete (flip, numeric inputs)
- [ ] Copy/paste/duplicate working with keyboard shortcuts

---

### PR #5: Performance & Scalability

**Branch:** `feature/performance-optimization`  
**Goal:** 500+ objects at 60 FPS, 5+ concurrent users  
**Rubric Points:** 11-12 points

#### Tasks:

- [ ] **5.1: Shape Virtualization**
  - Files to update: `src/components/Canvas/Canvas.jsx`, `src/hooks/useCanvas.js`
  - Calculate viewport bounds from camera position and zoom
  - Add 20% buffer around viewport
  - Filter shapes: Only render if in viewport + buffer
  - Set `hitGraphEnabled: false` for off-screen shapes
  - Update filter on pan/zoom events

- [ ] **5.2: Batch Updates**
  - Files to update: `src/services/canvas.js`
  - Use Firestore `writeBatch()` for bulk operations
  - Group updates within 50ms window
  - Max 500 operations per batch
  - Optimize: Single batch for multi-select move

- [ ] **5.3: Efficient Rendering**
  - Files to update: `src/components/Canvas/ShapeRenderer.jsx`
  - Set `listening: false` on shapes not selected
  - Disable shadows on shapes < 50px (based on zoom)
  - Use `perfectDrawEnabled: false` for faster rendering
  - Implement shape caching: `cache()` for static shapes

- [ ] **5.4: Data Structure Optimization**
  - Files to update: `src/contexts/CanvasContext.jsx`
  - Change shapes state from array to Map<shapeId, shape>
  - Index shapes by spatial hash for O(1) viewport queries:
    ```javascript
    const gridSize = 1000;
    const spatialHash = new Map();
    shapes.forEach(shape => {
      const key = `${Math.floor(shape.x / gridSize)},${Math.floor(shape.y / gridSize)}`;
      if (!spatialHash.has(key)) spatialHash.set(key, []);
      spatialHash.get(key).push(shape);
    });
    ```

- [ ] **5.5: Network Optimization**
  - Files to update: `src/services/firebase.js`
  - Enable Firestore offline persistence (already done in PR #3)
  - Use RTDB connection pooling (default in Firebase SDK)
  - Compress payloads > 10KB with LZ-string:
    ```javascript
    import LZString from 'lz-string';
    const compressed = LZString.compress(JSON.stringify(data));
    ```

- [ ] **5.6: Performance Testing**
  - Create test file: `tests/e2e/performance.spec.js` (Playwright)
  - Test scenarios from rubric:
    - Create 500 rectangles in grid → Pan/zoom maintains 60 FPS
    - Open 5 browser windows → All can edit simultaneously
    - Load canvas with 500 shapes → Loads in < 2s
    - Monitor memory → Stays < 200MB after 10 min
  - Use Playwright's performance tracing
  - Generate report: `npx playwright show-report`

- [ ] **5.7: Performance Dashboard**
  - Files to update: `src/components/UI/PerformanceMonitor.jsx`
  - Display metrics in top-right corner (dev mode only):
    - FPS counter (real-time)
    - Object count
    - Memory usage (MB)
    - Network latency (ms)
  - Toggle visibility with Cmd/Ctrl + Shift + P

**PR Checklist:**
- [ ] Shape virtualization working (only render visible)
- [ ] Batch updates implemented
- [ ] Rendering optimizations applied
- [ ] Map-based data structure for shapes
- [ ] Network payloads compressed
- [ ] 500+ objects at 60 FPS confirmed
- [ ] 5+ concurrent users tested successfully
- [ ] Load time < 2s for 500 shapes
- [ ] Memory usage < 200MB
- [ ] Performance dashboard functional

---

## Section 3: Advanced Figma-Inspired Features (15 points)

### PR #6: Undo/Redo System (Tier 1)

**Branch:** `feature/undo-redo`  
**Goal:** Complete undo/redo with keyboard shortcuts  
**Rubric Points:** 2 points

#### Tasks:

- [ ] **6.1: Command Pattern Implementation**
  - Files to create: `src/utils/commands.js`
  - Define command interface:
    ```javascript
    class Command {
      execute() {}
      undo() {}
      redo() {}
    }
    ```
  - Implement concrete commands:
    - `CreateShapeCommand`
    - `UpdateShapeCommand`
    - `DeleteShapeCommand`
    - `MoveShapeCommand`
    - `GroupShapesCommand`

- [ ] **6.2: Undo Manager**
  - Files to create: `src/services/undo.js`, `src/contexts/UndoContext.jsx`
  - Maintain two stacks: `undoStack`, `redoStack`
  - Max 100 commands in history
  - Methods: `execute()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`
  - Clear redo stack on new command execution

- [ ] **6.3: Keyboard Shortcuts**
  - Files to update: `src/hooks/useKeyboard.js`
  - Cmd/Ctrl + Z → Undo
  - Cmd/Ctrl + Shift + Z → Redo
  - Show toast on undo/redo: "Undo: Moved rectangle"

- [ ] **6.4: Integration with Canvas Operations**
  - Files to update: All canvas operation files
  - Wrap every canvas operation in command pattern
  - Call `undoManager.execute(command)` instead of direct execution
  - Ensure real-time sync still works

- [ ] **6.5: Persistence**
  - Store undo stack in localStorage (last 50 commands)
  - Clear on refresh to avoid stale state
  - Option: Persist to Firestore for cross-session undo

**PR Checklist:**
- [ ] Command pattern implemented for all operations
- [ ] Undo/redo keyboard shortcuts working
- [ ] Toast feedback on undo/redo
- [ ] Undo stack limited to 100 commands
- [ ] Undo/redo works correctly with real-time collaboration

---

### PR #7: Keyboard Shortcuts & Grouping (Tier 1)

**Branch:** `feature/keyboard-shortcuts-grouping`  
**Goal:** Comprehensive keyboard shortcuts + object grouping  
**Rubric Points:** 4 points (2 per feature)

#### Tasks:

- [ ] **7.1: Keyboard Shortcuts Implementation**
  - Files to update: `src/hooks/useKeyboard.js`
  - Implement shortcuts:
    - Delete/Backspace: Delete selected (existing ✅)
    - Cmd/Ctrl + D: Duplicate
    - Cmd/Ctrl + C/X/V: Copy/Cut/Paste
    - Cmd/Ctrl + A: Select all
    - Cmd/Ctrl + Z/Shift+Z: Undo/Redo (PR #6 ✅)
    - Arrow keys: Move selected 10px (Shift = 1px)
    - Cmd/Ctrl + G: Group selected
    - Cmd/Ctrl + Shift + G: Ungroup
    - R, C, L, T, Shift+T, S: Create shapes (existing ✅)
    - Cmd/Ctrl + /: Show shortcuts modal

- [ ] **7.2: Keyboard Shortcuts Modal**
  - Files to create: `src/components/UI/KeyboardShortcutsModal.jsx`
  - Display all shortcuts in organized sections:
    - **General**: Undo, Redo, Select All
    - **Editing**: Copy, Cut, Paste, Duplicate, Delete
    - **Movement**: Arrow keys, Shift+Arrow
    - **Creation**: R, C, L, T, etc.
    - **Layout**: Grouping, Alignment
  - Show with Cmd/Ctrl + / or "?" button in toolbar
  - Close with Escape or click outside

- [ ] **7.3: Object Grouping**
  - Files to create: `src/services/grouping.js`
  - Data model for groups:
    ```javascript
    {
      groupId: uuid(),
      type: 'group',
      children: [shapeId1, shapeId2, ...],
      x: number, // group center
      y: number,
      rotation: number,
      locked: boolean
    }
    ```
  - Group selected objects: Cmd/Ctrl + G
    - Calculate group bounds
    - Create group document in Firestore
    - Update children to reference groupId
  - Ungroup: Cmd/Ctrl + Shift + G
    - Delete group document
    - Remove groupId from children

- [ ] **7.4: Group Interactions**
  - Files to update: `src/components/Canvas/ShapeRenderer.jsx`, `src/hooks/useCanvas.js`
  - Clicking group selects entire group
  - Moving group moves all children (relative positions preserved)
  - Transforming group transforms all children
  - Groups can contain nested groups (max 5 levels)
  - Layers panel shows groups as expandable items

**PR Checklist:**
- [ ] All keyboard shortcuts implemented
- [ ] Shortcuts modal displays correctly
- [ ] Arrow keys move shapes (10px, Shift=1px)
- [ ] Grouping creates group document
- [ ] Moving group moves all children
- [ ] Ungrouping removes group
- [ ] Nested groups supported (max 5 levels)
- [ ] Layers panel shows group hierarchy

---

### PR #8: Layers Panel & Alignment Tools (Tier 2)

**Branch:** `feature/layers-alignment`  
**Goal:** Full layers panel + alignment tools  
**Rubric Points:** 6 points (3 per feature)

#### Tasks:

- [ ] **8.1: Layers Panel (Already done in PR #4, enhance here)**
  - Files to update: `src/components/UI/LayersPanel.jsx`
  - Already implemented: Tree view, drag-to-reorder, eye/lock icons
  - Enhancements:
    - Right-click context menu:
      - Duplicate layer
      - Delete layer
      - Group layers
      - Lock/Unlock
      - Hide/Show
    - Multi-select in layers (Shift+click, Cmd+click)
    - Drag multiple layers to reorder
    - Layer color indicators (by shape type)

- [ ] **8.2: Alignment Tools**
  - Files to create: `src/components/UI/AlignmentTools.jsx`, `src/utils/geometry.js`
  - Toolbar button "Align" → Dropdown menu
  - Alignment options:
    - **Align Left**: Align all selected to leftmost X
    - **Align Center**: Align all to center X
    - **Align Right**: Align all to rightmost X
    - **Align Top**: Align all to topmost Y
    - **Align Middle**: Align all to center Y
    - **Align Bottom**: Align all to bottommost Y
    - **Distribute Horizontally**: Equal spacing between selected
    - **Distribute Vertically**: Equal spacing between selected

- [ ] **8.3: Alignment Implementation**
  - Files to create: `src/utils/geometry.js`
  - Calculate selection bounds:
    ```javascript
    function getSelectionBounds(shapes) {
      const minX = Math.min(...shapes.map(s => s.x));
      const maxX = Math.max(...shapes.map(s => s.x + s.width));
      const minY = Math.min(...shapes.map(s => s.y));
      const maxY = Math.max(...shapes.map(s => s.y + s.height));
      return { minX, maxX, minY, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
    }
    ```
  - Apply alignment transformations
  - Update all shapes in single batch transaction

- [ ] **8.4: Smart Guides**
  - Files to create: `src/components/Canvas/SmartGuides.jsx`
  - While aligning, show dotted lines indicating alignment
  - Red dotted line at alignment axis
  - Auto-snap to alignment when within 5px
  - Hide guides after operation completes

- [ ] **8.5: Keyboard Shortcuts for Alignment**
  - Files to update: `src/hooks/useKeyboard.js`
  - Cmd/Ctrl + Shift + L: Align left
  - Cmd/Ctrl + Shift + C: Align center
  - Cmd/Ctrl + Shift + R: Align right
  - Cmd/Ctrl + Shift + T: Align top
  - Cmd/Ctrl + Shift + M: Align middle
  - Cmd/Ctrl + Shift + B: Align bottom

**PR Checklist:**
- [ ] Layers panel context menu functional
- [ ] Multi-select in layers working
- [ ] Alignment tools dropdown complete
- [ ] All 8 alignment options working correctly
- [ ] Smart guides appear during alignment
- [ ] Keyboard shortcuts for alignment functional
- [ ] Batch updates for alignment (single transaction)

---

### PR #9: Collaborative Comments (Tier 3)

**Branch:** `feature/collaborative-comments`  
**Goal:** Full commenting system with pins, threads, replies  
**Rubric Points:** 3 points

#### Tasks:

- [ ] **9.1: Comment Data Model**
  - Files to create: `src/services/comments.js`
  - Firestore collection: `/canvas/{canvasId}/comments/{commentId}`
  - Schema:
    ```javascript
    {
      commentId: string,
      canvasId: string,
      position: { x: number, y: number },
      author: {
        userId: string,
        displayName: string,
        photoURL: string
      },
      text: string,
      replies: [
        {
          replyId: string,
          author: { userId, displayName, photoURL },
          text: string,
          timestamp: Timestamp
        }
      ],
      resolved: boolean,
      createdAt: Timestamp,
      updatedAt: Timestamp
    }
    ```

- [ ] **9.2: Comment Mode UI**
  - Files to create: `src/components/UI/CommentPin.jsx`, `src/components/UI/CommentModal.jsx`
  - Toolbar button: "Comment" → Activates comment mode
  - Cursor changes to speech bubble icon
  - Click canvas → Places comment pin (speech bubble SVG)
  - Modal opens: Text input + "Post" button
  - Pin position stored in canvas coordinates (transforms with zoom/pan)

- [ ] **9.3: Comment Threads**
  - Files to update: `src/components/UI/CommentModal.jsx`
  - Click pin → Opens comment modal
  - Display:
    - Original comment with author avatar + timestamp
    - Reply list below
    - Reply input at bottom
  - Reply to comment: Add to `replies` array
  - Real-time updates: Subscribe to comment document changes

- [ ] **9.4: Comment Resolution**
  - Files to update: `src/components/UI/CommentPin.jsx`
  - Resolve button in comment modal (checkmark icon)
  - Sets `resolved: true` in Firestore
  - Resolved pins: Checkmark icon, faded opacity (0.5)
  - Filter: "Show resolved" toggle in toolbar

- [ ] **9.5: Comment Presence**
  - Files to update: `src/services/comments.js`
  - Track who's typing in comment thread
  - RTDB path: `/comments/{canvasId}/{commentId}/typing/{userId}`
  - Show "User X is typing..." in comment modal
  - Clear typing state on blur or 3s timeout

- [ ] **9.6: Comment Permissions**
  - Files to update: `firestore.rules`
  - Owner can delete their own comments
  - All users can read/create comments
  - All users can reply to any comment
  - Rules:
    ```javascript
    match /canvas/{canvasId}/comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null; // For replies
      allow delete: if request.auth.uid == resource.data.author.userId;
    }
    ```

**PR Checklist:**
- [ ] Comment mode button activates correctly
- [ ] Comment pins placed on canvas
- [ ] Comment modal displays thread
- [ ] Replies work correctly
- [ ] Resolve functionality working
- [ ] Typing indicators show in real-time
- [ ] All users see comments in real-time
- [ ] Delete own comments working
- [ ] Firestore rules for comments deployed

---

## Section 4: AI Canvas Agent (25 points)

### PR #10: AI Agent Foundation

**Branch:** `feature/ai-agent-core`  
**Goal:** LLM integration, command parser, basic commands  
**Rubric Points:** 10 points (Command Breadth)

#### Tasks:

- [ ] **10.1: AI Service Setup**
  - Files to create: `src/services/ai.js`, `src/contexts/AIContext.jsx`
  - Install Anthropic SDK: `npm install @anthropic-ai/sdk`
  - Initialize client:
    ```javascript
    import Anthropic from '@anthropic-ai/sdk';
    const client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true // For demo purposes
    });
    ```
  - Environment variable: `VITE_ANTHROPIC_API_KEY`

- [ ] **10.2: System Prompt Engineering**
  - Files to update: `src/services/ai.js`
  - Create dynamic system prompt:
    ```javascript
    function buildSystemPrompt(canvasState) {
      return `You are an AI canvas assistant that interprets design commands.

    Canvas state:
    - Size: 20000x20000
    - Viewport: ${JSON.stringify(canvasState.viewport)}
    - Shapes: ${JSON.stringify(canvasState.shapes)}

    Available operations:
    1. createShape(type, x, y, properties)
       - Types: rectangle, circle, line, text, triangle, star
       - Properties: width, height, radius, fill, stroke, etc.
    2. moveShape(id, x, y)
    3. resizeShape(id, width, height)
    4. rotateShape(id, degrees)
    5. updateProperties(id, properties)
    6. deleteShape(id)
    7. groupShapes(ids)

    Return JSON array of operations. Be specific with coordinates.`;
    }
    ```

- [ ] **10.3: Command Parser**
  - Files to update: `src/services/ai.js`
  - Send user command to Claude:
    ```javascript
    async function parseCommand(userCommand, canvasState) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: userCommand
        }],
        system: buildSystemPrompt(canvasState)
      });
      
      const operations = JSON.parse(response.content[0].text);
      return operations;
    }
    ```

- [ ] **10.4: Operation Executor**
  - Files to create: `src/utils/commands.js` (enhance from PR #6)
  - Execute operations array:
    ```javascript
    async function executeOperations(operations) {
      for (const op of operations) {
        switch (op.type) {
          case 'createShape':
            await createShape(op.params);
            break;
          case 'moveShape':
            await updateShape(op.params.id, { x: op.params.x, y: op.params.y });
            break;
          // ... other operations
        }
      }
    }
    ```

- [ ] **10.5: AI Command Input UI**
  - Files to create: `src/components/AI/AICommandInput.jsx`
  - Fixed input bar at bottom of canvas (like ChatGPT interface)
  - Text input: "Ask AI to modify canvas..."
  - Send button (Enter key to submit)
  - Loading state: "AI is thinking..."
  - Character limit: 500 chars

- [ ] **10.6: Basic Commands Implementation (8 minimum)**
  - Test and ensure these commands work:
    1. "Create a red rectangle at 100, 200"
    2. "Add text that says Hello World at the center"
    3. "Make a blue circle at 300, 400"
    4. "Move the red rectangle to the center"
    5. "Resize the circle to twice its size"
    6. "Rotate the text 45 degrees"
    7. "Change all rectangles to purple"
    8. "Delete all circles"
  - Document in `docs/AI_AGENT.md`

**PR Checklist:**
- [ ] Anthropic SDK installed and configured
- [ ] System prompt dynamically includes canvas state
- [ ] Command parser returns valid operations JSON
- [ ] Operation executor applies operations to canvas
- [ ] AI input UI functional at bottom of screen
- [ ] At least 8 basic commands working correctly
- [ ] Error handling for invalid commands
- [ ] Timeout handling (5s limit)

---

### PR #11: Complex AI Commands

**Branch:** `feature/ai-complex-commands`  
**Goal:** Multi-shape layouts, smart positioning, complex execution  
**Rubric Points:** 8 points (Complex Command Execution)

#### Tasks:

- [ ] **11.1: Layout Intelligence**
  - Files to update: `src/services/ai.js`
  - Enhance system prompt with layout guidelines:
    ```javascript
    Layout Guidelines:
    - Use consistent spacing (20px between elements)
    - Center-align elements within containers
    - Apply professional styling (subtle shadows, borders)
    - Group related elements together
    - Use standard sizes (buttons 280x45, inputs 280x40)
    ```

- [ ] **11.2: Complex Command Templates**
  - Files to create: `src/utils/aiTemplates.js`
  - Pre-defined templates for common layouts:
    - Login Form: Container + title + 2 inputs + button
    - Nav Bar: Background + evenly spaced text items
    - Card: Container + title + image placeholder + description
    - Dashboard: Header + sidebar + main content
  - LLM can reference templates or generate from scratch

- [ ] **11.3: Login Form Command**
  - Test command: "Create a login form"
  - Expected output: 6-8 shapes
    1. Container rectangle (300x400, white, shadow)
    2. Title text ("Login", 24px, bold)
    3. Username label ("Username", 14px)
    4. Username input (280x40, gray border)
    5. Password label ("Password", 14px)
    6. Password input (280x40, gray border)
    7. Button rectangle (280x45, blue fill)
    8. Button text ("Sign In", white)
  - All elements auto-grouped

- [ ] **11.4: Nav Bar Command**
  - Test command: "Build a navigation bar with Home, About, Contact, Pricing"
  - Expected output: 5 shapes
    1. Background rectangle (1200x60, dark gray)
    2-5. Four text elements (evenly spaced, white, 16px)
  - Calculate even spacing: (1200 - 4*textWidth) / 5

- [ ] **11.5: Smart Positioning**
  - Files to update: `src/services/ai.js`
  - Teach AI to position relative to viewport:
    - "center" → viewport center
    - "top left" → (50, 50)
    - "top right" → (viewportWidth - 50, 50)
  - Avoid overlaps with existing shapes
  - Snap to grid (optional)

- [ ] **11.6: Multi-Step Operations**
  - Test command: "Create 3 circles and arrange them in a horizontal row"
  - AI should:
    1. Create 3 circles
    2. Calculate positions for row layout
    3. Apply positions
  - All operations in single response

**PR Checklist:**
- [ ] Layout intelligence in system prompt
- [ ] "Create login form" produces 6+ shapes in logical layout
- [ ] "Build nav bar" works correctly with even spacing
- [ ] "Create card layout" produces 3+ elements
- [ ] Smart positioning (center, top left, etc.) works
- [ ] Multi-step commands execute correctly
- [ ] All complex shapes auto-grouped
- [ ] Professional styling applied (shadows, borders)

---

### PR #12: AI Performance & Reliability

**Branch:** `feature/ai-performance`  
**Goal:** Sub-2s responses, 90%+ accuracy, multi-user support  
**Rubric Points:** 7 points (AI Performance & Reliability)

#### Tasks:

- [ ] **12.1: Response Time Optimization**
  - Files to update: `src/services/ai.js`
  - Set max_tokens: 1024 (reduce for faster responses)
  - Timeout: 5 seconds
  - Cancel request if timeout exceeded
  - Show loading indicator: "AI is thinking..."
  - Show progress bar for multi-step operations

- [ ] **12.2: Error Handling**
  - Files to update: `src/services/ai.js`, `src/components/AI/AIFeedback.jsx`
  - Handle errors gracefully:
    - Ambiguous command → Ask for clarification: "Did you mean...?"
    - Invalid operation → Show error toast
    - Timeout → "AI took too long, please try again"
    - Rate limit hit → "Too many requests, wait X seconds"
  - Log all errors for debugging

- [ ] **12.3: User Feedback**
  - Files to update: `src/components/AI/AIFeedback.jsx`
  - Success toast: "Created login form (6 shapes)"
  - Show LLM's explanation from response
  - Progress bar for operations (1/6, 2/6, ...)
  - Undo button in success toast (undoes entire AI operation)

- [ ] **12.4: Multi-User AI Support**
  - Files to update: `src/services/ai.js`
  - AI-created shapes include `createdByAI: true` flag
  - AI operations use same locking mechanism as manual edits
  - Multiple users can use AI simultaneously
  - AI operations appear in undo history
  - Test with 2+ users issuing commands simultaneously

- [ ] **12.5: Rate Limiting**
  - Files to create: `src/hooks/useRateLimit.js`
  - Max 10 AI commands per user per minute
  - Store count in localStorage with timestamp
  - Reset count after 60 seconds
  - Show remaining quota in UI
  - Clear error message when limit exceeded

- [ ] **12.6: Command History**
  - Files to create: `src/components/AI/AICommandHistory.jsx`
  - Show last 10 commands in dropdown
  - Click to re-run command
  - Clear history button
  - Store in localStorage

- [ ] **12.7: Accuracy Testing**
  - Create test file: `tests/integration/ai-commands.test.js`
  - Test 20 commands, measure accuracy:
    - Creation commands (8)
    - Manipulation commands (6)
    - Layout commands (3)
    - Complex commands (3)
  - Target: 90%+ correct interpretation
  - Document results in `docs/AI_AGENT.md`

**PR Checklist:**
- [ ] Response time < 2s (p95)
- [ ] Error handling covers all failure modes
- [ ] User feedback (toasts, progress) working
- [ ] Multi-user AI tested successfully
- [ ] Rate limiting prevents abuse (10/min)
- [ ] Command history functional
- [ ] Accuracy testing shows 90%+ correct
- [ ] AI operations in undo history
- [ ] AI shapes flagged with `createdByAI: true`

---

## Section 5: Technical Implementation (10 points)

### PR #13: Architecture Refactoring

**Branch:** `feature/architecture-cleanup`  
**Goal:** Clean code structure, design patterns, error handling  
**Rubric Points:** 5 points (Architecture Quality)

#### Tasks:

- [ ] **13.1: Code Organization Audit**
  - Files to audit: All files in `src/`
  - Ensure proper separation of concerns:
    - Components: UI only, no business logic
    - Services: All API calls and data operations
    - Hooks: Stateful logic, side effects
    - Utils: Pure functions, helpers
    - Contexts: Global state management

- [ ] **13.2: Design Pattern Implementation**
  - Verify patterns in use:
    - **Command Pattern**: Undo/redo (PR #6 ✅)
    - **Observer Pattern**: Context subscriptions ✅
    - **Factory Pattern**: ShapeRenderer (existing ✅)
    - **Singleton Pattern**: Firebase, offline queue
    - **Strategy Pattern**: Conflict resolution strategies

- [ ] **13.3: Error Boundary Components**
  - Files to create: `src/components/ErrorBoundary.jsx`
  - Top-level error boundary:
    ```javascript
    class ErrorBoundary extends React.Component {
      state = { hasError: false };
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      componentDidCatch(error, info) {
        console.error('Error:', error, info);
      }
      render() {
        if (this.state.hasError) {
          return <div>Something went wrong. Please refresh.</div>;
        }
        return this.props.children;
      }
    }
    ```
  - Wrap App in ErrorBoundary

- [ ] **13.4: Comprehensive Error Handling**
  - Files to audit: All service files
  - Wrap all async operations in try-catch
  - Graceful degradation (offline mode, read-only mode)
  - User-friendly error messages (no raw Firebase errors)
  - Example:
    ```javascript
    try {
      await updateShape(id, updates);
    } catch (error) {
      console.error('Failed to update shape:', error);
      toast.error('Failed to update shape. Please try again.');
    }
    ```

- [ ] **13.5: Automatic Retry Logic**
  - Files to update: `src/services/canvas.js`, `src/services/offline.js`
  - Implement exponential backoff:
    ```javascript
    async function retryOperation(operation, maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await operation();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    ```

- [ ] **13.6: Code Quality Tools**
  - Install ESLint and Prettier:
    ```bash
    npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-react
    ```
  - Create `.eslintrc.js`:
    ```javascript
    module.exports = {
      extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
      rules: {
        'no-console': 'warn',
        'react/prop-types': 'off'
      }
    };
    ```
  - Run: `npm run lint`

**PR Checklist:**
- [ ] Code organized into proper directories
- [ ] All design patterns documented
- [ ] Error boundary wraps App
- [ ] All async operations have error handling
- [ ] Retry logic implemented
- [ ] ESLint configured and passing
- [ ] No console.errors in production code
- [ ] Services properly separated from components

---

### PR #14: Enhanced Authentication & Security

**Branch:** `feature/auth-enhancements`  
**Goal:** Production-grade auth with session management  
**Rubric Points:** 5 points (Authentication & Security)

#### Tasks:

- [ ] **14.1: Email Verification**
  - Files to create: `src/components/Auth/EmailVerification.jsx`
  - Send verification email after signup
  - Show banner for unverified users
  - Resend verification button (60s cooldown)
  - Verify email on link click
  - See Auth PRD (document 2) for full details

- [ ] **14.2: Password Reset**
  - Files to create: `src/components/Auth/ForgotPassword.jsx`, `src/components/Auth/ResetPassword.jsx`
  - "Forgot Password?" link on login page
  - Send reset email
  - Reset form with password strength meter
  - Confirm new password

- [ ] **14.3: Profile Management**
  - Files to update: `src/components/Auth/ProfileSettings.jsx` (enhance existing)
  - Tabs: Profile, Security, Account
  - Profile: Display name, email, photo upload
  - Security: Change password, view active sessions
  - Account: Account info, delete account

- [ ] **14.4: Session Management**
  - Files to create: `src/components/Auth/ActiveSessions.jsx`
  - Store session metadata:
    ```javascript
    {
      sessionId: uuid(),
      userId: string,
      device: string, // Browser + OS
      ipAddress: string,
      location: string,
      createdAt: Timestamp,
      lastActiveAt: Timestamp
    }
    ```
  - Display active sessions in profile
  - "Logout" button for each session
  - "Logout all sessions" button

- [ ] **14.5: Auto-Logout**
  - Files to create: `src/hooks/useSessionTimeout.js`
  - Auto-logout after 30 days of inactivity
  - Check on app mount and every 5 minutes
  - Warn 5 minutes before logout
  - "Stay logged in" button extends session

- [ ] **14.6: Security Rules Enhancement**
  - Files to update: `firestore.rules`, `database.rules.json`, `storage.rules` (NEW)
  - Firestore rules:
    - Users can only write their own profile
    - Canvas shapes: Read/write for authenticated users
    - Comments: Owner can delete, all can read/create
  - RTDB rules:
    - Sessions: User can only write their own
    - Drags: Read/write for authenticated
  - Storage rules:
    - Users upload to own folder only
    - 5MB max file size
    - Images only (.jpg, .png, .gif, .webp)

- [ ] **14.7: Rate Limiting**
  - Use Firebase App Check:
    ```bash
    npm install firebase-app-check
    ```
  - Initialize in `src/services/firebase.js`:
    ```javascript
    import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
      isTokenAutoRefreshEnabled: true
    });
    ```

**PR Checklist:**
- [ ] Email verification working
- [ ] Password reset flow functional
- [ ] Profile settings complete
- [ ] Active sessions displayed
- [ ] Auto-logout after 30 days working
- [ ] Security rules deployed and tested
- [ ] Firebase App Check configured
- [ ] All auth flows tested end-to-end

---

## Section 6: Documentation & Deployment (5 points)

### PR #15: Comprehensive Documentation

**Branch:** `feature/documentation`  
**Goal:** Complete documentation for all features  
**Rubric Points:** 3 points (Repository & Setup)

#### Tasks:

- [ ] **15.1: README.md Rewrite**
  - Files to update: `README.md`
  - Follow structure from PRD Section 6.1
  - Sections:
    - Project overview
    - Features list
    - Tech stack
    - Setup instructions (step-by-step)
    - Environment variables
    - Testing commands
    - Architecture link
    - Contributing link
    - License

- [ ] **15.2: ARCHITECTURE.md**
  - Files to create: `docs/ARCHITECTURE.md`
  - Content:
    - System overview diagram
    - Component hierarchy
    - Data flow diagrams
    - Firebase architecture
    - Real-time sync architecture
    - AI agent architecture
    - Performance optimizations

- [ ] **15.3: CONFLICT_RESOLUTION.md**
  - Files to create: `docs/CONFLICT_RESOLUTION.md`
  - Content:
    - Strategy explanation (Last-Write-Wins)
    - Transaction flow diagram
    - Conflict scenarios and resolutions
    - Ghost object prevention
    - Testing scenarios

- [ ] **15.4: AI_AGENT.md**
  - Files to create: `docs/AI_AGENT.md`
  - Content:
    - LLM integration overview
    - System prompt structure
    - Supported commands (all 16+)
    - Complex command examples
    - Prompt engineering tips
    - Limitations and future improvements

- [ ] **15.5: PERFORMANCE.md**
  - Files to create: `docs/PERFORMANCE.md`
  - Content:
    - Performance targets
    - Optimization strategies
    - Benchmarking results
    - Profiling guide
    - Load testing results

- [ ] **15.6: API.md**
  - Files to create: `docs/API.md`
  - Content:
    - Service layer documentation
    - All public methods with examples
    - Data models
    - Error codes

- [ ] **15.7: TESTING.md**
  - Files to create: `docs/TESTING.md`
  - Content:
    - Testing strategy
    - How to run tests
    - Coverage reports
    - Test scenarios
    - CI/CD pipeline

- [ ] **15.8: .env.example**
  - Files to update: `.env.example`
  - Include all required environment variables with descriptions

**PR Checklist:**
- [ ] README.md comprehensive and clear
- [ ] All documentation files created
- [ ] Architecture diagrams included
- [ ] API documentation complete
- [ ] .env.example updated
- [ ] Links between docs working
- [ ] Documentation reviewed for accuracy

---

### PR #16: Production Deployment

**Branch:** `feature/production-deployment`  
**Goal:** Stable production deployment with monitoring  
**Rubric Points:** 2 points (Deployment)

#### Tasks:

- [ ] **16.1: Firebase Hosting Setup**
  - Files to update: `firebase.json`
  - Configure hosting:
    ```json
    {
      "hosting": {
        "public": "dist",
        "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
        "rewrites": [
          {
            "source": "**",
            "destination": "/index.html"
          }
        ],
        "headers": [
          {
            "source": "**/*.@(js|css)",
            "headers": [
              {
                "key": "Cache-Control",
                "value": "max-age=31536000"
              }
            ]
          }
        ]
      }
    }
    ```

- [ ] **16.2: Build Optimization**
  - Files to update: `vite.config.js`
  - Configure production build:
    ```javascript
    export default defineConfig({
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'firebase-vendor': ['firebase/app', 'firebase/firestore'],
              'konva-vendor': ['konva', 'react-konva']
            }
          }
        },
        target: 'esnext',
        minify: 'terser',
        sourcemap: false
      }
    });
    ```
  - Target bundle size: < 500KB gzipped

- [ ] **16.3: Environment Configuration**
  - Files to update: `.env.production`
  - Set production environment variables
  - Ensure API keys are secure (not in repo)
  - Use Firebase environment config

- [ ] **16.4: CI/CD Pipeline**
  - Files to create: `.github/workflows/deploy.yml`
  - GitHub Actions workflow:
    ```yaml
    name: Deploy to Firebase
    on:
      push:
        branches: [main]
    jobs:
      deploy:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          - uses: actions/setup-node@v2
          - run: npm ci
          - run: npm run build
          - run: npm test
          - uses: FirebaseExtended/action-hosting-deploy@v0
            with:
              repoToken: '${{ secrets.GITHUB_TOKEN }}'
              firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
              projectId: collabcanvas-99a09
    ```

- [ ] **16.5: Error Tracking**
  - Install Sentry:
    ```bash
    npm install @sentry/react
    ```
  - Initialize in `src/main.jsx`:
    ```javascript
    import * as Sentry from '@sentry/react';
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE
    });
    ```

- [ ] **16.6: Performance Monitoring**
  - Enable Firebase Performance:
    ```javascript
    import { getPerformance } from 'firebase/performance';
    const perf = getPerformance(app);
    ```
  - Set up custom traces for critical operations

- [ ] **16.7: Health Check Endpoint**
  - Files to create: `public/health.json`
  - Simple health check:
    ```json
    {
      "status": "ok",
      "timestamp": "2025-10-15T00:00:00Z"
    }
    ```

- [ ] **16.8: Lighthouse Optimization**
  - Run Lighthouse audit: `npx lighthouse https://collabcanvas.app`
  - Target: 90+ in all categories
  - Optimize:
    - Performance: Code splitting, lazy loading
    - Accessibility: ARIA labels, semantic HTML
    - Best Practices: HTTPS, console.log removal
    - SEO: Meta tags, sitemap

**PR Checklist:**
- [ ] Firebase Hosting configured
- [ ] Production build optimized (< 500KB gzipped)
- [ ] CI/CD pipeline operational
- [ ] Sentry error tracking enabled
- [ ] Firebase Performance monitoring enabled
- [ ] Health check endpoint working
- [ ] Lighthouse score 90+ all categories
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid

---

## Section 7 & 8: Required Deliverables

### Task #17: AI Development Log

**Goal:** Document AI usage throughout development  
**Status:** Pass/Fail (Required)

#### Tasks:

- [ ] **17.1: Create AI_DEVELOPMENT_LOG.md**
  - Files to create: `docs/AI_DEVELOPMENT_LOG.md`
  - Include 3 out of 5 sections (see PRD Section 7):
    1. Tools & Workflow
    2. Effective Prompting Strategies (3-5 examples)
    3. Code Analysis (% AI-generated vs hand-written)
    4. Strengths & Limitations
    5. Key Learnings

- [ ] **17.2: Document Throughout Development**
  - Keep notes during each PR
  - Track which code was AI-generated
  - Save effective prompts
  - Note where AI struggled
  - Record insights and learnings

**Completion Checklist:**
- [ ] Log includes 3+ sections
- [ ] Each section has meaningful content
- [ ] Specific examples provided
- [ ] Honest reflection on AI strengths/weaknesses
- [ ] Insights about AI-assisted development

---

### Task #18: Demo Video

**Goal:** 3-5 minute video demonstrating all features  
**Status:** Pass/Fail (Required)

#### Tasks:

- [ ] **18.1: Script & Planning**
  - Follow script from PRD Section 8
  - Sections:
    - Introduction (30s)
    - Real-time collaboration (60s)
    - AI canvas agent (60s)
    - Advanced features (60s)
    - Architecture explanation (30s)
    - Performance & scale (30s)
    - Conclusion (30s)

- [ ] **18.2: Recording Setup**
  - Install OBS Studio or Loom
  - Set resolution: 1080p or higher
  - Test audio: Clear, no background noise
  - Prepare two browsers for collaboration demo (side-by-side)

- [ ] **18.3: Recording**
  - Record each section separately
  - Show real-time collaboration with split screen
  - Demonstrate all AI commands
  - Show layers, alignment, comments
  - Display Firebase console
  - Show performance metrics

- [ ] **18.4: Editing & Upload**
  - Add captions/subtitles
  - Add transitions between sections
  - Include background music (optional)
  - Upload to YouTube (unlisted or public)
  - Get shareable link

**Completion Checklist:**
- [ ] Video is 3-5 minutes long
- [ ] 1080p or higher resolution
- [ ] Clear audio with no noise
- [ ] Real-time collaboration demonstrated (2+ users)
- [ ] Multiple AI commands shown
- [ ] Advanced features showcased
- [ ] Architecture explained
- [ ] Performance metrics visible
- [ ] Captions/subtitles included
- [ ] Uploaded and shareable link obtained

---

## Bonus Points (Optional +5)

### Task #19: Innovation - AI Design Suggestions

**Branch:** `feature/ai-suggestions`  
**Goal:** AI analyzes canvas and suggests improvements  
**Points:** +2

#### Tasks:

- [ ] **19.1: Analysis Engine**
  - Files to create: `src/services/aiSuggestions.js`
  - Analyze canvas for:
    - Alignment issues (shapes almost aligned but not quite)
    - Grouping opportunities (shapes close together)
    - Color contrast (accessibility)
    - Spacing inconsistencies

- [ ] **19.2: Suggestion UI**
  - Files to create: `src/components/AI/SuggestionTooltip.jsx`
  - Non-intrusive tooltips on canvas
  - Accept/Reject buttons
  - Examples:
    - "These shapes could be aligned better" → Accept aligns them
    - "Consider grouping these related elements" → Accept groups them

**Completion Checklist:**
- [ ] AI analyzes canvas periodically
- [ ] Suggestions appear as tooltips
- [ ] Accept button applies suggestion
- [ ] Reject button dismisses
- [ ] Suggestions are helpful and accurate

---

### Task #20: Polish - Exceptional UX/UI

**Branch:** `feature/ux-polish`  
**Goal:** Professional design system, animations, dark mode  
**Points:** +2

#### Tasks:

- [ ] **20.1: Design System**
  - Files to create: `src/styles/theme.js`
  - Define:
    - Color palette (primary, secondary, neutral)
    - Typography scale (12px to 48px)
    - Spacing scale (4px increments)
    - Border radius values
    - Shadow values

- [ ] **20.2: Animations**
  - Install Framer Motion: `npm install framer-motion`
  - Add animations:
    - Modal entrance/exit
    - Toolbar button hover effects
    - Toast slide-in
    - Smooth page transitions

- [ ] **20.3: Dark Mode**
  - Files to create: `src/contexts/ThemeContext.jsx`
  - Toggle in profile settings
  - Persist preference in localStorage
  - Dark color palette
  - Smooth theme transition

- [ ] **20.4: Accessibility**
  - Add ARIA labels to all interactive elements
  - Keyboard navigation for all features
  - Screen reader support
  - Focus indicators
  - Skip links

**Completion Checklist:**
- [ ] Design system documented
- [ ] Smooth animations throughout
- [ ] Dark mode toggle working
- [ ] ARIA labels on all elements
- [ ] Keyboard navigation functional
- [ ] Professional, cohesive design

---

### Task #21: Scale - Demonstrated Performance

**Branch:** `feature/scale-testing`  
**Goal:** 10+ concurrent users, 1000+ shapes at 60 FPS  
**Points:** +1

#### Tasks:

- [ ] **21.1: Load Testing**
  - Tool: Artillery or k6
  - Test scenarios:
    - 10 concurrent users editing
    - 1000 shapes on canvas
    - 100 operations per second

- [ ] **21.2: Video Evidence**
  - Record performance testing
  - Show Chrome DevTools performance tab
  - Display FPS counter (60 FPS maintained)
  - Show network tab (latency < 100ms)

- [ ] **21.3: Stress Test Report**
  - Files to create: `docs/LOAD_TEST_RESULTS.md`
  - Document:
    - Test methodology
    - Results (graphs, numbers)
    - Bottlenecks identified
    - Optimization recommendations

**Completion Checklist:**
- [ ] 10+ concurrent users tested
- [ ] 1000+ shapes at 60 FPS achieved
- [ ] Video evidence recorded
- [ ] Load test report documented
- [ ] Results show exceptional scale

---

## Testing Strategy

### Unit Tests (80%+ coverage target)

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Test Files to Create:**
- `tests/unit/geometry.test.js` - Alignment, collision detection
- `tests/unit/commands.test.js` - Command pattern operations
- `tests/unit/undo.test.js` - Undo/redo logic
- `tests/unit/offline.test.js` - Queue management
- `tests/unit/ai.test.js` - Command parsing

### Integration Tests

```bash
npm install --save-dev @testing-library/react-hooks
```

**Test Files to Create:**
- `tests/integration/collaboration.test.js` - Real-time sync
- `tests/integration/conflict-resolution.test.js` - Simultaneous edits
- `tests/integration/persistence.test.js` - Offline/reconnect
- `tests/integration/ai-commands.test.js` - AI operations

### E2E Tests

```bash
npm install --save-dev @playwright/test
```

**Test Files to Create:**
- `tests/e2e/multi-user.spec.js` - Two users editing simultaneously
- `tests/e2e/performance.spec.js` - Load 500 shapes, measure FPS
- `tests/e2e/ai-agent.spec.js` - Complete AI workflows

**Run Tests:**
```bash
npm run test          # Unit tests
npm run test:int      # Integration tests
npm run test:e2e      # E2E tests
npm run test:coverage # Coverage report
```

---

## Final Acceptance Criteria

**Before Submission:**

- [ ] All PRs merged and tested
- [ ] README.md complete and accurate
- [ ] All documentation files created
- [ ] Environment setup tested on fresh machine
- [ ] Production deployment stable
- [ ] Lighthouse score 90+ all categories
- [ ] All rubric test scenarios pass
- [ ] AI Development Log complete (3+ sections)
- [ ] Demo Video recorded and uploaded
- [ ] No critical bugs remaining
- [ ] 80%+ test coverage achieved
- [ ] Firebase security rules deployed
- [ ] Error tracking operational
- [ ] Performance monitoring enabled

**Rubric Score Breakdown:**

| Section | Target Points | Status |
|---------|---------------|--------|
| Core Collaborative Infrastructure | 30 | ☐ |
| Canvas Features & Performance | 20 | ☐ |
| Advanced Figma-Inspired Features | 15 | ☐ |
| AI Canvas Agent | 25 | ☐ |
| Technical Implementation | 10 | ☐ |
| Documentation & Submission | 5 | ☐ |
| **Total** | **105** | **☐** |
| Bonus: Innovation | +2 | ☐ |
| Bonus: Polish | +2 | ☐ |
| Bonus: Scale | +1 | ☐ |
| **Grand Total** | **110** | **☐** |

**Target Grade: A (95-100 points)**

---

## Timeline Summary

**Week 1**: PRs #1-3 (Core Infrastructure)
**Week 2**: PRs #4-5 (Canvas Features)
**Week 3**: PRs #6-9 (Advanced Features)
**Week 4**: PRs #10-12 (AI Agent)
**Week 5**: PRs #13-14 (Technical & Auth)
**Week 6**: PRs #15-16 (Documentation & Deployment)
**Week 7**: Tasks #17-18 (Deliverables) + Bonus Tasks #19-21

**Total Duration**: 7 weeks  
**Expected Score**: 95-100 points (Grade A)

---

**Document Version**: 2.0  
**Last Updated**: October 15, 2025  
**Status**: Ready for implementation