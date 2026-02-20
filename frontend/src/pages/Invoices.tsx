import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useInvoices as useInvoicesAPI, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/api/useInvoices';
import { useClients as useClientsAPI } from '@/hooks/api/useClients';
import { usePayments, useReminders } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentDateInput } from '@/components/ui/document-date-input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmailService } from '@/api/services/email.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Eye, DollarSign, Trash2, Send, FileText, Printer, Download, Mail, Pencil, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, addDays } from 'date-fns';
import { Invoice, InvoiceItem, BillTo } from '@/types/app';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { InvoiceData } from '@/types/invoice';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { formatDateDMY } from '@/lib/document-date';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function Invoices() {
  const { data: invoices = [], isLoading, error } = useInvoicesAPI();
  const { data: clients = [] } = useClientsAPI();
  
  // Ensure invoices and clients are always arrays
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  const clientsArray = Array.isArray(clients) ? clients : [];
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const { addPayment } = usePayments();
  const { addReminder } = useReminders();
  const { toast } = useToast();
  const { downloadPDF, printDocument, sendEmail, openInGenerator } = useDocumentActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [invoiceForDownload, setInvoiceForDownload] = useState<Invoice | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    notes: '',
    paymentMethod: '',
    discount: 0,
    items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, amount: 0 }] as InvoiceItem[],
  });

  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');

  const filteredInvoices = invoicesArray.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.billTo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency = 'KWD') => {
    if (currency === 'KWD') {
      return `KD ${amount.toFixed(3)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    const qty = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
    const price = typeof unitPrice === 'number' && !isNaN(unitPrice) ? unitPrice : 0;
    return qty * price;
  };

  const mapInvoiceToPreviewData = (invoice: Invoice): InvoiceData => {
    const hideQuantity = toBool(invoice.hideQuantity);
    const hideUnitPrice = toBool(invoice.hideUnitPrice);
    const hideTotalCost = toBool(invoice.hideTotalCost);
    const hasQuantifiableItems = invoice.items.some(
      (item) => Number(item.quantity) > 0 || Number(item.unitPrice) > 0,
    );
    const isRecurringInvoice = Boolean((invoice as { recurringId?: unknown }).recurringId);
    const shouldShowAllItemColumns =
      !isRecurringInvoice && hasQuantifiableItems && hideQuantity && hideUnitPrice && hideTotalCost;

    return {
      logo: invoice.logo || null,
      logoScale: invoice.logoScale || 1.0,
      currency: invoice.currency,
      currencySymbol: invoice.currencySymbol || invoice.currency,
      billTo: invoice.billTo,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issueDate,
      paymentDate: invoice.dueDate,
      items: invoice.items.map((item) => ({
        id: item.id || crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount: invoice.discount,
      deliveryFee: invoice.deliveryFee || 0,
      companyFooter: invoice.companyFooter || {
        companyName: '',
        officePhone: '',
        address: '',
        websiteEmail: '',
      },
      paymentDetails: invoice.paymentMethodType || '',
      showPaymentMethod: toBool(invoice.showPaymentMethod),
      paymentMethodType: invoice.paymentMethodType || 'cash',
      showBankAccount: toBool(invoice.showBankAccount),
      bankAccount: invoice.bankAccount || {
        bankName: '',
        accountName: '',
        iban: '',
      },
      showPaymentTerms: toBool(invoice.showPaymentTerms),
      paymentTerms: invoice.paymentTerms || '',
      hideQuantity: shouldShowAllItemColumns ? false : hideQuantity,
      hideUnitPrice: shouldShowAllItemColumns ? false : hideUnitPrice,
      hideTotalCost: shouldShowAllItemColumns ? false : hideTotalCost,
      hideSubTotal: toBool(invoice.hideSubTotal),
      useManualGrandTotal: toBool(invoice.useManualGrandTotal),
      manualGrandTotal: invoice.manualGrandTotal || 0,
      tableHeaderColor: invoice.tableHeaderColor || '#000000',
    };
  };

  // Wait for a DOM element to be present and visible before attempting PDF capture
  const waitForElementAndDownload = async (
    elementId: string,
    filename: string,
    onComplete?: () => void,
  ) => {
    const timeout = 3000; // ms
    const interval = 100; // ms
    let waited = 0;
    while (waited < timeout) {
      const el = document.getElementById(elementId);
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) break;
      // element not ready yet
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;
    }
    // attempt download whether or not the element reached visible size
    downloadPDF(elementId, filename, onComplete);
  };

  const handleQuickDownload = async (invoice: Invoice) => {
    setInvoiceForDownload(invoice);
    await waitForElementAndDownload(
      'invoice-preview-download',
      `Invoice-${invoice.invoiceNumber}`,
      () => setInvoiceForDownload(null),
    );
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const amount = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
      return sum + amount;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = typeof formData.discount === 'number' && !isNaN(formData.discount) ? formData.discount : 0;
    return subtotal - discountAmount;
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const sanitizedValue = typeof numValue === 'number' && !isNaN(numValue) ? numValue : 0;
    
    newItems[index] = { ...newItems[index], [field]: field === 'description' ? value : sanitizedValue };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? sanitizedValue : newItems[index].quantity;
      const price = field === 'unitPrice' ? sanitizedValue : newItems[index].unitPrice;
      newItems[index].amount = calculateItemAmount(qty, price);
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  // Sanitize numeric values before sending to backend
  const sanitizeNumber = (value: any): number => {
    const num = Number(value);
    return typeof num === 'number' && !isNaN(num) && isFinite(num) ? num : 0;
  };

  const toBool = (value: unknown): boolean =>
    value === true || value === 'true' || value === 1 || value === '1';

  const handleCreate = async () => {
    const client = clientsArray.find(c => c._id === formData.clientId);
    if (!client) {
      toast({
        title: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const total = calculateTotal();

    const billTo: BillTo = {
      name: client.name,
      phone: client.phone,
      area: client.address,
    };

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      clientId: client._id,
      billTo,
      status: 'draft',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: formData.dueDate,
      items: formData.items.map(item => ({
        description: item.description,
        quantity: sanitizeNumber(item.quantity),
        unitPrice: sanitizeNumber(item.unitPrice),
        amount: sanitizeNumber(item.amount),
      })),
      subtotal: sanitizeNumber(subtotal),
      tax: 0,
      discount: sanitizeNumber(formData.discount),
      total: sanitizeNumber(total),
      currency: 'KWD',
      currencySymbol: 'KWD',
      notes: formData.notes,
      // Column visibility settings - default to showing all columns
      hideQuantity: false,
      hideUnitPrice: false,
      hideTotalCost: false,
      hideSubTotal: false,
      useManualGrandTotal: false,
      manualGrandTotal: 0,
      // Payment and styling defaults
      showPaymentMethod: false,
      paymentMethodType: 'cash',
      showBankAccount: false,
      showPaymentTerms: false,
      tableHeaderColor: '#000000',
      logoScale: 1,
    };

    console.log('📤 Sending invoice data:', JSON.stringify(invoiceData, null, 2));

    await createInvoice.mutateAsync({ data: invoiceData });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    await updateInvoice.mutateAsync({ 
      id: invoice._id, 
      data: { status: 'sent' }
    });
  };

  /**
   * Send invoice via Gmail API with PDF attachment
   * Email is sent from user's Gmail account to client
   */
  const handleSendViaGmail = async () => {
    if (!selectedInvoice || !clientEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the client email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      // Step 1: Generate PDF from invoice preview
      const element = document.getElementById('invoice-preview-email');
      if (!element) {
        throw new Error('Invoice preview not found. Please open the invoice first.');
      }

      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your invoice...',
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
      const pdfBase64 = pdf.output('dataurlstring').split(',')[1]; // Remove "data:application/pdf;base64," prefix

      // Step 2: Create HTML email body
      const emailSubject = `Invoice ${selectedInvoice.invoiceNumber} from ${selectedInvoice.companyFooter?.name || 'Our Company'}`;
      
      const emailBody = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .amount { font-size: 24px; font-weight: bold; color: #667eea; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Invoice ${selectedInvoice.invoiceNumber}</h1>
              </div>
              <div class="content">
                <p>Dear ${selectedInvoice.billTo.name},</p>
                <p>Thank you for your business! Please find the attached invoice.</p>
                
                <div class="invoice-details">
                  <p><strong>Invoice Number:</strong> ${selectedInvoice.invoiceNumber}</p>
                  <p><strong>Issue Date:</strong> ${formatDateDMY(selectedInvoice.issueDate) || '-'}</p>
                  <p><strong>Due Date:</strong> ${formatDateDMY(selectedInvoice.dueDate) || '-'}</p>
                  <p><strong>Amount Due:</strong> <span class="amount">${formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span></p>
                </div>

                <p>Please process the payment by the due date. If you have any questions, feel free to reach out.</p>
                
                <p>Best regards,<br>${selectedInvoice.companyFooter?.name || 'Our Company'}</p>
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
        attachmentFilename: `Invoice_${selectedInvoice.invoiceNumber}.pdf`,
      });

      toast({
        title: 'Email Sent Successfully!',
        description: `Invoice sent to ${clientEmail} with PDF attachment (via ${result.sentVia === 'brevo' ? 'Brevo' : 'Gmail'})`,
      });

      // Update invoice status to 'sent'
      await handleSendInvoice(selectedInvoice);

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

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;

    addPayment({
      invoiceId: selectedInvoice._id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      clientId: selectedInvoice.clientId || '',
      clientName: selectedInvoice.billTo.name,
      amount: selectedInvoice.total,
      currency: selectedInvoice.currency,
      method: paymentMethod as any,
      status: 'completed',
      paidAt: new Date().toISOString(),
    });

    await updateInvoice.mutateAsync({
      id: selectedInvoice._id,
      data: { status: 'paid', paidAt: new Date().toISOString() }
    });

    setIsPaymentOpen(false);
    setSelectedInvoice(null);
  };

  const handleDelete = async (invoice: Invoice) => {
    await deleteInvoice.mutateAsync(invoice._id);
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      notes: '',
      paymentMethod: '',
      discount: 0,
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      sent: { variant: 'outline', label: 'Sent' },
      paid: { variant: 'default', label: 'Paid' },
      overdue: { variant: 'destructive', label: 'Overdue' },
      cancelled: { variant: 'secondary', label: 'Cancelled' },
    };
    const { variant, label } = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage and track your invoices</p>
          </div>
          <Button asChild>
            <Link to="/generator?tab=invoice">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>Loading invoices...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>Error loading invoices. Please try again.</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No invoices found</p>
                <p className="text-sm">Create your first invoice to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.billTo.name}</TableCell>
                      <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                      <TableCell>{formatDateDMY(invoice.dueDate) || '-'}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsViewOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedInvoice(invoice);
                              setClientEmail('');
                              setIsEmailDialogOpen(true);
                            }}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send to Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              handleQuickDownload(invoice);
                            }}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              openInGenerator('invoice', invoice);
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit in Generator
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                                <Send className="h-4 w-4 mr-2" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsPaymentOpen(true);
                              }}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(invoice)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>Create a new invoice for your client</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsArray.map((client) => (
                        <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientsArray.length === 0 && (
                    <p className="text-xs text-muted-foreground">No clients yet. Add a client first.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <DocumentDateInput
                    value={formData.dueDate}
                    onChange={(value) => setFormData({ ...formData, dueDate: value })}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <Label>Items</Label>
                {formData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input value={formatCurrency(item.amount)} disabled />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Payment Method & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Textarea
                    placeholder="Enter payment details (e.g., Bank: ABC Bank, Account: 1234567890)"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount ($)</Label>
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>-{formatCurrency(formData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createInvoice.isPending}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createInvoice.isPending}>
                {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-full print:h-full print:m-0 print:p-0">
            <DialogHeader className="print:hidden pr-12">
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice {selectedInvoice?.invoiceNumber}</span>
                {selectedInvoice && getStatusBadge(selectedInvoice.status)}
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div>
                <InvoicePreview
                  data={mapInvoiceToPreviewData(selectedInvoice)}
                />
              </div>
            )}
            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
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
                      if (!selectedInvoice) return;
                      // Print via print dialog
                      printDocument('invoice-preview');
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print (choose orientation)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (!selectedInvoice) return;
                      downloadPDF('invoice-preview', `Invoice-${selectedInvoice.invoiceNumber}`);
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

        {/* Record Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record payment for invoice {selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">
                  {selectedInvoice && formatCurrency(selectedInvoice.total)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment}>Record Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Invoice Dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoice via Email</DialogTitle>
              <DialogDescription>
                Enter the client's email address to send invoice {selectedInvoice?.invoiceNumber}
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

            {/* Hidden invoice preview for PDF generation */}
            {selectedInvoice && (
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <InvoicePreview
                  previewId="invoice-preview-email"
                  data={mapInvoiceToPreviewData(selectedInvoice)}
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
                  if (selectedInvoice) {
                    sendEmail({
                      to: clientEmail,
                      subject: `Invoice ${selectedInvoice.invoiceNumber} from ${selectedInvoice.companyFooter?.name || 'Our Company'}`,
                      body: `Dear ${selectedInvoice.billTo.name},\n\nPlease find attached Invoice ${selectedInvoice.invoiceNumber}.\n\nAmount Due: ${formatCurrency(selectedInvoice.total, selectedInvoice.currency)}\nDue Date: ${formatDateDMY(selectedInvoice.dueDate) || '-'}\n\nThank you for your business.\n\nBest regards,\n${selectedInvoice.companyFooter?.name || 'Our Company'}`,
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

        {/* Hidden invoice preview for direct PDF download from table row */}
        {invoiceForDownload && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <InvoicePreview
              previewId="invoice-preview-download"
              data={mapInvoiceToPreviewData(invoiceForDownload)}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
