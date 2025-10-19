import { useState } from 'react';
import Avatar from './Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileView from '../Landing/UserProfileView';

/**
 * PresenceList - Shows all online users with avatars
 * Click on a user to see their profile popup
 * Shows crown next to canvas owner
 * Allows bio editing when viewing own profile
 */
export default function PresenceList({ users, canvasOwnerId = null, isVisible = true, isChatPanelVisible = false }) {
  const { theme } = useTheme();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);


  // MOVED: Early return AFTER hooks
  if (!users || users.length === 0) {
    console.log('[PresenceList] Not rendering - no users online');
    return null;
  }

  console.log('[PresenceList] Rendering with', users.length, 'online users:', users.map(u => u.displayName).join(', '));

  const handleUserClick = (user) => {
    setSelectedUserData({
      userId: user.uid,
      userName: user.displayName,
      userEmail: null, // Not available in presence data
      userPhoto: user.photoURL
    });
    setShowUserProfile(true);
  };

  console.log('[PresenceList] Current state:', {
    usersCount: users.length,
    isVisible,
    isChatPanelVisible,
    canvasOwnerId,
    users: users.map(u => ({ uid: u.uid, name: u.displayName, isOwner: u.uid === canvasOwnerId }))
  });

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
                onClick={() => handleUserClick(user)}
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

      {/* User Profile Modal */}
      {showUserProfile && selectedUserData && (
        <UserProfileView
          userId={selectedUserData.userId}
          userName={selectedUserData.userName}
          userEmail={selectedUserData.userEmail}
          userPhoto={selectedUserData.userPhoto}
          wide={true}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUserData(null);
          }}
        />
      )}
    </div>
  );
}