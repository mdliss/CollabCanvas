/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Friends Modal - Friend Management System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Full modal for managing friends:
 * - View friends list with online status
 * - Accept/deny friend requests
 * - Send friend requests by email
 * - View outgoing requests
 * 
 * Similar to Discord's friends tab UI.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  subscribeToPendingRequests,
  subscribeToOutgoingRequests,
  subscribeToFriends,
  sendFriendRequest,
  acceptFriendRequest,
  denyFriendRequest,
  cancelFriendRequest,
  removeFriend
} from '../../services/friends';
import { watchMultipleUsersPresence } from '../../services/presence';
import Avatar from '../Collaboration/Avatar';
import UserProfileView from './UserProfileView';
import PremiumBadge from '../UI/PremiumBadge';

export default function FriendsModal({ onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'add'
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showUserProfile) {
          setShowUserProfile(false);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showUserProfile]);

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
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
      setActiveTab('all');
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
      console.error('[FriendsModal] Failed to accept:', error);
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
      console.error('[FriendsModal] Failed to deny:', error);
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
      console.error('[FriendsModal] Failed to cancel:', error);
      alert('Failed to cancel friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveFriend = async (friend) => {
    if (!confirm(`Remove ${friend.userName} from your friends?`)) return;
    
    setProcessingId(friend.id);
    try {
      await removeFriend(user.uid, friend.id);
    } catch (error) {
      console.error('[FriendsModal] Failed to remove friend:', error);
      alert('Failed to remove friend');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setShowUserProfile(true);
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
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    modal: {
      background: theme.background.card,
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '600px',
      width: '95%',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      position: 'relative',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
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
      transition: 'color 0.2s ease'
    },
    
    title: {
      margin: '0 0 4px 0',
      fontSize: '20px',
      fontWeight: '600',
      color: theme.text.primary,
      letterSpacing: '-0.02em'
    },
    
    subtitle: {
      margin: '0 0 24px 0',
      fontSize: '13px',
      color: theme.text.secondary,
      fontWeight: '400'
    },

    tabs: {
      display: 'flex',
      borderBottom: `1px solid ${theme.border.normal}`,
      marginBottom: '20px',
      gap: '4px'
    },

    tab: {
      flex: 1,
      padding: '10px 16px',
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
    },

    tabActive: {
      color: theme.text.primary,
      borderBottomColor: theme.button.primary
    },

    tabInactive: {
      color: theme.text.secondary
    },

    content: {
      flex: 1,
      overflowY: 'auto',
      paddingRight: '8px'
    }
  };

  return (
    <div onClick={handleBackdropClick} style={styles.backdrop}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={styles.modal}
      >
        <button
          onClick={handleClose}
          style={styles.closeButton}
          onMouseEnter={(e) => e.target.style.color = theme.text.primary}
          onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
        >
          ×
        </button>

        <h3 style={styles.title}>Friends</h3>
        <p style={styles.subtitle}>Manage your friends and requests</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              ...styles.tab,
              color: activeTab === 'all' ? theme.text.primary : theme.text.secondary,
              borderBottomColor: activeTab === 'all' ? theme.button.primary : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'all') {
                e.target.style.color = theme.text.primary;
                e.target.style.borderBottomColor = theme.border.medium;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'all') {
                e.target.style.color = theme.text.secondary;
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              ...styles.tab,
              color: activeTab === 'pending' ? theme.text.primary : theme.text.secondary,
              borderBottomColor: activeTab === 'pending' ? theme.button.primary : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'pending') {
                e.target.style.color = theme.text.primary;
                e.target.style.borderBottomColor = theme.border.medium;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'pending') {
                e.target.style.color = theme.text.secondary;
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span style={{
                marginLeft: '6px',
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
              ...styles.tab,
              color: activeTab === 'add' ? theme.text.primary : theme.text.secondary,
              borderBottomColor: activeTab === 'add' ? theme.button.primary : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'add') {
                e.target.style.color = theme.text.primary;
                e.target.style.borderBottomColor = theme.border.medium;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'add') {
                e.target.style.color = theme.text.secondary;
                e.target.style.borderBottomColor = 'transparent';
              }
            }}
          >
            Add Friend
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* All Friends Tab */}
          {activeTab === 'all' && (
            friends.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: theme.text.secondary
              }}>
                <div style={{ fontSize: '15px', marginBottom: '8px', fontWeight: '500' }}>No friends yet</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Add friends to collaborate!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {friends.map(friend => {
                  const isOnline = onlineStatuses[friend.id] === true;
                  
                  return (
                    <div
                      key={friend.id}
                      style={{
                        padding: '14px',
                        background: theme.background.elevated,
                        borderRadius: '10px',
                        border: `1px solid ${theme.border.light}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease'
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
                      <div 
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => handleFriendClick(friend)}
                        title="View profile"
                      >
                        <Avatar 
                          src={friend.userPhoto}
                          name={friend.userName}
                          size="md"
                        />
                        {/* Online Status Indicator */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: isOnline ? '#22c55e' : theme.border.medium,
                          border: `2px solid ${theme.background.elevated}`,
                          boxShadow: isOnline ? '0 0 8px rgba(34, 197, 94, 0.6)' : 'none'
                        }} />
                      </div>
                      
                      <div 
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                        onClick={() => handleFriendClick(friend)}
                        title="View profile"
                      >
                        <div style={{ 
                          fontWeight: '500', 
                          color: theme.text.primary, 
                          fontSize: '14px',
                          marginBottom: '2px'
                        }}>
                          {friend.userName}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: isOnline ? '#22c55e' : theme.text.secondary,
                          fontWeight: isOnline ? '500' : '400'
                        }}>
                          {isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(friend);
                        }}
                        disabled={processingId === friend.id}
                        style={{
                          background: 'transparent',
                          color: theme.text.secondary,
                          border: `1px solid ${theme.border.medium}`,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: processingId === friend.id ? 'not-allowed' : 'pointer',
                          opacity: processingId === friend.id ? 0.5 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (processingId !== friend.id) {
                            e.target.style.background = theme.background.card;
                            e.target.style.color = '#ef4444';
                            e.target.style.borderColor = '#ef4444';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (processingId !== friend.id) {
                            e.target.style.background = 'transparent';
                            e.target.style.color = theme.text.secondary;
                            e.target.style.borderColor = theme.border.medium;
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Pending Requests Tab */}
          {activeTab === 'pending' && (
            <>
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: theme.text.secondary,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Incoming Requests ({pendingRequests.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingRequests.map(request => (
                      <div
                        key={request.id}
                        style={{
                          padding: '14px',
                          background: theme.background.elevated,
                          borderRadius: '10px',
                          border: `1px solid ${theme.border.light}`
                        }}
                      >
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}
                          onClick={() => handleFriendClick({ id: request.id, userName: request.userName, userEmail: request.userEmail, userPhoto: request.userPhoto })}
                          title="View profile"
                        >
                          <Avatar 
                            src={request.userPhoto}
                            name={request.userName}
                            size="md"
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: theme.text.primary, fontSize: '14px', marginBottom: '2px' }}>
                              {request.userName}
                            </div>
                            <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                              {request.userEmail}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(request);
                            }}
                            disabled={processingId === request.id}
                            style={{
                              flex: 1,
                              background: theme.button.primary,
                              color: theme.text.inverse,
                              border: 'none',
                              padding: '8px',
                              borderRadius: '8px',
                              fontSize: '13px',
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeny(request);
                            }}
                            disabled={processingId === request.id}
                            style={{
                              flex: 1,
                              background: theme.background.card,
                              color: theme.text.primary,
                              border: `1px solid ${theme.border.medium}`,
                              padding: '8px',
                              borderRadius: '8px',
                              fontSize: '13px',
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
                </div>
              )}

              {outgoingRequests.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: theme.text.secondary,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Sent Requests ({outgoingRequests.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {outgoingRequests.map(request => (
                      <div
                        key={request.id}
                        style={{
                          padding: '14px',
                          background: theme.background.elevated,
                          borderRadius: '10px',
                          border: `1px solid ${theme.border.light}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleFriendClick({ id: request.id, userName: request.userName, userEmail: request.userEmail, userPhoto: request.userPhoto })}
                          title="View profile"
                        >
                          <Avatar 
                            src={request.userPhoto}
                            name={request.userName}
                            size="md"
                          />
                        </div>
                        <div 
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => handleFriendClick({ id: request.id, userName: request.userName, userEmail: request.userEmail, userPhoto: request.userPhoto })}
                          title="View profile"
                        >
                          <div style={{ fontWeight: '500', color: theme.text.primary, fontSize: '14px' }}>
                            {request.userName}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.text.tertiary }}>
                            Pending...
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOutgoing(request);
                          }}
                          disabled={processingId === request.id}
                          style={{
                            background: 'transparent',
                            color: theme.text.secondary,
                            border: `1px solid ${theme.border.medium}`,
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                            opacity: processingId === request.id ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (processingId !== request.id) {
                              e.target.style.background = theme.background.card;
                              e.target.style.color = theme.text.primary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (processingId !== request.id) {
                              e.target.style.background = 'transparent';
                              e.target.style.color = theme.text.secondary;
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingRequests.length === 0 && outgoingRequests.length === 0 && (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: theme.text.secondary
                }}>
                  <div style={{ fontSize: '15px', marginBottom: '8px', fontWeight: '500' }}>No pending requests</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>Friend requests will appear here</div>
                </div>
              )}
            </>
          )}

          {/* Add Friend Tab */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddFriend}>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: theme.text.secondary,
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                Add a friend by entering their email address. They'll receive a friend request that they can accept or deny.
              </div>
              <input
                type="email"
                value={addFriendEmail}
                onChange={(e) => setAddFriendEmail(e.target.value)}
                placeholder="friend@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${theme.border.medium}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: theme.background.card,
                  color: theme.text.primary,
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
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
                  padding: '12px',
                  background: theme.button.primary,
                  color: theme.text.inverse,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
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
                {addingFriend ? 'Sending Request...' : 'Send Friend Request'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedFriend && (
        <UserProfileView
          userId={selectedFriend.id}
          userName={selectedFriend.userName}
          userEmail={selectedFriend.userEmail}
          userPhoto={selectedFriend.userPhoto}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedFriend(null);
          }}
        />
      )}
    </div>
  );
}

