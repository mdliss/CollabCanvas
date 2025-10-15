import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * userProfile.js - Firestore operations for user profiles
 * Collection: /users/{uid}
 * Stores: displayName, email, photoURL, bio, stats, timestamps
 */

/**
 * Get user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} User profile data or null if not found
 */
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('[userProfile] Failed to get profile:', error);
    throw error;
  }
};

/**
 * Create or update user profile (merge mode)
 * @param {string} uid - User ID
 * @param {object} profileData - Profile data to save
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, profileData) => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      ...profileData,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error('[userProfile] Failed to update profile:', error);
    throw error;
  }
};

/**
 * Update just the bio field
 * @param {string} uid - User ID
 * @param {string} bio - Bio text (max 200 chars)
 * @returns {Promise<void>}
 */
export const updateUserBio = async (uid, bio) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { 
      bio: bio.slice(0, 200), // Enforce 200 char limit
      updatedAt: Date.now() 
    });
  } catch (error) {
    console.error('[userProfile] Failed to update bio:', error);
    throw error;
  }
};

/**
 * Initialize user profile on first login
 * Creates profile document if it doesn't exist
 * @param {object} user - Firebase user object
 * @returns {Promise<void>}
 */
export const initializeUserProfile = async (user) => {
  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: user.photoURL || null,
        bio: '',
        createdAt: Date.now(),
        lastSeen: Date.now(),
        stats: {
          shapesCreated: 0,
          sessionsCount: 0
        }
      });
      console.log('[userProfile] Profile initialized for', user.uid);
    } else {
      // Update last seen timestamp
      await updateDoc(docRef, { lastSeen: Date.now() });
    }
  } catch (error) {
    console.error('[userProfile] Failed to initialize profile:', error);
    throw error;
  }
};

/**
 * Increment shape count for user
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 */
export const incrementShapeCount = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().stats?.shapesCreated || 0;
      await updateDoc(docRef, { 
        'stats.shapesCreated': currentCount + 1,
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error('[userProfile] Failed to increment shape count:', error);
    // Don't throw - this is non-critical
  }
};

