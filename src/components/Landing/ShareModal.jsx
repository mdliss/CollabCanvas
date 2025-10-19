/**
 * Canvas Sharing Modal - Invite collaborators with view/edit permissions
 * 
 * PREMIUM FEATURE: Only premium users can share canvases
 */

import { useState, useEffect } from 'react';
import { shareCanvas, getCollaborators, removeCollaborator } from '../../services/sharing';

export default function ShareModal({ project, currentUser, isPremium, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  useEffect(() => {
    loadCollaborators();
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [loading]);

  const loadCollaborators = async () => {
    try {
      const collab = await getCollaborators(project.canvasId);
      setCollaborators(collab);
    } catch (err) {
      console.error('[ShareModal] Failed to load collaborators:', err);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (!isPremium) {
      setError('Canvas sharing is a Premium feature. Upgrade to share canvases.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await shareCanvas(project.canvasId, email.trim(), role, currentUser);
      
      if (result.success) {
        setSuccess(result.message);
        setEmail('');
        loadCollaborators();
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to share canvas');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collaboratorEmail) => {
    try {
      await removeCollaborator(project.canvasId, collaboratorEmail);
      loadCollaborators();
    } catch (err) {
      console.error('[ShareModal] Failed to remove collaborator:', err);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  // Add CSS animations if not already added
  if (typeof document !== 'undefined' && !document.head.querySelector('style[data-share-modal]')) {
    const styleSheet = document.createElement('style');
    styleSheet.setAttribute('data-share-modal', '');
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  return (
    <div onClick={handleBackdropClick} style={{...styles.backdrop,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{...styles.modal, 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <button
          onClick={handleClose}
          style={styles.closeButton}
          onMouseEnter={(e) => e.target.style.color = '#2c2e33'}
          onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
        >
          ×
        </button>

        <h3 style={styles.title}>Share Canvas</h3>
        <p style={styles.subtitle}>{project.name}</p>

        {!isPremium && (
          <div style={styles.premiumNotice}>
            Canvas sharing is a Premium feature. Upgrade to collaborate with others.
          </div>
        )}

        <form onSubmit={handleShare} style={styles.form}>
          <div style={styles.inputRow}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              disabled={loading || !isPremium}
              style={{
                ...styles.input,
                flex: 1
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2c2e33';
                e.target.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                e.target.style.background = '#fafafa';
              }}
            />
            
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading || !isPremium}
              style={styles.select}
            >
              <option value="viewer">Can View</option>
              <option value="editor">Can Edit</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!email.trim() || loading || !isPremium}
            style={{
              ...styles.inviteButton,
              opacity: !email.trim() || loading || !isPremium ? 0.5 : 1,
              cursor: !email.trim() || loading || !isPremium ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (email.trim() && !loading && isPremium) {
                e.target.style.background = '#1a1c1f';
              }
            }}
            onMouseLeave={(e) => {
              if (email.trim() && !loading && isPremium) {
                e.target.style.background = '#2c2e33';
              }
            }}
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* Collaborators List */}
        {collaborators.length > 0 && (
          <div style={styles.collaboratorsList}>
            <h4 style={styles.listTitle}>Shared With</h4>
            {collaborators.map((collab, idx) => (
              <div key={idx} style={styles.collaboratorItem}>
                <div style={styles.collaboratorInfo}>
                  <div style={styles.collaboratorEmail}>{collab.email}</div>
                  <div style={styles.collaboratorRole}>
                    {collab.role === 'editor' ? 'Can Edit' : 'Can View'}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(collab.email)}
                  style={styles.removeButton}
                  onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                  title="Remove access"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.hint}>
          Collaborators will receive an email with a link to access this canvas.
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10003
  },
  
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    position: 'relative'
  },
  
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    color: '#9ca3af',
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
    color: '#2c2e33',
    textAlign: 'center',
    letterSpacing: '-0.02em'
  },
  
  subtitle: {
    margin: '0 0 28px 0',
    fontSize: '13px',
    color: '#646669',
    textAlign: 'center',
    fontWeight: '400'
  },
  
  premiumNotice: {
    background: '#fef3c7',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '20px',
    color: '#92400e',
    fontSize: '13px',
    textAlign: 'center'
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '20px'
  },
  
  inputRow: {
    display: 'flex',
    gap: '10px'
  },
  
  input: {
    padding: '12px 14px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#fafafa'
  },
  
  select: {
    padding: '12px 14px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: '#fafafa',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#2c2e33',
    fontWeight: '400'
  },
  
  inviteButton: {
    background: '#2c2e33',
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '12px',
    border: '1px solid rgba(153, 27, 27, 0.15)',
    textAlign: 'center'
  },
  
  success: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '12px',
    textAlign: 'center',
    border: '1px solid rgba(6, 95, 70, 0.15)'
  },
  
  collaboratorsList: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)'
  },
  
  listTitle: {
    margin: '0 0 14px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c2e33'
  },
  
  collaboratorItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid rgba(0, 0, 0, 0.04)'
  },
  
  collaboratorInfo: {
    flex: 1
  },
  
  collaboratorEmail: {
    fontSize: '14px',
    color: '#2c2e33',
    fontWeight: '500',
    marginBottom: '2px'
  },
  
  collaboratorRole: {
    fontSize: '12px',
    color: '#646669',
    fontWeight: '400'
  },
  
  removeButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '24px',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease'
  },
  
  hint: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '400'
  }
};

