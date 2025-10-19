/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modern Login Page - Toolbar Aesthetic
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Clean, modern login page matching the ShapeToolbar design language.
 * 
 * DESIGN SYSTEM:
 * - Same gradients as toolbar: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)
 * - Same shadows: 0 8px 32px rgba(0, 0, 0, 0.08)
 * - Same border radius: 16px
 * - Same border: 1px solid rgba(0, 0, 0, 0.06)
 * - Same backdrop blur: blur(10px)
 * 
 * FEATURES:
 * - Google Sign-In (primary CTA)
 * - Email/Password Sign-In (secondary)
 * - Centered layout
 * - Smooth animations
 * - Professional polish
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ModernLogin() {
  const { loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // Handle smooth transitions between auth modes
  const toggleEmailLogin = (show) => {
    setContentVisible(false);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setShowEmailLogin(show);
      setTimeout(() => {
        setContentVisible(true);
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err) {
      console.error('[Login] Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        if (!displayName.trim()) {
          setError('Display name is required');
          setLoading(false);
          return;
        }
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const message = err.code 
        ? err.code.replace('auth/', '').replace(/-/g, ' ')
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Generate styles with current theme
  const styles = getStyles(theme);

  return (
    <div style={styles.container}>
      {/* Main Login Card */}
      <div style={styles.card}>
        {/* Logo/Title */}
        <div style={styles.header}>
          <h1 style={styles.title}>CollabCanvas</h1>
          <p style={styles.tagline}>
            Real-time collaborative canvas with AI assistance
          </p>
        </div>

        {!showEmailLogin ? (
          <div style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Google Sign-In (Primary) */}
            <button
              onClick={handleGoogleLogin}
              style={styles.googleButton}
              onMouseEnter={(e) => {
                e.target.style.background = theme.background.elevated;
                e.target.style.borderColor = theme.border.strong;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.background.card;
                e.target.style.borderColor = theme.border.medium;
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine}></div>
            </div>

            {/* Email Sign-In (Secondary) */}
            <button
              onClick={() => toggleEmailLogin(true)}
              style={styles.emailButton}
              onMouseEnter={(e) => {
                e.target.style.background = theme.background.elevated;
                e.target.style.borderColor = theme.border.strong;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.background.card;
                e.target.style.borderColor = theme.border.medium;
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.primary} strokeWidth="2" style={{ marginRight: '12px' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Sign in with Email
            </button>
          </div>
        ) : (
          <div style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Email Login Form */}
            <form onSubmit={handleEmailSubmit} style={styles.form}>
              {isSignup && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    style={styles.input}
                    required={isSignup}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme.border.focus;
                      e.target.style.background = theme.background.inputFocus;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = theme.border.medium;
                      e.target.style.background = theme.background.elevated;
                    }}
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={styles.input}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2c2e33';
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.target.style.background = '#fafafa';
                  }}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2c2e33';
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.target.style.background = '#fafafa';
                  }}
                />
              </div>

              {error && (
                <div style={styles.errorBox}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = theme.button.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = theme.button.primary;
                  }
                }}
              >
                {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
              </button>

              <div style={styles.switchMode}>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError('');
                  }}
                  style={styles.switchButton}
                >
                  {isSignup ? 'Sign in' : 'Create one'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleEmailLogin(false);
                  setError('');
                }}
                style={styles.backButton}
                onMouseEnter={(e) => e.target.style.color = theme.text.primary}
                onMouseLeave={(e) => e.target.style.color = theme.text.secondary}
              >
                ← Back to options
              </button>
            </form>
          </div>
        )}

        {/* Features */}
        {!showEmailLogin && (
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureText}>Real-time collaboration</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureText}>AI-powered design assistant</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureText}>Automatic conflict prevention</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Generate styles function to use theme
const getStyles = (theme) => ({
  container: {
    minHeight: '100vh',
    background: theme.background.page,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  },
  
  card: {
    background: theme.background.card,
    borderRadius: '16px',
    padding: '60px 50px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: theme.shadow.xl,
    border: `1px solid ${theme.border.normal}`,
    textAlign: 'center'
  },
  
  header: {
    marginBottom: '48px'
  },
  
  title: {
    margin: '0 0 12px 0',
    fontSize: '28px',
    fontWeight: '600',
    color: theme.text.primary,
    letterSpacing: '-0.02em'
  },
  
  tagline: {
    margin: 0,
    fontSize: '14px',
    color: theme.text.secondary,
    fontWeight: '400',
    lineHeight: '1.6'
  },
  
  googleButton: {
    width: '100%',
    background: theme.background.card,
    border: `1px solid ${theme.border.medium}`,
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.text.primary,
    boxShadow: theme.shadow.md,
    marginBottom: '16px'
  },
  
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    gap: '12px'
  },
  
  dividerLine: {
    flex: 1,
    height: '1px',
    background: theme.border.medium
  },
  
  dividerText: {
    fontSize: '12px',
    color: theme.text.secondary,
    fontWeight: '400'
  },
  
  emailButton: {
    width: '100%',
    background: theme.background.card,
    border: `1px solid ${theme.border.medium}`,
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.text.primary,
    boxShadow: theme.shadow.md
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left'
  },
  
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: theme.text.primary
  },
  
  input: {
    padding: '12px 14px',
    border: `1px solid ${theme.border.medium}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: theme.background.elevated,
    color: theme.text.primary
  },
  
  errorBox: {
    background: theme.isDark ? '#3f1e1e' : '#fee2e2',
    color: theme.isDark ? '#f87171' : '#991b1b',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: theme.isDark ? '1px solid rgba(248, 113, 113, 0.2)' : '1px solid rgba(153, 27, 27, 0.15)',
    textAlign: 'center'
  },
  
  submitButton: {
    width: '100%',
    background: theme.button.primary,
    color: theme.text.inverse,
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow.md
  },
  
  switchMode: {
    textAlign: 'center',
    fontSize: '13px',
    color: theme.text.secondary
  },
  
  switchButton: {
    background: 'transparent',
    border: 'none',
    color: theme.text.primary,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '13px',
    fontWeight: '500',
    padding: 0
  },
  
  backButton: {
    background: 'transparent',
    border: 'none',
    color: theme.text.secondary,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '400',
    padding: '8px',
    transition: 'color 0.2s ease',
    textAlign: 'center'
  },
  
  features: {
    marginTop: '36px',
    paddingTop: '28px',
    borderTop: `1px solid ${theme.border.normal}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  
  feature: {
    fontSize: '13px',
    color: theme.text.primary,
    textAlign: 'center',
    fontWeight: '400'
  },
  
  featureText: {
    fontWeight: '400'
  }
});

