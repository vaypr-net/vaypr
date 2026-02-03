// Core application types

export type SubscriptionPlan = 'free' | 'pro' | 'business';

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  features: string[];
  limits: {
    invoicesPerMonth: number;
    quotesPerMonth: number;
    clients: number;
    teamMembers: number;
    storageGB: number;
  };
  usage: {
    invoicesThisMonth: number;
    quotesThisMonth: number;
    currentClients: number;
    currentTeamMembers: number;
    storageUsedGB: number;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string; // Deprecated, kept for backwards compatibility
  company?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  timezone?: string;
  createdAt: string;
  subscription?: Subscription;
}

export type ClientType = 'individual' | 'company';

export interface Client {
  _id: string;
  clientType: ClientType;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields (not from API, calculated in frontend)
  id?: string; // For backwards compatibility
  type?: ClientType; // For backwards compatibility
  totalBilled?: number;
  totalPaid?: number;
}

export interface BillTo {
  name: string;
  phone?: string;
  area?: string;
  block?: string;
  street?: string;
  house?: string;
  other?: string;
}

export interface CompanyFooter {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface BankAccount {
  bankName?: string;
  accountName?: string;
  iban?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  billTo: BillTo;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
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
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}


export interface QuoteTimelineEvent {
  id: string;
  type: 'created' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'modification_requested';
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientArea?: string;
  clientBlock?: string;
  clientStreet?: string;
  clientHouse?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'modification_requested';
  quoteDate: string;
  validUntil: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  currency: string;
  currencySymbol: string;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  logo?: string | null;
  logoScale?: number;
  // Additional fields for advanced quote features
  paymentDetails?: string;
  showPaymentMethod?: boolean;
  paymentMethodType?: 'cash' | 'bank_transfer' | 'cheque' | 'online_payment';
  showBankAccount?: boolean;
  bankAccount?: {
    bankName: string;
    accountName: string;
    iban: string;
  };
  showPaymentTerms?: boolean;
  paymentTerms?: string;
  hideQuantity?: boolean;
  hideUnitPrice?: boolean;
  hideTotalCost?: boolean;
  hideSubTotal?: boolean;
  useManualGrandTotal?: boolean;
  manualGrandTotal?: number;
  tableHeaderColor?: string;
  createdAt: string;
  convertedToInvoiceId?: string;
  shareToken?: string;
  timeline?: QuoteTimelineEvent[];
  viewedAt?: string;
  clientResponse?: {
    respondedAt: string;
    action: 'accepted' | 'rejected' | 'modification_requested';
    message?: string;
  };
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceiptVoucher {
  id: string;
  receiptNumber: string;
  receivedFrom: string;
  clientId?: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  paymentMethod: string;
  reason: string;
  receiptDate: string;
  status: 'draft' | 'issued' | 'cancelled';
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  logo?: string | null;
  logoScale?: number;
  titleColor?: string;
  amountColor?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface RecurringBilling {
  id: string;
  clientId: string;
  clientName: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  lastGeneratedAt?: string;
  // Extended fields for invoice generation
  logo?: string | null;
  logoScale?: number;
  showPaymentTerms?: boolean;
  paymentTerms?: string;
  companyFooter?: {
    companyName: string;
    officePhone: string;
    address: string;
    websiteEmail: string;
  };
  itemHeaderColor?: string;
  paymentType?: 'cash' | 'bank_transfer' | 'cheque' | 'online_payment';
  showBankDetails?: boolean;
  bankDetails?: {
    bankName: string;
    accountName: string;
    iban: string;
  };
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'check' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  receipt?: string;
  notes?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: 'payment_due' | 'invoice_overdue' | 'recurring_billing' | 'quote_expiring' | 'custom';
  title: string;
  message: string;
  relatedId?: string;
  dueDate: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  pendingInvoices: number;
  overdueInvoices: number;
  pendingQuotes: number;
  totalReceipts: number;
  totalClients: number;
  recentPayments: Payment[];
}

export type ExpenseCategory = 
  | 'office_supplies'
  | 'travel'
  | 'utilities'
  | 'software'
  | 'marketing'
  | 'equipment'
  | 'professional_services'
  | 'other';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'travel', label: 'Travel' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'software', label: 'Software & Subscriptions' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'other', label: 'Other' },
];
