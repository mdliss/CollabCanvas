/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Messaging Button - Friend Requests and Direct Messages
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Header button that opens dropdown for:
 * - Adding friends by email
 * - Viewing/managing friend requests
 * - Accessing direct messages
 * 
 * Similar to Discord's friend system UI.
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  subscribeToPendingRequests,
  subscribeToOutgoingRequests,
  subscribeToFriends,
  sendFriendRequest,
  acceptFriendRequest,
  denyFriendRequest,
  cancelFriendRequest
} from '../../services/friends';
import { watchMultipleUsersPresence } from '../../services/presence';

export default function MessagingButton({ onOpenMessaging }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'pending', 'add'
  const dropdownRef = useRef(null);

  // Subscribe to friend requests and friends list
  useEffect(() => {
    if (!user?.uid) return;

    const unsubPending = subscribeToPendingRequests(user.uid, setPendingRequests);
    const unsubOutgoing = subscribeToOutgoingRequests(user.uid, setOutgoingRequests);
    const unsubFriends = subscribeToFriends(user.uid, setFriends);

    return () => {
      unsubPending();
      unsubOutgoing();
      unsubFriends();
    };
  }, [user]);

  // Watch online status for all friends
  useEffect(() => {
    if (!friends || friends.length === 0) {
      setOnlineStatuses({});
      return;
    }

    const friendIds = friends.map(f => f.id);
    const unsubscribe = watchMultipleUsersPresence(friendIds, setOnlineStatuses);

    return () => unsubscribe();
  }, [friends]);

  const handleOpen = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setIsOpen(true);
    setTimeout(() => setIsVisible(true), 10);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      setButtonRect(null);
    }, 200);
  };

  const handleToggle = (e) => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen(e);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!addFriendEmail.trim() || addingFriend) return;

    setAddingFriend(true);
    try {
      const result = await sendFriendRequest(user, addFriendEmail.trim());
      
      if (result.autoAccepted) {
        alert('Friend request accepted automatically! You both wanted to be friends.');
      } else {
        alert('Friend request sent!');
      }
      
      setAddFriendEmail('');
      setActiveTab('friends');
    } catch (error) {
      alert(error.message || 'Failed to send friend request');
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAccept = async (request) => {
    setProcessingId(request.id);
    try {
      await acceptFriendRequest(user.uid, request.id);
    } catch (error) {
      console.error('[MessagingButton] Failed to accept:', error);
      alert('Failed to accept friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (request) => {
    setProcessingId(request.id);
    try {
      await denyFriendRequest(user.uid, request.id);
    } catch (error) {
      console.error('[MessagingButton] Failed to deny:', error);
      alert('Failed to deny friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOutgoing = async (request) => {
    setProcessingId(request.id);
    try {
      await cancelFriendRequest(user.uid, request.id);
    } catch (error) {
      console.error('[MessagingButton] Failed to cancel:', error);
      alert('Failed to cancel friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenChat = (friend) => {
    handleClose();
    onOpenMessaging(friend);
  };

  const totalNotifications = pendingRequests.length;

  return (
    <>
      {/* Messaging Button */}
      <button
        onClick={handleToggle}
        style={{
          background: theme.background.card,
          border: `1px solid ${theme.border.medium}`,
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: theme.text.primary,
          boxShadow: theme.shadow.md,
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.background.elevated;
          e.target.style.borderColor = theme.border.strong;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = theme.background.card;
          e.target.style.borderColor = theme.border.medium;
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Messaging</span>
        {totalNotifications > 0 && (
          <span style={{
            background: theme.button.primary,
            color: theme.text.inverse,
            fontSize: '11px',
            fontWeight: '600',
            padding: '2px 7px',
            borderRadius: '10px',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {totalNotifications}
          </span>
        )}
      </button>

      {/* Portal: Backdrop */}
      {isOpen && createPortal(
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999998
          }}
        />,
        document.body
      )}

      {/* Portal: Dropdown */}
      {isOpen && buttonRect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${buttonRect.bottom + 8}px`,
            right: `${window.innerWidth - buttonRect.right}px`,
            background: theme.background.card,
            border: `1px solid ${theme.border.normal}`,
            borderRadius: '10px',
            boxShadow: theme.shadow.xl,
            width: '380px',
            maxHeight: '500px',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${theme.border.normal}`,
            padding: '8px'
          }}>
            <button
              onClick={() => setActiveTab('friends')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'friends' ? theme.background.elevated : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: activeTab === 'friends' ? theme.text.primary : theme.text.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'pending' ? theme.background.elevated : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: activeTab === 'pending' ? theme.text.primary : theme.text.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              Requests
              {pendingRequests.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '8px',
                  background: theme.button.primary,
                  color: theme.text.inverse,
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('add')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'add' ? theme.background.elevated : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: activeTab === 'add' ? theme.text.primary : theme.text.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Add Friend
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px'
          }}>
            {/* Friends List */}
            {activeTab === 'friends' && (
              friends.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: theme.text.secondary
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>👥</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>No friends yet</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>Add friends to start messaging!</div>
                </div>
              ) : (
                friends.map(friend => {
                  const isOnline = onlineStatuses[friend.id] === true;
                  
                  return (
                    <div
                      key={friend.id}
                      onClick={() => handleOpenChat(friend)}
                      style={{
                        padding: '10px',
                        marginBottom: '6px',
                        background: theme.background.elevated,
                        borderRadius: '8px',
                        border: `1px solid ${theme.border.light}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.background.card;
                        e.currentTarget.style.borderColor = theme.border.medium;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.background.elevated;
                        e.currentTarget.style.borderColor = theme.border.light;
                      }}
                    >
                      {/* Online Status Indicator */}
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isOnline ? '#22c55e' : theme.border.medium,
                        flexShrink: 0,
                        boxShadow: isOnline ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none'
                      }} />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: '500', 
                          color: theme.text.primary, 
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {friend.userName}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: isOnline ? '#22c55e' : theme.text.secondary,
                          fontWeight: isOnline ? '500' : '400'
                        }}>
                          {isOnline ? 'Online' : friend.userEmail}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* Pending Requests */}
            {activeTab === 'pending' && (
              <>
                {pendingRequests.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.text.secondary,
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Incoming Requests ({pendingRequests.length})
                    </div>
                    {pendingRequests.map(request => (
                      <div
                        key={request.id}
                        style={{
                          padding: '10px',
                          marginBottom: '8px',
                          background: theme.background.elevated,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`
                        }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontWeight: '500', color: theme.text.primary, fontSize: '13px', marginBottom: '2px' }}>
                            {request.userName}
                          </div>
                          <div style={{ fontSize: '11px', color: theme.text.secondary }}>
                            {request.userEmail}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleAccept(request)}
                            disabled={processingId === request.id}
                            style={{
                              flex: 1,
                              background: theme.button.primary,
                              color: theme.text.inverse,
                              border: 'none',
                              padding: '6px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                              opacity: processingId === request.id ? 0.5 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (processingId !== request.id) {
                                e.target.style.background = theme.button.primaryHover;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (processingId !== request.id) {
                                e.target.style.background = theme.button.primary;
                              }
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeny(request)}
                            disabled={processingId === request.id}
                            style={{
                              flex: 1,
                              background: theme.background.card,
                              color: theme.text.primary,
                              border: `1px solid ${theme.border.medium}`,
                              padding: '6px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                              opacity: processingId === request.id ? 0.5 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (processingId !== request.id) {
                                e.target.style.background = theme.background.elevated;
                                e.target.style.borderColor = theme.border.strong;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (processingId !== request.id) {
                                e.target.style.background = theme.background.card;
                                e.target.style.borderColor = theme.border.medium;
                              }
                            }}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {outgoingRequests.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.text.secondary,
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Sent Requests ({outgoingRequests.length})
                    </div>
                    {outgoingRequests.map(request => (
                      <div
                        key={request.id}
                        style={{
                          padding: '10px',
                          marginBottom: '8px',
                          background: theme.background.elevated,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', color: theme.text.primary, fontSize: '13px' }}>
                            {request.userName}
                          </div>
                          <div style={{ fontSize: '11px', color: theme.text.tertiary }}>
                            Pending...
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelOutgoing(request)}
                          disabled={processingId === request.id}
                          style={{
                            background: 'transparent',
                            color: theme.text.secondary,
                            border: `1px solid ${theme.border.medium}`,
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = theme.background.card;
                            e.target.style.color = theme.text.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = theme.text.secondary;
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {pendingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: theme.text.secondary
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📬</div>
                    <div style={{ fontSize: '14px' }}>No pending requests</div>
                  </div>
                )}
              </>
            )}

            {/* Add Friend */}
            {activeTab === 'add' && (
              <form onSubmit={handleAddFriend} style={{ padding: '8px 0' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: theme.text.secondary,
                  marginBottom: '12px'
                }}>
                  Add a friend by email address
                </div>
                <input
                  type="email"
                  value={addFriendEmail}
                  onChange={(e) => setAddFriendEmail(e.target.value)}
                  placeholder="friend@example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme.border.medium}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: theme.background.card,
                    color: theme.text.primary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.button.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border.medium}
                />
                <button
                  type="submit"
                  disabled={!addFriendEmail.trim() || addingFriend}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: theme.button.primary,
                    color: theme.text.inverse,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: (!addFriendEmail.trim() || addingFriend) ? 'not-allowed' : 'pointer',
                    opacity: (!addFriendEmail.trim() || addingFriend) ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (addFriendEmail.trim() && !addingFriend) {
                      e.target.style.background = theme.button.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = theme.button.primary;
                  }}
                >
                  {addingFriend ? 'Sending...' : 'Send Friend Request'}
                </button>
                <div style={{
                  fontSize: '11px',
                  color: theme.text.tertiary,
                  marginTop: '12px',
                  lineHeight: '1.4'
                }}>
                  They'll receive a friend request and can accept or deny it.
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

