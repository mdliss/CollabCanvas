/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Landing Page - Canvas Project Grid
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shows user's canvas projects in a grid layout with:
 * - Project cards with thumbnails
 * - Create new project button
 * - Premium subscription prompts for free users at limit
 * - Project management (rename, delete, share)
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
import { useTheme } from '../../contexts/ThemeContext';
import { subscribeToProjects, createProject, deleteProject, updateProject, getUserSubscription, listProjects, listSharedCanvases } from '../../services/projects';
import { setGlobalUserOnline } from '../../services/presence';
import { exposeAdminUtils } from '../../services/adminUtils';
import SubscriptionModal from './SubscriptionModal';
import RenameModal from './RenameModal';
import CouponModal from './CouponModal';
import ShareModal from './ShareModal';
import NotificationBell from './NotificationBell';
import TemplateSelectionModal from './TemplateSelectionModal';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import LeaderboardModal from './LeaderboardModal';
import MessagingButton from './MessagingButton';
import DirectMessagingPanel from './DirectMessagingPanel';
import { TEMPLATES } from '../../utils/templates';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'owned' | 'shared'
  const [subscription, setSubscription] = useState({ isPremium: false, tier: 'free' });
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedFriendForChat, setSelectedFriendForChat] = useState(null);
  const [renamingProject, setRenamingProject] = useState(null);
  const [sharingProject, setSharingProject] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [triggerReflow, setTriggerReflow] = useState(false);

  // Trigger logout confirmation entrance animation
  useEffect(() => {
    if (showLogoutConfirm) {
      setTimeout(() => setLogoutConfirmVisible(true), 50);
    } else {
      setLogoutConfirmVisible(false);
    }
  }, [showLogoutConfirm]);
  
  // Trigger delete confirmation entrance animation
  useEffect(() => {
    if (showDeleteConfirm) {
      setTimeout(() => setDeleteConfirmVisible(true), 50);
    } else {
      setDeleteConfirmVisible(false);
    }
  }, [showDeleteConfirm]);

  // Escape key handler for confirmations
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showLogoutConfirm) {
          handleCloseLogoutConfirm();
        } else if (showDeleteConfirm) {
          handleCloseDeleteConfirm();
        }
      }
    };

    if (showLogoutConfirm || showDeleteConfirm) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showLogoutConfirm, showDeleteConfirm]);

  // Handle logout confirmation close with animation
  const handleCloseLogoutConfirm = () => {
    setLogoutConfirmVisible(false);
    setTimeout(() => setShowLogoutConfirm(false), 300);
  };
  
  // Handle delete confirmation close with animation
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmVisible(false);
    setTimeout(() => {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }, 300);
  };

  // Set user as globally online for friends to see
  useEffect(() => {
    if (!user?.uid) return;

    setGlobalUserOnline(user.uid).catch(err => {
      console.error('[LandingPage] Failed to set global presence:', err);
    });
  }, [user]);

  // Expose admin utilities for debugging (dev only)
  useEffect(() => {
    if ((process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && user?.uid) {
      exposeAdminUtils(user.uid);
    }
  }, [user]);

  // Load projects and subscription status
  useEffect(() => {
    if (!user) return;

    let pollCount = 0;
    console.log('[🔄 DATA SYNC] Setting up project data loading...');

    const loadData = async () => {
      pollCount++;
      const loadStartTime = performance.now();
      
      if (pollCount === 1) {
        console.log('[🔄 DATA SYNC] 📥 Initial data load...');
      } else {
        console.log(`[🔄 DATA SYNC] 🔁 Poll #${pollCount - 1} - Refreshing all data (5s interval)`);
      }
      
      try {
        
        // Load subscription status
        const subStart = performance.now();
        const sub = await getUserSubscription(user.uid);
        console.log(`[🔄 DATA SYNC] ✓ Subscription loaded in ${(performance.now() - subStart).toFixed(2)}ms`);
        setSubscription(sub);

        // Load owned projects
        const ownedStart = performance.now();
        const owned = await listProjects(user.uid);
        console.log(`[🔄 DATA SYNC] ✓ Owned projects loaded in ${(performance.now() - ownedStart).toFixed(2)}ms (${owned.length} projects)`);
        
        setOwnedProjects(owned);
        
        // Load shared canvases - CRITICAL: Get email from multiple sources
        const userEmail = user.email || 
                         user.providerData?.[0]?.email || 
                         (user.reloadUserInfo && user.reloadUserInfo.email);
        
        
        let shared = [];
        if (userEmail) {
          const sharedStart = performance.now();
          shared = await listSharedCanvases(userEmail);
          console.log(`[🔄 DATA SYNC] ✓ Shared projects loaded in ${(performance.now() - sharedStart).toFixed(2)}ms (${shared.length} projects)`);
          setSharedProjects(shared);
        } else {
          console.error('[LandingPage] No email found for user!', user);
          setSharedProjects([]);
        }
        
        setLoading(false);
        
        const totalTime = performance.now() - loadStartTime;
        console.log(`[🔄 DATA SYNC] ✅ Total load time: ${totalTime.toFixed(2)}ms`);
        
        if (pollCount > 1) {
          console.log(`[🔄 DATA SYNC] ⏰ Next poll in 5000ms`);
        }
        
      } catch (error) {
        console.error('[LandingPage] Failed to load data:', error);
        setLoading(false);
      }
    };

    console.log('[🔄 DATA SYNC] 🚨 PERFORMANCE WARNING: Using POLLING (5s interval) instead of real-time subscription!');
    console.log('[🔄 DATA SYNC] 🚨 This means UI updates will be delayed by up to 5 seconds!');
    
    loadData();
    
    // Poll for updates every 5 seconds to catch shared canvas changes
    console.log('[🔄 DATA SYNC] ⏰ Starting 5-second polling interval...');
    const interval = setInterval(loadData, 5000);
    
    return () => {
      console.log('[🔄 DATA SYNC] 🛑 Stopping polling interval');
      clearInterval(interval);
    };
  }, [user]);

  // Combine and filter projects
  const allProjects = [...ownedProjects, ...sharedProjects];
  const filteredProjects = filter === 'owned' 
    ? ownedProjects 
    : filter === 'shared' 
      ? sharedProjects 
      : allProjects;


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
    
    // Show confirmation modal instead of browser confirm
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    // Set deleting state to show animation
    setDeletingProjectId(projectToDelete.id);
    setShowDeleteConfirm(false);

    try {
      // Wait for fade-out animation (600ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      // Delete the project
      await deleteProject(user.uid, projectToDelete.id, projectToDelete.canvasId);

      // Immediately remove from local state to prevent flicker
      setOwnedProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setSharedProjects(prev => prev.filter(p => p.id !== projectToDelete.id));

      // Clear deleting state
      setDeletingProjectId(null);
      setProjectToDelete(null);

      // Trigger reflow animation for remaining cards
      setTriggerReflow(true);
      setTimeout(() => setTriggerReflow(false), 600);
    } catch (error) {
      console.error('[LandingPage] ❌ Failed to delete project:', error);
      alert('Failed to delete project');
      setDeletingProjectId(null);
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: theme.background.page
      }}>
        <div style={{
          fontSize: '15px',
          color: theme.text.secondary,
          fontWeight: '400'
        }}>Loading projects...</div>
      </div>
    );
  }

  const canCreateMore = subscription.isPremium || ownedProjects.length < 3;
  const remainingProjects = subscription.isPremium ? '∞' : Math.max(0, 3 - ownedProjects.length);

  // Generate styles with current theme
  const styles = getStyles(theme);

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
        {/* Left Side - CollabCanvas Title */}
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            CollabCanvas
          </h1>
          <p style={styles.subtitle}>
            {ownedProjects.length} owned · {sharedProjects.length} shared
          </p>
        </div>
        
        {/* Right Side - All Actions */}
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
          
          {/* Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              background: theme.background.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border.medium}`,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
            title="Profile"
          >
            Profile
          </button>
          
          {/* Leaderboard Button */}
          <button
            onClick={() => setShowLeaderboardModal(true)}
            style={{
              background: theme.background.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border.medium}`,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
            title="Leaderboard"
          >
            Leaderboard
          </button>
          
          {/* Messaging Button */}
          <MessagingButton onOpenMessaging={(friend) => setSelectedFriendForChat(friend)} />

          {/* Themes Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              background: theme.background.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border.medium}`,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
            title="Themes"
          >
            Themes
          </button>
          
          {subscription.isPremium ? (
            <div style={styles.premiumBadge}>
              {subscription.tier === 'lifetime' ? 'Lifetime' : 'Premium'}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowCouponModal(true)}
                style={{
                  background: theme.background.card,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.medium}`,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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
                title="Have a coupon code?"
              >
                Coupon
              </button>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                style={{
                  background: theme.button.primary,
                  color: theme.text.inverse,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: theme.shadow.md,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.button.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.button.primary;
                }}
              >
                Upgrade
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              background: theme.background.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border.medium}`,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
                e.target.style.background = theme.background.elevated;
                e.target.style.borderColor = theme.border.strong;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'all') {
                e.target.style.background = theme.background.card;
                e.target.style.borderColor = theme.border.medium;
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
                e.target.style.background = theme.background.elevated;
                e.target.style.borderColor = theme.border.strong;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'owned') {
                e.target.style.background = theme.background.card;
                e.target.style.borderColor = theme.border.medium;
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
                e.target.style.background = theme.background.elevated;
                e.target.style.borderColor = theme.border.strong;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'shared') {
                e.target.style.background = theme.background.card;
                e.target.style.borderColor = theme.border.medium;
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
      
      {showSettingsModal && (
        <SettingsModal
          isPremium={subscription.isPremium}
          onShowUpgrade={() => {
            setShowSettingsModal(false);
            setShowSubscriptionModal(true);
          }}
          onClose={() => {
            console.log('[SETTINGS] Modal onClose called');
            setShowSettingsModal(false);
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showLeaderboardModal && (
        <LeaderboardModal
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}
      
      {selectedFriendForChat && (
        <DirectMessagingPanel
          friend={selectedFriendForChat}
          onClose={() => setSelectedFriendForChat(null)}
        />
      )}

      {/* Delete Confirmation - Matching Sign Out Style */}
      {showDeleteConfirm && (
        <div
          onClick={handleCloseDeleteConfirm}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `rgba(0, 0, 0, ${deleteConfirmVisible ? 0.5 : 0})`,
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
              background: theme.background.card,
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: theme.shadow.xl,
              fontFamily: "'Roboto Mono', monospace",
              opacity: deleteConfirmVisible ? 1 : 0,
              transform: deleteConfirmVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: theme.text.primary
            }}>
              Delete Project?
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: theme.text.secondary,
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseDeleteConfirm}
                style={{
                  padding: '10px 20px',
                  background: theme.background.card,
                  border: `1px solid ${theme.border.medium}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.text.primary,
                  cursor: 'pointer',
                  fontFamily: "'Roboto Mono', monospace",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
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
                <span style={{ fontSize: '16px' }}>✕</span>
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmVisible(false);
                  setTimeout(() => {
                    setShowDeleteConfirm(false);
                    handleConfirmDelete();
                  }, 300);
                }}
                style={{
                  padding: '10px 20px',
                  background: theme.button.primary,
                  border: `1px solid ${theme.button.primary}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.text.inverse,
                  cursor: 'pointer',
                  fontFamily: "'Roboto Mono', monospace",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.button.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.button.primary;
                }}
              >
                <span style={{ fontSize: '16px' }}>✓</span>
                Delete
              </button>
            </div>
          </div>
        </div>
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
              background: theme.background.card,
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: theme.shadow.xl,
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
              color: theme.text.primary
            }}>
              Sign Out?
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: theme.text.secondary,
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
                  background: theme.background.card,
                  border: `1px solid ${theme.border.medium}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.text.primary,
                  cursor: 'pointer',
                  fontFamily: "'Roboto Mono', monospace",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
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
                  background: theme.button.primary,
                  border: `1px solid ${theme.button.primary}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.text.inverse,
                  cursor: 'pointer',
                  fontFamily: "'Roboto Mono', monospace",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.button.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.button.primary;
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

// Generate styles function to use theme
const getStyles = (theme) => ({
  container: {
    minHeight: '100vh',
    background: theme.background.page,
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
    background: theme.background.card,
    padding: '20px 32px',
    borderRadius: '12px',
    boxShadow: theme.shadow.lg,
    border: `1px solid ${theme.border.normal}`
  },
  
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  
  headerRight: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: theme.text.primary,
    letterSpacing: '-0.02em'
  },
  
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: theme.text.secondary,
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
    background: theme.button.primary,
    color: theme.text.inverse,
    border: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow.md
  },
  
  couponButton: {
    background: theme.background.card,
    color: theme.text.primary,
    border: `1px solid ${theme.border.medium}`,
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow.md
  },
  
  logoutButton: {
    background: theme.background.card,
    color: theme.text.primary,
    border: `1px solid ${theme.border.medium}`,
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow.md
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
    background: theme.background.card,
    color: theme.text.secondary,
    border: `1px solid ${theme.border.medium}`,
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '400',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  filterButtonActive: {
    background: theme.button.primary,
    color: theme.text.inverse,
    borderColor: theme.button.primary
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
    background: theme.background.card,
    borderRadius: '12px',
    padding: '0',
    border: `1px solid ${theme.border.normal}`,
    boxShadow: theme.shadow.lg,
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
    background: theme.background.elevated,
    border: `2px dashed ${theme.border.medium}`
  },
  
  createIcon: {
    fontSize: '48px',
    color: theme.text.secondary,
    marginBottom: '8px'
  },
  
  createLabel: {
    fontSize: '15px',
    fontWeight: '500',
    color: theme.text.primary,
    marginBottom: '4px'
  },
  
  createLimit: {
    fontSize: '12px',
    color: theme.text.secondary,
    fontWeight: '400'
  },
  
  thumbnail: {
    width: '100%',
    height: '160px',
    background: theme.background.elevated,
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
    color: theme.text.primary,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  
  projectMeta: {
    fontSize: '12px',
    color: theme.text.secondary,
    fontWeight: '400'
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
    background: theme.isDark ? 'rgba(26, 29, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${theme.border.medium}`,
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow.md,
    color: theme.text.primary
  },
  
  deleteButton: {
    color: '#ef4444'
  },
  
  emptyState: {
    maxWidth: '1200px',
    margin: '60px auto',
    textAlign: 'center',
    padding: '40px 20px'
  }
});

