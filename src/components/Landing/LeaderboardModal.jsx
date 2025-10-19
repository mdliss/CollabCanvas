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
import { createPortal } from 'react-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, getUserRank } from '../../services/userProfile';
import { getFriendIds, removeFriend } from '../../services/friends';
import { getActivityData } from '../../services/dailyActivity';
import Avatar from '../Collaboration/Avatar';

export default function LeaderboardModal({ onClose }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserRank, setSelectedUserRank] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [popupPosition, setPopupPosition] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const profilePopupRef = useRef(null);
  
  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (selectedUserId) {
          setSelectedUserId(null);
          setPopupPosition(null);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedUserId]);

  // Load leaderboard data (filtered to friends only)
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // Get user's friend IDs first
        const friendIds = await getFriendIds(user.uid);
        
        // Include self in the leaderboard
        const userIdsToShow = [user.uid, ...friendIds];
        
        // Fetch all users
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('changesCount', 'desc'),
          limit(200) // Fetch more to ensure we get all friends
        );
        
        const snapshot = await getDocs(q);
        const allUsers = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        
        // Filter to only include self and friends
        const filteredUsers = allUsers.filter(u => userIdsToShow.includes(u.uid));
        
        // Sort by changes count (in case filtering affected order)
        filteredUsers.sort((a, b) => (b.changesCount || 0) - (a.changesCount || 0));
        
        setLeaderboard(filteredUsers);
        
        // Load REAL activity data for top contributors
        const topUsers = filteredUsers.slice(0, 10); // Top 10 for the graph
        const userIds = topUsers.map(u => u.uid);
        const activity = await getActivityData(userIds, 7);
        setActivityData(activity);
        
        setLoading(false);
      } catch (error) {
        console.error('[LeaderboardModal] Failed to load leaderboard:', error);
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [user]);

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
    if (!selectedUserId) {
      setPopupPosition(null);
      return;
    }

    const handleClickOutside = (e) => {
      if (profilePopupRef.current && !profilePopupRef.current.contains(e.target)) {
        setSelectedUserId(null);
        setPopupPosition(null);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedUserId(null);
        setPopupPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedUserId]);

  const handleUserClick = (userId, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate center position
    const left = rect.left + rect.width / 2;
    const top = rect.top + rect.height / 2;
    
    // Adjust if too close to edges
    const popupWidth = 320;
    const popupHeight = 400; // approximate without chart
    
    let finalLeft = left;
    let finalTop = top;
    
    // Keep popup within viewport bounds
    if (finalLeft - popupWidth / 2 < 10) {
      finalLeft = popupWidth / 2 + 10;
    } else if (finalLeft + popupWidth / 2 > viewportWidth - 10) {
      finalLeft = viewportWidth - popupWidth / 2 - 10;
    }
    
    if (finalTop - popupHeight / 2 < 10) {
      finalTop = popupHeight / 2 + 10;
    } else if (finalTop + popupHeight / 2 > viewportHeight - 10) {
      finalTop = viewportHeight - popupHeight / 2 - 10;
    }
    
    setPopupPosition({ left: finalLeft, top: finalTop });
    setSelectedUserId(userId);
  };

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

  const getUserColor = (index) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B4B4', '#A8E6CF'
    ];
    return colors[index % colors.length];
  };

  // Activity Chart Component
  const ActivityChart = ({ data, users, highlightUserId }) => {
    if (!data || data.length === 0) return null;

    const width = 420;
    const height = 300;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max value for scaling
    const maxValue = Math.max(...data.flatMap(d => 
      users.map(u => d[u.uid] || 0)
    ), 1);

    // Create points for each user
    const userLines = users.map((user, userIndex) => {
      const points = data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const value = d[user.uid] || 0;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        return `${x},${y}`;
      }).join(' ');

      const isHighlighted = user.uid === highlightUserId;
      const color = getUserColor(userIndex);

      return (
        <g key={user.uid}>
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={isHighlighted ? 3 : 1.5}
            strokeOpacity={isHighlighted ? 1 : 0.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {isHighlighted && data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const value = d[user.uid] || 0;
            const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={2}
                fill={color}
              />
            );
          })}
        </g>
      );
    });

    // X-axis labels (show all days for 7-day view)
    const xLabels = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      return (
        <text
          key={i}
          x={x}
          y={height - 8}
          textAnchor="middle"
          fontSize="9"
          fill={theme.text.tertiary}
        >
          {d.label}
        </text>
      );
    });

    return (
      <div style={{ 
        background: theme.background.elevated,
        borderRadius: '12px',
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '500',
            color: theme.text.secondary
          }}>
            Last 7 Days
          </div>
          <div style={{
            fontSize: '11px',
            color: theme.text.tertiary
          }}>
            Top {users.length} Contributors
          </div>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width={width} height={height} style={{ display: 'block' }}>
            {/* Legend */}
            <g>
              {users.slice(0, 5).map((user, i) => {
                const color = getUserColor(i);
                const isHighlighted = user.uid === highlightUserId;
                const x = width - 110;
                const y = 10 + i * 14;
                return (
                  <g key={user.uid} opacity={isHighlighted ? 1 : 0.6}>
                    <line
                      x1={x}
                      y1={y}
                      x2={x + 12}
                      y2={y}
                      stroke={color}
                      strokeWidth={isHighlighted ? 2 : 1.5}
                    />
                    <text
                      x={x + 16}
                      y={y + 4}
                      fontSize="9"
                      fill={theme.text.secondary}
                      fontWeight={isHighlighted ? '600' : '400'}
                    >
                      {(user.displayName || user.email?.split('@')[0] || 'User').substring(0, 12)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(factor => {
              const y = padding.top + chartHeight - (factor * chartHeight);
              return (
                <line
                  key={factor}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={theme.border.light}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
              );
            })}

            {/* Y-axis labels */}
            {[0, 0.5, 1].map(factor => {
              const y = padding.top + chartHeight - (factor * chartHeight);
              const value = Math.round(maxValue * factor);
              return (
                <text
                  key={factor}
                  x={padding.left - 5}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={theme.text.tertiary}
                >
                  {value}
                </text>
              );
            })}

            {/* User lines */}
            {userLines}

            {/* X-axis labels */}
            {xLabels}
          </svg>
        </div>
      </div>
    );
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
      maxWidth: '1100px',
      width: '95%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: theme.shadow.xl,
      border: `1px solid ${theme.border.normal}`,
      position: 'relative',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'visible'
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

    contentContainer: {
      flex: 1,
      display: 'flex',
      gap: '24px',
      minHeight: 0
    },

    listContainer: {
      flex: '0 0 540px',
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingLeft: '4px',
      paddingRight: '4px'
    },

    chartContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
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

        <div style={styles.contentContainer}>
          <div style={styles.listContainer}>
          {loading ? (
            <div style={styles.loading}>
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👥</div>
              <p style={styles.emptyText}>
                No friends yet! Add friends via the Messaging button to see them on the leaderboard.
              </p>
            </div>
          ) : (
            leaderboard.map((leaderboardUser, index) => {
              const rank = index + 1;
              const isSelected = selectedUserId === leaderboardUser.uid;
              
              return (
                <div
                  key={leaderboardUser.uid}
                  style={styles.userItem(rank)}
                  onClick={(e) => handleUserClick(leaderboardUser.uid, e)}
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
                </div>
              );
            })
          )}
          </div>

          {/* Chart Container */}
          <div style={styles.chartContainer}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: theme.text.primary,
              marginBottom: '16px'
            }}>
              Activity Timeline
            </div>
            {activityData.length > 0 && leaderboard.length > 0 ? (
              <ActivityChart 
                data={activityData}
                users={leaderboard.slice(0, 10)}
                highlightUserId={selectedUserId}
              />
            ) : (
              <div style={styles.loading}>
                Loading activity data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Popup - Rendered with Portal */}
      {selectedUserId && popupPosition && createPortal(
        <div
          ref={profilePopupRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${popupPosition.left}px`,
            top: `${popupPosition.top}px`,
            transform: 'translate(-50%, -50%)',
            width: '320px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: theme.background.card,
            borderRadius: '12px',
            boxShadow: theme.shadow.xl,
            border: `2px solid ${theme.button.primary}`,
            zIndex: 999999,
            padding: '20px'
          }}
        >
          {isLoadingProfile ? (
            <div style={{ textAlign: 'center', padding: '20px', color: theme.text.tertiary }}>
              Loading...
            </div>
          ) : (() => {
            const user = leaderboard.find(u => u.uid === selectedUserId);
            const rank = leaderboard.findIndex(u => u.uid === selectedUserId) + 1;
            if (!user) return null;
            
            return (
              <>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <Avatar
                    src={user.photoURL}
                    name={user.displayName || user.email}
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
                    {user.displayName || user.email?.split('@')[0] || 'Anonymous'}
                  </h4>
                  {user.email && (
                    <p style={{ 
                      fontSize: '13px', 
                      color: theme.text.secondary,
                      margin: 0
                    }}>
                      {user.email}
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
                      {formatCount(user.changesCount)}
                    </div>
                  </div>
                </div>

                {/* Remove Friend Button - Only show for friends (not yourself) */}
                {user.uid !== selectedUserId && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove from friends? You'll no longer see them on the leaderboard.`)) return;
                      try {
                        await removeFriend(user.uid, selectedUserId);
                        setSelectedUserId(null);
                        setPopupPosition(null);
                        // Reload leaderboard to reflect changes
                        window.location.reload();
                      } catch (error) {
                        console.error('[LeaderboardModal] Failed to remove friend:', error);
                        alert('Failed to remove friend');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'transparent',
                      border: `1px solid ${theme.border.medium}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: theme.text.secondary,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#fee2e2';
                      e.target.style.borderColor = '#ef4444';
                      e.target.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = theme.border.medium;
                      e.target.style.color = theme.text.secondary;
                    }}
                  >
                    Remove Friend
                  </button>
                )}

                <div style={{
                  fontSize: '12px',
                  color: theme.text.tertiary,
                  textAlign: 'center'
                }}>
                  Click outside to close
                </div>
              </>
            );
          })()}
        </div>,
        document.body
      )}
    </div>
  );
}

