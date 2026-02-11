import axios from '../axios';

export interface SuperAdminOverviewStats {
  kpis: {
    totalRegistered: number;
    canceledThisMonth: number;
    totalRevenue: number;
    openTickets: number;
  };
  ticketsByStatus: {
    open: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
    total: number;
  };
  supportTicketsData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  revenueByPlanData: Array<{
    plan: string;
    revenue: number;
    subscribers: number;
  }>;
  planDistributionData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const BASE_URL = '/super-admin/overview';

export const SuperAdminOverviewService = {
  async getStats(): Promise<SuperAdminOverviewStats> {
    const response = await axios.get<SuperAdminOverviewStats>(`${BASE_URL}/stats`);
    return response.data;
  },
};
