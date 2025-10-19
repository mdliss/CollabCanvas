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
  if (!uid) return;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const activityRef = doc(db, 'users', uid, 'dailyActivity', dateKey);
    const activitySnap = await getDoc(activityRef);
    
    if (activitySnap.exists()) {
      const current = activitySnap.data().changes || 0;
      await setDoc(activityRef, {
        date: dateKey,
        changes: current + 1,
        updatedAt: Date.now()
      });
    } else {
      await setDoc(activityRef, {
        date: dateKey,
        changes: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
    console.log(`[DailyActivity] Incremented ${dateKey} for user ${uid}`);
  } catch (error) {
    console.error('[DailyActivity] Failed to increment:', error);
    // Non-critical - don't throw
  }
};

/**
 * Get activity data for last N days for multiple users
 */
export const getActivityData = async (userIds, days = 7) => {
  if (!userIds || userIds.length === 0) return [];
  
  try {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
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
    
    console.log('[DailyActivity] Loaded', days, 'days of activity for', userIds.length, 'users');
    return data;
  } catch (error) {
    console.error('[DailyActivity] Failed to get activity:', error);
    return [];
  }
};

