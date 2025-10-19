/**
 * ═══════════════════════════════════════════════════════════════════════════
 * User Profile View Modal - View Other Users' Profiles
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Read-only view of another user's profile showing:
 * - Profile picture and name
 * - Bio
 * - Social media links
 * - Stats (member since, leaderboard rank, total changes)
 * 
 * Used from: Leaderboard, Friends list, Friend requests, Message headers
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile } from '../../services/userProfile';
import Avatar from '../Collaboration/Avatar';
import PremiumBadge from '../UI/PremiumBadge';

// Social Media Icons (reused from ProfileModal)
const XIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill={color}/>
  </svg>
);

const GitHubIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill={color}/>
  </svg>
);

const LinkedInIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill={color}/>
  </svg>
);

const InstagramIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill={color}/>
  </svg>
);

const YouTubeIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill={color}/>
  </svg>
);

const TwitchIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill={color}/>
  </svg>
);

export default function UserProfileView({ userId, userName, userEmail, userPhoto, onClose, rank, wide = false }) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Load user profile
  useEffect(() => {
    if (userId) {
      setLoading(true);
      getUserProfile(userId)
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('[UserProfileView] Failed to load profile:', err);
          setLoading(false);
        });
    }
  }, [userId]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleBackdropClick = (e) => {
    e.stopPropagation(); // Prevent closing parent modals/panels
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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
      zIndex: 10004,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    modal: {
      background: theme.background.card,
      borderRadius: '16px',
      padding: wide ? '36px 40px' : '32px',
      width: wide ? '800px' : '550px',
      maxWidth: '92vw',
      maxHeight: '88vh',
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
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: theme.text.primary,
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}>
            Profile
          </h3>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: theme.text.secondary,
            textAlign: 'center',
            fontWeight: '400'
          }}>
            View {userName || userEmail}'s profile
          </p>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {/* Profile Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: wide ? '28px' : '24px',
            padding: wide ? '32px' : '24px',
            background: theme.background.elevated,
            borderRadius: '12px',
            border: `1px solid ${theme.border.light}`
          }}>
            <Avatar
              src={userPhoto || profile?.photoURL}
              name={userName || profile?.displayName || userEmail}
              size="lg"
              style={{
                width: wide ? '96px' : '80px',
                height: wide ? '96px' : '80px',
                fontSize: wide ? '38px' : '32px',
                borderWidth: '3px',
                marginBottom: wide ? '18px' : '14px'
              }}
            />
            <h3 style={{
              fontSize: wide ? '22px' : '19px',
              fontWeight: '600',
              color: theme.text.primary,
              margin: '0 0 8px 0',
              textAlign: 'center'
            }}>
              {userName || profile?.displayName || userEmail?.split('@')[0] || 'User'}
            </h3>
            {userEmail && (
              <p style={{
                fontSize: wide ? '15px' : '14px',
                color: theme.text.secondary,
                margin: 0,
                textAlign: 'center'
              }}>
                {userEmail}
              </p>
            )}
          </div>

          {loading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: theme.text.tertiary
            }}>
              Loading...
            </div>
          ) : (
            <>
              {/* Bio Section */}
              {profile?.bio && (
                <div style={{
                  padding: wide ? '24px 28px' : '20px 24px',
                  background: theme.background.elevated,
                  borderRadius: '12px',
                  border: `1px solid ${theme.border.light}`,
                  marginBottom: wide ? '20px' : '18px'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: wide ? '13px' : '12px',
                    fontWeight: '600',
                    color: theme.text.primary,
                    marginBottom: wide ? '14px' : '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Bio
                  </label>
                  <p style={{
                    margin: 0,
                    fontSize: wide ? '15px' : '14px',
                    color: theme.text.primary,
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Social Links */}
              {(profile?.socialLinks?.twitter || profile?.socialLinks?.github || profile?.socialLinks?.linkedin ||
                profile?.socialLinks?.instagram || profile?.socialLinks?.youtube || profile?.socialLinks?.twitch) && (
                <div style={{
                  padding: wide ? '24px 28px' : '20px 24px',
                  background: theme.background.elevated,
                  borderRadius: '12px',
                  border: `1px solid ${theme.border.light}`,
                  marginBottom: wide ? '20px' : '18px'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: wide ? '13px' : '12px',
                    fontWeight: '600',
                    color: theme.text.primary,
                    marginBottom: wide ? '16px' : '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Social Links
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: wide ? '10px' : '9px' }}>
                    {profile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: wide ? '12px' : '10px',
                          padding: wide ? '12px 16px' : '10px 14px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: wide ? '15px' : '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <XIcon size={wide ? 18 : 16} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>@{profile.socialLinks.twitter.replace('@', '')}</span>
                      </a>
                    )}
                    {profile.socialLinks.github && (
                      <a
                        href={`https://github.com/${profile.socialLinks.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: wide ? '12px' : '10px',
                          padding: wide ? '12px 16px' : '10px 14px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: wide ? '15px' : '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <GitHubIcon size={wide ? 18 : 16} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.github}</span>
                      </a>
                    )}
                    {profile.socialLinks.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: wide ? '12px' : '10px',
                          padding: wide ? '12px 16px' : '10px 14px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: wide ? '15px' : '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <LinkedInIcon size={wide ? 18 : 16} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.linkedin}</span>
                      </a>
                    )}
                    {profile.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: wide ? '12px' : '10px',
                          padding: wide ? '12px 16px' : '10px 14px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: wide ? '15px' : '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <InstagramIcon size={wide ? 18 : 16} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>@{profile.socialLinks.instagram.replace('@', '')}</span>
                      </a>
                    )}
                    {profile.socialLinks.youtube && (
                      <a
                        href={`https://youtube.com/${profile.socialLinks.youtube.startsWith('@') ? profile.socialLinks.youtube : '@' + profile.socialLinks.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: wide ? '12px' : '10px',
                          padding: wide ? '12px 16px' : '10px 14px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: wide ? '15px' : '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <YouTubeIcon size={wide ? 18 : 16} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.youtube}</span>
                      </a>
                    )}
                    {profile.socialLinks.twitch && (
                      <a
                        href={`https://twitch.tv/${profile.socialLinks.twitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: wide ? '12px' : '10px',
                          padding: wide ? '12px 16px' : '10px 14px',
                          background: theme.background.card,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border.light}`,
                          fontSize: wide ? '15px' : '14px',
                          color: theme.text.primary,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.elevated;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.card;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <TwitchIcon size={wide ? 18 : 16} color={theme.text.secondary} />
                        <span style={{ fontWeight: '500' }}>{profile.socialLinks.twitch}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Section */}
              <div style={{
                padding: wide ? '24px 28px' : '20px 24px',
                background: theme.background.elevated,
                borderRadius: '12px',
                border: `1px solid ${theme.border.light}`
              }}>
                {profile?.createdAt && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: wide ? '15px' : '14px',
                    marginBottom: wide ? '14px' : '12px',
                    color: theme.text.secondary,
                    padding: wide ? '12px 0' : '10px 0'
                  }}>
                    <span style={{ fontWeight: '500' }}>Member Since</span>
                    <span style={{ color: theme.text.primary, fontWeight: '600' }}>{formatDate(profile.createdAt)}</span>
                  </div>
                )}
                {rank && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: wide ? '15px' : '14px',
                    marginBottom: wide ? '14px' : '12px',
                    color: theme.text.secondary,
                    padding: wide ? '12px 0' : '10px 0',
                    borderTop: profile?.createdAt ? `1px solid ${theme.border.light}` : 'none'
                  }}>
                    <span style={{ fontWeight: '500' }}>Leaderboard Rank</span>
                    <span style={{ color: theme.text.primary, fontWeight: '600' }}>#{rank}</span>
                  </div>
                )}
                {profile?.changesCount !== undefined && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: wide ? '15px' : '14px',
                    color: theme.text.secondary,
                    padding: wide ? '12px 0' : '10px 0',
                    borderTop: (profile?.createdAt || rank) ? `1px solid ${theme.border.light}` : 'none'
                  }}>
                    <span style={{ fontWeight: '500' }}>Total Changes</span>
                    <span style={{ color: theme.text.primary, fontWeight: '600' }}>{profile.changesCount || 0}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

