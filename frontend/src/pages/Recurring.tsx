import { useState, type ChangeEvent } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRecurringAPI, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, useToggleRecurring, useGenerateInvoice } from '@/hooks/api/useRecurring';
import { useClients } from '@/hooks/api/useClients';
import { EmailService } from '@/api/services/email.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Trash2, Play, Pause, MoreHorizontal, Building2, Mail, Upload, X, Palette, Pencil, FileText, Eye, Loader2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { Invoice, InvoiceItem, RecurringBilling } from '@/types/app';
import { LogoSizeControl } from '@/components/invoice/LogoSizeControl';
import { RecurringPreview } from '@/components/recurring/RecurringPreview';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { InvoiceData } from '@/types/invoice';
import { buildBrandedEmailHtml, type EmailTemplateStyle } from '@/lib/branded-email-template';

export default function Recurring() {
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // API Hooks
  const { data: apiRecurring = [], isLoading: loadingRecurring } = useRecurringAPI(statusFilter !== 'all' ? statusFilter : undefined);
  const createRecurringMutation = useCreateRecurring();
  const updateRecurringMutation = useUpdateRecurring();
  const deleteRecurringMutation = useDeleteRecurring();
  const toggleRecurringMutation = useToggleRecurring();
  const generateInvoiceMutation = useGenerateInvoice();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { generatePdfBase64 } = useDocumentActions();
  
  // Ensure all data is arrays
  const apiRecurringArray = Array.isArray(apiRecurring) ? apiRecurring : [];
  const clientsArray = Array.isArray(clients) ? clients : [];
  
  // Map API data to local type
  const recurringBillings: RecurringBilling[] = apiRecurringArray.map((r: any) => ({
    id: r._id,
    clientId: (typeof r.clientId === 'object' && r.clientId) ? r.clientId._id : r.clientId,
    clientName: (typeof r.clientId === 'object' && r.clientId) ? r.clientId.name : 'Unknown Client',
    clientEmail: (typeof r.clientId === 'object' && r.clientId) ? r.clientId.email : '',
    frequency: r.frequency,
    nextBillingDate: r.nextBillingDate,
    items: r.items || [],
    subtotal: r.subtotal || 0,
    tax: r.tax || 0,
    total: r.total,
    currency: r.currency || 'KWD',
    isActive: r.isActive,
    autoSendReminder: r.autoSendReminder || false,
    createdAt: r.createdAt,
    lastGeneratedAt: r.lastGeneratedAt,
    logo: r.logo,
    logoScale: r.logoScale || 1,
    showPaymentTerms: r.showPaymentTerms || false,
    paymentTerms: r.paymentTerms || '',
    companyFooter: r.companyFooter,
    itemHeaderColor: r.itemHeaderColor,
    paymentType: r.paymentType,
    showBankDetails: r.showBankDetails || false,
    bankDetails: r.bankDetails,
  }));

  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringBilling | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    clientEmail: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    nextBillingDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    autoSendReminder: true,
    paymentType: 'cash' as 'cash' | 'bank_transfer' | 'cheque' | 'online_payment',
    showBankDetails: false,
    bankDetails: {
      bankName: '',
      accountName: '',
      iban: '',
    },
    description: '',
    grandTotal: 0,
    // New fields
    logo: null as string | null,
    logoScale: 1.0,
    showPaymentTerms: false,
    paymentTerms: '',
    companyFooter: {
      companyName: '',
      officePhone: '',
      address: '',
      websiteEmail: '',
    },
    itemHeaderColor: '#6366f1',
  });
  
  const [dialogViewMode, setDialogViewMode] = useState<'edit' | 'preview'>('edit');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringBilling | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [generatedInvoiceForEmail, setGeneratedInvoiceForEmail] = useState<Invoice | null>(null);
  const [emailTemplateStyle, setEmailTemplateStyle] = useState<EmailTemplateStyle>('modern');
  const [emailAccentColor, setEmailAccentColor] = useState('#10b981');
  const [emailLogoUrl, setEmailLogoUrl] = useState('');
  const [isUploadingEmailLogo, setIsUploadingEmailLogo] = useState(false);

  const formatCurrency = (amount: number, currency = 'KWD') => {
    return `KD ${amount.toFixed(3)}`;
  };

  const getCompanyNameForEmail = (recurring?: RecurringBilling | null, invoice?: Invoice | null) =>
    (invoice as any)?.companyFooter?.name ||
    (invoice as any)?.companyFooter?.companyName ||
    recurring?.companyFooter?.companyName ||
    'VAYPR';

  const getDefaultSubscriptionSubject = (recurring: RecurringBilling) => {
    const companyName = getCompanyNameForEmail(recurring);
    return `Subscription Invoice from ${companyName}`;
  };

  const getDefaultSubscriptionMessage = (recurring: RecurringBilling) => {
    const companyName = getCompanyNameForEmail(recurring);
    return `Hi ${recurring.clientName},

This is your ${getFrequencyLabel(recurring.frequency).toLowerCase()} subscription invoice.
Please find your invoice PDF attached with this email.

If you have any questions, just reply to this message.

Best regards,
${companyName}`;
  };

  const mapInvoiceToPreviewData = (invoice: Invoice): InvoiceData => {
    const footer = (invoice as any)?.companyFooter || {};
    const bank = (invoice as any)?.bankAccount || {};
    const paymentMethod = ((invoice as any)?.paymentMethodType || 'cash') as InvoiceData['paymentMethodType'];

    return {
      logo: (invoice as any)?.logo || null,
      logoScale: (invoice as any)?.logoScale || 1,
      currency: (invoice as any)?.currency || 'KWD',
      currencySymbol: (invoice as any)?.currencySymbol || (invoice as any)?.currency || 'KWD',
      billTo: {
        name: invoice.billTo?.name || '',
        phone: invoice.billTo?.phone || '',
        area: invoice.billTo?.area || '',
        block: invoice.billTo?.block || '',
        street: invoice.billTo?.street || '',
        house: invoice.billTo?.house || '',
        other: invoice.billTo?.other || '',
      },
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issueDate,
      paymentDate: invoice.dueDate,
      items: (invoice.items || []).map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        description: item.description || '',
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      })),
      discount: Number((invoice as any)?.discount) || 0,
      deliveryFee: Number((invoice as any)?.deliveryFee) || 0,
      companyFooter: {
        companyName: footer.companyName || footer.name || '',
        officePhone: footer.officePhone || footer.phone || '',
        address: footer.address || '',
        websiteEmail: footer.websiteEmail || footer.email || '',
      },
      paymentDetails: (invoice as any)?.paymentMethodType || '',
      showPaymentMethod: Boolean((invoice as any)?.showPaymentMethod),
      paymentMethodType: paymentMethod,
      showBankAccount: Boolean((invoice as any)?.showBankAccount),
      bankAccount: {
        bankName: bank.bankName || '',
        accountName: bank.accountName || '',
        iban: bank.iban || '',
      },
      showPaymentTerms: Boolean((invoice as any)?.showPaymentTerms),
      paymentTerms: (invoice as any)?.paymentTerms || '',
      hideQuantity: Boolean((invoice as any)?.hideQuantity),
      hideUnitPrice: Boolean((invoice as any)?.hideUnitPrice),
      hideTotalCost: Boolean((invoice as any)?.hideTotalCost),
      hideSubTotal: Boolean((invoice as any)?.hideSubTotal),
      useManualGrandTotal: Boolean((invoice as any)?.useManualGrandTotal),
      manualGrandTotal: Number((invoice as any)?.manualGrandTotal) || 0,
      tableHeaderColor: (invoice as any)?.tableHeaderColor || '#000000',
    };
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  const getNextBillingDate = (currentDate: string, frequency: string) => {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'weekly': return addWeeks(date, 1);
      case 'monthly': return addMonths(date, 1);
      case 'quarterly': return addMonths(date, 3);
      case 'yearly': return addYears(date, 1);
      default: return addMonths(date, 1);
    }
  };

  const formatDateForInput = (date: string): string => {
    if (!date) return format(addMonths(new Date(), 1), 'yyyy-MM-dd');
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return format(addMonths(new Date(), 1), 'yyyy-MM-dd');
    return format(parsed, 'yyyy-MM-dd');
  };

  const toISODateString = (date: string): string | null => {
    if (!date || !date.trim()) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parsed = new Date(`${date}T00:00:00.000Z`);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  };

  const filterEmailWebsiteInput = (value: string): string => {
    // Allow alphanumeric, dots, hyphens, underscores, @, /, :, and ?
    return value.replace(/[^a-zA-Z0-9._\-@/:?&=]/g, '');
  };

  const isValidEmailOrWebsite = (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const emailRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value) || websiteRegex.test(value);
  };

  const calculateTotal = () => {
    return formData.grandTotal;
  };

  const handleCreate = async () => {
    const client = clientsArray.find(c => c._id === formData.clientId);
    if (!client) {
      toast({
        title: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const normalizedNextBillingDate = toISODateString(formData.nextBillingDate);
    if (!normalizedNextBillingDate) {
      toast({
        title: 'Invalid date',
        description: 'Please choose a valid first billing date.',
        variant: 'destructive',
      });
      return;
    }

    const items = [{
      description: formData.description,
      quantity: 1,
      rate: formData.grandTotal,
      amount: formData.grandTotal,
    }];

    const recurringData = {
      clientId: formData.clientId,
      frequency: formData.frequency,
      nextBillingDate: normalizedNextBillingDate,
      items: items,
      subtotal: formData.grandTotal,
      tax: 0,
      total: formData.grandTotal,
      currency: 'KWD',
      isActive: true,
      autoSendReminder: formData.autoSendReminder,
      logoScale: formData.logoScale,
      showPaymentTerms: formData.showPaymentTerms,
      paymentTerms: formData.paymentTerms,
      companyFooter: formData.companyFooter,
      itemHeaderColor: formData.itemHeaderColor,
      paymentType: formData.paymentType,
      showBankDetails: formData.showBankDetails,
      bankDetails: formData.bankDetails,
    };

    try {
      // Convert base64 logo to File if exists
      let logoFile: File | undefined = undefined;
      if (formData.logo && formData.logo.startsWith('data:')) {
        const response = await fetch(formData.logo);
        const blob = await response.blob();
        logoFile = new File([blob], 'logo.png', { type: blob.type });
      }

      await createRecurringMutation.mutateAsync({ data: recurringData, logo: logoFile });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create recurring:', error);
    }
  };

  const handleGenerateInvoice = async (recurring: RecurringBilling) => {
    try {
      await generateInvoiceMutation.mutateAsync(recurring.id);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
    }
  };

  const handleOpenEmailDialog = (recurring: RecurringBilling) => {
    const fallbackClientEmail = clientsArray.find((client: any) => client._id === recurring.clientId)?.email || '';
    setSelectedRecurring(recurring);
    setEmailTo(recurring.clientEmail || fallbackClientEmail);
    setEmailSubject(getDefaultSubscriptionSubject(recurring));
    setEmailMessage(getDefaultSubscriptionMessage(recurring));
    setEmailAccentColor(recurring.itemHeaderColor || '#10b981');
    setEmailLogoUrl((recurring.logo || '').trim());
    setEmailTemplateStyle('modern');
    setIsEmailDialogOpen(true);
  };

  const handleSendRecurringEmail = async () => {
    if (!selectedRecurring) return;
    if (!emailTo.trim()) {
      toast({
        title: 'Missing Email',
        description: 'Please enter the client email address.',
        variant: 'destructive',
      });
      return;
    }
    if (!emailMessage.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please add a message before sending.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const createdInvoice = await generateInvoiceMutation.mutateAsync(selectedRecurring.id);
      setGeneratedInvoiceForEmail(createdInvoice as Invoice);

      await new Promise((resolve) => setTimeout(resolve, 150));
      const pdfBase64 = await generatePdfBase64('recurring-invoice-preview-email');
      const companyName = getCompanyNameForEmail(selectedRecurring, createdInvoice as Invoice);

      const emailBody = buildBrandedEmailHtml({
        emailTitle: `${getFrequencyLabel(selectedRecurring.frequency)} Subscription Invoice`,
        companyName,
        message: emailMessage,
        accentColor: emailAccentColor,
        templateStyle: emailTemplateStyle,
        logoUrl: emailLogoUrl || undefined,
        attachmentNote: 'Your PDF invoice is attached below in this email.',
      });

      await EmailService.sendEmail({
        to: emailTo.trim(),
        subject: emailSubject.trim() || getDefaultSubscriptionSubject(selectedRecurring),
        body: emailBody,
        attachmentData: pdfBase64,
        attachmentFilename: `Invoice_${(createdInvoice as any)?.invoiceNumber || 'subscription'}.pdf`,
      });

      toast({
        title: 'Email Sent Successfully!',
        description: 'Recurring invoice was generated and sent with PDF attachment.',
      });

      setIsEmailDialogOpen(false);
      setSelectedRecurring(null);
      setEmailTo('');
      setEmailSubject('');
      setEmailMessage('');
    } catch (error: any) {
      toast({
        title: 'Failed to Send Email',
        description: error?.message || 'Could not generate and send email.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
      setGeneratedInvoiceForEmail(null);
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

  const handleDelete = async (recurring: RecurringBilling) => {
    try {
      await deleteRecurringMutation.mutateAsync(recurring.id);
    } catch (error) {
      console.error('Failed to delete recurring:', error);
    }
  };

  const handleEdit = (recurring: RecurringBilling) => {
    handleEditRecurring(recurring);
  };

  const handleToggle = async (recurring: RecurringBilling) => {
    try {
      await toggleRecurringMutation.mutateAsync(recurring.id);
    } catch (error) {
      console.error('Failed to toggle recurring:', error);
    }
  };

  const handleEditRecurring = (recurring: RecurringBilling) => {
    setEditingRecurring(recurring);
    const client = clientsArray.find(c => c._id === recurring.clientId);
    setFormData({
      clientId: recurring.clientId,
      clientEmail: client?.email || '',
      frequency: recurring.frequency,
      nextBillingDate: formatDateForInput(recurring.nextBillingDate),
      autoSendReminder: recurring.autoSendReminder || false,
      paymentType: recurring.paymentType || 'cash',
      showBankDetails: recurring.showBankDetails || false,
      bankDetails: recurring.bankDetails || {
        bankName: '',
        accountName: '',
        iban: '',
      },
      description: recurring.items?.[0]?.description || '',
      grandTotal: recurring.total,
      logo: recurring.logo || null,
      logoScale: recurring.logoScale || 1.0,
      showPaymentTerms: recurring.showPaymentTerms || false,
      paymentTerms: recurring.paymentTerms || '',
      companyFooter: recurring.companyFooter || {
        companyName: '',
        officePhone: '',
        address: '',
        websiteEmail: '',
      },
      itemHeaderColor: recurring.itemHeaderColor || '#6366f1',
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingRecurring) return;
    
    const client = clientsArray.find(c => c._id === formData.clientId);
    if (!client) {
      toast({
        title: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const normalizedNextBillingDate = toISODateString(formData.nextBillingDate);
    if (!normalizedNextBillingDate) {
      toast({
        title: 'Invalid date',
        description: 'Please choose a valid first billing date.',
        variant: 'destructive',
      });
      return;
    }

    const items = [{
      description: formData.description,
      quantity: 1,
      rate: formData.grandTotal,
      amount: formData.grandTotal,
    }];

    const recurringData = {
      clientId: formData.clientId,
      frequency: formData.frequency,
      nextBillingDate: normalizedNextBillingDate,
      items: items,
      subtotal: formData.grandTotal,
      tax: 0,
      total: formData.grandTotal,
      currency: 'KWD',
      isActive: true,
      autoSendReminder: formData.autoSendReminder,
      logoScale: formData.logoScale,
      showPaymentTerms: formData.showPaymentTerms,
      paymentTerms: formData.paymentTerms,
      companyFooter: formData.companyFooter,
      itemHeaderColor: formData.itemHeaderColor,
      paymentType: formData.paymentType,
      showBankDetails: formData.showBankDetails,
      bankDetails: formData.bankDetails,
    }

    try {
      // Convert base64 logo to File if exists and changed
      let logoFile: File | undefined = undefined;
      if (formData.logo && formData.logo.startsWith('data:')) {
        const response = await fetch(formData.logo);
        const blob = await response.blob();
        logoFile = new File([blob], 'logo.png', { type: blob.type });
      }

      await updateRecurringMutation.mutateAsync({ 
        id: editingRecurring.id, 
        data: recurringData, 
        logo: logoFile 
      });
      
      setIsDialogOpen(false);
      setEditingRecurring(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update recurring:', error);
    }
  };

  const handleClientChange = (clientId: string) => {
    const selectedClient = clientsArray.find(c => c._id === clientId);
    setFormData({ 
      ...formData, 
      clientId,
      clientEmail: selectedClient?.email || ''
    });
  };

  const handleSave = () => {
    if (editingRecurring) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingRecurring(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      clientEmail: '',
      frequency: 'monthly',
      nextBillingDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      autoSendReminder: true,
      paymentType: 'cash',
      showBankDetails: false,
      bankDetails: {
        bankName: '',
        accountName: '',
        iban: '',
      },
      description: '',
      grandTotal: 0,
      logo: null,
      logoScale: 1.0,
      showPaymentTerms: false,
      paymentTerms: '',
      companyFooter: {
        companyName: '',
        officePhone: '',
        address: '',
        websiteEmail: '',
      },
      itemHeaderColor: '#6366f1',
    });
    setDialogViewMode('edit');
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const activeCount = recurringBillings.filter(r => r.isActive).length;
  const totalMonthlyRevenue = recurringBillings
    .filter(r => r.isActive)
    .reduce((sum, r) => {
      const multiplier = { weekly: 4, monthly: 1, quarterly: 1/3, yearly: 1/12 }[r.frequency] || 1;
      return sum + (r.total * multiplier);
    }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Recurring Billing</h1>
            <p className="text-muted-foreground">Manage subscription and recurring invoices</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Recurring
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalMonthlyRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recurring Table */}
        <Card>
          <CardContent className="p-0">
            {recurringBillings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No recurring billings</p>
                <p className="text-sm">Set up recurring invoices for your clients</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRecurring ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : recurringBillings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No recurring billings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recurringBillings.map((recurring) => (
                    <TableRow key={recurring.id}>
                      <TableCell className="font-medium">{recurring.clientName}</TableCell>
                      <TableCell>{formatCurrency(recurring.total, recurring.currency)}</TableCell>
                      <TableCell>{getFrequencyLabel(recurring.frequency)}</TableCell>
                      <TableCell>{format(new Date(recurring.nextBillingDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={recurring.isActive ? 'default' : 'secondary'}>
                          {recurring.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(recurring)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateInvoice(recurring)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEmailDialog(recurring)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(recurring)}>
                              {recurring.isActive ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(recurring)}
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
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecurring ? 'Edit Recurring Billing' : 'Create Recurring Billing'}</DialogTitle>
              <DialogDescription>
                {editingRecurring 
                  ? 'Update the recurring billing details for your client' 
                  : 'Set up automatic recurring invoices for your client'}
              </DialogDescription>
            </DialogHeader>
            
            {/* Edit/Preview Tabs */}
            <Tabs value={dialogViewMode} onValueChange={(v) => setDialogViewMode(v as 'edit' | 'preview')} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="mt-6">
                <div className="space-y-6">
                  {/* Company Logo Section */}
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <h3 className="text-lg font-semibold text-foreground">Company Logo</h3>
                    <p className="text-xs text-muted-foreground">Recommended size: 200 × 80 pixels (PNG or JPG)</p>
                    
                    {formData.logo ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24 rounded-lg border border-border bg-secondary/50 overflow-hidden">
                            <img 
                              src={formData.logo} 
                              alt="Company logo" 
                              className="w-full h-full object-contain p-2"
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData({ ...formData, logo: null })}
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                        <LogoSizeControl 
                          value={formData.logoScale} 
                          onChange={(value) => setFormData({ ...formData, logoScale: value })} 
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </div>
                    )}
              </div>

              {/* Client & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={formData.clientId} onValueChange={handleClientChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsArray.map((client) => (
                        <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(v: any) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Client Email & Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Client Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="client@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Used for auto-send email reminders</p>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={formData.paymentType} onValueChange={(v: 'cash' | 'bank_transfer' | 'cheque' | 'online_payment') => setFormData({ ...formData, paymentType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online_payment">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>First Billing Date</Label>
                <Input
                  type="date"
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                />
              </div>

              {/* Bank Transfer Details */}
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Bank Transfer Details</Label>
                      <p className="text-xs text-muted-foreground">Include bank account info on generated invoices</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.showBankDetails}
                    onCheckedChange={(checked) => setFormData({ ...formData, showBankDetails: checked })}
                  />
                </div>
                {formData.showBankDetails && (
                  <div className="p-4 space-y-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          placeholder="e.g., Chase Bank"
                          value={formData.bankDetails.bankName}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input
                          placeholder="e.g., Your Company LLC"
                          value={formData.bankDetails.accountName}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            bankDetails: { ...formData.bankDetails, accountName: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>IBAN / Account Number</Label>
                      <Input
                        placeholder="e.g., GB82 WEST 1234 5698 7654 32"
                        value={formData.bankDetails.iban}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          bankDetails: { ...formData.bankDetails, iban: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Terms Section */}
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/30">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Payment Terms</h3>
                    <p className="text-sm text-muted-foreground">Add terms and conditions for payment</p>
                  </div>
                  <Switch
                    checked={formData.showPaymentTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, showPaymentTerms: checked })}
                  />
                </div>
                {formData.showPaymentTerms && (
                  <div className="p-4 space-y-2 border-t">
                    <Label htmlFor="paymentTerms">Terms & Conditions</Label>
                    <Textarea
                      id="paymentTerms"
                      placeholder="e.g., Payment is due within 30 days of invoice date. Late payments may incur a 2% monthly fee..."
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Company Footer Details */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <h3 className="text-lg font-semibold text-foreground">Company Footer Details</h3>
                <p className="text-sm text-muted-foreground">
                  Add your company details to display in the footer (e.g., "Company Name, Address - Office: Phone - Website")
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Your company name"
                      value={formData.companyFooter.companyName}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        companyFooter: { ...formData.companyFooter, companyName: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officePhone">Office Phone</Label>
                    <Input
                      id="officePhone"
                      placeholder="Office phone number"
                      value={formData.companyFooter.officePhone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        companyFooter: { ...formData.companyFooter, officePhone: filterPhoneInput(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Address</Label>
                    <Input
                      id="companyAddress"
                      placeholder="Company address"
                      value={formData.companyFooter.address}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        companyFooter: { ...formData.companyFooter, address: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="websiteEmail">Website/Email</Label>
                    <Input
                      id="websiteEmail"
                      placeholder="Website or email"
                      value={formData.companyFooter.websiteEmail}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        companyFooter: { ...formData.companyFooter, websiteEmail: filterEmailWebsiteInput(e.target.value) }
                      })}
                      className={!isValidEmailOrWebsite(formData.companyFooter.websiteEmail) && formData.companyFooter.websiteEmail ? 'border-red-500' : ''}
                    />
                    {!isValidEmailOrWebsite(formData.companyFooter.websiteEmail) && formData.companyFooter.websiteEmail && (
                      <p className="text-xs text-red-500">Please enter a valid email or website</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Section with Header Color */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Items</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Palette className="h-4 w-4" />
                      Header Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.itemHeaderColor}
                        onChange={(e) => setFormData({ ...formData, itemHeaderColor: e.target.value })}
                        className="w-12 h-12 rounded-md border border-border cursor-pointer"
                        title="Pick a header color"
                      />
                      <Input
                        type="text"
                        placeholder="#6366f1"
                        value={formData.itemHeaderColor}
                        onChange={(e) => setFormData({ ...formData, itemHeaderColor: e.target.value })}
                        className="w-32 h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <Textarea
                      placeholder="Enter billing description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Grand Total</Label>
                    <Input
                      type="number"
                      placeholder="0.000"
                      value={formData.grandTotal || ''}
                      onChange={(e) => setFormData({ ...formData, grandTotal: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Auto Send Email Reminder
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.clientEmail 
                      ? `Send ${getFrequencyLabel(formData.frequency).toLowerCase()} reminder to ${formData.clientEmail}`
                      : 'Add client email above to enable auto-send'}
                  </p>
                </div>
                <Switch
                  checked={formData.autoSendReminder}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoSendReminder: checked })}
                  disabled={!formData.clientEmail}
                />
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total per billing</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-6">
                <RecurringPreview 
                  data={{
                    logo: formData.logo,
                    logoScale: formData.logoScale,
                    clientName: clientsArray.find(c => c._id === formData.clientId)?.name || '',
                    frequency: formData.frequency,
                    nextBillingDate: formData.nextBillingDate,
                    description: formData.description,
                    grandTotal: formData.grandTotal,
                    paymentType: formData.paymentType,
                    showBankDetails: formData.showBankDetails,
                    bankDetails: formData.bankDetails,
                    showPaymentTerms: formData.showPaymentTerms,
                    paymentTerms: formData.paymentTerms,
                    companyFooter: formData.companyFooter,
                    itemHeaderColor: formData.itemHeaderColor,
                  }}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                {editingRecurring ? 'Update Recurring' : 'Create Recurring'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
          setIsEmailDialogOpen(open);
          if (!open) {
            setSelectedRecurring(null);
            setEmailTo('');
            setEmailSubject('');
            setEmailMessage('');
            setGeneratedInvoiceForEmail(null);
            setEmailTemplateStyle('modern');
            setEmailAccentColor('#10b981');
            setEmailLogoUrl('');
          }
        }}>
          <DialogContent className="w-[95vw] max-w-lg p-6 overflow-hidden">
            <DialogHeader>
              <DialogTitle>Send Recurring Invoice via Email</DialogTitle>
              <DialogDescription>
                Generate and send a subscription invoice with PDF attachment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="recurringEmailTo">Client Email</Label>
              <Input
                id="recurringEmailTo"
                type="email"
                placeholder="client@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurringEmailSubject">Subject</Label>
              <Input
                id="recurringEmailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subscription invoice subject"
                className="h-12"
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

            <div className="space-y-2">
              <Label htmlFor="recurringEmailMessage">Message *</Label>
              <Textarea
                id="recurringEmailMessage"
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Write your message here..."
                className="resize-y text-sm min-h-[220px]"
              />
              <p className="text-xs text-muted-foreground">PDF invoice will be attached automatically.</p>
            </div>

            {generatedInvoiceForEmail && (
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <InvoicePreview
                  previewId="recurring-invoice-preview-email"
                  data={mapInvoiceToPreviewData(generatedInvoiceForEmail)}
                />
              </div>
            )}

            <DialogFooter className="flex-col gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEmailDialogOpen(false)}
                className="w-full"
                disabled={isSendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendRecurringEmail}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                disabled={isSendingEmail || !emailTo.trim() || !emailMessage.trim()}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Generate & Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
