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
import { subscribeToConversation, sendDirectMessage, deleteDirectMessage, editDirectMessage, getConversationId } from '../../services/directMessages';
import { getUserProfile, getUserRank } from '../../services/userProfile';
import { uploadMessageImage } from '../../services/messageAttachments';
import { removeFriend } from '../../services/friends';
import { watchMultipleUsersPresence } from '../../services/presence';
import { createPortal } from 'react-dom';
import Avatar from '../Collaboration/Avatar';
import GifPicker from '../Messaging/GifPicker';
import ShareWithFriendModal from './ShareWithFriendModal';

export default function DirectMessagingPanel({ friend, onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [friendRank, setFriendRank] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showRemoveFriendConfirm, setShowRemoveFriendConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);
  const profilePopupRef = useRef(null);

  // Load user and friend profiles from Firestore
  useEffect(() => {
    if (!user?.uid || !friend?.id) return;

    // Load both profiles and friend's rank
    Promise.all([
      getUserProfile(user.uid),
      getUserProfile(friend.id),
      getUserRank(friend.id)
    ]).then(([userProf, friendProf, rank]) => {
      setUserProfile(userProf);
      setFriendProfile(friendProf);
      setFriendRank(rank);
    }).catch(err => {
      console.error('[DirectMessaging] Failed to load profiles:', err);
    });
  }, [user, friend]);

  // Watch friend's online status
  useEffect(() => {
    if (!friend?.id) return;

    const unsubscribe = watchMultipleUsersPresence([friend.id], (statuses) => {
      setIsOnline(statuses[friend.id] === true);
    });

    return () => unsubscribe();
  }, [friend]);

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

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (editingMessageId) {
          handleCancelEdit();
        } else if (replyingTo) {
          handleCancelReply();
        } else if (showGifPicker) {
          setShowGifPicker(false);
        } else if (showShareModal) {
          setShowShareModal(false);
        } else if (showFriendProfile) {
          setShowFriendProfile(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editingMessageId, replyingTo, showGifPicker, showShareModal, showFriendProfile]);

  // Click outside to close profile popup
  useEffect(() => {
    if (!showFriendProfile) return;

    const handleClickOutside = (e) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(e.target)) {
        setShowFriendProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFriendProfile]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please drop an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGifSelect = (gifData) => {
    // Send GIF immediately (no preview needed)
    sendMessageWithAttachment('', gifData);
  };

  const sendMessageWithAttachment = async (text, attachment) => {
    if (sending) return;

    setSending(true);
    try {
      await sendDirectMessage(user, friend.id, text || '', attachment, replyingTo);
      setNewMessage('');
      setImagePreview(null);
      setSelectedFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[DirectMessaging] Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (sending) return;
    if (!newMessage.trim() && !selectedFile) return;

    setSending(true);
    try {
      let attachment = null;

      // Upload image if selected
      if (selectedFile) {
        setUploadingImage(true);
        const conversationId = getConversationId(user.uid, friend.id);
        const imageUrl = await uploadMessageImage(conversationId, selectedFile);
        attachment = {
          type: 'image',
          url: imageUrl
        };
        setUploadingImage(false);
      }

      await sendDirectMessage(user, friend.id, newMessage.trim(), attachment, replyingTo);
      setNewMessage('');
      setImagePreview(null);
      setSelectedFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[DirectMessaging] Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  const handleDeleteMessage = async (messageId, messageSenderId) => {
    if (!confirm('Delete this message?')) return;

    try {
      await deleteDirectMessage(user.uid, friend.id, messageId, messageSenderId);
    } catch (error) {
      console.error('[DirectMessaging] Failed to delete message:', error);
      alert(error.message || 'Failed to delete message');
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text || '');
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const handleSaveEdit = async (messageId, messageSenderId) => {
    if (!editingText.trim()) {
      alert('Message cannot be empty');
      return;
    }

    try {
      await editDirectMessage(user.uid, friend.id, messageId, messageSenderId, editingText);
      setEditingMessageId(null);
      setEditingText('');
    } catch (error) {
      console.error('[DirectMessaging] Failed to edit message:', error);
      alert(error.message || 'Failed to edit message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleStartReply = (message) => {
    setReplyingTo({
      messageId: message.id,
      text: message.text || (message.attachment?.type === 'image' ? '📷 Image' : message.attachment?.type === 'gif' ? 'GIF' : ''),
      from: message.from,
      fromName: message.fromName
    });
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      messageElement.style.background = `${theme.button.primary}20`;
      setTimeout(() => {
        messageElement.style.background = 'transparent';
      }, 2000);
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm(`Remove ${friend.userName} from friends? You'll no longer be able to message each other.`)) return;

    try {
      await removeFriend(user.uid, friend.id);
      alert('Friend removed');
      onClose();
    } catch (error) {
      console.error('[DirectMessaging] Failed to remove friend:', error);
      alert('Failed to remove friend');
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
      gap: '16px',
      position: 'relative'
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
          <div 
            style={{
              ...styles.headerLeft,
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => setShowFriendProfile(!showFriendProfile)}
            title="View profile"
          >
            <div style={{ position: 'relative' }}>
              <Avatar
                src={friendProfile?.photoURL || friend.userPhoto}
                name={friend.userName}
                size="md"
                style={{ width: '40px', height: '40px', fontSize: '16px' }}
              />
              {/* Online Status Dot */}
              {isOnline && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: `2px solid ${theme.background.card}`,
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
                }} />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={styles.friendName}>{friend.userName}</div>
                {isOnline && (
                  <span style={{
                    fontSize: '11px',
                    color: '#22c55e',
                    fontWeight: '500'
                  }}>
                    • Online
                  </span>
                )}
              </div>
              <div style={styles.friendEmail}>{friend.userEmail}</div>
            </div>

            {/* Profile Popup - Portal */}
            {showFriendProfile && createPortal(
              <div
                ref={profilePopupRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  top: '80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '320px',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  background: theme.background.card,
                  borderRadius: '12px',
                  boxShadow: theme.shadow.xl,
                  border: `2px solid ${theme.button.primary}`,
                  zIndex: 999999,
                  padding: '20px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <Avatar
                    src={friendProfile?.photoURL || friend.userPhoto}
                    name={friend.userName}
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
                    {friend.userName}
                  </h4>
                  <p style={{ 
                    fontSize: '13px', 
                    color: theme.text.secondary,
                    margin: 0
                  }}>
                    {friend.userEmail}
                  </p>
                </div>

                {friendProfile?.bio && (
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
                      {friendProfile.bio}
                    </p>
                  </div>
                )}

                {/* Social Links */}
                {(friendProfile?.socialLinks?.twitter || friendProfile?.socialLinks?.github) && (
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
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Social Links
                    </div>
                    {friendProfile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${friendProfile.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '6px',
                          fontSize: '12px',
                          color: theme.button.primary,
                          textDecoration: 'none',
                          marginBottom: friendProfile.socialLinks.github ? '6px' : 0
                        }}
                      >
                        X: @{friendProfile.socialLinks.twitter.replace('@', '')}
                      </a>
                    )}
                    {friendProfile.socialLinks.github && (
                      <a
                        href={`https://github.com/${friendProfile.socialLinks.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '6px',
                          fontSize: '12px',
                          color: theme.button.primary,
                          textDecoration: 'none'
                        }}
                      >
                        GitHub: {friendProfile.socialLinks.github}
                      </a>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  {friendRank && (
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
                        #{friendRank}
                      </div>
                    </div>
                  )}
                  {friendProfile?.changesCount !== undefined && (
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
                        {friendProfile.changesCount || 0}
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
              </div>,
              document.body
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                background: theme.button.primary,
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.text.inverse,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.button.primaryHover;
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.button.primary;
                e.target.style.transform = 'translateY(0)';
              }}
              title="Share a canvas with this friend"
            >
              Share Canvas
            </button>
            <button
              onClick={handleRemoveFriend}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.border.medium}`,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.text.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#fee2e2';
                e.target.style.borderColor = '#ef4444';
                e.target.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = theme.border.medium;
                e.target.style.color = theme.text.secondary;
              }}
              title="Remove friend"
            >
              Remove Friend
            </button>
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
        </div>

        {/* Messages */}
        <div 
          style={{
            ...styles.messagesContainer,
            ...(isDragging && {
              background: `${theme.button.primary}10`,
              border: `2px dashed ${theme.button.primary}`,
              borderRadius: '12px'
            })
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '600',
              color: theme.button.primary,
              background: `${theme.button.primary}15`,
              borderRadius: '12px',
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              Drop image to send
            </div>
          )}
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyTitle}>No messages yet</div>
              <div style={styles.emptyText}>
                Start a conversation with {friend.userName}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.from === user?.uid;
              const isHovered = hoveredMessageId === message.id;
              
              return (
                <div 
                  key={message.id}
                  ref={(el) => { if (el) messageRefs.current[message.id] = el; }}
                  style={styles.message(isOwn)}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <Avatar
                    src={isOwn ? (userProfile?.photoURL || user.photoURL || null) : (friendProfile?.photoURL || friend.userPhoto || null)}
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
                        {message.edited && (
                          <span style={{ 
                            marginLeft: '4px', 
                            fontSize: '10px', 
                            color: theme.text.tertiary,
                            fontStyle: 'italic'
                          }}>
                            (edited)
                          </span>
                        )}
                      </span>
                      {isHovered && editingMessageId !== message.id && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleStartReply(message)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.text.tertiary,
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = theme.background.elevated;
                              e.target.style.color = theme.button.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = theme.text.tertiary;
                            }}
                            title="Reply to message"
                          >
                            Reply
                          </button>
                          {isOwn && (
                            <>
                              <button
                                onClick={() => handleStartEdit(message)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: theme.text.tertiary,
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  transition: 'all 0.2s ease',
                                  fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = theme.background.elevated;
                                  e.target.style.color = theme.button.primary;
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'transparent';
                                  e.target.style.color = theme.text.tertiary;
                                }}
                                title="Edit message"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id, message.from)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: theme.text.tertiary,
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  transition: 'all 0.2s ease',
                                  fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#fee2e2';
                                  e.target.style.color = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'transparent';
                                  e.target.style.color = theme.text.tertiary;
                                }}
                                title="Delete message"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {editingMessageId === message.id ? (
                      // Edit Mode
                      <div style={{
                        background: theme.background.elevated,
                        padding: '8px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border.medium}`,
                        width: '100%',
                        maxWidth: '80%',
                        minWidth: '300px'
                      }}>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(message.id, message.from);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: `1px solid ${theme.border.medium}`,
                            borderRadius: '4px',
                            fontSize: '13px',
                            background: theme.background.card,
                            color: theme.text.primary,
                            outline: 'none',
                            marginBottom: '6px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '4px 10px',
                              background: theme.background.card,
                              border: `1px solid ${theme.border.medium}`,
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: theme.text.primary,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = theme.background.elevated;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = theme.background.card;
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id, message.from)}
                            style={{
                              padding: '4px 10px',
                              background: theme.button.primary,
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: theme.text.inverse,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = theme.button.primaryHover;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = theme.button.primary;
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div style={styles.messageBubble(isOwn)}>
                        {/* Replied-to Message */}
                        {message.replyTo && (
                          <div
                            onClick={() => scrollToMessage(message.replyTo.messageId)}
                            style={{
                              padding: '8px',
                              marginBottom: '8px',
                              background: isOwn ? 'rgba(255,255,255,0.15)' : theme.background.card,
                              borderLeft: `3px solid ${theme.button.primary}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = isOwn ? 'rgba(255,255,255,0.25)' : theme.background.elevated;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = isOwn ? 'rgba(255,255,255,0.15)' : theme.background.card;
                            }}
                          >
                            <div style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: isOwn ? 'rgba(255,255,255,0.7)' : theme.text.secondary,
                              marginBottom: '4px'
                            }}>
                              Reply to {message.replyTo.fromName}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: isOwn ? 'rgba(255,255,255,0.9)' : theme.text.primary,
                              opacity: 0.8,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {message.replyTo.text}
                            </div>
                          </div>
                        )}

                        {message.attachment?.type === 'image' && (
                          <img
                            src={message.attachment.url}
                            alt="Shared image"
                            style={{
                              maxWidth: '300px',
                              maxHeight: '300px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'block',
                              marginBottom: message.text ? '8px' : 0
                            }}
                            onClick={() => window.open(message.attachment.url, '_blank')}
                          />
                        )}
                        {message.attachment?.type === 'gif' && (
                          <img
                            src={message.attachment.url}
                            alt="GIF"
                            style={{
                              maxWidth: '250px',
                              maxHeight: '250px',
                              borderRadius: '8px',
                              display: 'block',
                              marginBottom: message.text ? '8px' : 0
                            }}
                          />
                        )}
                        {message.text && <div>{message.text}</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputContainer}>
          {/* Reply Preview */}
          {replyingTo && (
            <div style={{
              marginBottom: '12px',
              padding: '10px 12px',
              background: theme.background.elevated,
              borderRadius: '8px',
              border: `1px solid ${theme.border.light}`,
              borderLeft: `3px solid ${theme.button.primary}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: theme.text.secondary,
                  marginBottom: '4px'
                }}>
                  Replying to {replyingTo.fromName}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {replyingTo.text}
                </div>
              </div>
              <button
                onClick={handleCancelReply}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.text.tertiary,
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = theme.text.primary}
                onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
                title="Cancel reply"
              >
                ×
              </button>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div style={{
              marginBottom: '12px',
              padding: '12px',
              background: theme.background.elevated,
              borderRadius: '8px',
              border: `1px solid ${theme.border.light}`,
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: `1px solid ${theme.border.medium}`
                }}
              />
              <div style={{ flex: 1, fontSize: '13px', color: theme.text.secondary }}>
                Image ready to send
              </div>
              <button
                onClick={handleRemoveImage}
                style={{
                  background: theme.background.card,
                  border: `1px solid ${theme.border.medium}`,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: theme.text.primary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.background.elevated;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.background.card;
                }}
              >
                Remove
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} style={styles.form}>
            {/* Attachment Buttons - Toolbar Style */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  background: theme.background.card,
                  border: `1px solid ${theme.border.medium}`,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.text.primary,
                  transition: 'all 0.2s ease',
                  fontSize: '12px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!uploadingImage) {
                    e.target.style.background = theme.background.elevated;
                    e.target.style.borderColor = theme.border.strong;
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.background.card;
                  e.target.style.borderColor = theme.border.medium;
                }}
                title="Attach image"
              >
                Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                style={{
                  background: showGifPicker ? theme.button.primary : theme.background.card,
                  border: `1px solid ${showGifPicker ? theme.button.primary : theme.border.medium}`,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: showGifPicker ? theme.text.inverse : theme.text.primary,
                  transition: 'all 0.2s ease',
                  fontSize: '12px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!showGifPicker) {
                    e.target.style.background = theme.background.elevated;
                    e.target.style.borderColor = theme.border.strong;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showGifPicker) {
                    e.target.style.background = theme.background.card;
                    e.target.style.borderColor = theme.border.medium;
                  }
                }}
                title="Send GIF"
              >
                GIF
              </button>
            </div>

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
              disabled={sending || uploadingImage}
              style={{
                ...styles.sendButton,
                opacity: sending || uploadingImage ? 0.5 : styles.sendButton.opacity
              }}
              onMouseEnter={(e) => {
                if (!sending && !uploadingImage && (newMessage.trim() || selectedFile)) {
                  e.target.style.background = theme.button.primaryHover;
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.button.primary;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {uploadingImage ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
            </button>
          </form>

          {/* GIF Picker */}
          {showGifPicker && (
            <GifPicker
              onSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          )}
        </div>
      </div>

      {/* Share With Friend Modal */}
      {showShareModal && (
        <ShareWithFriendModal
          friend={friend}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

