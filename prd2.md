# CollabCanvas Production PRD - Rubric Aligned

**Project**: CollabCanvas - Real-Time Collaborative Design Tool  
**Target Score**: 90-100 points (Grade A)  
**Goal**: Build production-grade collaborative canvas with AI agent meeting all rubric criteria

---

## Executive Summary

This PRD defines the complete feature set required to achieve an "Excellent" rating (90-100 points) across all rubric sections. Current project status shows MVP collaboration features are functional; this document covers remaining gaps and enhancements needed for rubric compliance.

---

## Section 1: Core Collaborative Infrastructure (30 points target)

**Current Status**: 
- ✅ Sub-100ms object sync via Firebase RTDB
- ✅ Sub-50ms cursor sync (33ms interval)
- ✅ First-touch locking with 8s TTL
- ⚠️ Conflict resolution strategy not fully documented
- ⚠️ Persistence tested but not to rubric scenarios

**Required Enhancements**:

### 1.1 Real-Time Synchronization (Target: 11-12 points)

**Performance Targets** (All Must-Have):
- Object sync: < 100ms end-to-end latency
- Cursor sync: < 50ms end-to-end latency  
- Drag stream: ~60Hz (16ms interval)
- Zero visible lag during 3+ user concurrent edits

**Implementation Requirements**:
- Maintain existing RTDB streaming architecture
- Add performance monitoring with Firebase Performance
- Implement client-side metrics collection
- Dashboard showing p50, p95, p99 sync latencies
- Alert system for degraded performance

**Testing Scenarios** (Must Pass All):
1. Three users simultaneously drag different objects → all see updates < 100ms
2. Five users move cursors rapidly → all cursors visible < 50ms
3. User A drags object in rapid zigzag → User B sees smooth motion, not jumpy
4. Network throttled to 3G → sync still works, graceful degradation visible

### 1.2 Conflict Resolution & State Management (Target: 8-9 points)

**Strategy**: Last-Write-Wins with Timestamp Authority + Firebase Atomic Transactions

**Documented Requirements**:

1. **Simultaneous Edit Resolution**:
   - Use Firebase's `runTransaction()` for all shape updates
   - Client timestamps for operation ordering
   - Server timestamp override for authority
   - Last write within 100ms window wins
   - Visual feedback: Orange glow on recently edited objects (500ms fade)

2. **Ghost Object Prevention**:
   - Every shape creation includes atomic Firestore write
   - Creation timestamp + userId as composite key
   - Duplicate detection: Same userId + timestamp within 50ms → discard client-side
   - Stale object sweep every 5 seconds: Remove shapes with no activity > 2 minutes and no lock

3. **Delete vs Edit Handling**:
   - Deletion sets `deleted: true` flag, not actual deletion
   - Active editors see "Object deleted by User X" toast
   - Editing operations on deleted objects no-op silently
   - Hard delete after 5 seconds of no active editors

4. **Visual Feedback**:
   - Last editor badge: Small user avatar at top-right of shape (1s fade)
   - Edit conflict indicator: Yellow flash when operation rejected
   - "Another user is editing" tooltip on locked objects

**Testing Scenarios** (Must Pass All):
1. User A and B both drag same rectangle → Both see final position from last user
2. User A resizes, User B changes color, User C moves (rapid storm) → All changes apply, no corruption
3. User A deletes while User B editing → User B sees deletion toast, their edits don't apply
4. Two users create objects at identical timestamp → Only one appears, no duplicates

**Documentation Deliverable**:
- `CONFLICT_RESOLUTION.md` in repo root
- Architecture diagram showing transaction flow
- Failure mode analysis and recovery strategies

### 1.3 Persistence & Reconnection (Target: 8-9 points)

**Requirements**:

1. **Mid-Operation Refresh**:
   - User refreshes during drag → Object position preserved at last committed state
   - Firestore optimistic updates + `writeBatch()` for atomic commits
   - localStorage cache of pending operations (max 50 ops)
   - Replay queue on reconnect

2. **Total Disconnect Scenario**:
   - All users close browsers for 2+ minutes → Full canvas state in Firestore
   - No data loss whatsoever
   - Next user loads complete state from Firestore snapshot

3. **Network Drop Recovery**:
   - Client detects offline: Switch to optimistic UI + queue
   - Queue operations in IndexedDB (max 500 ops or 5MB)
   - On reconnect: Replay queue with conflict resolution
   - Auto-retry failed operations (3 attempts, exponential backoff)

4. **Connection Status UI**:
   - Top banner: Green "Connected" / Yellow "Reconnecting..." / Red "Offline"
   - Offline: Show queued operation count (e.g., "3 pending changes")
   - Auto-dismiss banner 2s after reconnecting

**Testing Scenarios** (Must Pass All):
1. Mid-drag refresh: Drag circle, refresh at 50% drag → Position preserved
2. Create 5 shapes, close browser, wait 5 min, reopen → All 5 shapes present
3. Throttle network to 0 for 30s (Chrome DevTools), restore → Canvas syncs fully
4. Make 5 rapid edits, close tab immediately → Other users see all 5 edits

**Technical Implementation**:
```javascript
// Offline queue manager
class OfflineQueue {
  async enqueue(operation) {
    await db.operations.add({
      id: uuid(),
      type: operation.type,
      data: operation.data,
      timestamp: Date.now(),
      retries: 0
    });
  }
  
  async replay() {
    const pending = await db.operations.toArray();
    for (const op of pending) {
      try {
        await executeOperation(op);
        await db.operations.delete(op.id);
      } catch (e) {
        if (op.retries < 3) {
          await db.operations.update(op.id, { retries: op.retries + 1 });
        } else {
          console.error('Operation failed after 3 retries', op);
        }
      }
    }
  }
}
```

---

## Section 2: Canvas Features & Performance (20 points target)

**Current Status**:
- ✅ Pan/zoom functional
- ✅ 6 shape types (exceeds 3+ requirement)
- ✅ Text with Konva.Text
- ⚠️ Multi-select exists but needs polish
- ❌ Layer management not implemented
- ❌ Transform operations incomplete

### 2.1 Canvas Functionality (Target: 7-8 points)

**Required Features for Excellent**:

1. **Smooth Pan/Zoom**:
   - Current: Space + drag, mousewheel zoom ✅
   - Add: Pinch-to-zoom for trackpad (Hammer.js or native)
   - Add: Pan inertia (momentum scrolling)
   - Performance: 60 FPS during pan/zoom even with 300+ shapes

2. **Shape Types** (Current: 6 ✅):
   - Rectangle, Circle, Line, Text, Triangle, Star
   - All shapes support: fill, stroke, opacity, rotation

3. **Text with Formatting**:
   - Current: Basic Konva.Text ✅
   - Add: Font family dropdown (5 fonts: Inter, Roboto, Merriweather, Courier, Comic Sans)
   - Add: Font size slider (8px - 144px)
   - Add: Bold, Italic, Underline toggles
   - Add: Text alignment (left, center, right)
   - Add: Line height control (1.0 - 3.0)

4. **Multi-Select**:
   - Current: Shift + click ✅
   - Add: Marquee selection (drag empty area)
   - Add: Ctrl + click to add/remove from selection
   - Add: Select all (Cmd/Ctrl + A)
   - Add: Multi-select transform (unified bounding box)

5. **Layer Management**:
   - Layers panel (right sidebar, 300px width)
   - Visual layer hierarchy (tree view)
   - Drag to reorder layers
   - Click to select layer
   - Eye icon to hide/show
   - Lock icon to prevent editing
   - Layer names (auto-generated: "Rectangle 1", editable on double-click)

6. **Transform Operations**:
   - Current: Konva Transformer for resize/rotate ✅
   - Ensure: Maintain aspect ratio (Shift + drag)
   - Ensure: Rotate in 15° increments (Shift + rotate)
   - Add: Flip horizontal/vertical buttons
   - Add: Reset rotation button
   - Add: Numeric inputs for X, Y, W, H, rotation

7. **Duplicate/Delete**:
   - Current: Delete/Backspace works ✅
   - Add: Duplicate (Cmd/Ctrl + D) → Creates copy offset by 20px
   - Add: Cut (Cmd/Ctrl + X)
   - Add: Copy (Cmd/Ctrl + C)  
   - Add: Paste (Cmd/Ctrl + V)

**UI Components to Build**:
- `TextFormattingToolbar.jsx` - Contextual toolbar for text
- `LayersPanel.jsx` - Full layer management panel
- `TransformPanel.jsx` - Numeric transform inputs
- `MultiSelectToolbar.jsx` - Toolbar for selected group

### 2.2 Performance & Scalability (Target: 11-12 points)

**Performance Targets** (Must-Have):
- **500+ objects**: Maintain 60 FPS during pan/zoom/edit
- **5+ concurrent users**: No degradation in sync or responsiveness
- **Load time**: Initial canvas load < 2 seconds (500 shapes)
- **Memory**: < 200MB heap with 1000 shapes

**Optimization Strategies**:

1. **Virtualization**:
   - Only render shapes in viewport + 20% buffer
   - Use Konva's `hitGraphEnabled: false` for off-screen shapes
   - Implement shape culling based on camera bounds

2. **Batch Updates**:
   - Group Firestore writes in `writeBatch()` (max 500 ops)
   - Debounce drag updates to 16ms (60Hz)
   - Throttle cursor updates to 33ms (30Hz)

3. **Efficient Data Structures**:
   - Use Map<shapeId, shape> instead of array
   - Index shapes by spatial hash for viewport queries
   - Cache transformed coordinates

4. **Network Optimization**:
   - Enable Firestore offline persistence
   - Use RTDB connection pooling
   - Compress large payloads (>10KB) with LZ-string

5. **Rendering Optimization**:
   - Use Konva's `listening: false` for non-interactive shapes
   - Disable shadows on distant/small shapes
   - Use cached shape bitmaps for repeated elements

**Testing Scenarios** (Must Pass All):
1. Create 500 rectangles in grid → Pan/zoom maintains 60 FPS
2. Open 5 browser windows (different users) → All can edit simultaneously
3. Load canvas with 500 shapes → Loads in < 2s
4. Monitor Chrome DevTools memory → Stays < 200MB after 10 min session

**Performance Dashboard**:
- Real-time FPS counter (top-right corner)
- Network status indicator (latency, packet loss)
- Object count and memory usage (dev mode only)

---

## Section 3: Advanced Figma-Inspired Features (15 points target)

**Strategy**: Implement 3 Tier 1 + 2 Tier 2 + 1 Tier 3 = 15 points

### 3.1 Tier 1 Features (Choose 3, 2 points each = 6 points)

**Selected Features**:

1. **Undo/Redo with Keyboard Shortcuts** (2 points):
   - Implement command pattern for all operations
   - Unlimited undo history (or last 100 operations)
   - Cmd/Ctrl + Z for undo
   - Cmd/Ctrl + Shift + Z for redo
   - Visual feedback: Toast showing "Undo: Moved rectangle"
   - Persist undo stack in localStorage
   - Clear undo stack on refresh (avoid stale state)

2. **Keyboard Shortcuts** (2 points):
   - Delete/Backspace: Delete selected
   - Cmd/Ctrl + D: Duplicate
   - Cmd/Ctrl + C/X/V: Copy/Cut/Paste
   - Cmd/Ctrl + A: Select all
   - Cmd/Ctrl + Z/Shift+Z: Undo/Redo
   - Arrow keys: Move selected 10px (Shift = 1px)
   - R, C, L, T, Shift+T, S: Create shapes (existing ✅)
   - Space + drag: Pan (existing ✅)
   - Show keyboard shortcuts modal (Cmd/Ctrl + /)

3. **Object Grouping/Ungrouping** (2 points):
   - Select multiple objects → Right-click → "Group" (Cmd/Ctrl + G)
   - Groups get unified transform handle
   - Groups appear as single item in layers panel (expandable)
   - Ungroup: Right-click → "Ungroup" (Cmd/Ctrl + Shift + G)
   - Groups preserve relative positions when moved
   - Groups can contain nested groups (max 5 levels)

### 3.2 Tier 2 Features (Choose 2, 3 points each = 6 points)

**Selected Features**:

1. **Layers Panel with Drag-to-Reorder** (3 points):
   - Right sidebar panel (300px width, resizable)
   - Tree view showing shape hierarchy
   - Drag shapes to reorder (changes z-index)
   - Visual indicators: Lock icon, Eye icon
   - Double-click to rename layer
   - Right-click context menu: Delete, Duplicate, Group
   - Collapsible groups with arrow icon
   - Search/filter layers by name
   - Color-coded by type (rectangle=blue, circle=red, etc.)

2. **Alignment Tools** (3 points):
   - Toolbar button: "Align" → Opens dropdown
   - Align options:
     - Align left/center/right
     - Align top/middle/bottom
     - Distribute horizontally
     - Distribute vertically
   - Keyboard shortcuts:
     - Cmd/Ctrl + Shift + L/C/R: Align left/center/right
     - Cmd/Ctrl + Shift + T/M/B: Align top/middle/bottom
   - Alignment relative to selection bounds
   - Smart guides appear during alignment (dotted lines)
   - Works on 2+ selected objects

### 3.3 Tier 3 Feature (Choose 1, 3 points = 3 points)

**Selected Feature**:

**Collaborative Comments/Annotations** (3 points):
- Click "Comment" button → Cursor changes to comment mode
- Click on canvas → Places comment pin (speech bubble icon)
- Comment modal opens: Text input + "Post" button
- Comments stored in Firestore: `/canvas/{canvasId}/comments/{commentId}`
- Comments visible to all users in real-time
- Hover over pin → Shows comment preview
- Click pin → Opens full comment thread
- Reply to comments (nested threads)
- Resolve comments (pin changes to checkmark, faded)
- Delete own comments (trash icon)
- Comment author avatar + timestamp
- Presence: See who's typing in comment thread

**Comment Data Model**:
```javascript
{
  commentId: string,
  canvasId: string,
  position: { x: number, y: number },
  author: { userId, displayName, photoURL },
  text: string,
  replies: [
    { userId, displayName, text, timestamp }
  ],
  resolved: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Section 4: AI Canvas Agent (25 points target)

**Target**: 8+ commands, complex execution, sub-2s response, 90%+ accuracy

### 4.1 Command Breadth & Capability (Target: 9-10 points)

**Required: 8+ Distinct Commands Across All Categories**

**Creation Commands** (Minimum 2):
1. "Create a red rectangle at position 100, 200"
2. "Add a text layer that says 'Hello World' at the center"
3. "Make a blue circle with radius 50 at top left"
4. "Draw a green triangle at 300, 400"

**Manipulation Commands** (Minimum 2):
5. "Move the red rectangle to the center of the canvas"
6. "Resize the blue circle to twice its size"
7. "Rotate the text 45 degrees clockwise"
8. "Change the color of all rectangles to purple"

**Layout Commands** (Minimum 1):
9. "Arrange these shapes in a horizontal row with 20px spacing"
10. "Create a 3x3 grid of squares"
11. "Stack the selected objects vertically"
12. "Distribute all circles evenly across the canvas"

**Complex Commands** (Minimum 1):
13. "Create a login form with username and password fields"
14. "Build a navigation bar with Home, About, Contact, Pricing buttons"
15. "Make a card layout with title, image placeholder, and description text"
16. "Design a dashboard with header, sidebar, and main content area"

**Total Implemented**: 16 command types (exceeds 8+ requirement)

### 4.2 Command Parser Architecture

**LLM Integration**:
- Use Claude Sonnet 4.5 API via `/v1/messages` endpoint
- System prompt defines canvas state and available operations
- User message is natural language command
- Response is structured JSON of operations

**Prompt Engineering**:
```javascript
const systemPrompt = `You are a canvas agent that interprets design commands. 

Current canvas state:
- Shapes: ${JSON.stringify(shapes)}
- Canvas size: 20000x20000
- Viewport: ${viewport}

Available operations:
1. createShape(type, x, y, properties)
2. moveShape(id, x, y)
3. resizeShape(id, width, height)
4. rotateShape(id, degrees)
5. updateProperties(id, properties)
6. deleteShape(id)
7. groupShapes(ids)

Return a JSON array of operations to execute. Be specific and use exact coordinates.`;
```

**Response Format**:
```json
{
  "operations": [
    {
      "type": "createShape",
      "params": {
        "shapeType": "rectangle",
        "x": 100,
        "y": 200,
        "width": 200,
        "height": 100,
        "fill": "#ff0000"
      }
    }
  ],
  "explanation": "Created a red rectangle at position 100, 200"
}
```

### 4.3 Complex Command Execution (Target: 7-8 points)

**Login Form Example**:
Input: "Create a login form"
Output: 6 shapes in logical layout:
1. Container rectangle (300x400, white fill, subtle shadow)
2. Title text ("Login") centered at top
3. Username label ("Username") at 20px from top
4. Username input rectangle (280x40, gray border)
5. Password label ("Password") at 100px from top
6. Password input rectangle (280x40, gray border)
7. Login button rectangle (280x45, blue fill)
8. Login button text ("Sign In", white)

**Layout Intelligence**:
- Auto-calculate spacing (20px vertical gap)
- Center-align all elements within container
- Use consistent sizing (inputs same width)
- Apply professional styling (shadows, borders)
- Group all elements together

**Nav Bar Example**:
Input: "Build a navigation bar with Home, About, Contact, Pricing"
Output: 5 shapes:
1. Background rectangle (1200x60, dark gray)
2-5. Four text elements (evenly spaced, white color)

### 4.4 AI Performance & Reliability (Target: 6-7 points)

**Performance Targets**:
- Response time: < 2 seconds (p95)
- Accuracy: 90%+ correct interpretation
- Success rate: 95%+ commands execute without errors

**Reliability Features**:

1. **Error Handling**:
   - Ambiguous command → Ask for clarification
   - Invalid operation → Show error toast
   - LLM timeout (5s) → "AI is taking longer than usual, please try again"

2. **User Feedback**:
   - Loading indicator: "AI is thinking..."
   - Progress bar for multi-step operations
   - Success toast: "Created login form (6 shapes)"
   - Show LLM's explanation in toast

3. **Multi-User AI**:
   - All AI-created shapes include `createdByAI: true` flag
   - AI operations use same locking mechanism as manual edits
   - Multiple users can use AI simultaneously (no conflicts)
   - AI operations appear in undo history

4. **Rate Limiting**:
   - Max 10 AI commands per user per minute
   - Show remaining quota in UI
   - Clear error message when limit hit

**Testing Scenarios**:
1. "Create a red circle" → Executes in < 2s, circle appears
2. "Make a login form" → 6+ shapes created in logical layout
3. Two users both say "create rectangle" → Both rectangles appear, no conflicts
4. "Delete all shapes" → AI refuses (dangerous command)

---

## Section 5: Technical Implementation (10 points target)

### 5.1 Architecture Quality (Target: 5 points)

**Code Organization**:

```
src/
├── components/
│   ├── Canvas/
│   │   ├── Canvas.jsx (main canvas component)
│   │   ├── ShapeRenderer.jsx (individual shape)
│   │   ├── Transformer.jsx (resize handles)
│   │   └── Grid.jsx (background grid)
│   ├── UI/
│   │   ├── Toolbar.jsx
│   │   ├── LayersPanel.jsx
│   │   ├── TextFormattingToolbar.jsx
│   │   ├── AlignmentTools.jsx
│   │   └── CommentPin.jsx
│   ├── AI/
│   │   ├── AICommandInput.jsx
│   │   ├── AICommandHistory.jsx
│   │   └── AIFeedback.jsx
│   └── Auth/
│       ├── AuthBar.jsx
│       └── ProfileSettings.jsx
├── services/
│   ├── firebase.js
│   ├── canvas.js (shape CRUD)
│   ├── realtime.js (RTDB operations)
│   ├── ai.js (LLM integration)
│   ├── comments.js
│   └── undo.js (undo/redo manager)
├── hooks/
│   ├── useCanvas.js
│   ├── useRealtime.js
│   ├── useAI.js
│   ├── useUndo.js
│   └── useKeyboard.js
├── utils/
│   ├── geometry.js (collision, alignment)
│   ├── performance.js (metrics)
│   └── offline.js (queue manager)
└── contexts/
    ├── CanvasContext.jsx
    ├── AIContext.jsx
    └── UndoContext.jsx
```

**Design Patterns**:
1. **Command Pattern**: All operations (move, resize, delete) are commands for undo/redo
2. **Observer Pattern**: Components subscribe to shape changes via Context
3. **Factory Pattern**: ShapeRenderer creates appropriate Konva component based on type
4. **Singleton Pattern**: Firebase instance, offline queue manager
5. **Strategy Pattern**: Different conflict resolution strategies per operation type

**Error Handling**:
- Try-catch blocks around all async operations
- Graceful degradation (e.g., offline mode when network fails)
- User-friendly error messages (no raw Firebase errors)
- Error boundary components at top level
- Automatic retry with exponential backoff

**Testing**:
- Jest for unit tests (validation, geometry utils)
- React Testing Library for component tests
- Playwright for E2E tests (user flows)
- Firebase Emulator for integration tests
- Target: 80%+ code coverage

### 5.2 Authentication & Security (Target: 5 points)

**Current Auth**: 
- ✅ Google OAuth
- ✅ Email/password
- ✅ Session persistence

**Enhanced Requirements**:

1. **Robust Auth Flow**:
   - Email verification required for new accounts
   - Password reset via email
   - Session management (view active sessions, logout all)
   - Auto-logout after 30 days of inactivity
   - Remember me checkbox (extends to 90 days)

2. **Secure User Management**:
   - Profile management: Display name, email, photo
   - Password change (requires current password)
   - Account deletion (with confirmation)
   - Export user data (GDPR compliance)

3. **Protected Routes**:
   - Canvas requires authentication
   - Redirect to login on auth failure
   - Preserve intended destination (redirect after login)
   - Public share links (optional, future phase)

4. **Security Best Practices**:
   - Firebase Security Rules enforce ownership
   - No client-side secrets (all in `.env`)
   - HTTPS only in production
   - XSS prevention (sanitize user inputs)
   - CSRF protection (Firebase handles automatically)
   - Rate limiting on API calls (Firebase App Check)

**Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // All authenticated users can read/write shapes
    match /canvas/{canvasId}/shapes/{shapeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Comments: Owner can delete, all can read/create
    match /canvas/{canvasId}/comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.author.userId;
    }
  }
}
```

**RTDB Security Rules**:
```json
{
  "rules": {
    "sessions": {
      "$canvasId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth.uid == $userId"
        }
      }
    },
    "drags": {
      "$canvasId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---

## Section 6: Documentation & Submission (5 points target)

### 6.1 Repository & Setup (Target: 3 points)

**README.md Structure**:

```markdown
# CollabCanvas

Real-time collaborative design tool with AI agent.

## Features
- Real-time collaboration (5+ concurrent users)
- 6 shape types with full editing capabilities
- AI canvas agent (natural language commands)
- Advanced Figma-inspired features (undo/redo, layers, alignment)
- Collaborative comments and annotations

## Tech Stack
- Frontend: React 18.3 + Konva.js
- Backend: Firebase (Firestore, RTDB, Auth, Storage)
- AI: Claude Sonnet 4.5 API
- Deployment: Firebase Hosting

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase account
- Anthropic API key

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see .env.example)
4. Start Firebase Emulator: `npm run emulator`
5. Start dev server: `npm run dev`
6. Open http://localhost:5173

### Environment Variables
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_RTDB_URL
- VITE_ANTHROPIC_API_KEY

### Testing
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Performance tests: `npm run test:perf`

## Architecture
See ARCHITECTURE.md for detailed documentation.

## Contributing
See CONTRIBUTING.md for guidelines.

## License
MIT
```

**Additional Documentation Files**:

1. **ARCHITECTURE.md**: System design, data flow diagrams, component hierarchy
2. **CONFLICT_RESOLUTION.md**: Detailed explanation of conflict handling
3. **AI_AGENT.md**: LLM integration, prompt engineering, supported commands
4. **PERFORMANCE.md**: Optimization strategies, benchmarks, profiling results
5. **API.md**: Service layer API documentation
6. **TESTING.md**: Testing strategy, how to run tests, coverage reports

### 6.2 Deployment (Target: 2 points)

**Deployment Requirements**:

1. **Stable Production Deployment**:
   - Hosted on Firebase Hosting
   - Custom domain (collabcanvas.app)
   - HTTPS enforced
   - CDN for static assets
   - Automatic deployments via GitHub Actions

2. **Performance**:
   - Lighthouse score 90+ (Performance, Accessibility, Best Practices, SEO)
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3.5s
   - Total bundle size < 500KB (gzipped)

3. **Reliability**:
   - 99.9% uptime SLA
   - Error tracking (Sentry)
   - Performance monitoring (Firebase Performance)
   - Health check endpoint (`/health`)

4. **Scalability**:
   - Supports 100+ concurrent users
   - Auto-scaling via Firebase
   - Database indexes for optimal queries
   - Connection pooling

**Deployment Checklist**:
- [ ] All environment variables configured
- [ ] Security rules deployed
- [ ] Database indexes created
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] SSL certificate valid
- [ ] Custom domain configured
- [ ] CI/CD pipeline operational
- [ ] Backup strategy implemented

---

## Section 7: AI Development Log (Pass/Fail)

**Required**: Include 3 out of 5 sections in `AI_DEVELOPMENT_LOG.md`

**Section 1: Tools & Workflow**
- Primary tool: Claude Sonnet 4.5 via claude.ai and API
- Workflow: Requirements → Code generation → Testing → Iteration
- Integration: VS Code with Claude extension
- Version control: Git with AI-generated commit messages
- Code review: Manual review + automated linting

**Section 2: Effective Prompting Strategies**
1. "Generate a React component for [feature] with [specific requirements]"
2. "Refactor this code to use [pattern/library] while maintaining [constraints]"
3. "Debug this error: [error message]. Here's the relevant code: [code snippet]"
4. "Write unit tests for this function that cover [edge cases]"
5. "Optimize this function for performance, targeting [metric]"

**Section 3: Code Analysis**
- AI-generated: ~60% (initial component scaffolding, boilerplate)
- Hand-written: ~30% (business logic, integration code)
- AI-assisted refactoring: ~10% (optimization, bug fixes)

**Section 4: Strengths & Limitations**
Strengths:
- Rapid prototyping and component generation
- Consistent code style and structure
- Excellent at generating test cases
- Good at explaining complex concepts

Limitations:
- Sometimes generates overly complex solutions
- Can miss edge cases in business logic
- Requires careful prompt engineering for optimal results
- May suggest deprecated libraries/patterns

**Section 5: Key Learnings**
- Iterative prompting produces better results than single-shot
- Providing context (existing code, constraints) is crucial
- AI excels at patterns but struggles with novel problems
- Human oversight essential for security and correctness
- Pair programming with AI accelerates development 2-3x

---

## Section 8: Demo Video (Pass/Fail)

**Requirements**: 3-5 minute video demonstrating all core features

**Video Script**:

**0:00-0:30 - Introduction**
- Show landing page
- "Welcome to CollabCanvas, a real-time collaborative design tool with AI"
- Quick feature overview

**0:30-1:30 - Real-Time Collaboration**
- Split screen: Two users editing simultaneously
- User A creates rectangle, User B sees it appear instantly
- User B moves circle, User A sees smooth drag stream
- Show cursors with avatars
- Demonstrate object locking (User A grabs object, User B sees lock)
- Show conflict resolution (both edit same object, last write wins)

**1:30-2:30 - AI Canvas Agent**
- User types: "Create a login form"
- AI creates 6 shapes in logical layout
- User types: "Make a navigation bar with 4 buttons"
- AI creates nav bar
- User types: "Arrange these shapes in a grid"
- AI reorganizes shapes
- Show multi-user AI usage (both users give commands)

**2:30-3:30 - Advanced Features**
- Undo/redo demonstration
- Layers panel (reorder, hide/show)
- Alignment tools (align left, distribute evenly)
- Collaborative comments (place pin, reply)
- Grouping objects

**3:30-4:00 - Architecture Explanation**
- Show Firebase console (Firestore, RTDB)
- Explain data flow diagram
- Mention key technologies (React, Konva, Claude API)

**4:00-4:30 - Performance & Scale**
- Show 500+ shapes on canvas, still smooth
- Performance metrics (60 FPS, sub-100ms sync)
- Load testing results (5+ concurrent users)

**4:30-5:00 - Conclusion**
- Recap features
- Show deployment URL
- Thank you

**Technical Requirements**:
- 1080p or higher resolution
- Clear audio (no background noise)
- Screen recording software: OBS Studio or Loom
- Show both screens side-by-side for collaboration demo
- Include captions/subtitles
- Upload to YouTube (unlisted or public)

---

## Bonus Points Strategy (+5 maximum)

### Innovation (+2 points)

**Feature: AI-Powered Design Suggestions**
- AI analyzes canvas and suggests improvements
- Examples:
  - "These shapes could be aligned better"
  - "Consider grouping these related elements"
  - "Color contrast too low for accessibility"
- User can accept/reject suggestions
- Suggestions appear as non-intrusive tooltips

### Polish (+2 points)

**Exceptional UX/UI**:
- Smooth animations (Framer Motion)
- Micro-interactions (hover effects, button feedback)
- Professional design system (consistent colors, typography, spacing)
- Dark mode support (toggle in settings)
- Accessibility: ARIA labels, keyboard navigation, screen reader support
- Loading skeletons instead of spinners
- Optimistic UI (operations appear instant)

### Scale (+1 point)

**Demonstrated Performance**:
- Load testing: 10+ concurrent users editing simultaneously
- Stress testing: 1000+ shapes at 60 FPS
- Network simulation: Works on 3G connection
- Video evidence of scale testing

---

## Success Criteria Summary

### Core Requirements (Must-Have for A Grade)

**Section 1: Core Collaborative Infrastructure (30 points)**
- ✅ Sub-100ms object sync
- ✅ Sub-50ms cursor sync
- ✅ Documented conflict resolution strategy
- ✅ Ghost object prevention
- ✅ Mid-operation refresh preservation
- ✅ Network drop recovery

**Section 2: Canvas Features & Performance (20 points)**
- ✅ Smooth pan/zoom with 6+ shapes
- ✅ Text with full formatting
- ✅ Multi-select with marquee
- ✅ Layer management panel
- ✅ Complete transform operations
- ✅ 500+ objects at 60 FPS
- ✅ 5+ concurrent users

**Section 3: Advanced Features (15 points)**
- ✅ Undo/redo with keyboard shortcuts
- ✅ Comprehensive keyboard shortcuts
- ✅ Object grouping/ungrouping
- ✅ Layers panel with drag-to-reorder
- ✅ Alignment tools
- ✅ Collaborative comments

**Section 4: AI Canvas Agent (25 points)**
- ✅ 8+ distinct command types
- ✅ Complex command execution (login form, nav bar)
- ✅ Sub-2s response time
- ✅ 90%+ accuracy
- ✅ Multi-user AI support

**Section 5: Technical Implementation (10 points)**
- ✅ Clean architecture with separation of concerns
- ✅ Robust error handling
- ✅ 80%+ test coverage
- ✅ Enhanced authentication system
- ✅ Secure Firebase rules

**Section 6: Documentation (5 points)**
- ✅ Comprehensive README
- ✅ Architecture documentation
- ✅ Easy local setup
- ✅ Stable production deployment
- ✅ 90+ Lighthouse score

**Section 7 & 8: Required Deliverables**
- ✅ AI Development Log (3/5 sections)
- ✅ Demo Video (3-5 minutes)

**Bonus Points (Optional)**
- ✅ AI design suggestions (+2)
- ✅ Exceptional polish (+2)
- ✅ Demonstrated scale (+1)

---

## Timeline & Milestones

**Week 1-2: Core Infrastructure**
- Conflict resolution documentation
- Persistence testing and fixes
- Performance optimization (500+ shapes)

**Week 3: Canvas Features**
- Text formatting toolbar
- Layers panel implementation
- Multi-select enhancements
- Transform panel

**Week 4: Advanced Features**
- Undo/redo system
- Keyboard shortcuts
- Object grouping
- Alignment tools
- Collaborative comments

**Week 5: AI Canvas Agent**
- LLM integration setup
- Command parser implementation
- Complex command execution
- Multi-user AI testing

**Week 6: Polish & Testing**
- Authentication enhancements
- Documentation completion
- E2E testing
- Performance profiling
- Bug fixes

**Week 7: Final Deliverables**
- AI Development Log
- Demo Video
- Deployment optimization
- Final testing

---

## Risk Mitigation

**Risk 1**: AI API costs exceed budget
**Mitigation**: Implement caching, rate limiting, use smaller model for simple commands

**Risk 2**: Real-time sync degrades with many users
**Mitigation**: Horizontal scaling, connection pooling, optimize network payloads

**Risk 3**: Complex features delay timeline
**Mitigation**: MVP first, then iterate; prioritize rubric requirements over polish

**Risk 4**: Firebase costs exceed free tier
**Mitigation**: Monitor usage, optimize queries, implement caching, budget alerts

---

## Out of Scope

### Not Required for This Phase:
- Version history with restore (Tier 3, not selected)
- Plugins/extensions system (Tier 3, not selected)
- Auto-layout (Tier 3, not selected)
- Mobile app (desktop-first design)
- Real-time video/voice chat
- Enterprise SSO
- Payment/billing system
- Team workspaces
- Advanced shape types (polygons, curves)

---

## Acceptance Criteria

- [ ] All rubric testing scenarios pass
- [ ] Performance targets met (500+ shapes, 5+ users)
- [ ] AI agent responds in < 2s with 90%+ accuracy
- [ ] Documentation complete and clear
- [ ] Production deployment stable
- [ ] Demo video submitted
- [ ] AI Development Log submitted
- [ ] Zero critical bugs
- [ ] 80%+ test coverage
- [ ] Lighthouse score 90+

---

**Document Version**: 2.0  
**Last Updated**: October 15, 2025  
**Target Completion**: 7 weeks from start  
**Expected Score**: 95-100 points (Grade A)