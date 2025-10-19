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

export default function ProfileModal({ onClose }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile, saveBio } = useUserProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [userRank, setUserRank] = useState(null);
  const [loadingRank, setLoadingRank] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

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
                📷
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

