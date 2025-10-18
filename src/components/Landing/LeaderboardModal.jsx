/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Leaderboard Modal - Top Users by Changes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Displays users ranked by total number of changes made across all canvases.
 * Shows user profile pictures, names, and change counts.
 * 
 * FEATURES:
 * - Real-time leaderboard from Firestore
 * - User profile pictures and names
 * - Change count display
 * - Top 3 highlighted with special styling
 * - Theme-aware styling
 * - Smooth transitions
 */

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile, getUserRank } from '../../services/userProfile';
import Avatar from '../Collaboration/Avatar';

export default function LeaderboardModal({ onClose }) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserRank, setSelectedUserRank] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const profilePopupRef = useRef(null);
  
  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('changesCount', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        
        setLeaderboard(users);
        setLoading(false);
      } catch (error) {
        console.error('[LeaderboardModal] Failed to load leaderboard:', error);
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  // Load user profile when leaderboard item is clicked
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserProfile(null);
      setSelectedUserRank(null);
      return;
    }

    setIsLoadingProfile(true);
    Promise.all([
      getUserProfile(selectedUserId),
      getUserRank(selectedUserId)
    ])
      .then(([profile, rank]) => {
        setSelectedUserProfile(profile);
        setSelectedUserRank(rank);
        setIsLoadingProfile(false);
      })
      .catch(err => {
        console.error('[LeaderboardModal] Failed to load profile:', err);
        setIsLoadingProfile(false);
      });
  }, [selectedUserId]);

  // Click outside to close profile popup
  useEffect(() => {
    if (!selectedUserId) return;

    const handleClickOutside = (e) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(e.target)) {
        setSelectedUserId(null);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedUserId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedUserId]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count || 0;
  };

  const getRankBadge = (rank) => {
    return `${rank}`;
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return theme.text.secondary;
    }
  };

  const getRankBackground = (rank) => {
    switch (rank) {
      case 1: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
      case 2: return 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)';
      case 3: return 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)';
      default: return 'transparent';
    }
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
      maxHeight: '90vh',
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
      textAlign: 'center',
      letterSpacing: '-0.02em'
    },
    
    subtitle: {
      margin: '0 0 32px 0',
      fontSize: '13px',
      color: theme.text.secondary,
      textAlign: 'center',
      fontWeight: '400'
    },

    listContainer: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      marginBottom: '16px'
    },

    userItem: (rank) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      background: rank <= 3 ? theme.background.elevated : theme.background.card,
      borderRadius: '12px',
      border: rank <= 3 ? `2px solid ${getRankColor(rank)}` : `1px solid ${theme.border.light}`,
      marginBottom: '12px',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative'
    }),

    rankBadge: (rank) => ({
      fontSize: rank <= 3 ? '20px' : '16px',
      fontWeight: '700',
      color: rank <= 3 ? '#FFFFFF' : getRankColor(rank),
      minWidth: rank <= 3 ? '48px' : '40px',
      height: rank <= 3 ? '48px' : '40px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: getRankBackground(rank),
      borderRadius: rank <= 3 ? '50%' : '8px',
      boxShadow: rank <= 3 ? theme.shadow.md : 'none'
    }),

    userInfo: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: 0,
      overflow: 'hidden'
    },

    userName: {
      fontSize: '15px',
      fontWeight: '600',
      color: theme.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },

    userStats: {
      fontSize: '12px',
      color: theme.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },

    changeCount: {
      fontSize: '18px',
      fontWeight: '700',
      color: theme.button.primary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '2px'
    },

    changeLabel: {
      fontSize: '11px',
      fontWeight: '400',
      color: theme.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },

    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: theme.text.secondary,
      fontSize: '14px'
    },

    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center'
    },

    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: 0.5
    },

    emptyText: {
      fontSize: '14px',
      color: theme.text.secondary,
      lineHeight: '1.5'
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

        <div style={{ marginBottom: '24px' }}>
          <h3 style={styles.title}>Leaderboard</h3>
          <p style={styles.subtitle}>Top contributors ranked by total changes made</p>
        </div>

        <div style={styles.listContainer}>
          {loading ? (
            <div style={styles.loading}>
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <p style={styles.emptyText}>
                No data yet. Start making changes to appear on the leaderboard!
              </p>
            </div>
          ) : (
            leaderboard.map((leaderboardUser, index) => {
              const rank = index + 1;
              const isSelected = selectedUserId === leaderboardUser.uid;
              
              return (
                <div
                  key={leaderboardUser.uid}
                  style={{
                    ...styles.userItem(rank),
                    position: 'relative'
                  }}
                  onClick={() => setSelectedUserId(leaderboardUser.uid)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = theme.shadow.md;
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={styles.rankBadge(rank)}>
                    {getRankBadge(rank)}
                  </div>
                  
                  <Avatar
                    src={leaderboardUser.photoURL}
                    name={leaderboardUser.displayName || leaderboardUser.email}
                    size="md"
                    style={{ flexShrink: 0 }}
                  />
                  
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>
                      {leaderboardUser.displayName || leaderboardUser.email?.split('@')[0] || 'Anonymous'}
                    </div>
                    <div style={styles.userStats}>
                      {leaderboardUser.email}
                    </div>
                  </div>
                  
                  <div style={styles.changeCount}>
                    <span>{formatCount(leaderboardUser.changesCount)}</span>
                    <span style={styles.changeLabel}>Changes</span>
                  </div>

                  {/* Profile Popup */}
                  {isSelected && (
                    <div
                      ref={profilePopupRef}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '320px',
                        background: theme.background.card,
                        borderRadius: '12px',
                        boxShadow: theme.shadow.xl,
                        border: `2px solid ${theme.button.primary}`,
                        zIndex: 100001,
                        padding: '20px'
                      }}
                    >
                      {isLoadingProfile ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme.text.tertiary }}>
                          Loading...
                        </div>
                      ) : (
                        <>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            marginBottom: '16px'
                          }}>
                            <Avatar
                              src={leaderboardUser.photoURL}
                              name={leaderboardUser.displayName || leaderboardUser.email}
                              size="lg"
                              style={{ 
                                width: '72px', 
                                height: '72px',
                                fontSize: '28px',
                                marginBottom: '12px'
                              }}
                            />
                            <h4 style={{ 
                              fontSize: '18px', 
                              fontWeight: '600', 
                              color: theme.text.primary,
                              margin: '0 0 4px 0'
                            }}>
                              {leaderboardUser.displayName || leaderboardUser.email?.split('@')[0] || 'Anonymous'}
                            </h4>
                            {leaderboardUser.email && (
                              <p style={{ 
                                fontSize: '13px', 
                                color: theme.text.secondary,
                                margin: 0
                              }}>
                                {leaderboardUser.email}
                              </p>
                            )}
                          </div>
                          
                          {selectedUserProfile?.bio && (
                            <div style={{
                              padding: '12px',
                              background: theme.background.elevated,
                              borderRadius: '8px',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: theme.text.secondary,
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                Bio
                              </div>
                              <p style={{
                                fontSize: '13px',
                                color: theme.text.primary,
                                margin: 0,
                                lineHeight: '1.4',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                                {selectedUserProfile.bio}
                              </p>
                            </div>
                          )}

                          {/* Stats */}
                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              flex: 1,
                              padding: '12px',
                              background: theme.background.elevated,
                              borderRadius: '8px',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                fontSize: '11px',
                                color: theme.text.secondary,
                                marginBottom: '4px'
                              }}>
                                Rank
                              </div>
                              <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: getRankColor(rank)
                              }}>
                                #{rank}
                              </div>
                            </div>
                            <div style={{
                              flex: 1,
                              padding: '12px',
                              background: theme.background.elevated,
                              borderRadius: '8px',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                fontSize: '11px',
                                color: theme.text.secondary,
                                marginBottom: '4px'
                              }}>
                                Changes
                              </div>
                              <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: theme.button.primary
                              }}>
                                {formatCount(leaderboardUser.changesCount)}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            fontSize: '12px',
                            color: theme.text.tertiary,
                            textAlign: 'center'
                          }}>
                            Click outside to close
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

