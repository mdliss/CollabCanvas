/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Canvas Sharing Service - Multi-User Collaboration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enables sharing canvases with other users with different permission levels.
 * 
 * PERMISSION LEVELS:
 * - owner: Full control (default creator)
 * - editor: Can edit shapes and invite others
 * - viewer: Read-only access
 * 
 * DATABASE STRUCTURE:
 * /canvas/{canvasId}/collaborators/{userId}:
 * {
 *   uid: "user_xxx",
 *   email: "user@example.com",
 *   displayName: "User Name",
 *   role: "owner" | "editor" | "viewer",
 *   addedAt: timestamp,
 *   addedBy: "owner_uid"
 * }
 * 
 * PREMIUM FEATURE:
 * - Only premium users can share canvases
 * - Free users can be invited but can't create shares
 */

import { rtdb, db } from "./firebase";
import { ref, set, update, remove, onValue, get } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";

/**
 * Share canvas with another user
 * 
 * @param {string} canvasId - Canvas to share
 * @param {string} userEmail - Email of user to share with
 * @param {string} role - Permission level (editor|viewer)
 * @param {Object} currentUser - User doing the sharing
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const shareCanvas = async (canvasId, userEmail, role, currentUser) => {
  try {
    // Check if current user is premium
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const isPremium = userDoc.data()?.isPremium || false;
    
    if (!isPremium) {
      throw new Error('Canvas sharing is a Premium feature. Upgrade to share canvases.');
    }
    
    // Find user by email (search Firestore users collection)
    // Note: This requires a Firestore query - for now, we'll use a simple approach
    // In production, you'd want an indexed query or Cloud Function
    
    const collaboratorRef = ref(rtdb, `canvas/${canvasId}/collaborators/${userEmail.replace(/[@.]/g, '_')}`);
    await set(collaboratorRef, {
      email: userEmail,
      role,
      addedAt: Date.now(),
      addedBy: currentUser.uid,
      inviteStatus: 'pending' // Will be 'accepted' when user logs in
    });
    
    console.log('[Sharing] Canvas shared:', canvasId, 'with', userEmail, 'as', role);
    
    return {
      success: true,
      message: `Canvas shared with ${userEmail} as ${role}`
    };
    
  } catch (error) {
    console.error('[Sharing] Failed to share canvas:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get collaborators for a canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @returns {Promise<Array>} Array of collaborator objects
 */
export const getCollaborators = async (canvasId) => {
  const collaboratorsRef = ref(rtdb, `canvas/${canvasId}/collaborators`);
  const snapshot = await get(collaboratorsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const collaboratorsMap = snapshot.val();
  return Object.values(collaboratorsMap);
};

/**
 * Remove collaborator from canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @param {string} userEmail - Email of collaborator to remove
 */
export const removeCollaborator = async (canvasId, userEmail) => {
  const collaboratorRef = ref(rtdb, `canvas/${canvasId}/collaborators/${userEmail.replace(/[@.]/g, '_')}`);
  await remove(collaboratorRef);
  console.log('[Sharing] Removed collaborator:', userEmail);
};

/**
 * Check if user has access to canvas
 * 
 * @param {string} canvasId - Canvas ID
 * @param {string} userId - User ID to check
 * @returns {Promise<{hasAccess: boolean, role: string}>}
 */
export const checkCanvasAccess = async (canvasId, userId, userEmail) => {
  // Check if user is owner
  const metadataRef = ref(rtdb, `canvas/${canvasId}/metadata`);
  const metadata = await get(metadataRef);
  
  if (metadata.exists() && metadata.val().createdBy === userId) {
    return { hasAccess: true, role: 'owner' };
  }
  
  // Check if user is collaborator
  const collaboratorRef = ref(rtdb, `canvas/${canvasId}/collaborators/${userEmail.replace(/[@.]/g, '_')}`);
  const collaborator = await get(collaboratorRef);
  
  if (collaborator.exists()) {
    return { hasAccess: true, role: collaborator.val().role };
  }
  
  return { hasAccess: false, role: null };
};

