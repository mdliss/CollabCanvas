# CollabCanvas

<div align="center">

**A real-time collaborative design platform with AI-powered tools**

[![Firebase](https://img.shields.io/badge/Firebase-12.4.0-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Konva.js](https://img.shields.io/badge/Konva.js-10.0.2-00A7E1?style=flat)](https://konvajs.org/)
[![Deployed](https://img.shields.io/badge/Deployed-Firebase%20Hosting-brightgreen?style=flat)](https://collabcanvas-99a09.web.app)

[Live Demo](https://collabcanvas-99a09.web.app) · [Report Bug](https://github.com/yourusername/CollabCanvas/issues) · [Request Feature](https://github.com/yourusername/CollabCanvas/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Firebase Setup](#firebase-setup)
  - [Running Locally](#running-locally)
- [Deployment](#-deployment)
- [Usage Guide](#-usage-guide)
- [Premium Features](#-premium-features)
- [Project Structure](#-project-structure)
- [Available Templates](#-available-templates)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

CollabCanvas is a professional-grade, real-time collaborative design platform built for modern teams. Think Figma meets Miro - an infinite canvas where multiple users can design, create, and collaborate simultaneously with live cursors, presence indicators, and instant synchronization.

### What Makes CollabCanvas Special?

- **🔄 Real-Time Collaboration**: See cursor movements, shape edits, and chat messages instantly across all users
- **🤖 AI-Powered Design**: Get intelligent design suggestions and generate shapes with natural language
- **🎨 30,000×30,000px Canvas**: Massive workspace for complex projects
- **📱 Social Features**: Friend system, direct messaging, leaderboards with activity tracking
- **🎭 35 Premium Themes**: Beautiful light and dark themes for every preference
- **📋 12 Professional Templates**: Jump-start your projects with pre-built designs
- **♻️ Unlimited Undo/Redo**: Complete command pattern implementation (1000 operations)
- **🔐 Secure Sharing**: Granular permissions with viewer/editor roles

---

## ✨ Features

### 🎨 Canvas & Design Tools

<table>
<tr>
<td width="50%">

#### Core Tools
- **9 Shape Types**: Rectangle, Circle, Ellipse, Triangle, Star, Diamond, Hexagon, Pentagon, Line
- **Advanced Text Editing**: Inline text editor with formatting (font family, size, weight, style, alignment)
- **Gradient Support**: Linear gradients with customizable color stops
- **Transform Tools**: Resize, rotate, move with transform handles
- **Z-Index Management**: Bring to front/back, send forward/backward
- **Multi-Selection**: Select and edit multiple shapes simultaneously
- **Duplicate Shapes**: Quick clone with keyboard shortcuts

</td>
<td width="50%">

#### Professional Features
- **Layers Panel**: Visual hierarchy management with drag-to-reorder
- **Color Palette**: Quick color picker with history
- **Shape Locking**: Collaborative editing with optimistic locking (8-second TTL)
- **Batch Operations**: Group actions count as single undo step
- **Export Tools**: PNG, SVG, and PDF export capabilities
- **Grid System**: Optional grid for precise alignment
- **Zoom & Pan**: Smooth navigation (mousewheel zoom, click-drag pan)

</td>
</tr>
</table>

### 👥 Collaboration Features

- **Live Presence**: See who's online with colored avatars and premium badges
- **Real-Time Cursors**: Watch collaborators' cursor movements (<50ms latency)
- **Per-Canvas Chat**: Built-in messaging with profile integration
- **Selection Indicators**: Visual badges showing who's editing what
- **Drag Streams**: See shapes being moved by other users in real-time
- **Edit Requests**: Request access to view-only canvases with notification system

### 🤝 Social & Communication

- **Friend System**: Send/accept friend requests by email
- **Direct Messaging**: Rich messaging with images (10MB), GIFs (Tenor API), replies, editing, deletion
- **User Profiles**: Customizable with bio (200 chars), profile pictures (5MB), 7 social platforms
- **Leaderboard**: Friends-only leaderboard ranked by contributions with 7-day activity timeline
- **Global Presence**: See friends' online status across the platform
- **Activity Tracking**: Daily edit tracking in local timezone with Firestore persistence

### 🤖 AI-Powered Tools

- **AI Design Suggestions**: Get intelligent layout and color recommendations
- **Natural Language Shape Generation**: Describe shapes in plain English, AI creates them
- **Batch AI Operations**: Create multiple shapes at once (counts as 1 change)
- **AI Canvas**: Dedicated AI conversation panel

### 🎯 Project Management

- **Multiple Projects**: Free tier (3 projects), Premium (unlimited)
- **12 Templates**: Blank, Login Form, Dashboard, Landing Page, Mobile App, Pricing, Email, Social Media, Presentation, Kanban, Certificate, Quote Card
- **Canvas Sharing**: Share with collaborators (viewer/editor permissions) - Premium feature
- **Project Renaming**: Update canvas names with real-time sync
- **Delete Protection**: Confirmation modals prevent accidental deletion

### 🎭 Customization

- **35 Themes**: 3-column grid with premium gating
- **Dark/Light Modes**: Theme-aware UI across all components
- **Premium Badges**: Blue verification checkmarks for premium users
- **Custom Avatars**: Upload profile pictures with fallback initials

---

## 📸 Screenshots

*(Add screenshots here of your application in action)*

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **Vite** | 7.1.7 | Build tool & dev server |
| **Konva.js** | 10.0.2 | Canvas rendering (HTML5 Canvas) |
| **react-konva** | 19.0.10 | React bindings for Konva |
| **react-router-dom** | 7.9.4 | Client-side routing |

### Backend & Services
| Technology | Version | Purpose |
|------------|---------|---------|
| **Firebase Auth** | 12.4.0 | Email/password & Google OAuth |
| **Firebase RTDB** | 12.4.0 | Real-time shape data, cursors, presence |
| **Cloud Firestore** | 12.4.0 | User profiles, leaderboard, daily activity |
| **Firebase Storage** | 12.4.0 | Profile pictures & message attachments |
| **Cloud Functions** | Node 18 | Stripe webhooks, AI operations |

### APIs & Integrations
| Service | Purpose |
|---------|---------|
| **Stripe** | Payment processing (monthly/lifetime subscriptions) |
| **OpenAI** | AI design suggestions & shape generation |
| **Tenor GIF API** | GIF picker in direct messages |

### Development Tools
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Firebase Tools** | Deployment & emulators |
| **jsPDF** | PDF export |

---

## 🏗 Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    React Application (Vite)                   │
│  ┌────────────┬────────────┬────────────┬─────────────────┐ │
│  │   Landing  │   Canvas   │   Auth     │   Messaging     │ │
│  │   Page     │   Editor   │   System   │   & Social      │ │
│  └────────────┴────────────┴────────────┴─────────────────┘ │
│                            ↕                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              React Contexts & Hooks                      ││
│  │  AuthContext | ThemeContext | UndoContext | Custom Hooks││
│  └──────────────────────────────────────────────────────────┘│
│                            ↕                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                  Service Layer                            ││
│  │  canvasRTDB | presence | cursors | projects | friends    ││
│  └──────────────────────────────────────────────────────────┘│
└────────────────────────┬─────────────────────────────────────┘
                         ↕
┌──────────────────────────────────────────────────────────────┐
│                    Firebase Backend                           │
│  ┌────────────┬────────────┬────────────┬─────────────────┐ │
│  │   RTDB     │  Firestore │  Storage   │   Functions     │ │
│  │  (shapes,  │  (profiles,│  (images)  │  (Stripe, AI)   │ │
│  │   cursors) │   activity)│            │                 │ │
│  └────────────┴────────────┴────────────┴─────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Real-Time Collaboration
```
User Action (Shape Edit)
    ↓
Command Pattern (CreateShapeCommand, UpdateShapeCommand, etc.)
    ↓
Service Layer (canvasRTDB.js)
    ↓
Firebase RTDB (/canvas/{canvasId}/shapes/{shapeId})
    ↓
Real-time Listeners on All Clients
    ↓
UI Update (Konva re-render)
```

#### User Presence
```
User Joins Canvas
    ↓
usePresence Hook
    ↓
Firebase RTDB (/sessions/{canvasId}/{userId})
    ↓
onDisconnect() auto-cleanup
    ↓
PresenceList Component Updates
```

### Key Design Patterns

1. **Command Pattern**: All canvas operations (create, update, delete, move) wrapped in undoable commands
2. **Optimistic Locking**: 8-second TTL locks with optimistic unlock for smooth collaboration
3. **Throttling**: Cursor updates throttled to 20 FPS (50ms) to optimize bandwidth
4. **Context API**: Global state management for auth, theme, and undo/redo
5. **Custom Hooks**: Encapsulated logic for presence, cursors, drag streams, and performance

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (18.x or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Firebase CLI** (optional, for deployment) - Install via `npm install -g firebase-tools`

**Recommended:**
- A modern code editor (VS Code, WebStorm, etc.)
- Google Chrome or Firefox (for best development experience)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/CollabCanvas.git
cd CollabCanvas
```

2. **Install dependencies**

```bash
npm install
```

3. **Install Cloud Functions dependencies** (optional, only if deploying functions)

```bash
cd functions
npm install
cd ..
```

### Firebase Setup

CollabCanvas requires a Firebase project with Realtime Database, Firestore, Storage, and Authentication enabled.

#### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project**
3. Enter project name (e.g., `collabcanvas-dev`)
4. Disable Google Analytics (optional)
5. Click **Create Project**

#### Step 2: Enable Authentication

1. In Firebase Console, navigate to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider (configure OAuth consent screen)

#### Step 3: Create Realtime Database

1. Navigate to **Realtime Database** → **Create Database**
2. Choose location (e.g., `us-central1`)
3. Start in **locked mode** (we'll set rules later)

#### Step 4: Create Firestore Database

1. Navigate to **Firestore Database** → **Create Database**
2. Start in **production mode**
3. Choose same location as RTDB

#### Step 5: Enable Storage

1. Navigate to **Storage** → **Get Started**
2. Start in **production mode**
3. Use default bucket

#### Step 6: Get Firebase Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **Your apps** → Click **Web** icon (`</>`)
3. Register app (nickname: `collabcanvas-web`)
4. Copy the `firebaseConfig` object

#### Step 7: Create Environment File

Create a `.env` file in the project root:

```bash
# Firebase Configuration
VITE_FB_API_KEY=your-api-key-here
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_BUCKET=your-project.appspot.com
VITE_FB_SENDER_ID=your-sender-id
VITE_FB_APP_ID=your-app-id
VITE_FB_DB_URL=https://your-project-default-rtdb.firebaseio.com
```

**Important:** Never commit `.env` to version control. It's already in `.gitignore`.

#### Step 8: Deploy Security Rules

**Firestore Rules:**

```bash
firebase deploy --only firestore:rules
```

The rules in `firestore.rules` will be deployed automatically.

**Realtime Database Rules:**

```bash
firebase deploy --only database
```

The rules in `database.rules.json` will be deployed automatically.

**Storage Rules:**

```bash
firebase deploy --only storage
```

The rules in `storage.rules` will be deployed automatically.

#### Step 9: (Optional) Set up Stripe for Payments

If you want to enable premium subscriptions:

1. Create a [Stripe](https://stripe.com/) account
2. Get API keys from **Developers** → **API keys**
3. Add to Firebase Functions config:

```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
```

4. Create products and prices in Stripe Dashboard
5. Update `functions/src/stripe.ts` with your Price IDs

#### Step 10: (Optional) Set up OpenAI for AI Features

1. Create an [OpenAI](https://platform.openai.com/) account
2. Generate API key
3. Add to Firebase Functions config:

```bash
firebase functions:config:set openai.api_key="sk-..."
```

### Running Locally

1. **Start the development server**

```bash
npm run dev
```

2. **Open your browser**

Navigate to `http://localhost:5173`

3. **Create an account**

Use the email/password signup or Google OAuth to create your first account.

4. **Start designing!**

- Click **Create Canvas** to start a new project
- Choose a template or start blank
- Invite collaborators by sharing the canvas

### Running with Firebase Emulators (Optional)

For offline development without hitting production Firebase:

```bash
# Install emulators (one-time)
firebase init emulators
# Select: Authentication, Firestore, Realtime Database, Storage

# Start emulators
firebase emulators:start
```

Update `.env` to point to emulators:

```bash
VITE_USE_EMULATORS=true
```

---

## 📦 Deployment

### Deploy to Firebase Hosting

1. **Build the project**

```bash
npm run build
```

This creates optimized production files in `dist/`.

2. **Login to Firebase** (first time only)

```bash
firebase login
```

3. **Initialize Firebase Hosting** (first time only)

```bash
firebase init hosting
# Select "Use an existing project"
# Choose your Firebase project
# Public directory: dist
# Single-page app: Yes
# Overwrite index.html: No
```

4. **Deploy**

```bash
firebase deploy --only hosting
```

Your app will be live at `https://your-project-id.web.app`

### Deploy Cloud Functions (Optional)

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Deploy Everything at Once

```bash
npm run build
firebase deploy
```

---

## 📚 Usage Guide

### Creating Your First Canvas

1. **Sign In**: Create an account using email/password or Google
2. **Choose Template**: Click **Create Canvas** and select a template
3. **Start Designing**: Use the toolbar on the right to add shapes
4. **Customize**: Change colors, sizes, and styles in the properties panel

### Collaboration Workflow

1. **Share Canvas**: Click the share icon, enter collaborator email
2. **Set Permissions**: Choose `viewer` (read-only) or `editor` (can edit)
3. **Send Invite**: Collaborator receives notification
4. **Real-Time Editing**: Both users see changes instantly

### Using AI Design Suggestions

1. **Open AI Panel**: Click AI icon in top navigation
2. **Describe Your Design**: E.g., "Create a login form with modern styling"
3. **Apply Suggestions**: AI generates shapes and layout recommendations
4. **Refine**: Edit AI-generated shapes like any other shape

### Keyboard Shortcuts

See [Keyboard Shortcuts](#-keyboard-shortcuts) section below.

---

## 💎 Premium Features

CollabCanvas offers a free tier with essential features, and premium tiers for power users.

### Free Tier
- ✅ 3 canvas projects
- ✅ All 9 shape types
- ✅ Unlimited undo/redo
- ✅ Friend system & direct messaging
- ✅ Leaderboard & activity tracking
- ✅ Basic themes
- ✅ Real-time collaboration
- ✅ Layers panel & history timeline

### Premium Tier ($9/month or $49 lifetime)
- ✨ **Unlimited canvas projects**
- ✨ **All 35 premium themes**
- ✨ **Canvas sharing with collaborators**
- ✨ **Premium verification badge** (blue checkmark)
- ✨ **Priority support**
- ✨ **Early access to new features**

**Upgrade**: Click **Upgrade** button in top navigation → Choose plan → Pay with Stripe

**Have a coupon?** Click **Coupon** button to redeem discount codes

---

## 📂 Project Structure

```
CollabCanvas/
├── src/
│   ├── components/
│   │   ├── AI/                    # AI design suggestions & canvas
│   │   ├── Auth/                  # Login, signup, OAuth
│   │   ├── Canvas/                # Main canvas editor & tools
│   │   │   ├── Canvas.jsx         # 4019 lines - core canvas logic
│   │   │   ├── ShapeRenderer.jsx  # Shape rendering (9 types)
│   │   │   ├── ShapeToolbar.jsx   # Right-side toolbar
│   │   │   ├── ColorPalette.jsx   # Color & gradient picker
│   │   │   └── ChatPanel.jsx      # Per-canvas chat
│   │   ├── Collaboration/         # Presence, cursors, selection badges
│   │   ├── Game/                  # Game canvas (bonus feature)
│   │   ├── Landing/               # Project grid, modals, messaging
│   │   │   ├── LandingPage.jsx    # Main project dashboard
│   │   │   ├── FriendsModal.jsx   # Friend management
│   │   │   ├── MessagingButton.jsx # Direct messages dropdown
│   │   │   ├── DirectMessagingPanel.jsx # Full DM interface
│   │   │   ├── LeaderboardModal.jsx # Friends leaderboard
│   │   │   ├── ProfileModal.jsx   # Own profile editing
│   │   │   ├── UserProfileView.jsx # View other profiles
│   │   │   ├── SettingsModal.jsx  # Theme selection
│   │   │   ├── SubscriptionModal.jsx # Stripe payment
│   │   │   └── TemplateSelectionModal.jsx # Template picker
│   │   ├── Messaging/             # GIF picker
│   │   └── UI/                    # Reusable UI components
│   │       ├── InlineTextEditor.jsx # Figma-quality text editor
│   │       ├── LayersPanel.jsx    # Layers hierarchy
│   │       ├── HistoryTimeline.jsx # Undo/redo timeline
│   │       ├── TextFormattingToolbar.jsx # Text styling
│   │       ├── HelpMenu.jsx       # Keyboard shortcuts reference
│   │       ├── PremiumBadge.jsx   # Blue checkmark SVG
│   │       └── ErrorBoundary.jsx  # Crash protection
│   ├── contexts/
│   │   ├── AuthContext.jsx        # User authentication state
│   │   ├── ThemeContext.jsx       # Theme management (35 themes)
│   │   └── UndoContext.jsx        # Undo/redo command stack
│   ├── hooks/
│   │   ├── usePresence.js         # Online presence tracking
│   │   ├── useCursors.js          # Real-time cursor positions
│   │   ├── useDragStreams.js      # Remote drag visualization
│   │   ├── useColorHistory.js     # Color history state
│   │   ├── usePerformance.js      # FPS monitoring
│   │   └── useUserProfile.js      # User profile fetching
│   ├── services/
│   │   ├── firebase.js            # Firebase initialization
│   │   ├── canvasRTDB.js          # RTDB shape CRUD operations
│   │   ├── cursors.js             # Cursor position updates
│   │   ├── presence.js            # Presence management
│   │   ├── selection.js           # Shape selection state
│   │   ├── dragStream.js          # Drag stream broadcasting
│   │   ├── undo.js                # Command pattern implementation
│   │   ├── projects.js            # Project/canvas management
│   │   ├── sharing.js             # Collaborator management
│   │   ├── friends.js             # Friend system logic
│   │   ├── directMessages.js      # DM functionality
│   │   ├── notifications.js       # Notification system
│   │   ├── userProfile.js         # Profile CRUD
│   │   ├── profilePicture.js      # Image upload
│   │   ├── dailyActivity.js       # Activity tracking
│   │   └── sharedHistory.js       # Canvas history
│   ├── utils/
│   │   ├── commands.js            # Undoable command classes
│   │   ├── geometry.js            # Geometric calculations
│   │   └── templates.js           # 12 canvas templates
│   ├── App.jsx                    # Root component with routing
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles
├── functions/
│   └── src/
│       ├── index.ts               # Cloud Functions entry
│       ├── stripe.ts              # Stripe webhooks
│       └── coupons.ts             # Coupon redemption
├── public/                        # Static assets
├── dist/                          # Production build output
├── firebase.json                  # Firebase configuration
├── database.rules.json            # RTDB security rules (130 lines)
├── firestore.rules                # Firestore security rules (88 lines)
├── storage.rules                  # Storage security rules
├── vite.config.js                 # Vite configuration
├── package.json                   # Dependencies
└── README.md                      # This file
```

**Key Files:**
- **`Canvas.jsx`** (4019 lines): Core canvas editor with all interaction logic
- **`canvasRTDB.js`** (595 lines): Real-time database service layer
- **`undo.js`** (892 lines): Command pattern for undo/redo (1000 operation stack)
- **`templates.js`** (3484 lines): 12 professional templates

---

## 🎨 Available Templates

CollabCanvas includes 12 professionally designed templates:

| Template | Description | Use Case |
|----------|-------------|----------|
| **Blank Canvas** | Start from scratch | Custom designs |
| **Login Form** | Email, password, button | Authentication UI |
| **Dashboard** | Metrics, sidebar, content | Analytics interfaces |
| **Landing Page** | Hero, features, footer | Marketing pages |
| **Mobile App** | Phone frame with UI | App mockups |
| **Pricing Page** | 3-tier pricing table | SaaS pricing |
| **Email Template** | Newsletter layout | Email campaigns |
| **Social Media Post** | Instagram square | Social content |
| **Presentation Slide** | 16:9 slide with 3 points | Business presentations |
| **Kanban Board** | 4-column task board | Project management |
| **Certificate** | Award with signatures | Certificates |
| **Quote Card** | Inspirational quote | Quote graphics |

All templates are fully editable and come with pre-configured shapes, typography, and layouts.

---

## ⌨️ Keyboard Shortcuts

### General
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Delete` or `Backspace` | Delete selected shape(s) |
| `Ctrl/Cmd + D` | Duplicate selected shape(s) |
| `Ctrl/Cmd + A` | Select all shapes |
| `Escape` | Deselect all / Close modals |

### Shape Tools
| Shortcut | Action |
|----------|--------|
| `R` | Add Rectangle |
| `C` | Add Circle |
| `L` | Add Line |
| `T` | Add Text |
| `Shift + T` | Add Triangle |
| `S` | Add Star |

### Canvas Navigation
| Shortcut | Action |
|----------|--------|
| `Mouse Wheel` | Zoom in/out |
| `Click + Drag` (on background) | Pan canvas |
| `Ctrl/Cmd + 0` | Reset zoom to 100% |

### Layer Management
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ]` | Bring to front |
| `Ctrl/Cmd + [` | Send to back |
| `Ctrl/Cmd + Shift + ]` | Bring forward |
| `Ctrl/Cmd + Shift + [` | Send backward |

### Text Editing
| Shortcut | Action |
|----------|--------|
| `Double-click` text | Edit text inline |
| `Enter` | Save text |
| `Shift + Enter` | New line (in text editor) |
| `Escape` | Cancel editing |

### Collaboration
| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts help |
| `Ctrl/Cmd + /` | Toggle chat panel |

---

## 🐛 Troubleshooting

### Issue: Shapes not syncing between users

**Symptoms**: User A creates a shape, User B doesn't see it

**Solutions:**
1. Check console for Firebase RTDB connection errors
2. Verify `.env` has correct `VITE_FB_DB_URL`
3. Ensure both users are on the same canvas ID (check URL)
4. Verify RTDB rules allow authenticated writes:
   ```bash
   firebase deploy --only database
   ```
5. Check browser console for WebSocket connection errors

### Issue: Cursor positions offset

**Symptoms**: Other users' cursors appear in wrong location

**Solutions:**
1. Ensure both users have same zoom level
2. Check that `stageScale` is passed to `useCursors` hook
3. Clear browser cache and reload
4. Verify coordinate conversion in `useCursors.js`

### Issue: Authentication fails

**Symptoms**: "Error signing in" or "Network request failed"

**Solutions:**
1. Verify Firebase Auth is enabled in console
2. Check API key in `.env` is correct
3. For Google OAuth, ensure redirect URIs are configured:
   - Firebase Console → Authentication → Sign-in method → Google → Authorized domains
4. Check browser console for specific error messages

### Issue: Images fail to upload

**Symptoms**: Profile pictures or message images don't upload

**Solutions:**
1. Check file size (max 5MB for profiles, 10MB for messages)
2. Verify Storage is enabled in Firebase Console
3. Check Storage rules are deployed:
   ```bash
   firebase deploy --only storage
   ```
4. Ensure user is authenticated
5. Check browser console for CORS errors

### Issue: Premium features not working after payment

**Symptoms**: Still shows "Free tier" after successful Stripe payment

**Solutions:**
1. Check Cloud Functions logs for webhook errors:
   ```bash
   firebase functions:log
   ```
2. Verify Stripe webhook is configured with correct endpoint
3. Check Firestore `/users/{userId}` has `isPremium: true`
4. Force refresh browser (`Ctrl + F5`)
5. Sign out and sign back in

### Issue: Slow performance with many shapes

**Symptoms**: Canvas lags when dragging shapes, low FPS

**Solutions:**
1. Reduce zoom level (canvas renders fewer pixels)
2. Check Performance Monitor (top-right) for FPS
3. Limit shapes to < 500 per canvas (performance target)
4. Disable cursor throttling in `cursors.js` (advanced)
5. Close other browser tabs using GPU

### Issue: "Permission denied" errors

**Symptoms**: Can't create shapes, edit profiles, or access features

**Solutions:**
1. Ensure user is signed in (`AuthContext` not null)
2. Check Firebase Console → Rules for deny errors
3. Verify user role (viewer vs editor) for shared canvases
4. Re-deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,database,storage
   ```

### Issue: AI features not working

**Symptoms**: AI panel shows errors or no response

**Solutions:**
1. Verify OpenAI API key is configured in Firebase Functions
2. Check Functions logs for API errors:
   ```bash
   firebase functions:log --only aiGenerateShape
   ```
3. Ensure OpenAI API has available credits
4. Check browser console for CORS or network errors

### Getting More Help

- **GitHub Issues**: [Report a bug](https://github.com/yourusername/CollabCanvas/issues)
- **Firebase Console**: Check Realtime Database, Firestore, and Authentication tabs
- **Browser DevTools**: Open Console (F12) for error messages
- **Firebase CLI**: Use `firebase functions:log` for backend errors

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check [existing issues](https://github.com/yourusername/CollabCanvas/issues) to avoid duplicates
2. Open a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Browser version and OS

### Suggesting Features

1. Open an issue with `[Feature Request]` in the title
2. Describe the feature and use case
3. Explain why it would be valuable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly (create new canvas, test collaboration, etc.)
5. Commit with clear messages: `git commit -m "Add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request with:
   - Description of changes
   - Screenshots/videos of new functionality
   - Testing steps

### Development Guidelines

- **Code Style**: Follow existing patterns, use ESLint
- **Comments**: Add JSDoc comments for functions and complex logic
- **Performance**: Test with 100+ shapes on canvas
- **Real-Time**: Test with 2+ browser windows for collaboration
- **Accessibility**: Ensure keyboard navigation works
- **Themes**: Test changes in both light and dark themes

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 CollabCanvas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Konva.js**: Powerful HTML5 Canvas library
- **Firebase**: Real-time backend infrastructure
- **React**: UI framework
- **Stripe**: Payment processing
- **OpenAI**: AI-powered design suggestions
- **Tenor**: GIF API for messaging

---

## 📞 Support & Contact

- **Documentation**: See this README
- **Issues**: [GitHub Issues](https://github.com/yourusername/CollabCanvas/issues)
- **Email**: support@collabcanvas.com
- **Twitter**: [@CollabCanvas](https://twitter.com/CollabCanvas)

---

<div align="center">

**Built with ❤️ by the CollabCanvas Team**

[⬆ Back to Top](#collabcanvas)

</div>
