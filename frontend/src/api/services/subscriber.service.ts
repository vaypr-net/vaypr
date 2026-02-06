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
  ): Promise<PaginatedResponse<Subscriber>> {
    const params = { search, status, subscriptionType, limit, offset };
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

  async getStats(): Promise<SubscriberStats> {
    const response = await axios.get<SubscriberStats>(`${BASE_URL}/stats`);
    return response.data;
  },
};
