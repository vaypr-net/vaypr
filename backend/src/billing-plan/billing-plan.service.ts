import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBillingPlanDto } from './dto/create-billing-plan.dto';
import { UpdateBillingPlanDto } from './dto/update-billing-plan.dto';
import { BillingPlan } from './entities/billing-plan.entity';

@Injectable()
export class BillingPlanService {
  constructor(
    @InjectModel(BillingPlan.name) private billingPlanModel: Model<BillingPlan>,
  ) {}

  async create(createBillingPlanDto: CreateBillingPlanDto): Promise<BillingPlan> {
    const newPlan = new this.billingPlanModel({
      ...createBillingPlanDto,
      currency: createBillingPlanDto.currency || 'KWD',
      status: createBillingPlanDto.status || 'active',
      subscriberCount: 0,
    });
    return newPlan.save();
  }

  async findAll(
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    items: BillingPlan[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const query: any = {};

    if (status) {
      query.status = status;
    }

    const total = await this.billingPlanModel.countDocuments(query);
    const items = await this.billingPlanModel
      .find(query)
      .sort({ price: 1 }) // Sort by price ascending (Free -> Paid -> Enterprise)
      .limit(limit)
      .skip(offset);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async findOne(id: string): Promise<BillingPlan> {
    const plan = await this.billingPlanModel.findById(id);
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return plan;
  }

  async update(id: string, updateBillingPlanDto: UpdateBillingPlanDto): Promise<BillingPlan> {
    const plan = await this.billingPlanModel.findByIdAndUpdate(
      id,
      updateBillingPlanDto,
      { new: true },
    );
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return plan;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const plan = await this.billingPlanModel.findByIdAndDelete(id);
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return { success: true, message: 'Billing plan deleted successfully' };
  }

  /**
   * Set Stripe price IDs for a billing plan
   * Used when configuring Stripe payment processing
   */
  async setStripePriceIds(
    planId: string,
    monthlyPriceId: string,
    yearlyPriceId: string,
  ): Promise<BillingPlan> {
    const plan = await this.billingPlanModel.findByIdAndUpdate(
      planId,
      {
        stripeMonthlyPriceId: monthlyPriceId,
        stripeYearlyPriceId: yearlyPriceId,
      },
      { new: true },
    );
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return plan;
  }

  /**
   * Set Stripe price IDs by plan name
   * Useful for seeding/updating plans by name
   */
  async setStripePriceIdsByName(
    planName: string,
    monthlyPriceId: string,
    yearlyPriceId: string,
  ): Promise<BillingPlan> {
    const plan = await this.billingPlanModel.findOneAndUpdate(
      { name: planName },
      {
        stripeMonthlyPriceId: monthlyPriceId,
        stripeYearlyPriceId: yearlyPriceId,
      },
      { new: true },
    );
    if (!plan) {
      throw new NotFoundException(`Billing plan with name "${planName}" not found`);
    }
    return plan;
  }

  /**
   * Set Stripe price ID for a specific currency and billing cycle
   * Supports multi-currency pricing
   */
  async setStripePriceByCurrency(
    planId: string,
    currency: string,
    billingCycle: 'monthly' | 'yearly',
    priceId: string,
  ): Promise<BillingPlan> {
    const key = `${currency.toUpperCase()}-${billingCycle}`;
    const update = {
      $set: {
        [`stripePrices.${key}`]: priceId,
      },
    };

    const plan = await this.billingPlanModel.findByIdAndUpdate(planId, update, {
      new: true,
    });

    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }

    return plan;
  }

  /**
   * Set multiple Stripe prices for a plan
   * Example: { 'USD-monthly': 'price_xxx', 'USD-yearly': 'price_yyy', 'AED-monthly': 'price_zzz', ... }
   */
  async setStripePrices(
    planId: string,
    stripePrices: Record<string, string>,
  ): Promise<BillingPlan> {
    const plan = await this.billingPlanModel.findByIdAndUpdate(
      planId,
      { stripePrices },
      { new: true },
    );

    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }

    return plan;
  }

  /**
   * Get all Stripe prices for a plan
   */
  async getStripePricesForPlan(planId: string): Promise<Record<string, string>> {
    const plan = await this.billingPlanModel.findById(planId);
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return plan.stripePrices || {};
  }

  async getStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    hiddenPlans: number;
    archivedPlans: number;
    totalSubscribers: number;
  }> {
    const [totalPlans, activePlans, hiddenPlans, archivedPlans] = await Promise.all([
      this.billingPlanModel.countDocuments(),
      this.billingPlanModel.countDocuments({ status: 'active' }),
      this.billingPlanModel.countDocuments({ status: 'hidden' }),
      this.billingPlanModel.countDocuments({ status: 'archived' }),
    ]);

    const plans = await this.billingPlanModel.find();
    const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscriberCount || 0), 0);

    return {
      totalPlans,
      activePlans,
      hiddenPlans,
      archivedPlans,
      totalSubscribers,
    };
  }
}

