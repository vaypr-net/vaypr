import axios from '../axios';

interface Receipt {
  _id: string;
  receiptNumber: string;
  clientId?: string;
  invoiceId?: string;
  status: 'draft' | 'issued' | 'voided';
  receiptDate: string;
  receivedFrom: string;
  amount: number;
  currency: string;
  currencySymbol?: string;
  paymentMethod: string;
  reason?: string;
  receivedBy?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  logo?: string;
  logoScale?: number;
  titleColor?: string;
  amountColor?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateReceiptDto {
  clientId?: string;
  invoiceId?: string;
  receiptNumber: string;
  status?: string;
  receiptDate: string;
  receivedFrom: string;
  amount: number;
  currency: string;
  currencySymbol?: string;
  paymentMethod: string;
  reason?: string;
  receivedBy?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  logo?: string;
  logoScale?: number;
  titleColor?: string;
  amountColor?: string;
}

interface UpdateReceiptDto extends Partial<CreateReceiptDto> {}

export const ReceiptService = {
  async getAll(status?: string): Promise<Receipt[]> {
    const response = await axios.get<Receipt[]>('/receipts', { params: { status } });
    return response.data;
  },

  async getById(id: string): Promise<Receipt> {
    const response = await axios.get<Receipt>(`/receipts/${id}`);
    return response.data;
  },

  async getByClient(clientId: string): Promise<Receipt[]> {
    const response = await axios.get<Receipt[]>(`/receipts/client/${clientId}`);
    return response.data;
  },

  async getByInvoice(invoiceId: string): Promise<Receipt[]> {
    const response = await axios.get<Receipt[]>(`/receipts/invoice/${invoiceId}`);
    return response.data;
  },

  async create(data: CreateReceiptDto, logo?: File): Promise<Receipt> {
    const formData = new FormData();
    
    // Append all fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await axios.post<Receipt>('/receipts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: UpdateReceiptDto, logo?: File): Promise<Receipt> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await axios.patch<Receipt>(`/receipts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`/receipts/${id}`);
  },
};
