import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AffiliateService,
  CreateAffiliateDto,
  UpdateAffiliateDto,
  CreateCommissionPlanDto,
  UpdateCommissionPlanDto,
  CreateCouponDto,
  UpdateCouponDto,
} from '@/api/services/affiliate.service';
import { useToast } from '@/hooks/use-toast';

// ==================== QUERY KEYS ====================

const AFFILIATE_QUERY_KEYS = {
  all: ['affiliates'] as const,
  list: () => [...AFFILIATE_QUERY_KEYS.all, 'list'] as const,
  filters: (filters: any) => [...AFFILIATE_QUERY_KEYS.list(), filters] as const,
  detail: (id: string) => [...AFFILIATE_QUERY_KEYS.all, 'detail', id] as const,
  stats: () => [...AFFILIATE_QUERY_KEYS.all, 'stats'] as const,
};

const COMMISSION_PLAN_QUERY_KEYS = {
  all: ['commission-plans'] as const,
  list: () => [...COMMISSION_PLAN_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...COMMISSION_PLAN_QUERY_KEYS.all, 'detail', id] as const,
};

const COUPON_QUERY_KEYS = {
  all: ['coupons'] as const,
  list: () => [...COUPON_QUERY_KEYS.all, 'list'] as const,
  filters: (filters: any) => [...COUPON_QUERY_KEYS.list(), filters] as const,
  detail: (id: string) => [...COUPON_QUERY_KEYS.all, 'detail', id] as const,
};

const REFERRAL_QUERY_KEYS = {
  all: ['referrals'] as const,
  list: () => [...REFERRAL_QUERY_KEYS.all, 'list'] as const,
  filters: (filters: any) => [...REFERRAL_QUERY_KEYS.list(), filters] as const,
  detail: (id: string) => [...REFERRAL_QUERY_KEYS.all, 'detail', id] as const,
};

// ==================== AFFILIATE HOOKS ====================

export function useGetAffiliates(
  search?: string,
  status?: string,
  tier?: string,
  limit: number = 10,
  offset: number = 0,
) {
  return useQuery({
    queryKey: AFFILIATE_QUERY_KEYS.filters({ search, status, tier, limit, offset }),
    queryFn: () =>
      AffiliateService.getAffiliates(search, status, tier, limit, offset),
  });
}

export function useGetAffiliateStats() {
  return useQuery({
    queryKey: AFFILIATE_QUERY_KEYS.stats(),
    queryFn: () => AffiliateService.getStats(),
  });
}

export function useGetAffiliateById(id: string) {
  return useQuery({
    queryKey: AFFILIATE_QUERY_KEYS.detail(id),
    queryFn: () => AffiliateService.getAffiliateById(id),
    enabled: !!id,
  });
}

export function useCreateAffiliate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAffiliateDto) => AffiliateService.createAffiliate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Affiliate created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create affiliate.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAffiliate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAffiliateDto }) =>
      AffiliateService.updateAffiliate(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Affiliate updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update affiliate.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAffiliateStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      AffiliateService.updateAffiliateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: `Affiliate ${data.status}.`,
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

export function useDeleteAffiliate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AffiliateService.deleteAffiliate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Affiliate deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete affiliate.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== COMMISSION PLAN HOOKS ====================

export function useGetCommissionPlans() {
  return useQuery({
    queryKey: COMMISSION_PLAN_QUERY_KEYS.list(),
    queryFn: () => AffiliateService.getCommissionPlans(),
  });
}

export function useGetCommissionPlanById(id: string) {
  return useQuery({
    queryKey: COMMISSION_PLAN_QUERY_KEYS.detail(id),
    queryFn: () => AffiliateService.getCommissionPlanById(id),
    enabled: !!id,
  });
}

export function useCreateCommissionPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCommissionPlanDto) =>
      AffiliateService.createCommissionPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMISSION_PLAN_QUERY_KEYS.list() });
      toast({
        title: 'Success',
        description: 'Commission plan created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create commission plan.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCommissionPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommissionPlanDto }) =>
      AffiliateService.updateCommissionPlan(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: COMMISSION_PLAN_QUERY_KEYS.list() });
      queryClient.invalidateQueries({
        queryKey: COMMISSION_PLAN_QUERY_KEYS.detail(data._id),
      });
      toast({
        title: 'Success',
        description: 'Commission plan updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update commission plan.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCommissionPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AffiliateService.deleteCommissionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMISSION_PLAN_QUERY_KEYS.list() });
      toast({
        title: 'Success',
        description: 'Commission plan deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete commission plan.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== COUPON HOOKS ====================

export function useGetCoupons(
  search?: string,
  status?: string,
  linkedAffiliate?: string,
  limit: number = 10,
  offset: number = 0,
) {
  return useQuery({
    queryKey: COUPON_QUERY_KEYS.filters({
      search,
      status,
      linkedAffiliate,
      limit,
      offset,
    }),
    queryFn: () =>
      AffiliateService.getCoupons(search, status, linkedAffiliate, limit, offset),
  });
}

export function useGetCouponById(id: string) {
  return useQuery({
    queryKey: COUPON_QUERY_KEYS.detail(id),
    queryFn: () => AffiliateService.getCouponById(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCouponDto) => AffiliateService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.list() });
      toast({
        title: 'Success',
        description: 'Coupon created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create coupon.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponDto }) =>
      AffiliateService.updateCoupon(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.detail(data._id) });
      toast({
        title: 'Success',
        description: 'Coupon updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update coupon.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AffiliateService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_QUERY_KEYS.list() });
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete coupon.',
        variant: 'destructive',
      });
    },
  });
}

// ==================== REFERRAL HOOKS ====================

export function useGetReferrals(
  affiliateId?: string,
  status?: string,
  limit: number = 10,
  offset: number = 0,
) {
  return useQuery({
    queryKey: REFERRAL_QUERY_KEYS.filters({ affiliateId, status, limit, offset }),
    queryFn: () => AffiliateService.getReferrals(affiliateId, status, limit, offset),
  });
}

export function useGetReferralById(id: string) {
  return useQuery({
    queryKey: REFERRAL_QUERY_KEYS.detail(id),
    queryFn: () => AffiliateService.getReferralById(id),
    enabled: !!id,
  });
}

export function useApproveReferral() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AffiliateService.approveReferral(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: REFERRAL_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: REFERRAL_QUERY_KEYS.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Referral approved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve referral.',
        variant: 'destructive',
      });
    },
  });
}

export function useProcessPayouts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ affiliateId, referralIds }: { affiliateId?: string; referralIds?: string[] }) =>
      AffiliateService.processPayouts(affiliateId, referralIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REFERRAL_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: AFFILIATE_QUERY_KEYS.stats() });
      toast({
        title: 'Success',
        description: 'Payouts processed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process payouts.',
        variant: 'destructive',
      });
    },
  });
}
