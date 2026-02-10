import { useQuery } from '@tanstack/react-query';
import ActivityService from '@/api/services/activity.service';

// ==================== QUERY KEYS ====================

const ACTIVITY_QUERY_KEYS = {
  all: ['activities'] as const,
  list: () => [...ACTIVITY_QUERY_KEYS.all, 'list'] as const,
  filters: (limit: number, skip: number) => [...ACTIVITY_QUERY_KEYS.list(), { limit, skip }] as const,
};

// ==================== ACTIVITY HOOKS ====================

export function useGetActivities(limit: number = 10, skip: number = 0) {
  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.filters(limit, skip),
    queryFn: () => ActivityService.getActivities(limit, skip),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}
