import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QuoteService } from '@/api/services/quote.service';
import { useToast } from '@/hooks/use-toast';

const getErrorMessage = (error: any, fallback: string) => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  return fallback;
};

export const useQuotesAPI = (status?: string) => {
  return useQuery({
    queryKey: ['quotes', status],
    queryFn: () => QuoteService.getAll(status),
    initialData: [],
  });
};

export const useQuoteById = (id: string) => {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => QuoteService.getById(id),
    enabled: !!id,
  });
};

export const useQuotesByClient = (clientId: string) => {
  return useQuery({
    queryKey: ['quotes', 'client', clientId],
    queryFn: () => QuoteService.getByClient(clientId),
    enabled: !!clientId,
    initialData: [],
  });
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, logo }: { data: any; logo?: File }) =>
      QuoteService.create(data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Success',
        description: 'Quote created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create quote'),
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, logo }: { id: string; data: any; logo?: File }) =>
      QuoteService.update(id, data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Success',
        description: 'Quote updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update quote'),
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => QuoteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Success',
        description: 'Quote deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete quote'),
        variant: 'destructive',
      });
    },
  });
};
