/**
 * Coupon Code Redemption Modal
 * 
 * Allows users to enter coupon codes for lifetime premium access.
 */

import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../services/firebase';
import { useTheme } from '../../contexts/ThemeContext';

const functions = getFunctions(app);

export default function CouponModal({ onClose, onSuccess }) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Trigger fade out when success
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        setIsVisible(false);
      }, 1200);
    }
  }, [success]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading && !success) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [loading, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('[Coupon] Redeeming code:', code);
      
      const redeemCoupon = httpsCallable(functions, 'redeemCoupon');
      const result = await redeemCoupon({ code: code.trim() });

      const { success: isSuccess, message, tier } = result.data;

      if (isSuccess) {
        setSuccess(message);
        console.log('[Coupon] ✅ Code redeemed successfully:', tier);
        
        // Close modal and refresh after 1.5 seconds
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1500);
      }

    } catch (err) {
      console.error('[Coupon] Redemption error:', err);
      setError(err.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

  const styles = getStyles(theme);

  return (
    <div 
      onClick={handleBackdropClick} 
      style={{
        ...styles.backdrop,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div style={{
        ...styles.modal,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {!loading && !success && (
          <button
            onClick={handleClose}
            style={styles.closeButton}
            onMouseEnter={(e) => e.target.style.color = theme.text.primary}
            onMouseLeave={(e) => e.target.style.color = theme.text.tertiary}
          >
            ×
          </button>
        )}

        <h3 style={styles.title}>Enter Coupon Code</h3>
        <p style={styles.subtitle}>
          Have a coupon for lifetime premium? Enter it below.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="COUPON-CODE"
            disabled={loading || !!success}
            autoFocus
            maxLength={50}
            style={{
              ...styles.input,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.border.focus;
              e.target.style.background = theme.background.inputFocus;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.border.medium;
              e.target.style.background = theme.background.input;
            }}
          />

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              ✓ {success}
            </div>
          )}

          {!success && (
            <button
              type="submit"
              disabled={!code.trim() || loading}
              style={{
                ...styles.submitButton,
                opacity: !code.trim() || loading ? 0.5 : 1,
                cursor: !code.trim() || loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (code.trim() && !loading) {
                  e.target.style.background = theme.button.primaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (code.trim() && !loading) {
                  e.target.style.background = theme.button.primary;
                }
              }}
            >
              {loading ? 'Validating...' : 'Redeem Code'}
            </button>
          )}
        </form>

        <div style={styles.hint}>
          Valid codes: COLLABPRO2025, EARLYBIRD, FOUNDER
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.backdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10003,
    backdropFilter: 'blur(4px)'
  },
  
  modal: {
    background: theme.background.card,
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '420px',
    width: '90%',
    boxShadow: theme.shadow.xl,
    border: `1px solid ${theme.border.normal}`,
    position: 'relative'
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
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
    letterSpacing: '-0.02em'
  },
  
  subtitle: {
    margin: '0 0 28px 0',
    fontSize: '14px',
    color: theme.text.secondary,
    textAlign: 'center',
    fontWeight: '400'
  },
  
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  input: {
    padding: '14px 16px',
    border: `1px solid ${theme.border.medium}`,
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: theme.background.input,
    color: theme.text.primary,
    fontWeight: '600'
  },
  
  error: {
    background: theme.isDark ? '#3f1e1e' : '#fee2e2',
    color: theme.isDark ? '#f87171' : '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    textAlign: 'center',
    border: theme.isDark ? '1px solid rgba(248, 113, 113, 0.2)' : '1px solid rgba(153, 27, 27, 0.15)'
  },
  
  success: {
    background: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
    color: theme.isDark ? '#34d399' : '#065f46',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500',
    border: theme.isDark ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(6, 95, 70, 0.15)'
  },
  
  submitButton: {
    background: theme.button.primary,
    color: theme.text.inverse,
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  hint: {
    marginTop: '20px',
    fontSize: '12px',
    color: theme.text.tertiary,
    textAlign: 'center',
    fontWeight: '400'
  }
});

