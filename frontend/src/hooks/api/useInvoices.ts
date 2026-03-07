import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceService } from '@/api/services/invoice.service';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEY = 'invoices';

const getErrorMessage = (error: any, fallback: string) => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  return fallback;
};

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, { status }],
    queryFn: () => InvoiceService.getAll(status),
    initialData: [],
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => InvoiceService.getById(id),
    enabled: !!id,
  });
}

export function useInvoicesByClient(clientId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'client', clientId],
    queryFn: () => InvoiceService.getByClient(clientId),
    enabled: !!clientId,
    initialData: [],
  });
}

export function useInvoicesByStatus(status: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'status', status],
    queryFn: () => InvoiceService.getByStatus(status),
    enabled: !!status,
    initialData: [],
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, logo }: { data: any; logo?: File }) =>
      InvoiceService.create(data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Refresh client stats
      toast({
        title: 'Invoice created',
        description: 'The invoice has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create invoice.'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, logo }: { id: string; data: any; logo?: File }) =>
      InvoiceService.update(id, data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Refresh client stats
      toast({
        title: 'Invoice updated',
        description: 'The invoice has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update invoice.'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => InvoiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Refresh client stats
      toast({
        title: 'Invoice deleted',
        description: 'The invoice has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete invoice.'),
        variant: 'destructive',
      });
    },
  });
}
