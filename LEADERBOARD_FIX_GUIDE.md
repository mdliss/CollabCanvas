# Leaderboard & Activity Tracking - Fix Guide

## Issues Fixed

### 1. ✅ Firestore Rules Blocking Daily Activity
**Problem**: The Firestore rules had a catch-all that blocked writes to the `dailyActivity` subcollection under `/users/{userId}/`.

**Solution**: Added specific rules for the `dailyActivity` subcollection:
```javascript
// Daily activity subcollection
match /dailyActivity/{dateKey} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && request.auth.uid == userId;
}
```

**Status**: ✅ DEPLOYED (firestore.rules updated and deployed)

### 2. ✅ Admin Utilities for Count Fixing
**Problem**: Inflated change counts (2,000+) from before the batch operation fix.

**Solution**: Created comprehensive admin utilities accessible from browser console.

---

## How to Fix Your Inflated Count

Open your browser console on the **Landing Page** and you'll see the admin utilities loaded. Then run:

```javascript
// Option 1: Automatic fix (recommended)
adminUtils.fixMyCount()
```

This will:
1. Check your current count
2. Calculate the correct count from daily activity
3. Fix the discrepancy if found
4. Tell you to refresh the page

### Alternative Commands

```javascript
// View your activity summary (see the discrepancy)
adminUtils.getMyActivity()

// Manually recalculate from daily activity
adminUtils.recalculateMyCount()

// Reset to 0 (if you want to start fresh)
adminUtils.resetMyCount()

// Test if daily activity tracking is working
adminUtils.testMyActivity()
```

---

## How Daily Activity Works Now

After the Firestore rules fix:

1. **Every change you make** → Increments `changesCount` in your user profile
2. **Every change you make** → Increments today's count in `/users/{uid}/dailyActivity/{YYYY-MM-DD}`
3. **Leaderboard reads** from both:
   - Total count for ranking
   - Daily activity for the 7-day timeline chart

### Testing Activity Tracking

Make a canvas change (create, move, delete a shape), then run:

```javascript
adminUtils.testMyActivity()
```

You should see:
```
✓ Daily activity is working!
Path: users/YOUR-UID/dailyActivity/2025-10-19
```

---

## Why the Activity Timeline Shows "No activity recorded yet"

**Before the fix**: Daily activity writes were failing silently due to Firestore permissions.

**After the fix**: 
- New changes will now create activity records correctly
- You need to make a few changes to populate the timeline
- The timeline shows the last 7 days

**To populate your timeline**: Just use the canvas normally - create shapes, move them, etc. Each change will update today's activity count.

---

## Checking Your Data in Firestore Console

1. Go to: https://console.firebase.google.com/project/collabcanvas-99a09/firestore
2. Navigate to: `users → {your-uid} → dailyActivity`
3. You should see documents like `2025-10-19` with:
   ```
   {
     date: "2025-10-19",
     changes: 5,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

---

## Summary of Changes

### Files Modified:
1. **firestore.rules** - Added dailyActivity subcollection permissions ✅ DEPLOYED
2. **src/services/adminUtils.js** - Created admin utility functions
3. **src/services/dailyActivity.js** - Enhanced logging for debugging
4. **src/components/Landing/LandingPage.jsx** - Expose admin utils in console
5. **src/components/Landing/LeaderboardModal.jsx** - Better activity chart rendering

### No Breaking Changes:
- All changes are additive
- Existing data is preserved
- No migration required

---

## Next Steps

1. **Fix your count**: Run `adminUtils.fixMyCount()` in the console
2. **Refresh the page**: See the corrected count
3. **Make some changes**: Populate your activity timeline
4. **Check the leaderboard**: Activity chart should now show data

---

## If You Still Have Issues

Run this diagnostic:

```javascript
// 1. Check if admin utils are loaded
console.log(adminUtils ? '✓ Admin utils loaded' : '❌ Admin utils not found');

// 2. Test daily activity
await adminUtils.testMyActivity();

// 3. Get full activity summary
await adminUtils.getMyActivity();
```

Copy the output and check:
- Any permission errors?
- Is the activity incrementing?
- What's the discrepancy between total count and daily activity?

The detailed logging will show exactly what's happening.

