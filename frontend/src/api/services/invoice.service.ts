import axios from '../axios';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  currency: string;
  notes?: string;
  logo?: string;
  createdAt: string;
}

interface CreateInvoiceDto {
  clientId: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  currency: string;
  notes?: string;
  paymentMethod?: string;
  paymentTerms?: string;
  showPaymentMethod?: boolean;
  showPaymentTerms?: boolean;
  showBankAccount?: boolean;
  bankName?: string;
  bankAccountName?: string;
  bankIban?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {}

export const InvoiceService = {
  async getAll(status?: string): Promise<Invoice[]> {
    const response = await axios.get<Invoice[]>('/invoice', { params: { status } });
    return response.data;
  },

  async getById(id: string): Promise<Invoice> {
    const response = await axios.get<Invoice>(`/invoice/${id}`);
    return response.data;
  },

  async getByClient(clientId: string): Promise<Invoice[]> {
    const response = await axios.get<Invoice[]>(`/invoice/client/${clientId}`);
    return response.data;
  },

  async getByStatus(status: string): Promise<Invoice[]> {
    const response = await axios.get<Invoice[]>(`/invoice/status/${status}`);
    return response.data;
  },

  async create(data: CreateInvoiceDto, logo?: File): Promise<Invoice> {
    const formData = new FormData();
    
    // Append all fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'items') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await axios.post<Invoice>('/invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: UpdateInvoiceDto, logo?: File): Promise<Invoice> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'items') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await axios.patch<Invoice>(`/invoice/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`/invoice/${id}`);
    return response.data;
  },
};
