import api from '../axios';

export interface DashboardStats {
  overview: {
    totalClients: number;
    totalInvoices: number;
    totalReceipts?: number;
    totalQuotes: number;
    totalRecurring: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalExpensesThisMonth: number;
    netIncomeThisMonth: number;
  };
  invoices: {
    total: number;
    overdue: number;
    paid: number;
    draft: number;
    sent: number;
    totalRevenue: number;
    pendingRevenue: number;
  };
  quotes: {
    total: number;
    draft: number;
    sent: number;
    viewed: number;
    accepted: number;
    rejected: number;
    expired: number;
    converted: number;
  };
  recurring: {
    total: number;
    active: number;
    thisMonth: number;
  };
  expenses: {
    totalThisMonth: number;
    count: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'invoice' | 'quote';
    number: string;
    clientName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  recentInvoices: Array<{
    id: string;
    type: string;
    number: string;
    clientName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  recentQuotes: Array<{
    id: string;
    type: string;
    number: string;
    clientName: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
