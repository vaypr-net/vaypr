export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface BillTo {
  name: string;
  phone: string;
  area: string;
  block: string;
  street: string;
  house: string;
  other: string;
}

export interface CompanyFooter {
  companyName: string;
  officePhone: string;
  address: string;
  websiteEmail: string;
}

export interface BankAccount {
  bankName: string;
  accountName: string;
  iban: string;
}

export type PaymentMethodType = 'cash' | 'bank_transfer' | 'cheque' | 'online_payment';

export interface InvoiceData {
  logo: string | null;
  logoScale: number;
  currency: string;
  currencySymbol: string;
  billTo: BillTo;
  invoiceNumber: string;
  invoiceDate: string;
  paymentDate: string;
  items: InvoiceItem[];
  discount: number;
  deliveryFee: number;
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

export const currencies = [
  { code: "KWD", name: "Kuwait - Kuwaiti Dinar", symbol: "KWD" },
  { code: "BHD", name: "Bahrain - Bahraini Dinar", symbol: "BHD" },
  { code: "AED", name: "UAE - Emirati Dirham", symbol: "AED" },
  { code: "OMR", name: "Oman - Omani Rial", symbol: "OMR" },
  { code: "QAR", name: "Qatar - Qatari Riyal", symbol: "QAR" },
  { code: "SAR", name: "Saudi Arabia - Saudi Riyal", symbol: "SAR" },
  { code: "USD", name: "United States - US Dollar", symbol: "USD" },
  { code: "EUR", name: "Europe - Euro", symbol: "EUR" },
  { code: "GBP", name: "United Kingdom - Pound Sterling", symbol: "GBP" },
];
