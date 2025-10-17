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

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../services/firebase';

const functions = getFunctions(app);

export default function SubscriptionModal({ onClose, currentProjectCount = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div onClick={handleBackdropClick} style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Close button */}
        {!loading && (
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            ×
          </button>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.icon}>✨</div>
          <h2 style={styles.title}>Upgrade to Premium</h2>
          <p style={styles.subtitle}>Unlock unlimited projects and premium features</p>
        </div>

        {/* Limit Warning (if at free tier limit) */}
        {currentProjectCount >= 3 && (
          <div style={styles.warning}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Project Limit Reached</div>
              <div style={{ fontSize: '14px' }}>
                You've reached the free tier limit of 3 projects. Upgrade to create unlimited canvases.
              </div>
            </div>
          </div>
        )}

        {/* Pricing Card */}
        <div style={styles.pricingCard}>
          <div style={styles.price}>
            <span style={styles.currency}>$</span>
            <span style={styles.amount}>9.99</span>
            <span style={styles.period}>/month</span>
          </div>
          
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Unlimited canvas projects</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Priority AI assistant access</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Advanced export options</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Premium support</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkmark}>✓</span>
              <span>Cancel anytime</span>
            </div>
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
              e.target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? 'Opening Stripe Checkout...' : 'Subscribe Now'}
        </button>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* Security Notice */}
        <div style={styles.securityNotice}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <span>Secure payment processed by Stripe</span>
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
    background: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 0, 0, 0.06)'
  },
  
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'transparent',
    border: 'none',
    fontSize: '32px',
    color: '#9ca3af',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827'
  },
  
  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.5'
  },
  
  warning: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    color: '#92400e'
  },
  
  pricingCard: {
    background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px',
    border: '1px solid rgba(139, 92, 246, 0.2)'
  },
  
  price: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#5b21b6'
  },
  
  currency: {
    fontSize: '24px',
    fontWeight: '600',
    verticalAlign: 'top'
  },
  
  amount: {
    fontSize: '56px',
    fontWeight: '700'
  },
  
  period: {
    fontSize: '18px',
    color: '#7c3aed'
  },
  
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    color: '#5b21b6'
  },
  
  checkmark: {
    fontSize: '20px',
    color: '#10b981',
    fontWeight: '700'
  },
  
  subscribeButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
    marginBottom: '16px'
  },
  
  error: {
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    border: '1px solid rgba(153, 27, 27, 0.2)'
  },
  
  securityNotice: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }
};

