import apiClient from '../axios';

export interface CreateRecurringDto {
  clientId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  items?: any[];
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;
  isActive?: boolean;
  logoScale?: number;
  showPaymentTerms?: boolean;
  paymentTerms?: string;
  companyFooter?: any;
  itemHeaderColor?: string;
  paymentType?: string;
  showBankDetails?: boolean;
  bankDetails?: any;
  autoEmailMessage?: string;
}

export interface UpdateRecurringDto extends Partial<CreateRecurringDto> {}

export const RecurringService = {
  async getAll(status?: string) {
    const params = status ? { status } : {};
    const response = await apiClient.get('/recurring', { params });
    return response.data;
  },

  async getActive() {
    const response = await apiClient.get('/recurring/active');
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/recurring/${id}`);
    return response.data;
  },

  async getByClient(clientId: string) {
    const response = await apiClient.get(`/recurring/client/${clientId}`);
    return response.data;
  },

  async create(data: CreateRecurringDto, logo?: File) {
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (logo) {
      formData.append('logo', logo);
    }

    const response = await apiClient.post('/recurring', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(id: string, data: UpdateRecurringDto, logo?: File) {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (logo) {
      formData.append('logo', logo);
    }

    const response = await apiClient.patch(`/recurring/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async toggleActive(id: string) {
    const response = await apiClient.patch(`/recurring/${id}/toggle`);
    return response.data;
  },

  async generateInvoice(id: string) {
    const response = await apiClient.post(`/recurring/${id}/generate-invoice`);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/recurring/${id}`);
    return response.data;
  },
};
