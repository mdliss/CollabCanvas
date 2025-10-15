import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { getUserProfile } from '../../services/userProfile';

/**
 * PresenceList - Shows all online users with avatars
 * Click on a user to see their profile popup
 */
export default function PresenceList({ users }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef(null);

  if (!users || users.length === 0) return null;

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
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedUserId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedUserId]);

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

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        background: "rgba(255, 255, 255, 0.95)",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: "14px",
        zIndex: 9998
      }}
    >
      <div style={{ marginBottom: "8px", fontWeight: "600", color: "#333" }}>
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
                  background: isSelected ? "#f3f4f6" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#f9fafb";
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
                <span style={{ color: "#555", fontSize: "13px", flex: 1 }}>
                  {user.displayName}
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
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
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
                        color: "#9ca3af",
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
                          borderBottom: "1px solid rgba(0, 0, 0, 0.06)"
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
                            color: "#1a1a1a",
                            margin: "0 0 4px 0",
                            textAlign: "center"
                          }}
                        >
                          {user.displayName}
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
                          borderBottom: "1px solid rgba(0, 0, 0, 0.06)"
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px"
                          }}
                        >
                          Bio
                        </label>
                        <p
                          style={{
                            fontSize: "14px",
                            color: userProfile?.bio ? "#1f2937" : "#9ca3af",
                            fontStyle: userProfile?.bio ? "normal" : "italic",
                            lineHeight: "1.5",
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word"
                          }}
                        >
                          {userProfile?.bio || "No bio yet"}
                        </p>
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
                              color: "#6b7280",
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

