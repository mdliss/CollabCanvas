/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Notification System - Edit Permission Requests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages edit permission requests from viewers to canvas owners.
 * 
 * DATABASE STRUCTURE:
 * /notifications/{ownerId}/requests/{requestId}:
 * {
 *   id: "req_123",
 *   type: "edit_request",
 *   canvasId: "canvas_xxx",
 *   canvasName: "My Canvas",
 *   requesterId: "user_yyy",
 *   requesterEmail: "viewer@example.com",
 *   requesterName: "Viewer Name",
 *   createdAt: timestamp,
 *   status: "pending" | "approved" | "denied"
 * }
 */

import { rtdb } from "./firebase";
import { ref, set, update, remove, onValue, get } from "firebase/database";

/**
 * Create edit permission request
 * 
 * @param {string} canvasId - Canvas ID
 * @param {string} canvasName - Canvas name  
 * @param {string} ownerId - Canvas owner's user ID
 * @param {Object} requester - User requesting access
 */
export const createEditRequest = async (canvasId, canvasName, ownerId, requester) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const request = {
    id: requestId,
    type: 'edit_request',
    canvasId,
    canvasName,
    requesterId: requester.uid,
    requesterEmail: requester.email,
    requesterName: requester.displayName || requester.email?.split('@')[0] || 'User',
    createdAt: Date.now(),
    status: 'pending'
  };
  
  const requestRef = ref(rtdb, `notifications/${ownerId}/requests/${requestId}`);
  await set(requestRef, request);
  
  console.log('[Notifications] Edit request created:', requestId);
  return request;
};

/**
 * List pending requests for owner
 * 
 * @param {string} ownerId - Owner's user ID
 * @returns {Promise<Array>} Array of pending requests
 */
export const listPendingRequests = async (ownerId) => {
  const requestsRef = ref(rtdb, `notifications/${ownerId}/requests`);
  const snapshot = await get(requestsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const requestsMap = snapshot.val();
  return Object.values(requestsMap)
    .filter(r => r.status === 'pending')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

/**
 * Subscribe to requests for owner
 * 
 * @param {string} ownerId - Owner's user ID
 * @param {Function} callback - Called with array of pending requests
 * @returns {Function} Unsubscribe function
 */
export const subscribeToRequests = (ownerId, callback) => {
  const requestsRef = ref(rtdb, `notifications/${ownerId}/requests`);
  
  return onValue(requestsRef, (snapshot) => {
    const requestsMap = snapshot.val() || {};
    const pending = Object.values(requestsMap)
      .filter(r => r.status === 'pending')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(pending);
  });
};

/**
 * Approve edit request and grant editor role
 * 
 * @param {string} ownerId - Owner's user ID
 * @param {Object} request - Request object
 */
export const approveEditRequest = async (ownerId, request) => {
  // Update collaborator role to editor
  const collaboratorRef = ref(rtdb, `canvas/${request.canvasId}/collaborators/${request.requesterEmail.replace(/[@.]/g, '_')}`);
  await update(collaboratorRef, {
    role: 'editor',
    updatedAt: Date.now(),
    approvedAt: Date.now()
  });
  
  // Mark request as approved
  const requestRef = ref(rtdb, `notifications/${ownerId}/requests/${request.id}`);
  await update(requestRef, {
    status: 'approved',
    approvedAt: Date.now()
  });
  
  // Send notification to requester that access was granted
  const requesterNotificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requesterNotificationRef = ref(rtdb, `notifications/${request.requesterId}/messages/${requesterNotificationId}`);
  await set(requesterNotificationRef, {
    id: requesterNotificationId,
    type: 'access_granted',
    canvasId: request.canvasId,
    canvasName: request.canvasName,
    message: `You have been granted edit access to "${request.canvasName}"`,
    createdAt: Date.now(),
    read: false
  });
  
  console.log('[Notifications] Edit request approved:', request.id);
  console.log('[Notifications] Notification sent to requester:', request.requesterId);
};

/**
 * Deny edit request
 * 
 * @param {string} ownerId - Owner's user ID
 * @param {string} requestId - Request ID
 */
export const denyEditRequest = async (ownerId, requestId) => {
  const requestRef = ref(rtdb, `notifications/${ownerId}/requests/${requestId}`);
  await update(requestRef, {
    status: 'denied',
    deniedAt: Date.now()
  });
  
  console.log('[Notifications] Edit request denied:', requestId);
};

/**
 * Delete a request
 * 
 * @param {string} ownerId - Owner's user ID
 * @param {string} requestId - Request ID
 */
export const deleteRequest = async (ownerId, requestId) => {
  const requestRef = ref(rtdb, `notifications/${ownerId}/requests/${requestId}`);
  await remove(requestRef);
  
  console.log('[Notifications] Request deleted:', requestId);
};

/**
 * Check if user has already requested edit access for a canvas
 * 
 * @param {string} ownerId - Canvas owner's user ID
 * @param {string} canvasId - Canvas ID
 * @param {string} requesterId - User requesting access
 * @returns {Promise<boolean>} True if pending request exists
 */
export const hasPendingRequest = async (ownerId, canvasId, requesterId) => {
  const requestsRef = ref(rtdb, `notifications/${ownerId}/requests`);
  const snapshot = await get(requestsRef);
  
  if (!snapshot.exists()) {
    return false;
  }
  
  const requestsMap = snapshot.val();
  const pendingRequests = Object.values(requestsMap).filter(
    r => r.status === 'pending' && 
         r.canvasId === canvasId && 
         r.requesterId === requesterId
  );
  
  return pendingRequests.length > 0;
};

/**
 * Subscribe to notification messages for a user
 * 
 * @param {string} userId - User ID to watch messages for
 * @param {Function} callback - Called with array of unread messages
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMessages = (userId, callback) => {
  const messagesRef = ref(rtdb, `notifications/${userId}/messages`);
  
  return onValue(messagesRef, (snapshot) => {
    const messagesMap = snapshot.val() || {};
    const unreadMessages = Object.values(messagesMap)
      .filter(m => !m.read)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(unreadMessages);
  });
};

/**
 * Mark a notification message as read
 * 
 * @param {string} userId - User ID
 * @param {string} messageId - Message ID
 */
export const markMessageAsRead = async (userId, messageId) => {
  const messageRef = ref(rtdb, `notifications/${userId}/messages/${messageId}`);
  await update(messageRef, {
    read: true,
    readAt: Date.now()
  });
  
  console.log('[Notifications] Message marked as read:', messageId);
};

/**
 * Delete a notification message
 * 
 * @param {string} userId - User ID
 * @param {string} messageId - Message ID
 */
export const deleteMessage = async (userId, messageId) => {
  const messageRef = ref(rtdb, `notifications/${userId}/messages/${messageId}`);
  await remove(messageRef);
  
  console.log('[Notifications] Message deleted:', messageId);
};

