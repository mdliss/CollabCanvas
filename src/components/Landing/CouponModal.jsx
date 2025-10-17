/**
 * Coupon Code Redemption Modal
 * 
 * Allows users to enter coupon codes for lifetime premium access.
 */

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../services/firebase';

const functions = getFunctions(app);

export default function CouponModal({ onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div onClick={handleBackdropClick} style={styles.backdrop}>
      <div style={styles.modal}>
        {!loading && !success && (
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => e.target.style.color = '#2c2e33'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
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
              e.target.style.borderColor = '#2c2e33';
              e.target.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              e.target.style.background = '#fafafa';
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
                  e.target.style.background = '#1a1c1f';
                }
              }}
              onMouseLeave={(e) => {
                if (code.trim() && !loading) {
                  e.target.style.background = '#2c2e33';
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

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10003,
    backdropFilter: 'blur(4px)'
  },
  
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '420px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    position: 'relative'
  },
  
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    color: '#9ca3af',
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
    color: '#2c2e33',
    textAlign: 'center',
    letterSpacing: '-0.02em'
  },
  
  subtitle: {
    margin: '0 0 28px 0',
    fontSize: '14px',
    color: '#646669',
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
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#fafafa',
    fontWeight: '600'
  },
  
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    textAlign: 'center',
    border: '1px solid rgba(153, 27, 27, 0.15)'
  },
  
  success: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500',
    border: '1px solid rgba(6, 95, 70, 0.15)'
  },
  
  submitButton: {
    background: '#2c2e33',
    color: '#ffffff',
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
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '400'
  }
};

