import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseService } from '@/api/services/expense.service';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEY = 'expenses';

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
}

type ExpenseRecord = {
  _id: string;
  category: string;
  date: string;
  amount: number;
};

const isWithinDateRange = (expenseDate: string, filters?: ExpenseFilters) => {
  if (!filters?.startDate && !filters?.endDate) return true;
  const value = new Date(expenseDate).getTime();

  if (filters?.startDate) {
    const start = new Date(filters.startDate).getTime();
    if (value < start) return false;
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate).getTime();
    if (value > end) return false;
  }

  return true;
};

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => ExpenseService.getAll(filters),
    initialData: [],
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
    initialData: { totalExpenses: 0, categories: [] },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ data, receipt }: { data: any; receipt?: File }) =>
      ExpenseService.create(data, receipt),
    onSuccess: (createdExpense: ExpenseRecord) => {
      // Ensure visible list updates instantly for all active expense list filters.
      const queries = queryClient.getQueriesData<ExpenseRecord[]>({
        queryKey: [QUERY_KEY],
      });

      for (const [key, value] of queries) {
        if (!Array.isArray(value)) continue;

        const second = key[1];
        if (second === 'stats') continue;
        if (typeof second === 'string') continue; // skip detail query keys like [expenses, id]

        const filters = (second ?? undefined) as ExpenseFilters | undefined;
        if (filters?.category && filters.category !== createdExpense.category) continue;
        if (!isWithinDateRange(createdExpense.date, filters)) continue;

        if (value.some((item) => item._id === createdExpense._id)) continue;

        queryClient.setQueryData<ExpenseRecord[]>(key, [
          createdExpense,
          ...value,
        ]);
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'stats'] });
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
