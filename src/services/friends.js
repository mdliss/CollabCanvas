/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Friends Service - Friend Request and Management System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles friend requests, acceptance/denial, and friend list management.
 * Similar to Discord's friend system.
 * 
 * Database Structure:
 * /friends/{userId}/pending/{friendId} - Incoming requests
 * /friends/{userId}/outgoing/{friendId} - Outgoing requests
 * /friends/{userId}/accepted/{friendId} - Accepted friends
 */

import { ref, set, remove, get, onValue, query, orderByChild } from 'firebase/database';
import { rtdb } from './firebase';

/**
 * Send a friend request to another user by email
 */
export const sendFriendRequest = async (fromUser, toEmail) => {
  try {
    // First, find the user by email in Firestore
    const { db } = await import('./firebase');
    const { collection, query: firestoreQuery, where, getDocs } = await import('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const q = firestoreQuery(usersRef, where('email', '==', toEmail));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('User not found with that email');
    }
    
    const toUser = { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    
    // Can't friend yourself
    if (toUser.uid === fromUser.uid) {
      throw new Error('You cannot send a friend request to yourself');
    }
    
    // Check if already friends
    const alreadyFriends = await areFriends(fromUser.uid, toUser.uid);
    if (alreadyFriends) {
      throw new Error('You are already friends with this user');
    }
    
    // Check if request already sent
    const existingRequest = await get(ref(rtdb, `friends/${toUser.uid}/pending/${fromUser.uid}`));
    if (existingRequest.exists()) {
      throw new Error('Friend request already sent');
    }
    
    // Check if we have a pending request FROM them (if so, just accept it)
    const reverseRequest = await get(ref(rtdb, `friends/${fromUser.uid}/pending/${toUser.uid}`));
    if (reverseRequest.exists()) {
      // Auto-accept since both want to be friends
      await acceptFriendRequest(fromUser.uid, toUser.uid);
      return { autoAccepted: true };
    }
    
    const timestamp = Date.now();
    
    // Create pending request for recipient
    await set(ref(rtdb, `friends/${toUser.uid}/pending/${fromUser.uid}`), {
      userId: fromUser.uid,
      userName: fromUser.displayName || fromUser.email?.split('@')[0] || 'User',
      userEmail: fromUser.email || '',
      userPhoto: fromUser.photoURL || null,
      createdAt: timestamp
    });
    
    // Create outgoing request record for sender
    await set(ref(rtdb, `friends/${fromUser.uid}/outgoing/${toUser.uid}`), {
      userId: toUser.uid,
      userName: toUser.displayName || toUser.email?.split('@')[0] || 'User',
      userEmail: toUser.email || '',
      userPhoto: toUser.photoURL || null,
      createdAt: timestamp
    });
    
    console.log('[Friends] Friend request sent:', fromUser.uid, '→', toUser.uid);
    return { success: true };
  } catch (error) {
    console.error('[Friends] Failed to send friend request:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (userId, friendId) => {
  try {
    const timestamp = Date.now();
    
    // Get friend's data from pending request
    const pendingRef = ref(rtdb, `friends/${userId}/pending/${friendId}`);
    const pendingSnapshot = await get(pendingRef);
    
    if (!pendingSnapshot.exists()) {
      throw new Error('Friend request not found');
    }
    
    const friendData = pendingSnapshot.val();
    
    // Get user's data for the friend
    const { db } = await import('./firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    // Add to both users' accepted friends
    await set(ref(rtdb, `friends/${userId}/accepted/${friendId}`), {
      userId: friendId,
      userName: friendData.userName || 'User',
      userEmail: friendData.userEmail || '',
      userPhoto: friendData.userPhoto || null,
      acceptedAt: timestamp
    });
    
    await set(ref(rtdb, `friends/${friendId}/accepted/${userId}`), {
      userId: userId,
      userName: userData?.displayName || userData?.email?.split('@')[0] || 'User',
      userEmail: userData?.email || '',
      userPhoto: userData?.photoURL || null,
      acceptedAt: timestamp
    });
    
    // Remove pending and outgoing requests
    await remove(ref(rtdb, `friends/${userId}/pending/${friendId}`));
    await remove(ref(rtdb, `friends/${friendId}/outgoing/${userId}`));
    
    console.log('[Friends] Friend request accepted:', userId, '↔', friendId);
  } catch (error) {
    console.error('[Friends] Failed to accept friend request:', error);
    throw error;
  }
};

/**
 * Deny/delete a friend request
 */
export const denyFriendRequest = async (userId, friendId) => {
  try {
    // Remove from pending and outgoing
    await remove(ref(rtdb, `friends/${userId}/pending/${friendId}`));
    await remove(ref(rtdb, `friends/${friendId}/outgoing/${userId}`));
    
    console.log('[Friends] Friend request denied:', userId, 'X', friendId);
  } catch (error) {
    console.error('[Friends] Failed to deny friend request:', error);
    throw error;
  }
};

/**
 * Cancel an outgoing friend request
 */
export const cancelFriendRequest = async (userId, friendId) => {
  try {
    await remove(ref(rtdb, `friends/${userId}/outgoing/${friendId}`));
    await remove(ref(rtdb, `friends/${friendId}/pending/${userId}`));
    
    console.log('[Friends] Friend request cancelled:', userId, 'X', friendId);
  } catch (error) {
    console.error('[Friends] Failed to cancel friend request:', error);
    throw error;
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (userId, friendId) => {
  try {
    // Remove from both users' accepted lists
    await remove(ref(rtdb, `friends/${userId}/accepted/${friendId}`));
    await remove(ref(rtdb, `friends/${friendId}/accepted/${userId}`));
    
    console.log('[Friends] Friend removed:', userId, 'X', friendId);
  } catch (error) {
    console.error('[Friends] Failed to remove friend:', error);
    throw error;
  }
};

/**
 * Check if two users are friends
 */
export const areFriends = async (userId1, userId2) => {
  try {
    const friendRef = ref(rtdb, `friends/${userId1}/accepted/${userId2}`);
    const snapshot = await get(friendRef);
    return snapshot.exists();
  } catch (error) {
    console.error('[Friends] Failed to check friendship:', error);
    return false;
  }
};

/**
 * Subscribe to pending friend requests
 */
export const subscribeToPendingRequests = (userId, callback) => {
  const pendingRef = ref(rtdb, `friends/${userId}/pending`);
  
  const unsubscribe = onValue(pendingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const requests = Object.entries(data).map(([id, req]) => ({
        id,
        ...req
      }));
      callback(requests);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

/**
 * Subscribe to outgoing friend requests
 */
export const subscribeToOutgoingRequests = (userId, callback) => {
  const outgoingRef = ref(rtdb, `friends/${userId}/outgoing`);
  
  const unsubscribe = onValue(outgoingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const requests = Object.entries(data).map(([id, req]) => ({
        id,
        ...req
      }));
      callback(requests);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

/**
 * Subscribe to accepted friends list
 */
export const subscribeToFriends = (userId, callback) => {
  const friendsRef = ref(rtdb, `friends/${userId}/accepted`);
  
  const unsubscribe = onValue(friendsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const friends = Object.entries(data).map(([id, friend]) => ({
        id,
        ...friend
      }));
      callback(friends);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

/**
 * Get list of friend IDs (for filtering leaderboard)
 */
export const getFriendIds = async (userId) => {
  try {
    const friendsRef = ref(rtdb, `friends/${userId}/accepted`);
    const snapshot = await get(friendsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.keys(snapshot.val());
  } catch (error) {
    console.error('[Friends] Failed to get friend IDs:', error);
    return [];
  }
};

