import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseService } from '@/api/services/expense.service';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEY = 'expenses';

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => ExpenseService.getAll(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ExpenseService.getById(id),
    enabled: !!id,
  });
}

export function useExpenseStats(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats', filters],
    queryFn: () => ExpenseService.getStats(filters),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, receipt }: { data: any; receipt?: File }) =>
      ExpenseService.create(data, receipt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Expense created',
        description: 'The expense has been recorded successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create expense.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data, receipt }: { id: string; data: any; receipt?: File }) =>
      ExpenseService.update(id, data, receipt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Expense updated',
        description: 'The expense has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update expense.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => ExpenseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Expense deleted',
        description: 'The expense has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete expense.',
        variant: 'destructive',
      });
    },
  });
}
