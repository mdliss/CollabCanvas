import { useState, useEffect } from 'react';
import { getUserProfile, updateUserBio, initializeUserProfile } from '../services/userProfile';
import { useAuth } from '../contexts/AuthContext';

/**
 * useUserProfile - Hook to manage user profile data
 * Loads profile from Firestore and provides update functions
 * Auto-initializes profile on first login
 */
export default function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize profile if first time
        await initializeUserProfile(user);
        
        // Load profile data
        const data = await getUserProfile(user.uid);
        
        if (mounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useUserProfile] Failed to load profile:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.uid, user?.displayName, user?.email, user?.photoURL]);

  /**
   * Save bio text to Firestore
   * @param {string} newBio - Bio text (max 200 chars)
   * @returns {Promise<void>}
   */
  const saveBio = async (newBio) => {
    if (!user?.uid) return;
    
    try {
      await updateUserBio(user.uid, newBio);
      setProfile(prev => ({ ...prev, bio: newBio }));
    } catch (err) {
      console.error('[useUserProfile] Failed to save bio:', err);
      throw err;
    }
  };

  return { 
    profile, 
    loading, 
    error,
    saveBio 
  };
}

