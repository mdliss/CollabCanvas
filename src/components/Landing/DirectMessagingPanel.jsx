/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Direct Messaging Panel - One-on-One Messaging
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Full-screen panel for direct messages between friends.
 * Similar to Canvas ChatPanel but for private conversations.
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { subscribeToConversation, sendDirectMessage } from '../../services/directMessages';
import Avatar from '../Collaboration/Avatar';

export default function DirectMessagingPanel({ friend, onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to conversation
  useEffect(() => {
    if (!user?.uid || !friend?.id) return;

    const unsubscribe = subscribeToConversation(user.uid, friend.id, setMessages);
    return () => unsubscribe();
  }, [user, friend]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      await sendDirectMessage(user, friend.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('[DirectMessaging] Failed to send message:', error);
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
      animation: 'fadeIn 0.2s ease'
    },

    panel: {
      background: theme.background.card,
      borderRadius: '16px',
      width: '90%',
      maxWidth: '700px',
      height: '85vh',
      maxHeight: '800px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      overflow: 'hidden'
    },

    header: {
      padding: '20px 24px',
      borderBottom: `1px solid ${theme.border.normal}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      background: theme.background.elevated
    },

    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },

    friendName: {
      fontSize: '16px',
      fontWeight: '600',
      color: theme.text.primary,
      margin: 0
    },

    friendEmail: {
      fontSize: '12px',
      color: theme.text.secondary
    },

    closeButton: {
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
      transition: 'all 0.2s ease'
    },

    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },

    message: (isOwn) => ({
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      flexDirection: isOwn ? 'row-reverse' : 'row'
    }),

    messageContent: (isOwn) => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
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
      padding: '12px 16px',
      borderRadius: '12px',
      maxWidth: '80%',
      wordWrap: 'break-word',
      fontSize: '14px',
      lineHeight: '1.5',
      boxShadow: theme.shadow.sm
    }),

    inputContainer: {
      padding: '20px 24px',
      borderTop: `1px solid ${theme.border.normal}`,
      flexShrink: 0,
      background: theme.background.elevated
    },

    form: {
      display: 'flex',
      gap: '12px'
    },

    input: {
      flex: 1,
      padding: '12px 16px',
      border: `1px solid ${theme.border.medium}`,
      borderRadius: '8px',
      fontSize: '14px',
      background: theme.background.card,
      color: theme.text.primary,
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },

    sendButton: {
      padding: '12px 24px',
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
      textAlign: 'center',
      color: theme.text.secondary,
      padding: '40px'
    },

    emptyIcon: {
      fontSize: '64px',
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
      lineHeight: '1.5'
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Avatar
              src={friend.userPhoto}
              name={friend.userName}
              size="md"
              style={{ width: '40px', height: '40px', fontSize: '16px' }}
            />
            <div>
              <div style={styles.friendName}>{friend.userName}</div>
              <div style={styles.friendEmail}>{friend.userEmail}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => {
              e.target.style.background = theme.background.card;
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
              <div style={styles.emptyTitle}>No messages yet</div>
              <div style={styles.emptyText}>
                Start a conversation with {friend.userName}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.from === user?.uid;
              
              return (
                <div key={message.id} style={styles.message(isOwn)}>
                  <Avatar
                    src={isOwn ? (user.photoURL || null) : (friend.userPhoto || null)}
                    name={isOwn ? (user.displayName || user.email) : friend.userName}
                    size="sm"
                    style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}
                  />
                  <div style={styles.messageContent(isOwn)}>
                    <div style={styles.messageHeader}>
                      <span style={styles.messageName}>
                        {isOwn ? 'You' : message.fromName}
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
              placeholder={`Message ${friend.userName}...`}
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
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.button.primary;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

