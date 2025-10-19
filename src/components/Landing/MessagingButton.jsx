/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Messaging Button - Direct Messages
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Header button that opens dropdown for:
 * - Accessing direct messages with friends
 * - Shows online status
 * 
 * Friend management is now in FriendsModal.
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { subscribeToFriends } from '../../services/friends';
import { watchMultipleUsersPresence } from '../../services/presence';
import Avatar from '../Collaboration/Avatar';

export default function MessagingButton({ onOpenMessaging }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const [friends, setFriends] = useState([]);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const dropdownRef = useRef(null);

  // Subscribe to friends list
  useEffect(() => {
    if (!user?.uid) return;

    const unsubFriends = subscribeToFriends(user.uid, setFriends);

    return () => {
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

  const handleOpenChat = (friend) => {
    handleClose();
    onOpenMessaging(friend);
  };

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
        title="Messages"
      >
        Messages
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
            width: '320px',
            maxHeight: '500px',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border.normal}`,
            fontWeight: '600',
            fontSize: '13px',
            color: theme.text.primary
          }}>
            Direct Messages
          </div>

          {/* Friends List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {friends.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: theme.text.secondary
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>No friends yet</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Add friends to start messaging!</div>
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
                      marginBottom: '4px',
                      background: theme.background.elevated,
                      borderRadius: '8px',
                      border: `1px solid ${theme.border.light}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
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
                    <div style={{ position: 'relative' }}>
                      <Avatar 
                        src={friend.userPhoto}
                        name={friend.userName}
                        size="sm"
                      />
                      {/* Online Status Indicator */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-1px',
                        right: '-1px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isOnline ? '#22c55e' : theme.border.medium,
                        border: `2px solid ${theme.background.elevated}`,
                        boxShadow: isOnline ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none'
                      }} />
                    </div>
                    
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
                        fontSize: '11px', 
                        color: isOnline ? '#22c55e' : theme.text.secondary,
                        fontWeight: isOnline ? '500' : '400'
                      }}>
                        {isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
