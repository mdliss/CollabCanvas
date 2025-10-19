/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Chat Panel - Per-Canvas Real-Time Chat
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides chat functionality for users with access to the canvas.
 * Slides in from the right side, similar to LayersPanel.
 * Each canvas has its own independent chat history.
 * 
 * FEATURES:
 * - Real-time messaging via Firebase RTDB
 * - Only visible to users with view/edit access
 * - Auto-scrolls to latest messages
 * - Shows user avatars and names
 * - Timestamp display
 * - Theme-aware styling
 * - Smooth slide-in/out animations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue, query, limitToLast, orderByKey, set } from 'firebase/database';
import { rtdb } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile, getUserRank } from '../../services/userProfile';
import { areFriends, removeFriend } from '../../services/friends';
import Avatar from '../Collaboration/Avatar';
import PremiumBadge from '../UI/PremiumBadge';

export default function ChatPanel({ canvasId, isOpen, onClose, hasSharedAccess, onShowShare }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [popupPosition, setPopupPosition] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [userPhotos, setUserPhotos] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const profilePopupRef = useRef(null);

  // Load chat messages from RTDB
  useEffect(() => {
    if (!canvasId) return;

    const messagesRef = ref(rtdb, `chats/${canvasId}/messages`);
    const messagesQuery = query(messagesRef, orderByKey(), limitToLast(100));

    const unsubscribe = onValue(messagesQuery, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        }));
        setMessages(messagesList);
        
        // Mark messages as read when chat is open and visible
        if (isOpen && user?.uid && messagesList.length > 0) {
          const latestMessage = messagesList[messagesList.length - 1];
          // Mark last read timestamp to latest message time
          const readStatusRef = ref(rtdb, `chats/${canvasId}/readStatus/${user.uid}`);
          set(readStatusRef, {
            lastReadTimestamp: latestMessage.timestamp,
            lastMessageId: latestMessage.id
          }).catch(err => console.error('[ChatPanel] Failed to update read status:', err));
        }
        
        // Fetch photos for users who don't have them in the message
        const usersNeedingPhotos = messagesList
          .filter(msg => !msg.userPhoto && msg.userId)
          .map(msg => msg.userId);
        
        const uniqueUserIds = [...new Set(usersNeedingPhotos)];
        
        for (const userId of uniqueUserIds) {
          if (!userPhotos[userId]) {
            getUserProfile(userId).then(profile => {
              if (profile?.photoURL) {
                setUserPhotos(prev => ({
                  ...prev,
                  [userId]: profile.photoURL
                }));
              }
            }).catch(() => {
              // Silently fail
            });
          }
        }
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [canvasId, userPhotos, isOpen, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Escape key handler - Close panel even when typing
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  // Close profile popup when clicking outside
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
        e.stopPropagation(); // Prevent closing chat panel
        closePopup();
      }
    };
    
    if (selectedUserId) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedUserId, closePopup]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const messagesRef = ref(rtdb, `chats/${canvasId}/messages`);
      
      await push(messagesRef, {
        text: newMessage.trim(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL || null,
        userColor: user.color || '#4285f4',
        timestamp: Date.now()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('[ChatPanel] Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '380px',
      height: '100vh',
      background: theme.isDark ? 'rgba(26, 29, 36, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      boxShadow: theme.shadow.xl,
      borderLeft: `1px solid ${theme.border.normal}`,
      display: 'flex',
      flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 9997,
      backdropFilter: 'blur(10px)'
    },

    header: {
      padding: '20px',
      borderBottom: `1px solid ${theme.border.normal}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    },

    title: {
      fontSize: '16px',
      fontWeight: '600',
      color: theme.text.primary,
      margin: 0
    },

    closeButton: {
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      color: theme.text.tertiary,
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    },

    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },

    message: (isOwn) => ({
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      marginBottom: '4px'
    }),

    messageContent: (isOwn) => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: isOwn ? 'flex-end' : 'flex-start'
    }),

    messageHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px'
    },

    messageName: {
      fontWeight: '600',
      color: theme.text.primary
    },

    messageTime: {
      color: theme.text.tertiary,
      fontSize: '11px'
    },

    messageBubble: (isOwn) => ({
      background: isOwn ? theme.button.primary : theme.background.elevated,
      color: isOwn ? theme.text.inverse : theme.text.primary,
      padding: '10px 14px',
      borderRadius: '12px',
      maxWidth: '85%',
      wordWrap: 'break-word',
      fontSize: '14px',
      lineHeight: '1.4'
    }),

    inputContainer: {
      padding: '16px',
      borderTop: `1px solid ${theme.border.normal}`,
      flexShrink: 0
    },

    form: {
      display: 'flex',
      gap: '8px'
    },

    input: {
      flex: 1,
      padding: '10px 14px',
      border: `1px solid ${theme.border.medium}`,
      borderRadius: '8px',
      fontSize: '14px',
      background: theme.background.card,
      color: theme.text.primary,
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },

    sendButton: {
      padding: '10px 20px',
      background: theme.button.primary,
      color: theme.text.inverse,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      opacity: (!newMessage.trim() || sending) ? 0.5 : 1,
      pointerEvents: (!newMessage.trim() || sending) ? 'none' : 'auto'
    },

    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      color: theme.text.secondary
    },

    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: 0.5
    },

    emptyTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: '8px'
    },

    emptyText: {
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '16px'
    },

    shareButton: {
      padding: '8px 16px',
      background: theme.button.primary,
      color: theme.text.inverse,
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },

    noAccessContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }
  };

  // Show "no access" message if canvas is not shared
  if (!hasSharedAccess) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Chat</h3>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => {
              e.target.style.background = theme.background.elevated;
              e.target.style.color = theme.text.primary;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = theme.text.tertiary;
            }}
          >
            ×
          </button>
        </div>
        <div style={styles.noAccessContainer}>
          <div style={styles.emptyIcon}>💬</div>
          <h4 style={styles.emptyTitle}>No Chat Yet</h4>
          <p style={styles.emptyText}>
            Share this canvas to start chatting with collaborators
          </p>
          <button
            onClick={() => {
              onClose();
              onShowShare?.();
            }}
            style={styles.shareButton}
            onMouseEnter={(e) => e.target.style.background = theme.button.primaryHover}
            onMouseLeave={(e) => e.target.style.background = theme.button.primary}
          >
            Share Canvas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Chat</h3>
        <button
          onClick={onClose}
          style={styles.closeButton}
          onMouseEnter={(e) => {
            e.target.style.background = theme.background.elevated;
            e.target.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = theme.text.tertiary;
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h4 style={styles.emptyTitle}>No messages yet</h4>
            <p style={styles.emptyText}>
              Start a conversation with your collaborators
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.userId === user?.uid;
            
            return (
              <div key={message.id} style={styles.message(isOwn)}>
                {/* Always show avatar for all messages */}
                <div 
                  onClick={async (e) => {
                    e.stopPropagation();
                    
                    const clickedUserId = message.userId;
                    
                    // If clicking same user, close popup with fade
                    if (selectedUserId === clickedUserId) {
                      closePopup();
                      return;
                    }
                    
                    // If another profile is open, close it first with fade animation
                    if (selectedUserId && selectedUserId !== clickedUserId) {
                      setIsPopupVisible(false);
                      // Wait for fade-out before opening new profile
                      await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    
                    // Calculate popup position near the clicked avatar with boundary detection
                    const rect = e.currentTarget.getBoundingClientRect();
                    const popupWidth = 320;
                    const popupMaxHeight = window.innerHeight * 0.9; // 90vh
                    const padding = 20; // Keep 20px from edges
                    
                    // Try to position to the left of the avatar
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
                    setIsPopupVisible(false); // Start hidden for fade-in
                    
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
                      console.error('[ChatPanel] Failed to load profile:', error);
                    } finally {
                      setIsLoadingProfile(false);
                    }
                  }}
                  style={{ 
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="View profile"
                >
                  <Avatar
                    src={message.userPhoto || userPhotos[message.userId] || null}
                    name={message.userName || 'User'}
                    color={message.userColor || '#4285f4'}
                    size="sm"
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div style={styles.messageContent(isOwn)}>
                  <div style={styles.messageHeader}>
                    <span style={styles.messageName}>
                      {isOwn ? 'You' : message.userName}
                    </span>
                    <span style={styles.messageTime}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div style={styles.messageBubble(isOwn)}>
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <form onSubmit={handleSendMessage} style={styles.form}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={styles.input}
            maxLength={500}
            onFocus={(e) => e.target.style.borderColor = theme.button.primary}
            onBlur={(e) => e.target.style.borderColor = theme.border.medium}
          />
          <button
            type="submit"
            style={styles.sendButton}
            onMouseEnter={(e) => {
              if (newMessage.trim() && !sending) {
                e.target.style.background = theme.button.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = theme.button.primary;
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
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
            // Find message for this user to get their display info
            const userMessage = messages.find(m => m.userId === selectedUserId);
            if (!userMessage) return null;
            
            return (
              <>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <Avatar
                    src={userMessage.userPhoto || userPhotos[selectedUserId]}
                    name={userMessage.userName || 'User'}
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
                    {userMessage.userName || 'User'}
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

