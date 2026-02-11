import { useQuery } from '@tanstack/react-query';
import { ReportsService } from '@/api/services/reports.service';

const QUERY_KEY = 'super-admin-reports-analytics';

export function useReportsAnalytics() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => ReportsService.getAnalytics(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });
}
