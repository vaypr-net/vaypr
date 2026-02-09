import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RecurringService } from '@/api/services/recurring.service';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEY = 'recurring';

export function useRecurringAPI(status?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, { status }],
    queryFn: () => RecurringService.getAll(status),
    initialData: [],
  });
}

export function useActiveRecurring() {
  return useQuery({
    queryKey: [QUERY_KEY, 'active'],
    queryFn: () => RecurringService.getActive(),
  });
}

export function useRecurringById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => RecurringService.getById(id),
    enabled: !!id,
  });
}

export function useRecurringByClient(clientId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'client', clientId],
    queryFn: () => RecurringService.getByClient(clientId),
    enabled: !!clientId,
    initialData: [],
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, logo }: { data: any; logo?: File }) =>
      RecurringService.create(data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Recurring Billing Created',
        description: 'The recurring billing has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create recurring billing',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, logo }: { id: string; data: any; logo?: File }) =>
      RecurringService.update(id, data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Recurring Billing Updated',
        description: 'The recurring billing has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update recurring billing',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleRecurring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => RecurringService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Status Updated',
        description: 'The recurring billing status has been toggled.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle status',
        variant: 'destructive',
      });
    },
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => RecurringService.generateInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice Generated',
        description: 'A new invoice has been generated from recurring billing.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => RecurringService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Recurring Billing Deleted',
        description: 'The recurring billing has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete recurring billing',
        variant: 'destructive',
      });
    },
  });
}
