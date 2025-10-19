/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Daily Activity Tracking - Real Leaderboard Activity Data
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tracks user changes on a daily basis for accurate activity timelines.
 */

import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Increment today's activity count for a user
 * Called whenever a change is made (from undo.js)
 */
export const incrementTodayActivity = async (uid) => {
  if (!uid) {
    console.warn('[DailyActivity] ⚠️ incrementTodayActivity called without UID');
    return;
  }
  
  try {
    const today = new Date();
    // Get local date string (not UTC) to avoid timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
    
    const activityRef = doc(db, 'users', uid, 'dailyActivity', dateKey);
    const activitySnap = await getDoc(activityRef);
    
    if (activitySnap.exists()) {
      const current = activitySnap.data().changes || 0;
      await setDoc(activityRef, {
        date: dateKey,
        changes: current + 1,
        updatedAt: Date.now()
      });
      console.log(`[DailyActivity] ✓ Incremented ${dateKey} for user ${uid.substring(0, 8)}... from ${current} to ${current + 1}`);
    } else {
      await setDoc(activityRef, {
        date: dateKey,
        changes: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log(`[DailyActivity] ✓ Created new activity for ${dateKey} (user ${uid.substring(0, 8)}...)`);
    }
  } catch (error) {
    console.error('[DailyActivity] ❌ Failed to increment:', error);
    console.error('[DailyActivity] Error details:', {
      uid: uid?.substring(0, 8) + '...',
      error: error.message,
      code: error.code
    });
    // Non-critical - don't throw
  }
};

/**
 * Get activity data for last N days for multiple users
 */
export const getActivityData = async (userIds, days = 7) => {
  if (!userIds || userIds.length === 0) {
    console.log('[DailyActivity] No user IDs provided');
    return [];
  }
  
  try {
    console.log(`[DailyActivity] Loading ${days} days of activity for ${userIds.length} users:`, userIds);
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Get local date string (not UTC) to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      const dayData = {
        date: dateKey,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      };
      
      // Get activity for each user on this date
      for (const uid of userIds) {
        const activityRef = doc(db, 'users', uid, 'dailyActivity', dateKey);
        const activitySnap = await getDoc(activityRef);
        
        dayData[uid] = activitySnap.exists() ? (activitySnap.data().changes || 0) : 0;
      }
      
      data.push(dayData);
    }
    
    console.log('[DailyActivity] ✓ Loaded', days, 'days of activity for', userIds.length, 'users');
    console.log('[DailyActivity] Sample data:', data.slice(0, 2)); // Show first 2 days
    return data;
  } catch (error) {
    console.error('[DailyActivity] ❌ Failed to get activity:', error);
    return [];
  }
};

