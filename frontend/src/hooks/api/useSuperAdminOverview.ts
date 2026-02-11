import { useQuery } from '@tanstack/react-query';
import { SuperAdminOverviewService } from '@/api/services/super-admin-overview.service';

const QUERY_KEY = 'super-admin-overview-stats';

export function useSuperAdminOverviewStats() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => SuperAdminOverviewService.getStats(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });
}
