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
   * Get cancellation preview before user confirms cancellation
   * Shows what will happen and refund amount
   */
  async getCancellationPreview(
    userId: string,
    cancellationMethod: 'immediate' | 'at_period_end',
  ): Promise<any> {
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
    const subscription = (await this.stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    )) as any;

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
      throw new BadRequestException('This subscription is already canceled');
    }

    if (subscription.status === 'incomplete') {
      throw new BadRequestException('This subscription is incomplete. Please complete payment first');
    }

    // Only allow cancellation for active, trialing, or past_due subscriptions
    if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
      throw new BadRequestException(`Cannot cancel subscription with status: ${subscription.status}`);
    }

    // Use current_period_end from Stripe, fallback to user's stored value if missing
    let periodEndDate = subscription.current_period_end 
      ? new Date((subscription.current_period_end as number) * 1000)
      : user.currentPeriodEnd;

    // If still missing, try to calculate from subscription items and start date
    if (!periodEndDate && subscription.items?.data?.length > 0 && subscription.start_date) {
      const item = subscription.items.data[0];
      const price = (item.price as any);
      const startDate = new Date((subscription.start_date as number) * 1000);

      this.logger.debug(`Calculating period end: Start=${startDate}, Billing Period=${price?.recurring?.interval}`);

      // Calculate based on billing interval
      if (price?.recurring?.interval === 'year') {
        periodEndDate = new Date(startDate);
        periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
      } else if (price?.recurring?.interval === 'month') {
        periodEndDate = new Date(startDate);
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      }
    }

    this.logger.debug(
      `Period end date resolution: Stripe provided=${!!subscription.current_period_end}, User stored=${!!user.currentPeriodEnd}, Calculated=${periodEndDate}`,
    );

    if (!periodEndDate) {
      this.logger.error(
        `Cannot retrieve period end: Stripe current_period_end=${subscription.current_period_end}, User currentPeriodEnd=${user.currentPeriodEnd}, Subscription start_date=${subscription.start_date}`,
      );
      throw new BadRequestException('Unable to retrieve subscription period end date');
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
    if (!subscription.current_period_end || !plan?.price) {
      return 0;
    }

    const periodEndDate = new Date((subscription.current_period_end as number) * 1000);
    const now = new Date();
    const totalDaysInPeriod = Math.ceil(
      ((subscription.current_period_end as number) - (subscription.current_period_start as number)) /
        (60 * 60 * 24),
    );
    const unusedDays = Math.max(
      0,
      Math.ceil(
        (periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    // Calculate refund: (unused days / total days in period) * monthly price
    const refund =
      (unusedDays / totalDaysInPeriod) * (plan.price / 100); // Convert from cents
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
      const subscription = (await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      )) as any;

      // Prepare cancellation data
      let cancellationUpdate: any = {
        metadata: {
          cancelledBy: userId,
          cancelledAt: new Date().toISOString(),
          cancellationMethod,
          cancellationReason: reason || 'not_specified',
        },
      };

      // Set cancellation method
      if (cancellationMethod === 'at_period_end') {
        cancellationUpdate.cancel_at_period_end = true;
      } else {
        // Immediate cancellation
        cancellationUpdate.cancel_at = 'now';
      }

      // Update subscription in Stripe
      await this.stripe.subscriptions.update(
        user.stripeSubscriptionId,
        cancellationUpdate,
      );

      // Calculate refund if applicable
      let refundAmount = 0;
      let refundStatus = 'pending';

      if (cancellationMethod === 'immediate' && refundStrategy === 'full_prorated') {
        refundAmount = this.calculateProRatedRefund(
          subscription,
          user.planId,
        );

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

      // Get period end date
      const periodEndDate = new Date((subscription.current_period_end as number) * 1000);

      // Update user record
      await this.userModel.findByIdAndUpdate(userId, {
        subscriptionStatus:
          cancellationMethod === 'immediate' ? 'canceled' : 'active', // Active until period end
        cancellationMethod,
        cancellationScheduledFor:
          cancellationMethod === 'at_period_end' ? periodEndDate : new Date(),
        cancellationReason: reason,
        cancellationFeedback: feedback,
        refundStatus,
        refundAmount: Math.round(refundAmount * 100) / 100,
        refundCurrency: subscription.currency?.toUpperCase() || 'KWD',
      });

      // Create transaction record for refund
      if (refundAmount > 0) {
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
      }

      // Log activity
      const activityTitle =
        cancellationMethod === 'immediate'
          ? 'Subscription canceled immediately'
          : 'Subscription cancellation scheduled';
      const activityDescription =
        cancellationMethod === 'immediate'
          ? `${user.fullName} cancelled subscription immediately. Refund: ${refundAmount} ${subscription.currency?.toUpperCase()}`
          : `${user.fullName} scheduled subscription cancellation for ${periodEndDate.toLocaleDateString()}`;

      await this.activityService.create({
        type: 'canceled',
        title: activityTitle,
        description: activityDescription,
        relatedEntityId: user._id.toString(),
      });

      this.logger.log(
        `Subscription canceled for user ${userId}, method: ${cancellationMethod}, refund: ${refundAmount}`,
      );

      // Return confirmation details
      return {
        subscriptionId: user.stripeSubscriptionId,
        cancellationDate: new Date(),
        accessUntilDate:
          cancellationMethod === 'at_period_end' ? periodEndDate : undefined,
        refundAmount: Math.round(refundAmount * 100) / 100,
        refundCurrency: subscription.currency?.toUpperCase() || 'KWD',
        refundStatus,
        message:
          cancellationMethod === 'immediate'
            ? `Your subscription has been canceled immediately. A refund of ${Math.round(refundAmount * 100) / 100} ${subscription.currency?.toUpperCase()} will be processed within 5-7 business days.`
            : `Your subscription will remain active until ${periodEndDate.toLocaleDateString()}. After that, you'll be downgraded to the Free plan.`,
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
      )) as any;
    }

    // Prepare update data with proper date handling
    const updateData: any = {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      planId: new Types.ObjectId(planId),
      billingCycle: billingCycle,
      subscriptionStartedAt: new Date(),
    };

    // Set currentPeriodEnd (required field for cancellation)
    if ((subscription as any).current_period_end && typeof (subscription as any).current_period_end === 'number') {
      updateData.currentPeriodEnd = new Date(((subscription as any).current_period_end as number) * 1000);
    } else {
      // Fallback: calculate from billing cycle if Stripe doesn't provide it
      const now = new Date();
      if (billingCycle === 'yearly') {
        updateData.currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      } else {
        updateData.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      }
      this.logger.warn(
        `Webhook: Using fallback currentPeriodEnd for subscription ${subscription.id}`,
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
      `Webhook: Subscription ${subscription.id} saved for user ${userId}. Status: ${user.subscriptionStatus}, Period End: ${user.currentPeriodEnd}`,
    );

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

    // Set currentPeriodEnd (required field for cancellation)
    if ((subscription as any).current_period_end && typeof (subscription as any).current_period_end === 'number') {
      updateData.currentPeriodEnd = new Date(((subscription as any).current_period_end as number) * 1000);
    } else if (user.currentPeriodEnd) {
      // Keep existing value if subscription doesn't provide one
      updateData.currentPeriodEnd = user.currentPeriodEnd;
    } else {
      // Last resort: calculate estimate based on current billing cycle
      const now = new Date();
      const estimatedEnd = new Date(now);
      if (user.billingCycle === 'yearly') {
        estimatedEnd.setFullYear(estimatedEnd.getFullYear() + 1);
      } else {
        estimatedEnd.setMonth(estimatedEnd.getMonth() + 1);
      }
      updateData.currentPeriodEnd = estimatedEnd;
      this.logger.warn(
        `Webhook: Using fallback currentPeriodEnd for subscription ${subscription.id}`,
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
