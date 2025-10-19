/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Utilities - Database Maintenance Functions
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Utility functions for fixing data issues and performing maintenance tasks.
 * 
 * USAGE:
 * These functions should be called from the browser console for one-time fixes.
 * Import them in the component where needed and expose them to window object.
 * 
 * IMPORTANT:
 * These functions directly modify user data and should be used carefully.
 */

import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { rtdb } from './firebase';
import { ref, get, set, remove } from 'firebase/database';
import { incrementTodayActivity } from './dailyActivity';

/**
 * Reset a user's change count to 0
 * Useful for fixing inflated counts from before batch operation fix
 * 
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 * 
 * @example
 * // From browser console:
 * import('./services/adminUtils').then(({ resetUserChangesCount }) => {
 *   resetUserChangesCount('user123').then(() => console.log('Reset complete'));
 * });
 */
export const resetUserChangesCount = async (uid) => {
  if (!uid) {
    throw new Error('User ID is required');
  }
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`User ${uid} not found`);
    }
    
    const oldCount = docSnap.data().changesCount || 0;
    
    await updateDoc(docRef, {
      changesCount: 0,
      updatedAt: Date.now()
    });
    
    console.log(`[AdminUtils] ✓ Reset changes count for user ${uid} from ${oldCount} to 0`);
  } catch (error) {
    console.error('[AdminUtils] Failed to reset changes count:', error);
    throw error;
  }
};

/**
 * Recalculate a user's change count from their daily activity records
 * More accurate than the running total which may have been inflated
 * 
 * @param {string} uid - User ID
 * @returns {Promise<number>} New change count
 * 
 * @example
 * import('./services/adminUtils').then(({ recalculateUserChangesCount }) => {
 *   recalculateUserChangesCount('user123').then(newCount => {
 *     console.log('Recalculated count:', newCount);
 *   });
 * });
 */
export const recalculateUserChangesCount = async (uid) => {
  if (!uid) {
    throw new Error('User ID is required');
  }
  
  try {
    // Get all daily activity records for this user
    const activityRef = collection(db, 'users', uid, 'dailyActivity');
    const activitySnap = await getDocs(activityRef);
    
    let totalChanges = 0;
    activitySnap.forEach(doc => {
      totalChanges += doc.data().changes || 0;
    });
    
    // Update user's changesCount
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error(`User ${uid} not found`);
    }
    
    const oldCount = userSnap.data().changesCount || 0;
    
    await updateDoc(userRef, {
      changesCount: totalChanges,
      updatedAt: Date.now()
    });
    
    console.log(`[AdminUtils] ✓ Recalculated changes count for user ${uid}`);
    console.log(`[AdminUtils]   Old count: ${oldCount}`);
    console.log(`[AdminUtils]   New count: ${totalChanges} (from ${activitySnap.size} days of activity)`);
    console.log(`[AdminUtils]   Difference: ${oldCount - totalChanges}`);
    
    return totalChanges;
  } catch (error) {
    console.error('[AdminUtils] Failed to recalculate changes count:', error);
    throw error;
  }
};

/**
 * Get a summary of a user's activity for debugging
 * 
 * @param {string} uid - User ID
 * @returns {Promise<object>} Activity summary
 */
export const getUserActivitySummary = async (uid) => {
  if (!uid) {
    throw new Error('User ID is required');
  }
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error(`User ${uid} not found`);
    }
    
    const userData = userSnap.data();
    
    // Get all daily activity
    const activityRef = collection(db, 'users', uid, 'dailyActivity');
    const activitySnap = await getDocs(activityRef);
    
    const dailyActivity = [];
    let totalFromActivity = 0;
    
    activitySnap.forEach(doc => {
      const data = doc.data();
      dailyActivity.push({
        date: data.date,
        changes: data.changes || 0
      });
      totalFromActivity += data.changes || 0;
    });
    
    // Sort by date
    dailyActivity.sort((a, b) => a.date.localeCompare(b.date));
    
    const summary = {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      currentChangesCount: userData.changesCount || 0,
      totalFromDailyActivity: totalFromActivity,
      discrepancy: (userData.changesCount || 0) - totalFromActivity,
      daysTracked: dailyActivity.length,
      dailyActivity
    };
    
    console.log('[AdminUtils] Activity Summary for', userData.email);
    console.log('  Current changes count:', summary.currentChangesCount);
    console.log('  Total from daily activity:', summary.totalFromDailyActivity);
    console.log('  Discrepancy:', summary.discrepancy);
    console.log('  Days tracked:', summary.daysTracked);
    
    return summary;
  } catch (error) {
    console.error('[AdminUtils] Failed to get activity summary:', error);
    throw error;
  }
};

/**
 * Clear all daily activity for a user (use with caution!)
 * 
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 */
export const clearUserDailyActivity = async (uid) => {
  if (!uid) {
    throw new Error('User ID is required');
  }
  
  try {
    const activityRef = collection(db, 'users', uid, 'dailyActivity');
    const activitySnap = await getDocs(activityRef);
    
    const deletePromises = [];
    activitySnap.forEach(docSnapshot => {
      deletePromises.push(docSnapshot.ref.delete());
    });
    
    await Promise.all(deletePromises);
    
    console.log(`[AdminUtils] ✓ Cleared ${activitySnap.size} days of activity for user ${uid}`);
  } catch (error) {
    console.error('[AdminUtils] Failed to clear daily activity:', error);
    throw error;
  }
};

/**
 * Fix existing friend requests with undefined values
 * Cleans up any pending/outgoing requests that have undefined fields
 */
export const fixFriendRequests = async (uid) => {
  if (!uid) {
    throw new Error('User ID is required');
  }
  
  try {
    console.log('[AdminUtils] 🔧 Fixing friend requests for user:', uid);
    let fixedCount = 0;
    
    // Fix pending requests
    const pendingRef = ref(rtdb, `friends/${uid}/pending`);
    const pendingSnap = await get(pendingRef);
    
    if (pendingSnap.exists()) {
      const pending = pendingSnap.val();
      for (const [friendId, data] of Object.entries(pending)) {
        // Check if any fields are undefined
        if (data.userPhoto === undefined || data.userEmail === undefined || data.userName === undefined) {
          console.log(`[AdminUtils] Fixing pending request from ${friendId}`);
          await set(ref(rtdb, `friends/${uid}/pending/${friendId}`), {
            userId: data.userId || friendId,
            userName: data.userName || 'User',
            userEmail: data.userEmail || '',
            userPhoto: data.userPhoto || null,
            createdAt: data.createdAt || Date.now()
          });
          fixedCount++;
        }
      }
    }
    
    // Fix outgoing requests
    const outgoingRef = ref(rtdb, `friends/${uid}/outgoing`);
    const outgoingSnap = await get(outgoingRef);
    
    if (outgoingSnap.exists()) {
      const outgoing = outgoingSnap.val();
      for (const [friendId, data] of Object.entries(outgoing)) {
        // Check if any fields are undefined
        if (data.userPhoto === undefined || data.userEmail === undefined || data.userName === undefined) {
          console.log(`[AdminUtils] Fixing outgoing request to ${friendId}`);
          await set(ref(rtdb, `friends/${uid}/outgoing/${friendId}`), {
            userId: data.userId || friendId,
            userName: data.userName || 'User',
            userEmail: data.userEmail || '',
            userPhoto: data.userPhoto || null,
            createdAt: data.createdAt || Date.now()
          });
          fixedCount++;
        }
      }
    }
    
    console.log(`%c[AdminUtils] ✓ Fixed ${fixedCount} friend requests`, 'color: #6bcf7f; font-weight: bold');
    return { fixedCount };
  } catch (error) {
    console.error('[AdminUtils] ❌ Failed to fix friend requests:', error);
    throw error;
  }
};

/**
 * Clean up orphaned shared canvases
 * Removes canvases from shared list that no longer exist in RTDB
 */
export const cleanupOrphanedSharedCanvases = async () => {
  try {
    console.log('[AdminUtils] 🧹 Checking for orphaned shared canvases...');
    
    // Get all canvases
    const canvasesRef = ref(rtdb, 'canvas');
    const snapshot = await get(canvasesRef);
    
    if (!snapshot.exists()) {
      console.log('[AdminUtils] No canvases found in database');
      return { cleaned: 0, canvases: [] };
    }
    
    const allCanvases = snapshot.val();
    const orphaned = [];
    
    for (const [canvasId, canvasData] of Object.entries(allCanvases)) {
      // Check if canvas is corrupted/incomplete
      if (!canvasData || !canvasData.metadata || !canvasData.metadata.createdBy) {
        orphaned.push({
          canvasId,
          name: canvasData?.metadata?.projectName || 'Unknown',
          issue: 'missing_owner'
        });
      }
    }
    
    if (orphaned.length === 0) {
      console.log('%c[AdminUtils] ✓ No orphaned canvases found', 'color: #6bcf7f; font-weight: bold');
      return { cleaned: 0, canvases: [] };
    }
    
    console.log(`%c[AdminUtils] Found ${orphaned.length} orphaned canvases`, 'color: #ffd93d; font-weight: bold');
    console.table(orphaned);
    
    console.log('%c[AdminUtils] To clean these up, run:', 'color: #4ecdc4; font-weight: bold');
    console.log('   adminUtils.deleteOrphanedCanvas("canvasId")');
    
    return { cleaned: orphaned.length, canvases: orphaned };
  } catch (error) {
    console.error('[AdminUtils] Failed to cleanup orphaned canvases:', error);
    throw error;
  }
};

/**
 * Delete a specific orphaned canvas
 */
export const deleteOrphanedCanvas = async (canvasId) => {
  if (!canvasId) {
    throw new Error('Canvas ID is required');
  }
  
  try {
    console.log(`[AdminUtils] 🗑️ Deleting orphaned canvas: ${canvasId}`);
    const canvasRef = ref(rtdb, `canvas/${canvasId}`);
    await set(canvasRef, null); // Set to null to delete
    console.log(`%c[AdminUtils] ✓ Deleted canvas ${canvasId}`, 'color: #6bcf7f; font-weight: bold');
    console.log('%c[AdminUtils] Refresh the page to update your project list', 'color: #95e1d3');
  } catch (error) {
    console.error('[AdminUtils] Failed to delete canvas:', error);
    throw error;
  }
};

/**
 * Force refresh shared canvases list
 * Useful after deleting canvases to update the UI
 */
export const refreshSharedCanvases = async () => {
  const uid = getCurrentUserUid();
  if (!uid) {
    console.error('%c[AdminUtils] No current user found', 'color: #ff6b6b; font-weight: bold');
    return;
  }
  
  console.log('[AdminUtils] 🔄 Force refreshing shared canvases list...');
  console.log('[AdminUtils] Please refresh the page to see updated list');
};

/**
 * List all shared canvases for current user
 * Shows which canvases you're a collaborator on
 */
export const listMySharedCanvases = async () => {
  try {
    // Get current user's email from Firestore
    const uid = getCurrentUserUid();
    if (!uid) {
      console.error('%c[AdminUtils] No current user found', 'color: #ff6b6b; font-weight: bold');
      return;
    }
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userEmail = userDoc.data()?.email;
    
    if (!userEmail) {
      console.error('[AdminUtils] No email found for user');
      return;
    }
    
    console.log('[AdminUtils] 📋 Finding shared canvases for:', userEmail);
    
    const canvasesRef = ref(rtdb, 'canvas');
    const snapshot = await get(canvasesRef);
    
    if (!snapshot.exists()) {
      console.log('[AdminUtils] No canvases found in database');
      return [];
    }
    
    const allCanvases = snapshot.val();
    const sharedCanvases = [];
    const emailKey = userEmail.replace(/[@.]/g, '_');
    
    for (const [canvasId, canvasData] of Object.entries(allCanvases)) {
      if (!canvasData) continue;
      
      const collaborators = canvasData.collaborators || {};
      
      if (collaborators[emailKey]) {
        sharedCanvases.push({
          canvasId,
          name: canvasData.metadata?.projectName || 'Unknown',
          role: collaborators[emailKey].role,
          createdBy: canvasData.metadata?.createdBy || 'Unknown',
          hasMetadata: !!canvasData.metadata,
          hasShapes: !!canvasData.shapes,
          shapeCount: canvasData.shapes ? Object.keys(canvasData.shapes).length : 0
        });
      }
    }
    
    if (sharedCanvases.length === 0) {
      console.log('%c[AdminUtils] ✓ No shared canvases found', 'color: #6bcf7f; font-weight: bold');
      return [];
    }
    
    console.log(`%c[AdminUtils] Found ${sharedCanvases.length} shared canvases`, 'color: #4ecdc4; font-weight: bold');
    console.table(sharedCanvases);
    
    console.log('%c[AdminUtils] To delete a canvas, run:', 'color: #ffd93d; font-weight: bold');
    console.log('   adminUtils.deleteOrphanedCanvas("canvasId")');
    
    return sharedCanvases;
  } catch (error) {
    console.error('[AdminUtils] Failed to list shared canvases:', error);
    throw error;
  }
};

/**
 * Test daily activity tracking
 * Manually increments today's activity to verify it's working
 */
export const testDailyActivity = async (uid) => {
  if (!uid) {
    throw new Error('User ID is required');
  }
  
  try {
    console.log('[AdminUtils] 🧪 Testing daily activity tracking...');
    console.log('[AdminUtils] User:', uid);
    
    // Get current activity before
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const activityRef = doc(db, 'users', uid, 'dailyActivity', dateKey);
    
    const beforeSnap = await getDoc(activityRef);
    const beforeCount = beforeSnap.exists() ? (beforeSnap.data().changes || 0) : 0;
    console.log(`[AdminUtils] Current activity for ${dateKey}:`, beforeCount);
    
    // Increment activity
    console.log('[AdminUtils] Incrementing activity...');
    await incrementTodayActivity(uid);
    
    // Check after
    const afterSnap = await getDoc(activityRef);
    const afterCount = afterSnap.exists() ? (afterSnap.data().changes || 0) : 0;
    console.log(`[AdminUtils] Activity after increment:`, afterCount);
    
    if (afterCount > beforeCount) {
      console.log('%c[AdminUtils] ✓ Daily activity is working!', 'color: #6bcf7f; font-weight: bold');
      console.log(`[AdminUtils] Path: users/${uid}/dailyActivity/${dateKey}`);
    } else {
      console.log('%c[AdminUtils] ❌ Daily activity increment failed', 'color: #ff6b6b; font-weight: bold');
      console.log('[AdminUtils] This might be a Firestore permissions issue');
    }
    
    return { beforeCount, afterCount, dateKey };
  } catch (error) {
    console.error('[AdminUtils] ❌ Test failed:', error);
    console.error('[AdminUtils] Error code:', error.code);
    console.error('[AdminUtils] Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('%c[AdminUtils] ⚠️ FIRESTORE PERMISSIONS ERROR', 'color: #ff6b6b; font-weight: bold');
      console.log('[AdminUtils] The dailyActivity subcollection needs write permissions');
      console.log('[AdminUtils] Check your firestore.rules file');
    }
    
    throw error;
  }
};

/**
 * Get current user's UID from window (set by LandingPage)
 */
const getCurrentUserUid = () => {
  if (typeof window === 'undefined') return null;
  return window.__currentUserUid || null;
};

/**
 * Expose admin functions to window object for console access
 * Call this from a component to enable console debugging
 */
export const exposeAdminUtils = (currentUserUid = null) => {
  if (typeof window !== 'undefined') {
    // Store current user UID for easy access
    if (currentUserUid) {
      window.__currentUserUid = currentUserUid;
    }
    
    // Helper function to use current user if no UID provided
    const withCurrentUser = (fn) => {
      return async (uid = null) => {
        const targetUid = uid || getCurrentUserUid();
        if (!targetUid) {
          console.error('%c[AdminUtils] No user ID provided and no current user found', 'color: #ff6b6b; font-weight: bold');
          console.log('Usage: functionName() for current user, or functionName("uid") for specific user');
          return;
        }
        return fn(targetUid);
      };
    };
    
    window.adminUtils = {
      // Original functions (require UID)
      resetUserChangesCount,
      recalculateUserChangesCount,
      getUserActivitySummary,
      clearUserDailyActivity,
      testDailyActivity,
      fixFriendRequests,
      cleanupOrphanedSharedCanvases,
      deleteOrphanedCanvas,
      refreshSharedCanvases,
      listMySharedCanvases,
      
      // Convenience functions (use current user by default)
      resetMyCount: withCurrentUser(resetUserChangesCount),
      recalculateMyCount: withCurrentUser(recalculateUserChangesCount),
      getMyActivity: withCurrentUser(getUserActivitySummary),
      clearMyActivity: withCurrentUser(clearUserDailyActivity),
      testMyActivity: withCurrentUser(testDailyActivity),
      fixMyFriendRequests: withCurrentUser(fixFriendRequests),
      
      // Quick fix function
      fixMyCount: async () => {
        const uid = getCurrentUserUid();
        if (!uid) {
          console.error('%c[AdminUtils] No current user found', 'color: #ff6b6b; font-weight: bold');
          return;
        }
        console.log('%c[AdminUtils] 🔧 Fixing change count for current user...', 'color: #4ecdc4; font-weight: bold');
        const summary = await getUserActivitySummary(uid);
        if (summary.discrepancy > 0) {
          console.log(`%c[AdminUtils] Found discrepancy of ${summary.discrepancy} changes`, 'color: #ffd93d; font-weight: bold');
          console.log('%c[AdminUtils] Recalculating from daily activity...', 'color: #4ecdc4');
          await recalculateUserChangesCount(uid);
          console.log('%c[AdminUtils] ✓ Count fixed! Please refresh the page.', 'color: #6bcf7f; font-weight: bold');
        } else {
          console.log('%c[AdminUtils] ✓ No discrepancy found - count is accurate!', 'color: #6bcf7f; font-weight: bold');
        }
        return summary;
      }
    };
    
    console.log('%c╔══════════════════════════════════════════════════════════╗', 'color: #ff6b6b; font-weight: bold');
    console.log('%c║     🛠️  Admin Utilities Loaded                          ║', 'color: #ff6b6b; font-weight: bold');
    console.log('%c╚══════════════════════════════════════════════════════════╝', 'color: #ff6b6b; font-weight: bold');
    console.log('');
    console.log('%c🚀 QUICK FIX (recommended):', 'color: #4ecdc4; font-weight: bold');
    console.log('%c   adminUtils.fixMyCount()', 'color: #95e1d3; font-size: 14px');
    console.log('   → Automatically diagnose and fix change count issues');
    console.log('');
    console.log('%c📊 Convenience functions (use current user):', 'color: #4ecdc4; font-weight: bold');
    console.log('   adminUtils.getMyActivity()               - View your activity summary');
    console.log('   adminUtils.testMyActivity()              - Test if activity tracking works');
    console.log('   adminUtils.recalculateMyCount()          - Fix count from daily activity');
    console.log('   adminUtils.resetMyCount()                - Reset count to 0');
    console.log('   adminUtils.fixMyFriendRequests()         - Fix friend requests with undefined values');
    console.log('');
    console.log('%c🧹 Canvas cleanup functions:', 'color: #4ecdc4; font-weight: bold');
    console.log('   adminUtils.listMySharedCanvases()          - List ALL your shared canvases');
    console.log('   adminUtils.cleanupOrphanedSharedCanvases() - Find orphaned/deleted canvases');
    console.log('   adminUtils.deleteOrphanedCanvas("id")      - Delete a specific canvas by ID');
    console.log('   adminUtils.refreshSharedCanvases()         - Force refresh shared list');
    console.log('');
    console.log('%c🔧 Advanced functions (specify UID):', 'color: #4ecdc4; font-weight: bold');
    console.log('   adminUtils.getUserActivitySummary("uid")');
    console.log('   adminUtils.testDailyActivity("uid")');
    console.log('   adminUtils.recalculateUserChangesCount("uid")');
    console.log('   adminUtils.resetUserChangesCount("uid")');
    console.log('   adminUtils.fixFriendRequests("uid")');
    console.log('');
    if (currentUserUid) {
      console.log('%c👤 Current user UID:', 'color: #95e1d3', currentUserUid);
    }
  }
};

