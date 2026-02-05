import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketService, CreateTicketDto, UpdateTicketDto } from '@/api/services/ticket.service';
import { useToast } from '@/hooks/use-toast';

// ==================== QUERY KEYS ====================

const TICKET_QUERY_KEYS = {
  all: ['tickets'] as const,
  list: () => [...TICKET_QUERY_KEYS.all, 'list'] as const,
  filters: (filters: any) => [...TICKET_QUERY_KEYS.list(), filters] as const,
  detail: (id: string) => [...TICKET_QUERY_KEYS.all, 'detail', id] as const,
  stats: () => [...TICKET_QUERY_KEYS.all, 'stats'] as const,
};

// ==================== TICKET HOOKS ====================

export function useGetTickets(
  search?: string,
  status?: string,
  priority?: string,
  category?: string,
  limit: number = 20,
  offset: number = 0,
) {
  return useQuery({
    queryKey: TICKET_QUERY_KEYS.filters({ search, status, priority, category, limit, offset }),
    queryFn: () => TicketService.getTickets(search, status, priority, category, limit, offset),
  });
}

export function useGetTicketById(id: string) {
  return useQuery({
    queryKey: TICKET_QUERY_KEYS.detail(id),
    queryFn: () => TicketService.getTicketById(id),
    enabled: !!id,
  });
}

export function useGetTicketStats() {
  return useQuery({
    queryKey: TICKET_QUERY_KEYS.stats(),
    queryFn: () => TicketService.getStats(),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTicketDto) => TicketService.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Ticket created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create ticket.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketDto }) =>
      TicketService.updateTicket(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.detail(data._id) });
      toast({
        title: 'Success',
        description: 'Ticket updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update ticket.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' }) =>
      TicketService.updateTicketStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status.',
        variant: 'destructive',
      });
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, message, author }: { id: string; message: string; author: string }) =>
      TicketService.addMessage(id, message, author),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.detail(data._id) });
      toast({
        title: 'Success',
        description: 'Message added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add message.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => TicketService.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Ticket deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete ticket.',
        variant: 'destructive',
      });
    },
  });
}
