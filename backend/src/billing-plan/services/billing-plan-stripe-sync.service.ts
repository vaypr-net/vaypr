import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { BillingPlan } from '../entities/billing-plan.entity';

/**
 * BillingPlanStripeSyncService
 * 
 * Automatically creates and manages Stripe Products and Prices for billing plans.
 * - Ensures Stripe product exists for a plan
 * - Creates/reuses Stripe prices for enabled intervals (monthly/yearly)
 * - Handles currency conversion (KWD → AED for Stripe)
 * - Stores Stripe IDs back into the plan for use in checkout
 */
@Injectable()
export class BillingPlanStripeSyncService {
  private stripe: Stripe;
  private logger = new Logger(BillingPlanStripeSyncService.name);

  // KWD to AED conversion rate (approximately 1 KWD = 3.31 AED)
  private readonly KWD_TO_AED_RATE = 3.31;

  constructor(
    @InjectModel(BillingPlan.name) private billingPlanModel: Model<BillingPlan>,
    private configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  /**
   * Sync a plan to Stripe - creates/updates product and prices
   * Main entry point that orchestrates the sync process
   */
  async syncPlanToStripe(planId: string): Promise<BillingPlan | null> {
    if (!this.stripe) {
      this.logger.warn(
        `Stripe not configured. Skipping sync for plan ${planId}`,
      );
      return this.billingPlanModel.findById(planId).exec();
    }

    try {
      const plan = await this.billingPlanModel.findById(planId);
      if (!plan) {
        this.logger.error(`Plan ${planId} not found`);
        return null;
      }

      // Step 1: Ensure product exists
      const stripeProductId = await this.ensureProduct(plan);

      // Step 2: Ensure prices exist for enabled intervals
      const stripePrices = await this.ensurePrices(plan, stripeProductId);

      // Step 3: Save back to database
      const updatedPlan = await this.billingPlanModel.findByIdAndUpdate(
        planId,
        {
          stripeProductId,
          stripePrices,
        },
        { new: true },
      );

      this.logger.log(
        `Synced plan ${plan.name} to Stripe: productId=${stripeProductId}, prices=${JSON.stringify(stripePrices)}`,
      );

      return updatedPlan;
    } catch (error) {
      this.logger.error(`Failed to sync plan ${planId} to Stripe: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ensure a Stripe Product exists for the plan
   * Creates new product if stripeProductId is missing, otherwise returns existing
   */
  async ensureProduct(plan: any): Promise<string> {
    // If product already exists, return it
    if (plan.stripeProductId) {
      this.logger.log(
        `Plan ${plan.name} already has Stripe product ${plan.stripeProductId}`,
      );
      return plan.stripeProductId;
    }

    try {
      // Create new Stripe product
      const product = await this.stripe.products.create({
        name: plan.name,
        description:
          plan.description ||
          `${plan.name} subscription plan - ${plan.features.join(', ')}`,
        metadata: {
          planId: plan._id.toString(),
          planName: plan.name,
        },
      });

      this.logger.log(
        `Created Stripe product ${product.id} for plan ${plan.name}`,
      );

      return product.id;
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe product for plan ${plan.name}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Ensure Stripe Prices exist for the plan's enabled intervals in AED
   * Creates prices for monthly and yearly if they don't exist
   */
  async ensurePrices(
    plan: any,
    stripeProductId: string,
  ): Promise<Record<string, string>> {
    const stripePrices: Record<string, string> = {
      ...(plan.stripePrices || {}),
    };

    // Intervals to create prices for
    const intervals = ['monthly', 'yearly'];

    for (const interval of intervals) {
      const priceKey = `AED-${interval}`;

      // Skip if price already exists
      if (stripePrices[priceKey]) {
        this.logger.log(
          `Plan ${plan.name} already has ${priceKey} price: ${stripePrices[priceKey]}`,
        );
        continue;
      }

      try {
        // Calculate price in AED
        const priceInAED = Math.round(plan.price * this.KWD_TO_AED_RATE);

        // Map interval names: 'monthly' -> 'month', 'yearly' -> 'year' for Stripe API
        const stripeInterval = interval === 'yearly' ? 'year' : 'month';

        // For yearly, apply 10% discount
        const amountInCents =
          interval === 'yearly'
            ? Math.round(priceInAED * 12 * 0.9) * 100 // 10% discount
            : priceInAED * 100; // Monthly

        const price = await this.stripe.prices.create({
          product: stripeProductId,
          currency: 'aed',
          unit_amount: amountInCents,
          recurring: {
            interval: stripeInterval as 'month' | 'year',
            usage_type: 'licensed',
          },
          metadata: {
            planId: plan._id.toString(),
            billingCycle: interval,
          },
        });

        stripePrices[priceKey] = price.id;
        this.logger.log(
          `Created Stripe ${interval} price ${price.id} for plan ${plan.name}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create ${interval} price for plan ${plan.name}: ${error.message}`,
        );
        throw error;
      }
    }

    return stripePrices;
  }

  /**
   * Check if a plan is fully synced to Stripe
   * Returns true if stripeProductId and both AED prices exist
   */
  async isPlanSynced(plan: any): Promise<boolean> {
    return (
      !!plan.stripeProductId &&
      !!plan.stripePrices?.['AED-monthly'] &&
      !!plan.stripePrices?.['AED-yearly']
    );
  }
}
