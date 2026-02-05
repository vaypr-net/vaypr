import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriberService, UpdateSubscriberDto } from '@/api/services/subscriber.service';
import { useToast } from '@/hooks/use-toast';

// ==================== QUERY KEYS ====================

const SUBSCRIBER_QUERY_KEYS = {
  all: ['subscribers'] as const,
  list: () => [...SUBSCRIBER_QUERY_KEYS.all, 'list'] as const,
  filters: (filters: any) => [...SUBSCRIBER_QUERY_KEYS.list(), filters] as const,
  detail: (id: string) => [...SUBSCRIBER_QUERY_KEYS.all, 'detail', id] as const,
  stats: () => [...SUBSCRIBER_QUERY_KEYS.all, 'stats'] as const,
};

// ==================== SUBSCRIBER HOOKS ====================

export function useGetSubscribers(
  search?: string,
  status?: string,
  subscriptionType?: string,
  limit: number = 50,
  offset: number = 0,
) {
  return useQuery({
    queryKey: SUBSCRIBER_QUERY_KEYS.filters({ search, status, subscriptionType, limit, offset }),
    queryFn: () => SubscriberService.getSubscribers(search, status, subscriptionType, limit, offset),
  });
}

export function useGetSubscriberById(id: string) {
  return useQuery({
    queryKey: SUBSCRIBER_QUERY_KEYS.detail(id),
    queryFn: () => SubscriberService.getSubscriberById(id),
    enabled: !!id,
  });
}

export function useGetSubscriberStats() {
  return useQuery({
    queryKey: SUBSCRIBER_QUERY_KEYS.stats(),
    queryFn: () => SubscriberService.getStats(),
  });
}

export function useUpdateSubscriber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriberDto }) =>
      SubscriberService.updateSubscriber(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: SUBSCRIBER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SUBSCRIBER_QUERY_KEYS.detail(data._id) });
      
      toast({
        title: 'Success',
        description: 'Subscriber updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update subscriber',
        variant: 'destructive',
      });
    },
  });
}
