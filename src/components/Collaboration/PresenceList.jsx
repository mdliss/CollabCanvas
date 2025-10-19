import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Avatar from './Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, getUserRank } from '../../services/userProfile';

/**
 * PresenceList - Shows all online users with avatars
 * Click on a user to see their profile popup
 * Shows crown next to canvas owner
 * Allows bio editing when viewing own profile
 */
export default function PresenceList({ users, canvasOwnerId = null, isVisible = true, isChatPanelVisible = false }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [popupPosition, setPopupPosition] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const profilePopupRef = useRef(null);

  // Helper function to close popup with fade animation
  const closePopup = useCallback(() => {
    setIsPopupVisible(false);
    // Wait for fade-out animation to complete before removing
    setTimeout(() => {
      setSelectedUserId(null);
      setPopupPosition(null);
      setSelectedUserProfile(null);
    }, 200); // 200ms fade-out duration
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(e.target)) {
        closePopup();
      }
    };
    
    if (selectedUserId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedUserId, closePopup]);

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedUserId) {
        e.preventDefault();
        closePopup();
      }
    };
    
    if (selectedUserId) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedUserId, closePopup]);

  // Early return AFTER all hooks
  if (!users || users.length === 0) {
    return null;
  }

  const handleUserClick = async (clickedUserId, event) => {
    event.stopPropagation();
    
    // If clicking same user, close popup with fade
    if (selectedUserId === clickedUserId) {
      closePopup();
      return;
    }
    
    // Calculate popup position near the clicked element with boundary detection
    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 320;
    const popupMaxHeight = window.innerHeight * 0.9; // 90vh
    const padding = 20; // Keep 20px from edges
    
    // Try to position to the left of the presence list
    let left = rect.left - popupWidth - 10;
    let top = rect.top;
    
    // If popup would go off left edge, position to the right instead
    if (left < padding) {
      left = rect.right + 10;
    }
    
    // If popup would go off right edge, clamp it
    if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding;
    }
    
    // Clamp top position to keep popup on screen
    if (top < padding) {
      top = padding;
    } else if (top + popupMaxHeight > window.innerHeight - padding) {
      top = window.innerHeight - popupMaxHeight - padding;
    }
    
    setPopupPosition({
      left: left,
      top: top
    });
    
    setSelectedUserId(clickedUserId);
    setIsLoadingProfile(true);
    
    // Trigger fade-in animation after a brief delay
    setTimeout(() => setIsPopupVisible(true), 10);
    
    // Load user profile and rank
    try {
      const [profile, rank] = await Promise.all([
        getUserProfile(clickedUserId),
        getUserRank(clickedUserId)
      ]);
      setSelectedUserProfile({ ...profile, rank });
    } catch (error) {
      console.error('[PresenceList] Failed to load profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

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
          return (
            <div key={user.uid} style={{ position: "relative" }}>
              {/* Clickable user item */}
              <button
                onClick={(e) => handleUserClick(user.uid, e)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.background.elevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                title="View profile"
              >
                <Avatar 
                  src={user.photoURL}
                  name={user.displayName}
                  color={user.color}
                  size="sm"
                />
                <span style={{ color: theme.text.secondary, fontSize: "13px", flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
                  {user.displayName}
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
            </div>
          );
        })}
      </div>

      {/* Simple Profile Popup - Same as Leaderboard */}
      {selectedUserId && popupPosition && createPortal(
        <div
          ref={profilePopupRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${popupPosition.left}px`,
            top: `${popupPosition.top}px`,
            width: '320px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: theme.background.card,
            borderRadius: '12px',
            boxShadow: theme.shadow.xl,
            border: `2px solid ${theme.button.primary}`,
            zIndex: 999999,
            padding: '20px',
            opacity: isPopupVisible ? 1 : 0,
            transform: isPopupVisible ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 0.2s ease, transform 0.2s ease'
          }}
        >
          {isLoadingProfile ? (
            <div style={{ textAlign: 'center', padding: '20px', color: theme.text.tertiary }}>
              Loading...
            </div>
          ) : (() => {
            const selectedUser = users.find(u => u.uid === selectedUserId);
            if (!selectedUser) return null;
            
            return (
              <>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <Avatar
                    src={selectedUser.photoURL}
                    name={selectedUser.displayName}
                    size="lg"
                    style={{ 
                      width: '72px', 
                      height: '72px',
                      fontSize: '28px',
                      marginBottom: '12px'
                    }}
                  />
                  <h4 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: theme.text.primary,
                    margin: '0 0 4px 0'
                  }}>
                    {selectedUser.displayName || 'User'}
                  </h4>
                  {selectedUserProfile?.email && (
                    <p style={{ 
                      fontSize: '13px', 
                      color: theme.text.secondary,
                      margin: 0
                    }}>
                      {selectedUserProfile.email}
                    </p>
                  )}
                </div>
                
                {selectedUserProfile?.bio && (
                  <div style={{
                    padding: '12px',
                    background: theme.background.elevated,
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.text.secondary,
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Bio
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: theme.text.primary,
                      margin: 0,
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {selectedUserProfile.bio}
                    </p>
                  </div>
                )}

                {/* Stats - Rank and Changes */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    flex: 1,
                    padding: '12px',
                    background: theme.background.elevated,
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: theme.text.secondary,
                      marginBottom: '4px'
                    }}>
                      Rank
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: theme.button.primary
                    }}>
                      #{selectedUserProfile?.rank || '-'}
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    padding: '12px',
                    background: theme.background.elevated,
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: theme.text.secondary,
                      marginBottom: '4px'
                    }}>
                      Changes
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: theme.button.primary
                    }}>
                      {selectedUserProfile?.changesCount || 0}
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: theme.text.tertiary,
                  textAlign: 'center'
                }}>
                  Click outside to close
                </div>
              </>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}