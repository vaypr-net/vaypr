import { useQuery } from '@tanstack/react-query';
import { DashboardService, DashboardStats } from '@/api/services/dashboard.service';

const QUERY_KEY = 'dashboard-stats';

// Default empty stats structure
const DEFAULT_STATS: DashboardStats = {
  overview: {
    totalClients: 0,
    totalInvoices: 0,
    totalQuotes: 0,
    totalRecurring: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    totalExpensesThisMonth: 0,
    netIncomeThisMonth: 0,
  },
  invoices: {
    total: 0,
    overdue: 0,
    paid: 0,
    draft: 0,
    sent: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  },
  quotes: {
    total: 0,
    draft: 0,
    sent: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
  },
  recurring: {
    total: 0,
    active: 0,
    thisMonth: 0,
  },
  expenses: {
    totalThisMonth: 0,
    count: 0,
  },
  recentActivity: [],
  recentInvoices: [],
  recentQuotes: [],
};

export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => DashboardService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    initialData: DEFAULT_STATS,
  });
}
