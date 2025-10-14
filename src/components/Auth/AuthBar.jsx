import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../Collaboration/Avatar';

/**
 * AuthBar - Top-center authentication status and controls
 * Unauthed: Shows Google Sign-In and Email/Password options
 * Authed: Shows user avatar, name, and dropdown menu
 */
export default function AuthBar({ onShowEmailLogin }) {
  const { user, loginWithGoogle, logout, error } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showError, setShowError] = useState(false);
  const dropdownRef = useRef(null);

  // Show error toast when auth error occurs
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      // Error already handled in AuthContext
      console.error('[AuthBar] Google sign-in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      setShowDropdown(false);
      await logout();
    } catch (err) {
      console.error('[AuthBar] Sign out failed:', err);
    }
  };

  // Get user display info
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const photoURL = user?.photoURL;
  
  // Generate color for avatar fallback (consistent with presence system)
  const getUserColor = () => {
    if (!user?.uid) return '#4285f4';
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", 
      "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    ];
    const hash = user.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!user) {
    // UNAUTHED STATE
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '0 0 12px 12px',
          padding: '12px 24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderTop: 'none'
        }}
      >
        {/* Error toast */}
        {showError && error && (
          <div
            style={{
              position: 'fixed',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(220, 38, 38, 0.95)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              zIndex: 10001,
              maxWidth: '400px'
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          aria-label="Sign in with Google"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#357ae8';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#4285f4';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#fff" d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"/>
            <path fill="#fff" d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#fff" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={onShowEmailLogin}
          aria-label="Sign in with email"
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f5f5f5';
            e.target.style.borderColor = '#bbb';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = '#ddd';
          }}
        >
          Sign in with Email
        </button>
      </div>
    );
  }

  // AUTHED STATE
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '0 0 12px 12px',
        padding: '10px 20px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderTop: 'none'
      }}
    >
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="User menu"
          aria-expanded={showDropdown}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f5f5f5';
            e.target.style.borderColor = '#e0e0e0';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'transparent';
          }}
        >
          {/* Avatar */}
          <Avatar 
            src={photoURL}
            name={displayName}
            color={getUserColor()}
            size="md"
          />

          {/* Display name */}
          <span
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#333',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {displayName}
          </span>

          {/* Chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            style={{
              transition: 'transform 0.2s ease',
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <path
              fill="#666"
              d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0e0e0',
              minWidth: '180px',
              overflow: 'hidden',
              zIndex: 10001
            }}
          >
            {/* Status chip */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '13px',
                color: '#666'
              }}
            >
              Signed in as <strong>{displayName}</strong>
            </div>

            {/* Menu items */}
            <button
              onClick={() => setShowDropdown(false)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '14px',
                color: '#333',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              My Account
            </button>

            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: '#dc2626',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

