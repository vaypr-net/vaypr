import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { Referral } from '../affiliate/entities/referral.entity';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Affiliate } from '../affiliate/entities/affiliate.entity';
import { Coupon } from '../affiliate/entities/coupon.entity';
import { CommissionPlan } from '../affiliate/entities/commission-plan.entity';
import { CurrencyService } from '../common/services/currency.service';

type MonthRange = {
  monthKey: string;
  monthLabel: string;
  start: Date;
  end: Date;
};

@Injectable()
export class SuperAdminReportsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
    @InjectModel(BillingPlan.name) private readonly billingPlanModel: Model<BillingPlan>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>,
    @InjectModel(Affiliate.name) private readonly affiliateModel: Model<Affiliate>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>,
    @InjectModel(CommissionPlan.name) private readonly commissionPlanModel: Model<CommissionPlan>,
    private readonly currencyService: CurrencyService,
  ) {}

  async getAnalytics() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      affiliateReferralsCurrent,
      affiliateReferralsPrev,
      monthlySubscribersCurrent,
      monthlySubscribersPrev,
      yearlySubscribersCurrent,
      yearlySubscribersPrev,
      paidSubscribersCurrent,
      paidSubscribersPrev,
      freeSubscribersCurrent,
      freeSubscribersPrev,
      canceledSubscribersCurrent,
      canceledSubscribersPrev,
      enterpriseSubscribersCurrent,
      enterpriseSubscribersPrev,
      revenueByPlanRaw,
    ] = await Promise.all([
      this.referralModel.countDocuments({
        conversionDate: { $gte: thisMonthStart, $lt: nextMonthStart },
      }),
      this.referralModel.countDocuments({
        conversionDate: { $gte: prevMonthStart, $lt: thisMonthStart },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        billingCycle: 'monthly',
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        billingCycle: 'monthly',
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
        createdAt: { $lt: thisMonthStart },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        billingCycle: 'yearly',
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        billingCycle: 'yearly',
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
        createdAt: { $lt: thisMonthStart },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
        createdAt: { $lt: thisMonthStart },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionStatus: 'free',
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionStatus: 'free',
        createdAt: { $lt: thisMonthStart },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionStatus: 'canceled',
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionStatus: 'canceled',
        createdAt: { $lt: thisMonthStart },
      }),
      this.getEnterpriseCount(),
      this.getEnterpriseCount(thisMonthStart),
      this.transactionModel
        .find({ type: 'subscription', status: 'succeeded' })
        .select('amount currency plan')
        .lean(),
    ]);

    const monthRanges = this.buildLastMonths(6);

    // Build planDistributionData with currency conversion
    const planRevMap = new Map<string, number>();
    for (const tx of revenueByPlanRaw as any[]) {
      const plan = tx.plan || 'Unknown';
      planRevMap.set(plan, (planRevMap.get(plan) || 0) + this.convertToDisplayAmount(tx.amount, tx.currency));
    }

    const [revenueByMonth, conversionByMonth, affiliatePerformance, transactionStats, overviewStats, subscriberStats, ticketStats, affiliateStats, billingPlanStats] = await Promise.all([
      this.getRevenueByMonth(monthRanges),
      this.getConversionByMonth(monthRanges),
      this.getAffiliatePerformanceByMonth(monthRanges),
      this.getTransactionStats(),
      this.getOverviewStats(),
      this.getSubscriberStats(),
      this.getTicketStats(),
      this.getAffiliateGlobalStats(),
      this.getBillingPlanStats(),
    ]);

    const planColors = [
      'hsl(217, 91%, 60%)',
      'hsl(262, 83%, 58%)',
      'hsl(142, 76%, 36%)',
      'hsl(45, 93%, 47%)',
      'hsl(0, 84%, 60%)',
      'hsl(199, 89%, 48%)',
    ];

    const planDistributionData = Array.from(planRevMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, revenue], index) => ({
        name,
        value: Math.round(revenue * 100) / 100,
        color: planColors[index % planColors.length],
      }));

    return {
      metrics: [
        this.metric('Affiliate Referrals', affiliateReferralsCurrent, affiliateReferralsPrev),
        this.metric('Monthly Subscribers', monthlySubscribersCurrent, monthlySubscribersPrev),
        this.metric('Yearly Subscribers', yearlySubscribersCurrent, yearlySubscribersPrev),
        this.metric('Paid Subscribers', paidSubscribersCurrent, paidSubscribersPrev),
      ],
      secondaryMetrics: [
        this.metric('Free Subscribers', freeSubscribersCurrent, freeSubscribersPrev),
        this.metric('Enterprise Subscribers', enterpriseSubscribersCurrent, enterpriseSubscribersPrev),
        this.metric('Canceled Subscribers', canceledSubscribersCurrent, canceledSubscribersPrev),
      ],
      revenueByMonth,
      conversionByMonth,
      planDistributionData,
      affiliatePerformance,
      transactionStats,
      overviewStats,
      subscriberStats,
      ticketStats,
      affiliateStats,
      billingPlanStats,
    };
  }

  private metric(label: string, value: number, previousValue: number) {
    const diff = value - previousValue;
    const percent =
      previousValue > 0 ? (diff / previousValue) * 100 : value > 0 ? 100 : 0;

    return {
      label,
      value,
      changePercent: Number(percent.toFixed(1)),
      positive: diff >= 0,
    };
  }

  private buildLastMonths(monthCount: number): MonthRange[] {
    const now = new Date();
    const ranges: MonthRange[] = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = start.toLocaleString('en-US', { month: 'short' });
      ranges.push({ monthKey, monthLabel, start, end });
    }

    return ranges;
  }

  private async getRevenueByMonth(ranges: MonthRange[]) {
    const earliest = ranges[0].start;
    const latest = ranges[ranges.length - 1].end;

    const txns = await this.transactionModel
      .find({ type: 'subscription', status: 'succeeded', transactionDate: { $gte: earliest, $lt: latest } })
      .select('amount currency transactionDate')
      .lean();

    const byMonth = new Map<string, number>();
    for (const tx of txns) {
      const d = new Date((tx as any).transactionDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + this.convertToDisplayAmount((tx as any).amount, (tx as any).currency));
    }

    return ranges.map((range) => ({
      month: range.monthLabel,
      mrr: byMonth.get(range.monthKey) || 0,
    }));
  }

  private async getConversionByMonth(ranges: MonthRange[]) {
    const results = await Promise.all(
      ranges.map(async (range) => {
        const [newUsers, paidTransactions] = await Promise.all([
          this.userModel.countDocuments({
            isSuperAdmin: { $ne: true },
            createdAt: { $gte: range.start, $lt: range.end },
          }),
          this.transactionModel.countDocuments({
            type: 'subscription',
            status: 'succeeded',
            transactionDate: { $gte: range.start, $lt: range.end },
          }),
        ]);

        const rate = newUsers > 0 ? (paidTransactions / newUsers) * 100 : 0;

        return {
          month: range.monthLabel,
          rate: Number(Math.min(100, rate).toFixed(1)),
        };
      }),
    );

    return results;
  }

  private async getAffiliatePerformanceByMonth(ranges: MonthRange[]) {
    const earliest = ranges[0].start;
    const latest = ranges[ranges.length - 1].end;

    const grouped = await this.referralModel.aggregate([
      {
        $match: {
          conversionDate: { $gte: earliest, $lt: latest },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$conversionDate' },
            month: { $month: '$conversionDate' },
          },
          referrals: { $sum: 1 },
          conversions: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'paid']] }, 1, 0],
            },
          },
        },
      },
    ]);

    const byMonth = new Map<string, { referrals: number; conversions: number }>();

    for (const row of grouped) {
      const monthKey = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      byMonth.set(monthKey, {
        referrals: row.referrals || 0,
        conversions: row.conversions || 0,
      });
    }

    return ranges.map((range) => ({
      month: range.monthLabel,
      referrals: byMonth.get(range.monthKey)?.referrals || 0,
      conversions: byMonth.get(range.monthKey)?.conversions || 0,
    }));
  }

  private async getOverviewStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totalRegistered, canceledThisMonth, newThisMonth, revenueByPlanRaw] = await Promise.all([
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true } }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionCanceledAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      }),
      this.transactionModel
        .find({ type: 'subscription', status: 'succeeded' })
        .select('amount currency plan')
        .lean(),
    ]);

    // Group revenueByPlan with currency conversion
    const revenueByPlanMap = new Map<string, { revenue: number; count: number }>();
    for (const tx of revenueByPlanRaw as any[]) {
      const plan = tx.plan || 'Unknown';
      const converted = this.convertToDisplayAmount(tx.amount, tx.currency);
      const existing = revenueByPlanMap.get(plan) || { revenue: 0, count: 0 };
      revenueByPlanMap.set(plan, { revenue: existing.revenue + converted, count: existing.count + 1 });
    }
    const revenueByPlan = Array.from(revenueByPlanMap.entries())
      .map(([plan, data]) => ({ plan, revenue: Math.round(data.revenue * 100) / 100, transactionCount: data.count }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRegistered,
      canceledThisMonth,
      newUsersThisMonth: newThisMonth,
      revenueByPlan,
    };
  }

  private async getSubscriberStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, active, free, canceled, inactive, allRevenueRaw, monthlyRevenueRaw, monthlyBilling, yearlyBilling, subscriberList] = await Promise.all([
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true } }),
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true }, subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] } }),
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true }, subscriptionStatus: 'free' }),
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true }, subscriptionStatus: 'canceled' }),
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true }, subscriptionStatus: 'incomplete' }),
      this.transactionModel.find({ type: 'subscription', status: 'succeeded' }).select('amount currency').lean(),
      this.transactionModel.find({ type: 'subscription', status: 'succeeded', transactionDate: { $gte: startOfMonth } }).select('amount currency').lean(),
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true }, billingCycle: 'monthly', subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] } }),
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true }, billingCycle: 'yearly', subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] } }),
      this.userModel
        .find({ isSuperAdmin: { $ne: true } })
        .select('fullName email subscriptionStatus billingCycle subscriptionAmount currentPeriodEnd subscriptionStartedAt subscriptionCanceledAt createdAt')
        .populate('planId', 'name')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
    ]);

    const totalRevenue = allRevenueRaw.reduce(
      (sum: number, tx: any) => sum + this.convertToDisplayAmount(tx.amount, tx.currency), 0,
    );
    const monthlyRevenue = monthlyRevenueRaw.reduce(
      (sum: number, tx: any) => sum + this.convertToDisplayAmount(tx.amount, tx.currency), 0,
    );

    return {
      total,
      active,
      free,
      canceled,
      inactive,
      monthlyBillingSubscribers: monthlyBilling,
      yearlyBillingSubscribers: yearlyBilling,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      subscribers: subscriberList.map((u: any) => ({
        name: u.fullName || 'Unknown',
        email: u.email || 'N/A',
        plan: (u.planId as any)?.name || 'Free',
        status: u.subscriptionStatus || 'free',
        billingCycle: u.billingCycle || 'monthly',
        amount: Math.round((u.subscriptionAmount || 0) * 100) / 100,
        startedAt: u.subscriptionStartedAt ? new Date(u.subscriptionStartedAt).toLocaleDateString('en-GB') : 'N/A',
        renewsAt: u.currentPeriodEnd ? new Date(u.currentPeriodEnd).toLocaleDateString('en-GB') : 'N/A',
        canceledAt: u.subscriptionCanceledAt ? new Date(u.subscriptionCanceledAt).toLocaleDateString('en-GB') : null,
        joinedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'N/A',
      })),
    };
  }

  private async getTicketStats() {
    const [grouped, allTickets] = await Promise.all([
      this.ticketModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.ticketModel
        .find()
        .select('subject customerName customerEmail category status priority assignedTo resolvedAt closedAt createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of grouped) {
      counts[row._id] = row.count || 0;
      total += row.count || 0;
    }

    const mapTicket = (t: any) => ({
      id: t._id?.toString().slice(-8).toUpperCase(),
      subject: t.subject || 'N/A',
      customerName: t.customerName || 'Unknown',
      customerEmail: t.customerEmail || 'N/A',
      category: t.category || 'N/A',
      priority: t.priority || 'medium',
      assignedTo: t.assignedTo || 'Support Team',
      createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : 'N/A',
      resolvedAt: t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('en-GB') : null,
    });

    return {
      open: counts['open'] || 0,
      pending: counts['pending'] || 0,
      inProgress: counts['in_progress'] || 0,
      resolved: counts['resolved'] || 0,
      closed: counts['closed'] || 0,
      total,
      tickets: {
        open: allTickets.filter((t: any) => t.status === 'open').map(mapTicket),
        pending: allTickets.filter((t: any) => t.status === 'pending').map(mapTicket),
        inProgress: allTickets.filter((t: any) => t.status === 'in_progress').map(mapTicket),
        resolved: allTickets.filter((t: any) => t.status === 'resolved').map(mapTicket),
        closed: allTickets.filter((t: any) => t.status === 'closed').map(mapTicket),
      },
    };
  }

  private async getAffiliateGlobalStats() {
    const [totalAffiliates, totalReferrals, commissionAgg, pendingAgg, approvedAgg, affiliateList, referralList, couponList, commissionPlanList] = await Promise.all([
      this.affiliateModel.countDocuments(),
      this.referralModel.countDocuments(),
      this.referralModel.aggregate([{ $group: { _id: null, total: { $sum: '$commission' } } }]),
      this.affiliateModel.aggregate([{ $group: { _id: null, total: { $sum: '$pending' } } }]),
      this.referralModel.countDocuments({ status: { $in: ['approved', 'paid'] } }),
      this.affiliateModel.find().select('name email code tier status referrals earnings pending joinDate').sort({ createdAt: -1 }).limit(100).lean(),
      this.referralModel.find().select('affiliateName subscriberName plan conversionDate amount commission status').sort({ conversionDate: -1 }).limit(100).lean(),
      this.couponModel.find().select('code discountType discountValue usageLimit usedCount validFrom validUntil status').sort({ createdAt: -1 }).lean(),
      this.commissionPlanModel.find().select('name subscriptionPlan commissionType commissionValue couponCode couponDiscount cookieWindow minPayout isActive').sort({ createdAt: -1 }).lean(),
    ]);

    return {
      totalAffiliates,
      totalReferrals,
      approvedReferrals: approvedAgg,
      totalCommissions: Math.round((commissionAgg[0]?.total || 0) * 100) / 100,
      pendingPayouts: Math.round((pendingAgg[0]?.total || 0) * 100) / 100,
      affiliates: affiliateList.map((a: any) => ({
        name: a.name || 'Unknown',
        email: a.email || 'N/A',
        code: a.code || 'N/A',
        tier: a.tier || 'N/A',
        status: a.status || 'active',
        referrals: a.referrals || 0,
        earnings: Math.round((a.earnings || 0) * 100) / 100,
        pending: Math.round((a.pending || 0) * 100) / 100,
        joinDate: a.joinDate ? new Date(a.joinDate).toLocaleDateString('en-GB') : 'N/A',
      })),
      referrals: referralList.map((r: any) => ({
        affiliateName: r.affiliateName || 'Unknown',
        subscriberName: r.subscriberName || 'Unknown',
        plan: r.plan || 'N/A',
        amount: Math.round((r.amount || 0) * 100) / 100,
        commission: Math.round((r.commission || 0) * 100) / 100,
        status: r.status || 'pending',
        date: r.conversionDate ? new Date(r.conversionDate).toLocaleDateString('en-GB') : 'N/A',
      })),
      coupons: couponList.map((c: any) => ({
        code: c.code || 'N/A',
        discountType: c.discountType || 'fixed',
        discountValue: c.discountValue || 0,
        usage: `${c.usedCount || 0} / ${c.usageLimit || 0}`,
        validFrom: c.validFrom ? new Date(c.validFrom).toLocaleDateString('en-GB') : 'N/A',
        validUntil: c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-GB') : 'N/A',
        status: c.status || 'active',
      })),
      commissionPlans: commissionPlanList.map((cp: any) => ({
        name: cp.name || 'N/A',
        subscriptionPlan: cp.subscriptionPlan || 'N/A',
        commissionType: cp.commissionType || 'fixed',
        commissionValue: cp.commissionValue || 0,
        couponCode: cp.couponCode || null,
        couponDiscount: cp.couponDiscount || null,
        cookieWindow: cp.cookieWindow || 30,
        minPayout: cp.minPayout || 0,
        isActive: cp.isActive !== false,
      })),
    };
  }

  private async getBillingPlanStats() {
    const [totalPlans, activePlans, hiddenPlans, archivedPlans, plans] = await Promise.all([
      this.billingPlanModel.countDocuments(),
      this.billingPlanModel.countDocuments({ status: 'active' }),
      this.billingPlanModel.countDocuments({ status: 'hidden' }),
      this.billingPlanModel.countDocuments({ status: 'archived' }),
      this.billingPlanModel.find().select('name price interval status features limits subscriberCount isPopular').lean(),
    ]);

    const totalSubscribers = plans.reduce((sum: number, p: any) => sum + (p.subscriberCount || 0), 0);

    return {
      totalPlans,
      activePlans,
      hiddenPlans,
      archivedPlans,
      totalSubscribers,
      plans: plans.map((p: any) => ({
        name: p.name || 'Unknown',
        price: p.price || 0,
        interval: p.interval || 'monthly',
        status: p.status || 'active',
        isPopular: p.isPopular || false,
        subscribers: p.subscriberCount || 0,
        features: Array.isArray(p.features) ? p.features : [],
        limits: p.limits ? {
          invoices: p.limits.invoices,
          quotes: p.limits.quotes,
          clients: p.limits.clients,
          teamMembers: p.limits.teamMembers,
          storage: p.limits.storage,
          receipts: p.limits.receipts,
          recurringInvoices: p.limits.recurringInvoices,
          expenseTracking: p.limits.expenseTracking,
          domains: p.limits.domains,
        } : {},
      })),
    };
  }

  private convertToDisplayAmount(amount: number, currency?: string): number {
    const source = (currency || '').toUpperCase();
    const display = this.currencyService.getDisplayCurrency();
    if (!source || source === display) {
      return Math.round((Number(amount) || 0) * 100) / 100;
    }
    return this.currencyService.convert(Number(amount) || 0, source, display);
  }

  private async getTransactionStats() {
    const [
      successCountAgg,
      failedCountAgg,
      refundCountAgg,
      allSucceededForRevenue,
      allRefundedForTotal,
      allTransactions,
    ] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { status: 'failed' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { type: 'refund', status: 'refunded' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      // Fetch all succeeded subscription transactions for currency-converted total
      this.transactionModel
        .find({ type: 'subscription', status: 'succeeded' })
        .select('amount currency')
        .lean(),
      // Fetch all refunded transactions for currency-converted total
      this.transactionModel
        .find({ type: 'refund', status: 'refunded' })
        .select('amount currency')
        .lean(),
      this.transactionModel
        .find()
        .sort({ transactionDate: -1 })
        .limit(200)
        .select('transactionId subscriberName subscriberEmail amount currency type provider status plan billingCycle transactionDate')
        .lean(),
    ]);

    // Apply same currency conversion as the overview dashboard
    const totalRevenue = allSucceededForRevenue.reduce(
      (sum: number, tx: any) => sum + this.convertToDisplayAmount(tx.amount, tx.currency),
      0,
    );
    const refundTotal = allRefundedForTotal.reduce(
      (sum: number, tx: any) => sum + this.convertToDisplayAmount(tx.amount, tx.currency),
      0,
    );

    const mapTx = (tx: any) => ({
      id: tx.transactionId || tx._id?.toString().slice(-8).toUpperCase(),
      subscriberName: tx.subscriberName || 'Unknown',
      subscriberEmail: tx.subscriberEmail || 'N/A',
      amount: Math.round((tx.amount || 0) * 100) / 100,
      currency: tx.currency || 'KD',
      type: tx.type || 'subscription',
      provider: tx.provider || 'Stripe',
      status: tx.status || 'pending',
      plan: tx.plan || 'N/A',
      billingCycle: tx.billingCycle || 'monthly',
      date: tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('en-GB') : 'N/A',
    });

    return {
      successfulCount: successCountAgg[0]?.count || 0,
      failedCount: failedCountAgg[0]?.count || 0,
      refundCount: refundCountAgg[0]?.count || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      refundTotal: Math.round(refundTotal * 100) / 100,
      transactions: {
        succeeded: allTransactions.filter((t: any) => t.status === 'succeeded').map(mapTx),
        failed: allTransactions.filter((t: any) => t.status === 'failed').map(mapTx),
        refunded: allTransactions.filter((t: any) => t.status === 'refunded').map(mapTx),
        pending: allTransactions.filter((t: any) => t.status === 'pending').map(mapTx),
      },
    };
  }

  private async getEnterpriseCount(beforeDate?: Date): Promise<number> {
    const enterprisePlans = await this.billingPlanModel
      .find({ name: { $regex: 'enterprise', $options: 'i' } })
      .select('_id')
      .lean();

    const enterprisePlanIds = enterprisePlans.map((plan) => plan._id);

    if (!enterprisePlanIds.length) return 0;

    const query: any = {
      isSuperAdmin: { $ne: true },
      planId: { $in: enterprisePlanIds },
      subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] },
    };

    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }

    return this.userModel.countDocuments(query);
  }
}
