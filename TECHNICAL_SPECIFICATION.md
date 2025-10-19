# CollabCanvas - Technical Specification

## 1. Project Overview

CollabCanvas is a real-time collaborative vector editing platform built with React 18.2, Firebase (Realtime Database, Firestore, Storage, Functions), and Konva for canvas rendering. The application supports multi-user editing with selection-based locking, undo/redo via command pattern, friend-based social features, direct messaging with rich media, and competitive leaderboard tracking with daily activity timelines. Users create multiple canvas projects, share them with granular permissions (viewer/editor), and collaborate in real-time with presence indicators, live cursors, and per-canvas chat.

## 2. Architecture Summary

### Tech Stack
- **Frontend**: React 18.2, React Router 6.4, Konva (react-konva), Vite 7.1.9
- **Backend**: Firebase RTDB (real-time data), Firestore (user profiles/leaderboard), Storage (media), Cloud Functions (Stripe/AI)
- **Hosting**: Firebase Hosting (`https://collabcanvas-99a09.web.app`)
- **APIs**: Tenor (GIF), Stripe (payments), OpenAI (via Cloud Functions)

### Database Structure

**Firebase RTDB** (`collabcanvas-99a09-default-rtdb.firebaseio.com`):
- `/canvas/{canvasId}/shapes/{shapeId}` - Shape data with simplified write rules
- `/canvas/{canvasId}/metadata` - Canvas name, owner, timestamps
- `/canvas/{canvasId}/collaborators` - Shared access control
- `/sessions/{canvasId}/{userId}` - User presence per canvas
- `/selections/{canvasId}/{shapeId}` - Shape selection state
- `/friends/{userId}/pending|outgoing|accepted/{friendId}` - Friend relationships
- `/directMessages/{conversationId}` - Private messages between friends
- `/notifications/{userId}` - Edit requests and friend notifications
- `/chats/{canvasId}` - Per-canvas chat (last 100 messages)
- `/projects/{userId}` - User's owned canvas projects
- `/globalPresence/{userId}` - Global online status

**Firestore** (`collabcanvas-99a09`):
- `/users/{userId}` - User profiles (displayName, email, photoURL, bio, changesCount, isPremium, subscriptionTier, socialLinks, createdAt, lastSeen)
- `/users/{userId}/dailyActivity/{dateKey}` - Daily edit tracking (local timezone)

**Storage**:
- `/profile-pictures/{userId}/` - User profile images (5MB max)
- `/message-images/{conversationId}/` - Direct message attachments (10MB max)

### Data Flow
Canvas operations → RTDB (real-time sync) → All connected clients
User profiles/leaderboard → Firestore (periodic polling, 5s interval)
File uploads → Storage → URL stored in RTDB/Firestore

## 3. Core Features

### Real-Time Collaboration
- Multi-user canvas editing with live cursors and presence
- Selection-based persistent locking (8-second TTL with optimistic unlock)
- Drag streams for remote user visualization
- Per-canvas chat (last 100 messages) with UserProfileView integration
- Shape locking with user badges
- PresenceList showing online users (top-right) with profile popups and premium badges

### Canvas Management
- Multiple projects (free: 3 max, premium: unlimited)
- 13 templates (blank, grid, wireframe, flowchart, kanban, mindmap, etc.)
- Share with view/edit permissions (Premium feature)
- Edit request workflow with notifications
- Canvas rename with 5-second polling sync
- Project deletion with theme-aware spinner animation

### Shape Operations
- 9 types: rectangle, circle, ellipse, line, text, triangle, star, diamond, hexagon, pentagon
- Command pattern (create, update, delete, move, batch)
- Undo/redo (1000 command max)
- Batch operations count as 1 change
- Z-index management, gradients, text editing
- Simplified RTDB write rules (authentication only, no validation/lock checks)

### Friend & Messaging System
- **FriendsModal**: Dedicated modal for friend management (All Friends, Requests, Add Friend tabs)
- Friend requests by email with approve/deny (bidirectional auto-accept)
- **MessagingButton**: Direct messages list only (friend management moved to FriendsModal)
- DirectMessagingPanel with images (10MB max), GIFs (Tenor API), editing, deletion, Discord-style replies
- Online status (global + per-canvas presence)
- Profile viewing from friends list, requests (incoming/outgoing), and message headers
- Tab switching with fade animation (200ms transition)

### Profile & Social
- **ProfileModal**: Own profile editing
- **UserProfileView**: Read-only view of other users' profiles (used from leaderboard, friends, requests, chat)
- Profile picture upload (5MB max)
- Bio editing (200 char limit)
- **Social Links** (7 platforms with official SVG icons):
  - X/Twitter, GitHub, LinkedIn, Instagram, YouTube, Twitch (all clickable)
  - Discord (display only, no public URLs available)
- Premium verification badge (blue checkmark, Twitter/Instagram style)
- Leaderboard rank display

### Leaderboard
- Friends-only display (user + accepted friends)
- Ranked by changesCount (Firestore)
- 7-day activity timeline (SVG chart, real Firestore data)
- Daily activity tracked in local timezone
- Click users to view profiles with UserProfileView modal
- "Add Friend" button for non-friends
- Smooth loading-to-content transition animation (400ms fade/slide)

### Premium System
- Free tier: 3 projects, basic themes
- Premium tier: Unlimited projects, all 35 themes, canvas sharing
- Blue checkmark badge displayed:
  - Leaderboard entries
  - UserProfileView modal
  - PresenceList (canvas presence)
  - ChatPanel profile views
  - Friend lists
- Badge text: "Premium" (no distinction between monthly/lifetime)

### Themes
- 35 themes with premium gating
- Theme-aware UI across all components
- RenameModal and ShareModal updated to use theme system
- Delete animations use theme colors
- 3-column grid with 4px left padding

## 4. Current State

### ✅ Completed Features
- Friend request system (send/accept/deny/cancel) with FriendsModal
- Direct messaging (images, GIFs, editing, deletion, Discord-style replies)
- Online status tracking (global + per-canvas)
- Profile pictures with uploads
- Social links with 7 platforms (X, GitHub, LinkedIn, Instagram, YouTube, Twitch, Discord)
- Daily activity tracking in Firestore with local timezone calculation
- Batch/AI operations count as single change
- Canvas name sync (5-second polling)
- Escape key handlers for all 14 modals
- Activity timeline chart with proper loading states
- UserProfileView component (reusable across app)
- Profile viewing from: leaderboard, friends list, friend requests, message headers, canvas chat
- Premium badges (blue checkmark) across all user displays
- Add friend from leaderboard for non-friends
- Smooth tab switching in FriendsModal with background color distinction
- Theme-aware delete animation
- Theme-aware RenameModal and ShareModal styling
- Smooth leaderboard loading transitions
- DirectMessaging profile close behavior (doesn't close parent panel)

### ✅ Security Rules Deployed (October 19, 2025)

**Firestore**:
- `/users/{userId}` - Read: any authenticated, Write: owner only
- `/users/{userId}/dailyActivity/{dateKey}` - Read: any authenticated, Write: owner only

**RTDB** (simplified, authentication-based):
- `/canvas` - Read: authenticated (parent level for listing)
- `/canvas/{canvasId}/shapes` - Write: authenticated (collection level for batch ops)
- `/canvas/{canvasId}/shapes/{shapeId}` - Read/Write: authenticated (removed lock validation and field validation)
- `/canvas/{canvasId}/metadata` - Read/Write: authenticated
- `/canvas/{canvasId}/collaborators` - Read/Write: authenticated
- `/canvas/{canvasId}` - Write: authenticated for deletion only (!newData.exists())
- `/sessions/{canvasId}/{userId}` - Write: owner only
- `/selections/{canvasId}/{shapeId}` - Write: authenticated
- `/friends/{userId}/pending|outgoing|accepted/{friendId}` - Write: both users
- `/directMessages/{conversationId}` - Read/Write: authenticated
- `/notifications/{userId}` - Read: owner, Write: authenticated
- `/chats/{canvasId}` - Read/Write: authenticated
- `/projects/{userId}` - Read/Write: owner only
- `/globalPresence/{userId}` - Write: owner only

**Storage**:
- `/profile-pictures/{userId}/` - Write: owner only
- `/message-images/{conversationId}/` - Write: authenticated

### Component Architecture

**Modals** (14 total):
1. `ProfileModal` - Own profile editing (bio, social, photo)
2. `UserProfileView` - Read-only profile viewing (reusable)
3. `LeaderboardModal` - Friends leaderboard with activity chart
4. `FriendsModal` - Friend management (3 tabs: All, Requests, Add)
5. `MessagingButton` - Messages dropdown (friends list only)
6. `DirectMessagingPanel` - Full-screen DM panel
7. `SettingsModal` - Theme selection
8. `SubscriptionModal` - Stripe payment integration
9. `CouponModal` - Coupon redemption
10. `RenameModal` - Project renaming (theme-aware)
11. `ShareModal` - Collaborator management (theme-aware)
12. `ShareWithFriendModal` - Quick share with friend
13. `NotificationBell` - Edit request notifications
14. `TemplateSelectionModal` - Canvas template picker

**UI Components**:
- `PremiumBadge` - Blue checkmark SVG for premium users
- `Avatar` - User avatar with fallback initials
- `PresenceList` - Canvas presence (who's online) with profile popups and premium badges
- `ChatPanel` - Per-canvas chat with UserProfileView integration

### Known Issues Resolved
- ❌ **RTDB shape write permissions** - FIXED: Removed overly strict lock validation and field validation rules
- ❌ **Spotify integration** - REMOVED: Dev mode limitation (403 errors for non-whitelisted users)
- ❌ **Delete animation colors** - FIXED: Now uses theme.border.light and theme.button.primary
- ❌ **Messages button styling** - FIXED: Removed extra span wrapper causing visual artifacts
- ❌ **DirectMessaging profile close** - FIXED: Added stopPropagation to prevent parent panel close
- ❌ **Missing imports** - FIXED: UserProfileView and getActivityData imports
- ❌ **Leaderboard undefined refs** - FIXED: Removed unused state variables

## 5. Next Steps

### Priority 1: Testing & Validation
**Task**: Deploy and test all new features
**Rationale**: Extensive UI changes require production validation
**Commands**:
```bash
npm run build
firebase deploy
```

### Priority 2: Performance Optimization
**Task**: Replace 5-second polling with real-time subscriptions for projects/shared canvases
**Rationale**: Current polling creates up to 5s UI delay; real-time would be instant
**Location**: `LandingPage.jsx` lines 138-215

### Priority 3: Code Splitting
**Task**: Implement dynamic imports to reduce bundle size (currently 1.8MB)
**Rationale**: Build warnings indicate chunks >500KB; dynamic imports would improve load time
**Suggested**: Split Landing, Canvas, and AI components into separate chunks

### Priority 4: Error Boundary Coverage
**Task**: Add error boundaries around new UserProfileView usages
**Rationale**: Profile viewing is used in 7+ locations; failures should be isolated
**Locations**: LeaderboardModal, FriendsModal, DirectMessagingPanel, ChatPanel

### Priority 5: Activity Chart Optimization
**Task**: Cache activity data to reduce Firestore reads
**Rationale**: Currently fetches 7 days × 10 users on every leaderboard open
**Suggested**: Implement 5-minute cache with timestamp validation

---

## Appendix: Component Dependencies

```
LandingPage
├── FriendsModal → UserProfileView
├── MessagingButton
├── DirectMessagingPanel → UserProfileView
├── LeaderboardModal → UserProfileView
├── ProfileModal
├── SettingsModal
├── SubscriptionModal
├── CouponModal
├── RenameModal (theme-aware)
├── ShareModal (theme-aware)
├── ShareWithFriendModal
├── NotificationBell
└── TemplateSelectionModal

Canvas
├── PresenceList (with UserProfileView popups, premium badges)
├── ChatPanel → UserProfileView
├── ShapeToolbar
├── ColorPalette
├── LayersPanel
├── HistoryTimeline
├── AICanvas
└── AIDesignSuggestions

UI Components
├── PremiumBadge (reusable SVG checkmark)
├── Avatar
├── UserProfileView (central profile viewing component)
├── ErrorBoundary
├── PerformanceMonitor
├── ConnectionStatus
└── HelpMenu
```

---

## Technology Versions

- React: 18.2
- React Router: 6.4
- Konva: react-konva (latest)
- Vite: 7.1.9
- Firebase SDK: 12.4.0
- Node: Compatible with Firebase Functions

---

## Database Rules Last Updated
- **Firestore**: firestore.rules (88 lines)
- **RTDB**: database.rules.json (108 lines) - Simplified October 19, 2025
- **Storage**: storage.rules

---

## Social Media Integration

All platforms use official SVG logos at 18px size, theme-aware coloring:
1. **X/Twitter** - `https://twitter.com/{username}`
2. **GitHub** - `https://github.com/{username}`
3. **LinkedIn** - `https://linkedin.com/in/{username}`
4. **Instagram** - `https://instagram.com/{username}`
5. **YouTube** - `https://youtube.com/{handle}`
6. **Twitch** - `https://twitch.tv/{username}`
7. **Discord** - Display only (username#1234 format, no public profile URLs)

---

## Premium Features

**Free Tier**:
- 3 projects maximum
- Basic themes
- All collaboration features
- No verification badge

**Premium Tier** (`isPremium: true` in Firestore):
- Unlimited projects
- All 35 themes
- Canvas sharing with collaborators
- Blue verification badge (shown in: leaderboard, profiles, friends lists, chat, presence)
- Badge displays as "Premium" (no tier distinction)

---

## Routing

- `/` - LandingPage (project grid)
- `/login` - ModernLogin
- `/canvas/:canvasId` - Canvas editor
- All other routes → redirect to `/`

**Note**: Spotify OAuth route removed (dev mode limitations)

---

## Known Limitations

1. **Polling vs Real-Time**: LandingPage uses 5s polling for projects/shared canvases (performance warning logged)
2. **Bundle Size**: Single 1.8MB chunk (no code splitting yet)
3. **Activity Data**: Fetched on every leaderboard open (no caching)
4. **Spotify**: Integration removed due to OAuth dev mode restrictions
5. **Discord**: Username display only (no linking to profiles)

---

## Security Model

**Authentication**: Required for all operations (Firebase Auth)

**Canvas Access**:
- Owner: Full edit rights
- Editor: Can edit shapes, managed via `/canvas/{canvasId}/collaborators`
- Viewer: Read-only (enforced client-side)
- Access checks via `checkCanvasAccess()` service

**Friend System**:
- Symmetric writes (both users can modify friend relationship)
- Auto-accept when both send requests
- Required for: leaderboard visibility, direct messaging

**Profile Privacy**:
- All authenticated users can read any profile
- Only owner can write to own profile
- Social links publicly visible

---

## Build & Deploy

```bash
# Development
npm run dev  # Vite dev server on localhost:5173

# Production Build
npm run build  # Output to dist/

# Deploy
firebase deploy  # All services
firebase deploy --only database  # RTDB rules only
firebase deploy --only firestore:rules  # Firestore rules only
firebase deploy --only hosting  # Frontend only
```

---

## Critical Code Patterns

### Theme System
All modals use `const { theme } = useTheme()` with dynamic styles:
- `theme.background.{page|card|elevated}`
- `theme.text.{primary|secondary|tertiary|inverse}`
- `theme.border.{light|normal|medium|strong}`
- `theme.button.{primary|primaryHover}`
- `theme.shadow.{md|lg|xl}`
- `theme.backdrop` (modal overlays)

### Modal Animations
Standard pattern:
```javascript
const [isVisible, setIsVisible] = useState(false);
useEffect(() => {
  setTimeout(() => setIsVisible(true), 50);
}, []);

const handleClose = () => {
  setIsVisible(false);
  setTimeout(() => onClose(), 300);
};
```

### Profile Viewing
Centralized via `UserProfileView.jsx`:
- Props: `userId`, `userName`, `userEmail`, `userPhoto`, `rank` (optional), `isFriend` (optional), `onAddFriend` (optional)
- Shows: bio, social links (7 platforms), stats (member since, rank, changes)
- Add Friend button appears for non-friends when `isFriend={false}` and `onAddFriend` callback provided
- z-index: 10005 (above DirectMessagingPanel at 10003)

### Premium Badge
`<PremiumBadge size={16} />` - Blue checkmark SVG, used when `user.isPremium === true`

---

## Firebase Project Configuration

- **Project ID**: `collabcanvas-99a09`
- **RTDB URL**: `https://collabcanvas-99a09-default-rtdb.firebaseio.com/`
- **Hosting URL**: `https://collabcanvas-99a09.web.app`
- **Storage Bucket**: `collabcanvas-99a09.appspot.com`

---

## Development Notes

- **Admin Utilities**: Exposed via `window` in development (`exposeAdminUtils()`)
- **Performance Logging**: Extensive console logging for data sync operations
- **Offline Persistence**: Firestore IndexedDB persistence enabled (deprecated warning)
- **Error Handling**: ErrorBoundary wraps Canvas component only
- **Linter**: ESLint configured, all components pass with 0 errors
