import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FileText, Eye, Download, Receipt, FileCheck, LayoutDashboard, Palette, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoices, useQuotes, useReceipts, useClients } from "@/hooks/useData";
import { Invoice, Quote, ReceiptVoucher } from "@/types/app";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoUpload } from "@/components/invoice/LogoUpload";
import { LogoSizeControl } from "@/components/invoice/LogoSizeControl";
import { CurrencySelect } from "@/components/invoice/CurrencySelect";
import { BillToSection } from "@/components/invoice/BillToSection";
import { InvoiceInfo } from "@/components/invoice/InvoiceInfo";
import { ItemDetails } from "@/components/invoice/ItemDetails";
import { TotalsSection } from "@/components/invoice/TotalsSection";
import { CompanyFooterSection } from "@/components/invoice/CompanyFooterSection";
import { PaymentMethod } from "@/components/invoice/PaymentMethod";
import { BankAccountSection } from "@/components/invoice/BankAccountSection";
import { PaymentTermsSection } from "@/components/invoice/PaymentTermsSection";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";
import { ReceiptPreview } from "@/components/receipt/ReceiptPreview";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { QuotePreview } from "@/components/quote/QuotePreview";
import { DesignTemplateSidebar } from "@/components/generator/DesignTemplateSidebar";
import { SaveTemplateDialog } from "@/components/generator/SaveTemplateDialog";
import { SaveToDashboardDialog } from "@/components/generator/SaveToDashboardDialog";
import { TemplateSelector } from "@/components/generator/TemplateSelector";
import { useDesignTemplates } from "@/hooks/useDesignTemplates";
import { useDocumentActions } from "@/hooks/useDocumentActions";
import { InvoiceData } from "@/types/invoice";
import { ReceiptData } from "@/types/receipt";
import { QuoteData } from "@/types/quote";
import { DesignTemplate } from "@/types/designTemplate";
import { toast } from "sonner";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"invoice" | "receipt" | "quote">("invoice");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isSaveToDashboardOpen, setIsSaveToDashboardOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingInvoiceClientId, setEditingInvoiceClientId] = useState<string | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editingReceiptClientId, setEditingReceiptClientId] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingQuoteClientId, setEditingQuoteClientId] = useState<string | null>(null);

  const { addInvoice } = useInvoices();
  const { addQuote } = useQuotes();
  const { addReceipt } = useReceipts();
  const { clients } = useClients();
  const { downloadPDF } = useDocumentActions();

  const toBool = (value: unknown): boolean =>
    value === true || value === "true" || value === 1 || value === "1";

  // Sanitize numeric values
  const sanitizeNumber = (value: any): number => {
    const num = Number(value);
    return typeof num === 'number' && !isNaN(num) && isFinite(num) ? num : 0;
  };

  // Read tab from URL query params and load edit data if available
  useEffect(() => {
    const tab = searchParams.get("tab");
    const isEdit = searchParams.get("edit") === "true";
    
    if (tab === "invoice" || tab === "receipt" || tab === "quote") {
      setActiveTab(tab);
      
      // Load data from sessionStorage if editing
      if (isEdit) {
        const storedData = sessionStorage.getItem(`edit_${tab}_data`);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            
            if (tab === "invoice") {
              const invoiceCompanyFooter = parsedData.companyFooter || {};
              const invoiceBankAccount = parsedData.bankAccount || {};
              const parsedInvoiceItems = (parsedData.items || []).map((item: any) => ({
                id: item.id || crypto.randomUUID(),
                description: item.description,
                quantity: sanitizeNumber(item.quantity),
                // Accept multiple possible field names: `rate` (legacy), `unitPrice`, or `price`
                unitPrice: sanitizeNumber(item.rate ?? item.unitPrice ?? item.price ?? 0),
              }));
              const hideQuantity = toBool(parsedData.hideQuantity);
              const hideUnitPrice = toBool(parsedData.hideUnitPrice);
              const hideTotalCost = toBool(parsedData.hideTotalCost);

              // Convert Invoice (from app.ts) to InvoiceData (for generator)
              const invoiceFormData: InvoiceData = {
                logo: parsedData.logo || null,
                logoScale: parsedData.logoScale || 1.0,
                currency: parsedData.currency || "KWD",
                currencySymbol: parsedData.currencySymbol || parsedData.currency || "KWD",
                billTo: {
                  name: parsedData.billTo?.name ?? parsedData.clientName ?? "",
                  phone: parsedData.billTo?.phone ?? parsedData.clientPhone ?? "",
                  area: parsedData.billTo?.area ?? parsedData.clientArea ?? "",
                  block: parsedData.billTo?.block ?? parsedData.clientBlock ?? "",
                  street: parsedData.billTo?.street ?? parsedData.clientStreet ?? "",
                  house: parsedData.billTo?.house ?? parsedData.clientHouse ?? "",
                  other: parsedData.billTo?.other ?? parsedData.clientOther ?? "",
                },
                invoiceNumber: parsedData.invoiceNumber || "",
                invoiceDate: parsedData.issueDate || "",
                paymentDate: parsedData.dueDate || "",
                items: parsedInvoiceItems,
                discount: parsedData.discount || 0,
                deliveryFee: parsedData.deliveryFee || 0,
                companyFooter: {
                  companyName:
                    parsedData.companyName ||
                    invoiceCompanyFooter.companyName ||
                    invoiceCompanyFooter.name ||
                    "",
                  officePhone:
                    parsedData.companyPhone ||
                    invoiceCompanyFooter.officePhone ||
                    invoiceCompanyFooter.phone ||
                    "",
                  address: parsedData.companyAddress || invoiceCompanyFooter.address || "",
                  websiteEmail:
                    parsedData.companyEmail ||
                    invoiceCompanyFooter.websiteEmail ||
                    invoiceCompanyFooter.email ||
                    "",
                },
                paymentDetails: "",
                showPaymentMethod: toBool(parsedData.showPaymentMethod),
                paymentMethodType:
                  parsedData.paymentMethodType ||
                  (parsedData.paymentMethod === 'Cash' ? 'cash' :
                  parsedData.paymentMethod === 'Bank Transfer' ? 'bank_transfer' :
                  parsedData.paymentMethod === 'Cheque' ? 'cheque' :
                  parsedData.paymentMethod === 'Online Payment' ? 'online_payment' : 'cash'),
                showBankAccount: toBool(parsedData.showBankAccount),
                bankAccount: {
                  bankName: parsedData.bankName || invoiceBankAccount.bankName || "",
                  accountName:
                    parsedData.bankAccountName ||
                    invoiceBankAccount.accountName ||
                    "",
                  iban: parsedData.bankIban || invoiceBankAccount.iban || "",
                },
                showPaymentTerms: toBool(parsedData.showPaymentTerms),
                paymentTerms: parsedData.paymentTerms || parsedData.notes || "",
                hideQuantity: hideQuantity,
                hideUnitPrice: hideUnitPrice,
                hideTotalCost: hideTotalCost,
                hideSubTotal: toBool(parsedData.hideSubTotal),
                useManualGrandTotal: toBool(parsedData.useManualGrandTotal),
                manualGrandTotal: parsedData.manualGrandTotal || 0,
                tableHeaderColor: parsedData.tableHeaderColor || "#000000",
              };
              setInvoiceData(invoiceFormData);
              setEditingInvoiceId(parsedData.id || parsedData._id || null);
              const clientId =
                typeof parsedData.clientId === "string"
                  ? parsedData.clientId
                  : parsedData.clientId?._id || parsedData.clientId?.id || null;
              setEditingInvoiceClientId(clientId);
            } else if (tab === "receipt") {
              // Convert ReceiptVoucher to ReceiptData
              const receiptFormData: ReceiptData = {
                logo: parsedData.logo || null,
                logoScale: parsedData.logoScale || 1.0,
                currency: parsedData.currency || "KWD",
                currencySymbol: parsedData.currencySymbol || parsedData.currency || "KWD",
                receiptNumber: parsedData.receiptNumber || "",
                receiptDate: parsedData.receiptDate || "",
                receivedFrom: parsedData.receivedFrom || "",
                amount: parsedData.amount || 0,
                paymentMethod: parsedData.paymentMethod || "",
                receivedBy: "",
                reason: parsedData.reason || "",
                companyName: parsedData.companyName || "",
                companyAddress: parsedData.companyAddress || "",
                companyPhone: parsedData.companyPhone || "",
                titleColor: parsedData.titleColor || "#000000",
                amountColor: parsedData.amountColor || "#000000",
              };
              setReceiptData(receiptFormData);
              setEditingReceiptId(parsedData.id || parsedData._id || null);
              const receiptClientId =
                typeof parsedData.clientId === "string"
                  ? parsedData.clientId
                  : parsedData.clientId?._id || parsedData.clientId?.id || null;
              setEditingReceiptClientId(receiptClientId);
            } else if (tab === "quote") {
              const quoteCompanyFooter = parsedData.companyFooter || {};
              const quoteBankAccount = parsedData.bankAccount || {};
              const parsedQuoteItems = (parsedData.items || []).map((item: { id?: string; description: string; quantity: number; unitPrice: number }) => ({
                id: item.id || crypto.randomUUID(),
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }));
              const hideQuantity = toBool(parsedData.hideQuantity);
              const hideUnitPrice = toBool(parsedData.hideUnitPrice);
              const hideTotalCost = toBool(parsedData.hideTotalCost);

              // Convert Quote to QuoteData
              const quoteFormData: QuoteData = {
                logo: parsedData.logo || null,
                logoScale: parsedData.logoScale || 1.0,
                currency: parsedData.currency || "KWD",
                currencySymbol: parsedData.currencySymbol || parsedData.currency || "KWD",
                quoteNumber: parsedData.quoteNumber || "",
                quoteDate: parsedData.quoteDate || "",
                validUntil: parsedData.validUntil || "",
                billTo: {
                  name: parsedData.clientName || "",
                  phone: parsedData.clientPhone || "",
                  area: parsedData.clientArea || "",
                  block: parsedData.clientBlock || "",
                  street: parsedData.clientStreet || "",
                  house: parsedData.clientHouse || "",
                  other: "",
                },
                items: parsedQuoteItems,
                discount: parsedData.discount || 0,
                deliveryFee: parsedData.deliveryFee || 0,
                notes: parsedData.notes || "",
                companyFooter: {
                  companyName:
                    parsedData.companyName ||
                    quoteCompanyFooter.companyName ||
                    quoteCompanyFooter.name ||
                    "",
                  officePhone:
                    parsedData.companyPhone ||
                    quoteCompanyFooter.officePhone ||
                    quoteCompanyFooter.phone ||
                    "",
                  address: parsedData.companyAddress || quoteCompanyFooter.address || "",
                  websiteEmail:
                    parsedData.companyEmail ||
                    quoteCompanyFooter.websiteEmail ||
                    quoteCompanyFooter.email ||
                    "",
                },
                paymentDetails: parsedData.paymentDetails || "",
                showPaymentMethod: toBool(parsedData.showPaymentMethod),
                paymentMethodType: parsedData.paymentMethodType || "cash",
                showBankAccount: toBool(parsedData.showBankAccount),
                bankAccount: {
                  bankName: parsedData.bankName || quoteBankAccount.bankName || "",
                  accountName:
                    parsedData.bankAccountName ||
                    quoteBankAccount.accountName ||
                    "",
                  iban: parsedData.bankIban || quoteBankAccount.iban || "",
                },
                showPaymentTerms: toBool(parsedData.showPaymentTerms),
                paymentTerms: parsedData.paymentTerms || "",
                hideQuantity: hideQuantity,
                hideUnitPrice: hideUnitPrice,
                hideTotalCost: hideTotalCost,
                hideSubTotal: toBool(parsedData.hideSubTotal),
                useManualGrandTotal: toBool(parsedData.useManualGrandTotal),
                manualGrandTotal: parsedData.manualGrandTotal || 0,
                tableHeaderColor: parsedData.tableHeaderColor || "#000000",
              };
              setQuoteData(quoteFormData);
              setEditingQuoteId(parsedData.id || parsedData._id || null);
              const quoteClientId =
                typeof parsedData.clientId === "string"
                  ? parsedData.clientId
                  : parsedData.clientId?._id || parsedData.clientId?.id || null;
              setEditingQuoteClientId(quoteClientId);
            }
            
            // Clear the stored data after loading
            sessionStorage.removeItem(`edit_${tab}_data`);
            toast.success(`${tab.charAt(0).toUpperCase() + tab.slice(1)} loaded for editing`);
          } catch (error) {
            console.error("Error parsing edit data:", error);
            toast.error("Failed to load document for editing");
          }
        }
      }
    }
  }, [searchParams]);

  const {
    categories,
    activeCategory,
    activeCategoryId,
    setActiveCategoryId,
    createCategory,
    updateCategory,
    deleteCategory,
    saveTemplate,
    deleteTemplate,
    getTemplatesByType,
    getAllTemplates,
  } = useDesignTemplates();

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    logo: null,
    logoScale: 1.0,
    currency: "KWD",
    currencySymbol: "KWD",
    billTo: {
      name: "",
      phone: "",
      area: "",
      block: "",
      street: "",
      house: "",
      other: "",
    },
    invoiceNumber: "",
    invoiceDate: "",
    paymentDate: "",
    items: [],
    discount: 0,
    deliveryFee: 0,
    companyFooter: {
      companyName: "",
      officePhone: "",
      address: "",
      websiteEmail: "",
    },
    paymentDetails: "",
    showPaymentMethod: false,
    paymentMethodType: "cash",
    showBankAccount: false,
    bankAccount: {
      bankName: "",
      accountName: "",
      iban: "",
    },
    showPaymentTerms: false,
    paymentTerms: "",
    hideQuantity: false,
    hideUnitPrice: false,
    hideTotalCost: false,
    hideSubTotal: false,
    useManualGrandTotal: false,
    manualGrandTotal: 0,
    tableHeaderColor: "#000000",
  });

  const [receiptData, setReceiptData] = useState<ReceiptData>({
    logo: null,
    logoScale: 1.0,
    currency: "KWD",
    currencySymbol: "KWD",
    receiptNumber: "",
    receiptDate: "",
    receivedFrom: "",
    amount: 0,
    paymentMethod: "",
    receivedBy: "",
    reason: "",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    titleColor: "#000000",
    amountColor: "#000000",
  });

  const [quoteData, setQuoteData] = useState<QuoteData>({
    logo: null,
    logoScale: 1.0,
    currency: "KWD",
    currencySymbol: "KWD",
    quoteNumber: "",
    quoteDate: "",
    validUntil: "",
    billTo: {
      name: "",
      phone: "",
      area: "",
      block: "",
      street: "",
      house: "",
      other: "",
    },
    items: [],
    discount: 0,
    deliveryFee: 0,
    notes: "",
    companyFooter: {
      companyName: "",
      officePhone: "",
      address: "",
      websiteEmail: "",
    },
    paymentDetails: "",
    showPaymentMethod: false,
    paymentMethodType: "cash",
    showBankAccount: false,
    bankAccount: {
      bankName: "",
      accountName: "",
      iban: "",
    },
    showPaymentTerms: false,
    paymentTerms: "",
    hideQuantity: false,
    hideUnitPrice: false,
    hideTotalCost: false,
    hideSubTotal: false,
    useManualGrandTotal: false,
    manualGrandTotal: 0,
    tableHeaderColor: "#000000",
  });

  const handlePrint = () => {
    // Validate form data based on active tab - allow download if basic data exists
    const errors: string[] = [];

    if (activeTab === "invoice") {
      if (!invoiceData.billTo.name.trim()) {
        errors.push("Customer Name is required");
      }
      if (!invoiceData.invoiceNumber.trim()) {
        errors.push("Invoice Number is required");
      }
      if (!invoiceData.items || invoiceData.items.length === 0) {
        errors.push("At least one item is required");
      } else {
        const hasValidItem = invoiceData.items.some(
          item => item.description.trim() !== "" || item.quantity > 0 || item.unitPrice > 0
        );
        if (!hasValidItem) {
          errors.push("At least one item must have some data (description, quantity, or price)");
        }
      }
    } else if (activeTab === "receipt") {
      if (!receiptData.receiptNumber.trim()) {
        errors.push("Receipt Number is required");
      }
      if (!receiptData.receivedFrom.trim()) {
        errors.push("Received From is required");
      }
      if (receiptData.amount <= 0) {
        errors.push("Amount must be greater than 0");
      }
    } else if (activeTab === "quote") {
      if (!quoteData.billTo.name.trim()) {
        errors.push("Customer Name is required");
      }
      if (!quoteData.quoteNumber.trim()) {
        errors.push("Quote Number is required");
      }
      if (!quoteData.items || quoteData.items.length === 0) {
        errors.push("At least one item is required");
      } else {
        const hasValidItem = quoteData.items.some(
          item => item.description.trim() !== "" || item.quantity > 0 || item.unitPrice > 0
        );
        if (!hasValidItem) {
          errors.push("At least one item must have some data (description, quantity, or price)");
        }
      }
    }

    if (errors.length > 0) {
      toast.error("Cannot generate:\n" + errors.join("\n"));
      return;
    }

    const exportId =
      activeTab === "invoice"
        ? "generator-invoice-export-preview"
        : activeTab === "receipt"
          ? "generator-receipt-export-preview"
          : "generator-quote-export-preview";

    const exportName =
      activeTab === "invoice"
        ? `Invoice-${invoiceData.invoiceNumber || "document"}`
        : activeTab === "receipt"
          ? `Receipt-${receiptData.receiptNumber || "document"}`
          : `Quote-${quoteData.quoteNumber || "document"}`;

    // Wait for element to be fully rendered before generating PDF
    const waitForRender = async () => {
      const element = document.getElementById(exportId);
      if (!element) return;
      
      // Wait for fonts and styles to fully render
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Use fitToPage for receipts to prevent text scaling issues
      const options = activeTab === "receipt" ? { fitToPage: true } : undefined;
      downloadPDF(exportId, exportName, undefined, options);
    };

    waitForRender();
  };

  const getDocumentLabel = () => {
    switch (activeTab) {
      case "receipt":
        return "Receipt Voucher";
      case "quote":
        return "Quote";
      default:
        return "Invoice";
    }
  };

  const isDocumentValid = (): boolean => {
    if (activeTab === "invoice") {
      // Less strict: require at least some basic data
      const hasCustomerName = invoiceData.billTo.name.trim() !== "";
      const hasInvoiceNumber = invoiceData.invoiceNumber.trim() !== "";
      const hasItems = invoiceData.items.length > 0;
      const hasValidItem = invoiceData.items.some(
        item => (item.description.trim() !== "" || item.quantity > 0 || item.unitPrice > 0)
      );
      
      return hasCustomerName && hasInvoiceNumber && hasItems && hasValidItem;
    } else if (activeTab === "receipt") {
      const hasReceiptNumber = receiptData.receiptNumber.trim() !== "";
      const hasReceivedFrom = receiptData.receivedFrom.trim() !== "";
      const hasAmount = receiptData.amount > 0;
      
      return hasReceiptNumber && hasReceivedFrom && hasAmount;
    } else if (activeTab === "quote") {
      // Less strict: require at least some basic data
      const hasCustomerName = quoteData.billTo.name.trim() !== "";
      const hasQuoteNumber = quoteData.quoteNumber.trim() !== "";
      const hasItems = quoteData.items.length > 0;
      const hasValidItem = quoteData.items.some(
        item => (item.description.trim() !== "" || item.quantity > 0 || item.unitPrice > 0)
      );
      
      return hasCustomerName && hasQuoteNumber && hasItems && hasValidItem;
    }
    return false;
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "receipt":
        return receiptData;
      case "quote":
        return quoteData;
      default:
        return invoiceData;
    }
  };

  const handleSaveTemplate = (name: string) => {
    if (!activeCategoryId) return;
    
    const data = getCurrentData();
    // Clear transaction-specific data but keep design settings
    let templateData: InvoiceData | ReceiptData | QuoteData;
    
    if (activeTab === "invoice") {
      const invoiceTemplate = { ...data } as InvoiceData;
      invoiceTemplate.invoiceNumber = "";
      invoiceTemplate.invoiceDate = "";
      invoiceTemplate.paymentDate = "";
      invoiceTemplate.items = [];
      invoiceTemplate.billTo = { name: "", phone: "", area: "", block: "", street: "", house: "", other: "" };
      templateData = invoiceTemplate;
    } else if (activeTab === "receipt") {
      const receiptTemplate = { ...data } as ReceiptData;
      receiptTemplate.receiptNumber = "";
      receiptTemplate.receiptDate = "";
      receiptTemplate.receivedFrom = "";
      receiptTemplate.amount = 0;
      receiptTemplate.reason = "";
      templateData = receiptTemplate;
    } else {
      const quoteTemplate = { ...data } as QuoteData;
      quoteTemplate.quoteNumber = "";
      quoteTemplate.quoteDate = "";
      quoteTemplate.validUntil = "";
      quoteTemplate.items = [];
      quoteTemplate.billTo = { name: "", phone: "", area: "", block: "", street: "", house: "", other: "" };
      templateData = quoteTemplate;
    }
    
    saveTemplate(activeCategoryId, activeTab, templateData, name);
    toast.success(`Template "${name}" saved to ${activeCategory?.name}`);
  };

  const handleSelectTemplate = (template: DesignTemplate) => {
    setActiveTab(template.type);
    
    if (template.type === "invoice") {
      const templateData = template.data as InvoiceData;
      setInvoiceData((prev) => ({
        ...templateData,
        // Preserve current transaction data
        invoiceNumber: prev.invoiceNumber,
        invoiceDate: prev.invoiceDate,
        paymentDate: prev.paymentDate,
        items: prev.items,
        billTo: prev.billTo,
        discount: prev.discount,
        deliveryFee: prev.deliveryFee,
        // Keep column visibility at defaults (show all columns) unless user explicitly changed them
        hideQuantity: false,
        hideUnitPrice: false,
        hideTotalCost: false,
        hideSubTotal: false,
      }));
    } else if (template.type === "receipt") {
      const templateData = template.data as ReceiptData;
      setReceiptData((prev) => ({
        ...templateData,
        receiptNumber: prev.receiptNumber,
        receiptDate: prev.receiptDate,
        receivedFrom: prev.receivedFrom,
        amount: prev.amount,
        reason: prev.reason,
      }));
    } else {
      const templateData = template.data as QuoteData;
      setQuoteData((prev) => ({
        ...templateData,
        quoteNumber: prev.quoteNumber,
        quoteDate: prev.quoteDate,
        validUntil: prev.validUntil,
        items: prev.items,
        billTo: prev.billTo,
        discount: prev.discount,
        deliveryFee: prev.deliveryFee,
        // Keep column visibility at defaults (show all columns)
        hideQuantity: false,
        hideUnitPrice: false,
        hideTotalCost: false,
        hideSubTotal: false,
      }));
    }
    toast.success(`Template "${template.name}" applied`);
  };

  const handleSaveToDashboard = () => {
    // Validate required fields first
    const errors: string[] = [];

    if (activeTab === "invoice") {
      if (!invoiceData.billTo.name.trim()) {
        errors.push("Customer Name is required");
      }
      if (!invoiceData.invoiceNumber.trim()) {
        errors.push("Invoice Number is required");
      }
      if (!invoiceData.invoiceDate) {
        errors.push("Invoice Date is required");
      }
      if (!invoiceData.items || invoiceData.items.length === 0) {
        errors.push("At least one item is required");
      }
      if (
        invoiceData.items.some(
          (item) =>
            !item.description.trim() ||
            (!invoiceData.hideQuantity && item.quantity === 0) ||
            (!invoiceData.hideUnitPrice && item.unitPrice === 0),
        )
      ) {
        errors.push("All items must have description, quantity, and unit price");
      }
    } else if (activeTab === "receipt") {
      if (!receiptData.receiptNumber.trim()) {
        errors.push("Receipt Number is required");
      }
      if (!receiptData.receiptDate) {
        errors.push("Receipt Date is required");
      }
      if (!receiptData.receivedFrom.trim()) {
        errors.push("Received From is required");
      }
      if (receiptData.amount <= 0) {
        errors.push("Amount must be greater than 0");
      }
      if (!receiptData.paymentMethod.trim()) {
        errors.push("Payment Method is required");
      }
    } else if (activeTab === "quote") {
      if (!quoteData.billTo.name.trim()) {
        errors.push("Customer Name is required");
      }
      if (!quoteData.quoteNumber.trim()) {
        errors.push("Quote Number is required");
      }
      if (!quoteData.quoteDate) {
        errors.push("Quote Date is required");
      }
      if (!quoteData.validUntil) {
        errors.push("Valid Until date is required");
      }
      if (!quoteData.items || quoteData.items.length === 0) {
        errors.push("At least one item is required");
      }
      if (
        quoteData.items.some(
          (item) =>
            !item.description.trim() ||
            (!quoteData.hideQuantity && item.quantity === 0) ||
            (!quoteData.hideUnitPrice && item.unitPrice === 0),
        )
      ) {
        errors.push("All items must have description, quantity, and unit price");
      }
    }

    if (errors.length > 0) {
      toast.error("Please fill all required fields:\n" + errors.join("\n"));
      return;
    }

    if (activeTab === "invoice" && editingInvoiceId) {
      setIsSaveToDashboardOpen(true);
      return;
    }

    if (activeTab === "quote" && editingQuoteId) {
      setIsSaveToDashboardOpen(true);
      return;
    }

    if (activeTab === "receipt" && editingReceiptId) {
      setIsSaveToDashboardOpen(true);
      return;
    }

    // Get customer name based on document type
    let customerName = "";
    if (activeTab === "invoice") {
      customerName = invoiceData.billTo.name;
    } else if (activeTab === "receipt") {
      customerName = receiptData.receivedFrom;
    } else {
      customerName = quoteData.billTo.name;
    }

    // Check if customer name is selected
    if (!customerName.trim()) {
      toast.error(`Please select a Customer Name before saving the ${activeTab} to dashboard`);
      return;
    }

    // Find matching client
    const matchingClient = clients.find(c => c.name === customerName);
    if (!matchingClient) {
      // If no matching client found, open dialog to select
      setIsSaveToDashboardOpen(true);
      return;
    }

    // Save directly based on document type
    const clientId = matchingClient.id;
    // Use the actual billTo name from the form, not the matched client name
    const clientName = activeTab === "invoice" ? invoiceData.billTo.name : 
                       activeTab === "quote" ? quoteData.billTo.name : 
                       receiptData.receivedFrom;

    if (activeTab === "invoice") {
      const subtotal = invoiceData.items.reduce(
        (sum, item) => sum + (sanitizeNumber(item.quantity) * sanitizeNumber(item.unitPrice)),
        0
      );
      const discountAmount = (subtotal * sanitizeNumber(invoiceData.discount)) / 100;
      const total = invoiceData.useManualGrandTotal
        ? sanitizeNumber(invoiceData.manualGrandTotal)
        : subtotal - discountAmount + sanitizeNumber(invoiceData.deliveryFee);

      const invoice: Omit<Invoice, "id" | "createdAt"> = {
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        clientId: clientId,
        clientName: clientName,
        clientPhone: invoiceData.billTo.phone || undefined,
        clientArea: invoiceData.billTo.area || undefined,
        clientBlock: invoiceData.billTo.block || undefined,
        clientStreet: invoiceData.billTo.street || undefined,
        clientHouse: invoiceData.billTo.house || undefined,
        clientOther: invoiceData.billTo.other || undefined,
        status: "draft",
        issueDate: invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
        dueDate: invoiceData.paymentDate || new Date().toISOString().split("T")[0],
        items: invoiceData.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: sanitizeNumber(item.quantity),
          unitPrice: sanitizeNumber(item.unitPrice),
          rate: sanitizeNumber(item.unitPrice),
          amount: sanitizeNumber(item.quantity) * sanitizeNumber(item.unitPrice),
        })),
        subtotal: sanitizeNumber(subtotal),
        tax: 0,
        discount: sanitizeNumber(invoiceData.discount),
        deliveryFee: sanitizeNumber(invoiceData.deliveryFee),
        total: sanitizeNumber(total),
        currency: invoiceData.currency,
        currencySymbol: invoiceData.currencySymbol,
        notes: invoiceData.paymentTerms || undefined,
        paymentMethod: invoiceData.paymentMethodType === 'cash' ? 'Cash' : 
                       invoiceData.paymentMethodType === 'bank_transfer' ? 'Bank Transfer' :
                       invoiceData.paymentMethodType === 'cheque' ? 'Cheque' :
                       invoiceData.paymentMethodType === 'online_payment' ? 'Online Payment' : undefined,
        paymentTerms: invoiceData.paymentTerms || undefined,
        showPaymentMethod: invoiceData.showPaymentMethod,
        showPaymentTerms: invoiceData.showPaymentTerms,
        showBankAccount: invoiceData.showBankAccount,
        bankName: invoiceData.bankAccount.bankName || undefined,
        bankAccountName: invoiceData.bankAccount.accountName || undefined,
        bankIban: invoiceData.bankAccount.iban || undefined,
        companyName: invoiceData.companyFooter.companyName || undefined,
        companyAddress: invoiceData.companyFooter.address || undefined,
        companyPhone: invoiceData.companyFooter.officePhone || undefined,
        companyEmail: invoiceData.companyFooter.websiteEmail || undefined,
        logo: invoiceData.logo,
        logoScale: invoiceData.logoScale,
        tableHeaderColor: invoiceData.tableHeaderColor || undefined,
        hideQuantity: invoiceData.hideQuantity,
        hideUnitPrice: invoiceData.hideUnitPrice,
        hideTotalCost: invoiceData.hideTotalCost,
        hideSubTotal: invoiceData.hideSubTotal,
        useManualGrandTotal: invoiceData.useManualGrandTotal,
        manualGrandTotal: invoiceData.manualGrandTotal,
      };

      addInvoice(invoice);
      toast.success("Invoice saved to dashboard!");
      navigate("/dashboard/invoices");
    } else if (activeTab === "quote") {
      const subtotal = quoteData.items.reduce(
        (sum, item) => sum + (sanitizeNumber(item.quantity) * sanitizeNumber(item.unitPrice)),
        0
      );
      const total = quoteData.useManualGrandTotal
        ? sanitizeNumber(quoteData.manualGrandTotal)
        : subtotal - sanitizeNumber(quoteData.discount) + sanitizeNumber(quoteData.deliveryFee);

      const quote: Omit<Quote, "id" | "createdAt"> = {
        quoteNumber: quoteData.quoteNumber || `QT-${Date.now()}`,
        clientId: clientId,
        clientName: clientName,
        clientPhone: quoteData.billTo.phone || undefined,
        clientArea: quoteData.billTo.area || undefined,
        clientBlock: quoteData.billTo.block || undefined,
        clientStreet: quoteData.billTo.street || undefined,
        clientHouse: quoteData.billTo.house || undefined,
        status: "draft",
        quoteDate: quoteData.quoteDate || new Date().toISOString().split("T")[0],
        validUntil: quoteData.validUntil || new Date().toISOString().split("T")[0],
        items: quoteData.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: sanitizeNumber(item.quantity),
          unitPrice: sanitizeNumber(item.unitPrice),
        })),
        subtotal: sanitizeNumber(subtotal),
        discount: sanitizeNumber(quoteData.discount),
        deliveryFee: sanitizeNumber(quoteData.deliveryFee),
        total: sanitizeNumber(total),
        currency: quoteData.currency,
        currencySymbol: quoteData.currencySymbol,
        notes: quoteData.notes || undefined,
        paymentDetails: quoteData.paymentDetails || undefined,
        showPaymentMethod: quoteData.showPaymentMethod,
        paymentMethodType: quoteData.paymentMethodType,
        showBankAccount: quoteData.showBankAccount,
        bankAccount: quoteData.bankAccount,
        showPaymentTerms: quoteData.showPaymentTerms,
        paymentTerms: quoteData.paymentTerms || undefined,
        hideQuantity: quoteData.hideQuantity,
        hideUnitPrice: quoteData.hideUnitPrice,
        hideTotalCost: quoteData.hideTotalCost,
        hideSubTotal: quoteData.hideSubTotal,
        useManualGrandTotal: quoteData.useManualGrandTotal,
        manualGrandTotal: quoteData.manualGrandTotal,
        tableHeaderColor: quoteData.tableHeaderColor || undefined,
        companyName: quoteData.companyFooter.companyName || undefined,
        companyAddress: quoteData.companyFooter.address || undefined,
        companyPhone: quoteData.companyFooter.officePhone || undefined,
        companyEmail: quoteData.companyFooter.websiteEmail || undefined,
        logo: quoteData.logo,
        logoScale: quoteData.logoScale,
        shareToken: crypto.randomUUID().replace(/-/g, '').substring(0, 16),
      };

      addQuote(quote);
      toast.success("Quote saved to dashboard!");
      navigate("/dashboard/quotes");
    } else if (activeTab === "receipt") {
      const receipt: Omit<ReceiptVoucher, "id" | "createdAt"> = {
        receiptNumber: receiptData.receiptNumber || `RCV-${Date.now()}`,
        receivedFrom: clientName,
        clientId: clientId,
        amount: sanitizeNumber(receiptData.amount),
        currency: receiptData.currency,
        currencySymbol: receiptData.currencySymbol,
        paymentMethod: receiptData.paymentMethod || "Cash",
        reason: receiptData.reason || "",
        receiptDate: receiptData.receiptDate || new Date().toISOString().split("T")[0],
        status: "draft",
        companyName: receiptData.companyName || undefined,
        companyAddress: receiptData.companyAddress || undefined,
        companyPhone: receiptData.companyPhone || undefined,
        logo: receiptData.logo,
        titleColor: receiptData.titleColor || undefined,
        amountColor: receiptData.amountColor || undefined,
      };

      addReceipt(receipt);
      toast.success("Receipt saved to dashboard!");
      navigate("/dashboard/receipts");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Design Templates Sidebar */}
      <DesignTemplateSidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onSelectTemplate={handleSelectTemplate}
        onDeleteTemplate={deleteTemplate}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border print:hidden">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <FileText className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">VAYPR</span>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="default" size="sm" className="gap-2">
                  <Link to={user ? "/dashboard" : "/login"}>
                    <LayoutDashboard className="w-4 h-4" />
                    {user ? "Dashboard" : "Sign In"}
                  </Link>
                </Button>
                {activeCategory && (
                  <Button
                    onClick={() => setIsSaveTemplateOpen(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    Save as Template
                  </Button>
                )}
                {user && (
                  <Button
                    onClick={handleSaveToDashboard}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Save to Dashboard
                  </Button>
                )}
                <Button 
                  onClick={handlePrint} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* No Category Selected Banner */}
        {!activeCategory && categories.length > 0 && (
          <div className="bg-warning/10 border-b border-warning/20 px-6 py-3 print:hidden">
            <div className="container mx-auto flex items-center gap-2 text-sm text-warning">
              <AlertCircle className="h-4 w-4" />
              <span>Select a category from the sidebar to save templates</span>
            </div>
          </div>
        )}

        {/* Document Type Tabs with Template Selector */}
        <div className="border-b border-border print:hidden">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("invoice")}
                  className={`flex items-center gap-2 text-sm font-medium pb-3 -mb-3 border-b-2 transition-colors ${
                    activeTab === "invoice" 
                      ? "border-foreground text-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Invoice
                </button>
                <button
                  onClick={() => setActiveTab("receipt")}
                  className={`flex items-center gap-2 text-sm font-medium pb-3 -mb-3 border-b-2 transition-colors ${
                    activeTab === "receipt" 
                      ? "border-foreground text-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Receipt
                </button>
                <button
                  onClick={() => setActiveTab("quote")}
                  className={`flex items-center gap-2 text-sm font-medium pb-3 -mb-3 border-b-2 transition-colors ${
                    activeTab === "quote" 
                      ? "border-foreground text-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Quote
                </button>
              </div>
              
              {/* Template Dropdown Selector */}
              <TemplateSelector
                templates={getAllTemplates()}
                documentType={activeTab}
                onSelectTemplate={handleSelectTemplate}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 flex-1">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "edit" | "preview")} className="print:hidden">
            <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-8 bg-muted p-1 rounded-lg">
              <TabsTrigger value="edit" className="gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <FileText className="w-4 h-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="animate-fade-in">
              {activeTab === "invoice" && (
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Logo & Currency */}
                  <section className="bg-card border border-border rounded-lg p-6 space-y-6">
                    <LogoUpload
                      logo={invoiceData.logo}
                      onLogoChange={(logo) => setInvoiceData((prev) => ({ ...prev, logo }))}
                    />
                    {invoiceData.logo && (
                      <LogoSizeControl
                        value={invoiceData.logoScale}
                        onChange={(logoScale) => setInvoiceData((prev) => ({ ...prev, logoScale }))}
                      />
                    )}
                    <div className="border-t border-border pt-6">
                      <CurrencySelect
                        value={invoiceData.currency}
                        onChange={(currency, currencySymbol) =>
                          setInvoiceData((prev) => ({ ...prev, currency, currencySymbol }))
                        }
                      />
                    </div>
                  </section>

                  {/* Bill To */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <BillToSection
                      billTo={invoiceData.billTo}
                      onChange={(billTo) => setInvoiceData((prev) => ({ ...prev, billTo }))}
                    />
                  </section>

                  {/* Invoice Info */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <InvoiceInfo
                      invoiceNumber={invoiceData.invoiceNumber}
                      invoiceDate={invoiceData.invoiceDate}
                      onInvoiceNumberChange={(invoiceNumber) =>
                        setInvoiceData((prev) => ({ ...prev, invoiceNumber }))
                      }
                      onInvoiceDateChange={(invoiceDate) =>
                        setInvoiceData((prev) => ({ ...prev, invoiceDate }))
                      }
                    />
                  </section>

                  {/* Items */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <ItemDetails
                      items={invoiceData.items}
                      currencySymbol={invoiceData.currencySymbol}
                      onItemsChange={(items) => setInvoiceData((prev) => ({ ...prev, items }))}
                      hideQuantity={invoiceData.hideQuantity}
                      hideUnitPrice={invoiceData.hideUnitPrice}
                      hideTotalCost={invoiceData.hideTotalCost}
                      onHideQuantityChange={(hideQuantity) => setInvoiceData((prev) => ({ ...prev, hideQuantity }))}
                      onHideUnitPriceChange={(hideUnitPrice) => setInvoiceData((prev) => ({ ...prev, hideUnitPrice }))}
                      onHideTotalCostChange={(hideTotalCost) => setInvoiceData((prev) => ({ ...prev, hideTotalCost }))}
                      tableHeaderColor={invoiceData.tableHeaderColor}
                      onTableHeaderColorChange={(tableHeaderColor) => setInvoiceData((prev) => ({ ...prev, tableHeaderColor }))}
                    />
                  </section>

                  {/* Payment Terms */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <PaymentTermsSection
                      showPaymentTerms={invoiceData.showPaymentTerms}
                      paymentTerms={invoiceData.paymentTerms}
                      onToggle={(showPaymentTerms) =>
                        setInvoiceData((prev) => ({ ...prev, showPaymentTerms }))
                      }
                      onChange={(paymentTerms) =>
                        setInvoiceData((prev) => ({ ...prev, paymentTerms }))
                      }
                    />
                  </section>

                  <section className="bg-card border border-border rounded-lg p-6">
                    <TotalsSection
                      items={invoiceData.items}
                      discount={invoiceData.discount}
                      deliveryFee={invoiceData.deliveryFee}
                      currencySymbol={invoiceData.currencySymbol}
                      currency={invoiceData.currency}
                      onDiscountChange={(discount) =>
                        setInvoiceData((prev) => ({ ...prev, discount }))
                      }
                      onDeliveryFeeChange={(deliveryFee) =>
                        setInvoiceData((prev) => ({ ...prev, deliveryFee }))
                      }
                      hideSubTotal={invoiceData.hideSubTotal}
                      useManualGrandTotal={invoiceData.useManualGrandTotal}
                      manualGrandTotal={invoiceData.manualGrandTotal}
                      onHideSubTotalChange={(hideSubTotal) =>
                        setInvoiceData((prev) => ({ ...prev, hideSubTotal }))
                      }
                      onUseManualGrandTotalChange={(useManualGrandTotal) =>
                        setInvoiceData((prev) => ({ ...prev, useManualGrandTotal }))
                      }
                      onManualGrandTotalChange={(manualGrandTotal) =>
                        setInvoiceData((prev) => ({ ...prev, manualGrandTotal }))
                      }
                    />
                  </section>

                  {/* Company Footer */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <CompanyFooterSection
                      footer={invoiceData.companyFooter}
                      onChange={(companyFooter) =>
                        setInvoiceData((prev) => ({ ...prev, companyFooter }))
                      }
                    />
                  </section>

                  {/* Payment Method */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <PaymentMethod
                      showPaymentMethod={invoiceData.showPaymentMethod}
                      paymentMethodType={invoiceData.paymentMethodType}
                      onToggle={(showPaymentMethod) =>
                        setInvoiceData((prev) => ({ ...prev, showPaymentMethod }))
                      }
                      onMethodChange={(paymentMethodType) =>
                        setInvoiceData((prev) => ({ ...prev, paymentMethodType }))
                      }
                    />
                  </section>

                  {/* Bank Account Details */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <BankAccountSection
                      showBankAccount={invoiceData.showBankAccount}
                      bankAccount={invoiceData.bankAccount}
                      onToggle={(showBankAccount) =>
                        setInvoiceData((prev) => ({ ...prev, showBankAccount }))
                      }
                      onChange={(bankAccount) =>
                        setInvoiceData((prev) => ({ ...prev, bankAccount }))
                      }
                    />
                  </section>
                </div>
              )}

              {activeTab === "receipt" && (
                <ReceiptForm data={receiptData} onChange={setReceiptData} />
              )}

              {activeTab === "quote" && (
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Logo & Currency */}
                  <section className="bg-card border border-border rounded-lg p-6 space-y-6">
                    <LogoUpload
                      logo={quoteData.logo}
                      onLogoChange={(logo) => setQuoteData((prev) => ({ ...prev, logo }))}
                    />
                    {quoteData.logo && (
                      <LogoSizeControl
                        value={quoteData.logoScale}
                        onChange={(logoScale) => setQuoteData((prev) => ({ ...prev, logoScale }))}
                      />
                    )}
                    <div className="border-t border-border pt-6">
                      <CurrencySelect
                        value={quoteData.currency}
                        onChange={(currency, currencySymbol) =>
                          setQuoteData((prev) => ({ ...prev, currency, currencySymbol }))
                        }
                      />
                    </div>
                  </section>

                  {/* Bill To */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <BillToSection
                      billTo={quoteData.billTo}
                      onChange={(billTo) => setQuoteData((prev) => ({ ...prev, billTo }))}
                    />
                  </section>

                  {/* Quote Details */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <QuoteForm data={quoteData} onChange={setQuoteData} />
                  </section>

                  {/* Items */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <ItemDetails
                      items={quoteData.items}
                      currencySymbol={quoteData.currencySymbol}
                      onItemsChange={(items) => setQuoteData((prev) => ({ ...prev, items }))}
                      hideQuantity={quoteData.hideQuantity}
                      hideUnitPrice={quoteData.hideUnitPrice}
                      hideTotalCost={quoteData.hideTotalCost}
                      onHideQuantityChange={(hideQuantity) => setQuoteData((prev) => ({ ...prev, hideQuantity }))}
                      onHideUnitPriceChange={(hideUnitPrice) => setQuoteData((prev) => ({ ...prev, hideUnitPrice }))}
                      onHideTotalCostChange={(hideTotalCost) => setQuoteData((prev) => ({ ...prev, hideTotalCost }))}
                      tableHeaderColor={quoteData.tableHeaderColor}
                      onTableHeaderColorChange={(tableHeaderColor) => setQuoteData((prev) => ({ ...prev, tableHeaderColor }))}
                    />
                  </section>

                  {/* Payment Terms */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <PaymentTermsSection
                      showPaymentTerms={quoteData.showPaymentTerms}
                      paymentTerms={quoteData.paymentTerms}
                      onToggle={(showPaymentTerms) =>
                        setQuoteData((prev) => ({ ...prev, showPaymentTerms }))
                      }
                      onChange={(paymentTerms) =>
                        setQuoteData((prev) => ({ ...prev, paymentTerms }))
                      }
                    />
                  </section>

                  <section className="bg-card border border-border rounded-lg p-6">
                    <TotalsSection
                      items={quoteData.items}
                      discount={quoteData.discount}
                      deliveryFee={quoteData.deliveryFee}
                      currencySymbol={quoteData.currencySymbol}
                      currency={quoteData.currency}
                      onDiscountChange={(discount) =>
                        setQuoteData((prev) => ({ ...prev, discount }))
                      }
                      onDeliveryFeeChange={(deliveryFee) =>
                        setQuoteData((prev) => ({ ...prev, deliveryFee }))
                      }
                      hideSubTotal={quoteData.hideSubTotal}
                      useManualGrandTotal={quoteData.useManualGrandTotal}
                      manualGrandTotal={quoteData.manualGrandTotal}
                      onHideSubTotalChange={(hideSubTotal) =>
                        setQuoteData((prev) => ({ ...prev, hideSubTotal }))
                      }
                      onUseManualGrandTotalChange={(useManualGrandTotal) =>
                        setQuoteData((prev) => ({ ...prev, useManualGrandTotal }))
                      }
                      onManualGrandTotalChange={(manualGrandTotal) =>
                        setQuoteData((prev) => ({ ...prev, manualGrandTotal }))
                      }
                    />
                  </section>

                  {/* Company Footer */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <CompanyFooterSection
                      footer={quoteData.companyFooter}
                      onChange={(companyFooter) =>
                        setQuoteData((prev) => ({ ...prev, companyFooter }))
                      }
                    />
                  </section>

                  {/* Payment Method */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <PaymentMethod
                      showPaymentMethod={quoteData.showPaymentMethod}
                      paymentMethodType={quoteData.paymentMethodType}
                      onToggle={(showPaymentMethod) =>
                        setQuoteData((prev) => ({ ...prev, showPaymentMethod }))
                      }
                      onMethodChange={(paymentMethodType) =>
                        setQuoteData((prev) => ({ ...prev, paymentMethodType }))
                      }
                    />
                  </section>

                  {/* Bank Account Details */}
                  <section className="bg-card border border-border rounded-lg p-6">
                    <BankAccountSection
                      showBankAccount={quoteData.showBankAccount}
                      bankAccount={quoteData.bankAccount}
                      onToggle={(showBankAccount) =>
                        setQuoteData((prev) => ({ ...prev, showBankAccount }))
                      }
                      onChange={(bankAccount) =>
                        setQuoteData((prev) => ({ ...prev, bankAccount }))
                      }
                    />
                  </section>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 py-8">
                {activeCategory && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsSaveTemplateOpen(true)}
                    className="gap-2 px-8"
                  >
                    <Palette className="w-4 h-4" />
                    Save Template
                  </Button>
                )}
                <Button 
                  size="lg" 
                  onClick={handlePrint} 
                  className="gap-2 px-8"
                >
                  <Download className="w-4 h-4" />
                  Generate {getDocumentLabel()}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="animate-fade-in">
              {activeTab === "invoice" && <InvoicePreview data={invoiceData} />}
              {activeTab === "receipt" && <ReceiptPreview data={receiptData} />}
              {activeTab === "quote" && <QuotePreview data={quoteData} />}
            </TabsContent>
          </Tabs>

          {/* Print View */}
          <div className="hidden print:block">
            {activeTab === "invoice" && <InvoicePreview data={invoiceData} />}
            {activeTab === "receipt" && <ReceiptPreview data={receiptData} />}
            {activeTab === "quote" && <QuotePreview data={quoteData} />}
          </div>

          {/* Offscreen export targets for jsPDF/html2canvas */}
          <div className="absolute -left-[100000px] top-0 pointer-events-none" aria-hidden="true">
            {activeTab === "invoice" && (
              <InvoicePreview data={invoiceData} previewId="generator-invoice-export-preview" />
            )}
            {activeTab === "receipt" && (
              <ReceiptPreview data={receiptData} previewId="generator-receipt-export-preview" />
            )}
            {activeTab === "quote" && (
              <QuotePreview data={quoteData} previewId="generator-quote-export-preview" />
            )}
          </div>
        </main>
      </div>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        onSave={handleSaveTemplate}
        documentType={activeTab}
        activeCategory={activeCategory}
      />

      {/* Save to Dashboard Dialog */}
      <SaveToDashboardDialog
        isOpen={isSaveToDashboardOpen}
        onClose={() => setIsSaveToDashboardOpen(false)}
        documentType={activeTab}
        invoiceData={activeTab === "invoice" ? invoiceData : undefined}
        receiptData={activeTab === "receipt" ? receiptData : undefined}
        quoteData={activeTab === "quote" ? quoteData : undefined}
        editingInvoiceId={activeTab === "invoice" ? editingInvoiceId : null}
        editingReceiptId={activeTab === "receipt" ? editingReceiptId : null}
        editingQuoteId={activeTab === "quote" ? editingQuoteId : null}
        defaultClientId={
          activeTab === "invoice"
            ? editingInvoiceClientId
            : activeTab === "receipt"
              ? editingReceiptClientId
            : activeTab === "quote"
              ? editingQuoteClientId
              : null
        }
      />
    </div>
  );
};

export default Index;
