import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptService } from '@/api/services/receipt.service';
import { useToast } from '@/hooks/use-toast';

export const useReceiptsAPI = (status?: string) => {
  return useQuery({
    queryKey: ['receipts', status],
    queryFn: () => ReceiptService.getAll(status),
    initialData: [],
  });
};

export const useReceiptById = (id: string) => {
  return useQuery({
    queryKey: ['receipt', id],
    queryFn: () => ReceiptService.getById(id),
    enabled: !!id,
  });
};

export const useReceiptsByClient = (clientId: string) => {
  return useQuery({
    queryKey: ['receipts', 'client', clientId],
    queryFn: () => ReceiptService.getByClient(clientId),
    enabled: !!clientId,
    initialData: [],
  });
};

export const useReceiptsByInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ['receipts', 'invoice', invoiceId],
    queryFn: () => ReceiptService.getByInvoice(invoiceId),
    enabled: !!invoiceId,
    initialData: [],
  });
};

export const useCreateReceipt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, logo }: { data: any; logo?: File }) =>
      ReceiptService.create(data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast({
        title: 'Success',
        description: 'Receipt created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create receipt',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateReceipt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, logo }: { id: string; data: any; logo?: File }) =>
      ReceiptService.update(id, data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast({
        title: 'Success',
        description: 'Receipt updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update receipt',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => ReceiptService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast({
        title: 'Success',
        description: 'Receipt deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete receipt',
        variant: 'destructive',
      });
    },
  });
};
