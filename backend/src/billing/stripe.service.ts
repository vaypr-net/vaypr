import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { User } from '../user/entities/user.entity';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { ActivityService } from '../activity/activity.service';

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
   * Create Stripe checkout session for plan subscription
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly',
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

    // Get Stripe price ID based on cycle
    const priceId =
      billingCycle === 'monthly'
        ? plan.stripeMonthlyPriceId
        : plan.stripeYearlyPriceId;

    if (!priceId) {
      throw new BadRequestException(
        `Plan ${plan.name} does not have Stripe price configured for ${billingCycle} billing`,
      );
    }

    // Get user and Stripe customer
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has active subscription
    if (
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing'
    ) {
      throw new BadRequestException(
        'User already has an active subscription. Use billing portal to upgrade/downgrade.',
      );
    }

    const stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    // Create checkout session
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:8081';
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      metadata: {
        userId: userId,
        planId: planId,
        billingCycle: billingCycle,
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    this.logger.log(
      `Created checkout session ${session.id} for user ${userId}, plan ${planId}`,
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
   * Get subscription details including current plan and renewal date
   */
  async getSubscriptionInfo(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .populate('planId', 'name price limits');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      plan: user.planId,
      status: user.subscriptionStatus,
      billingCycle: user.billingCycle,
      currentPeriodEnd: user.currentPeriodEnd,
      subscriptionStartedAt: user.subscriptionStartedAt,
    };
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

    // Fetch subscription details from Stripe
    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Prepare update data with proper date handling
    const updateData: any = {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      planId: new Types.ObjectId(planId),
      billingCycle: billingCycle,
      subscriptionStartedAt: new Date(),
    };

    // Only set currentPeriodEnd if it's a valid timestamp
    if ((subscription as any).current_period_end && typeof (subscription as any).current_period_end === 'number') {
      updateData.currentPeriodEnd = new Date(((subscription as any).current_period_end as number) * 1000);
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

    // Create transaction record
    const plan = await this.billingPlanModel.findById(planId);
    await this.transactionModel.create({
      transactionId: `stripe_${session.id}`,
      userId: new Types.ObjectId(userId),
      subscriberId: userId,
      subscriberName: user.fullName,
      subscriberEmail: user.email,
      amount: (session.amount_total || 0) / 100, // Convert cents to KWD
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

    // Log activity
    await this.activityService.create({
      type: 'payment',
      title: `Subscription activated: ${plan?.name || 'Plan'}`,
      description: `${user.fullName} (${user.email}) subscribed to ${plan?.name || 'a plan'} (${billingCycle})`,
      relatedEntityId: userId,
    });

    this.logger.log(
      `Webhook: Activated subscription for user ${userId}, subscription ${subscription.id}`,
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

    // Only set currentPeriodEnd if it's a valid timestamp
    if ((subscription as any).current_period_end && typeof (subscription as any).current_period_end === 'number') {
      updateData.currentPeriodEnd = new Date(((subscription as any).current_period_end as number) * 1000);
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
