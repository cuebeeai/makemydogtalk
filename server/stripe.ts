import Stripe from 'stripe';
import type { Express, Request, Response } from 'express';
import { creditManager, getProductByPriceId } from './credits';
import { promoCodeManager } from './promoCodes';
import { optionalAuth, requireAuth } from './middleware';
import { storage } from './storage';

// Initialize Stripe only if the secret key is provided
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

// Helper to check if Stripe is configured
const isStripeConfigured = !!stripe;

/**
 * Register Stripe-related routes
 */
export function registerStripeRoutes(app: Express) {
  /**
   * POST /api/create-checkout-session
   * Creates a Stripe Checkout session for purchasing credits
   */
  app.post('/api/create-checkout-session', optionalAuth, async (req: Request, res: Response) => {
    if (!isStripeConfigured) {
      return res.status(503).json({ error: 'Payment processing is not configured. Please contact the administrator.' });
    }

    try {
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      // Validate price ID
      const product = getProductByPriceId(priceId);
      if (!product) {
        return res.status(400).json({ error: 'Invalid price ID' });
      }

      // Get user identifier: Prioritize authenticated user ID, fallback to IP
      const userId = req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
      const userEmail = req.user?.email;

      let stripeCustomerId = req.user?.stripeCustomerId;

      // Create a Stripe customer if one doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripe!.customers.create({
          email: userEmail,
          name: req.user?.name,
          metadata: { userId },
        });
        stripeCustomerId = customer.id;

        // Update the user with the new Stripe customer ID
        if (req.user) {
          await storage.updateUser(req.user.id, { stripeCustomerId });
        }
      }

      // Determine checkout mode based on product type
      const isSubscription = product.type === 'subscription';
      const checkoutMode = isSubscription ? 'subscription' : 'payment';

      // Create Checkout Session
      const session = await stripe!.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: checkoutMode,
        return_url: `${req.protocol}://${req.get('host')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        customer: stripeCustomerId, // Associate with customer
        customer_update: {
          address: 'auto',
        },
        metadata: {
          userId,
          userEmail: userEmail || '',
          priceId,
          productName: product.name,
          credits: product.credits.toString(),
          productType: product.type,
        },
      });

      console.log(`Created checkout session for ${userId}: ${session.id}`);

      res.json({ clientSecret: session.client_secret });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
  });

  /**
   * GET /api/session-status/:sessionId
   * Check the status of a Stripe Checkout session
   */
  app.get('/api/session-status/:sessionId', async (req: Request, res: Response) => {
    if (!isStripeConfigured) {
      return res.status(503).json({ error: 'Payment processing is not configured. Please contact the administrator.' });
    }

    try {
      const { sessionId } = req.params;

      const session = await stripe!.checkout.sessions.retrieve(sessionId);

      res.json({
        status: session.status,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
      });
    } catch (error: any) {
      console.error('Error retrieving session:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve session' });
    }
  });

  /**
   * POST /api/stripe-webhook
   * Webhook endpoint for Stripe events
   * IMPORTANT: This must be called with raw body, not JSON parsed
   */
  app.post(
    '/api/stripe-webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn('STRIPE_WEBHOOK_SECRET not set - webhook verification disabled');
      }

      let event: Stripe.Event;

      try {
        // Verify webhook signature
        if (webhookSecret && stripe) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          // For testing without webhook secret (development only)
          event = JSON.parse(req.body.toString());
        }
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      console.log(`Received webhook event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          // Extract metadata
          const userId = session.metadata?.userId;
          const priceId = session.metadata?.priceId;
          const credits = parseInt(session.metadata?.credits || '0', 10);
          const productType = session.metadata?.productType;
          const productName = session.metadata?.productName || 'Unknown Product';

          if (!userId || !credits) {
            console.error('Missing metadata in checkout session:', session.id);
            break;
          }

          // Add credits to user's balance in database
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUser(userId, {
              credits: (user.credits || 0) + credits
            });

            // Save transaction record
            await storage.createTransaction({
              userId,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string | null,
              amount: session.amount_total ? (session.amount_total / 100).toString() : '0',
              currency: session.currency || 'usd',
              credits,
              productName,
              status: 'completed',
            });

            console.log(`✅ ${productType === 'subscription' ? 'Subscription' : 'Payment'} successful! Added ${credits} credits to ${user.email}. New balance: ${(user.credits || 0) + credits}`);
          } else {
            // Fallback to in-memory credit manager for anonymous users
            creditManager.addCredits(userId, credits);
            console.log(`✅ ${productType === 'subscription' ? 'Subscription' : 'Payment'} successful! Added ${credits} credits to ${userId} (in-memory)`);
          }
          console.log(`Session ID: ${session.id}, Amount: ${session.amount_total ? session.amount_total / 100 : 'N/A'}`);

          break;
        }

        case 'invoice.payment_succeeded': {
          // Handle recurring subscription payments
          const invoice = event.data.object as any; // Use any to access subscription property

          // Check if this is a subscription invoice
          const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

          if (subscriptionId && customerId) {
            const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id;

            // Get product info by price ID
            const product = getProductByPriceId(priceId);

            if (product && product.type === 'subscription') {
              // For now, we'll need to query users by stripeCustomerId
              // This is a limitation - in production you'd want an index or better query method
              // For MVP, we can store the userId in subscription metadata
              const userId = subscription.metadata?.userId;

              if (userId) {
                const user = await storage.getUser(userId);
                if (user) {
                  await storage.updateUser(user.id, {
                    credits: (user.credits || 0) + product.credits
                  });

                  // Save transaction record for subscription renewal
                  await storage.createTransaction({
                    userId: user.id,
                    stripeSessionId: `sub_${subscriptionId}`,
                    stripePaymentIntentId: invoice.payment_intent as string || null,
                    amount: invoice.amount_paid ? (invoice.amount_paid / 100).toString() : '0',
                    currency: invoice.currency || 'usd',
                    credits: product.credits,
                    productName: product.name,
                    status: 'completed',
                  });

                  console.log(`✅ Subscription renewal! Added ${product.credits} credits to ${user.email}. New balance: ${(user.credits || 0) + product.credits}`);
                }
              } else {
                console.warn(`No userId found in subscription metadata for ${subscriptionId}`);
              }
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          // Handle subscription cancellation
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`🔔 Subscription cancelled: ${subscription.id}`);
          // Note: User keeps remaining credits, just won't get renewed
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error(`❌ Payment failed: ${paymentIntent.id}`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
    }
  );

  // Get Stripe publishable key for frontend
  app.get('/api/stripe-config', (req: Request, res: Response) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  });

  // Get user credit balance
  app.get('/api/credits', optionalAuth, async (req: Request, res: Response) => {
    try {
      if (req.user) {
        // For authenticated users, get credits from database
        const user = await storage.getUser(req.user.id);
        const adminCredits = user?.adminCredits || 0;
        const purchasedCredits = user?.credits || 0;
        res.json({
          credits: purchasedCredits + adminCredits, // Total available credits
          purchasedCredits: purchasedCredits,
          adminCredits: adminCredits,
          lastUpdated: user?.createdAt || null,
          user: { email: user?.email, name: user?.name },
        });
      } else {
        // For anonymous users, use in-memory credit manager
        const userId = req.ip || req.socket.remoteAddress || 'unknown';
        const creditInfo = creditManager.getCreditInfo(userId);
        res.json({
          credits: creditInfo.credits,
          lastUpdated: creditInfo.lastUpdated,
          user: null,
        });
      }
    } catch (error: any) {
      console.error('Error fetching credits:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch credits' });
    }
  });

  // Redeem promo code - REQUIRES AUTHENTICATION
  app.post('/api/redeem-promo-code', requireAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Promo code is required' });
      }

      // User must be authenticated (enforced by requireAuth middleware)
      const userId = req.user!.id;

      // Attempt to redeem the code
      const result = promoCodeManager.redeemCode(userId, code);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      // Add credits to user's balance in database
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await storage.updateUser(userId, {
        credits: (currentUser.credits || 0) + result.credits!
      });

      const newBalance = updatedUser?.credits || 0;

      res.json({
        success: true,
        credits: result.credits,
        message: result.message,
        newBalance,
      });
    } catch (error: any) {
      console.error('Error redeeming promo code:', error);
      res.status(500).json({ error: error.message || 'Failed to redeem promo code' });
    }
  });

  // New endpoint to create a Stripe Billing Portal session
  app.post('/api/create-billing-portal-session', optionalAuth, async (req: Request, res: Response) => {
    if (!isStripeConfigured) {
      return res.status(503).json({ error: 'Payment processing is not configured. Please contact the administrator.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let stripeCustomerId = req.user.stripeCustomerId;

    try {
      // If the user doesn't have a Stripe customer ID, create one
      if (!stripeCustomerId) {
        const customer = await stripe!.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: { userId: req.user.id },
        });
        stripeCustomerId = customer.id;

        // Save the new customer ID to the user
        await storage.updateUser(req.user.id, { stripeCustomerId });
        console.log(`Created Stripe customer ${stripeCustomerId} for user ${req.user.email}`);
      }

      const portalSession = await stripe!.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({ error: 'Failed to create billing portal session' });
    }
  });
}

// Import express for webhook route
import express from 'express';
