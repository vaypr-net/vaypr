import axios from '../axios';

// ==================== DEBUG HELPER ====================

const DEBUG = true;

function log(method: string, endpoint: string, data?: any) {
  if (DEBUG) {
    console.log(
      `%c🔗 AFFILIATE API %c${method} ${endpoint}`,
      'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #2196F3; font-weight: bold;',
      data ? `\n📦 Data:` : ''
    );
    if (data) console.log(data);
  }
}

// ==================== TYPES ====================

export interface Affiliate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  code: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  referrals: number;
  earnings: number;
  pending: number;
  status: 'active' | 'inactive';
  joinDate: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionPlan {
  _id: string;
  name: string;
  subscriptionPlan: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  couponCode?: string;
  couponDiscount?: number;
  cookieWindow: number;
  minPayout: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  linkedAffiliate?: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  _id: string;
  affiliateId: string;
  affiliateName: string;
  subscriberId: string;
  subscriberName: string;
  plan: string;
  conversionDate: string;
  amount: number;
  commission: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvalDate?: string;
  payoutDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AffiliateStats {
  totalAffiliates: number;
  totalReferrals: number;
  totalCommissions: number;
  pendingPayouts: number;
}

// ==================== DTOs ====================

export interface CreateAffiliateDto {
  name: string;
  email: string;
  phone?: string;
  code?: string;
  tier?: string;
  commissionPlanId?: string;
}

export interface UpdateAffiliateDto extends Partial<CreateAffiliateDto> {}

export interface CreateCommissionPlanDto {
  name: string;
  subscriptionPlan: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  couponCode?: string;
  couponDiscount?: number;
  cookieWindow: number;
  minPayout: number;
}

export interface UpdateCommissionPlanDto extends Partial<CreateCommissionPlanDto> {}

export interface CreateCouponDto {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
  linkedAffiliate?: string;
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {}

// ==================== SERVICE ====================

const BASE_URL = '/super-admin/affiliates';

export const AffiliateService = {
  // ========== AFFILIATE ENDPOINTS ==========

  async getAffiliates(
    search?: string,
    status?: string,
    tier?: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<PaginatedResponse<Affiliate>> {
    const params = { search, status, tier, limit, offset };
    log('GET', BASE_URL, params);
    const response = await axios.get<PaginatedResponse<Affiliate>>(BASE_URL, { params });
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async getStats(): Promise<AffiliateStats> {
    log('GET', `${BASE_URL}/stats`);
    const response = await axios.get<AffiliateStats>(`${BASE_URL}/stats`);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async getAffiliateById(id: string): Promise<Affiliate> {
    log('GET', `${BASE_URL}/${id}`);
    const response = await axios.get<Affiliate>(`${BASE_URL}/${id}`);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async createAffiliate(data: CreateAffiliateDto): Promise<Affiliate> {
    log('POST', BASE_URL, data);
    const response = await axios.post<Affiliate>(BASE_URL, data);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async updateAffiliate(id: string, data: UpdateAffiliateDto): Promise<Affiliate> {
    log('PATCH', `${BASE_URL}/${id}`, data);
    const response = await axios.patch<Affiliate>(`${BASE_URL}/${id}`, data);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async updateAffiliateStatus(
    id: string,
    status: 'active' | 'inactive',
  ): Promise<Affiliate> {
    log('PATCH', `${BASE_URL}/${id}/status`, { status });
    const response = await axios.patch<Affiliate>(`${BASE_URL}/${id}/status`, { status });
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async deleteAffiliate(id: string): Promise<void> {
    log('DELETE', `${BASE_URL}/${id}`);
    await axios.delete(`${BASE_URL}/${id}`);
    console.log('✅ Deleted successfully');
  },

  // ========== COMMISSION PLAN ENDPOINTS ==========

  async getCommissionPlans(): Promise<CommissionPlan[]> {
    log('GET', `${BASE_URL}/commission-plans`);
    const response = await axios.get<CommissionPlan[]>(
      `${BASE_URL}/commission-plans`,
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async getCommissionPlanById(id: string): Promise<CommissionPlan> {
    log('GET', `${BASE_URL}/commission-plans/${id}`);
    const response = await axios.get<CommissionPlan>(
      `${BASE_URL}/commission-plans/${id}`,
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async createCommissionPlan(data: CreateCommissionPlanDto): Promise<CommissionPlan> {
    log('POST', `${BASE_URL}/commission-plans`, data);
    const response = await axios.post<CommissionPlan>(
      `${BASE_URL}/commission-plans`,
      data,
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async updateCommissionPlan(
    id: string,
    data: UpdateCommissionPlanDto,
  ): Promise<CommissionPlan> {
    log('PATCH', `${BASE_URL}/commission-plans/${id}`, data);
    const response = await axios.patch<CommissionPlan>(
      `${BASE_URL}/commission-plans/${id}`,
      data,
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async deleteCommissionPlan(id: string): Promise<void> {
    log('DELETE', `${BASE_URL}/commission-plans/${id}`);
    await axios.delete(`${BASE_URL}/commission-plans/${id}`);
    console.log('✅ Deleted successfully');
  },

  // ========== COUPON ENDPOINTS ==========

  async getCoupons(
    search?: string,
    status?: string,
    linkedAffiliate?: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<PaginatedResponse<Coupon>> {
    const params = { search, status, linkedAffiliate, limit, offset };
    log('GET', `${BASE_URL}/coupons`, params);
    const response = await axios.get<PaginatedResponse<Coupon>>(
      `${BASE_URL}/coupons`,
      { params },
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async getCouponById(id: string): Promise<Coupon> {
    log('GET', `${BASE_URL}/coupons/${id}`);
    const response = await axios.get<Coupon>(`${BASE_URL}/coupons/${id}`);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async createCoupon(data: CreateCouponDto): Promise<Coupon> {
    log('POST', `${BASE_URL}/coupons`, data);
    const response = await axios.post<Coupon>(`${BASE_URL}/coupons`, data);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async updateCoupon(id: string, data: UpdateCouponDto): Promise<Coupon> {
    log('PATCH', `${BASE_URL}/coupons/${id}`, data);
    const response = await axios.patch<Coupon>(`${BASE_URL}/coupons/${id}`, data);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async deleteCoupon(id: string): Promise<void> {
    log('DELETE', `${BASE_URL}/coupons/${id}`);
    await axios.delete(`${BASE_URL}/coupons/${id}`);
    console.log('✅ Deleted successfully');
  },

  // ========== REFERRAL ENDPOINTS ==========

  async getReferrals(
    affiliateId?: string,
    status?: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<PaginatedResponse<Referral>> {
    const params = { affiliateId, status, limit, offset };
    log('GET', `${BASE_URL}/referrals`, params);
    const response = await axios.get<PaginatedResponse<Referral>>(
      `${BASE_URL}/referrals`,
      { params },
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async getReferralById(id: string): Promise<Referral> {
    log('GET', `${BASE_URL}/referrals/${id}`);
    const response = await axios.get<Referral>(`${BASE_URL}/referrals/${id}`);
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async approveReferral(id: string): Promise<Referral> {
    log('POST', `${BASE_URL}/referrals/${id}/approve`);
    const response = await axios.post<Referral>(
      `${BASE_URL}/referrals/${id}/approve`,
    );
    console.log('✅ API Response:', response.data);
    return response.data;
  },

  async processPayouts(affiliateId?: string, referralIds?: string[]): Promise<any> {
    log('POST', `${BASE_URL}/referrals/payout`, { affiliateId, referralIds });
    const response = await axios.post(`${BASE_URL}/referrals/payout`, {
      affiliateId,
      referralIds,
    });
    console.log('✅ API Response:', response.data);
    return response.data;
  },
};
