/**
 * Notification Bell - Shows edit permission requests
 * 
 * Displays badge with count of pending requests.
 * Click to open notification list with approve/deny actions.
 */

import { useState, useEffect } from 'react';
import { subscribeToRequests, approveEditRequest, denyEditRequest, deleteRequest } from '../../services/notifications';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationBell({ onApprove }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Subscribe to edit requests
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToRequests(user.uid, (pendingRequests) => {
      setRequests(pendingRequests);
      console.log('[Notifications] Pending requests:', pendingRequests.length);
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

  if (requests.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Minimal Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.08)',
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
          color: '#2c2e33'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#fafafa';
          e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#ffffff';
          e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: '400' }}>Requests</span>
        {requests.length > 0 && (
          <span style={{
            background: '#2c2e33',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '500',
            padding: '2px 7px',
            borderRadius: '10px',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {requests.length}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          minWidth: '340px',
          maxWidth: '400px',
          zIndex: 10004,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            fontSize: '13px',
            fontWeight: '600',
            color: '#2c2e33'
          }}>
            Edit Requests ({requests.length})
          </div>

          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                fontSize: '13px'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: '500', color: '#2c2e33', marginBottom: '3px', fontSize: '13px' }}>
                  {request.requesterName}
                </div>
                <div style={{ fontSize: '12px', color: '#646669', fontWeight: '400', marginBottom: '3px' }}>
                  wants to edit "{request.canvasName}"
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '400' }}>
                  {new Date(request.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleApprove(request)}
                  disabled={processingId === request.id}
                  style={{
                    flex: 1,
                    background: '#2c2e33',
                    color: '#ffffff',
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
                      e.target.style.background = '#1a1c1f';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (processingId !== request.id) {
                      e.target.style.background = '#2c2e33';
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
                    background: '#ffffff',
                    color: '#2c2e33',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
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
                      e.target.style.background = '#fafafa';
                      e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (processingId !== request.id) {
                      e.target.style.background = '#ffffff';
                      e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
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

      {/* Click outside to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10003
          }}
        />
      )}
    </div>
  );
}

