import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { Referral } from '../affiliate/entities/referral.entity';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';

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
      this.transactionModel.aggregate([
        { $match: { type: 'subscription', status: 'succeeded' } },
        { $group: { _id: '$plan', value: { $sum: '$amount' } } },
        { $sort: { value: -1 } },
      ]),
    ]);

    const monthRanges = this.buildLastMonths(6);

    const [revenueByMonth, conversionByMonth, affiliatePerformance] = await Promise.all([
      this.getRevenueByMonth(monthRanges),
      this.getConversionByMonth(monthRanges),
      this.getAffiliatePerformanceByMonth(monthRanges),
    ]);

    const planColors = [
      'hsl(217, 91%, 60%)',
      'hsl(262, 83%, 58%)',
      'hsl(142, 76%, 36%)',
      'hsl(45, 93%, 47%)',
      'hsl(0, 84%, 60%)',
      'hsl(199, 89%, 48%)',
    ];

    const planDistributionData = revenueByPlanRaw.map(
      (item: { _id: string; value: number }, index: number) => ({
        name: item._id || 'Unknown',
        value: item.value || 0,
        color: planColors[index % planColors.length],
      }),
    );

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

    const grouped = await this.transactionModel.aggregate([
      {
        $match: {
          type: 'subscription',
          status: 'succeeded',
          transactionDate: { $gte: earliest, $lt: latest },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
          value: { $sum: '$amount' },
        },
      },
    ]);

    const byMonth = new Map<string, number>();
    for (const row of grouped) {
      const monthKey = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      byMonth.set(monthKey, row.value || 0);
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
