import axios from '../axios';

export interface Transaction {
  _id: string;
  transactionId: string;
  userId?: string;
  subscriberId: string;
  subscriberName: string;
  subscriberEmail: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'refund' | 'chargeback';
  provider: string;
  status: 'succeeded' | 'failed' | 'refunded' | 'pending';
  plan: string;
  transactionDate: string;
  createdAt?: string;
  stripeEventId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  stripeInvoiceId?: string;
}

export interface TransactionFilters {
  search?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionStats {
  totalRevenue: number;
  successfulCount: number;
  failedCount: number;
  refundsTotal: number;
  successfulSubscriptions?: number;
  pendingTransactions?: number;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface TransactionInvoice {
  _id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
  currencySymbol?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  billTo?: {
    name?: string;
    email?: string;
    phone?: string;
    area?: string;
    block?: string;
    street?: string;
    house?: string;
    other?: string;
  };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount?: number;
  }>;
  subtotal?: number;
  tax?: number;
  discount?: number;
  deliveryFee?: number;
  logo?: string;
  logoScale?: number;
  companyFooter?: any;
  showPaymentMethod?: boolean;
  paymentMethodType?: string;
  showBankAccount?: boolean;
  bankAccount?: any;
  showPaymentTerms?: boolean;
  paymentTerms?: string;
  hideQuantity?: boolean;
  hideUnitPrice?: boolean;
  hideTotalCost?: boolean;
  hideSubTotal?: boolean;
  useManualGrandTotal?: boolean;
  manualGrandTotal?: number;
  tableHeaderColor?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = '/super-admin/transactions';

export const TransactionService = {
  /**
   * Get all transactions with filters and pagination
   */
  async getAll(filters?: TransactionFilters): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await axios.get<PaginatedTransactions>(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get transaction by ID or transactionId
   */
  async getById(id: string): Promise<Transaction> {
    const response = await axios.get<Transaction>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async getInvoices(id: string): Promise<TransactionInvoice[]> {
    const response = await axios.get<TransactionInvoice[]>(`${BASE_URL}/${id}/invoices`);
    return response.data;
  },

  /**
   * Get transaction statistics
   */
  async getStats(): Promise<TransactionStats> {
    const response = await axios.get<TransactionStats>(`${BASE_URL}/stats`);
    return response.data;
  },

  /**
   * Create a new transaction (admin only)
   */
  async create(data: Partial<Transaction>): Promise<Transaction> {
    const response = await axios.post<Transaction>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update a transaction
   */
  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const response = await axios.patch<Transaction>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await axios.delete<{ success: boolean; message?: string }>(`${BASE_URL}/${id}`);
    return response.data;
  },
};
