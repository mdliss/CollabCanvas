import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useUserProfile from '../../hooks/useUserProfile';
import Avatar from '../Collaboration/Avatar';
import { replaceProfilePicture } from '../../services/profilePicture';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { updateProfile } from 'firebase/auth';

/**
 * AuthBar - Top-center authentication status and controls
 * Unauthed: Shows Google Sign-In and Email/Password options
 * Authed: Shows user avatar, name, and dropdown menu
 */
export default function AuthBar({ onShowEmailLogin }) {
  const { user, loginWithGoogle, logout, error } = useAuth();
  const { profile, saveBio } = useUserProfile();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [bioText, setBioText] = useState('');
  const [nameText, setNameText] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Watch Firestore for photoURL changes
  const [currentPhotoURL, setCurrentPhotoURL] = useState(user?.photoURL || null);

  useEffect(() => {
    if (!user?.uid) return;

    console.log('[AuthBar] Setting up photoURL watcher for user:', user.uid);

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data();
        const newPhotoURL = profile.photoURL || null;
        
        console.log('[AuthBar] Firestore photoURL changed:', newPhotoURL);
        setCurrentPhotoURL(newPhotoURL);
      }
    }, (error) => {
      console.error('[AuthBar] Firestore snapshot error:', error);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Show error toast when auth error occurs
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsEditingBio(false);
        setIsEditingName(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isEditingBio) {
          setIsEditingBio(false);
        } else if (isEditingName) {
          setIsEditingName(false);
        } else {
          setShowDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDropdown, isEditingBio, isEditingName]);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      // Error already handled in AuthContext
      console.error('[AuthBar] Google sign-in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      setShowDropdown(false);
      await logout();
    } catch (err) {
      console.error('[AuthBar] Sign out failed:', err);
    }
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
      console.error('[AuthBar] Failed to save bio:', err);
      alert('Failed to save bio. Please try again.');
    }
  };

  const handleBioCancel = () => {
    setIsEditingBio(false);
    setBioText('');
  };

  const startEditingName = () => {
    const currentName = user?.displayName || user?.email?.split('@')[0] || '';
    setNameText(currentName);
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!nameText.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      console.log('[AuthBar] Updating display name to:', nameText);

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: nameText.trim()
      });

      // Update Firestore user profile
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: nameText.trim(),
        updatedAt: Date.now()
      });

      console.log('[AuthBar] Display name updated successfully');
      setIsEditingName(false);
    } catch (err) {
      console.error('[AuthBar] Failed to update name:', err);
      alert('Failed to update name. Please try again.');
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setNameText('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setUploadingPhoto(true);
      const oldPhotoURL = currentPhotoURL;
      const newPhotoURL = await replaceProfilePicture(user.uid, file, oldPhotoURL);
      
      console.log('[AuthBar] Profile picture updated:', newPhotoURL);
      
      // Trigger a re-render by forcing the auth state to update
      // The photoURL will be updated in Firestore and sync automatically
      setUploadingPhoto(false);
      
      // Optional: Show success message
      // You could add a toast notification here if desired
    } catch (err) {
      console.error('[AuthBar] Failed to upload profile picture:', err);
      alert(err.message || 'Failed to upload image. Please try again.');
      setUploadingPhoto(false);
    }
    
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // Get user display info
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const photoURL = currentPhotoURL;
  
  // Generate color for avatar fallback (consistent with presence system)
  const getUserColor = () => {
    if (!user?.uid) return '#4285f4';
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
      "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    ];
    const hash = user.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!user) {
    // UNAUTHED STATE
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '0 0 12px 12px',
          padding: '12px 24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderTop: 'none'
        }}
      >
        {/* Error toast */}
        {showError && error && (
          <div
            style={{
              position: 'fixed',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(220, 38, 38, 0.95)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              zIndex: 10001,
              maxWidth: '400px'
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          aria-label="Sign in with Google"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#357ae8';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#4285f4';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#fff" d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"/>
            <path fill="#fff" d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#fff" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={onShowEmailLogin}
          aria-label="Sign in with email"
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f5f5f5';
            e.target.style.borderColor = '#bbb';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = '#ddd';
          }}
        >
          Sign in with Email
        </button>
      </div>
    );
  }

  // AUTHED STATE
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '0 0 12px 12px',
        padding: '10px 20px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderTop: 'none'
      }}
    >
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="User menu"
          aria-expanded={showDropdown}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f5f5f5';
            e.target.style.borderColor = '#e0e0e0';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'transparent';
          }}
        >
          {/* Avatar */}
          <Avatar 
            src={photoURL}
            name={displayName}
            color={getUserColor()}
            size="md"
          />

          {/* Display name */}
          <span
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#333',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayName}
          </span>

          {/* Chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            style={{
              transition: 'transform 0.2s ease',
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <path
              fill="#666"
              d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z"
            />
          </svg>
        </button>

        {/* Enhanced Dropdown menu */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              width: '320px',
              maxHeight: '500px',
              overflowY: 'auto',
              zIndex: 10001
            }}
          >
            {/* Profile Section */}
            <div
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              {/* Clickable Avatar with Upload */}
              <div style={{ marginBottom: '12px', position: 'relative' }}>
                <button
                  onClick={triggerPhotoUpload}
                  disabled={uploadingPhoto}
                  title="Click to change profile picture"
                  style={{
                    position: 'relative',
                    border: 'none',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    cursor: uploadingPhoto ? 'wait' : 'pointer',
                    padding: 0,
                    background: 'transparent',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingPhoto) e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Avatar 
                    src={photoURL}
                    name={displayName}
                    color={getUserColor()}
                    size="lg"
                    style={{ 
                      width: '64px', 
                      height: '64px',
                      fontSize: '24px',
                      borderWidth: '3px'
                    }}
                  />
                  
                  {/* Hover overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s ease',
                      borderRadius: '50%'
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingPhoto) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0)';
                    }}
                  >
                    <span
                      style={{
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        textAlign: 'center',
                        pointerEvents: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!uploadingPhoto) e.currentTarget.style.opacity = '1';
                      }}
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Change'}
                    </span>
                  </div>
                </button>
                
                {/* Edit icon badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4b5563"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Name - Editable */}
              {isEditingName ? (
                <div style={{ width: '100%', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={nameText}
                    onChange={(e) => setNameText(e.target.value.slice(0, 50))}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '600',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    maxLength={50}
                    autoFocus
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '8px'
                    }}
                  >
                    <button
                      onClick={handleNameCancel}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: '#6b7280',
                        background: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNameSave}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        color: 'white',
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={startEditingName}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid transparent',
                    transition: 'all 0.15s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'transparent';
                  }}
                  title="Click to edit name"
                >
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      margin: 0,
                      textAlign: 'center'
                    }}
                  >
                    {displayName}
                  </h3>
                </div>
              )}

              {/* Email */}
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: 0,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '280px'
                }}
              >
                {user?.email}
              </p>
            </div>

            {/* Bio Section */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}
              >
                Bio
              </label>

              {isEditingBio ? (
                <div>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.slice(0, 200))}
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    rows={3}
                    maxLength={200}
                    autoFocus
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af'
                      }}
                    >
                      {bioText.length}/200
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleBioCancel}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          color: '#6b7280',
                          background: 'transparent',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBioSave}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          color: 'white',
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={startEditingBio}
                  style={{
                    padding: '10px',
                    fontSize: '14px',
                    color: profile?.bio ? '#1f2937' : '#9ca3af',
                    fontStyle: profile?.bio ? 'normal' : 'italic',
                    lineHeight: '1.5',
                    minHeight: '60px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    border: '1px solid transparent',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'transparent';
                  }}
                >
                  {profile?.bio || 'Add a bio...'}
                </div>
              )}
            </div>

            {/* Stats Section */}
            {profile?.createdAt && (
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0
                  }}
                >
                  Member since {formatDate(profile.createdAt)}
                </p>
                {profile?.stats?.shapesCreated > 0 && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: '4px 0 0 0'
                    }}
                  >
                    {profile.stats.shapesCreated} shape{profile.stats.shapesCreated !== 1 ? 's' : ''} created
                  </p>
                )}
              </div>
            )}

            {/* Actions Section */}
            <div style={{ padding: '8px' }}>
              <button
                onClick={() => setShowDropdown(false)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  color: '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                My Account
              </button>

              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  color: '#dc2626',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontWeight: '500',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}