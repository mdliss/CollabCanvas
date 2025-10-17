/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Coupon Code System - Lifetime Premium Access
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Validates coupon codes for lifetime premium access.
 * 
 * VALID CODES:
 * - COLLABPRO2025 - Lifetime premium
 * - EARLYBIRD - Lifetime premium
 * - Custom codes can be added to validCoupons map
 * 
 * USAGE:
 * User enters code → Cloud Function validates → Updates Firestore isPremium: true
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Valid coupon codes (add more as needed)
const validCoupons: Record<string, { type: string; description: string }> = {
  'COLLABPRO2025': {
    type: 'lifetime_premium',
    description: 'Lifetime Premium Access'
  },
  'EARLYBIRD': {
    type: 'lifetime_premium',
    description: 'Early Bird Lifetime Premium'
  },
  'FOUNDER': {
    type: 'lifetime_premium',
    description: 'Founder Edition Lifetime Premium'
  }
};

/**
 * Redeem Coupon Code
 * 
 * Validates coupon code and grants lifetime premium if valid.
 */
export const redeemCoupon = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userId = context.auth.uid;
  const { code } = data;
  
  if (!code || typeof code !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Coupon code required');
  }
  
  const normalizedCode = code.trim().toUpperCase();
  
  console.log('[Coupon] Redemption attempt:', { userId, code: normalizedCode });
  
  // Check if code is valid
  const couponData = validCoupons[normalizedCode];
  
  if (!couponData) {
    console.log('[Coupon] Invalid code:', normalizedCode);
    throw new functions.https.HttpsError('not-found', 'Invalid coupon code');
  }
  
  // Check if user already redeemed this code
  const userDoc = await db.collection('users').doc(userId).get();
  const redeemedCoupons = userDoc.data()?.redeemedCoupons || [];
  
  if (redeemedCoupons.includes(normalizedCode)) {
    console.log('[Coupon] Already redeemed:', normalizedCode);
    throw new functions.https.HttpsError('already-exists', 'Coupon already redeemed');
  }
  
  // Grant lifetime premium
  await db.collection('users').doc(userId).set({
    isPremium: true,
    subscriptionTier: 'lifetime',
    subscriptionStatus: 'lifetime',
    couponCode: normalizedCode,
    couponRedeemedAt: Date.now(),
    redeemedCoupons: [...redeemedCoupons, normalizedCode],
    updatedAt: Date.now()
  }, { merge: true });
  
  console.log('[Coupon] ✅ Lifetime premium granted:', userId, normalizedCode);
  
  return {
    success: true,
    message: `${couponData.description} activated!`,
    tier: 'lifetime'
  };
});

