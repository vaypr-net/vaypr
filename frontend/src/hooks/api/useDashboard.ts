import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/api/services/dashboard.service';

const QUERY_KEY = 'dashboard-stats';

export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => DashboardService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });
}
