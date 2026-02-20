import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useInvoices, useReminders } from '@/hooks/useData';
import { useClients } from '@/hooks/api/useClients';
import { useQuotesAPI, useCreateQuote, useDeleteQuote, useUpdateQuote } from '@/hooks/api/useQuotes';
import { useAuth } from '@/contexts/AuthContext';
import { Quote, QuoteItem } from '@/types/app';
import { QuoteData } from '@/types/quote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentDateInput } from '@/components/ui/document-date-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { EmailService } from '@/api/services/email.service';
import { QuoteService } from '@/api/services/quote.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Send,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Copy,
  Link as LinkIcon,
  ExternalLink,
  MessageSquare,
  Download,
  Mail,
  Pencil,
  Clock,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { formatDateDMY, toISODateTimeString, toISODateOnly } from '@/lib/document-date';
import { QuoteTimeline } from '@/components/quote/QuoteTimeline';
import { QuoteEmailTemplate } from '@/components/quote/QuoteEmailTemplate';
import { QuoteEditForm } from '@/components/quote/QuoteEditForm';
import { QuotePreview } from '@/components/quote/QuotePreview';

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD ($)' },
  { value: 'EUR', symbol: '€', label: 'EUR (€)' },
  { value: 'GBP', symbol: '£', label: 'GBP (£)' },
  { value: 'KWD', symbol: 'KD', label: 'KWD (KD)' },
  { value: 'AED', symbol: 'AED', label: 'AED' },
  { value: 'SAR', symbol: 'SAR', label: 'SAR' },
];

const toBool = (value: unknown): boolean => value === true || value === 'true' || value === 1 || value === '1';

export default function Quotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { downloadPDF, generatePdfBase64, sendEmail, openInGenerator } = useDocumentActions();
  
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteForDownload, setQuoteForDownload] = useState<Quote | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  
  // API Hooks - Fetch quotes from database
  const { data: apiQuotes = [], isLoading: loadingQuotes } = useQuotesAPI(statusFilter !== 'all' ? statusFilter : undefined);
  const createQuoteMutation = useCreateQuote();
  const deleteQuoteMutation = useDeleteQuote();
  const updateQuoteMutation = useUpdateQuote();
  
  // Old localStorage hooks (keeping for now for other features like invoices, reminders)
  const { addInvoice } = useInvoices();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { reminders, unreadCount } = useReminders();
  
  // Ensure apiQuotes and clients are always arrays
  const apiQuotesArray = Array.isArray(apiQuotes) ? apiQuotes : [];
  const clientsArray = Array.isArray(clients) ? clients : [];
  
  const mapApiQuoteToLocal = (q: any): Quote => ({
    id: q._id,
    quoteNumber: q.quoteNumber,
    clientId: (typeof q.clientId === 'string' ? q.clientId : q.clientId?._id) || '',
    clientName: q.billTo?.name || '',
    clientPhone: q.billTo?.phone || '',
    clientEmail: q.billTo?.email || '',
    clientArea: q.billTo?.area || '',
    clientBlock: q.billTo?.block || '',
    clientStreet: q.billTo?.street || '',
    clientHouse: q.billTo?.house || '',
    status: q.status,
    quoteDate: q.quoteDate,
    validUntil: q.validUntil,
    items: q.items?.map((item: any) => ({
      id: item._id || crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })) || [],
    subtotal: q.subtotal || 0,
    discount: q.discount || 0,
    deliveryFee: q.deliveryFee || 0,
    total: q.total || 0,
    currency: q.currency || 'KWD',
    currencySymbol: q.currencySymbol || 'KD',
    notes: q.notes || '',
    companyName: q.companyFooter?.companyName || '',
    companyAddress: q.companyFooter?.address || '',
    companyPhone: q.companyFooter?.officePhone || '',
    companyEmail: q.companyFooter?.websiteEmail || '',
    logo: q.logo || null,
    logoScale: q.logoScale || 1.0,
    paymentDetails: q.paymentDetails || '',
    showPaymentMethod: q.showPaymentMethod || false,
    paymentMethodType: q.paymentMethodType || 'cash',
    showBankAccount: q.showBankAccount || false,
    bankAccount: q.bankAccount || { bankName: '', accountName: '', iban: '' },
    showPaymentTerms: q.showPaymentTerms || false,
    paymentTerms: q.paymentTerms || '',
    hideQuantity: toBool(q.hideQuantity),
    hideUnitPrice: toBool(q.hideUnitPrice),
    hideTotalCost: toBool(q.hideTotalCost),
    hideSubTotal: toBool(q.hideSubTotal),
    useManualGrandTotal: toBool(q.useManualGrandTotal),
    manualGrandTotal: q.manualGrandTotal || 0,
    tableHeaderColor: q.tableHeaderColor || '#000000',
    shareToken: q.shareToken,
    createdAt: q.createdAt || new Date().toISOString(),
    sentAt: q.sentAt,
    acceptedAt: q.acceptedAt,
    rejectedAt: q.rejectedAt,
    convertedAt: q.convertedAt,
    convertedToInvoiceId: q.convertedToInvoiceId,
    timeline: q.timeline || [],
  });

  // Map API quotes to local Quote type
  const quotes: Quote[] = apiQuotesArray.map(mapApiQuoteToLocal);
  
  // Stub functions for features not yet migrated to API
  const addQuote = (...args: any[]) => { toast({ title: 'Feature Coming Soon', description: 'Create quotes from the Invoice Generator', variant: 'destructive' }); return null; };
  const markAsConverted = (...args: any[]) => { toast({ title: 'Feature Coming Soon', description: 'Convert to invoice will be available via API soon', variant: 'destructive' }); };

  // QuoteData state for editing (matches Generator page structure)
  const [editQuoteData, setEditQuoteData] = useState<QuoteData>({
    logo: null,
    logoScale: 1.0,
    currency: 'KWD',
    currencySymbol: 'KD',
    quoteNumber: '',
    quoteDate: format(new Date(), 'yyyy-MM-dd'),
    validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    billTo: {
      name: '',
      phone: '',
      area: '',
      block: '',
      street: '',
      house: '',
      other: '',
    },
    items: [],
    discount: 0,
    deliveryFee: 0,
    notes: '',
    companyFooter: {
      companyName: '',
      officePhone: '',
      address: '',
      websiteEmail: '',
    },
    paymentDetails: '',
    showPaymentMethod: false,
    paymentMethodType: 'cash',
    showBankAccount: false,
    bankAccount: {
      bankName: '',
      accountName: '',
      iban: '',
    },
    showPaymentTerms: false,
    paymentTerms: '',
    hideQuantity: false,
    hideUnitPrice: false,
    hideTotalCost: false,
    hideSubTotal: false,
    useManualGrandTotal: false,
    manualGrandTotal: 0,
    tableHeaderColor: '#000000',
  });

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientArea: '',
    clientBlock: '',
    clientStreet: '',
    clientHouse: '',
    quoteDate: format(new Date(), 'yyyy-MM-dd'),
    validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    currency: 'KWD',
    currencySymbol: 'KD',
    discount: 0,
    notes: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }] as QuoteItem[],
  });

  const generateQuoteNumber = () => {
    const existingNumbers = quotes.map(q => {
      const match = q.quoteNumber.match(/QT-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `QT-${String(maxNumber + 1).padStart(4, '0')}`;
  };

  const calculateSubtotal = (items: QuoteItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = (items: QuoteItem[], discount: number) => {
    const subtotal = calculateSubtotal(items);
    return subtotal - (subtotal * discount / 100);
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toFixed(2)}`;
  };

  const mapQuoteToPreviewData = (quote: Quote): QuoteData => {
    const hideQuantity = toBool(quote.hideQuantity);
    const hideUnitPrice = toBool(quote.hideUnitPrice);
    const hideTotalCost = toBool(quote.hideTotalCost);

    return {
      logo: quote.logo || null,
      logoScale: quote.logoScale || 1.0,
      currency: quote.currency,
      currencySymbol: quote.currencySymbol || quote.currency,
      billTo: {
        name: quote.clientName,
        phone: quote.clientPhone || '',
        area: quote.clientArea || '',
        block: quote.clientBlock || '',
        street: quote.clientStreet || '',
        house: quote.clientHouse || '',
        other: '',
      },
      quoteNumber: quote.quoteNumber,
      quoteDate: quote.quoteDate,
      validUntil: quote.validUntil,
      items: quote.items,
      discount: quote.discount,
      deliveryFee: quote.deliveryFee || 0,
      notes: quote.notes || '',
      companyFooter: {
        companyName: quote.companyName || '',
        officePhone: quote.companyPhone || '',
        address: quote.companyAddress || '',
        websiteEmail: quote.companyEmail || '',
      },
      paymentDetails: quote.paymentDetails || '',
      showPaymentMethod: toBool(quote.showPaymentMethod),
      paymentMethodType: quote.paymentMethodType || 'cash',
      showBankAccount: toBool(quote.showBankAccount),
      bankAccount: quote.bankAccount || {
        bankName: '',
        accountName: '',
        iban: '',
      },
      showPaymentTerms: toBool(quote.showPaymentTerms),
      paymentTerms: quote.paymentTerms || '',
      hideQuantity: hideQuantity,
      hideUnitPrice: hideUnitPrice,
      hideTotalCost: hideTotalCost,
      hideSubTotal: toBool(quote.hideSubTotal),
      useManualGrandTotal: toBool(quote.useManualGrandTotal),
      manualGrandTotal: quote.manualGrandTotal || 0,
      tableHeaderColor: quote.tableHeaderColor || '#000000',
    };
  };

  const handleDownloadQuotePdf = async (quote: Quote) => {
    let latestQuote = quote;
    try {
      const fetchedQuote = await QuoteService.getById(quote.id);
      latestQuote = mapApiQuoteToLocal(fetchedQuote);
    } catch (error) {
      console.error('Failed to fetch latest quote before download, using current row data:', error);
    }

    setQuoteForDownload(latestQuote);
    const filename = `Quote-${latestQuote.quoteNumber}`;
    // Wait for the hidden preview element to be present and visible before capturing
    const waitForElementAndDownload = async (elementId: string, filename: string, onComplete?: () => void) => {
      const timeout = 3000;
      const interval = 100;
      let waited = 0;
      while (waited < timeout) {
        const el = document.getElementById(elementId);
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) break;
        await new Promise((r) => setTimeout(r, interval));
        waited += interval;
      }
      downloadPDF(elementId, filename, onComplete);
    };

    waitForElementAndDownload('quote-preview-download', filename, () => setQuoteForDownload(null));
  };

  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const matchesSearch = 
        quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotes, searchQuery, statusFilter]);

  const getStatusBadge = (status: Quote['status']) => {
    const styles: Record<string, string> = {
      draft: 'bg-secondary text-secondary-foreground',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      viewed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      modification_requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      sent: 'Sent',
      viewed: 'Viewed',
      accepted: 'Accepted',
      rejected: 'Rejected',
      expired: 'Expired',
      converted: 'Converted',
      modification_requested: 'Modification Requested',
    };
    return <Badge className={styles[status]}>{labels[status] || status}</Badge>;
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      clientName: '',
      clientPhone: '',
      clientArea: '',
      clientBlock: '',
      clientStreet: '',
      clientHouse: '',
      quoteDate: format(new Date(), 'yyyy-MM-dd'),
      validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      currency: 'KWD',
      currencySymbol: 'KD',
      discount: 0,
      notes: '',
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const generateShareToken = () => {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  };

  const handleCreateQuote = () => {
    if (!formData.clientName) {
      toast({ title: 'Error', description: 'Please enter client name', variant: 'destructive' });
      return;
    }

    const subtotal = calculateSubtotal(formData.items);
    const total = calculateTotal(formData.items, formData.discount);
    const shareToken = generateShareToken();

    const newQuote = addQuote({
      quoteNumber: generateQuoteNumber(),
      clientId: formData.clientId || crypto.randomUUID(),
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientArea: formData.clientArea,
      clientBlock: formData.clientBlock,
      clientStreet: formData.clientStreet,
      clientHouse: formData.clientHouse,
      status: 'draft',
      quoteDate: formData.quoteDate,
      validUntil: formData.validUntil,
      items: formData.items,
      subtotal,
      discount: formData.discount,
      total,
      currency: formData.currency,
      currencySymbol: formData.currencySymbol,
      notes: formData.notes,
      companyName: formData.companyName,
      companyAddress: formData.companyAddress,
      companyPhone: formData.companyPhone,
      companyEmail: formData.companyEmail,
      shareToken,
    });

    toast({ title: 'Quote Created', description: 'Quote has been created with a shareable link' });
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuoteId(quote.id);
    
    // Convert stored dates to YYYY-MM-DD format used internally by the form.
    const formatDateForInput = (date: any) => {
      if (!date) return format(new Date(), 'yyyy-MM-dd');
      return toISODateOnly(typeof date === 'string' ? date : String(date)) || format(new Date(), 'yyyy-MM-dd');
    };
    
    // Populate editQuoteData with full QuoteData structure from the quote
    setEditQuoteData({
      logo: quote.logo || null,
      logoScale: quote.logoScale || 1.0,
      currency: quote.currency,
      currencySymbol: quote.currencySymbol,
      quoteNumber: quote.quoteNumber,
      quoteDate: formatDateForInput(quote.quoteDate),
      validUntil: formatDateForInput(quote.validUntil),
      billTo: {
        name: quote.clientName,
        phone: quote.clientPhone || '',
        area: quote.clientArea || '',
        block: quote.clientBlock || '',
        street: quote.clientStreet || '',
        house: quote.clientHouse || '',
        other: '',
      },
      items: quote.items.length > 0 ? quote.items : [],
      discount: quote.discount,
      deliveryFee: quote.deliveryFee || 0,
      notes: quote.notes || '',
      companyFooter: {
        companyName: quote.companyName || '',
        officePhone: quote.companyPhone || '',
        address: quote.companyAddress || '',
        websiteEmail: quote.companyEmail || '',
      },
      paymentDetails: quote.paymentDetails || '',
      showPaymentMethod: toBool(quote.showPaymentMethod),
      paymentMethodType: quote.paymentMethodType || 'cash',
      showBankAccount: toBool(quote.showBankAccount),
      bankAccount: quote.bankAccount || {
        bankName: '',
        accountName: '',
        iban: '',
      },
      showPaymentTerms: toBool(quote.showPaymentTerms),
      paymentTerms: quote.paymentTerms || '',
      hideQuantity: toBool(quote.hideQuantity),
      hideUnitPrice: toBool(quote.hideUnitPrice),
      hideTotalCost: toBool(quote.hideTotalCost),
      hideSubTotal: toBool(quote.hideSubTotal),
      useManualGrandTotal: toBool(quote.useManualGrandTotal),
      manualGrandTotal: quote.manualGrandTotal || 0,
      tableHeaderColor: quote.tableHeaderColor || '#000000',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuote = async () => {
    if (!editingQuoteId) return;

    if (!editQuoteData.billTo.name) {
      toast({ title: 'Error', description: 'Please enter client name', variant: 'destructive' });
      return;
    }

    const subtotal = calculateSubtotal(editQuoteData.items);
    const total = calculateTotal(editQuoteData.items, editQuoteData.discount);

    // Transform items to include amount field and remove id
    const transformedItems = editQuoteData.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    // Format dates as strict ISO 8601 strings and reject invalid values.
    const formatDateToISO = (date: unknown): string | null => {
      if (!date) return null;
      if (typeof date === 'string') return toISODateTimeString(date);
      if (date instanceof Date) return toISODateTimeString(date.toISOString());
      return toISODateTimeString(String(date));
    };

    const normalizedQuoteDate = formatDateToISO(editQuoteData.quoteDate);
    const normalizedValidUntil = formatDateToISO(editQuoteData.validUntil);

    if (!normalizedQuoteDate || !normalizedValidUntil) {
      toast({
        title: 'Error',
        description: 'Quote Date and Valid Until must be valid dates',
        variant: 'destructive',
      });
      return;
    }

    await updateQuoteMutation.mutateAsync({
      id: editingQuoteId,
      data: {
        logo: editQuoteData.logo,
        logoScale: editQuoteData.logoScale,
        quoteDate: normalizedQuoteDate,
        validUntil: normalizedValidUntil,
        billTo: {
          name: editQuoteData.billTo.name,
          phone: editQuoteData.billTo.phone,
          area: editQuoteData.billTo.area,
          block: editQuoteData.billTo.block,
          street: editQuoteData.billTo.street,
          house: editQuoteData.billTo.house,
        },
        items: transformedItems,
        subtotal,
        discount: editQuoteData.discount,
        deliveryFee: editQuoteData.deliveryFee,
        total,
        currency: editQuoteData.currency,
        currencySymbol: editQuoteData.currencySymbol,
        notes: editQuoteData.notes,
        companyFooter: {
          companyName: editQuoteData.companyFooter.companyName,
          address: editQuoteData.companyFooter.address,
          officePhone: editQuoteData.companyFooter.officePhone,
          websiteEmail: editQuoteData.companyFooter.websiteEmail,
        },
        paymentDetails: editQuoteData.paymentDetails,
        showPaymentMethod: editQuoteData.showPaymentMethod,
        paymentMethodType: editQuoteData.paymentMethodType,
        showBankAccount: editQuoteData.showBankAccount,
        bankAccount: editQuoteData.bankAccount,
        showPaymentTerms: editQuoteData.showPaymentTerms,
        paymentTerms: editQuoteData.paymentTerms,
        hideQuantity: editQuoteData.hideQuantity,
        hideUnitPrice: editQuoteData.hideUnitPrice,
        hideTotalCost: editQuoteData.hideTotalCost,
        hideSubTotal: editQuoteData.hideSubTotal,
        useManualGrandTotal: editQuoteData.useManualGrandTotal,
        manualGrandTotal: editQuoteData.manualGrandTotal,
        tableHeaderColor: editQuoteData.tableHeaderColor,
      }
    });

    setIsEditDialogOpen(false);
    setEditingQuoteId(null);
    resetForm();
  };

  const getShareableLink = (quote: Quote) => {
    return `${window.location.origin}/quote/${quote.shareToken}`;
  };

  const handleGenerateShareLink = async (quote: Quote) => {
    const shareToken = generateShareToken();
    await updateQuoteMutation.mutateAsync({ id: quote.id, data: { shareToken } });
  };

  const handleCopyLink = async (quote: Quote) => {
    let shareToken = quote.shareToken;
    
    // Generate token if it doesn't exist
    if (!shareToken) {
      shareToken = generateShareToken();
      const updated = await updateQuoteMutation.mutateAsync({ id: quote.id, data: { shareToken } });
      shareToken = updated.shareToken || shareToken;
    }
    
    const link = `${window.location.origin}/quote/${shareToken}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Link Copied', description: 'Shareable quote link copied to clipboard' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleOpenShareLink = async (quote: Quote) => {
    let shareToken = quote.shareToken;

    // Generate token if it doesn't exist
    if (!shareToken) {
      shareToken = generateShareToken();
      const updated = await updateQuoteMutation.mutateAsync({ id: quote.id, data: { shareToken } });
      shareToken = updated.shareToken || shareToken;
    }

    const link = `${window.location.origin}/quote/${shareToken}`;

    // Open in the same tab so it can access the same in-app storage.
    // (Opening in a new tab can cause "Quote Not Found" in some browsers due to storage partitioning.)
    window.location.assign(link);
  };

  const handleSendQuote = async (quote: Quote) => {
    await updateQuoteMutation.mutateAsync({
      id: quote.id,
      data: { status: 'sent', sentAt: new Date().toISOString() },
    });
    toast({ title: 'Quote Sent', description: `Quote ${quote.quoteNumber} marked as sent` });
  };

  const handleAcceptQuote = async (quote: Quote) => {
    await updateQuoteMutation.mutateAsync({
      id: quote.id,
      data: { status: 'accepted', acceptedAt: new Date().toISOString() },
    });
    toast({ title: 'Quote Accepted', description: `Quote ${quote.quoteNumber} marked as accepted` });
  };

  const handleRejectQuote = async (quote: Quote) => {
    await updateQuoteMutation.mutateAsync({
      id: quote.id,
      data: { status: 'rejected', rejectedAt: new Date().toISOString() },
    });
    toast({ title: 'Quote Rejected', description: `Quote ${quote.quoteNumber} marked as rejected` });
  };
  /**
   * Send quote via Gmail API
   * Email is sent from user's Gmail account to client
   */
  const handleSendViaGmail = async () => {
    if (!selectedQuote || !clientEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the client email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // Step 1: Generate PDF from quote preview
      const element = document.getElementById('quote-preview-email');
      if (!element) {
        throw new Error('Quote preview not found. Please open the quote first.');
      }

      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your quote...',
      });

      const pdfBase64 = await generatePdfBase64('quote-preview-email');

      // Step 2: Create HTML email body
      const client = clientsArray.find(c => c._id === selectedQuote.clientId);
      const companyName = selectedQuote.companyName || 'Our Company';
      
      const emailSubject = `Quote ${selectedQuote.quoteNumber} from ${companyName}`;
      
      const emailBody = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .quote-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .amount { font-size: 24px; font-weight: bold; color: #667eea; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Quote ${selectedQuote.quoteNumber}</h1>
              </div>
              <div class="content">
                <p>Dear ${client?.name || 'Valued Client'},</p>
                <p>Thank you for your interest! Please find the attached quotation.</p>
                
                <div class="quote-details">
                  <p><strong>Quote Number:</strong> ${selectedQuote.quoteNumber}</p>
                  <p><strong>Date:</strong> ${formatDateDMY(selectedQuote.quoteDate) || '-'}</p>
                  <p><strong>Valid Until:</strong> ${formatDateDMY(selectedQuote.validUntil) || '-'}</p>
                  <p><strong>Total Amount:</strong> <span class="amount">${formatCurrency(selectedQuote.total, selectedQuote.currency)}</span></p>
                </div>

                <p>If you have any questions or would like to accept this quote, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>${companyName}</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Step 3: Send email via Gmail or Brevo (based on user's branding domain)
      const result = await EmailService.sendEmail({
        to: clientEmail,
        subject: emailSubject,
        body: emailBody,
        attachmentData: pdfBase64,
        attachmentFilename: `Quote_${selectedQuote.quoteNumber}.pdf`,
      });

      toast({
        title: 'Email Sent Successfully!',
        description: `Quote sent to ${clientEmail} with PDF attachment (via ${result.sentVia === 'brevo' ? 'Brevo' : 'Gmail'})`,
      });

      // Update quote status to 'sent'
      await updateQuoteMutation.mutateAsync({
        id: selectedQuote.id,
        data: { status: 'sent' },
      });

      setIsEmailDialogOpen(false);
      setClientEmail('');
    } catch (error: any) {
      console.error('Gmail send error:', error);
      toast({
        title: 'Failed to Send Email',
        description: error.message || 'Could not send email. Please try again or use "Open Email Client" option.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConvertToInvoice = () => {
    if (!selectedQuote) return;

    const invoiceItems = selectedQuote.items.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice, // Changed from rate to unitPrice
      amount: item.quantity * item.unitPrice,
    }));

    const subtotal = calculateSubtotal(selectedQuote.items);
    const total = calculateTotal(selectedQuote.items, selectedQuote.discount);

    const invoice = addInvoice({
      invoiceNumber: `INV-${String(Date.now()).slice(-6)}`,
      clientId: selectedQuote.clientId,
      status: 'draft',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      items: invoiceItems,
      subtotal,
      tax: 0,
      discount: selectedQuote.discount,
      total,
      currency: selectedQuote.currency,
      notes: selectedQuote.notes,
    });

    markAsConverted(selectedQuote.id, invoice._id); // Changed invoice.id to invoice._id
    toast({ title: 'Quote Converted', description: `Quote converted to Invoice ${invoice.invoiceNumber}` });
    setIsConvertDialogOpen(false);
    setSelectedQuote(null);
  };

  const handleDeleteQuote = async (quote: Quote) => {
    try {
      await deleteQuoteMutation.mutateAsync(quote.id);
    } catch (error) {
      // Error toast is handled by the mutation hook
    }
  };

  const handleDuplicateQuote = async (quote: Quote) => {
    const shareToken = generateShareToken();
    const generatedNumber = /^QT-\d+$/.test(quote.quoteNumber)
      ? generateQuoteNumber()
      : `${quote.quoteNumber}-COPY-${String(Date.now()).slice(-6)}`;

    await createQuoteMutation.mutateAsync({
      data: {
        quoteNumber: generatedNumber,
        clientId: quote.clientId || undefined,
        status: 'draft',
        quoteDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        billTo: {
          name: quote.clientName,
          phone: quote.clientPhone || '',
          area: quote.clientArea || '',
          block: quote.clientBlock || '',
          street: quote.clientStreet || '',
          house: quote.clientHouse || '',
          other: '',
        },
        items: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
        subtotal: quote.subtotal || calculateSubtotal(quote.items),
        discount: quote.discount || 0,
        deliveryFee: quote.deliveryFee || 0,
        total: quote.total || calculateTotal(quote.items, quote.discount || 0),
        currency: quote.currency,
        currencySymbol: quote.currencySymbol,
        companyFooter: {
          companyName: quote.companyName || '',
          address: quote.companyAddress || '',
          officePhone: quote.companyPhone || '',
          websiteEmail: quote.companyEmail || '',
        },
        logoScale: quote.logoScale || 1.0,
        tableHeaderColor: quote.tableHeaderColor || '#000000',
        showPaymentMethod: toBool(quote.showPaymentMethod),
        paymentMethodType: quote.paymentMethodType || 'cash',
        showBankAccount: toBool(quote.showBankAccount),
        bankAccount: quote.bankAccount || { bankName: '', accountName: '', iban: '' },
        showPaymentTerms: toBool(quote.showPaymentTerms),
        paymentTerms: quote.paymentTerms || '',
        hideQuantity: toBool(quote.hideQuantity),
        hideUnitPrice: toBool(quote.hideUnitPrice),
        hideTotalCost: toBool(quote.hideTotalCost),
        hideSubTotal: toBool(quote.hideSubTotal),
        useManualGrandTotal: toBool(quote.useManualGrandTotal),
        manualGrandTotal: quote.manualGrandTotal || 0,
        notes: quote.notes || '',
        paymentDetails: quote.paymentDetails || '',
        shareToken,
      },
    });
    toast({ title: 'Quote Duplicated', description: 'A copy of the quote has been created with a new shareable link' });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clientsArray.find(c => c._id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client._id,
        clientName: client.name,
        clientPhone: client.phone || '',
      }));
    }
  };

  const handleCurrencyChange = (value: string) => {
    const currency = CURRENCIES.find(c => c.value === value);
    if (currency) {
      setFormData(prev => ({
        ...prev,
        currency: currency.value,
        currencySymbol: currency.symbol,
      }));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
            <p className="text-muted-foreground">Create and manage client quotes</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/generator?tab=quote">
              <Plus className="h-4 w-4" />
              New Quote
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quotes Table */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingQuotes ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-muted-foreground">Loading quotes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <p>No quotes found.</p>
                      <p className="text-sm">Create quotes from the Invoice Generator.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.clientName}</TableCell>
                    <TableCell>{formatDateDMY(quote.quoteDate) || '-'}</TableCell>
                    <TableCell>{formatDateDMY(quote.validUntil) || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(quote.total, quote.currencySymbol)}
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedQuote(quote);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedQuote(quote);
                            setClientEmail(quote.clientEmail || '');
                            setIsEmailDialogOpen(true);
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send to Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            handleDownloadQuotePdf(quote);
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            openInGenerator('quote', quote);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit in Generator
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditQuote(quote)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Quick Edit
                          </DropdownMenuItem>
                          {quote.shareToken ? (
                            <>
                              <DropdownMenuItem onClick={() => handleCopyLink(quote)}>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Copy Share Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenShareLink(quote)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Share Link
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleGenerateShareLink(quote)}>
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Generate Share Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {quote.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleSendQuote(quote)}>
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                          )}
                          {(quote.status === 'sent' || quote.status === 'modification_requested') && (
                            <>
                              <DropdownMenuItem onClick={() => handleAcceptQuote(quote)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Accepted
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRejectQuote(quote)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark as Rejected
                              </DropdownMenuItem>
                            </>
                          )}
                          {(quote.status === 'accepted' || quote.status === 'sent') && !quote.convertedToInvoiceId && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedQuote(quote);
                              setIsConvertDialogOpen(true);
                            }}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Convert to Invoice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicateQuote(quote)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteQuote(quote)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Quote Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
            <DialogDescription>Fill in the details to create a new quote</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Existing Client</Label>
                <Select onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsArray.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Or Enter Client Name</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Client name"
                />
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="Phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Input
                  value={formData.clientArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientArea: e.target.value }))}
                  placeholder="Area"
                />
              </div>
              <div className="space-y-2">
                <Label>Block</Label>
                <Input
                  value={formData.clientBlock}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientBlock: e.target.value }))}
                  placeholder="Block"
                />
              </div>
              <div className="space-y-2">
                <Label>Street</Label>
                <Input
                  value={formData.clientStreet}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientStreet: e.target.value }))}
                  placeholder="Street"
                />
              </div>
            </div>

            {/* Quote Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quote Date</Label>
                <DocumentDateInput
                  value={formData.quoteDate}
                  onChange={(value) => setFormData(prev => ({ ...prev, quoteDate: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <DocumentDateInput
                  value={formData.validUntil}
                  onChange={(value) => setFormData(prev => ({ ...prev, validUntil: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {formData.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(calculateSubtotal(formData.items), formData.currencySymbol)}</p>
                  <p className="text-lg font-semibold">Total: {formatCurrency(calculateTotal(formData.items, formData.discount), formData.currencySymbol)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Terms, conditions, or additional notes..."
                rows={3}
              />
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Company Details (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.companyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: filterPhoneInput(e.target.value) }))}
                    placeholder="Company phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.companyAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="Company address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={formData.companyEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                    placeholder="company@email.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuote}>Create Quote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quote Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingQuoteId(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
            <DialogDescription>Update the quote details using the same editor as the Generator page</DialogDescription>
          </DialogHeader>

          <QuoteEditForm data={editQuoteData} onChange={setEditQuoteData} />

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingQuoteId(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuote}>Update Quote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Quote Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[92vw] max-w-[960px] max-h-[92vh] flex flex-col p-0 overflow-hidden">
          {selectedQuote && (
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              {/* Fixed Header */}
              <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 flex-wrap">
                    Quote {selectedQuote?.quoteNumber}
                    {getStatusBadge(selectedQuote.status)}
                  </DialogTitle>
                  <DialogDescription>
                    View quote details, timeline, and send to client
                  </DialogDescription>
                </DialogHeader>

                <TabsList className="grid w-full grid-cols-3 mt-4">
                  <TabsTrigger value="details" className="gap-2 text-xs sm:text-sm">
                    <FileText className="h-4 w-4 hidden sm:block" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-2 text-xs sm:text-sm">
                    <Clock className="h-4 w-4 hidden sm:block" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-2 text-xs sm:text-sm">
                    <Mail className="h-4 w-4 hidden sm:block" />
                    Send
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 sm:space-y-6 mt-0 data-[state=inactive]:hidden">
                  {/* Shareable Link Section */}
                  {selectedQuote.shareToken && (
                    <div className="p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <LinkIcon className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">Client Portal Link:</span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span 
                            className="text-sm text-muted-foreground flex-1 min-w-0"
                            style={{ 
                              overflowWrap: 'anywhere', 
                              wordBreak: 'break-word',
                              display: 'block'
                            }}
                          >
                            {getShareableLink(selectedQuote)}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => handleCopyLink(selectedQuote)} className="h-8 w-8 p-0">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenShareLink(selectedQuote)} className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Viewed Indicator */}
                  {selectedQuote.viewedAt && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg flex-wrap">
                      <Eye className="h-4 w-4 flex-shrink-0" />
                      <span>Client viewed this quote on {format(new Date(selectedQuote.viewedAt), 'MMM d, yyyy \'at\' h:mm a')}</span>
                    </div>
                  )}

                  {/* Client Response Section */}
                  {selectedQuote.clientResponse && (
                    <div className={`p-3 sm:p-4 rounded-lg border-2 ${
                      selectedQuote.clientResponse.action === 'accepted' 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                        : selectedQuote.clientResponse.action === 'rejected'
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {selectedQuote.clientResponse.action === 'accepted' && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                        {selectedQuote.clientResponse.action === 'rejected' && <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                        {selectedQuote.clientResponse.action === 'modification_requested' && <MessageSquare className="h-5 w-5 text-yellow-600 flex-shrink-0" />}
                        <span className="font-semibold">
                          {selectedQuote.clientResponse.action === 'accepted' && 'Client Accepted'}
                          {selectedQuote.clientResponse.action === 'rejected' && 'Client Declined'}
                          {selectedQuote.clientResponse.action === 'modification_requested' && 'Edit Requested'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Responded on {format(new Date(selectedQuote.clientResponse.respondedAt), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                      {selectedQuote.clientResponse.message && (
                        <div className="mt-2 p-2 bg-background/50 rounded">
                          <p className="text-sm font-medium">Client Message:</p>
                          <p className="text-sm italic break-words">"{selectedQuote.clientResponse.message}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client & Quote Info - Stack on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium break-words">{selectedQuote.clientName}</p>
                      {selectedQuote.clientPhone && (
                        <p className="text-sm text-muted-foreground break-words">{selectedQuote.clientPhone}</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-muted-foreground">Quote Date</p>
                      <p className="font-medium">{formatDateDMY(selectedQuote.quoteDate) || '-'}</p>
                      <p className="text-sm text-muted-foreground mt-2">Valid Until</p>
                      <p className="font-medium">{formatDateDMY(selectedQuote.validUntil) || '-'}</p>
                    </div>
                  </div>

                  {/* Items Table - Responsive */}
                  <div className="border rounded-lg overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center w-16">Qty</TableHead>
                            <TableHead className="text-right w-24">Price</TableHead>
                            <TableHead className="text-right w-24">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedQuote.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="break-words">{item.description}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.unitPrice, selectedQuote.currencySymbol)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.quantity * item.unitPrice, selectedQuote.currencySymbol)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="sm:hidden divide-y">
                      {selectedQuote.items.map((item) => (
                        <div key={item.id} className="p-3 space-y-2">
                          <p className="font-medium break-words">{item.description}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Qty: {item.quantity}</span>
                            <span className="text-muted-foreground">@ {formatCurrency(item.unitPrice, selectedQuote.currencySymbol)}</span>
                          </div>
                          <div className="flex justify-end">
                            <span className="font-medium">{formatCurrency(item.quantity * item.unitPrice, selectedQuote.currencySymbol)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-full sm:w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(selectedQuote.subtotal, selectedQuote.currencySymbol)}</span>
                      </div>
                      {selectedQuote.discount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Discount ({selectedQuote.discount}%)</span>
                          <span>-{formatCurrency(selectedQuote.subtotal * selectedQuote.discount / 100, selectedQuote.currencySymbol)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(selectedQuote.total, selectedQuote.currencySymbol)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedQuote.notes && (
                    <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{selectedQuote.notes}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="mt-0 data-[state=inactive]:hidden">
                  <div className="p-3 sm:p-4 bg-secondary/30 rounded-lg">
                    <QuoteTimeline 
                      events={selectedQuote.timeline || []} 
                      createdAt={selectedQuote.createdAt}
                    />
                  </div>
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email" className="mt-0 data-[state=inactive]:hidden">
                  {selectedQuote.shareToken ? (
                    <QuoteEmailTemplate 
                      quote={selectedQuote}
                      shareableLink={getShareableLink(selectedQuote)}
                    />
                  ) : (
                    <div className="text-center p-6 sm:p-8 bg-secondary/30 rounded-lg">
                      <LinkIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">Generate a shareable link first to send this quote to your client.</p>
                      <Button onClick={() => handleGenerateShareLink(selectedQuote)}>
                        Generate Share Link
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}

          {/* Fixed Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t bg-background">
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedQuote?.shareToken && (
                <Button variant="secondary" onClick={() => handleCopyLink(selectedQuote)} className="gap-2 w-full sm:w-auto">
                  <LinkIcon className="h-4 w-4" />
                  Copy Share Link
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              This will create a new invoice from quote {selectedQuote?.quoteNumber} and mark the quote as converted.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="p-4 bg-secondary rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">{selectedQuote?.quoteNumber}</p>
                <p className="text-sm text-muted-foreground">Quote</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <div className="p-4 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">New Invoice</p>
                <p className="text-sm text-muted-foreground">Draft</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToInvoice}>Convert to Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden quote preview used by Download PDF action */}
      {quoteForDownload && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
          <QuotePreview
            previewId="quote-preview-download"
            data={mapQuoteToPreviewData(quoteForDownload)}
          />
        </div>
      )}

    {/* Email Quote Dialog */}
    <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Quote via Email</DialogTitle>
          <DialogDescription>
            Enter the client's email address to send quote {selectedQuote?.quoteNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Hidden quote preview for PDF generation */}
        {selectedQuote && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <QuotePreview 
              previewId="quote-preview-email"
              data={mapQuoteToPreviewData(selectedQuote)}
            />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEmailDialogOpen(false)}
            disabled={isSendingEmail}
          >
            Cancel
          </Button>
          
          {/* Fallback: Open local email client */}
          <Button 
            variant="outline"
            onClick={() => {
              if (selectedQuote) {
                sendEmail({
                  to: clientEmail,
                  subject: `Quote ${selectedQuote.quoteNumber} from ${selectedQuote.companyName || 'Our Company'}`,
                  body: `Dear ${selectedQuote.clientName},\n\nPlease find attached Quote ${selectedQuote.quoteNumber}.\n\nTotal: ${selectedQuote.currencySymbol}${selectedQuote.total.toFixed(2)}\nValid Until: ${formatDateDMY(selectedQuote.validUntil) || '-'}\n\nThank you for your business.\n\nBest regards,\n${selectedQuote.companyName || 'Our Company'}`,
                });
                setIsEmailDialogOpen(false);
              }
            }} 
            className="gap-2"
            disabled={isSendingEmail}
          >
            <Mail className="h-4 w-4" />
            Open Email Client
          </Button>

          {/* Primary: Send via Gmail API */}
          <Button 
            onClick={handleSendViaGmail}
            className="gap-2"
            disabled={isSendingEmail || !clientEmail}
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send via Gmail
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </DashboardLayout>
  );
}
