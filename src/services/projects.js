/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Project Management Service - Multi-Canvas Support
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages canvas projects for users with create, read, update, delete operations.
 * 
 * DATABASE STRUCTURE:
 * 
 * /projects/{userId}/canvases/{projectId}:
 * {
 *   id: "proj_1234567890_abc",
 *   name: "My Design Project",
 *   canvasId: "canvas_1234567890_xyz",  // Links to /canvas/{canvasId}
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 *   thumbnail: "data:image/png;base64,...",  // Optional preview image
 *   isStarred: false,
 *   tags: ["design", "mockup"]
 * }
 * 
 * /canvas/{canvasId}/:  // Existing structure, now supports multiple canvases
 * {
 *   shapes: { ... },
 *   metadata: { lastUpdated, createdBy, ... }
 * }
 * 
 * FREE VS PREMIUM LIMITS:
 * - Free: 3 projects max
 * - Premium: Unlimited projects
 * - Checked via subscription status in user profile
 */

import { rtdb, db } from "./firebase";
import { ref, set, update, remove, onValue, get, query, orderByChild } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { TEMPLATES } from "../utils/templates";

/**
 * Get User's Subscription Status
 * 
 * @param {string} userId - User ID
 * @returns {Promise<{isPremium: boolean, tier: string}>}
 */
export const getUserSubscription = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { isPremium: false, tier: 'free' };
    }
    
    const data = userDoc.data();
    return {
      isPremium: data.isPremium || false,
      tier: data.subscriptionTier || 'free',
      stripeCustomerId: data.stripeCustomerId,
      subscriptionId: data.subscriptionId
    };
  } catch (error) {
    console.error('[Projects] Failed to get subscription status:', error);
    return { isPremium: false, tier: 'free' };
  }
};

/**
 * List all projects for a user (owned projects only)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of project objects
 */
export const listProjects = async (userId) => {
  const projectsRef = ref(rtdb, `projects/${userId}/canvases`);
  const snapshot = await get(projectsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const projectsMap = snapshot.val();
  return Object.values(projectsMap)
    .map(p => ({ ...p, isOwned: true, isShared: false }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); // Most recent first
};

/**
 * List canvases shared with user
 * 
 * @param {string} userEmail - User's email address
 * @returns {Promise<Array>} Array of shared canvas objects
 */
export const listSharedCanvases = async (userEmail) => {
  if (!userEmail) {
    return [];
  }
  
  try {
    // Query all canvases to find ones where user is a collaborator
    const canvasesRef = ref(rtdb, 'canvas');
    const snapshot = await get(canvasesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allCanvases = snapshot.val();
    const sharedCanvases = [];
    const emailKey = userEmail.replace(/[@.]/g, '_');
    
    
    // Check each canvas for collaborator entry
    for (const [canvasId, canvasData] of Object.entries(allCanvases)) {
      // Skip if canvas data is null/undefined (deleted canvas)
      if (!canvasData) continue;
      
      // Skip if metadata is missing (invalid/corrupted canvas)
      if (!canvasData.metadata) {
        continue;
      }
      
      // Skip if canvas has no valid creation data (orphaned data)
      if (!canvasData.metadata.createdBy && !canvasData.metadata.createdAt) {
        continue;
      }
      
      const collaborators = canvasData.collaborators || {};
      
      
      if (collaborators[emailKey]) {
        const collab = collaborators[emailKey];
        
        const projectName = canvasData.metadata?.projectName || 'Shared Canvas';
        console.log(`[Projects] Loading shared canvas ${canvasId}: "${projectName}" (updated: ${new Date(canvasData.metadata?.lastUpdated || 0).toLocaleString()})`);
        
        sharedCanvases.push({
          id: `shared_${canvasId}`,
          name: projectName,
          canvasId: canvasId,
          createdAt: canvasData.metadata?.createdAt || Date.now(),
          updatedAt: canvasData.metadata?.lastUpdated || Date.now(),
          createdBy: canvasData.metadata?.createdBy,
          isOwned: false,
          isShared: true,
          sharedRole: collab.role,
          sharedBy: collab.addedBy,
          isStarred: false
        });
      }
    }
    
    
    return sharedCanvases.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    
  } catch (error) {
    console.error('[Projects] Failed to list shared canvases:', error);
    return [];
  }
};

/**
 * Find orphaned canvases (canvases with incomplete/corrupted data)
 * 
 * @returns {Promise<Array>} Array of orphaned canvas IDs with details
 */
export const findOrphanedCanvases = async () => {
  try {
    const canvasesRef = ref(rtdb, 'canvas');
    const snapshot = await get(canvasesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allCanvases = snapshot.val();
    const orphaned = [];
    
    for (const [canvasId, canvasData] of Object.entries(allCanvases)) {
      // Check for various issues
      const issues = [];
      
      if (!canvasData) {
        issues.push('null_data');
      } else {
        if (!canvasData.metadata) {
          issues.push('missing_metadata');
        } else {
          if (!canvasData.metadata.createdBy) issues.push('missing_createdBy');
          if (!canvasData.metadata.createdAt) issues.push('missing_createdAt');
        }
        
        if (!canvasData.shapes && !canvasData.collaborators) {
          issues.push('empty_canvas');
        }
      }
      
      if (issues.length > 0) {
        orphaned.push({
          canvasId,
          issues,
          metadata: canvasData?.metadata || null,
          hasShapes: !!canvasData?.shapes,
          hasCollaborators: !!canvasData?.collaborators,
          collaboratorCount: canvasData?.collaborators ? Object.keys(canvasData.collaborators).length : 0
        });
      }
    }
    
    console.log(`[Projects] Found ${orphaned.length} orphaned canvases`);
    return orphaned;
    
  } catch (error) {
    console.error('[Projects] Failed to find orphaned canvases:', error);
    return [];
  }
};

/**
 * Clean up orphaned canvas (use with caution!)
 * 
 * @param {string} canvasId - Canvas ID to delete
 * @returns {Promise<void>}
 */
export const cleanupOrphanedCanvas = async (canvasId) => {
  console.warn(`[Projects] Cleaning up orphaned canvas: ${canvasId}`);
  const canvasRef = ref(rtdb, `canvas/${canvasId}`);
  await remove(canvasRef);
  console.log(`[Projects] Deleted canvas: ${canvasId}`);
};

/**
 * Subscribe to projects changes
 * 
 * @param {string} userId - User ID
 * @param {Function} callback - Called with array of projects
 * @returns {Function} Unsubscribe function
 */
export const subscribeToProjects = (userId, callback) => {
  const projectsRef = ref(rtdb, `projects/${userId}/canvases`);
  
  return onValue(projectsRef, (snapshot) => {
    const projectsMap = snapshot.val() || {};
    const projects = Object.values(projectsMap)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    callback(projects);
  });
};

/**
 * Create a new canvas project
 * 
 * @param {string} userId - User ID
 * @param {string} name - Project name
 * @returns {Promise<Object>} Created project object with canvasId
 */
export const createProject = async (userId, name = 'Untitled Canvas', templateId = 'blank') => {
  // Check subscription limits
  const subscription = await getUserSubscription(userId);
  const existingProjects = await listProjects(userId);
  
  if (!subscription.isPremium && existingProjects.length >= 3) {
    throw new Error('Free tier limited to 3 projects. Upgrade to Premium for unlimited projects.');
  }
  
  const timestamp = Date.now();
  const projectId = `proj_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const canvasId = `canvas_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  
  const project = {
    id: projectId,
    name: name.trim() || 'Untitled Canvas',
    canvasId,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: userId,
    isStarred: false,
    tags: [],
    template: templateId // Track which template was used
  };
  
  // Create project metadata
  const projectRef = ref(rtdb, `projects/${userId}/canvases/${projectId}`);
  await set(projectRef, project);
  
  // Initialize canvas metadata
  const canvasMetadataRef = ref(rtdb, `canvas/${canvasId}/metadata`);
  await set(canvasMetadataRef, {
    createdAt: timestamp,
    createdBy: userId,
    lastUpdated: timestamp,
    projectId,
    projectName: project.name,
    template: templateId
  });
  
  // Apply template shapes if not blank
  if (templateId && templateId !== 'blank' && TEMPLATES[templateId]) {
    const template = TEMPLATES[templateId];
    const shapes = template.shapes(userId);
    
    
    // Write all template shapes to canvas
    for (const shape of shapes) {
      const shapeRef = ref(rtdb, `canvas/${canvasId}/shapes/${shape.id}`);
      await set(shapeRef, shape);
    }
    
    // Update canvas metadata with shape count
    await update(canvasMetadataRef, {
      lastUpdated: Date.now(),
      shapeCount: shapes.length
    });
  }
  
  
  return project;
};

/**
 * Update project metadata
 * 
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {Object} updates - Fields to update
 */
export const updateProject = async (userId, projectId, updates) => {
  const projectRef = ref(rtdb, `projects/${userId}/canvases/${projectId}`);
  
  const updateData = {
    ...updates,
    updatedAt: Date.now()
  };
  
  await update(projectRef, updateData);
  
  // CRITICAL: If name changed, also update canvas metadata so shared users see the new name
  if (updates.name) {
    // Get the project to find its canvasId
    const projectSnapshot = await get(projectRef);
    if (projectSnapshot.exists()) {
      const project = projectSnapshot.val();
      if (project.canvasId) {
        const canvasMetadataRef = ref(rtdb, `canvas/${project.canvasId}/metadata`);
        await update(canvasMetadataRef, {
          projectName: updates.name,
          lastUpdated: Date.now()
        });
        console.log('[Projects] Updated canvas metadata projectName for shared users:', project.canvasId);
      }
    }
  }
};

/**
 * Delete a project and its canvas data
 * 
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} canvasId - Canvas ID to delete
 */
export const deleteProject = async (userId, projectId, canvasId) => {
  // Delete project metadata
  const projectRef = ref(rtdb, `projects/${userId}/canvases/${projectId}`);
  await remove(projectRef);
  
  // Delete canvas data
  const canvasRef = ref(rtdb, `canvas/${canvasId}`);
  await remove(canvasRef);
};

/**
 * Get single project details
 * 
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>} Project object or null
 */
export const getProject = async (userId, projectId) => {
  const projectRef = ref(rtdb, `projects/${userId}/canvases/${projectId}`);
  const snapshot = await get(projectRef);
  
  return snapshot.exists() ? snapshot.val() : null;
};

/**
 * Duplicate a project
 * 
 * @param {string} userId - User ID
 * @param {string} sourceProjectId - Project to duplicate
 * @returns {Promise<Object>} New project object
 */
export const duplicateProject = async (userId, sourceProjectId) => {
  // Get source project
  const sourceProject = await getProject(userId, sourceProjectId);
  if (!sourceProject) {
    throw new Error('Source project not found');
  }
  
  // Check subscription limits
  const subscription = await getUserSubscription(userId);
  const existingProjects = await listProjects(userId);
  
  if (!subscription.isPremium && existingProjects.length >= 3) {
    throw new Error('Free tier limited to 3 projects. Upgrade to Premium for unlimited projects.');
  }
  
  // Create new project
  const timestamp = Date.now();
  const newProjectId = `proj_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const newCanvasId = `canvas_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newProject = {
    ...sourceProject,
    id: newProjectId,
    name: `${sourceProject.name} (Copy)`,
    canvasId: newCanvasId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  // Save new project
  const projectRef = ref(rtdb, `projects/${userId}/canvases/${newProjectId}`);
  await set(projectRef, newProject);
  
  // Copy canvas shapes
  const sourceShapesRef = ref(rtdb, `canvas/${sourceProject.canvasId}/shapes`);
  const sourceSnapshot = await get(sourceShapesRef);
  
  if (sourceSnapshot.exists()) {
    const shapes = sourceSnapshot.val();
    const newShapesRef = ref(rtdb, `canvas/${newCanvasId}/shapes`);
    await set(newShapesRef, shapes);
  }
  
  // Initialize new canvas metadata
  const canvasMetadataRef = ref(rtdb, `canvas/${newCanvasId}/metadata`);
  await set(canvasMetadataRef, {
    createdAt: timestamp,
    createdBy: userId,
    lastUpdated: timestamp,
    projectId: newProjectId,
    projectName: newProject.name
  });
  
  
  return newProject;
};

