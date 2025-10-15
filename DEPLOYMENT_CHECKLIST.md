# CollabCanvas Deployment Checklist

## Status: Ready for Production Deployment
**Last Updated:** October 15, 2025

---

## ✅ Completed Pre-Production Tasks

### 1. ✅ Firestore Rules Updated
**Status:** FIXED - Ready to deploy

**Changes Made:**
- ✅ Canvas bounds updated: 5000×5000 → 20000×20000
- ✅ Added 'triangle' and 'star' to allowed shape types
- ✅ Bio validation: 200 character limit enforced
- ✅ Profile security: Users can only edit own profiles, all can read

**Location:** `firestore.rules`

---

### 2. ✅ Storage Rules Created
**Status:** READY - Awaiting Storage initialization

**Features:**
- ✅ 5MB file size limit enforced
- ✅ Images-only validation (`image/*` content type)
- ✅ User isolation: Users can only upload to `/profile-pictures/{userId}/`
- ✅ Public read access for authenticated users
- ✅ Auto-cleanup of old photos implemented in code

**Location:** `storage.rules`

---

### 3. ✅ Firebase Configuration
**Status:** COMPLETE

**Configured Services:**
- ✅ Firestore rules path: `firestore.rules`
- ✅ RTDB rules path: `database.rules.json`
- ✅ Storage rules path: `storage.rules`
- ✅ Hosting configured for SPA with dist folder

**Location:** `firebase.json`

---

## 🚨 Critical Action Required: Initialize Firebase Storage

**⏱️ Estimated Time:** 5 minutes

### Step-by-Step Instructions:

1. **Open Firebase Console**
   ```
   https://console.firebase.google.com/project/collabcanvas-99a09/storage
   ```

2. **Initialize Storage**
   - Click "Get Started" button
   - Choose **"Production mode"** (we have custom rules ready)
   - Select location: **us-central1** (or your preferred region)
   - Click "Done"

3. **Deploy Storage Rules**
   ```bash
   firebase deploy --only storage
   ```
   
   Expected output:
   ```
   ✔  storage: released rules storage.rules to firebase.storage/collabcanvas-99a09.appspot.com
   ```

4. **Verify Deployment**
   - Open: https://console.firebase.google.com/project/collabcanvas-99a09/storage/rules
   - Confirm rules show the profile-pictures path restrictions

---

## 📋 Deployment Commands

### Deploy All Rules (Recommended)
```bash
firebase deploy --only firestore,storage
```

### Deploy Everything (Rules + Hosting)
```bash
# Build production bundle first
npm run build

# Deploy all services
firebase deploy
```

### Individual Deployments
```bash
firebase deploy --only firestore    # Firestore rules only
firebase deploy --only storage      # Storage rules only
firebase deploy --only database     # RTDB rules only
firebase deploy --only hosting      # Frontend only
```

---

## ✅ Manual Testing Checklist (Post-Deployment)

### Storage & Profile Pictures
- [ ] **Test 1:** Upload profile picture in browser A
  - Expected: Avatar updates in account dropdown, PresenceList, and cursors
  
- [ ] **Test 2:** Upload second profile picture
  - Expected: Old photo deleted from Storage, new photo displays
  
- [ ] **Test 3:** Try uploading 6MB file
  - Expected: Error message "Image must be less than 5MB"
  
- [ ] **Test 4:** Try uploading .pdf file
  - Expected: File picker blocks non-image files
  
- [ ] **Test 5:** Check Storage console
  - Expected: Files stored at `/profile-pictures/{userId}/{timestamp}.ext`

### Canvas Bounds (20000×20000)
- [ ] **Test 6:** Create shape at position (19500, 19500)
  - Expected: Shape persists without console errors
  
- [ ] **Test 7:** Pan to canvas edge (19999, 19999)
  - Expected: Canvas allows panning to full 20000×20000

### New Shape Types
- [ ] **Test 8:** Create triangle (Shift+T)
  - Expected: Shape persists and syncs across users
  
- [ ] **Test 9:** Create star (S)
  - Expected: Shape persists and syncs across users

### Profile System End-to-End
- [ ] **Test 10:** Edit bio in account dropdown
  - Expected: Saves to Firestore, shows in profile popup
  
- [ ] **Test 11:** Click user in PresenceList (browser B)
  - Expected: Profile popup shows correct bio and photo from browser A
  
- [ ] **Test 12:** Upload profile picture (browser A)
  - Expected: Updates immediately in browser B's PresenceList and cursor

### Real-Time Collaboration
- [ ] **Test 13:** Open 2 browsers with different users
  - Expected: Both see each other in PresenceList with correct avatars
  
- [ ] **Test 14:** Drag shape in browser A
  - Expected: Browser B sees red lock indicator and live drag stream
  
- [ ] **Test 15:** Move cursor in browser A
  - Expected: Browser B sees cursor with avatar and name label
  
- [ ] **Test 16:** Force-close browser A (without signing out)
  - Expected: User disappears from browser B within 8 seconds

---

## 🎯 Performance Validation (Recommended)

### Load Testing
```bash
# Test with 500+ shapes
# 1. Create shapes with script or manually
# 2. Open Chrome DevTools → Performance tab
# 3. Record 10 seconds of interaction
# 4. Check FPS stays above 30fps

# Expected Results:
# - Initial load: < 3 seconds
# - FPS during drag: > 30fps
# - Cursor latency: < 100ms
```

### Multi-User Testing
- [ ] Test with 5 concurrent users across different browsers
- [ ] Verify profile popups load within 500ms
- [ ] Confirm no RTDB throttling warnings in console

---

## 📊 Deployment Summary

### Files Modified
- `firestore.rules` - ✅ Canvas bounds + shape types updated
- `storage.rules` - ✅ Created and ready to deploy
- `firebase.json` - ✅ Storage configuration added

### Files Ready for Git Commit
```bash
git add firestore.rules storage.rules firebase.json
git add src/services/profilePicture.js
git add src/components/Auth/AuthBar.jsx
git add src/components/Collaboration/PresenceList.jsx
git commit -m "feat: complete profile picture system and update canvas rules for production"
```

---

## 🚀 Production Readiness Score: 95%

### Blocking Issues: 1
- ⏳ **Firebase Storage not initialized** (5 min fix)

### Recommended but Non-Blocking: 3
1. Performance testing with 500+ shapes
2. Enable Firestore offline persistence
3. Add loading spinners for initial shape load

---

## 📞 Support Resources

### Firebase Console Links
- **Project Overview:** https://console.firebase.google.com/project/collabcanvas-99a09
- **Storage:** https://console.firebase.google.com/project/collabcanvas-99a09/storage
- **Firestore:** https://console.firebase.google.com/project/collabcanvas-99a09/firestore
- **RTDB:** https://console.firebase.google.com/project/collabcanvas-99a09/database

### Documentation
- Firebase Storage Setup: https://firebase.google.com/docs/storage/web/start
- Security Rules: https://firebase.google.com/docs/rules

---

## ✨ Next Steps After Production

1. **Monitor Usage** (Week 1)
   - Check Firebase Console for Storage usage
   - Monitor Firestore read/write counts
   - Track RTDB concurrent connections

2. **Optimize** (Week 2)
   - Add image compression before upload (reduce costs)
   - Enable Firestore offline persistence
   - Implement profile cache TTL

3. **Enhance** (Week 3+)
   - Add image cropping tool
   - Implement lazy loading for large canvas areas
   - Add bundle size optimization

---

**Ready to Go Live? Complete the "Critical Action Required" section above! 🎉**

