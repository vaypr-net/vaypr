import axios from '../axios';

// ==================== TYPES ====================

export interface Subscriber {
  _id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscriptionType: 'monthly' | 'yearly';
  subscriptionDate: string;
  status: 'active' | 'inactive' | 'free' | 'canceled';
  lifetimeSpend: number;
  lastPaymentDate: string;
  nextRenewalDate?: string | null;
  internalNotes?: string;
  version?: string;
  archivedAt?: string | null;
  archiveReason?: string;
  paidAccessEndsAt?: string | null;
  paidAccessEndedAt?: string | null;
  paymentProvider?: string;
  paymentEnvironment?: string;
  managementHistory?: Array<{
    action: string; at: string; actorId: string; actorEmail: string; reason: string;
    before: { status?: string; archived?: boolean; planId?: string; paidAccessEndsAt?: string | null };
    after: { status?: string; archived?: boolean; planId?: string; paidAccessEndsAt?: string | null };
  }>;
  usage?: {
    invoices: { used: number; limit: number };
    quotes: { used: number; limit: number };
    clients: { used: number; limit: number };
    teamMembers: { used: number; limit: number };
    receipts: { used: number; limit: number };
    recurringInvoices: { used: number; limit: number };
    storage: { used: number; limit: string; unit: 'GB' };
  };
  billing?: {
    paymentMethod: string;
    paymentMethodDetails: string;
    recentInvoices: Array<{
      id: string;
      date: string;
      amount: number;
      currency: string;
      status: 'succeeded' | 'failed' | 'refunded' | 'pending';
      environment?: string;
      provider?: string;
    }>;
  };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SubscriberStats {
  total: number;
  active: number;
  free: number;
  canceled: number;
  inactive: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface UpdateSubscriberDto {
  name?: string;
  email?: string;
  company?: string;
  plan?: string;
  subscriptionType?: 'monthly' | 'yearly';
  status?: 'active' | 'inactive' | 'free' | 'canceled';
  internalNotes?: string;
}

export type SubscriberAction = 'archive' | 'restore' | 'end_paid_access' | 'undo_scheduled_end';
export interface ManageSubscriberRequest {
  expectedUpdatedAt: string;
  action: SubscriberAction;
  reason: string;
  mode?: 'immediately' | 'period_end';
}

export interface SubscriberDeletionPreview {
  subscriberId: string;
  name: string;
  email: string;
  canDelete: boolean;
  blockers: string[];
  deletedCounts: Record<string, number>;
  retainedCounts: Record<string, number>;
  expiresAt: string;
  previewToken: string | null;
}
export interface DeleteSubscriberRequest {
  previewToken: string;
  confirmEmail: string;
  confirmation: string;
  acknowledgeIrreversible: boolean;
  acknowledgeRetention: boolean;
  reason: string;
}
export interface SubscriberDeletionReceipt {
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  deletedAt: string;
  actorEmail: string;
  reason: string;
  deletedCounts: Record<string, number>;
  retainedCounts: Record<string, number>;
}
export interface RetainedSubscriberPayments {
  transactions: Array<{ transactionId: string; amount: number; currency: string; status: string; type: string;
    provider: string; transactionDate: string; isSandbox?: boolean; needsManualReconciliation?: boolean }>;
  orders: Array<{ reference: string; amountFils: number; currency: string; state: string; environment: string;
    createdAt: string; needsManualReconciliation?: boolean }>;
}

// ==================== SERVICE ====================

const BASE_URL = '/super-admin/subscribers';

export const SubscriberService = {
  // ========== SUBSCRIBER CRUD ==========

  async getSubscribers(
    search?: string,
    status?: string,
    subscriptionType?: string,
    limit: number = 50,
    offset: number = 0,
    visibility: 'active' | 'archived' | 'all' = 'active',
  ): Promise<PaginatedResponse<Subscriber>> {
    const params = { search, status, subscriptionType, limit, offset, visibility };
    const response = await axios.get<PaginatedResponse<Subscriber>>(BASE_URL, { params });
    return response.data;
  },

  async getSubscriberById(id: string): Promise<Subscriber> {
    const response = await axios.get<Subscriber>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async updateSubscriber(id: string, data: UpdateSubscriberDto): Promise<Subscriber> {
    const response = await axios.patch<Subscriber>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async manageSubscriber(id: string, data: ManageSubscriberRequest): Promise<Subscriber> {
    const response = await axios.patch<Subscriber>(`${BASE_URL}/${id}/management`, data);
    return response.data;
  },

  async getDeletionPreview(id: string): Promise<SubscriberDeletionPreview> {
    return (await axios.get(`${BASE_URL}/${id}/deletion-preview`)).data;
  },
  async deleteSubscriber(id: string, data: DeleteSubscriberRequest): Promise<{ subscriberId: string }> {
    return (await axios.delete(`${BASE_URL}/${id}`, { data })).data;
  },
  async getDeletionHistory(): Promise<SubscriberDeletionReceipt[]> {
    return (await axios.get(`${BASE_URL}/deletion-history`)).data;
  },
  async getRetainedPayments(id: string): Promise<RetainedSubscriberPayments> {
    return (await axios.get(`${BASE_URL}/deletion-history/${id}/payments`)).data;
  },

  async getStats(): Promise<SubscriberStats> {
    const response = await axios.get<SubscriberStats>(`${BASE_URL}/stats`);
    return response.data;
  },
};
