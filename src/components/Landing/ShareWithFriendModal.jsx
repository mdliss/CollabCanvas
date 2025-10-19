/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Share With Friend Modal - Quick canvas sharing with friends
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { listProjects } from '../../services/projects';
import { shareCanvas } from '../../services/sharing';

export default function ShareWithFriendModal({ friend, onClose }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [permission, setPermission] = useState('viewer');
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Load projects using UID (not email - RTDB doesn't allow @ and . in paths)
    listProjects(user.uid).then(setProjects).catch(err => {
      console.error('[ShareWithFriend] Failed to load projects:', err);
      setProjects([]);
    }).finally(() => setLoading(false));
  }, [user]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !sharing) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sharing, onClose]);

  const handleShare = async () => {
    if (!selectedProject || !friend || !user) return;

    setSharing(true);
    try {
      await shareCanvas(selectedProject.canvasId, friend.userEmail, permission);
      alert(`Shared "${selectedProject.name}" with ${friend.userName} as ${permission}`);
      onClose();
    } catch (error) {
      console.error('[ShareWithFriend] Failed to share:', error);
      alert(error.message || 'Failed to share canvas');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.backdrop,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10004
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.background.card,
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: theme.shadow.xl,
          border: `1px solid ${theme.border.normal}`
        }}
      >
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: theme.text.primary
        }}>
          Share Canvas with {friend.userName}
        </h3>
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '13px',
          color: theme.text.secondary
        }}>
          Select a canvas and permission level
        </p>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: theme.text.secondary }}>
            Loading your canvases...
          </div>
        ) : (
          <>
            {/* Canvas Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: theme.text.primary,
                marginBottom: '8px'
              }}>
                Canvas
              </label>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value);
                  setSelectedProject(project);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme.border.medium}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: theme.background.card,
                  color: theme.text.primary,
                  outline: 'none'
                }}
              >
                <option value="">Select a canvas...</option>
                {projects.filter(p => p.isOwned).map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Permission Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: theme.text.primary,
                marginBottom: '8px'
              }}>
                Permission
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPermission('viewer')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: permission === 'viewer' ? theme.button.primary : theme.background.elevated,
                    color: permission === 'viewer' ? theme.text.inverse : theme.text.primary,
                    border: `1px solid ${permission === 'viewer' ? theme.button.primary : theme.border.medium}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  View Only
                </button>
                <button
                  onClick={() => setPermission('editor')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: permission === 'editor' ? theme.button.primary : theme.background.elevated,
                    color: permission === 'editor' ? theme.text.inverse : theme.text.primary,
                    border: `1px solid ${permission === 'editor' ? theme.button.primary : theme.border.medium}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Can Edit
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: theme.background.card,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.medium}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
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
                onClick={handleShare}
                disabled={!selectedProject || sharing}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: theme.button.primary,
                  color: theme.text.inverse,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: (!selectedProject || sharing) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedProject || sharing) ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedProject && !sharing) {
                    e.target.style.background = theme.button.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.button.primary;
                }}
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

