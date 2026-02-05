import axios from '../axios';

// ==================== TYPES ====================

export interface PlanLimits {
  invoices: number;
  quotes: number;
  clients: number;
  teamMembers: number;
  storage: string;
  receipts: number;
  recurringInvoices: number;
  expenseTracking: boolean;
  invoiceTemplates: string;
}

export interface BillingPlan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  status: 'active' | 'hidden' | 'archived';
  features: string[];
  limits: PlanLimits;
  isPopular: boolean;
  subscriberCount: number;
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

export interface BillingPlanStats {
  totalPlans: number;
  activePlans: number;
  hiddenPlans: number;
  archivedPlans: number;
  totalSubscribers: number;
}

export interface CreateBillingPlanDto {
  name: string;
  price: number;
  currency?: string;
  interval: 'monthly' | 'yearly';
  status?: 'active' | 'hidden' | 'archived';
  features: string[];
  limits: PlanLimits;
  isPopular?: boolean;
}

export interface UpdateBillingPlanDto extends Partial<CreateBillingPlanDto> {
  subscriberCount?: number;
}

// ==================== SERVICE ====================

const BASE_URL = '/super-admin/billing-plans';

export const BillingPlanService = {
  // ========== BILLING PLAN CRUD ==========

  async getPlans(
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedResponse<BillingPlan>> {
    const params = { status, limit, offset };
    console.log('💳 Fetching billing plans:', params);
    const response = await axios.get<PaginatedResponse<BillingPlan>>(BASE_URL, { params });
    console.log('✅ Billing plans response:', response.data);
    return response.data;
  },

  async getPlanById(id: string): Promise<BillingPlan> {
    console.log('💳 Fetching billing plan:', id);
    const response = await axios.get<BillingPlan>(`${BASE_URL}/${id}`);
    console.log('✅ Billing plan response:', response.data);
    return response.data;
  },

  async createPlan(data: CreateBillingPlanDto): Promise<BillingPlan> {
    console.log('💳 Creating billing plan:', data);
    const response = await axios.post<BillingPlan>(BASE_URL, data);
    console.log('✅ Billing plan created:', response.data);
    return response.data;
  },

  async updatePlan(id: string, data: UpdateBillingPlanDto): Promise<BillingPlan> {
    console.log('💳 Updating billing plan:', id, data);
    const response = await axios.patch<BillingPlan>(`${BASE_URL}/${id}`, data);
    console.log('✅ Billing plan updated:', response.data);
    return response.data;
  },

  async deletePlan(id: string): Promise<{ success: boolean; message: string }> {
    console.log('💳 Deleting billing plan:', id);
    const response = await axios.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    console.log('✅ Billing plan deleted:', response.data);
    return response.data;
  },

  async getStats(): Promise<BillingPlanStats> {
    console.log('💳 Fetching billing plan stats');
    const response = await axios.get<BillingPlanStats>(`${BASE_URL}/stats`);
    console.log('✅ Stats response:', response.data);
    return response.data;
  },
};
