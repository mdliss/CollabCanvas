/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Message Attachments Service - Image and GIF uploads for Direct Messages
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload image attachment for a direct message
 * @param {string} conversationId - Conversation ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadMessageImage = async (conversationId, file) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Validate file size (10MB max for messages)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be less than 10MB');
  }

  try {
    console.log('[messageAttachments] Uploading image for conversation:', conversationId);
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}.${fileExtension}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `message-images/${conversationId}/${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    
    console.log('[messageAttachments] Upload complete, getting download URL...');
    
    // Get public download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('[messageAttachments] Download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('[messageAttachments] Upload failed:', error);
    throw error;
  }
};

/**
 * Validate image file before upload
 * @param {File} file - File to validate
 * @returns {boolean} True if valid
 */
export const validateImageFile = (file) => {
  if (!file) return false;
  
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be less than 10MB');
  }
  
  return true;
};

