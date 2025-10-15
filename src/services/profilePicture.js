import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { updateUserProfile } from './userProfile';

/**
 * profilePicture.js - Profile picture upload/management with Firebase Storage
 * Handles image uploads, URL generation, and cleanup of old images
 */

/**
 * Upload profile picture to Firebase Storage
 * @param {string} userId - User's UID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadProfilePicture = async (userId, file) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Validate file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be less than 5MB');
  }

  try {
    console.log('[profilePicture] Uploading image for user:', userId);
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}.${fileExtension}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `profile-pictures/${userId}/${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    
    console.log('[profilePicture] Upload complete, getting download URL...');
    
    // Get public download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('[profilePicture] Download URL:', downloadURL);
    
    // Update Firestore profile with new photoURL
    await updateUserProfile(userId, { photoURL: downloadURL });
    
    console.log('[profilePicture] Profile updated successfully');
    
    return downloadURL;
  } catch (error) {
    console.error('[profilePicture] Upload failed:', error);
    throw error;
  }
};

/**
 * Delete old profile picture from Firebase Storage
 * @param {string} photoURL - Full URL of the photo to delete
 */
export const deleteProfilePicture = async (photoURL) => {
  try {
    if (!photoURL) return;
    
    // Only delete if it's a Firebase Storage URL
    if (!photoURL.includes('firebasestorage.googleapis.com')) {
      console.log('[profilePicture] Not a Firebase Storage URL, skipping delete');
      return;
    }
    
    // Extract storage path from URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/PROJECT.appspot.com/o/PATH?token=...
    const pathMatch = photoURL.match(/\/o\/(.+?)\?/);
    if (!pathMatch || !pathMatch[1]) {
      console.warn('[profilePicture] Could not extract path from URL');
      return;
    }
    
    const encodedPath = pathMatch[1];
    const decodedPath = decodeURIComponent(encodedPath);
    
    console.log('[profilePicture] Deleting old photo:', decodedPath);
    
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
    
    console.log('[profilePicture] Old photo deleted successfully');
  } catch (error) {
    // Don't throw - deletion is best-effort
    console.warn('[profilePicture] Failed to delete old photo:', error.message);
  }
};

/**
 * Upload new profile picture and delete old one
 * @param {string} userId - User's UID
 * @param {File} file - New image file
 * @param {string} oldPhotoURL - URL of old photo to delete (optional)
 * @returns {Promise<string>} Download URL of new image
 */
export const replaceProfilePicture = async (userId, file, oldPhotoURL) => {
  // Upload new picture first
  const newPhotoURL = await uploadProfilePicture(userId, file);
  
  // Delete old picture (best-effort, don't fail if this errors)
  if (oldPhotoURL) {
    await deleteProfilePicture(oldPhotoURL).catch(err => {
      console.warn('[profilePicture] Failed to delete old photo:', err);
    });
  }
  
  return newPhotoURL;
};

