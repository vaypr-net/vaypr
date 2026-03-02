import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { CurrencyService } from '../common/services/currency.service';

export interface TicketStatusCounts {
  open: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

export interface SuperAdminOverviewStats {
  kpis: {
    totalRegistered: number;
    canceledThisMonth: number;
    totalRevenue: number;
    openTickets: number;
  };
  ticketsByStatus: TicketStatusCounts;
  supportTicketsData: Array<{ name: string; value: number; color: string }>;
  revenueByPlanData: Array<{ plan: string; revenue: number; subscribers: number }>;
  planDistributionData: Array<{ name: string; value: number; color: string }>;
}

@Injectable()
export class SuperAdminOverviewService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    private readonly currencyService: CurrencyService,
  ) {}

  async getStats(): Promise<SuperAdminOverviewStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalRegistered,
      canceledThisMonth,
      ticketStatus,
      allSucceededTransactions,
      subscribersByPlanAgg,
    ] = await Promise.all([
      this.userModel.countDocuments({ isSuperAdmin: { $ne: true } }),
      this.userModel.countDocuments({
        isSuperAdmin: { $ne: true },
        subscriptionCanceledAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      }),
      this.getTicketStatusCounts(),
      // Fetch ALL succeeded subscription transactions with their currency
      this.transactionModel
        .find({ type: 'subscription', status: 'succeeded' })
        .select('amount currency plan')
        .lean(),
      this.userModel.aggregate([
        { $match: { isSuperAdmin: { $ne: true } } },
        {
          $lookup: {
            from: 'billingplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'planDoc',
          },
        },
        {
          $addFields: {
            planName: { $ifNull: [{ $arrayElemAt: ['$planDoc.name', 0] }, 'Free'] },
          },
        },
        { $group: { _id: '$planName', subscribers: { $sum: 1 } } },
      ]),
    ]);

    // Convert transactions and sum with proper currency conversion
    const convertedTransactions = allSucceededTransactions.map((tx: any) => ({
      ...tx,
      convertedAmount: this.convertToDisplayAmount(tx.amount, tx.currency),
    }));

    // Calculate total revenue from all succeeded transactions (now in display currency)
    const totalRevenue = convertedTransactions.reduce(
      (sum: number, tx: any) => sum + (tx.convertedAmount || 0),
      0,
    );

    // Calculate revenue by plan
    const revenueByPlanMap = new Map<string, number>();
    convertedTransactions.forEach((tx: any) => {
      const plan = tx.plan || 'Unknown';
      revenueByPlanMap.set(plan, (revenueByPlanMap.get(plan) || 0) + (tx.convertedAmount || 0));
    });

    const openTickets = ticketStatus.open + ticketStatus.pending + ticketStatus.inProgress;

    const planSubscriberMap = new Map<string, number>(
      subscribersByPlanAgg.map((item: { _id: string; subscribers: number }) => [
        item._id || 'Unknown',
        item.subscribers,
      ]),
    );

    // Build revenue by plan data with converted amounts
    const revenueByPlanData = Array.from(revenueByPlanMap.entries())
      .map(([plan, revenue]) => ({
        plan: plan || 'Unknown',
        revenue: Math.round(revenue * 100) / 100, // Round to 2 decimals
        subscribers: planSubscriberMap.get(plan || 'Unknown') || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

    const planColors = [
      'hsl(217, 91%, 60%)',
      'hsl(262, 83%, 58%)',
      'hsl(142, 76%, 36%)',
      'hsl(45, 93%, 47%)',
      'hsl(0, 84%, 60%)',
      'hsl(199, 89%, 48%)',
    ];

    const planDistributionData = subscribersByPlanAgg.map(
      (item: { _id: string; subscribers: number }, index: number) => ({
        name: item._id || 'Unknown',
        value: item.subscribers || 0,
        color: planColors[index % planColors.length],
      }),
    );

    return {
      kpis: {
        totalRegistered,
        canceledThisMonth,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
        openTickets,
      },
      ticketsByStatus: ticketStatus,
      supportTicketsData: [
        { name: 'Open', value: ticketStatus.open, color: 'hsl(217, 91%, 60%)' },
        { name: 'Pending', value: ticketStatus.pending, color: 'hsl(45, 93%, 47%)' },
        { name: 'In Progress', value: ticketStatus.inProgress, color: 'hsl(262, 83%, 58%)' },
      ],
      revenueByPlanData,
      planDistributionData,
    };
  }

  /**
   * Convert amount from any currency to display currency (like in TransactionsService)
   */
  private convertToDisplayAmount(amount: number, currency?: string): number {
    const source = (currency || '').toUpperCase();
    const display = this.currencyService.getDisplayCurrency();
    if (!source || source === display) {
      return Math.round((Number(amount) || 0) * 100) / 100;
    }
    return this.currencyService.convert(Number(amount) || 0, source, display);
  }

  private async getTicketStatusCounts(): Promise<TicketStatusCounts> {
    const grouped = await this.ticketModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      open: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      total: 0,
    };

    for (const row of grouped) {
      counts.total += row.count || 0;
      if (row._id === 'open') counts.open = row.count || 0;
      if (row._id === 'pending') counts.pending = row.count || 0;
      if (row._id === 'in_progress') counts.inProgress = row.count || 0;
      if (row._id === 'resolved') counts.resolved = row.count || 0;
      if (row._id === 'closed') counts.closed = row.count || 0;
    }

    return counts;
  }
}
