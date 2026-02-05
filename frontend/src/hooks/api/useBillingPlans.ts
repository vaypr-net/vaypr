import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingPlanService } from '@/api/services/billing-plan.service';
import type {
  BillingPlan,
  CreateBillingPlanDto,
  UpdateBillingPlanDto,
  PaginatedResponse,
  BillingPlanStats,
} from '@/api/services/billing-plan.service';
import { useToast } from '@/hooks/use-toast';

// ==================== QUERY KEYS ====================

export const BILLING_PLAN_QUERY_KEYS = {
  all: ['billing-plans'] as const,
  lists: () => [...BILLING_PLAN_QUERY_KEYS.all, 'list'] as const,
  list: (status?: string, limit?: number, offset?: number) =>
    [...BILLING_PLAN_QUERY_KEYS.lists(), { status, limit, offset }] as const,
  details: () => [...BILLING_PLAN_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BILLING_PLAN_QUERY_KEYS.details(), id] as const,
  stats: () => [...BILLING_PLAN_QUERY_KEYS.all, 'stats'] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Get paginated billing plans with optional status filter
 */
export function useGetPlans(
  status?: string,
  limit: number = 50,
  offset: number = 0,
) {
  return useQuery<PaginatedResponse<BillingPlan>>({
    queryKey: BILLING_PLAN_QUERY_KEYS.list(status, limit, offset),
    queryFn: () => BillingPlanService.getPlans(status, limit, offset),
  });
}

/**
 * Get a single billing plan by ID
 */
export function useGetPlanById(id: string | undefined) {
  return useQuery<BillingPlan>({
    queryKey: BILLING_PLAN_QUERY_KEYS.detail(id!),
    queryFn: () => BillingPlanService.getPlanById(id!),
    enabled: !!id,
  });
}

/**
 * Get billing plan statistics
 */
export function useGetPlanStats() {
  return useQuery<BillingPlanStats>({
    queryKey: BILLING_PLAN_QUERY_KEYS.stats(),
    queryFn: () => BillingPlanService.getStats(),
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Create a new billing plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateBillingPlanDto) => BillingPlanService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Billing plan created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create billing plan',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing billing plan
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillingPlanDto }) =>
      BillingPlanService.updatePlan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Billing plan updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update billing plan',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a billing plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => BillingPlanService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BILLING_PLAN_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Billing plan deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete billing plan',
        variant: 'destructive',
      });
    },
  });
}
