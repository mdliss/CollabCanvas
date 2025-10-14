import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * EmailLoginModal - Modal for email/password authentication
 * Supports both login and signup flows
 */
export default function EmailLoginModal({ onClose }) {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      onClose();
    } catch (err) {
      // Clean up error messages
      const message = err.code 
        ? err.code.replace('auth/', '').replace(/-/g, ' ')
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10002,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            color: '#666',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1
          }}
        >
          ×
        </button>

        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600' }}>
          {isSignup ? 'Create Account' : 'Sign In'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignup && (
            <div>
              <label
                htmlFor="displayName"
                style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required={isSignup}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4285f4'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4285f4'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4285f4'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            {isSignup && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                At least 6 characters
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid #fecaca'
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: loading ? '#ccc' : '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#357ae8')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#4285f4')}
          >
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4285f4',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px',
                padding: 0
              }}
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

