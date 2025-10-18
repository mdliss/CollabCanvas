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
import { subscribeToProjects, createProject, deleteProject, updateProject, getUserSubscription, listProjects, listSharedCanvases } from '../../services/projects';
import SubscriptionModal from './SubscriptionModal';
import RenameModal from './RenameModal';
import CouponModal from './CouponModal';
import ShareModal from './ShareModal';
import NotificationBell from './NotificationBell';
import TemplateSelectionModal from './TemplateSelectionModal';
import { TEMPLATES } from '../../utils/templates';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'owned' | 'shared'
  const [subscription, setSubscription] = useState({ isPremium: false, tier: 'free' });
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [renamingProject, setRenamingProject] = useState(null);
  const [sharingProject, setSharingProject] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [triggerReflow, setTriggerReflow] = useState(false);

  // Trigger logout confirmation entrance animation
  useEffect(() => {
    if (showLogoutConfirm) {
      setTimeout(() => setLogoutConfirmVisible(true), 50);
    } else {
      setLogoutConfirmVisible(false);
    }
  }, [showLogoutConfirm]);

  // Handle logout confirmation close with animation
  const handleCloseLogoutConfirm = () => {
    setLogoutConfirmVisible(false);
    setTimeout(() => setShowLogoutConfirm(false), 300);
  };

  // Load projects and subscription status
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        console.log('[LandingPage] Loading data for user:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        
        // Load subscription status
        const sub = await getUserSubscription(user.uid);
        setSubscription(sub);

        // Load owned projects
        const owned = await listProjects(user.uid);
        setOwnedProjects(owned);
        
        // Load shared canvases - CRITICAL: Get email from multiple sources
        const userEmail = user.email || 
                         user.providerData?.[0]?.email || 
                         (user.reloadUserInfo && user.reloadUserInfo.email);
        
        console.log('[LandingPage] User email sources:', {
          'user.email': user.email,
          'providerData[0].email': user.providerData?.[0]?.email,
          'final': userEmail
        });
        
        console.log('[LandingPage] Calling listSharedCanvases with email:', userEmail);
        
        let shared = [];
        if (userEmail) {
          shared = await listSharedCanvases(userEmail);
          setSharedProjects(shared);
        } else {
          console.error('[LandingPage] No email found for user!', user);
          setSharedProjects([]);
        }
        
        setLoading(false);
        
        console.log('[LandingPage] Loaded:', {
          owned: owned.length,
          shared: shared.length,
          email: userEmail
        });
        
      } catch (error) {
        console.error('[LandingPage] Failed to load data:', error);
        setLoading(false);
      }
    };

    loadData();
    
    // Poll for updates every 5 seconds to catch shared canvas changes
    const interval = setInterval(loadData, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Combine and filter projects
  const allProjects = [...ownedProjects, ...sharedProjects];
  const filteredProjects = filter === 'owned' 
    ? ownedProjects 
    : filter === 'shared' 
      ? sharedProjects 
      : allProjects;

  // Debug: Log when filteredProjects changes
  useEffect(() => {
    console.log('[LandingPage] 📊 filteredProjects updated:', {
      count: filteredProjects.length,
      deletingId: deletingProjectId,
      projectIds: filteredProjects.map(p => ({ id: p.id, name: p.name }))
    });
  }, [filteredProjects, deletingProjectId]);

  // Trigger entrance animations after page loads
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsPageVisible(true);
      }, 100); // Small delay for smoother transition
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Handle filter change with fade animation
  const handleFilterChange = (newFilter) => {
    if (newFilter === filter) return;
    
    // Fade out
    setCardsVisible(false);
    
    // Change filter and fade in after animation
    setTimeout(() => {
      setFilter(newFilter);
      setTimeout(() => {
        setCardsVisible(true);
      }, 50);
    }, 300);
  };

  const handleCreateProject = () => {
    if (!user) return;

    // Check if at free tier limit (only count owned projects)
    if (!subscription.isPremium && ownedProjects.length >= 3) {
      setShowSubscriptionModal(true);
      return;
    }

    // Show template selection modal
    setShowTemplateModal(true);
  };

  const handleTemplateSelect = async (templateId) => {
    setCreatingProject(true);
    try {
      // Get template name for canvas title
      const templateName = TEMPLATES[templateId]?.name || 'Untitled Canvas';
      const project = await createProject(user.uid, templateName, templateId);
      // Navigate to the new canvas
      navigate(`/canvas/${project.canvasId}`);
    } catch (error) {
      console.error('[LandingPage] Failed to create project:', error);
      alert(error.message);
      setCreatingProject(false);
      setShowTemplateModal(false);
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

    console.log('[LandingPage] 🗑️ Delete started for project:', project.id, project.name);
    console.log('[LandingPage] Current allProjects count:', allProjects.length);
    
    // Set deleting state to show animation
    setDeletingProjectId(project.id);
    console.log('[LandingPage] ⏳ Deleting state set, starting fade-out animation');

    try {
      // Wait for fade-out animation (600ms)
      console.log('[LandingPage] ⏱️ Waiting 600ms for fade-out animation...');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      console.log('[LandingPage] ✅ Fade-out complete, calling deleteProject API...');
      // Delete the project
      await deleteProject(user.uid, project.id, project.canvasId);
      
      console.log('[LandingPage] ✅ Firebase deletion complete');
      
      // Immediately remove from local state to prevent flicker
      console.log('[LandingPage] 🗑️ Removing project from local state immediately');
      setOwnedProjects(prev => prev.filter(p => p.id !== project.id));
      setSharedProjects(prev => prev.filter(p => p.id !== project.id));
      
      // Clear deleting state
      setDeletingProjectId(null);
      
      // Trigger reflow animation for remaining cards
      setTriggerReflow(true);
      setTimeout(() => setTriggerReflow(false), 600);
      
      console.log('[LandingPage] 🎉 Delete complete, project removed from UI');
    } catch (error) {
      console.error('[LandingPage] ❌ Failed to delete project:', error);
      alert('Failed to delete project');
      setDeletingProjectId(null);
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

  const handleShare = async (project, e) => {
    e.stopPropagation();
    setSharingProject(project);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}>Loading projects...</div>
      </div>
    );
  }

  const canCreateMore = subscription.isPremium || ownedProjects.length < 3;
  const remainingProjects = subscription.isPremium ? '∞' : Math.max(0, 3 - ownedProjects.length);

  return (
    <div style={styles.container}>
      {/* Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Grid reflow animation */
        @keyframes gridSettle {
          0% {
            opacity: 0.7;
            transform: translateY(-5px) scale(0.98);
          }
          60% {
            opacity: 1;
            transform: translateY(2px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      
      {/* Header */}
      <div style={{
        ...styles.header,
        opacity: isPageVisible ? 1 : 0,
        transform: isPageVisible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            CollabCanvas
          </h1>
          <p style={styles.subtitle}>
            {ownedProjects.length} owned · {sharedProjects.length} shared
          </p>
        </div>
        
        <div style={styles.headerRight}>
          {/* Notification Bell */}
          <NotificationBell onApprove={() => {
            // Reload projects when request approved
            const loadData = async () => {
              const owned = await listProjects(user.uid);
              setOwnedProjects(owned);
              const shared = await listSharedCanvases(user.email);
              setSharedProjects(shared);
            };
            loadData();
          }} />
          
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
            onClick={() => setShowLogoutConfirm(true)}
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

      {/* Filter Toggle */}
      <div style={{
        opacity: isPageVisible ? 1 : 0,
        transform: isPageVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
        marginBottom: '28px'
      }}>
        <div style={styles.filterContainer}>
          <button
            onClick={() => handleFilterChange('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {})
            }}
            onMouseEnter={(e) => {
              if (filter !== 'all') {
                e.target.style.background = '#fafafa';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'all') {
                e.target.style.background = '#ffffff';
              }
            }}
          >
            All ({allProjects.length})
          </button>
          <button
            onClick={() => handleFilterChange('owned')}
            style={{
              ...styles.filterButton,
              ...(filter === 'owned' ? styles.filterButtonActive : {})
            }}
            onMouseEnter={(e) => {
              if (filter !== 'owned') {
                e.target.style.background = '#fafafa';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'owned') {
                e.target.style.background = '#ffffff';
              }
            }}
          >
            Owned ({ownedProjects.length})
          </button>
          <button
            onClick={() => handleFilterChange('shared')}
            style={{
              ...styles.filterButton,
              ...(filter === 'shared' ? styles.filterButtonActive : {})
            }}
            onMouseEnter={(e) => {
              if (filter !== 'shared') {
                e.target.style.background = '#fafafa';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'shared') {
                e.target.style.background = '#ffffff';
              }
            }}
          >
            Shared ({sharedProjects.length})
          </button>
        </div>
      </div>

      {/* Project Grid */}
      <div style={{
        ...styles.gridContainer,
        opacity: (isPageVisible && cardsVisible) ? 1 : 0,
        transform: isPageVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: cardsVisible 
          ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
          : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Create New Project Card */}
        <button
          onClick={handleCreateProject}
          disabled={creatingProject || !canCreateMore}
          style={{
            ...styles.projectCard,
            ...styles.createCard,
            opacity: !canCreateMore ? 0.6 : 1,
            cursor: !canCreateMore ? 'not-allowed' : 'pointer',
            animation: triggerReflow ? 'gridSettle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
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
        {filteredProjects.map((project) => {
          const isDeleting = deletingProjectId === project.id;
          
          if (isDeleting) {
            console.log('[LandingPage] 🔄 Rendering DELETING card for:', project.id, project.name);
          }
          
          // Completely hide the card once deletion starts (prevents flash)
          if (isDeleting) {
            return (
              <div
                key={project.id}
                style={{
                  ...styles.projectCard,
                  opacity: 0,
                  transform: 'scale(0.92)',
                  transition: 'opacity 0.6s ease, transform 0.6s ease',
                  pointerEvents: 'none',
                  position: 'relative'
                }}
              >
                {/* Loading Spinner Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '10px',
                  zIndex: 10
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f5f5f5',
                    borderTop: '3px solid #2c2e33',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <div style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#2c2e33',
                    fontFamily: "'Roboto Mono', monospace"
                  }}>
                    Deleting...
                  </div>
                </div>
              </div>
            );
          }
          
          return (
            <div
              key={project.id}
              onClick={() => !isDeleting && handleOpenProject(project)}
              style={{
                ...styles.projectCard,
                ...(project.isShared ? { borderLeftWidth: '3px', borderLeftColor: '#3b82f6', borderLeftStyle: 'solid' } : {}),
                opacity: isDeleting ? 0 : 1,
                transform: isDeleting ? 'scale(0.92)' : 'scale(1)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
                position: 'relative',
                pointerEvents: isDeleting ? 'none' : 'auto',
                animation: triggerReflow && !isDeleting ? 'gridSettle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                }
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
                {project.isShared && (
                  <span style={styles.sharedBadge}>
                    {project.sharedRole === 'editor' ? 'Can Edit' : 'View Only'}
                  </span>
                )}
              </div>
              <div style={styles.projectMeta}>
                {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Actions - Only show for owned projects */}
            {project.isOwned && (
              <div style={styles.projectActions}>
                <button
                  onClick={(e) => handleToggleStar(project, e)}
                  style={styles.actionButton}
                  title={project.isStarred ? 'Unstar' : 'Star'}
                >
                  {project.isStarred ? '★' : '☆'}
                </button>
                <button
                  onClick={(e) => handleShare(project, e)}
                  style={styles.actionButton}
                  title={subscription.isPremium ? 'Share canvas' : 'Share (Premium)'}
                >
                  ⎋
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
            )}
          </div>
        );
        })}
      </div>

      {/* Empty State */}
      <div style={{
        opacity: filteredProjects.length === 0 ? 1 : 0,
        transform: filteredProjects.length === 0 ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
        pointerEvents: filteredProjects.length === 0 ? 'auto' : 'none',
        position: filteredProjects.length === 0 ? 'relative' : 'absolute',
        top: filteredProjects.length === 0 ? 'auto' : '-9999px'
      }}>
        {filteredProjects.length === 0 && (
          <div style={styles.emptyState}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '500', color: '#2c2e33' }}>
              {filter === 'shared' ? 'No Shared Canvases' : filter === 'owned' ? 'No Projects Yet' : 'No Canvases'}
            </h2>
            <p style={{ margin: '0', fontSize: '14px', color: '#646669', fontWeight: '400' }}>
              {filter === 'shared' 
                ? 'Canvases shared with you will appear here' 
                : 'Create your first canvas to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplateModal && (
        <TemplateSelectionModal
          onSelect={handleTemplateSelect}
          onClose={() => {
            setShowTemplateModal(false);
            setCreatingProject(false);
          }}
          isPremium={subscription.isPremium}
        />
      )}
      
      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          currentProjectCount={ownedProjects.length}
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
      
      {sharingProject && (
        <ShareModal
          project={sharingProject}
          currentUser={user}
          isPremium={subscription.isPremium}
          onClose={() => setSharingProject(null)}
        />
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div
          onClick={handleCloseLogoutConfirm}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `rgba(0, 0, 0, ${logoutConfirmVisible ? 0.5 : 0})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              fontFamily: "'Roboto Mono', monospace",
              opacity: logoutConfirmVisible ? 1 : 0,
              transform: logoutConfirmVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c2e33'
            }}>
              Sign Out?
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Are you sure you want to sign out?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseLogoutConfirm}
                style={{
                  padding: '10px 20px',
                  background: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#2c2e33',
                  cursor: 'pointer',
                  fontFamily: "'Roboto Mono', monospace",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fafafa';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }}
              >
                <span style={{ fontSize: '16px' }}>✕</span>
                Cancel
              </button>
              <button
                onClick={() => {
                  setLogoutConfirmVisible(false);
                  setTimeout(() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }, 300);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#2c2e33',
                  border: '1px solid #2c2e33',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: "'Roboto Mono', monospace",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1a1c1f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2c2e33';
                }}
              >
                <span style={{ fontSize: '16px' }}>✓</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
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
  
  filterContainer: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  
  filterButton: {
    background: '#ffffff',
    color: '#646669',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '400',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  filterButtonActive: {
    background: '#2c2e33',
    color: '#ffffff',
    borderColor: '#2c2e33'
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
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
    gap: '6px',
    flexWrap: 'wrap'
  },
  
  projectMeta: {
    fontSize: '12px',
    color: '#646669',
    fontWeight: '400'
  },
  
  starIcon: {
    fontSize: '13px'
  },
  
  sharedBadge: {
    fontSize: '11px',
    fontWeight: '400',
    color: '#3b82f6',
    background: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(59, 130, 246, 0.2)'
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

