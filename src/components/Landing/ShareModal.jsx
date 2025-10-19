/**
 * Canvas Sharing Modal - Invite collaborators with view/edit permissions
 * 
 * PREMIUM FEATURE: Only premium users can share canvases
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { shareCanvas, getCollaborators, removeCollaborator } from '../../services/sharing';

export default function ShareModal({ project, currentUser, isPremium, onClose }) {
  const { theme } = useTheme();
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
      zIndex: 10003
    },
    
    modal: {
      background: theme.background.card,
      borderRadius: '16px',
      padding: '36px',
      maxWidth: '480px',
      width: '90%',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      position: 'relative'
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
      textAlign: 'center',
      letterSpacing: '-0.02em'
    },
    
    subtitle: {
      margin: '0 0 28px 0',
      fontSize: '13px',
      color: theme.text.secondary,
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
      border: `1px solid ${theme.border.medium}`,
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s ease',
      background: theme.background.input,
      color: theme.text.primary
    },
    
    select: {
      padding: '12px 14px',
      border: `1px solid ${theme.border.medium}`,
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      background: theme.background.input,
      cursor: 'pointer',
      fontFamily: 'inherit',
      color: theme.text.primary,
      fontWeight: '400'
    },
    
    inviteButton: {
      background: theme.button.primary,
      color: theme.text.inverse,
      border: 'none',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    
    error: {
      background: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
      color: theme.isDark ? '#fca5a5' : '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '12px',
      border: `1px solid ${theme.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(153, 27, 27, 0.15)'}`,
      textAlign: 'center'
    },
    
    success: {
      background: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
      color: theme.isDark ? '#6ee7b7' : '#065f46',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '12px',
      textAlign: 'center',
      border: `1px solid ${theme.isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 95, 70, 0.15)'}`
    },
    
    collaboratorsList: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: `1px solid ${theme.border.normal}`
    },
    
    listTitle: {
      margin: '0 0 14px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: theme.text.primary
    },
    
    collaboratorItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      background: theme.background.elevated,
      borderRadius: '8px',
      marginBottom: '8px',
      border: `1px solid ${theme.border.light}`
    },
    
    collaboratorInfo: {
      flex: 1
    },
    
    collaboratorEmail: {
      fontSize: '14px',
      color: theme.text.primary,
      fontWeight: '500',
      marginBottom: '2px'
    },
    
    collaboratorRole: {
      fontSize: '12px',
      color: theme.text.secondary
    },
    
    removeButton: {
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      color: theme.text.tertiary,
      cursor: 'pointer',
      padding: '4px',
      lineHeight: 1,
      transition: 'color 0.2s ease'
    },
    
    hint: {
      fontSize: '12px',
      color: theme.text.tertiary,
      textAlign: 'center',
      marginTop: '16px'
    }
  };

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
          onMouseEnter={(e) => e.target.style.color = theme.text.primary}
          onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
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
              e.target.style.borderColor = theme.border.focus;
              e.target.style.background = theme.background.inputFocus;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.border.medium;
              e.target.style.background = theme.background.input;
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
                e.target.style.background = theme.button.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              if (email.trim() && !loading && isPremium) {
                e.target.style.background = theme.button.primary;
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
                  <select
                    value={collab.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      try {
                        // Update collaborator role
                        await shareCanvas(project.canvasId, collab.email, newRole, currentUser);
                        setSuccess(`Updated ${collab.email} to ${newRole === 'editor' ? 'Can Edit' : 'Can View'}`);
                        setTimeout(() => setSuccess(''), 3000);
                        await loadCollaborators(); // Refresh list
                      } catch (err) {
                        console.error('[ShareModal] Failed to update role:', err);
                        setError('Failed to update permissions');
                        setTimeout(() => setError(''), 3000);
                      }
                    }}
                    style={{
                      ...styles.select,
                      fontSize: '12px',
                      padding: '4px 8px',
                      marginTop: '4px'
                    }}
                  >
                    <option value="viewer">Can View</option>
                    <option value="editor">Can Edit</option>
                  </select>
                </div>
                <button
                  onClick={() => handleRemove(collab.email)}
                  style={styles.removeButton}
                  onMouseEnter={(e) => e.target.style.color = theme.button.danger}
                  onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
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

