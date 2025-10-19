/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Profile Modal - User Profile Editing
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Allows users to view and edit their profile information including bio.
 * Matches the design language of SettingsModal and other modals.
 * 
 * FEATURES:
 * - Bio editing with 200 char limit
 * - Display name editing
 * - Profile picture display
 * - Smooth transitions
 * - Theme-aware styling
 */

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import useUserProfile from '../../hooks/useUserProfile';
import { getUserRank } from '../../services/userProfile';
import { replaceProfilePicture } from '../../services/profilePicture';
import Avatar from '../Collaboration/Avatar';

// Social Media Icons
const XIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill={color}/>
  </svg>
);

const GitHubIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill={color}/>
  </svg>
);

const LinkedInIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill={color}/>
  </svg>
);

const InstagramIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill={color}/>
  </svg>
);

const YouTubeIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill={color}/>
  </svg>
);

const TwitchIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill={color}/>
  </svg>
);

const DiscordIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill={color}/>
  </svg>
);

export default function ProfileModal({ onClose }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile, loading: loadingProfile, saveBio } = useUserProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUsername, setLinkedinUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [youtubeHandle, setYoutubeHandle] = useState('');
  const [twitchUsername, setTwitchUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [userRank, setUserRank] = useState(null);
  const [loadingRank, setLoadingRank] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isEditingBio) {
          handleBioCancel();
        } else if (isEditingSocial) {
          handleSocialCancel();
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditingBio, isEditingSocial]);

  // Load user's leaderboard rank
  useEffect(() => {
    if (user?.uid) {
      getUserRank(user.uid).then(rank => {
        setUserRank(rank);
        setLoadingRank(false);
      }).catch(() => {
        setLoadingRank(false);
      });
    }
  }, [user?.uid]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const startEditingBio = () => {
    setBioText(profile?.bio || '');
    setIsEditingBio(true);
  };

  const handleBioSave = async () => {
    try {
      await saveBio(bioText);
      setIsEditingBio(false);
    } catch (err) {
      console.error('[ProfileModal] Failed to save bio:', err);
      alert('Failed to save bio. Please try again.');
    }
  };

  const handleBioCancel = () => {
    setIsEditingBio(false);
    setBioText('');
  };

  const startEditingSocial = () => {
    setTwitterHandle(profile?.socialLinks?.twitter || '');
    setGithubUsername(profile?.socialLinks?.github || '');
    setLinkedinUsername(profile?.socialLinks?.linkedin || '');
    setInstagramUsername(profile?.socialLinks?.instagram || '');
    setYoutubeHandle(profile?.socialLinks?.youtube || '');
    setTwitchUsername(profile?.socialLinks?.twitch || '');
    setDiscordUsername(profile?.socialLinks?.discord || '');
    setIsEditingSocial(true);
  };

  const handleSocialSave = async () => {
    try {
      const { updateUserProfile } = await import('../../services/userProfile');
      await updateUserProfile(user.uid, {
        socialLinks: {
          twitter: twitterHandle.trim(),
          github: githubUsername.trim(),
          linkedin: linkedinUsername.trim(),
          instagram: instagramUsername.trim(),
          youtube: youtubeHandle.trim(),
          twitch: twitchUsername.trim(),
          discord: discordUsername.trim()
        }
      });
      setIsEditingSocial(false);
    } catch (err) {
      console.error('[ProfileModal] Failed to save social links:', err);
      alert('Failed to save social links. Please try again.');
    }
  };

  const handleSocialCancel = () => {
    setIsEditingSocial(false);
    setTwitterHandle('');
    setGithubUsername('');
    setLinkedinUsername('');
    setInstagramUsername('');
    setYoutubeHandle('');
    setTwitchUsername('');
    setDiscordUsername('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user?.uid) return;

    setUploadingPhoto(true);
    try {
      const newPhotoURL = await replaceProfilePicture(user.uid, file, user.photoURL);
      
      // Update auth user object (this will trigger re-render)
      await user.reload();
      
      setPhotoPreview(null);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('[ProfileModal] Failed to upload photo:', error);
      alert(error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoCancelPreview = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const styles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.backdrop,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10003,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    modal: {
      background: theme.background.card,
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '500px',
      width: '95%',
      maxHeight: '95vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      position: 'relative',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'transparent',
      border: 'none',
      fontSize: '28px',
      color: theme.text.tertiary,
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s ease'
    },
    
    title: {
      margin: '0 0 4px 0',
      fontSize: '20px',
      fontWeight: '600',
      color: theme.text.primary,
      textAlign: 'center',
      letterSpacing: '-0.02em'
    },
    
    subtitle: {
      margin: '0 0 32px 0',
      fontSize: '13px',
      color: theme.text.secondary,
      textAlign: 'center',
      fontWeight: '400'
    },

    section: {
      flex: 1,
      overflowY: 'auto',
      marginBottom: '16px',
      paddingRight: '8px'
    },

    profileHeader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '24px',
      padding: '20px',
      background: theme.background.elevated,
      borderRadius: '12px',
      border: `1px solid ${theme.border.light}`
    },

    bioSection: {
      padding: '20px',
      background: theme.background.elevated,
      borderRadius: '12px',
      border: `1px solid ${theme.border.light}`,
      marginBottom: '16px'
    },

    bioLabel: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },

    bioTextarea: {
      width: '100%',
      padding: '12px',
      border: `1px solid ${theme.border.medium}`,
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.5',
      resize: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      background: theme.background.card,
      color: theme.text.primary,
      transition: 'border-color 0.2s ease'
    },

    bioDisplay: {
      padding: '12px',
      fontSize: '14px',
      color: theme.text.primary,
      lineHeight: '1.5',
      minHeight: '60px',
      cursor: 'pointer',
      borderRadius: '8px',
      border: `1px solid transparent`,
      transition: 'all 0.15s ease',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      background: theme.background.card
    },

    buttonGroup: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '12px',
      gap: '8px'
    },

    button: {
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none'
    },

    primaryButton: {
      background: theme.button.primary,
      color: theme.text.inverse,
      flex: 1
    },

    secondaryButton: {
      background: theme.background.card,
      color: theme.text.primary,
      border: `1px solid ${theme.border.medium}`,
      flex: 1
    },

    editButton: {
      background: theme.background.card,
      color: theme.text.primary,
      border: `1px solid ${theme.border.medium}`,
      padding: '8px 16px',
      width: '100%'
    },

    charCount: {
      fontSize: '12px',
      color: bioText.length >= 200 ? '#ef4444' : theme.text.tertiary
    },

    statsSection: {
      padding: '16px 20px',
      background: theme.background.elevated,
      borderRadius: '12px',
      border: `1px solid ${theme.border.light}`
    },

    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      marginBottom: '8px',
      color: theme.text.secondary
    },

    statLabel: {
      fontWeight: '500'
    },

    statValue: {
      color: theme.text.primary
    }
  };

  return (
    <div onClick={handleBackdropClick} style={styles.backdrop}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={styles.modal}
      >
        <button
          onClick={handleClose}
          style={styles.closeButton}
          onMouseEnter={(e) => e.target.style.color = theme.text.primary}
          onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
        >
          ×
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={styles.title}>Profile</h3>
          <p style={styles.subtitle}>Manage your profile information</p>
        </div>

        <div style={styles.section}>
          {/* Profile Header */}
          <div style={styles.profileHeader}>
            <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
              {photoPreview ? (
                <img 
                  src={photoPreview}
                  alt="Preview"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${theme.button.primary}`
                  }}
                />
              ) : (
                <Avatar 
                  src={profile?.photoURL || user?.photoURL}
                  name={profile?.displayName || user?.displayName || user?.email}
                  size="lg"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    fontSize: '32px',
                    borderWidth: '3px'
                  }}
                />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: theme.button.primary,
                  border: `2px solid ${theme.background.card}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  color: theme.text.inverse,
                  opacity: uploadingPhoto ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!uploadingPhoto) {
                    e.target.style.background = theme.button.primaryHover;
                    e.target.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploadingPhoto) {
                    e.target.style.background = theme.button.primary;
                    e.target.style.transform = 'scale(1)';
                  }
                }}
                title="Change profile picture"
              >
                ✎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>
            
            {photoPreview && (
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  style={{
                    padding: '6px 16px',
                    background: theme.button.primary,
                    color: theme.text.inverse,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    opacity: uploadingPhoto ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingPhoto) {
                      e.target.style.background = theme.button.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingPhoto) {
                      e.target.style.background = theme.button.primary;
                    }
                  }}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={handlePhotoCancelPreview}
                  disabled={uploadingPhoto}
                  style={{
                    padding: '6px 16px',
                    background: theme.background.card,
                    color: theme.text.primary,
                    border: `1px solid ${theme.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    opacity: uploadingPhoto ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingPhoto) {
                      e.target.style.background = theme.background.elevated;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingPhoto) {
                      e.target.style.background = theme.background.card;
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text.primary,
              margin: '0 0 4px 0',
              textAlign: 'center'
            }}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </h3>
            {user?.email && (
              <p style={{
                fontSize: '13px',
                color: theme.text.secondary,
                margin: 0,
                textAlign: 'center'
              }}>
                {user.email}
              </p>
            )}
          </div>

          {/* Bio Section */}
          <div style={styles.bioSection}>
            <label style={styles.bioLabel}>Bio</label>
            
            {isEditingBio ? (
              <div>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value.slice(0, 200))}
                  placeholder="Tell us about yourself..."
                  style={styles.bioTextarea}
                  rows={4}
                  maxLength={200}
                  autoFocus
                  onFocus={(e) => e.target.style.borderColor = theme.button.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border.medium}
                />
                <div style={styles.buttonGroup}>
                  <span style={styles.charCount}>
                    {bioText.length}/200
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleBioCancel}
                      style={{...styles.button, ...styles.secondaryButton, flex: 'none', minWidth: '80px'}}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme.background.elevated;
                        e.target.style.borderColor = theme.border.strong;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = theme.background.card;
                        e.target.style.borderColor = theme.border.medium;
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBioSave}
                      style={{...styles.button, ...styles.primaryButton, flex: 'none', minWidth: '80px'}}
                      onMouseEnter={(e) => e.target.style.background = theme.button.primaryHover}
                      onMouseLeave={(e) => e.target.style.background = theme.button.primary}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {loadingProfile ? (
                  <div style={{
                    padding: '12px',
                    fontSize: '14px',
                    color: theme.text.tertiary,
                    lineHeight: '1.5',
                    minHeight: '60px',
                    borderRadius: '8px',
                    background: theme.background.card,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Loading...
                  </div>
                ) : (
                  <div
                    onClick={startEditingBio}
                    style={styles.bioDisplay}
                    onMouseEnter={(e) => {
                      e.target.style.background = theme.background.elevated;
                      e.target.style.borderColor = theme.border.medium;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = theme.background.card;
                      e.target.style.borderColor = 'transparent';
                    }}
                  >
                    <span style={{ 
                      color: profile?.bio ? theme.text.primary : theme.text.tertiary,
                      fontStyle: profile?.bio ? 'normal' : 'italic'
                    }}>
                      {profile?.bio || 'Click to add a bio...'}
                    </span>
                  </div>
                )}
                <button
                  onClick={startEditingBio}
                  style={{...styles.button, ...styles.editButton, marginTop: '12px'}}
                  onMouseEnter={(e) => {
                    e.target.style.background = theme.background.elevated;
                    e.target.style.borderColor = theme.border.strong;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = theme.background.card;
                    e.target.style.borderColor = theme.border.medium;
                  }}
                >
                  Edit Bio
                </button>
              </div>
            )}
          </div>

          {/* Social Links Section */}
          <div style={styles.bioSection}>
            <label style={styles.bioLabel}>Social Links</label>
            
            {isEditingSocial ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    X / Twitter Username
                  </label>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="@username or username"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="username"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    LinkedIn Username
                  </label>
                  <input
                    type="text"
                    value={linkedinUsername}
                    onChange={(e) => setLinkedinUsername(e.target.value)}
                    placeholder="username"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Instagram Username
                  </label>
                  <input
                    type="text"
                    value={instagramUsername}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="@username or username"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    YouTube Handle
                  </label>
                  <input
                    type="text"
                    value={youtubeHandle}
                    onChange={(e) => setYoutubeHandle(e.target.value)}
                    placeholder="@handle or channel ID"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Twitch Username
                  </label>
                  <input
                    type="text"
                    value={twitchUsername}
                    onChange={(e) => setTwitchUsername(e.target.value)}
                    placeholder="username"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    fontSize: '11px', 
                    fontWeight: '500', 
                    color: theme.text.secondary,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="username#1234"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: theme.background.card,
                      color: theme.text.primary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={styles.buttonGroup}>
                  <button
                    onClick={handleSocialCancel}
                    style={{...styles.button, ...styles.secondaryButton}}
                    onMouseEnter={(e) => {
                      e.target.style.background = theme.background.elevated;
                      e.target.style.borderColor = theme.border.strong;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = theme.background.card;
                      e.target.style.borderColor = theme.border.medium;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSocialSave}
                    style={{...styles.button, ...styles.primaryButton}}
                    onMouseEnter={(e) => e.target.style.background = theme.button.primaryHover}
                    onMouseLeave={(e) => e.target.style.background = theme.button.primary}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {loadingProfile ? (
                  <div style={{
                    padding: '12px',
                    fontSize: '13px',
                    color: theme.text.tertiary,
                    textAlign: 'center'
                  }}>
                    Loading...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {profile?.socialLinks?.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.borderColor = theme.border.medium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.borderColor = theme.border.light;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <XIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>@{profile.socialLinks.twitter.replace('@', '')}</span>
                      </a>
                    )}
                    {profile?.socialLinks?.github && (
                      <a
                        href={`https://github.com/${profile.socialLinks.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.borderColor = theme.border.medium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.borderColor = theme.border.light;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <GitHubIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.github}</span>
                      </a>
                    )}
                    {profile?.socialLinks?.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.borderColor = theme.border.medium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.borderColor = theme.border.light;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <LinkedInIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.linkedin}</span>
                      </a>
                    )}
                    {profile?.socialLinks?.instagram && (
                      <a
                        href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.borderColor = theme.border.medium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.borderColor = theme.border.light;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <InstagramIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>@{profile.socialLinks.instagram.replace('@', '')}</span>
                      </a>
                    )}
                    {profile?.socialLinks?.youtube && (
                      <a
                        href={`https://youtube.com/${profile.socialLinks.youtube.startsWith('@') ? profile.socialLinks.youtube : '@' + profile.socialLinks.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.borderColor = theme.border.medium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.borderColor = theme.border.light;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <YouTubeIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.youtube}</span>
                      </a>
                    )}
                    {profile?.socialLinks?.twitch && (
                      <a
                        href={`https://twitch.tv/${profile.socialLinks.twitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.borderColor = theme.border.medium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.borderColor = theme.border.light;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <TwitchIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.twitch}</span>
                      </a>
                    )}
                    {profile?.socialLinks?.discord && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: '14px',
                          color: theme.text.primary,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DiscordIcon size={18} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.discord}</span>
                      </div>
                    )}
                    {!profile?.socialLinks?.twitter && !profile?.socialLinks?.github && !profile?.socialLinks?.linkedin && !profile?.socialLinks?.instagram && !profile?.socialLinks?.youtube && !profile?.socialLinks?.twitch && !profile?.socialLinks?.discord && (
                      <div style={{
                        padding: '12px',
                        fontSize: '13px',
                        color: theme.text.tertiary,
                        fontStyle: 'italic',
                        textAlign: 'center'
                      }}>
                        No social links added
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={startEditingSocial}
                  disabled={loadingProfile}
                  style={{...styles.button, ...styles.editButton, marginTop: '12px'}}
                  onMouseEnter={(e) => {
                    if (!loadingProfile) {
                      e.target.style.background = theme.background.elevated;
                      e.target.style.borderColor = theme.border.strong;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loadingProfile) {
                      e.target.style.background = theme.background.card;
                      e.target.style.borderColor = theme.border.medium;
                    }
                  }}
                >
                  Edit Social Links
                </button>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div style={styles.statsSection}>
            {profile?.createdAt && (
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Member Since</span>
                <span style={styles.statValue}>{formatDate(profile.createdAt)}</span>
              </div>
            )}
            {!loadingRank && userRank && (
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Leaderboard Rank</span>
                <span style={styles.statValue}>#{userRank}</span>
              </div>
            )}
            {profile?.changesCount !== undefined && (
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Total Changes</span>
                <span style={styles.statValue}>{profile.changesCount || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

