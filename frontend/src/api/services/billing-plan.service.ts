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
const PUBLIC_BASE_URL = '/billing-plans';

export const BillingPlanService = {
  // ========== PUBLIC API (No auth required) ==========

  async getPublicPlans(
    status: string = 'active',
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedResponse<BillingPlan>> {
    const params = { status, limit, offset };
    const response = await axios.get<PaginatedResponse<BillingPlan>>(PUBLIC_BASE_URL, { params });
    return response.data;
  },

  // ========== BILLING PLAN CRUD ==========

  async getPlans(
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedResponse<BillingPlan>> {
    const params = { status, limit, offset };
    const response = await axios.get<PaginatedResponse<BillingPlan>>(BASE_URL, { params });
    return response.data;
  },

  async getPlanById(id: string): Promise<BillingPlan> {
    const response = await axios.get<BillingPlan>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createPlan(data: CreateBillingPlanDto): Promise<BillingPlan> {
    const response = await axios.post<BillingPlan>(BASE_URL, data);
    return response.data;
  },

  async updatePlan(id: string, data: UpdateBillingPlanDto): Promise<BillingPlan> {
    const response = await axios.patch<BillingPlan>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async deletePlan(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async getStats(): Promise<BillingPlanStats> {
    const response = await axios.get<BillingPlanStats>(`${BASE_URL}/stats`);
    return response.data;
  },
};
