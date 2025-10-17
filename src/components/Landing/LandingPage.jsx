/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Landing Page - Canvas Project Grid
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shows user's canvas projects in a grid layout with:
 * - Project cards with thumbnails
 * - Create new project button
 * - Premium subscription prompts for free users at limit
 * - Project management (rename, delete, duplicate, star)
 * 
 * DESIGN AESTHETIC:
 * - Matches ShapeToolbar styling (same gradients, shadows, rounded corners)
 * - Clean, modern card-based layout
 * - Professional polish matching app design language
 * 
 * FREE VS PREMIUM:
 * - Free: 3 projects max, shows upgrade prompt at limit
 * - Premium: Unlimited projects, shows "Premium" badge
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToProjects, createProject, deleteProject, updateProject, getUserSubscription } from '../../services/projects';
import SubscriptionModal from './SubscriptionModal';
import RenameModal from './RenameModal';
import CouponModal from './CouponModal';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [subscription, setSubscription] = useState({ isPremium: false, tier: 'free' });
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [renamingProject, setRenamingProject] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);

  // Load projects and subscription status
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load subscription status
        const sub = await getUserSubscription(user.uid);
        setSubscription(sub);

        // Subscribe to projects
        const unsubscribe = subscribeToProjects(user.uid, (projectsList) => {
          setProjects(projectsList);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('[LandingPage] Failed to load data:', error);
        setLoading(false);
      }
    };

    const unsubscribe = loadData();
    
    return () => {
      if (unsubscribe && typeof unsubscribe.then === 'function') {
        unsubscribe.then(unsub => unsub && unsub());
      }
    };
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) return;

    // Check if at free tier limit
    if (!subscription.isPremium && projects.length >= 3) {
      setShowSubscriptionModal(true);
      return;
    }

    setCreatingProject(true);
    try {
      const project = await createProject(user.uid, 'Untitled Canvas');
      // Navigate to the new canvas
      navigate(`/canvas/${project.canvasId}`);
    } catch (error) {
      console.error('[LandingPage] Failed to create project:', error);
      alert(error.message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleOpenProject = (project) => {
    navigate(`/canvas/${project.canvasId}`);
  };

  const handleDeleteProject = async (project, e) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(user.uid, project.id, project.canvasId);
    } catch (error) {
      console.error('[LandingPage] Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleToggleStar = async (project, e) => {
    e.stopPropagation();
    
    try {
      await updateProject(user.uid, project.id, { isStarred: !project.isStarred });
    } catch (error) {
      console.error('[LandingPage] Failed to toggle star:', error);
    }
  };

  const handleRename = async (project, e) => {
    e.stopPropagation();
    setRenamingProject(project);
  };

  const handleSaveRename = async (newName) => {
    if (!renamingProject) return;
    
    try {
      await updateProject(user.uid, renamingProject.id, { name: newName });
      setRenamingProject(null);
    } catch (error) {
      console.error('[LandingPage] Failed to rename project:', error);
      alert('Failed to rename project');
    }
  };

  const handleCouponSuccess = async () => {
    // Reload subscription status
    const sub = await getUserSubscription(user.uid);
    setSubscription(sub);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}>Loading projects...</div>
      </div>
    );
  }

  const canCreateMore = subscription.isPremium || projects.length < 3;
  const remainingProjects = subscription.isPremium ? '∞' : Math.max(0, 3 - projects.length);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            CollabCanvas
          </h1>
          <p style={styles.subtitle}>
            {user?.displayName || user?.email?.split('@')[0] || 'User'}'s Projects
          </p>
        </div>
        
        <div style={styles.headerRight}>
          {subscription.isPremium ? (
            <div style={styles.premiumBadge}>
              {subscription.tier === 'lifetime' ? 'Lifetime Premium' : 'Premium'}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowCouponModal(true)}
                style={styles.couponButton}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fafafa';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                }}
                title="Have a coupon code?"
              >
                Coupon
              </button>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                style={styles.upgradeButton}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1a1c1f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2c2e33';
                }}
              >
                Upgrade to Premium
              </button>
            </>
          )}
          
          <button
            onClick={logout}
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.target.style.background = '#fafafa';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Project Grid */}
      <div style={styles.gridContainer}>
        {/* Create New Project Card */}
        <button
          onClick={handleCreateProject}
          disabled={creatingProject || !canCreateMore}
          style={{
            ...styles.projectCard,
            ...styles.createCard,
            opacity: !canCreateMore ? 0.6 : 1,
            cursor: !canCreateMore ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (canCreateMore) {
              e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
            e.target.style.borderColor = 'rgba(0, 0, 0, 0.06)';
          }}
        >
          <div style={styles.createIcon}>+</div>
          <div style={styles.createLabel}>
            {creatingProject ? 'Creating...' : 'New Canvas'}
          </div>
          {!subscription.isPremium && (
            <div style={styles.createLimit}>
              {remainingProjects} remaining
            </div>
          )}
        </button>

        {/* Project Cards */}
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleOpenProject(project)}
            style={styles.projectCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
            }}
          >
            {/* Thumbnail/Preview */}
            <div style={styles.thumbnail}>
              {project.thumbnail ? (
                <img src={project.thumbnail} alt={project.name} style={styles.thumbnailImage} />
              ) : (
                <div style={styles.thumbnailPlaceholder}>
                  <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}>
                    {project.name}
                  </div>
                </div>
              )}
            </div>

            {/* Project Info */}
            <div style={styles.projectInfo}>
              <div style={styles.projectName}>
                {project.isStarred && <span style={styles.starIcon}>★</span>}
                {project.name}
              </div>
              <div style={styles.projectMeta}>
                {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div style={styles.projectActions}>
              <button
                onClick={(e) => handleToggleStar(project, e)}
                style={styles.actionButton}
                title={project.isStarred ? 'Unstar' : 'Star'}
              >
                {project.isStarred ? '★' : '☆'}
              </button>
              <button
                onClick={(e) => handleRename(project, e)}
                style={styles.actionButton}
                title="Rename project"
              >
                ✎
              </button>
              <button
                onClick={(e) => handleDeleteProject(project, e)}
                style={{...styles.actionButton, ...styles.deleteButton}}
                title="Delete project"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div style={styles.emptyState}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '500', color: '#2c2e33' }}>
            No Projects Yet
          </h2>
          <p style={{ margin: '0', fontSize: '14px', color: '#646669', fontWeight: '400' }}>
            Create your first canvas to get started
          </p>
        </div>
      )}

      {/* Modals */}
      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          currentProjectCount={projects.length}
        />
      )}
      
      {showCouponModal && (
        <CouponModal
          onClose={() => setShowCouponModal(false)}
          onSuccess={handleCouponSuccess}
        />
      )}
      
      {renamingProject && (
        <RenameModal
          project={renamingProject}
          onSave={handleSaveRename}
          onClose={() => setRenamingProject(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  
  header: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto 48px auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff',
    padding: '20px 32px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(0, 0, 0, 0.06)'
  },
  
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c2e33',
    letterSpacing: '-0.02em'
  },
  
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#646669',
    fontWeight: '400'
  },
  
  premiumBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid rgba(146, 64, 14, 0.1)'
  },
  
  upgradeButton: {
    background: '#2c2e33',
    color: '#ffffff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
  },
  
  couponButton: {
    background: '#ffffff',
    color: '#2c2e33',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  
  logoutButton: {
    background: '#ffffff',
    color: '#2c2e33',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  
  gridContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  
  projectCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '0',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    position: 'relative'
  },
  
  createCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '220px',
    background: '#fafafa',
    border: '2px dashed rgba(0, 0, 0, 0.08)'
  },
  
  createIcon: {
    fontSize: '48px',
    color: '#646669',
    marginBottom: '8px'
  },
  
  createLabel: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#2c2e33',
    marginBottom: '4px'
  },
  
  createLimit: {
    fontSize: '12px',
    color: '#646669',
    fontWeight: '400'
  },
  
  thumbnail: {
    width: '100%',
    height: '160px',
    background: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  
  thumbnailPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  projectInfo: {
    padding: '14px 16px'
  },
  
  projectName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#2c2e33',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  
  projectMeta: {
    fontSize: '12px',
    color: '#646669',
    fontWeight: '400'
  },
  
  starIcon: {
    fontSize: '13px'
  },
  
  projectActions: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    gap: '6px',
    opacity: 0.9
  },
  
  actionButton: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
  },
  
  deleteButton: {
    color: '#ef4444'
  },
  
  emptyState: {
    maxWidth: '1200px',
    margin: '60px auto',
    textAlign: 'center',
    padding: '40px 20px'
  },
  
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  
  loader: {
    fontSize: '15px',
    color: '#646669',
    fontWeight: '400'
  }
};

