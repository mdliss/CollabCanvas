# CollabCanvas MVP

Real-time collaborative canvas application built with React, Firebase, and Konva.js.

## Features

### Phase 1-2: Core Canvas ✅
- **Authentication**: Email/password and Google Sign-In
- **Canvas Operations**: 5000×5000px bounded canvas with pan & zoom
- **Shape Management**: Create, move, delete rectangles
- **Persistence**: Firestore-backed shape storage with real-time sync
- **Smooth Interactions**: 60 FPS performance with drag bounds clamping

### Phase 3: Realtime Presence + Cursors ✅
- **Live Presence**: See who's online with colored indicators
- **Real-time Cursors**: Watch other users' mouse movements (<50ms latency)
- **Auto-cleanup**: Presence and cursors removed on disconnect
- **Throttled Updates**: 20 FPS cursor updates to optimize bandwidth

📖 **Detailed Documentation**: See [PHASE3_REALTIME.md](./PHASE3_REALTIME.md)  
✅ **Validation Results**: See [PHASE3_VALIDATION.md](./PHASE3_VALIDATION.md)

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase project with Firestore and Realtime Database enabled

### Installation

1. **Clone and install**
```bash
git clone <repo-url>
cd CollabCanvas
npm install
```

2. **Configure Firebase**

Create `.env` file:
```bash
VITE_FB_API_KEY=your-api-key
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_BUCKET=your-project.appspot.com
VITE_FB_SENDER_ID=your-sender-id
VITE_FB_APP_ID=your-app-id
VITE_FB_DB_URL=https://your-project-default-rtdb.firebaseio.com
```

3. **Set Firebase Rules**

**Firestore Rules** (`firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvas/{canvasId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Realtime Database Rules** (`database.rules.json`):
```json
{
  "rules": {
    "sessions": {
      "$canvasId": {
        "$uid": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $uid"
        }
      }
    }
  }
}
```

4. **Run development server**
```bash
npm run dev
```

Navigate to `http://localhost:5173`

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Canvas Rendering**: Konva.js (HTML5 Canvas)
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **Styling**: Inline styles (MVP - no CSS framework)

### Project Structure
```
src/
├── components/
│   ├── Auth/
│   │   └── Login.jsx
│   ├── Canvas/
│   │   ├── Canvas.jsx           # Main canvas component
│   │   ├── Shape.jsx            # Rectangle rendering
│   │   ├── CanvasControls.jsx   # Add shape button
│   │   ├── DebugNote.jsx        # Diagnostics overlay
│   │   └── constants.js         # Canvas dimensions
│   └── Collaboration/
│       ├── Cursor.jsx           # Remote cursor rendering
│       └── PresenceList.jsx     # Online users list
├── contexts/
│   └── AuthContext.jsx          # Auth state provider
├── hooks/
│   ├── usePresence.js           # Presence tracking
│   └── useCursors.js            # Cursor tracking
├── services/
│   ├── firebase.js              # Firebase initialization
│   ├── canvas.js                # Firestore shape CRUD
│   ├── presence.js              # RTDB presence management
│   └── cursors.js               # RTDB cursor updates
├── App.jsx
└── main.jsx
```

## Usage

### Basic Operations
- **Pan**: Click and drag canvas background
- **Zoom**: Mouse wheel (scroll)
- **Create Shape**: Click "Add Rectangle" button
- **Move Shape**: Drag rectangle (clamped to canvas bounds)
- **Select**: Click rectangle (blue outline)
- **Delete**: Select shape, press Delete or Backspace

### Multiplayer
- **See Online Users**: Top-right corner shows colored dots + names
- **Watch Cursors**: Other users' cursors appear with name labels
- **Collaborate**: Multiple users can create/move shapes simultaneously

## Troubleshooting

### No presence/cursors visible
1. Check console for `[rtdb] url:` log
2. Verify `.env` has correct `VITE_FB_DB_URL`
3. Check Firebase Console → Realtime Database enabled
4. Verify RTDB rules allow authenticated writes

### Cursor position offset
- Ensure stage pan/zoom state is passed to `useCursors` hook
- Check coordinate conversion in `useCursors.js`

### High latency
- Check network connection
- Verify RTDB region matches your location
- Confirm throttling is active (50ms in `cursors.js`)

**Full troubleshooting guide**: [PHASE3_REALTIME.md#troubleshooting](./PHASE3_REALTIME.md#troubleshooting)

## Development

### Run tests
```bash
npm test
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Performance

### Metrics (MVP target)
- **FPS**: 60 (maintained with 500+ shapes)
- **Shape sync**: <100ms
- **Cursor sync**: <50ms
- **Concurrent users**: 10-50 supported

### Optimization
- Shape dragging throttled to prevent excessive updates
- Cursor updates throttled to 20 FPS (50ms)
- Firestore transactions prevent race conditions
- RTDB used for high-frequency updates only

## Roadmap

### Phase 4 (Future)
- [ ] Shape locking during edit
- [ ] Conflict resolution for concurrent edits
- [ ] Shape resize and rotate
- [ ] Additional shape types (circles, text)

### Phase 5 (Future)
- [ ] Multi-canvas support
- [ ] Shape styling (colors, borders)
- [ ] Undo/redo
- [ ] Export to PNG/SVG

## License

MIT

## Contributing

This is an MVP project. See `PRD.md` and `tasks.md` for detailed specifications.
