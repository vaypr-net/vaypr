import { useState, useMemo, type ChangeEvent } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useInvoices as useInvoicesAPI } from '@/hooks/api/useInvoices';
import { useClients } from '@/hooks/api/useClients';
import { useReceiptsAPI, useDeleteReceipt, useCreateReceipt, useUpdateReceipt } from '@/hooks/api/useReceipts';
import { ReceiptService } from '@/api/services/receipt.service';
import { ReceiptVoucher } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentDateInput } from '@/components/ui/document-date-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EmailService } from '@/api/services/email.service';
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
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Copy,
  Printer,
  Download,
  Mail,
  Pencil,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReceiptPreview } from '@/components/receipt/ReceiptPreview';
import { ReceiptData } from '@/types/receipt';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { formatDateDMY } from '@/lib/document-date';
import { buildBrandedEmailHtml, type EmailTemplateStyle } from '@/lib/branded-email-template';

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD ($)' },
  { value: 'EUR', symbol: '€', label: 'EUR (€)' },
  { value: 'GBP', symbol: '£', label: 'GBP (£)' },
  { value: 'KWD', symbol: 'KD', label: 'KWD (KD)' },
  { value: 'AED', symbol: 'AED', label: 'AED' },
  { value: 'SAR', symbol: 'SAR', label: 'SAR' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export default function Receipts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { downloadPDF, printDocument, printPDF, generatePdfBase64, sendEmail, openInGenerator } = useDocumentActions();
  
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptVoucher | null>(null);
  const [receiptForDownload, setReceiptForDownload] = useState<ReceiptVoucher | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTemplateStyle, setEmailTemplateStyle] = useState<EmailTemplateStyle>('modern');
  const [emailAccentColor, setEmailAccentColor] = useState('#10b981');
  const [emailLogoUrl, setEmailLogoUrl] = useState('');
  const [isUploadingEmailLogo, setIsUploadingEmailLogo] = useState(false);

  const getReceiptCompanyName = (receipt?: ReceiptVoucher | null) =>
    receipt?.companyName ||
    user?.company ||
    user?.fullName ||
    user?.name ||
    'VAYPR';
  
  // API Hooks
  const { data: apiReceipts = [], isLoading: loadingReceipts } = useReceiptsAPI();
  const deleteReceiptMutation = useDeleteReceipt();
  const createReceiptMutation = useCreateReceipt();
  const updateReceiptMutation = useUpdateReceipt();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoicesAPI();
  
  // Ensure all data sources are arrays
  const apiReceiptsArray = Array.isArray(apiReceipts) ? apiReceipts : [];
  const clientsArray = Array.isArray(clients) ? clients : [];
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  const normalizeRefId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (typeof value._id === 'string') return value._id;
      if (typeof value.id === 'string') return value.id;
    }
    return '';
  };
  
  const mapApiReceiptToLocal = (r: any): ReceiptVoucher => ({
    id: r._id || r.id,
    receiptNumber: r.receiptNumber,
    clientId: normalizeRefId(r.clientId),
    invoiceId: normalizeRefId(r.invoiceId) || undefined,
    receivedFrom: r.receivedFrom,
    status: r.status === 'voided' ? 'cancelled' : r.status,
    receiptDate: r.receiptDate,
    amount: r.amount,
    currency: r.currency,
    currencySymbol: r.currencySymbol || 'KD',
    paymentMethod: r.paymentMethod,
    reason: r.reason || '',
    receivedBy: r.receivedBy || '',
    companyName: r.companyName || '',
    companyAddress: r.companyAddress || '',
    companyPhone: r.companyPhone || '',
    logo: r.logo || null,
    logoScale: r.logoScale || 1.0,
    titleColor: r.titleColor || '#000000',
    amountColor: r.amountColor || '#000000',
    createdAt: r.createdAt || new Date().toISOString(),
  });

  const mapReceiptToPreviewData = (receipt: ReceiptVoucher): ReceiptData => ({
    logo: receipt.logo || null,
    logoScale: receipt.logoScale || 1.0,
    currency: receipt.currency,
    currencySymbol: receipt.currencySymbol,
    receiptNumber: receipt.receiptNumber,
    receiptDate: receipt.receiptDate,
    receivedFrom: receipt.receivedFrom,
    amount: receipt.amount,
    paymentMethod: getPaymentMethodLabel(receipt.paymentMethod),
    receivedBy: '',
    reason: receipt.reason || '',
    companyName: receipt.companyName || '',
    companyAddress: receipt.companyAddress || '',
    companyPhone: receipt.companyPhone || '',
    titleColor: receipt.titleColor || '',
    amountColor: receipt.amountColor || '',
  });

  // Map API receipts to local type
  const receipts: ReceiptVoucher[] = apiReceiptsArray.map(mapApiReceiptToLocal);
  
  const getReceiptId = (receipt: ReceiptVoucher): string | null => {
    const id = receipt.id;
    if (!id || typeof id !== 'string') return null;
    return id;
  };

  const [formData, setFormData] = useState({
    receivedFrom: '',
    clientId: '',
    amount: 0,
    currency: 'KWD',
    currencySymbol: 'KD',
    paymentMethod: 'cash',
    reason: '',
    receiptDate: format(new Date(), 'yyyy-MM-dd'),
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    invoiceId: '',
  });

  const buildNextReceiptNumber = (offset = 1) => {
    const existingNumbers = receipts.map((r) => {
      const match = r.receiptNumber.match(/RV[-_]?(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `RV-${String(maxNumber + offset).padStart(4, '0')}`;
  };

  const getHttpStatus = (error: any): number | undefined => {
    return (
      error?.response?.status ||
      error?.status ||
      error?.statusCode ||
      error?.response?.data?.statusCode
    );
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toFixed(2)}`;
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const matchesSearch = 
        receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.receivedFrom.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [receipts, searchQuery, statusFilter]);

  const getStatusBadge = (status: ReceiptVoucher['status']) => {
    const styles = {
      draft: 'bg-secondary text-secondary-foreground',
      issued: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return <Badge className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const found = PAYMENT_METHODS.find(m => m.value === method);
    return found ? found.label : method;
  };

  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  };

  const waitForElement = async (elementId: string, timeout = 3000): Promise<boolean> => {
    const interval = 100;
    let waited = 0;
    while (waited < timeout) {
      const el = document.getElementById(elementId);
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        // Additional delay to ensure fonts and styles are fully rendered
        await new Promise((r) => setTimeout(r, 300));
        return true;
      }
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;
    }
    return false;
  };

  const waitForElementAndDownload = async (
    elementId: string,
    filename: string,
    onComplete?: () => void,
  ) => {
    const found = await waitForElement(elementId);
    if (!found) {
      toast({
        title: 'Error',
        description: 'Could not find receipt preview for PDF download',
        variant: 'destructive',
      });
      onComplete?.();
      return;
    }
    downloadPDF(elementId, filename, onComplete, { fitToPage: true });
  };

  const waitForElementAndPrintPdf = async (elementId: string, filename: string) => {
    const found = await waitForElement(elementId);
    if (!found) {
      toast({
        title: 'Error',
        description: 'Could not find receipt preview for printing',
        variant: 'destructive',
      });
      return;
    }
    printPDF(elementId, filename, { fitToPage: true });
  };

  const handleDownloadReceiptPdf = async (receipt: ReceiptVoucher) => {
    // Use the exact receipt snapshot currently shown in UI to keep
    // downloaded PDF visually identical to preview.
    setReceiptForDownload(receipt);
    await waitForElementAndDownload(
      'receipt-preview-download',
      `Receipt-${receipt.receiptNumber}`,
      () => setReceiptForDownload(null),
    );
  };

  const resetForm = () => {
    setFormData({
      receivedFrom: '',
      clientId: '',
      amount: 0,
      currency: 'KWD',
      currencySymbol: 'KD',
      paymentMethod: 'cash',
      reason: '',
      receiptDate: format(new Date(), 'yyyy-MM-dd'),
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      invoiceId: '',
    });
  };

  const handleCreateReceipt = async () => {
    if (!formData.receivedFrom) {
      toast({ title: 'Error', description: 'Please enter who the payment is received from', variant: 'destructive' });
      return;
    }
    if (formData.amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    try {
      await createReceiptMutation.mutateAsync({
        data: {
          receiptNumber: generateReceiptNumber(),
          receivedFrom: formData.receivedFrom,
          clientId: formData.clientId || undefined,
          amount: formData.amount,
          currency: formData.currency,
          currencySymbol: formData.currencySymbol,
          paymentMethod: formData.paymentMethod,
          reason: formData.reason,
          receiptDate: formData.receiptDate,
          status: 'draft',
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyPhone: formData.companyPhone,
          invoiceId: formData.invoiceId || undefined,
        },
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create receipt:', error);
    }
  };

  /**
   * Send receipt via Gmail API
   * Email is sent from user's Gmail account to client with custom message
   */
  const handleSendViaGmail = async () => {
    if (!selectedReceipt || !clientEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the client email address',
        variant: 'destructive',
      });
      return;
    }

    if (!customMessage.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please add a message before sending the receipt',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // Step 1: Generate PDF from receipt preview
      const element = document.getElementById('receipt-preview-email');
      if (!element) {
        throw new Error('Receipt preview not found. Please open the receipt first.');
      }

      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your receipt...',
      });

      const pdfBase64 = await generatePdfBase64('receipt-preview-email', {
        fitToPage: true,
        fitScale: 0.85,
      });

      // Step 2: Create HTML email body with custom message
      const companyName = getReceiptCompanyName(selectedReceipt);
      
      const emailSubject = customSubject.trim() || `Receipt ${selectedReceipt.receiptNumber} from ${companyName}`;
      
      const emailBody = buildBrandedEmailHtml({
        emailTitle: `Receipt ${selectedReceipt.receiptNumber}`,
        companyName,
        message: customMessage,
        accentColor: emailAccentColor,
        templateStyle: emailTemplateStyle,
        logoUrl: emailLogoUrl || undefined,
        attachmentNote: 'Your receipt PDF is attached to this email.',
      });

      // Step 3: Send email via Gmail or Brevo (based on user's branding domain)
      const result = await EmailService.sendEmail({
        to: clientEmail,
        subject: emailSubject,
        body: emailBody,
        attachmentData: pdfBase64,
        attachmentFilename: `Receipt_${selectedReceipt.receiptNumber}.pdf`,
      });

      // Step 4: Update receipt status to issued
      const receiptId = getReceiptId(selectedReceipt);
      if (receiptId) {
        await updateReceiptMutation.mutateAsync({
          id: receiptId,
          data: { status: 'issued' },
        });
      }

      toast({
        title: 'Email Sent Successfully!',
        description: `Receipt sent to ${clientEmail} with PDF attachment (via ${result.sentVia === 'brevo' ? 'Brevo' : 'Gmail'})`,
      });

      setIsEmailDialogOpen(false);
      setClientEmail('');
      setCustomMessage('');
      setCustomSubject('');
      setIsComposing(false);
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

  const handleEmailLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingEmailLogo(true);
    try {
      const result = await EmailService.uploadLogo(file);
      setEmailLogoUrl((result.url || '').trim());
      toast({
        title: 'Logo uploaded',
        description: 'The logo will be used in this email template.',
      });
    } catch (error: any) {
      toast({
        title: 'Logo upload failed',
        description: error?.message || 'Failed to upload logo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingEmailLogo(false);
      event.target.value = '';
    }
  };

  const handleIssueReceipt = async (receipt: ReceiptVoucher) => {
    const receiptId = getReceiptId(receipt);
    if (!receiptId) {
      toast({ title: 'Error', description: 'Invalid receipt ID', variant: 'destructive' });
      return;
    }
    try {
      await updateReceiptMutation.mutateAsync({
        id: receiptId,
        data: { status: 'issued' },
      });
      toast({ title: 'Receipt Issued', description: `Receipt ${receipt.receiptNumber} has been issued` });
    } catch (error) {
      console.error('Failed to issue receipt:', error);
    }
  };

  const handleCancelReceipt = async (receipt: ReceiptVoucher) => {
    const receiptId = getReceiptId(receipt);
    if (!receiptId) {
      toast({ title: 'Error', description: 'Invalid receipt ID', variant: 'destructive' });
      return;
    }
    try {
      await updateReceiptMutation.mutateAsync({
        id: receiptId,
        data: { status: 'cancelled' },
      });
      toast({ title: 'Receipt Cancelled', description: `Receipt ${receipt.receiptNumber} has been cancelled` });
    } catch (error) {
      console.error('Failed to cancel receipt:', error);
    }
  };

  const handleDeleteReceipt = async (receipt: ReceiptVoucher) => {
    const receiptId = getReceiptId(receipt);
    if (!receiptId) {
      toast({ title: 'Error', description: 'Invalid receipt ID', variant: 'destructive' });
      return;
    }
    try {
      await deleteReceiptMutation.mutateAsync(receiptId);
    } catch (error) {
      console.error('Failed to delete receipt:', error);
    }
  };

  const handleDuplicateReceipt = async (receipt: ReceiptVoucher) => {
    try {
      const createPayload = {
        clientId: receipt.clientId || undefined,
        invoiceId: receipt.invoiceId || undefined,
        status: 'draft',
        receiptDate: format(new Date(), 'yyyy-MM-dd'),
        receivedFrom: receipt.receivedFrom,
        amount: receipt.amount,
        currency: receipt.currency,
        currencySymbol: receipt.currencySymbol,
        paymentMethod: receipt.paymentMethod,
        reason: receipt.reason,
        receivedBy: receipt.receivedBy,
        companyName: receipt.companyName,
        companyAddress: receipt.companyAddress,
        companyPhone: receipt.companyPhone,
        logo: receipt.logo || undefined,
        logoScale: receipt.logoScale,
        titleColor: receipt.titleColor,
        amountColor: receipt.amountColor,
      };

      let created = false;
      for (let attempt = 1; attempt <= 5 && !created; attempt += 1) {
        const duplicateNumber =
          attempt <= 3
            ? buildNextReceiptNumber(attempt)
            : `${receipt.receiptNumber}-COPY-${String(Date.now()).slice(-6)}-${attempt}`;

        try {
          await ReceiptService.create({
            ...createPayload,
            receiptNumber: duplicateNumber,
          });
          created = true;
        } catch (error: any) {
          const isConflict = getHttpStatus(error) === 409;
          if (!isConflict || attempt === 5) {
            throw error;
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast({ title: 'Receipt Duplicated', description: 'A copy of the receipt has been created' });
    } catch (error: any) {
      console.error('Failed to duplicate receipt:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to duplicate receipt';
      toast({ title: 'Error', description: String(message), variant: 'destructive' });
    }
  };

  const handlePrintReceipt = (receipt: ReceiptVoucher) => {
    setSelectedReceipt(receipt);
    setIsViewDialogOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clientsArray.find(c => c._id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client._id,
        receivedFrom: client.name,
      }));
    }
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoicesArray.find(i => i._id === invoiceId);
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoiceId: invoice._id,
        receivedFrom: invoice.billTo.name,
        amount: invoice.total,
        reason: `Payment for Invoice ${invoice.invoiceNumber}`,
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

  const pendingInvoices = invoicesArray.filter(i => i.status === 'sent' || i.status === 'overdue');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Receipt Vouchers</h1>
            <p className="text-muted-foreground">Issue and manage payment receipts</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/generator?tab=receipt">
              <Plus className="h-4 w-4" />
              New Receipt
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
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
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Receipts Table */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Received From</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingReceipts ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No receipts found. Create your first receipt to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                    <TableCell>{receipt.receivedFrom}</TableCell>
                    <TableCell>{formatDateDMY(receipt.receiptDate) || '-'}</TableCell>
                    <TableCell>{getPaymentMethodLabel(receipt.paymentMethod)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(receipt.amount, receipt.currencySymbol)}
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReceipt(receipt);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedReceipt(receipt);
                            const clientForReceipt = clientsArray.find((client) => client._id === receipt.clientId);
                            setClientEmail(clientForReceipt?.email || '');
                            setCustomSubject(`Receipt ${receipt.receiptNumber} from ${getReceiptCompanyName(receipt)}`);
                            setCustomMessage(`Hi ${receipt.receivedFrom || 'there'},

Please find your receipt attached with this email.

If you have any questions, just reply to this message.

Best regards,
${getReceiptCompanyName(receipt)}`);
                            setEmailAccentColor(receipt.titleColor || '#10b981');
                            setEmailLogoUrl((receipt.logo || '').trim());
                            setEmailTemplateStyle('modern');
                            setIsEmailDialogOpen(true);
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send to Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            void handleDownloadReceiptPdf(receipt);
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedReceipt(receipt);
                            setIsViewDialogOpen(true);
                            void waitForElementAndPrintPdf('receipt-preview', `Receipt-${receipt.receiptNumber}`);
                          }}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print (no headers)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            openInGenerator('receipt', receipt);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit in Generator
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePrintReceipt(receipt)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          {receipt.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleIssueReceipt(receipt)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Issue Receipt
                            </DropdownMenuItem>
                          )}
                          {receipt.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => handleCancelReceipt(receipt)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicateReceipt(receipt)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteReceipt(receipt)}
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

      {/* Create Receipt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Receipt Voucher</DialogTitle>
            <DialogDescription>Issue a new receipt for payment received</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Link to Invoice */}
            {pendingInvoices.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Invoice (Optional)</Label>
                <Select onValueChange={handleInvoiceSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingInvoices.map((invoice) => (
                      <SelectItem key={invoice._id} value={invoice._id}>
                        {invoice.invoiceNumber} - {invoice.billTo.name} ({invoice.currency} {invoice.total.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                <Label>Or Enter Name</Label>
                <Input
                  value={formData.receivedFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedFrom: e.target.value }))}
                  placeholder="Received from..."
                />
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
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
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Receipt Date</Label>
              <DocumentDateInput
                value={formData.receiptDate}
                onChange={(value) => setFormData(prev => ({ ...prev, receiptDate: value }))}
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason / For</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Payment for..."
                rows={2}
              />
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Company Details (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.companyAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="Company address"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReceipt}>Create Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Receipt Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md print:max-w-full print:h-full print:m-0 print:p-0">
          <DialogHeader className="print:hidden">
            <DialogTitle>Receipt {selectedReceipt?.receiptNumber}</DialogTitle>
            <DialogDescription>
              {selectedReceipt && getStatusBadge(selectedReceipt.status)}
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <ReceiptPreview
              data={mapReceiptToPreviewData(selectedReceipt)}
            />
          )}

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Printer className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (!selectedReceipt) return;
                    printDocument('receipt-preview');
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print (choose orientation)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!selectedReceipt) return;
                    void waitForElementAndPrintPdf('receipt-preview', `Receipt-${selectedReceipt.receiptNumber}`);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print (no headers)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!selectedReceipt) return;
                    void handleDownloadReceiptPdf(selectedReceipt);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Email Receipt Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
        setIsEmailDialogOpen(open);
        if (!open) {
          setClientEmail('');
          setCustomMessage('');
          setCustomSubject('');
          setIsComposing(false);
          setEmailTemplateStyle('modern');
          setEmailAccentColor('#10b981');
          setEmailLogoUrl('');
        }
      }}>
        <DialogContent className="w-[95vw] max-w-lg p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Send Receipt via Email</DialogTitle>
            <DialogDescription>
              Enter the client's email address to send receipt {selectedReceipt?.receiptNumber}
            </DialogDescription>
          </DialogHeader>

          {/* Email Input */}
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

          {/* Add Message Button */}
          {!isComposing && (
            <Button
              type="button"
              className="w-full gap-2 justify-center bg-purple-600 text-white hover:bg-purple-600"
              onClick={() => setIsComposing(true)}
            >
              <Mail className="h-4 w-4" />
              Add Message
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}

          {/* Message Composer - Show when composing */}
          {isComposing && (
            <div className="space-y-4 border-t pt-4 w-full overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Compose Message</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsComposing(false)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="emailSubject" className="text-sm">
                  Subject
                </Label>
                <Input
                  id="emailSubject"
                  placeholder={`Receipt from ${getReceiptCompanyName(selectedReceipt)}`}
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="text-sm h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Template</Label>
                  <Select value={emailTemplateStyle} onValueChange={(value) => setEmailTemplateStyle(value as EmailTemplateStyle)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={emailAccentColor}
                      onChange={(e) => setEmailAccentColor(e.target.value)}
                      className="h-12 w-16 p-1"
                    />
                    <Input
                      value={emailAccentColor}
                      onChange={(e) => setEmailAccentColor(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Company Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleEmailLogoUpload}
                    disabled={isUploadingEmailLogo}
                    className="h-12"
                  />
                </div>
              </div>

              {emailLogoUrl ? (
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Logo Preview</p>
                  <img src={emailLogoUrl} alt="Email logo preview" className="h-12 object-contain" />
                </div>
              ) : null}

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="customMessage" className="text-sm">
                  Message *
                </Label>
                <Textarea
                  id="customMessage"
                  placeholder="Write your message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="resize-y text-sm min-h-[220px]"
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {customMessage.length} characters
                  </p>
                  <p className="text-xs text-blue-600">
                    📎 PDF will be attached
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hidden receipt preview for PDF generation */}
          {selectedReceipt && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <ReceiptPreview
                previewId="receipt-preview-email"
                data={mapReceiptToPreviewData(selectedReceipt)}
              />
            </div>
          )}

          {/* Footer Buttons - Only show when composing */}
          {isComposing && (
            <DialogFooter className="flex-col gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsComposing(false)}
                disabled={isSendingEmail}
                className="w-full"
              >
                Cancel
              </Button>
              
              {/* Fallback: Open local email client */}
              <Button 
                variant="outline"
                onClick={() => {
                  if (selectedReceipt && customMessage.trim()) {
                    sendEmail({
                      to: clientEmail,
                      subject: customSubject || `Receipt from ${getReceiptCompanyName(selectedReceipt)}`,
                      body: customMessage,
                    });
                    setIsEmailDialogOpen(false);
                    setClientEmail('');
                    setCustomMessage('');
                    setCustomSubject('');
                    setIsComposing(false);
                  }
                }} 
                className="gap-2 w-full"
                disabled={isSendingEmail || !clientEmail.trim() || !customMessage.trim()}
              >
                <Mail className="h-4 w-4" />
                Open Email Client
              </Button>

              {/* Primary: Send via Gmail API */}
              <Button 
                onClick={handleSendViaGmail}
                className="gap-2 bg-purple-600 hover:bg-purple-700 w-full"
                disabled={isSendingEmail || !clientEmail.trim() || !customMessage.trim()}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden receipt preview used by Download PDF action */}
      {receiptForDownload && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
          <ReceiptPreview
            previewId="receipt-preview-download"
            data={mapReceiptToPreviewData(receiptForDownload)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
