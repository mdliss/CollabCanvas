import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { getUserProfile, updateUserBio } from '../../services/userProfile';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import PremiumBadge from '../UI/PremiumBadge';

/**
 * PresenceList - Shows all online users with avatars
 * Click on a user to see their profile popup
 * Shows crown next to canvas owner
 * Allows bio editing when viewing own profile
 */
export default function PresenceList({ users, canvasOwnerId = null, isVisible = true, isChatPanelVisible = false }) {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const popupRef = useRef(null);

  // Fetch profile when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setUserProfile(null);
      return;
    }

    setIsLoading(true);
    getUserProfile(selectedUserId)
      .then(profile => {
        setUserProfile(profile);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('[PresenceList] Failed to load profile:', err);
        setIsLoading(false);
      });
  }, [selectedUserId]);

  // Click-outside and Escape key handlers
  useEffect(() => {
    if (!selectedUserId) return;

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSelectedUserId(null);
        setIsEditingBio(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isEditingBio) {
          setIsEditingBio(false);
        } else {
          setSelectedUserId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedUserId, isEditingBio]);

  // MOVED: Early return AFTER hooks
  if (!users || users.length === 0) return null;

  const handleUserClick = (userId) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null); // Close if same user
    } else {
      setSelectedUserId(userId); // Open new user
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const startEditingBio = () => {
    setBioText(userProfile?.bio || '');
    setIsEditingBio(true);
  };

  const handleBioSave = async () => {
    if (!currentUser?.uid) return;
    
    try {
      await updateUserBio(currentUser.uid, bioText);
      setUserProfile(prev => ({ ...prev, bio: bioText }));
      setIsEditingBio(false);
    } catch (err) {
      console.error('[PresenceList] Failed to save bio:', err);
      alert('Failed to save bio. Please try again.');
    }
  };

  const handleBioCancel = () => {
    setIsEditingBio(false);
    setBioText('');
  };

  const isOwnProfile = selectedUserId === currentUser?.uid;

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: isChatPanelVisible ? 408 : 8,
        background: theme.isDark ? 'rgba(26, 29, 36, 0.98)' : "rgba(255, 255, 255, 0.95)",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: theme.shadow.md,
        fontSize: "14px",
        zIndex: 9998,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
        border: `1px solid ${theme.border.normal}`,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ marginBottom: "8px", fontWeight: "600", color: theme.text.primary }}>
        {users.length} online
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {users.map((user) => {
          const isSelected = selectedUserId === user.uid;
          
          return (
            <div key={user.uid} style={{ position: "relative" }}>
              {/* Clickable user item */}
              <button
                onClick={() => handleUserClick(user.uid)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  background: isSelected ? theme.background.elevated : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = theme.background.elevated;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <Avatar 
                  src={user.photoURL}
                  name={user.displayName}
                  color={user.color}
                  size="sm"
                />
                <span style={{ color: theme.text.secondary, fontSize: "13px", flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                  {user.displayName}
                  {userProfile?.isPremium && <PremiumBadge size={14} />}
                  {canvasOwnerId && user.uid === canvasOwnerId && (
                    <span style={{ fontSize: "15px", color: theme.text.primary, fontWeight: "600" }} title="Canvas Owner">♔</span>
                  )}
                </span>
                <div 
                  style={{ 
                    width: "6px", 
                    height: "6px", 
                    borderRadius: "50%", 
                    background: "#10b981",
                    flexShrink: 0
                  }}
                />
              </button>

              {/* Profile popup */}
              {isSelected && (
                <div
                  ref={popupRef}
                  style={{
                    position: "absolute",
                    right: "calc(100% + 12px)",
                    top: 0,
                    width: "320px",
                    background: theme.background.card,
                    borderRadius: "12px",
                    boxShadow: theme.shadow.xl,
                    border: `1px solid ${theme.border.normal}`,
                    zIndex: 10000,
                    maxHeight: "500px",
                    overflowY: "auto"
                  }}
                >
                  {isLoading ? (
                    <div
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        color: theme.text.tertiary,
                        fontSize: "14px"
                      }}
                    >
                      Loading...
                    </div>
                  ) : (
                    <>
                      {/* Profile Section */}
                      <div
                        style={{
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          borderBottom: `1px solid ${theme.border.normal}`
                        }}
                      >
                        {/* Large Avatar */}
                        <div style={{ marginBottom: "12px" }}>
                          <Avatar 
                            src={user.photoURL}
                            name={user.displayName}
                            color={user.color}
                            size="lg"
                            style={{ 
                              width: "64px", 
                              height: "64px",
                              fontSize: "24px",
                              borderWidth: "3px"
                            }}
                          />
                        </div>

                        {/* Name */}
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: theme.text.primary,
                            margin: "0 0 4px 0",
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          {user.displayName}
                          {userProfile?.isPremium && <PremiumBadge size={16} />}
                        </h3>

                        {/* Email */}
                        {userProfile?.email && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              margin: 0,
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "280px"
                            }}
                          >
                            {userProfile.email}
                          </p>
                        )}
                      </div>

                      {/* Bio Section */}
                      <div
                        style={{
                          padding: "16px 20px",
                          borderBottom: `1px solid ${theme.border.normal}`
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: theme.text.primary,
                            marginBottom: "8px"
                          }}
                        >
                          Bio
                        </label>

                        {isOwnProfile && isEditingBio ? (
                          <div>
                            <textarea
                              value={bioText}
                              onChange={(e) => setBioText(e.target.value.slice(0, 200))}
                              placeholder="Tell us about yourself..."
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: `1px solid ${theme.border.medium}`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                resize: 'none',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                background: theme.background.card,
                                color: theme.text.primary
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
                                  fontSize: '12px',
                                  color: bioText.length >= 200 ? '#ef4444' : theme.text.tertiary
                                }}
                              >
                                {bioText.length}/200
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={handleBioCancel}
                                  style={{
                                    padding: '6px 14px',
                                    background: theme.background.card,
                                    border: `1px solid ${theme.border.medium}`,
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: theme.text.primary,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleBioSave}
                                  style={{
                                    padding: '6px 14px',
                                    background: theme.button.primary,
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: theme.text.inverse,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              onClick={isOwnProfile ? startEditingBio : undefined}
                              style={{
                                fontSize: "14px",
                                color: userProfile?.bio ? theme.text.primary : theme.text.tertiary,
                                fontStyle: userProfile?.bio ? "normal" : "italic",
                                lineHeight: "1.5",
                                margin: 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                cursor: isOwnProfile ? 'pointer' : 'default',
                                padding: isOwnProfile ? '8px' : '0',
                                borderRadius: isOwnProfile ? '6px' : '0',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (isOwnProfile) e.target.style.background = theme.background.elevated;
                              }}
                              onMouseLeave={(e) => {
                                if (isOwnProfile) e.target.style.background = 'transparent';
                              }}
                            >
                              {userProfile?.bio || (isOwnProfile ? "Click to add a bio..." : "No bio yet")}
                            </p>
                            {isOwnProfile && (
                              <button
                                onClick={startEditingBio}
                                style={{
                                  marginTop: '8px',
                                  padding: '6px 14px',
                                  background: theme.background.card,
                                  border: `1px solid ${theme.border.medium}`,
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  color: theme.text.primary,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  width: '100%'
                                }}
                              >
                                Edit Bio
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Status & Info Section */}
                      <div style={{ padding: "16px 20px" }}>
                        {/* Online status */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: userProfile?.createdAt ? "8px" : 0
                          }}
                        >
                          <div 
                            style={{ 
                              width: "8px", 
                              height: "8px", 
                              borderRadius: "50%", 
                              background: "#10b981",
                              flexShrink: 0
                            }}
                          />
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "500",
                              color: "#10b981"
                            }}
                          >
                            Online now
                          </span>
                        </div>

                        {/* Member since */}
                        {userProfile?.createdAt && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: theme.text.secondary,
                              margin: 0
                            }}
                          >
                            Member since {formatDate(userProfile.createdAt)}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}