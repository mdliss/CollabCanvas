/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Stripe Subscription Management
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles subscription checkout, webhooks, and status management.
 * 
 * PRICING:
 * - Free Tier: 3 projects max
 * - Premium Tier: $9.99/month, unlimited projects
 * 
 * ARCHITECTURE:
 * - createCheckoutSession: Creates Stripe checkout for $9.99/month subscription
 * - stripeWebhook: Handles payment events (subscription created, cancelled, updated)
 * - Updates Firestore /users/{userId} with subscription status
 * 
 * FIRESTORE STRUCTURE:
 * /users/{userId}:
 * {
 *   isPremium: boolean,
 *   subscriptionTier: 'free' | 'premium',
 *   stripeCustomerId: 'cus_xxx',
 *   subscriptionId: 'sub_xxx',
 *   subscriptionStatus: 'active' | 'canceled' | 'past_due',
 *   currentPeriodEnd: timestamp
 * }
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe only if API key is configured
const stripeKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const db = admin.firestore();

/**
 * Create Stripe Checkout Session
 * 
 * Creates a checkout session for $9.99/month premium subscription.
 * Returns checkout URL for frontend to redirect to.
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Check if Stripe is configured
  if (!stripe) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe not configured');
  }
  
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;
  
  console.log('[Stripe] Creating checkout session for user:', userId);
  
  try {
    // Check if user already has a Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    let customerId = userDoc.data()?.stripeCustomerId;
    
    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;
      
      // Save customer ID
      await db.collection('users').doc(userId).set({
        stripeCustomerId: customerId
      }, { merge: true });
      
      console.log('[Stripe] Created customer:', customerId);
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CollabCanvas Premium',
              description: 'Unlimited canvas projects and premium features',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 999, // $9.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${data.returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${data.returnUrl}?canceled=true`,
      metadata: {
        firebaseUID: userId
      }
    });
    
    console.log('[Stripe] Checkout session created:', session.id);
    
    return {
      sessionId: session.id,
      url: session.url
    };
    
  } catch (error: any) {
    console.error('[Stripe] Checkout session error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Stripe Webhook Handler
 * 
 * Handles subscription events from Stripe:
 * - checkout.session.completed: Initial subscription
 * - customer.subscription.updated: Subscription changes
 * - customer.subscription.deleted: Cancellation
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    res.status(503).json({ error: 'Stripe not configured' });
    return;
  }
  
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  
  console.log('[Stripe Webhook] Received event:', event.type);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.firebaseUID;
        
        if (!userId) {
          console.error('[Stripe Webhook] No Firebase UID in session metadata');
          break;
        }
        
        // Get subscription details
        const subscriptionId = session.subscription as string;
        const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update user document
        await db.collection('users').doc(userId).set({
          isPremium: true,
          subscriptionTier: 'premium',
          subscriptionId: subscriptionId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: (subscription.current_period_end || 0) * 1000,
          updatedAt: Date.now()
        }, { merge: true });
        
        console.log('[Stripe Webhook] User upgraded to premium:', userId);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription: any = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = (customer as Stripe.Customer).metadata?.firebaseUID;
        
        if (!userId) {
          console.error('[Stripe Webhook] No Firebase UID in customer metadata');
          break;
        }
        
        const isPremium = subscription.status === 'active' || subscription.status === 'trialing';
        
        await db.collection('users').doc(userId).set({
          isPremium,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: (subscription.current_period_end || 0) * 1000,
          updatedAt: Date.now()
        }, { merge: true });
        
        console.log('[Stripe Webhook] Subscription updated:', userId, subscription.status);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = (customer as Stripe.Customer).metadata?.firebaseUID;
        
        if (!userId) {
          console.error('[Stripe Webhook] No Firebase UID in customer metadata');
          break;
        }
        
        await db.collection('users').doc(userId).set({
          isPremium: false,
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          updatedAt: Date.now()
        }, { merge: true });
        
        console.log('[Stripe Webhook] Subscription cancelled:', userId);
        break;
      }
      
      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }
    
    res.json({ received: true });
    
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing event:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Customer Portal URL
 * 
 * Creates a Stripe customer portal session for managing subscription.
 */
export const createPortalSession = functions.https.onCall(async (data, context) => {
  // Check if Stripe is configured
  if (!stripe) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe not configured');
  }
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userId = context.auth.uid;
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId;
    
    if (!customerId) {
      throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: data.returnUrl
    });
    
    return { url: session.url };
    
  } catch (error: any) {
    console.error('[Stripe] Portal session error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

