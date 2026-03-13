import axios from '../axios';

export interface ReportsMetric {
  label: string;
  value: number;
  changePercent: number;
  positive: boolean;
}

export interface TransactionRecord {
  id: string;
  subscriberName: string;
  subscriberEmail: string;
  amount: number;
  currency: string;
  type: string;
  provider: string;
  status: string;
  plan: string;
  billingCycle: string;
  date: string;
}

export interface TransactionStats {
  successfulCount: number;
  failedCount: number;
  refundCount: number;
  totalRevenue: number;
  refundTotal: number;
  transactions?: {
    succeeded: TransactionRecord[];
    failed: TransactionRecord[];
    refunded: TransactionRecord[];
    pending: TransactionRecord[];
  };
}

export interface OverviewStats {
  totalRegistered: number;
  canceledThisMonth: number;
  newUsersThisMonth: number;
  revenueByPlan: Array<{ plan: string; revenue: number; transactionCount: number }>;
}

export interface SubscriberStats {
  total: number;
  active: number;
  free: number;
  canceled: number;
  inactive: number;
  monthlyBillingSubscribers: number;
  yearlyBillingSubscribers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  subscribers?: Array<{
    name: string;
    email: string;
    plan: string;
    status: string;
    billingCycle: string;
    amount: number;
    startedAt: string;
    renewsAt: string;
    canceledAt: string | null;
    joinedAt: string;
  }>;
}

export interface TicketRecord {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  category: string;
  priority: string;
  assignedTo: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface TicketStats {
  open: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
  tickets?: {
    open: TicketRecord[];
    pending: TicketRecord[];
    inProgress: TicketRecord[];
    resolved: TicketRecord[];
    closed: TicketRecord[];
  };
}

export interface AffiliateStats {
  totalAffiliates: number;
  totalReferrals: number;
  approvedReferrals: number;
  totalCommissions: number;
  pendingPayouts: number;
  affiliates?: Array<{
    name: string;
    email: string;
    code: string;
    tier: string;
    status: string;
    referrals: number;
    earnings: number;
    pending: number;
    joinDate: string;
  }>;
  referrals?: Array<{
    affiliateName: string;
    subscriberName: string;
    plan: string;
    amount: number;
    commission: number;
    status: string;
    date: string;
  }>;
  coupons?: Array<{
    code: string;
    discountType: string;
    discountValue: number;
    usage: string;
    validFrom: string;
    validUntil: string;
    status: string;
  }>;
  commissionPlans?: Array<{
    name: string;
    subscriptionPlan: string;
    commissionType: string;
    commissionValue: number;
    couponCode: string | null;
    couponDiscount: number | null;
    cookieWindow: number;
    minPayout: number;
    isActive: boolean;
  }>;
}

export interface BillingPlanStats {
  totalPlans: number;
  activePlans: number;
  hiddenPlans: number;
  archivedPlans: number;
  totalSubscribers: number;
  plans: Array<{
    name: string;
    price: number;
    interval: string;
    status: string;
    isPopular: boolean;
    subscribers: number;
    features: string[];
    limits: {
      invoices?: number;
      quotes?: number;
      clients?: number;
      teamMembers?: number;
      storage?: string;
      receipts?: number;
      recurringInvoices?: number;
      expenseTracking?: boolean;
      domains?: number;
    };
  }>;
}

export interface ReportsAnalytics {
  metrics: ReportsMetric[];
  secondaryMetrics: ReportsMetric[];
  revenueByMonth: Array<{ month: string; mrr: number }>;
  conversionByMonth: Array<{ month: string; rate: number }>;
  planDistributionData: Array<{ name: string; value: number; color: string }>;
  affiliatePerformance: Array<{ month: string; referrals: number; conversions: number }>;
  transactionStats?: TransactionStats;
  overviewStats?: OverviewStats;
  subscriberStats?: SubscriberStats;
  ticketStats?: TicketStats;
  affiliateStats?: AffiliateStats;
  billingPlanStats?: BillingPlanStats;
}

const BASE_URL = '/super-admin/reports';

export const ReportsService = {
  async getAnalytics(): Promise<ReportsAnalytics> {
    const response = await axios.get<ReportsAnalytics>(`${BASE_URL}/analytics`);
    return response.data;
  },
};
