/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Subscription Modal - Stripe Checkout Integration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Displays premium subscription offering with Stripe checkout.
 * 
 * PRICING:
 * - Premium: $9.99/month
 * - Benefits: Unlimited projects, priority support
 * 
 * FLOW:
 * 1. User clicks "Upgrade to Premium"
 * 2. Modal shows features and pricing
 * 3. User clicks "Subscribe Now"
 * 4. Calls Cloud Function to create Stripe checkout session
 * 5. Redirects to Stripe hosted checkout
 * 6. After payment, webhook updates Firestore
 * 7. User returns to app with premium access
 */

import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../services/firebase';

const functions = getFunctions(app);

export default function SubscriptionModal({ onClose, currentProjectCount = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('[Subscription] Creating checkout session...');
      
      // Call Cloud Function to create Stripe checkout session
      const createCheckout = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckout({
        returnUrl: window.location.origin
      });

      const { url } = result.data;

      if (url) {
        console.log('[Subscription] Redirecting to Stripe checkout');
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (err) {
      console.error('[Subscription] Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
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
        {/* Close button */}
        {!loading && (
          <button
            onClick={handleClose}
            style={styles.closeButton}
            onMouseEnter={(e) => e.target.style.color = '#2c2e33'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            ×
          </button>
        )}

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Upgrade to Premium</h2>
          <p style={styles.subtitle}>Unlock unlimited projects and premium features</p>
        </div>

        {/* Limit Warning (if at free tier limit) */}
        {currentProjectCount >= 3 && (
          <div style={styles.warning}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Project Limit Reached</div>
            <div style={{ fontSize: '13px' }}>
              You've reached the free tier limit of 3 projects. Upgrade to create unlimited canvases.
            </div>
          </div>
        )}

        {/* Pricing */}
        <div style={styles.pricingCard}>
          <div style={styles.price}>
            <span style={styles.currency}>$</span>
            <span style={styles.amount}>9.99</span>
            <span style={styles.period}>/month</span>
          </div>
          
          <div style={styles.features}>
            <div style={styles.feature}>Unlimited canvas projects</div>
            <div style={styles.feature}>Share canvases with others</div>
            <div style={styles.feature}>Priority support</div>
            <div style={styles.feature}>Cancel anytime</div>
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            ...styles.subscribeButton,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = '#1a1c1f';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background = '#2c2e33';
            }
          }}
        >
          {loading ? 'Opening Stripe Checkout...' : 'Subscribe Now'}
        </button>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Security Notice */}
        <div style={styles.securityNotice}>
          Secure payment processed by Stripe
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
    zIndex: 10002,
    backdropFilter: 'blur(4px)'
  },
  
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '440px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    border: '1px solid rgba(0, 0, 0, 0.06)'
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
  
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  
  title: {
    margin: '0 0 8px 0',
    fontSize: '22px',
    fontWeight: '600',
    color: '#2c2e33',
    letterSpacing: '-0.02em'
  },
  
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#646669',
    fontWeight: '400',
    lineHeight: '1.5'
  },
  
  warning: {
    background: '#fef3c7',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px',
    color: '#92400e',
    fontSize: '14px'
  },
  
  pricingCard: {
    background: '#fafafa',
    borderRadius: '12px',
    padding: '28px',
    marginBottom: '24px',
    border: '1px solid rgba(0, 0, 0, 0.06)'
  },
  
  price: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#2c2e33'
  },
  
  currency: {
    fontSize: '20px',
    fontWeight: '500',
    verticalAlign: 'top'
  },
  
  amount: {
    fontSize: '48px',
    fontWeight: '600'
  },
  
  period: {
    fontSize: '16px',
    color: '#646669',
    fontWeight: '400'
  },
  
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  
  feature: {
    fontSize: '14px',
    color: '#2c2e33',
    fontWeight: '400',
    textAlign: 'center'
  },
  
  subscribeButton: {
    width: '100%',
    background: '#2c2e33',
    color: '#ffffff',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '16px'
  },
  
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid rgba(153, 27, 27, 0.15)',
    textAlign: 'center'
  },
  
  securityNotice: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '400'
  }
};

