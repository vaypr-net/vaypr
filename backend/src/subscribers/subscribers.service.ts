import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Client } from '../clients/entities/client.entity';
import { Receipt } from '../reciept/entities/reciept.entity';
import { Recurring } from '../recurring/entities/recurring.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { CurrencyService } from '../common/services/currency.service';
import { SubscriberActor, SubscriberLifecycleService, needsFreePlan } from '../common/services/subscriber-lifecycle.service';
import { ManageSubscriberDto } from './dto/manage-subscriber.dto';

type UiStatus = 'active' | 'inactive' | 'free' | 'canceled';
type UiBillingCycle = 'monthly' | 'yearly';

export interface SubscriberUsage {
  invoices: { used: number; limit: number };
  quotes: { used: number; limit: number };
  clients: { used: number; limit: number };
  teamMembers: { used: number; limit: number };
  receipts: { used: number; limit: number };
  recurringInvoices: { used: number; limit: number };
  storage: { used: number; limit: string; unit: 'GB' };
}

export interface SubscriberResponse {
  _id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscriptionType: UiBillingCycle;
  subscriptionDate: string;
  status: UiStatus;
  lifetimeSpend: number;
  lastPaymentDate: string;
  nextRenewalDate: string | null;
  internalNotes?: string;
  version?: string;
  archivedAt?: string | null;
  archiveReason?: string;
  paidAccessEndsAt?: string | null;
  paidAccessEndedAt?: string | null;
  paymentProvider?: string;
  paymentEnvironment?: string;
  managementHistory?: User['subscriberManagementHistory'];
  usage?: SubscriberUsage;
  billing?: {
    paymentMethod: string;
    paymentMethodDetails: string;
    recentInvoices: Array<{
      id: string;
      date: string;
      amount: number;
      currency: string;
      status: 'succeeded' | 'failed' | 'refunded' | 'pending';
      environment?: string;
      provider?: string;
    }>;
  };
  createdAt: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  free: number;
  canceled: number;
  inactive: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BillingPlan.name) private billingPlanModel: Model<BillingPlan>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Receipt.name) private receiptModel: Model<Receipt>,
    @InjectModel(Recurring.name) private recurringModel: Model<Recurring>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private currencyService: CurrencyService,
    private readonly lifecycle: SubscriberLifecycleService,
    @InjectModel('HesabeSandboxTransaction') private readonly sandboxTransactions: Model<Transaction>,
  ) {}

  private managementFields(user: any) {
    return {
      version: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
      archivedAt: user.subscriberArchivedAt ? new Date(user.subscriberArchivedAt).toISOString() : null,
      archiveReason: user.subscriberArchiveReason || '',
      paidAccessEndsAt: user.paidAccessEndsAt ? new Date(user.paidAccessEndsAt).toISOString() : null,
      paidAccessEndedAt: user.paidAccessEndedAt ? new Date(user.paidAccessEndedAt).toISOString() : null,
      paymentProvider: user.paymentProvider,
      paymentEnvironment: user.paymentEnvironment,
    };
  }

  private mapStatus(status: string | undefined): UiStatus {
    switch (status) {
      case 'active':
      case 'trialing':
      case 'past_due':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'free':
        return 'free';
      default:
        return 'inactive';
    }
  }

  private mapStatusToSubscriptionStatus(status: UiStatus): string {
    switch (status) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'free':
        return 'free';
      default:
        return 'incomplete';
    }
  }

  private getCompanyFromEmail(email: string): string {
    return email?.split('@')?.[1] || 'N/A';
  }

  private normalizeLimit(limit: unknown): number {
    if (typeof limit !== 'number') return 0;
    return limit;
  }

  private async buildUsage(userId: Types.ObjectId, planLimits: any): Promise<SubscriberUsage> {
    const [invoicesCount, quotesCount, clientsCount, receiptsCount, recurringCount] = await Promise.all([
      this.invoiceModel.countDocuments({ userId, isDeleted: { $ne: true } }),
      this.quoteModel.countDocuments({ userId, isDeleted: { $ne: true } }),
      this.clientModel.countDocuments({ userId }),
      this.receiptModel.countDocuments({ userId }),
      this.recurringModel.countDocuments({ userId }),
    ]);

    return {
      invoices: { used: invoicesCount, limit: this.normalizeLimit(planLimits?.invoices) },
      quotes: { used: quotesCount, limit: this.normalizeLimit(planLimits?.quotes) },
      clients: { used: clientsCount, limit: this.normalizeLimit(planLimits?.clients) },
      teamMembers: { used: 1, limit: this.normalizeLimit(planLimits?.teamMembers) },
      receipts: { used: receiptsCount, limit: this.normalizeLimit(planLimits?.receipts) },
      recurringInvoices: { used: recurringCount, limit: this.normalizeLimit(planLimits?.recurringInvoices) },
      storage: {
        used: 0,
        limit: typeof planLimits?.storage === 'string' ? planLimits.storage : '0GB',
        unit: 'GB',
      },
    };
  }

  async findAll(
    search?: string,
    status?: string,
    subscriptionType?: string,
    limit: number = 50,
    offset: number = 0,
    visibility: string = 'active',
  ): Promise<{
    items: SubscriberResponse[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    if (!['active', 'archived', 'all'].includes(visibility)) throw new BadRequestException('Invalid visibility filter');
    await this.lifecycle.expireDueAccess();
    limit = Math.min(Math.max(Number.isFinite(limit) ? limit : 50, 1), 500);
    offset = Math.max(Number.isFinite(offset) ? offset : 0, 0);
    const query: any = {
      isSuperAdmin: { $ne: true },
    };
    if (visibility === 'active') query.subscriberArchivedAt = null;
    if (visibility === 'archived') query.subscriberArchivedAt = { $ne: null };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      if (status === 'active') {
        query.subscriptionStatus = { $in: ['active', 'trialing', 'past_due'] };
      } else if (status === 'inactive') {
        query.subscriptionStatus = 'incomplete';
      } else if (status === 'free') {
        query.subscriptionStatus = 'free';
      } else if (status === 'canceled') {
        query.subscriptionStatus = 'canceled';
      }
    }

    if (subscriptionType) {
      query.billingCycle = subscriptionType;
    }

    const total = await this.userModel.countDocuments(query);

    const users = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-password -googleAccessToken -googleRefreshToken')
      .populate('planId', 'name')
      .lean();

    const userIds = users.map((u: any) => u._id).filter(Boolean);

    const txAgg = await this.transactionModel.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          type: 'subscription',
          status: 'succeeded',
        },
      },
      {
        $group: {
          _id: '$userId',
          lifetimeSpend: { $sum: '$amount' },
          lastPaymentDate: { $max: '$transactionDate' },
        },
      },
    ]);

    const txMap = new Map<string, { lifetimeSpend: number; lastPaymentDate: Date | null }>(
      txAgg.map((row: any) => [
        row._id?.toString(),
        { lifetimeSpend: row.lifetimeSpend || 0, lastPaymentDate: row.lastPaymentDate || null },
      ]),
    );

    const subscribers: SubscriberResponse[] = users.map((user: any) => {
      const tx = txMap.get(user._id.toString());
      const uiStatus = this.mapStatus(user.subscriptionStatus);
      // Convert lifetime spend from AED to display currency (KWD)
      const lifetimeSpendAED = tx?.lifetimeSpend || 0;
      const lifetimeSpendConverted = this.currencyService.convertToDisplayCurrency(lifetimeSpendAED);

      return {
        _id: user._id.toString(),
        name: user.fullName,
        email: user.email,
        company: this.getCompanyFromEmail(user.email),
        plan: needsFreePlan(user) ? 'Free' : user.planId?.name || 'Free',
        subscriptionType: (user.billingCycle as UiBillingCycle) || 'monthly',
        subscriptionDate: (user.subscriptionStartedAt || user.createdAt || new Date()).toISOString(),
        status: uiStatus,
        lifetimeSpend: Math.round(lifetimeSpendConverted * 100) / 100,
        lastPaymentDate: tx?.lastPaymentDate ? new Date(tx.lastPaymentDate).toISOString() : '-',
        nextRenewalDate: user.currentPeriodEnd ? new Date(user.currentPeriodEnd).toISOString() : null,
        internalNotes: user.internalNotes || '',
        createdAt: (user.createdAt || new Date()).toISOString(),
        ...this.managementFields(user),
      };
    });

    return {
      items: subscribers,
      total,
      limit,
      offset,
      hasMore: offset + users.length < total,
    };
  }

  async findOne(id: string): Promise<SubscriberResponse> {
    await this.lifecycle.expireDueAccess(id);
    const user = await this.userModel
      .findById(id)
      .select('-password -googleAccessToken -googleRefreshToken')
      .populate('planId', 'name limits price')
      .lean();

    if (!user) {
      throw new NotFoundException('Subscriber not found');
    }
    if (user.isSuperAdmin) throw new ForbiddenException('Super-admin accounts cannot be managed as subscribers');

    const [txAgg] = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(id),
          type: 'subscription',
          status: 'succeeded',
        },
      },
      {
        $group: {
          _id: '$userId',
          lifetimeSpend: { $sum: '$amount' },
          lastPaymentDate: { $max: '$transactionDate' },
        },
      },
    ]);

    const recentTransactions = await this.transactionModel
      .find({
        userId: new Types.ObjectId(id),
        type: 'subscription',
      })
      .sort({ transactionDate: -1 })
      .limit(5)
      .lean();

    // Historical records are read locally; administration never contacts a payment provider.
    const sandboxHistory = await this.sandboxTransactions.find({ userId: new Types.ObjectId(id) })
      .sort({ transactionDate: -1 }).limit(50).lean();
    const paymentMethod = user.paymentProvider === 'hesabe' ? 'Hesabe' : 'Historical payments';
    const paymentMethodDetails = user.paymentProvider === 'hesabe'
      ? `${user.paymentEnvironment === 'sandbox' ? 'Sandbox test payments' : 'Fixed-term payments'} · Manual renewal`
      : 'Recorded transactions only';

    const planDoc: any = await this.lifecycle.effectivePlan(user);
    const usage = await this.buildUsage(new Types.ObjectId(id), planDoc?.limits || {});

    // Convert lifetime spend from AED to display currency (KWD)
    const lifetimeSpendAED = txAgg?.lifetimeSpend || 0;
    const lifetimeSpendConverted = this.currencyService.convertToDisplayCurrency(lifetimeSpendAED);

    return {
      _id: user._id.toString(),
      name: user.fullName,
      email: user.email,
      company: this.getCompanyFromEmail(user.email),
      plan: planDoc?.name || 'Free',
      subscriptionType: (user.billingCycle as UiBillingCycle) || 'monthly',
      subscriptionDate: (user.subscriptionStartedAt || user.createdAt || new Date()).toISOString(),
      status: this.mapStatus(user.subscriptionStatus),
      lifetimeSpend: Math.round(lifetimeSpendConverted * 100) / 100,
      lastPaymentDate: txAgg?.lastPaymentDate ? new Date(txAgg.lastPaymentDate).toISOString() : '-',
      nextRenewalDate: user.currentPeriodEnd ? new Date(user.currentPeriodEnd).toISOString() : null,
      internalNotes: user.internalNotes || '',
      ...this.managementFields(user),
      managementHistory: (user.subscriberManagementHistory || []).slice(-100).reverse(),
      usage,
      billing: {
        paymentMethod,
        paymentMethodDetails,
        recentInvoices: [...sandboxHistory.map((tx: any) => ({
          id: tx.transactionId || String(tx._id), date: new Date(tx.transactionDate || tx.createdAt).toISOString(),
          amount: tx.amount || 0, currency: tx.currency || 'KWD', status: tx.status || 'pending',
          provider: 'hesabe', environment: 'sandbox',
        })), ...recentTransactions.map((tx: any) => {
          // Convert transaction amount from AED to display currency (KWD)
          const amountAED = tx.amount || 0;
          const amountConverted = this.currencyService.convertToDisplayCurrency(amountAED);
          return {
            id: tx.transactionId || tx._id.toString(),
            date: tx.transactionDate ? new Date(tx.transactionDate).toISOString() : new Date().toISOString(),
            amount: Math.round(amountConverted * 100) / 100,
            currency: tx.currency || 'KWD',
            status: tx.status || 'pending',
          };
        })].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      },
      createdAt: (user.createdAt || new Date()).toISOString(),
    };
  }

  async manage(id: string, body: ManageSubscriberDto, actor: SubscriberActor): Promise<SubscriberResponse> {
    if (!body.reason?.trim() || body.reason.trim().length < 3) throw new BadRequestException('Please enter a reason');
    await this.lifecycle.manage(id, actor, body.action, body.reason.trim(), body.mode, body.expectedUpdatedAt);
    return this.findOne(id);
  }

  async update(id: string, updateSubscriberDto: UpdateSubscriberDto, actor: SubscriberActor): Promise<SubscriberResponse> {
    await this.lifecycle.expireDueAccess(id);
    const existingUser = await this.userModel.findById(id).populate('planId', 'name');
    if (!existingUser) {
      throw new NotFoundException('Subscriber not found');
    }
    if (existingUser.isSuperAdmin || actor.userId === id) throw new ForbiddenException('Super-admin accounts cannot be managed as subscribers');
    if (updateSubscriberDto.status === 'canceled') {
      return this.manage(id, { action: 'end_paid_access', mode: 'immediately', reason: 'Administrator ended paid access', expectedUpdatedAt: existingUser.updatedAt.toISOString() }, actor);
    }
    if (updateSubscriberDto.status !== undefined && !updateSubscriberDto.plan) {
      throw new BadRequestException('Use End Paid Access to change subscription access');
    }

    const updateData: any = {};

    if (updateSubscriberDto.name !== undefined) {
      updateData.fullName = updateSubscriberDto.name;
    }
    if (updateSubscriberDto.email !== undefined) {
      updateData.email = updateSubscriberDto.email;
    }
    if (updateSubscriberDto.subscriptionType !== undefined) {
      updateData.billingCycle = updateSubscriberDto.subscriptionType;
    }
    if (updateSubscriberDto.internalNotes !== undefined) {
      updateData.internalNotes = updateSubscriberDto.internalNotes;
    }
    if (updateSubscriberDto.status !== undefined) {
      updateData.subscriptionStatus = this.mapStatusToSubscriptionStatus(
        updateSubscriberDto.status as UiStatus,
      );
    }

    if (updateSubscriberDto.plan !== undefined) {
      const requestedPlan = updateSubscriberDto.plan.trim();
      const isFreePlan = requestedPlan.toLowerCase() === 'free';

      if (isFreePlan) {
        updateData.planId = (await this.lifecycle.freePlan())._id;
        updateData.subscriptionStatus = 'free';
        updateData.subscriptionAmount = 0;
      } else {
        const plan = await this.billingPlanModel.findOne({
          name: { $regex: `^${requestedPlan}$`, $options: 'i' },
        });
        if (!plan) {
          throw new NotFoundException(`Billing plan '${requestedPlan}' not found`);
        }

        updateData.planId = plan._id;
        updateData.subscriptionStatus = 'active';
        updateData.subscriptionAmount = plan.price > 0 ? plan.price : 0;
      }
      updateData.paidAccessEndsAt = null;
      updateData.paidAccessEndedAt = null;
      updateData.paidAccessEndReason = '';
    }

    await this.lifecycle.updateWithHistory(existingUser, updateData,
      updateSubscriberDto.plan ? 'plan_changed' : 'profile_updated', actor,
      updateSubscriberDto.plan ? 'Administrator changed plan; no payment action' : 'Administrator updated subscriber profile');
    return this.findOne(id);
  }

  async getStats(): Promise<SubscriberStats> {
    const [total, active, free, canceled, incomplete, revenueAgg, monthlyRevenueAgg] =
      await Promise.all([
        this.userModel.countDocuments({ isSuperAdmin: { $ne: true } }),
        this.userModel.countDocuments({
          isSuperAdmin: { $ne: true },
          subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
        }),
        this.userModel.countDocuments({
          isSuperAdmin: { $ne: true },
          subscriptionStatus: 'free',
        }),
        this.userModel.countDocuments({
          isSuperAdmin: { $ne: true },
          subscriptionStatus: 'canceled',
        }),
        this.userModel.countDocuments({
          isSuperAdmin: { $ne: true },
          subscriptionStatus: 'incomplete',
        }),
        this.transactionModel.aggregate([
          { $match: { type: 'subscription', status: 'succeeded' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.transactionModel.aggregate([
          {
            $match: {
              type: 'subscription',
              status: 'succeeded',
              transactionDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    // Convert revenue from AED to display currency (KWD)
    const totalRevenueAED = revenueAgg[0]?.total || 0;
    const monthlyRevenueAED = monthlyRevenueAgg[0]?.total || 0;
    const totalRevenueConverted = this.currencyService.convertToDisplayCurrency(totalRevenueAED);
    const monthlyRevenueConverted = this.currencyService.convertToDisplayCurrency(monthlyRevenueAED);

    return {
      total,
      active,
      free,
      canceled,
      inactive: incomplete,
      totalRevenue: Math.round(totalRevenueConverted * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenueConverted * 100) / 100,
    };
  }
}
