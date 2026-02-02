import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRecurringBilling, useClients, useInvoices, useReminders } from '@/hooks/useData';
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
import { Plus, RefreshCw, Trash2, Play, Pause, MoreHorizontal, Building2, Mail, Upload, X, Palette, Pencil, FileText, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { InvoiceItem, RecurringBilling } from '@/types/app';
import { LogoSizeControl } from '@/components/invoice/LogoSizeControl';
import { RecurringPreview } from '@/components/recurring/RecurringPreview';

export default function Recurring() {
  const { recurringBillings, addRecurring, updateRecurring, deleteRecurring, toggleActive } = useRecurringBilling();
  const { clients } = useClients();
  const { addInvoice } = useInvoices();
  const { addReminder } = useReminders();
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

  const formatCurrency = (amount: number, currency = 'KWD') => {
    return `KD ${amount.toFixed(3)}`;
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

  const calculateTotal = () => {
    return formData.grandTotal;
  };

  const handleCreate = () => {
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      toast({
        title: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const items: InvoiceItem[] = [{
      id: crypto.randomUUID(),
      description: formData.description,
      quantity: 1,
      rate: formData.grandTotal,
      amount: formData.grandTotal,
    }];

    const newRecurring = addRecurring({
      clientId: client.id,
      clientName: client.name,
      frequency: formData.frequency,
      nextBillingDate: formData.nextBillingDate,
      items: items,
      subtotal: formData.grandTotal,
      tax: 0,
      total: formData.grandTotal,
      currency: 'KWD',
      isActive: true,
      // Extended fields
      logo: formData.logo,
      showPaymentTerms: formData.showPaymentTerms,
      paymentTerms: formData.paymentTerms,
      companyFooter: formData.companyFooter,
      itemHeaderColor: formData.itemHeaderColor,
      paymentType: formData.paymentType,
      showBankDetails: formData.showBankDetails,
      bankDetails: formData.bankDetails,
    });

    // Create reminder for next billing if auto send is enabled
    if (formData.autoSendReminder) {
      addReminder({
        type: 'recurring_billing',
        title: `Recurring billing reminder for ${client.name}`,
        message: `${getFrequencyLabel(formData.frequency)} billing of ${formatCurrency(calculateTotal())} is due. Auto-send email reminder is enabled.`,
        relatedId: newRecurring.id,
        dueDate: formData.nextBillingDate,
      });
    }

    toast({
      title: 'Recurring billing created',
      description: `Recurring billing for ${client.name} has been set up.`,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const handleGenerateInvoice = (recurring: RecurringBilling) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    addInvoice({
      invoiceNumber,
      clientId: recurring.clientId,
      clientName: recurring.clientName,
      status: 'sent',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      items: recurring.items,
      subtotal: recurring.subtotal,
      tax: recurring.tax,
      discount: 0,
      total: recurring.total,
      currency: recurring.currency,
      recurringId: recurring.id,
      // Extended fields from recurring billing
      logo: recurring.logo,
      showPaymentTerms: recurring.showPaymentTerms,
      paymentTerms: recurring.paymentTerms,
      companyName: recurring.companyFooter?.companyName,
      companyAddress: recurring.companyFooter?.address,
      companyPhone: recurring.companyFooter?.officePhone,
      companyEmail: recurring.companyFooter?.websiteEmail,
      tableHeaderColor: recurring.itemHeaderColor,
      paymentMethod: recurring.paymentType,
      showPaymentMethod: !!recurring.paymentType,
      showBankAccount: recurring.showBankDetails,
      bankName: recurring.bankDetails?.bankName,
      bankAccountName: recurring.bankDetails?.accountName,
      bankIban: recurring.bankDetails?.iban,
      // Hide item details columns - only show Grand Total
      hideQuantity: true,
      hideUnitPrice: true,
      hideTotalCost: true,
      hideSubTotal: true,
      useManualGrandTotal: true,
      manualGrandTotal: recurring.total,
    });

    // Update next billing date
    const nextDate = getNextBillingDate(recurring.nextBillingDate, recurring.frequency);
    updateRecurring(recurring.id, {
      nextBillingDate: format(nextDate, 'yyyy-MM-dd'),
      lastGeneratedAt: new Date().toISOString(),
    });

    // Create reminder for next billing
    addReminder({
      type: 'recurring_billing',
      title: `Recurring billing for ${recurring.clientName}`,
      message: `${getFrequencyLabel(recurring.frequency)} billing of ${formatCurrency(recurring.total)} is due`,
      relatedId: recurring.id,
      dueDate: format(nextDate, 'yyyy-MM-dd'),
    });

    toast({
      title: 'Invoice generated',
      description: `Invoice ${invoiceNumber} has been created for ${recurring.clientName}.`,
    });
  };

  const handleDelete = (recurring: RecurringBilling) => {
    deleteRecurring(recurring.id);
    toast({
      title: 'Recurring billing deleted',
      description: 'The recurring billing has been removed.',
    });
  };

  const handleEdit = (recurring: RecurringBilling) => {
    setEditingRecurring(recurring);
    const client = clients.find(c => c.id === recurring.clientId);
    setFormData({
      clientId: recurring.clientId,
      clientEmail: client?.email || '',
      frequency: recurring.frequency,
      nextBillingDate: recurring.nextBillingDate,
      autoSendReminder: true,
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

  const handleUpdate = () => {
    if (!editingRecurring) return;
    
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      toast({
        title: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const items: InvoiceItem[] = [{
      id: crypto.randomUUID(),
      description: formData.description,
      quantity: 1,
      rate: formData.grandTotal,
      amount: formData.grandTotal,
    }];

    updateRecurring(editingRecurring.id, {
      clientId: client.id,
      clientName: client.name,
      frequency: formData.frequency,
      nextBillingDate: formData.nextBillingDate,
      items: items,
      subtotal: formData.grandTotal,
      tax: 0,
      total: formData.grandTotal,
      logo: formData.logo,
      showPaymentTerms: formData.showPaymentTerms,
      paymentTerms: formData.paymentTerms,
      companyFooter: formData.companyFooter,
      itemHeaderColor: formData.itemHeaderColor,
      paymentType: formData.paymentType,
      showBankDetails: formData.showBankDetails,
      bankDetails: formData.bankDetails,
    });

    toast({
      title: 'Recurring billing updated',
      description: `Recurring billing for ${client.name} has been updated.`,
    });

    setIsDialogOpen(false);
    setEditingRecurring(null);
    resetForm();
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData({ 
      ...formData, 
      clientId,
      clientEmail: selectedClient?.email || ''
    });
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
                  {recurringBillings.map((recurring) => (
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
                            <DropdownMenuItem onClick={() => toggleActive(recurring.id)}>
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
                  ))}
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
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
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
                        companyFooter: { ...formData.companyFooter, officePhone: e.target.value }
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
                        companyFooter: { ...formData.companyFooter, websiteEmail: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Items Section with Header Color */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Items</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Palette className="h-4 w-4" />
                      Header Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-md border border-border cursor-pointer"
                        style={{ backgroundColor: formData.itemHeaderColor }}
                      />
                      <Input
                        type="text"
                        placeholder="#6366f1"
                        value={formData.itemHeaderColor}
                        onChange={(e) => setFormData({ ...formData, itemHeaderColor: e.target.value })}
                        className="w-28 h-8 text-sm"
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
                    clientName: clients.find(c => c.id === formData.clientId)?.name || '',
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
      </div>
    </DashboardLayout>
  );
}
