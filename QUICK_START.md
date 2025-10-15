# CollabCanvas - Quick Start Guide

## 🚀 Your Profile Upload is Ready!

Everything is implemented. Just test and deploy.

---

## ⚡ 60-Second Test

```bash
# 1. Start app
npm run dev

# 2. Test upload
# - Click your avatar (top-center)
# - Click large avatar in dropdown
# - Select image < 5MB
# - Wait 2-3 seconds
# - See avatar update everywhere

# 3. Verify
# - Dropdown: ✓
# - Presence list: ✓
# - Cursor label: ✓
# - Refresh page: ✓
```

---

## 🚢 Deploy to Production

```bash
# Deploy rules (5 seconds)
firebase deploy --only firestore,storage

# Build and deploy app (30 seconds)
npm run build
firebase deploy
```

**Done!** 🎉

---

## 📁 What Was Done

### Files Created
- ✅ `src/services/profilePicture.js` - Upload/delete functions
- ✅ `storage.rules` - Security rules (5MB, images only)

### Files Updated
- ✅ `firestore.rules` - Canvas 20000×20000, triangle/star shapes
- ✅ `src/components/Auth/AuthBar.jsx` - Upload UI
- ✅ `src/services/firebase.js` - Storage export

---

## 🔗 Quick Links

**Firebase Console:**
- Storage: https://console.firebase.google.com/project/collabcanvas-99a09/storage

**Documentation:**
- Full testing guide: `TESTING_PROFILE_UPLOAD.md`
- Deployment checklist: `DEPLOYMENT_CHECKLIST.md`
- Production summary: `PRODUCTION_READY_SUMMARY.md`

---

## 💡 How It Works

1. User clicks avatar in account dropdown
2. File picker opens (images only)
3. Client validates: < 5MB, is image
4. Uploads to: `/profile-pictures/{userId}/{timestamp}.jpg`
5. Gets download URL from Storage
6. Updates Firestore `users/{uid}/photoURL`
7. Deletes old photo (if exists)
8. Avatar updates everywhere automatically

---

## ✅ Success Checklist

Before deploying:
- [ ] Firebase Storage initialized in console
- [ ] Upload tested in dev (works)
- [ ] Avatar updates in all 3 places
- [ ] Console shows no errors

After deploying:
- [ ] Test in production URL
- [ ] Upload photo in production
- [ ] Check Storage console for file
- [ ] Monitor for 24 hours

---

## 🆘 If Something Breaks

**Upload fails:**
```bash
# Check Storage is initialized
firebase deploy --only storage
```

**Avatar doesn't update:**
- Refresh page
- Check browser console for errors
- Verify Firestore `photoURL` field updated

**Old photos not deleting:**
- Check console logs for delete errors
- Manual cleanup: Firebase Console → Storage

---

**Questions?** Check `TESTING_PROFILE_UPLOAD.md` for detailed troubleshooting.

**Ready to ship?** Run the deploy commands above! 🚀

