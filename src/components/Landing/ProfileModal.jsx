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
    setIsEditingSocial(true);
  };

  const handleSocialSave = async () => {
    try {
      const { updateUserProfile } = await import('../../services/userProfile');
      await updateUserProfile(user.uid, {
        socialLinks: {
          twitter: twitterHandle.trim(),
          github: githubUsername.trim()
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
                    {!profile?.socialLinks?.twitter && !profile?.socialLinks?.github && (
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

