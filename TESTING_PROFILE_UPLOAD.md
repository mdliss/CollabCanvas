# Profile Picture Upload - Testing Guide

## ✅ Implementation Status: COMPLETE

Your profile picture upload feature is fully implemented and ready for testing!

---

## Quick Test (2 minutes)

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Sign in** (if not already signed in)

3. **Open account dropdown:**
   - Click your avatar at the top-center of the screen

4. **Upload a photo:**
   - Hover over the large circular avatar → should see "Change" overlay
   - Click the avatar → file picker opens
   - Select a `.jpg` or `.png` image (< 5MB)
   - Watch the icon change to "Uploading..."
   - Avatar should update within 1-3 seconds

5. **Verify it worked:**
   - Avatar shows new photo in dropdown ✓
   - Close dropdown and check avatar in presence list (upper-right) ✓
   - Move mouse on canvas → cursor label shows new avatar ✓
   - Refresh page → photo persists ✓

---

## Comprehensive Testing Checklist

### Basic Upload Flow

- [ ] **Open account dropdown** (click avatar at top-center)
- [ ] **Hover over profile picture** → "Change" overlay appears
- [ ] **Click profile picture** → file picker opens
- [ ] **Select image** (`.jpg`, `.png`, `.gif`, or `.webp` under 5MB)
- [ ] **Watch upload state** → Icon changes to "Uploading..."
- [ ] **Verify avatar updates** in dropdown (1-3 seconds)
- [ ] **Check avatar in cursor label** (move mouse on canvas)
- [ ] **Check avatar in presence list** (upper-right corner)
- [ ] **Refresh page** → new avatar persists

### Console Verification

**Open browser console** (Cmd + Option + J on Mac, F12 on Windows)

Expected logs during upload:
```
[AuthBar] Profile picture updated: https://firebasestorage...
[profilePicture] Uploading image for user: abc123...
[profilePicture] Upload complete, getting download URL...
[profilePicture] Download URL: https://firebasestorage...
[profilePicture] Profile updated successfully
```

### Error Handling

- [ ] **Try uploading non-image file** (`.txt`, `.pdf`)
  - Expected: File picker should block it (accept filter)
  
- [ ] **Try uploading 10MB image**
  - Expected: Alert shows "Image must be less than 5MB"
  
- [ ] **Click "Cancel" in file picker**
  - Expected: Nothing happens, no error

### Old Photo Cleanup

- [ ] **Upload first photo** → Check Firebase Storage console
- [ ] **Upload second photo** → Old photo should be deleted
- [ ] **Verify Storage console** shows only latest photo

**Firebase Storage Console:**
```
https://console.firebase.google.com/project/collabcanvas-99a09/storage
```

Expected path: `/profile-pictures/{userId}/{timestamp}.jpg`

### Multi-User Testing

- [ ] **Upload photo in Browser A** (e.g., Chrome)
- [ ] **Open Browser B** (e.g., Firefox) with different user
- [ ] **Verify Browser B sees Browser A's new avatar** in PresenceList
- [ ] **Click Browser A's user in PresenceList** (Browser B)
- [ ] **Verify profile popup shows correct photo**

### Edge Cases

- [ ] **Upload photo twice rapidly**
  - Expected: Both succeed, only latest photo in Storage
  
- [ ] **Sign out and sign back in**
  - Expected: Photo persists
  
- [ ] **Upload photo, close browser immediately**
  - Expected: Upload completes (async), photo persists on reopen
  
- [ ] **Network interruption during upload**
  - Expected: Error alert, can retry

---

## Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution:** Ensure Firebase Storage is initialized and rules are deployed:
```bash
firebase deploy --only storage
```

Verify in console: https://console.firebase.google.com/project/collabcanvas-99a09/storage

---

### Issue: Upload succeeds but avatar doesn't update

**Check:**
1. Open Firestore console: https://console.firebase.google.com/project/collabcanvas-99a09/firestore
2. Navigate to `users/{your-uid}`
3. Verify `photoURL` field has the new Storage URL (starts with `https://firebasestorage.googleapis.com`)

**If photoURL is not updating:**
- Check browser console for errors
- Verify you're signed in (check `user.uid` exists)

---

### Issue: Old photos pile up in Storage

**This should not happen!** The code includes `deleteProfilePicture()` which runs before each upload.

**Verify:**
1. Check `AuthBar.jsx` line 113: `replaceProfilePicture(user.uid, file, oldPhotoURL)`
2. Check `profilePicture.js` line 108: `deleteProfilePicture(oldPhotoURL)`

**Manual cleanup if needed:**
```javascript
// In browser console (while signed in):
import { deleteProfilePicture } from './services/profilePicture';
deleteProfilePicture('https://firebasestorage.googleapis.com/...');
```

---

### Issue: Hover overlay doesn't show "Change" text

**Check CSS:**
The hover effect is inline styled. If it's not working:

1. Inspect the avatar button element (line 407-446 in `AuthBar.jsx`)
2. Verify the hover overlay `<span>` has opacity transition
3. Try a hard refresh (Cmd + Shift + R)

**Current hover effect location:** `AuthBar.jsx` lines 428-444

---

### Issue: Images are too large and slow to load

**Future optimization** (not critical for MVP):
- Add client-side image compression before upload
- Resize to optimal 256×256px
- Use image cropping tool

**For now:** User's responsibility to upload reasonable-sized images (max 5MB enforced)

---

## Performance Testing

### Storage Costs

**Current state:** No optimization, stores full-resolution uploads

**Monitor usage:**
- Console: https://console.firebase.google.com/project/collabcanvas-99a09/storage
- Free tier: 5GB storage, 1GB/day download

**Expected usage:**
- 10 users × 2MB avg = 20MB storage
- 100 users × 2MB avg = 200MB storage
- 1000 users × 2MB avg = 2GB storage

Old photos auto-deleted, so storage = current active users × avg file size.

---

### Load Time Testing

**Test with slow 3G connection:**

1. Open Chrome DevTools → Network tab
2. Select "Slow 3G" throttling
3. Upload 5MB image
4. Expected: 30-60 seconds upload time (acceptable for MVP)

**Desktop/WiFi:**
- 1MB image → ~1-2 seconds
- 5MB image → ~3-5 seconds

---

## Security Verification

### Storage Rules

**Verify rules in console:**
https://console.firebase.google.com/project/collabcanvas-99a09/storage/rules

**Expected rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId}/{filename} {
      // Users can only upload to their own folder
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      
      // Any authenticated user can read profile pictures
      allow read: if request.auth != null;
    }
  }
}
```

**Test security:**

1. **Try uploading to another user's folder** (manual test in console):
   - Expected: Permission denied
   
2. **Try uploading 10MB file:**
   - Expected: Client validates, server rejects if bypassed
   
3. **Try uploading non-image:**
   - Expected: Client validates, server rejects if bypassed

---

## Code Locations

### Key Files

- **Upload service:** `src/services/profilePicture.js` (117 lines)
- **Upload UI:** `src/components/Auth/AuthBar.jsx` (lines 106-126, 407-489)
- **Firebase config:** `src/services/firebase.js` (line 39: storage export)
- **Storage rules:** `storage.rules` (26 lines)

### Key Functions

- `uploadProfilePicture(userId, file)` - Upload + Firestore update
- `deleteProfilePicture(photoURL)` - Cleanup old photos
- `replaceProfilePicture(userId, file, oldPhotoURL)` - Atomic replace
- `handlePhotoUpload(event)` - UI event handler

---

## Success Criteria

All must pass:

- ✅ Click avatar opens file picker
- ✅ Upload shows "Uploading..." state
- ✅ Avatar updates in dropdown immediately
- ✅ Avatar updates in presence list
- ✅ Avatar updates in cursor labels
- ✅ Photo persists after refresh
- ✅ Old photos deleted on new upload
- ✅ Works with `.jpg`, `.png`, `.gif`, `.webp`
- ✅ Validates file size (5MB max)
- ✅ Shows error for invalid files
- ✅ No console errors during upload
- ✅ Hover shows "Change" overlay

---

## Firebase Console Quick Links

- **Storage Files:** https://console.firebase.google.com/project/collabcanvas-99a09/storage/files
- **Storage Rules:** https://console.firebase.google.com/project/collabcanvas-99a09/storage/rules
- **Storage Usage:** https://console.firebase.google.com/project/collabcanvas-99a09/usage
- **Firestore Users:** https://console.firebase.google.com/project/collabcanvas-99a09/firestore/data/users
- **Authentication:** https://console.firebase.google.com/project/collabcanvas-99a09/authentication/users

---

## Next Steps After Testing

### If all tests pass:

1. ✅ Commit changes:
   ```bash
   git add src/services/profilePicture.js src/components/Auth/AuthBar.jsx storage.rules
   git commit -m "feat: complete profile picture upload with Firebase Storage"
   ```

2. ✅ Deploy to production:
   ```bash
   npm run build
   firebase deploy
   ```

3. ✅ Test in production environment

4. ✅ Monitor Storage usage in Firebase console

### If any tests fail:

1. Check browser console for errors
2. Verify Firebase Storage is initialized
3. Verify storage rules are deployed
4. Check this guide's troubleshooting section
5. Review code in key files listed above

---

**Ready to test? Run `npm run dev` and follow the "Quick Test" section! 🚀**

