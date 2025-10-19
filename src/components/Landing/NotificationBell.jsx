/**
 * Notification Bell - Shows edit permission requests
 * 
 * Displays badge with count of pending requests.
 * Click to open notification list with approve/deny actions.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToRequests, approveEditRequest, denyEditRequest, deleteRequest } from '../../services/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function NotificationBell({ onApprove }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [buttonRect, setButtonRect] = useState(null);

  // Subscribe to edit requests
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToRequests(user.uid, (pendingRequests) => {
      setRequests(pendingRequests);
    });

    return () => unsubscribe();
  }, [user]);

  const handleApprove = async (request) => {
    setProcessingId(request.id);
    try {
      await approveEditRequest(user.uid, request);
      await deleteRequest(user.uid, request.id);
      
      if (onApprove) onApprove();
    } catch (error) {
      console.error('[Notifications] Failed to approve request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (request) => {
    setProcessingId(request.id);
    try {
      await denyEditRequest(user.uid, request.id);
      await deleteRequest(user.uid, request.id);
    } catch (error) {
      console.error('[Notifications] Failed to deny request:', error);
      alert('Failed to deny request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpen = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setIsOpen(true);
    // Small delay for smooth animation
    setTimeout(() => setIsVisible(true), 10);
  };

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before unmounting
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

  if (requests.length === 0) return null;

  return (
    <>
      {/* Minimal Notification Button */}
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
          whiteSpace: 'nowrap',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.background.elevated;
          e.target.style.borderColor = theme.border.strong;
          e.target.style.outline = 'none';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = theme.background.card;
          e.target.style.borderColor = theme.border.medium;
          e.target.style.outline = 'none';
        }}
        onFocus={(e) => {
          e.target.style.outline = 'none';
        }}
        onBlur={(e) => {
          e.target.style.outline = 'none';
        }}
        onMouseDown={(e) => {
          e.target.style.outline = 'none';
        }}
        onMouseUp={(e) => {
          e.target.style.outline = 'none';
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '500' }}>Requests</span>
        {requests.length > 0 && (
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
            {requests.length}
          </span>
        )}
      </button>

      {/* Portal: Click outside to close - MUST render BEFORE dropdown for correct z-index */}
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

      {/* Portal: Notification Dropdown */}
      {isOpen && buttonRect && createPortal(
        <div style={{
          position: 'fixed',
          top: `${buttonRect.bottom + 8}px`,
          right: `${window.innerWidth - buttonRect.right}px`,
          background: theme.background.card,
          border: `1px solid ${theme.border.normal}`,
          borderRadius: '10px',
          boxShadow: theme.shadow.xl,
          minWidth: '340px',
          maxWidth: '400px',
          zIndex: 999999,
          maxHeight: '400px',
          overflowY: 'auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border.normal}`,
            fontSize: '13px',
            fontWeight: '600',
            color: theme.text.primary
          }}>
            Edit Requests ({requests.length})
          </div>

          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme.border.light}`,
                fontSize: '13px'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: '500', color: theme.text.primary, marginBottom: '3px', fontSize: '13px' }}>
                  {request.requesterName}
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary, fontWeight: '400', marginBottom: '3px' }}>
                  wants to edit "{request.canvasName}"
                </div>
                <div style={{ fontSize: '11px', color: theme.text.tertiary, fontWeight: '400' }}>
                  {new Date(request.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleApprove(request)}
                  disabled={processingId === request.id}
                  style={{
                    flex: 1,
                    background: theme.button.primary,
                    color: theme.text.inverse,
                    border: 'none',
                    padding: '8px',
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
                  {processingId === request.id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleDeny(request)}
                  disabled={processingId === request.id}
                  style={{
                    flex: 1,
                    background: theme.background.card,
                    color: theme.text.primary,
                    border: `1px solid ${theme.border.medium}`,
                    padding: '8px',
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
        </div>,
        document.body
      )}
    </>
  );
}

