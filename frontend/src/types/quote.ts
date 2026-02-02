import { BillTo, CompanyFooter, BankAccount, PaymentMethodType } from "./invoice";

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteData {
  logo: string | null;
  logoScale: number;
  currency: string;
  currencySymbol: string;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  billTo: BillTo;
  items: QuoteItem[];
  discount: number;
  deliveryFee: number;
  notes: string;
  companyFooter: CompanyFooter;
  paymentDetails: string;
  showPaymentMethod: boolean;
  paymentMethodType: PaymentMethodType;
  showBankAccount: boolean;
  bankAccount: BankAccount;
  showPaymentTerms: boolean;
  paymentTerms: string;
  hideQuantity: boolean;
  hideUnitPrice: boolean;
  hideTotalCost: boolean;
  hideSubTotal: boolean;
  useManualGrandTotal: boolean;
  manualGrandTotal: number;
  tableHeaderColor: string;
}
