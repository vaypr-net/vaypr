import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '@/api/services/client.service';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEY = 'clients';

export function useClients(includeStats: boolean = false) {
  return useQuery({
    queryKey: [QUERY_KEY, includeStats ? 'withStats' : 'simple'],
    queryFn: () => ClientService.getAll(includeStats),
    initialData: [],
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ClientService.getById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ClientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Client created',
        description: 'The client has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create client.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ClientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Client updated',
        description: 'The client has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update client.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => ClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Client deleted',
        description: 'The client has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete client.',
        variant: 'destructive',
      });
    },
  });
}
