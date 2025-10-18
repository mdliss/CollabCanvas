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

import { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, query, limitToLast, orderByKey } from 'firebase/database';
import { rtdb } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile, getUserRank } from '../../services/userProfile';
import Avatar from '../Collaboration/Avatar';

export default function ChatPanel({ canvasId, isOpen, onClose, hasSharedAccess, onShowShare }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserRank, setSelectedUserRank] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const profilePopupRef = useRef(null);

  // Load chat messages from RTDB
  useEffect(() => {
    if (!canvasId) return;

    const messagesRef = ref(rtdb, `chats/${canvasId}/messages`);
    const messagesQuery = query(messagesRef, orderByKey(), limitToLast(100));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        }));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [canvasId]);

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

  // Load user profile when avatar is clicked
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserProfile(null);
      setSelectedUserRank(null);
      return;
    }

    setIsLoadingProfile(true);
    Promise.all([
      getUserProfile(selectedUserId),
      getUserRank(selectedUserId)
    ])
      .then(([profile, rank]) => {
        setSelectedUserProfile(profile);
        setSelectedUserRank(rank);
        setIsLoadingProfile(false);
      })
      .catch(err => {
        console.error('[ChatPanel] Failed to load profile:', err);
        setIsLoadingProfile(false);
      });
  }, [selectedUserId]);

  // Click outside to close profile popup
  useEffect(() => {
    if (!selectedUserId) return;

    const handleClickOutside = (e) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(e.target)) {
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
                  onClick={() => setSelectedUserId(message.userId)}
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
                    src={message.userPhoto}
                    name={message.userName}
                    size="sm"
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '12px'
                    }}
                  />
                  
                  {/* Profile Popup */}
                  {selectedUserId === message.userId && (
                    <div
                      ref={profilePopupRef}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: isOwn ? 'auto' : '50px',
                        right: isOwn ? '50px' : 'auto',
                        top: 0,
                        width: '280px',
                        background: theme.background.card,
                        borderRadius: '12px',
                        boxShadow: theme.shadow.xl,
                        border: `1px solid ${theme.border.normal}`,
                        zIndex: 10001,
                        padding: '16px'
                      }}
                    >
                      {isLoadingProfile ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme.text.tertiary }}>
                          Loading...
                        </div>
                      ) : (
                        <>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <Avatar
                              src={message.userPhoto}
                              name={message.userName}
                              size="lg"
                              style={{ 
                                width: '64px', 
                                height: '64px',
                                fontSize: '24px',
                                marginBottom: '8px'
                              }}
                            />
                            <h4 style={{ 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              color: theme.text.primary,
                              margin: '0 0 4px 0'
                            }}>
                              {message.userName}
                            </h4>
                            {selectedUserProfile?.email && (
                              <p style={{ 
                                fontSize: '12px', 
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

                          {/* Stats */}
                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            {selectedUserRank && (
                              <div style={{
                                flex: 1,
                                padding: '10px',
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
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  color: theme.button.primary
                                }}>
                                  #{selectedUserRank}
                                </div>
                              </div>
                            )}
                            {selectedUserProfile?.changesCount !== undefined && (
                              <div style={{
                                flex: 1,
                                padding: '10px',
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
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  color: theme.button.primary
                                }}>
                                  {selectedUserProfile.changesCount || 0}
                                </div>
                              </div>
                            )}
                          </div>

                          <div style={{
                            fontSize: '12px',
                            color: theme.text.tertiary,
                            textAlign: 'center'
                          }}>
                            Click outside to close
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
    </div>
  );
}

