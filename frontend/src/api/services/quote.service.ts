import axios from '../axios';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface BillTo {
  name: string;
  phone?: string;
  area?: string;
  block?: string;
  street?: string;
  house?: string;
  other?: string;
}

interface CompanyFooter {
  companyName?: string;
  address?: string;
  officePhone?: string;
  websiteEmail?: string;
}

interface BankAccount {
  bankName?: string;
  accountName?: string;
  iban?: string;
}

interface Quote {
  _id: string;
  quoteNumber: string;
  clientId?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'modification_requested';
  quoteDate: string;
  validUntil: string;
  billTo: BillTo;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  currency: string;
  currencySymbol?: string;
  companyFooter?: CompanyFooter;
  logo?: string;
  logoScale?: number;
  tableHeaderColor?: string;
  showPaymentMethod?: boolean;
  paymentMethodType?: string;
  showBankAccount?: boolean;
  bankAccount?: BankAccount;
  showPaymentTerms?: boolean;
  paymentTerms?: string;
  hideQuantity?: boolean;
  hideUnitPrice?: boolean;
  hideTotalCost?: boolean;
  hideSubTotal?: boolean;
  useManualGrandTotal?: boolean;
  manualGrandTotal?: number;
  notes?: string;
  paymentDetails?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateQuoteDto {
  clientId?: string;
  quoteNumber: string;
  status?: string;
  quoteDate: string;
  validUntil: string;
  billTo: BillTo;
  items?: QuoteItem[];
  currency: string;
  currencySymbol?: string;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total: number;
  companyFooter?: CompanyFooter;
  logoScale?: number;
  tableHeaderColor?: string;
  showPaymentMethod?: boolean;
  paymentMethodType?: string;
  showBankAccount?: boolean;
  bankAccount?: BankAccount;
  showPaymentTerms?: boolean;
  paymentTerms?: string;
  hideQuantity?: boolean;
  hideUnitPrice?: boolean;
  hideTotalCost?: boolean;
  hideSubTotal?: boolean;
  useManualGrandTotal?: boolean;
  manualGrandTotal?: number;
  notes?: string;
  paymentDetails?: string;
}

interface UpdateQuoteDto extends Partial<CreateQuoteDto> {}

export const QuoteService = {
  async getAll(status?: string): Promise<Quote[]> {
    const response = await axios.get<Quote[]>('/quotes', { params: { status } });
    return response.data;
  },

  async getById(id: string): Promise<Quote> {
    const response = await axios.get<Quote>(`/quotes/${id}`);
    return response.data;
  },

  async getByClient(clientId: string): Promise<Quote[]> {
    const response = await axios.get<Quote[]>(`/quotes/client/${clientId}`);
    return response.data;
  },

  async getByShareToken(shareToken: string): Promise<Quote> {
    const response = await axios.get<Quote>(`/quotes/public/${shareToken}`);
    return response.data;
  },

  async create(data: CreateQuoteDto, logo?: File): Promise<Quote> {
    const formData = new FormData();
    
    // Append all fields with proper handling of nested objects
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'items' || key === 'billTo' || key === 'companyFooter' || key === 'bankAccount') {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await axios.post<Quote>('/quotes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: UpdateQuoteDto, logo?: File): Promise<Quote> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'items' || key === 'billTo' || key === 'companyFooter' || key === 'bankAccount') {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await axios.patch<Quote>(`/quotes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`/quotes/${id}`);
  },
};
