import axios from '../axios';

export interface ReportsMetric {
  label: string;
  value: number;
  changePercent: number;
  positive: boolean;
}

export interface ReportsAnalytics {
  metrics: ReportsMetric[];
  secondaryMetrics: ReportsMetric[];
  revenueByMonth: Array<{ month: string; mrr: number }>;
  conversionByMonth: Array<{ month: string; rate: number }>;
  planDistributionData: Array<{ name: string; value: number; color: string }>;
  affiliatePerformance: Array<{ month: string; referrals: number; conversions: number }>;
}

const BASE_URL = '/super-admin/reports';

export const ReportsService = {
  async getAnalytics(): Promise<ReportsAnalytics> {
    const response = await axios.get<ReportsAnalytics>(`${BASE_URL}/analytics`);
    return response.data;
  },
};
