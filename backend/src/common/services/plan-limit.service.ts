import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Logger } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { BillingPlan } from '../../billing-plan/entities/billing-plan.entity';

/**
 * PlanLimitService
 * 
 * Enforces plan limits across all resources:
 * - Invoices
 * - Quotes
 * - Clients
 * - Receipts
 * - Recurring Invoices
 * 
 * Usage:
 * await this.planLimitService.checkLimit(
 *   userId,
 *   'invoices',
 *   this.invoiceModel,
 *   { isDeleted: { $ne: true } }
 * );
 */

@Injectable()
export class PlanLimitService {
  private logger = new Logger(PlanLimitService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BillingPlan.name) private billingPlanModel: Model<BillingPlan>,
  ) {}

  /**
   * Check if user has reached their plan limit for a resource
   * @param userId - User ID
   * @param resourceType - 'invoices' | 'quotes' | 'clients' | 'receipts' | 'recurringInvoices'
   * @param resourceModel - Mongoose model for the resource
   * @param query - Optional query to filter documents (e.g., { isDeleted: { $ne: true } })
   * @returns { canCreate, used, limit, message }
   */
  async checkLimit(
    userId: string,
    resourceType: 'invoices' | 'quotes' | 'clients' | 'receipts' | 'recurringInvoices',
    resourceModel: any,
    query: any = {},
  ): Promise<{
    canCreate: boolean;
    used: number;
    limit: number;
    message?: string;
  }> {
    try {
      // Fetch user with plan details
      const user = await this.userModel
        .findById(userId)
        .populate('planId', 'name limits');

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let plan = user.planId as any;
      
      // If user doesn't have a plan, assign the default Free plan
      if (!plan) {
        this.logger.warn(`User ${userId} has no billing plan. Looking up Free plan dynamically.`);

        // Dynamically find the Free plan - try multiple strategies
        const freePlan =
          // 1. Exact price = 0
          (await this.billingPlanModel.findOne({ price: 0, status: 'active' }).sort({ createdAt: 1 })) ||
          // 2. Name contains "free" (case-insensitive)
          (await this.billingPlanModel.findOne({ name: /free/i, status: 'active' }).sort({ createdAt: 1 })) ||
          // 3. Cheapest active plan as last resort
          (await this.billingPlanModel.findOne({ status: 'active' }).sort({ price: 1, createdAt: 1 }));

        if (!freePlan) {
          this.logger.error('No billing plans found in the database at all.');
          throw new BadRequestException('Failed to assign default billing plan. Please contact support.');
        }

        // Update user with the actual Free plan ID from DB
        await this.userModel.findByIdAndUpdate(userId, {
          planId: freePlan._id,
          subscriptionStatus: 'free',
          billingCycle: 'monthly',
        });

        plan = freePlan;
        this.logger.log(`Assigned Free plan "${freePlan.name}" (${freePlan._id}) to user ${userId}.`);
      }

      // Get the limit from plan
      const limit = plan.limits?.[resourceType] ?? 0;

      // If limit is -1, it means unlimited
      if (limit === -1) {
        return {
          canCreate: true,
          used: 0,
          limit: -1,
        };
      }

      // Count current usage
      const used = await resourceModel.countDocuments({
        userId: new Types.ObjectId(userId),
        ...query,
      });

      const canCreate = used < limit;

      // Generate message
      let message = '';
      if (limit === 0) {
        message = `Your ${plan.name} plan does not support ${resourceType}. Upgrade to a higher plan to enable ${resourceType}.`;
      } else if (!canCreate) {
        message = `You have reached your ${resourceType} limit (${limit}). Upgrade your plan to create more ${resourceType}.`;
      } else {
        const remaining = limit - used;
        message = `${remaining} ${resourceType} remaining (${used}/${limit})`;
      }

      this.logger.log(
        `[PlanLimit] User ${userId}: ${resourceType} - ${used}/${limit} (${plan.name})`,
      );

      return {
        canCreate,
        used,
        limit,
        message,
      };
    } catch (error) {
      this.logger.error(`[PlanLimit] Error checking limit for ${resourceType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Throw error if user exceeded limit (use in create operations)
   */
  async enforceLimit(
    userId: string,
    resourceType: 'invoices' | 'quotes' | 'clients' | 'receipts' | 'recurringInvoices',
    resourceModel: any,
    query: any = {},
  ): Promise<void> {
    const { canCreate, message } = await this.checkLimit(
      userId,
      resourceType,
      resourceModel,
      query,
    );

    if (!canCreate) {
      throw new BadRequestException(message);
    }
  }

  /**
   * Get usage statistics for user dashboard
   */
  async getUserUsage(
    userId: string,
    invoiceModel: any,
    quoteModel: any,
    clientModel: any,
    receiptModel: any,
    recurringModel: any,
  ): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .populate('planId', 'limits');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = user.planId as any;
    const limits = plan?.limits || {};

    const [invoicesCount, quotesCount, clientsCount, receiptsCount, recurringCount] =
      await Promise.all([
        invoiceModel.countDocuments({ userId: new Types.ObjectId(userId), isDeleted: { $ne: true } }),
        quoteModel.countDocuments({ userId: new Types.ObjectId(userId), isDeleted: { $ne: true } }),
        clientModel.countDocuments({ userId: new Types.ObjectId(userId) }),
        receiptModel.countDocuments({ userId: new Types.ObjectId(userId) }),
        recurringModel.countDocuments({ userId: new Types.ObjectId(userId) }),
      ]);

    return {
      invoices: {
        used: invoicesCount,
        limit: limits.invoices === -1 ? 'Unlimited' : limits.invoices ?? 0,
        canCreate: limits.invoices === -1 || invoicesCount < limits.invoices,
      },
      quotes: {
        used: quotesCount,
        limit: limits.quotes === -1 ? 'Unlimited' : limits.quotes ?? 0,
        canCreate: limits.quotes === -1 || quotesCount < limits.quotes,
      },
      clients: {
        used: clientsCount,
        limit: limits.clients === -1 ? 'Unlimited' : limits.clients ?? 0,
        canCreate: limits.clients === -1 || clientsCount < limits.clients,
      },
      receipts: {
        used: receiptsCount,
        limit: limits.receipts === -1 ? 'Unlimited' : limits.receipts ?? 0,
        canCreate: limits.receipts === -1 || receiptsCount < limits.receipts,
      },
      recurringInvoices: {
        used: recurringCount,
        limit: limits.recurringInvoices === -1 ? 'Unlimited' : limits.recurringInvoices ?? 0,
        canCreate: limits.recurringInvoices === -1 || recurringCount < limits.recurringInvoices,
      },
    };
  }
}
