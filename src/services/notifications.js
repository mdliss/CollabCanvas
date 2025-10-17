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
  
  console.log('[Notifications] Edit request approved:', request.id);
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

