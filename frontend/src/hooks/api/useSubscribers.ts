import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriberService, UpdateSubscriberDto, ManageSubscriberRequest, DeleteSubscriberRequest } from '@/api/services/subscriber.service';
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
  visibility: 'active' | 'archived' | 'all' = 'active',
) {
  return useQuery({
    queryKey: SUBSCRIBER_QUERY_KEYS.filters({ search, status, subscriptionType, limit, offset, visibility }),
    queryFn: () => SubscriberService.getSubscribers(search, status, subscriptionType, limit, offset, visibility),
  });
}

export function useManageSubscriber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ManageSubscriberRequest }) => SubscriberService.manageSubscriber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIBER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['usage'] });
      toast({ title: 'Subscriber updated', description: 'The administrative change has been recorded.' });
    },
    onError: (error: any) => toast({ title: 'Unable to update subscriber',
      description: error.response?.data?.message || 'Please refresh and try again.', variant: 'destructive' }),
  });
}

export function useSubscriberDeletionPreview(id: string) {
  return useQuery({ queryKey: [...SUBSCRIBER_QUERY_KEYS.all, 'deletion-preview', id],
    queryFn: () => SubscriberService.getDeletionPreview(id), enabled: !!id, staleTime: 0, refetchOnWindowFocus: false });
}
export function useDeleteSubscriber() {
  const client = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeleteSubscriberRequest }) => SubscriberService.deleteSubscriber(id, data),
    onSuccess: (_data, variables) => {
      client.removeQueries({ queryKey: SUBSCRIBER_QUERY_KEYS.detail(variables.id) });
      client.invalidateQueries({ queryKey: SUBSCRIBER_QUERY_KEYS.all });
      toast({ title: 'Subscriber permanently deleted', description: 'Payment records and the deletion audit have been retained.' });
    },
    onError: (error: any) => toast({ title: 'Subscriber was not deleted', description: error.response?.data?.message || 'Close this dialog and review deletion again.', variant: 'destructive' }),
  });
}
export function useSubscriberDeletionHistory(enabled: boolean) {
  return useQuery({ queryKey: [...SUBSCRIBER_QUERY_KEYS.all, 'deletion-history'], queryFn: SubscriberService.getDeletionHistory, enabled });
}
export function useRetainedSubscriberPayments(id: string) {
  return useQuery({ queryKey: [...SUBSCRIBER_QUERY_KEYS.all, 'retained-payments', id], queryFn: () => SubscriberService.getRetainedPayments(id), enabled: !!id });
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
