import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useInvoices as useInvoicesAPI } from '@/hooks/api/useInvoices';
import { useClients } from '@/hooks/api/useClients';
import { useReceiptsAPI, useDeleteReceipt } from '@/hooks/api/useReceipts';
import { ReceiptVoucher } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GmailService } from '@/api/services/gmail.service';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReceiptPreview } from '@/components/receipt/ReceiptPreview';
import { ReceiptData } from '@/types/receipt';
import { useDocumentActions } from '@/hooks/useDocumentActions';

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
  const { toast } = useToast();
  const { downloadPDF, sendEmail, openInGenerator } = useDocumentActions();
  
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptVoucher | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // API Hooks
  const { data: apiReceipts = [], isLoading: loadingReceipts } = useReceiptsAPI(statusFilter !== 'all' ? statusFilter : undefined);
  const deleteReceiptMutation = useDeleteReceipt();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoicesAPI();
  
  // Map API receipts to local type
  const receipts: ReceiptVoucher[] = apiReceipts.map((r: any) => ({
    id: r._id,
    receiptNumber: r.receiptNumber,
    clientId: r.clientId || '',
    receivedFrom: r.receivedFrom,
    status: r.status,
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
    createdAt: r.createdAt || new Date().toISOString(),
  }));
  
  // Stub functions for features not yet migrated to API
  const addReceipt = (...args: any[]) => { toast({ title: 'Feature Coming Soon', description: 'Create receipts from the Invoice Generator', variant: 'destructive' }); return null; };
  const markAsIssued = (...args: any[]) => { toast({ title: 'Feature Coming Soon', description: 'Mark as issued will be available via API soon', variant: 'destructive' }); };
  const markAsCancelled = (...args: any[]) => { toast({ title: 'Feature Coming Soon', description: 'Mark as cancelled will be available via API soon', variant: 'destructive' }); };

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

  const generateReceiptNumber = () => {
    const existingNumbers = receipts.map(r => {
      const match = r.receiptNumber.match(/RV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `RV-${String(maxNumber + 1).padStart(4, '0')}`;
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

  const handleCreateReceipt = () => {
    if (!formData.receivedFrom) {
      toast({ title: 'Error', description: 'Please enter who the payment is received from', variant: 'destructive' });
      return;
    }
    if (formData.amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    addReceipt({
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
    });

    toast({ title: 'Receipt Created', description: 'Receipt voucher has been created successfully' });
    setIsCreateDialogOpen(false);
    resetForm();
  };

  /**
   * Send receipt via Gmail API
   * Email is sent from user's Gmail account to client
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

    setIsSendingEmail(true);

    try {
      // Step 1: Generate PDF from receipt preview
      const element = document.getElementById('receipt-preview');
      if (!element) {
        throw new Error('Receipt preview not found. Please open the receipt first.');
      }

      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your receipt...',
      });

      // Generate PDF using html2canvas + jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Convert PDF to base64
      const pdfBase64 = pdf.output('dataurlstring').split(',')[1];

      // Step 2: Create HTML email body
      const companyName = selectedReceipt.companyName || 'Our Company';
      
      const emailSubject = `Receipt ${selectedReceipt.receiptNumber} from ${companyName}`;
      
      const emailBody = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .receipt-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .amount { font-size: 24px; font-weight: bold; color: #10b981; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Payment Receipt</h1>
                <p>Receipt #${selectedReceipt.receiptNumber}</p>
              </div>
              <div class="content">
                <p>Dear ${selectedReceipt.receivedFrom},</p>
                <p>Thank you for your payment! Please find the attached receipt.</p>
                
                <div class="receipt-details">
                  <p><strong>Receipt Number:</strong> ${selectedReceipt.receiptNumber}</p>
                  <p><strong>Date:</strong> ${format(new Date(selectedReceipt.receiptDate), 'MMMM d, yyyy')}</p>
                  <p><strong>Amount Received:</strong> <span class="amount">${selectedReceipt.currencySymbol}${selectedReceipt.amount.toFixed(2)}</span></p>
                  <p><strong>Payment Method:</strong> ${PAYMENT_METHODS.find(pm => pm.value === selectedReceipt.paymentMethod)?.label || selectedReceipt.paymentMethod}</p>
                  ${selectedReceipt.reason ? `<p><strong>Payment For:</strong> ${selectedReceipt.reason}</p>` : ''}
                </div>

                <p>This receipt serves as proof of payment. Please keep it for your records.</p>
                
                <p>Best regards,<br>${companyName}</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Step 3: Send email via Gmail API with PDF attachment
      const result = await GmailService.sendEmail({
        to: clientEmail,
        subject: emailSubject,
        body: emailBody,
        attachmentData: pdfBase64,
        attachmentFilename: `Receipt_${selectedReceipt.receiptNumber}.pdf`,
      });

      toast({
        title: 'Email Sent Successfully!',
        description: `Receipt sent to ${clientEmail} with PDF attachment`,
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

  const handleIssueReceipt = (receipt: ReceiptVoucher) => {
    markAsIssued(receipt.id);
    toast({ title: 'Receipt Issued', description: `Receipt ${receipt.receiptNumber} has been issued` });
  };

  const handleCancelReceipt = (receipt: ReceiptVoucher) => {
    markAsCancelled(receipt.id);
    toast({ title: 'Receipt Cancelled', description: `Receipt ${receipt.receiptNumber} has been cancelled` });
  };

  const handleDeleteReceipt = async (receipt: ReceiptVoucher) => {
    try {
      await deleteReceiptMutation.mutateAsync(receipt.id);
    } catch (error) {
      console.error('Failed to delete receipt:', error);
    }
  };

  const handleDuplicateReceipt = (receipt: ReceiptVoucher) => {
    addReceipt({
      ...receipt,
      receiptNumber: generateReceiptNumber(),
      status: 'draft',
      receiptDate: format(new Date(), 'yyyy-MM-dd'),
    });
    toast({ title: 'Receipt Duplicated', description: 'A copy of the receipt has been created' });
  };

  const handlePrintReceipt = (receipt: ReceiptVoucher) => {
    setSelectedReceipt(receipt);
    setIsViewDialogOpen(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client._id,
        receivedFrom: client.name,
      }));
    }
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(i => i._id === invoiceId);
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

  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');

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
                    <TableCell>{format(new Date(receipt.receiptDate), 'MMM d, yyyy')}</TableCell>
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
                            setClientEmail('');
                            setIsEmailDialogOpen(true);
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send to Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedReceipt(receipt);
                            setIsViewDialogOpen(true);
                            setTimeout(() => {
                              downloadPDF('receipt-preview', `Receipt-${receipt.receiptNumber}`);
                            }, 300);
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
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
                    {clients.map((client) => (
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
              <Input
                type="date"
                value={formData.receiptDate}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
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
              data={{
                logo: selectedReceipt.logo || null,
                logoScale: selectedReceipt.logoScale || 1.0,
                currency: selectedReceipt.currency,
                currencySymbol: selectedReceipt.currencySymbol,
                receiptNumber: selectedReceipt.receiptNumber,
                receiptDate: selectedReceipt.receiptDate,
                receivedFrom: selectedReceipt.receivedFrom,
                amount: selectedReceipt.amount,
                paymentMethod: getPaymentMethodLabel(selectedReceipt.paymentMethod),
                receivedBy: '',
                reason: selectedReceipt.reason || '',
                companyName: selectedReceipt.companyName || '',
                companyAddress: selectedReceipt.companyAddress || '',
                companyPhone: selectedReceipt.companyPhone || '',
                titleColor: selectedReceipt.titleColor || '',
                amountColor: selectedReceipt.amountColor || '',
              } as ReceiptData}
            />
          )}

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Email Receipt Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Receipt via Email</DialogTitle>
            <DialogDescription>
              Enter the client's email address to send receipt {selectedReceipt?.receiptNumber}
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

          {/* Hidden receipt preview for PDF generation */}
          {selectedReceipt && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <ReceiptPreview
                data={{
                  logo: selectedReceipt.logo || null,
                  logoScale: selectedReceipt.logoScale || 1.0,
                  currency: selectedReceipt.currency,
                  currencySymbol: selectedReceipt.currencySymbol,
                  receiptNumber: selectedReceipt.receiptNumber,
                  receiptDate: selectedReceipt.receiptDate,
                  receivedFrom: selectedReceipt.receivedFrom,
                  amount: selectedReceipt.amount,
                  paymentMethod: getPaymentMethodLabel(selectedReceipt.paymentMethod),
                  receivedBy: '',
                  reason: selectedReceipt.reason || '',
                  companyName: selectedReceipt.companyName || '',
                  companyAddress: selectedReceipt.companyAddress || '',
                  companyPhone: selectedReceipt.companyPhone || '',
                  titleColor: selectedReceipt.titleColor || '',
                  amountColor: selectedReceipt.amountColor || '',
                }}
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
                if (selectedReceipt) {
                  sendEmail({
                    to: clientEmail,
                    subject: `Receipt ${selectedReceipt.receiptNumber} from ${selectedReceipt.companyName || 'Our Company'}`,
                    body: `Dear ${selectedReceipt.receivedFrom},\n\nPlease find attached Receipt ${selectedReceipt.receiptNumber}.\n\nAmount: ${selectedReceipt.currencySymbol}${selectedReceipt.amount.toFixed(2)}\nDate: ${format(new Date(selectedReceipt.receiptDate), 'MMM d, yyyy')}\n\nThank you for your payment.\n\nBest regards,\n${selectedReceipt.companyName || 'Our Company'}`,
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
