import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { User } from '../user/entities/user.entity';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { ActivityService } from '../activity/activity.service';
import { CurrencyService } from '../common/services/currency.service';
import { BillingPlanStripeSyncService } from '../billing-plan/services/billing-plan-stripe-sync.service';

/**
 * StripeService - Handles all Stripe Checkout subscription operations
 *
 * Setup Instructions:
 * 1. Set STRIPE_SECRET_KEY in .env (from dashboard.stripe.com)
 * 2. Set STRIPE_WEBHOOK_SECRET in .env (from Webhooks settings)
 * 3. Create products and prices in Stripe dashboard, add IDs to BillingPlan docs
 * 4. For local testing, use Stripe CLI:
 *    stripe listen --forward-to localhost:8081/billing/webhook
 *    Copy webhook signing secret to STRIPE_WEBHOOK_SECRET
 *
 * Webhook Events Handled:
 * - checkout.session.completed: Subscription activated
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_failed: Payment failure
 */
@Injectable()
export class StripeService {
  private stripe: Stripe;
  private logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BillingPlan.name) private billingPlanModel: Model<BillingPlan>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private activityService: ActivityService,
    private currencyService: CurrencyService,
    private stripeSyncService: BillingPlanStripeSyncService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!secretKey || !webhookSecret) {
      this.logger.warn(
        'StripeService: Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in environment. Billing features will not work.',
      );
      return;
    }
    
    this.stripe = new Stripe(secretKey);
  }

  private ensureStripeConfigured() {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
      );
    }
  }

  /**
   * Stripe can expose period boundaries in different locations depending on API version/object shape.
   * This helper normalizes those values.
   */
  private getSubscriptionPeriodBounds(subscription: any): {
    periodStart?: Date;
    periodEnd?: Date;
  } {
    const startUnix =
      subscription?.current_period_start ??
      subscription?.items?.data?.[0]?.current_period_start ??
      subscription?.start_date;

    const endUnix =
      subscription?.current_period_end ??
      subscription?.items?.data?.[0]?.current_period_end;

    return {
      periodStart: typeof startUnix === 'number' ? new Date(startUnix * 1000) : undefined,
      periodEnd: typeof endUnix === 'number' ? new Date(endUnix * 1000) : undefined,
    };
  }

  /**
   * Create or retrieve Stripe customer for a user
   */
  async getOrCreateStripeCustomer(user: any): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment.');
    }
    
    // If user already has Stripe customer ID, return it
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user._id.toString(),
      },
    });

    // Save stripeCustomerId to database
    await this.userModel.findByIdAndUpdate(user._id, {
      stripeCustomerId: customer.id,
    });

    this.logger.log(
      `Created Stripe customer ${customer.id} for user ${user._id}`,
    );
    return customer.id;
  }

  /**
   * Create Stripe product and prices for a billing plan
   * Automatically creates monthly and yearly prices in AED currency
   */
  async createStripeProductAndPrices(plan: any): Promise<Record<string, string>> {
    try {
      // Convert plan price from KWD to AED for Stripe (exact: 1 KWD = 11.97 AED)
      const priceInAED = Math.round(plan.price * 11.97);

      // Create Stripe product
      const product = await this.stripe.products.create({
        name: plan.name,
        description: plan.description || `${plan.name} plan`,
        metadata: {
          planId: plan._id.toString(),
          planName: plan.name,
        },
      });

      this.logger.log(`Created Stripe product ${product.id} for plan ${plan.name}`);

      // Create monthly price
      const monthlyPrice = await this.stripe.prices.create({
        product: product.id,
        currency: 'aed',
        unit_amount: priceInAED * 100, // Convert to cents
        recurring: {
          interval: 'month',
          usage_type: 'licensed',
        },
        metadata: {
          planId: plan._id.toString(),
          billingCycle: 'monthly',
        },
      });

      // Create yearly price
      const yearlyPrice = await this.stripe.prices.create({
        product: product.id,
        currency: 'aed',
        unit_amount: (priceInAED * 12 * 0.9) * 100, // 10% discount for yearly, convert to cents
        recurring: {
          interval: 'year',
          usage_type: 'licensed',
        },
        metadata: {
          planId: plan._id.toString(),
          billingCycle: 'yearly',
        },
      });

      this.logger.log(
        `Created Stripe prices for plan ${plan.name}: monthly=${monthlyPrice.id}, yearly=${yearlyPrice.id}`,
      );

      return {
        'AED-monthly': monthlyPrice.id,
        'AED-yearly': yearlyPrice.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe product and prices for plan ${plan.name}: ${error.message}`,
      );
      // Return empty object to allow plan creation to continue
      // User will need to manually set Stripe prices later
      return {};
    }
  }

  /**
   * Get Stripe price ID for a plan by currency and billing cycle
   * Supports new multi-currency structure and falls back to old single-currency format
   * Maps unsupported currencies to supported alternatives
   */
  private getPriceIdForCurrency(
    plan: any,
    billingCycle: 'monthly' | 'yearly',
    currency: string = 'USD',
  ): string {
    let lookupCurrency = currency.toUpperCase();
    
    // Map regional currencies to Stripe-supported alternatives
    const currencyMapping: Record<string, string> = {
      'KWD': 'AED', // Kuwait Dinar -> UAE Dirham (Stripe supported)
      'SAR': 'AED', // Saudi Riyal -> UAE Dirham
      'QAR': 'AED', // Qatari Riyal -> UAE Dirham
      'BHD': 'AED', // Bahraini Dinar -> UAE Dirham
      'OMR': 'AED', // Omani Rial -> UAE Dirham
      'JOD': 'AED', // Jordanian Dinar -> UAE Dirham
      'USD': 'AED', // Use AED for all payments
    };
    
    // If currency is in the mapping, use the mapped currency
    if (currencyMapping[lookupCurrency]) {
      lookupCurrency = currencyMapping[lookupCurrency];
    }
    
    const key = `${lookupCurrency}-${billingCycle}`;
    
    // Try new stripePrices structure first
    if (plan.stripePrices && plan.stripePrices[key]) {
      return plan.stripePrices[key];
    }
    
    // Fallback to old single-currency fields for backward compatibility
    const priceId =
      billingCycle === 'monthly'
        ? plan.stripeMonthlyPriceId
        : plan.stripeYearlyPriceId;
    
    return priceId;
  }

  /**
   * Create Stripe checkout session for plan subscription
   * @param userId - User ID
   * @param planId - Plan ID
   * @param billingCycle - 'monthly' or 'yearly'
   * @param currency - Currency code (e.g., 'USD', 'AED', 'QAR'). Defaults to 'USD'
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    currency: string = 'USD',
  ): Promise<{ url: string }> {
    // Validate plan exists
    const plan = await this.billingPlanModel.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Validate billingCycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      throw new BadRequestException('Invalid billing cycle');
    }

    // Validate currency is supported
    currency = currency.toUpperCase();
    let priceId = this.getPriceIdForCurrency(plan, billingCycle, currency);

    // If price not found, attempt to sync plan to Stripe (one-time fallback)
    if (!priceId) {
      this.logger.log(
        `Price not found for plan ${plan.name}. Attempting to sync to Stripe...`,
      );
      try {
        const syncedPlan = await this.stripeSyncService.syncPlanToStripe(planId);
        if (syncedPlan) {
          priceId = this.getPriceIdForCurrency(syncedPlan, billingCycle, currency);
          
          if (priceId) {
            this.logger.log(
              `Successfully synced plan ${plan.name} and found price ${priceId}`,
            );
          }
        }
      } catch (syncError) {
        this.logger.warn(
          `Failed to sync plan ${plan.name} to Stripe: ${syncError.message}`,
        );
        // Continue with original error below
      }
    }

    if (!priceId) {
      throw new BadRequestException(
        `Plan "${plan.name}" does not have Stripe price configured for ${currency} ${billingCycle} billing. ` +
        `Please update the plan with stripePrices in format: { "AED-${billingCycle}": "price_xxxx" }`,
      );
    }

    // Get user and Stripe customer
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user already has active subscription, cancel it before creating new one
    if (
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing'
    ) {
      this.logger.log(
        `User ${userId} already has active subscription ${user.stripeSubscriptionId}. Canceling before creating new subscription.`,
      );
      
      if (user.stripeSubscriptionId) {
        try {
          // Try to cancel the old subscription in Stripe
          await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
          this.logger.log(
            `Canceled old subscription ${user.stripeSubscriptionId} for user ${userId}`,
          );
        } catch (error: any) {
          // If subscription doesn't exist in Stripe (404), that's fine - continue
          if (error.statusCode === 404 || error.code === 'resource_missing') {
            this.logger.warn(
              `Subscription ${user.stripeSubscriptionId} not found in Stripe. Continuing with new subscription.`,
            );
          } else {
            this.logger.error(
              `Failed to cancel old subscription for user ${userId}: ${error.message}`,
            );
          }
        }
        
        // Update user status regardless of Stripe cancellation result
        await this.userModel.findByIdAndUpdate(userId, {
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        });
      }
    }

    const stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    // Create checkout session
    // Use AED currency which is supported by Stripe and available for Middle Eastern users
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      currency: 'aed', // Use AED for Stripe checkout (supported currency)
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
      metadata: {
        userId: userId,
        planId: planId,
        billingCycle: billingCycle,
        requestedCurrency: currency, // Store the originally requested currency
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    this.logger.log(
      `Created checkout session ${session.id} for user ${userId}, plan ${planId} (${currency})`,
    );

    return { url: session.url };
  }

  /**
   * Create Stripe Billing Portal session for managing subscriptions
   */
  async createBillingPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      throw new BadRequestException('User has no Stripe customer');
    }

    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:8081';
    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/billing/settings`,
    });

    this.logger.log(`Created billing portal session for user ${userId}`);

    return { url: session.url };
  }

  /**
   * Verify checkout session after successful payment
   * Called by frontend after Stripe redirects to success page
   */
  async verifyCheckoutSession(sessionId: string, userId: string): Promise<any> {
    try {
      // Retrieve the checkout session from Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });

      // Verify the session belongs to this user
      if (session.metadata?.userId !== userId) {
        throw new BadRequestException('Session does not belong to this user');
      }

      // Check if payment was successful
      if (session.payment_status !== 'paid') {
        throw new BadRequestException('Payment was not successful');
      }

      // Get subscription details
      const subscription = session.subscription as any;
      
      if (!subscription) {
        throw new BadRequestException('No subscription found in session');
      }

      // Update user's subscription in database (this is usually done by webhook, but we do it here as backup)
      const user = await this.userModel.findById(userId);
      if (user) {
        user.stripeSubscriptionId = subscription.id;
        user.subscriptionStatus = 'active';
        user.planId = session.metadata?.planId as any;
        await user.save();
        
        this.logger.log(`Verified session ${sessionId} for user ${userId}, subscription ${subscription.id}`);
      }

      return {
        success: true,
        sessionId: session.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        planName: session.metadata?.planId,
        message: 'Payment successful! Your subscription is now active.',
      };
    } catch (error) {
      this.logger.error(`Error verifying session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription details including current plan and renewal date
   * Also includes display currency (KWD) equivalent
   */
  async getSubscriptionInfo(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .populate('planId', 'name price currency limits features');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cast planId as a plan object since it's populated
    const plan = user.planId as any;
    
    // Use stored subscription amount if available, otherwise fetch from Stripe
    let actualPrice = user.subscriptionAmount || plan?.price || 0;
    let subscriptionStatus = user.subscriptionStatus;
    
    // If user has a subscription, verify its status with Stripe
    if (user.stripeSubscriptionId && user.subscriptionStatus !== 'free') {
      try {
        this.ensureStripeConfigured();
        // Retrieve subscription with expanded price information
        const subscription = (await this.stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
          {
            expand: ['items.data.price'], // Expand price to get full details
          }
        )) as any;

        this.logger.debug(
          `Subscription retrieved - ID: ${subscription?.id}, Items: ${subscription?.items?.data?.length}, Status: ${subscription?.status}`
        );

        // Sync subscription status from Stripe
        if (subscription.status !== user.subscriptionStatus) {
          this.logger.log(
            `Syncing subscription status for user ${userId}: ${user.subscriptionStatus} -> ${subscription.status}`
          );
          
          // Update user's subscription status
          await this.userModel.findByIdAndUpdate(userId, {
            subscriptionStatus: subscription.status,
          });
          
          subscriptionStatus = subscription.status;
        }

        if (subscription && subscription.items?.data?.length > 0) {
          // Get the actual amount being charged from the first subscription item
          const item = subscription.items.data[0];
          this.logger.debug(
            `Item price object - unit_amount: ${item.price?.unit_amount}, currency: ${item.price?.currency}, interval: ${item.price?.recurring?.interval}, interval_count: ${item.price?.recurring?.interval_count}`
          );

          if (item.price?.unit_amount) {
            // Convert from cents to major unit (divide by 100)
            // Keep price in AED - frontend will convert AED directly to KWD
            actualPrice = item.price.unit_amount / 100;
            this.logger.debug(
              `Price calculated: ${actualPrice} AED (from ${item.price.unit_amount} cents)`
            );
          }
        } else {
          this.logger.warn(`No subscription items found for user ${userId}`);
        }
      } catch (error: any) {
        // If subscription not found in Stripe, update user status
        if (error.statusCode === 404 || error.code === 'resource_missing') {
          this.logger.warn(
            `Subscription ${user.stripeSubscriptionId} not found in Stripe. Updating user status to canceled.`
          );
          
          await this.userModel.findByIdAndUpdate(userId, {
            subscriptionStatus: 'canceled',
          });
          
          subscriptionStatus = 'canceled';
        } else {
          this.logger.error(
            `Failed to fetch subscription from Stripe for user ${userId}: ${error.message}`
          );
        }
      }
    }

    const planObject = (plan?.toObject?.() || plan) || { price: actualPrice };
    
    // Convert AED price to display currency (KWD)
    const displayCurrency = this.currencyService.getDisplayCurrency();
    const priceInDisplayCurrency = this.currencyService.convertToDisplayCurrency(actualPrice);
    
    return {
      plan: {
        ...planObject,
        price: actualPrice, // Override with actual charged price in AED
        priceInAED: actualPrice,
        priceInDisplayCurrency: priceInDisplayCurrency,
        displayCurrency: displayCurrency,
      },
      status: subscriptionStatus, // Use synced status from Stripe
      billingCycle: user.billingCycle,
      currentPeriodEnd: user.currentPeriodEnd,
      subscriptionStartedAt: user.subscriptionStartedAt,
    };
  }

  async getBillingHistory(userId: string): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);

    const transactions = await this.transactionModel
      .find({
        userId: userObjectId,
      })
      .sort({ transactionDate: -1 })
      .limit(50)
      .lean();

    return transactions.map((tx: any) => ({
      id: tx._id?.toString?.() || tx._id,
      transactionId: tx.transactionId,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      type: tx.type,
      provider: tx.provider,
      plan: tx.plan,
      billingCycle: tx.billingCycle || null,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt,
    }));
  }

  /**
   * Get cancellation preview before user confirms cancellation
   * Shows what will happen and refund amount
   */
  async getCancellationPreview(
    userId: string,
    cancellationMethod: 'immediate' | 'at_period_end',
  ): Promise<any> {
    this.ensureStripeConfigured();

    const user = await this.userModel
      .findById(userId)
      .populate('planId', 'name price billingCycle');

    if (!user || !user.stripeSubscriptionId) {
      throw new BadRequestException('You do not have an active subscription');
    }

    this.logger.debug(
      `Cancellation preview request: User ID=${userId}, Subscription ID=${user.stripeSubscriptionId}, User currentPeriodEnd=${user.currentPeriodEnd}`,
    );

    // Fetch subscription from Stripe
    let subscription: any;
    try {
      subscription = await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      );
    } catch (stripeError: any) {
      // If subscription doesn't exist in Stripe, update user status
      if (stripeError.statusCode === 404 || stripeError.code === 'resource_missing') {
        this.logger.warn(
          `Subscription ${user.stripeSubscriptionId} not found in Stripe for user ${userId}. Updating user status.`,
        );
        
        // Update user to canceled status
        await this.userModel.findByIdAndUpdate(userId, {
          subscriptionStatus: 'canceled',
        });

        throw new BadRequestException('You do not have an active subscription');
      }
      throw stripeError;
    }

    // Log subscription details for debugging
    this.logger.debug(
      `Subscription retrieved: ID=${subscription?.id}, Status=${subscription?.status}, Period End=${subscription?.current_period_end}, Currency=${subscription?.currency}, Start Date=${subscription?.start_date}`,
    );
    this.logger.debug(`Subscription items: ${subscription?.items?.data?.length || 0} items`);
    if (subscription?.items?.data?.length > 0) {
      const item = subscription.items.data[0];
      this.logger.debug(`First item - Price: ${(item.price as any)?.id}, Interval: ${(item.price as any)?.recurring?.interval}`);
    }

    // Check subscription status
    if (!subscription) {
      throw new BadRequestException('Subscription not found in Stripe');
    }

    if (subscription.status === 'canceled') {
      // Update user status to match Stripe
      await this.userModel.findByIdAndUpdate(userId, {
        subscriptionStatus: 'canceled',
      });
      
      throw new BadRequestException('You do not have an active subscription');
    }

    if (subscription.status === 'incomplete') {
      throw new BadRequestException('This subscription is incomplete. Please complete payment first');
    }

    // Only allow cancellation for active, trialing, or past_due subscriptions
    if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
      throw new BadRequestException(`Cannot cancel subscription with status: ${subscription.status}`);
    }

    const { periodEnd } = this.getSubscriptionPeriodBounds(subscription);

    // Strict mode: use only real Stripe period boundaries.
    // No fallback to user record or inferred interval math.
    const periodEndDate = periodEnd;

    this.logger.debug(
      `Period end date resolution: stripe_top_level=${!!subscription.current_period_end}, stripe_item_level=${!!subscription?.items?.data?.[0]?.current_period_end}, user_stored=${!!user.currentPeriodEnd}, resolved=${periodEndDate}`,
    );

    if (!periodEndDate) {
      this.logger.error(
        `Cannot retrieve period end from Stripe: subscriptionId=${subscription?.id}, status=${subscription?.status}, current_period_end=${subscription?.current_period_end}, item_current_period_end=${subscription?.items?.data?.[0]?.current_period_end}, start_date=${subscription?.start_date}`,
      );
      throw new BadRequestException(
        'Stripe did not return subscription period end. Check Stripe API version/object shape and subscription data.',
      );
    }

    // Keep user record in sync for future cancellation/refund operations.
    if (!user.currentPeriodEnd || user.currentPeriodEnd.getTime() !== periodEndDate.getTime()) {
      await this.userModel.findByIdAndUpdate(userId, { currentPeriodEnd: periodEndDate });
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate prorated refund
    let refundAmount = 0;
    let refundMessage = '';

    if (cancellationMethod === 'immediate') {
      refundAmount = this.calculateProRatedRefund(
        subscription,
        user.planId as any,
      );
      refundMessage = `You will receive a refund of ${refundAmount} ${subscription.currency?.toUpperCase()} for ${daysRemaining} unused days.`;
    } else {
      refundMessage = `Your subscription will remain active until ${periodEndDate.toLocaleDateString()}. No refund will be issued.`;
    }

    return {
      method: cancellationMethod,
      currentPlan: (user.planId as any)?.name || 'Unknown',
      daysRemaining,
      periodEndDate,
      estimatedRefundAmount: refundAmount,
      currency: subscription.currency?.toUpperCase() || 'KWD',
      refundMessage,
    };
  }

  /**
   * Calculate prorated refund amount based on unused days
   * Private helper method
   */
  private calculateProRatedRefund(
    subscription: any,
    plan: any,
  ): number {
    if (!plan?.price) {
      return 0;
    }

    const { periodStart, periodEnd } = this.getSubscriptionPeriodBounds(subscription);
    if (!periodStart || !periodEnd) {
      return 0;
    }

    const periodEndDate = periodEnd;
    const now = new Date();
    const totalDaysInPeriod = Math.ceil(
      (periodEndDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (totalDaysInPeriod <= 0) {
      return 0;
    }

    const unusedDays = Math.max(
      0,
      Math.ceil(
        (periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    // plan.price is stored in major unit (e.g., KWD), so do not divide by 100.
    const refund = (unusedDays / totalDaysInPeriod) * plan.price;
    return Math.round(refund * 100) / 100; // Round to 2 decimals
  }

  /**
   * Cancel user's subscription
   * Handles both immediate and at_period_end cancellations
   * Processes refunds if applicable
   */
  async cancelSubscription(
    userId: string,
    cancellationMethod: 'immediate' | 'at_period_end',
    refundStrategy: 'full_prorated' | 'account_credit' | 'no_refund',
    reason?: string,
    feedback?: string,
  ): Promise<any> {
    this.ensureStripeConfigured();

    const user = await this.userModel.findById(userId);

    if (!user || !user.stripeSubscriptionId) {
      throw new BadRequestException('User has no active subscription');
    }

    if (user.subscriptionStatus === 'canceled') {
      throw new BadRequestException(
        'Subscription is already canceled or pending cancellation',
      );
    }

    try {
      // Fetch subscription from Stripe
      let subscription: any;
      try {
        subscription = await this.stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );
      } catch (stripeError: any) {
        // If subscription doesn't exist in Stripe (already canceled/deleted), just update user status
        if (stripeError.statusCode === 404 || stripeError.code === 'resource_missing') {
          this.logger.warn(
            `Subscription ${user.stripeSubscriptionId} not found in Stripe for user ${userId}. Updating user status to canceled.`,
          );
          
          // Update user to canceled status
          await this.userModel.findByIdAndUpdate(userId, {
            subscriptionStatus: 'canceled',
            cancellationMethod: 'immediate',
            cancellationReason: reason || 'subscription_not_found',
            cancellationFeedback: feedback,
          });

          return {
            success: true,
            method: cancellationMethod,
            message: 'Subscription already canceled in Stripe. User status updated.',
            refundAmount: 0,
            refundStatus: 'not_applicable',
          };
        }
        // If it's a different error, throw it
        throw stripeError;
      }

      // Check if subscription is already canceled in Stripe
      if (subscription.status === 'canceled') {
        this.logger.warn(
          `Subscription ${user.stripeSubscriptionId} is already canceled in Stripe for user ${userId}. Updating user status.`,
        );
        
        // Update user to canceled status
        await this.userModel.findByIdAndUpdate(userId, {
          subscriptionStatus: 'canceled',
          cancellationMethod: 'immediate',
          cancellationReason: reason || 'already_canceled',
          cancellationFeedback: feedback,
        });

        return {
          success: true,
          method: cancellationMethod,
          message: 'Subscription was already canceled. User status updated.',
          refundAmount: 0,
          refundStatus: 'not_applicable',
        };
      }

      // Cancel in Stripe using the correct API path for each method.
      if (cancellationMethod === 'at_period_end') {
        await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancelledBy: userId,
            cancelledAt: new Date().toISOString(),
            cancellationMethod,
            cancellationReason: reason || 'not_specified',
          },
        });
      } else {
        await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
      }

      // Calculate refund if applicable
      let refundAmount = 0;
      let refundStatus = 'pending';

      if (cancellationMethod === 'immediate' && refundStrategy === 'full_prorated') {
        // Fetch the plan details to get the price
        const plan = user.planId ? await this.billingPlanModel.findById(user.planId) : null;
        
        if (plan) {
          refundAmount = this.calculateProRatedRefund(
            subscription,
            plan,
          );
        }

        if (refundAmount > 0) {
          // Issue refund through Stripe
          await this.issueRefund(
            user,
            subscription,
            refundAmount,
            refundStrategy,
          );
          refundStatus = 'processing';
        }
      }

      // Get period end date using the helper method
      const subscription_bounds = this.getSubscriptionPeriodBounds(subscription);
      let cancellationScheduledDate: Date | undefined;
      
      if (cancellationMethod === 'at_period_end') {
        // For deferred cancellations, use the period end date
        cancellationScheduledDate = subscription_bounds.periodEnd;
        if (!cancellationScheduledDate && subscription.current_period_end) {
          // Fallback: manually calculate if helper didn't work
          const periodEndUnix = subscription.current_period_end as number;
          if (typeof periodEndUnix === 'number' && periodEndUnix > 0) {
            cancellationScheduledDate = new Date(periodEndUnix * 1000);
          }
        }
      }

      // Update user record
      await this.userModel.findByIdAndUpdate(userId, {
        subscriptionStatus:
          cancellationMethod === 'immediate' ? 'canceled' : 'active', // Active until period end
        cancellationMethod,
        cancellationScheduledFor: cancellationScheduledDate,
        cancellationReason: reason,
        cancellationFeedback: feedback,
        refundStatus,
        refundAmount: Math.round(refundAmount * 100) / 100,
        refundCurrency: subscription.currency?.toUpperCase() || 'KWD',
      });

      // Create transaction record for refund
      if (refundAmount > 0) {
        try {
          await this.transactionModel.create({
            transactionId: `stripe_refund_${user.stripeSubscriptionId}_${Date.now()}`,
            userId: user._id,
            subscriberId: user._id.toString(),
            subscriberName: user.fullName,
            subscriberEmail: user.email,
            amount: refundAmount,
            currency: subscription.currency?.toUpperCase() || 'KWD',
            type: 'refund',
            provider: 'Stripe',
            status: 'pending', // Will be updated when refund completes
            plan: user.planId?.toString() || 'Unknown',
            transactionDate: new Date(),
            stripeSubscriptionId: user.stripeSubscriptionId,
          });

          this.logger.log(
            `Webhook: Refund transaction created for user ${user._id}`,
          );
        } catch (transactionError: any) {
          this.logger.error(
            `Webhook: Failed to create refund transaction for user ${user._id}: ${transactionError.message}`,
          );
          // Don't throw - cancellation is already processed
        }
      }

      // Log activity
      const activityTitle =
        cancellationMethod === 'immediate'
          ? 'Subscription canceled immediately'
          : 'Subscription cancellation scheduled';
      const activityDescription =
        cancellationMethod === 'immediate'
          ? `${user.fullName} cancelled subscription immediately. Refund: ${refundAmount} ${subscription.currency?.toUpperCase()}`
          : `${user.fullName} scheduled subscription cancellation for ${cancellationScheduledDate?.toLocaleDateString()}`;

      await this.activityService.create({
        type: 'canceled',
        title: activityTitle,
        description: activityDescription,
        relatedEntityId: user._id.toString(),
      });

      this.logger.log(
        `Subscription canceled for user ${userId}, method: ${cancellationMethod}, refund: ${refundAmount}`,
      );

      const cancellationDate =
        cancellationMethod === 'at_period_end' ? cancellationScheduledDate : new Date();

      // Return confirmation details
      return {
        subscriptionId: user.stripeSubscriptionId,
        cancellationDate,
        accessUntilDate:
          cancellationMethod === 'at_period_end' ? cancellationScheduledDate : undefined,
        refundAmount: Math.round(refundAmount * 100) / 100,
        refundCurrency: subscription.currency?.toUpperCase() || 'KWD',
        refundStatus,
        message:
          cancellationMethod === 'immediate'
            ? `Your subscription has been canceled immediately. A refund of ${Math.round(refundAmount * 100) / 100} ${subscription.currency?.toUpperCase()} will be processed within 5-7 business days.`
            : `Your subscription will remain active until ${cancellationScheduledDate?.toLocaleDateString() || 'your billing period end date'}. After that, you'll be downgraded to the Free plan.`,
      };
    } catch (error) {
      this.logger.error(`Cancellation error for user ${userId}: ${error.message}`);
      throw new BadRequestException(
        `Failed to cancel subscription: ${error.message}`,
      );
    }
  }

  /**
   * Issue refund to customer
   * Creates a credit note in Stripe for the refund
   */
  private async issueRefund(
    user: any,
    subscription: Stripe.Subscription,
    refundAmount: number,
    refundStrategy: 'full_prorated' | 'account_credit' | 'no_refund',
  ): Promise<void> {
    try {
      // Get the latest invoice for the subscription
      const invoices = await this.stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
      });

      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];

        // Create credit note for partial refund
        const creditNote = await this.stripe.creditNotes.create({
          invoice: latestInvoice.id,
          lines: [
            {
              type: 'custom_line_item' as any,
              description: `Prorated refund for subscription cancellation (${refundAmount} ${subscription.currency?.toUpperCase()})`,
              unit_amount: Math.round(refundAmount * 100), // Convert to cents
              quantity: 1,
            },
          ],
          memo: `Refund issued on subscription cancellation by user ${user._id}`,
        });

        // Store credit note ID for tracking
        await this.userModel.findByIdAndUpdate(user._id, {
          stripeCreditNoteId: creditNote.id,
        });

        this.logger.log(
          `Created credit note ${creditNote.id} for refund of ${refundAmount} to user ${user._id}`,
        );
      } else {
        this.logger.warn(
          `No invoices found for subscription ${subscription.id} to create refund`,
        );
      }
    } catch (error) {
      this.logger.error(`Error issuing refund for user ${user._id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed webhook
   * Called when user completes payment and subscription starts
   */
  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata as any;
    const userId = metadata?.userId;
    const planId = metadata?.planId;
    const billingCycle = metadata?.billingCycle;

    if (!userId || !planId) {
      this.logger.error(
        `Webhook: Missing metadata in checkout session ${session.id}`,
      );
      return;
    }

    // Fetch subscription details from Stripe with retry for consistency
    let subscription = (await this.stripe.subscriptions.retrieve(
      session.subscription as string,
      {
        expand: ['items.data.price'], // Expand price details
      }
    )) as any;

    // If current_period_end is missing, retry once after a short delay
    // (Stripe may need a moment to finalize subscription data)
    if (!subscription.current_period_end) {
      this.logger.warn(
        `Webhook: Subscription ${subscription.id} missing current_period_end, retrying...`,
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
      subscription = (await this.stripe.subscriptions.retrieve(
        session.subscription as string,
        {
          expand: ['items.data.price'],
        }
      )) as any;
    }

    // Get the actual subscription amount from Stripe
    let subscriptionAmount = 0;
    if (subscription.items?.data?.[0]?.price?.unit_amount) {
      subscriptionAmount = subscription.items.data[0].price.unit_amount / 100;
      this.logger.log(
        `Webhook: Subscription amount calculated - ${subscriptionAmount} ${subscription.currency}`,
      );
    }

    // Prepare update data with proper date handling
    const updateData: any = {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      planId: new Types.ObjectId(planId),
      billingCycle: billingCycle,
      subscriptionAmount: subscriptionAmount, // Store actual charged amount
      subscriptionStartedAt: new Date(),
    };

    // Set currentPeriodEnd from real Stripe period boundaries (top-level or item-level).
    const { periodEnd } = this.getSubscriptionPeriodBounds(subscription);
    if (periodEnd) {
      updateData.currentPeriodEnd = periodEnd;
    } else {
      this.logger.warn(
        `Webhook: currentPeriodEnd missing from Stripe payload for subscription ${subscription.id}. Fields: top_level=${subscription?.current_period_end}, item_level=${subscription?.items?.data?.[0]?.current_period_end}`,
      );
    }

    // Update user with subscription info
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true },
    );

    if (!user) {
      this.logger.error(`Webhook: User ${userId} not found when processing checkout.`);
      return;
    }

    this.logger.log(
      `Webhook: Subscription ${subscription.id} saved for user ${userId}. Status: ${user.subscriptionStatus}, Period End: ${user.currentPeriodEnd}, Amount: ${subscriptionAmount}`,
    );

    // Create transaction record
    const plan = await this.billingPlanModel.findById(planId);
    const transactionAmount = (session.amount_total || 0) / 100; // Convert cents
    
    this.logger.log(
      `Webhook: Creating transaction - Session Amount: ${transactionAmount}, Calculated Subscription Amount: ${subscriptionAmount}, Billing Cycle: ${billingCycle}`,
    );
    
    // Check if transaction already exists (idempotency)
    this.logger.log(`Webhook: Checking for existing transaction with session ID: ${session.id}`);
    const existingTransaction = await this.transactionModel.findOne({
      stripeCheckoutSessionId: session.id,
    });
    
    if (existingTransaction) {
      this.logger.log(
        `Webhook: Transaction for checkout session ${session.id} already exists, skipping duplicate`,
      );
    } else {
      this.logger.log(`Webhook: No existing transaction found. Creating new transaction...`);
      try {
        this.logger.log(
          `Webhook: Transaction data - userId: ${userId}, amount: ${transactionAmount}, currency: ${session.currency?.toUpperCase() || 'KWD'}, plan: ${plan?.name || 'Unknown'}`
        );
        
        const newTransaction = await this.transactionModel.create({
          transactionId: `stripe_${session.id}`,
          userId: new Types.ObjectId(userId),
          subscriberId: userId,
          subscriberName: user.fullName,
          subscriberEmail: user.email,
          amount: transactionAmount, // Amount from checkout session
          currency: session.currency?.toUpperCase() || 'KWD',
          type: 'subscription',
          provider: 'Stripe',
          status: 'succeeded',
          plan: plan?.name || 'Unknown',
          transactionDate: new Date(),
          stripeEventId: session.id,
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId: subscription.id,
          billingCycle: billingCycle,
        });

        this.logger.log(
          `Webhook: ✅ Transaction created successfully! ID: ${newTransaction._id}, Session: ${session.id}`,
        );
      } catch (transactionError: any) {
        // If duplicate key error, it's likely already processed
        if (transactionError.code === 11000) {
          this.logger.warn(
            `Webhook: Transaction already exists for checkout session ${session.id}, skipping`,
          );
        } else {
          this.logger.error(
            `Webhook: ❌ Failed to create transaction for session ${session.id}`,
          );
          this.logger.error(`Webhook: Error code: ${transactionError.code}`);
          this.logger.error(`Webhook: Error message: ${transactionError.message}`);
          this.logger.error(`Webhook: Full error:`, transactionError);
          // Don't throw - subscription is already created, just log the error
        }
      }
    }

    // Log activity
    await this.activityService.create({
      type: 'payment',
      title: `Subscription activated: ${plan?.name || 'Plan'}`,
      description: `${user.fullName} (${user.email}) subscribed to ${plan?.name || 'a plan'} (${billingCycle}) for ${transactionAmount} ${session.currency?.toUpperCase()}`,
      relatedEntityId: userId,
    });

    this.logger.log(
      `Webhook: Activated subscription for user ${userId}, subscription ${subscription.id}, amount: ${transactionAmount} ${session.currency?.toUpperCase()}`,
    );
  }

  /**
   * Handle customer.subscription.updated webhook
   * Called when subscription status changes (e.g., trial ending, payment renewal)
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const user = await this.userModel.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!user) {
      this.logger.warn(
        `Webhook: User not found for subscription ${subscription.id}`,
      );
      return;
    }

    const oldStatus = user.subscriptionStatus;
    const newStatus = subscription.status;

    // Prepare update data with proper date handling
    const updateData: any = {
      subscriptionStatus: subscription.status,
    };

    // Set currentPeriodEnd from real Stripe period boundaries (top-level or item-level).
    const { periodEnd: updatedPeriodEnd } = this.getSubscriptionPeriodBounds(subscription);
    if (updatedPeriodEnd) {
      updateData.currentPeriodEnd = updatedPeriodEnd;
    } else if (user.currentPeriodEnd) {
      // Preserve previously-known real value if Stripe update payload omits period fields.
      updateData.currentPeriodEnd = user.currentPeriodEnd;
    } else {
      this.logger.warn(
        `Webhook: currentPeriodEnd missing and no stored value for subscription ${subscription.id}. Fields: top_level=${(subscription as any)?.current_period_end}, item_level=${(subscription as any)?.items?.data?.[0]?.current_period_end}`,
      );
    }

    // Update user subscription info
    await this.userModel.findByIdAndUpdate(user._id, updateData);

    // Log activity if status changed
    if (oldStatus !== newStatus) {
      let activityTitle = '';
      let activityDescription = '';

      switch (newStatus) {
        case 'active':
          activityTitle = 'Subscription renewed';
          activityDescription = `${user.fullName}'s subscription renewed successfully`;
          break;
        case 'past_due':
          activityTitle = 'Payment failed - subscription past due';
          activityDescription = `${user.fullName}'s subscription payment failed`;
          break;
        case 'trialing':
          activityTitle = 'Subscription trial started';
          activityDescription = `${user.fullName} started subscription trial`;
          break;
        default:
          activityTitle = `Subscription status: ${newStatus}`;
          activityDescription = `${user.fullName}'s subscription is now ${newStatus}`;
      }

      await this.activityService.create({
        type: newStatus === 'past_due' ? 'payment_failed' : 'payment',
        title: activityTitle,
        description: activityDescription,
        relatedEntityId: user._id.toString(),
      });
    }

    this.logger.log(
      `Webhook: Updated subscription ${subscription.id}, status ${oldStatus} -> ${newStatus}`,
    );
  }

  /**
   * Handle customer.subscription.deleted webhook
   * Called when subscription is canceled
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const user = await this.userModel.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!user) {
      this.logger.warn(
        `Webhook: User not found for subscription ${subscription.id}`,
      );
      return;
    }

    // Get Free plan ID
    const freePlan = await this.billingPlanModel.findOne({ name: 'Free' });

    // Downgrade to Free plan
    await this.userModel.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'canceled',
      planId: freePlan?._id || null,
      subscriptionCanceledAt: new Date(),
      stripeSubscriptionId: null,
    });

    // Log activity
    await this.activityService.create({
      type: 'canceled',
      title: 'Subscription canceled',
      description: `${user.fullName} (${user.email}) canceled their subscription`,
      relatedEntityId: user._id.toString(),
    });

    this.logger.log(
      `Webhook: Canceled subscription ${subscription.id} for user ${user._id}`,
    );
  }

  /**
   * Handle invoice.payment_failed webhook
   * Called when automatic payment fails
   */
  async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const user = await this.userModel.findOne({
      stripeCustomerId: invoice.customer as string,
    });

    if (!user) {
      this.logger.warn(`Webhook: User not found for invoice ${invoice.id}`);
      return;
    }

    // Update subscription status to past_due
    await this.userModel.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'past_due',
    });

    // Create transaction record for failed payment
    try {
      await this.transactionModel.create({
        transactionId: `stripe_invoice_${invoice.id}`,
        userId: user._id,
        subscriberId: user._id.toString(),
        subscriberName: user.fullName,
        subscriberEmail: user.email,
        amount: (invoice.amount_due || 0) / 100, // Convert cents to KWD
        currency: invoice.currency?.toUpperCase() || 'KWD',
        type: 'subscription',
        provider: 'Stripe',
        status: 'failed',
        plan: user.planId?.toString() || 'Unknown',
        transactionDate: new Date(),
        stripeEventId: invoice.id,
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: ((invoice as any).subscription as string) || '',
      });

      this.logger.log(
        `Webhook: Failed payment transaction created for invoice ${invoice.id}`,
      );
    } catch (transactionError: any) {
      if (transactionError.code === 11000) {
        this.logger.warn(
          `Webhook: Failed payment transaction already exists for invoice ${invoice.id}, skipping`,
        );
      } else {
        this.logger.error(
          `Webhook: Failed to create failed payment transaction for invoice ${invoice.id}: ${transactionError.message}`,
        );
      }
    }

    // Log activity
    await this.activityService.create({
      type: 'payment_failed',
      title: 'Payment failed',
      description: `Payment of ${(invoice.amount_due || 0) / 100} KWD failed for ${user.fullName}`,
      relatedEntityId: user._id.toString(),
    });

    this.logger.log(
      `Webhook: Payment failed for user ${user._id}, invoice ${invoice.id}`,
    );
  }

  /**
   * Verify Stripe webhook signature
   * Must receive raw request body (not parsed JSON)
   */
  async verifyWebhookSignature(
    body: Buffer | string,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
